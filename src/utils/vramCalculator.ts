import { GpuType, TrainingConfig } from '../types/notebook';

export interface VramBreakdown {
  paramsBillion: number;
  quantizationBytesPerParam: number;
  baseModelGb: number;
  loraGb: number;
  optimizerGb: number;
  activationsGb: number;
  cudaOverheadGb: number;
  totalEstimatedGb: number;
  gpuCapacityGb: number;
  fitsOnGpu: boolean;
  headroomGb: number;
  systemRamGb: number;
  systemRamCapacityGb: number;
  fitsSystemRam: boolean;
  pctGpuUsed: number;
  pctSystemRamUsed: number;
}

export const GPU_SPECS: Record<GpuType, { name: string; capacityGb: number; colabTier: string; hostRamGb: number }> = {
  t4: { name: 'NVIDIA Tesla T4', capacityGb: 15.0, colabTier: 'Colab Free Tier', hostRamGb: 12.7 },
  l4: { name: 'NVIDIA L4 Tensor Core', capacityGb: 22.5, colabTier: 'Colab Pro', hostRamGb: 25.0 },
  a100_40: { name: 'NVIDIA A100-SXM4', capacityGb: 40.0, colabTier: 'Colab Pro+', hostRamGb: 51.0 },
  a100_80: { name: 'NVIDIA A100-SXM4 (80GB)', capacityGb: 80.0, colabTier: 'Colab Pro+', hostRamGb: 83.5 },
  v100: { name: 'NVIDIA Tesla V100', capacityGb: 16.0, colabTier: 'Colab Pro', hostRamGb: 25.0 },
};

export function getBytesPerParam(quant: TrainingConfig['quantization']): number {
  switch (quant) {
    case '4bit_nf4':
      return 0.55; // 4-bit NF4 with nested double-quantization (0.50 + 0.05 overhead)
    case '4bit_fp4':
      return 0.60; // 4-bit standard floating point
    case '8bit':
      return 1.10; // 8-bit Int8 BitsAndBytes LLM.int8()
    case '16bit_bf16':
      return 2.15; // 16-bit Float16 / BFloat16 master weights
    default:
      return 0.55;
  }
}

export function getModelParamCount(modelId: string): number {
  if (modelId.includes('9b')) return 9.24;
  if (modelId.includes('7b')) return 8.54;
  if (modelId.includes('27b')) return 27.2;
  return 2.61; // default Gemma 2 2B
}

export function calculateVramUsage(config: TrainingConfig): VramBreakdown {
  const paramsBillion = getModelParamCount(config.modelId);
  const bytesPerParam = getBytesPerParam(config.quantization);

  // Base model footprint in VRAM
  const baseModelGb = paramsBillion * bytesPerParam;

  // LoRA trainable matrices footprint (FP32 master weights during backprop)
  const targetCount = config.targetModules.length;
  const loraParamsMillion = (config.loraRank * targetCount * 0.45);
  const loraGb = (loraParamsMillion * 4) / 1024;

  // Optimizer state memory
  // paged_adamw_8bit uses 2 bytes per trainable param, adamw_torch uses 8 bytes per trainable param
  const optimizerBytesPerParam = config.optim === 'adamw_torch' ? 8 : 2;
  const optimizerGb = (loraParamsMillion * optimizerBytesPerParam) / 1024;

  // Activation memory: scales with batch size, seq length, and gradient checkpointing
  const seqFactor = config.maxSeqLength / 2048;
  const batchFactor = config.batchSize;
  const frameworkFactor = config.framework === 'unsloth' ? 0.45 : 1.0;
  const activationsGb = (0.95 * batchFactor * seqFactor * frameworkFactor);

  // CUDA context & PyTorch runtime overhead
  const cudaOverheadGb = 0.85;

  const totalEstimatedGb = baseModelGb + loraGb + optimizerGb + activationsGb + cudaOverheadGb;
  const gpuSpec = GPU_SPECS[config.gpu] ?? GPU_SPECS.t4;
  const gpuCapacityGb = gpuSpec.capacityGb;
  const headroomGb = gpuCapacityGb - totalEstimatedGb;

  // Host System RAM estimation (Colab CPU RAM)
  const basePythonRam = 2.1;
  const datasetSampleFactor = (config.sampleCount / 10000) * 0.75;
  const dataLoaderRam = 1.4;
  const systemRamGb = Number((basePythonRam + datasetSampleFactor + dataLoaderRam).toFixed(2));
  const systemRamCapacityGb = gpuSpec.hostRamGb;

  const pctGpuUsed = Math.min(100, Math.round((totalEstimatedGb / gpuCapacityGb) * 100));
  const pctSystemRamUsed = Math.min(100, Math.round((systemRamGb / systemRamCapacityGb) * 100));

  return {
    paramsBillion,
    quantizationBytesPerParam: bytesPerParam,
    baseModelGb: Number(baseModelGb.toFixed(2)),
    loraGb: Number(loraGb.toFixed(2)),
    optimizerGb: Number(optimizerGb.toFixed(2)),
    activationsGb: Number(activationsGb.toFixed(2)),
    cudaOverheadGb,
    totalEstimatedGb: Number(totalEstimatedGb.toFixed(2)),
    gpuCapacityGb,
    fitsOnGpu: headroomGb >= 0,
    headroomGb: Number(headroomGb.toFixed(2)),
    systemRamGb,
    systemRamCapacityGb,
    fitsSystemRam: systemRamGb <= systemRamCapacityGb,
    pctGpuUsed,
    pctSystemRamUsed,
  };
}
