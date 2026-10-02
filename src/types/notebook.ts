export type GpuType = 't4' | 'l4' | 'a100_40' | 'a100_80' | 'v100';

export interface TrainingConfig {
  modelId: string;
  modelName: string;
  framework: 'unsloth' | 'trl_peft';
  quantization: '4bit_nf4' | '4bit_fp4' | '8bit' | '16bit_bf16';
  gpu: GpuType;
  loraRank: number;
  loraAlpha: number;
  loraDropout: number;
  targetModules: string[];
  datasetName: string;
  sampleCount: number;
  maxSeqLength: number;
  batchSize: number;
  gradientAccumulation: number;
  learningRate: number;
  epochs: number;
  maxSteps: number;
  warmupRatio: number;
  weightDecay: number;
  lrScheduler: 'cosine' | 'linear' | 'constant';
  optim: 'paged_adamw_8bit' | 'adamw_8bit' | 'adamw_torch';
  outputDir: string;
  saveMerged16bit: boolean;
  exportGGUF: boolean;
  hubModelId: string;
}

export interface NotebookCell {
  id: string;
  cell_type: 'code' | 'markdown';
  title: string;
  description?: string;
  source: string[];
  execution_count: number | null;
  outputs?: NotebookOutput[];
}

export interface NotebookOutput {
  output_type: 'stream' | 'execute_result' | 'display_data' | 'error';
  text?: string[];
  data?: Record<string, string | string[]>;
}

export interface OpenHermesSample {
  id: string;
  category: string;
  conversations: {
    from: 'system' | 'human' | 'gpt';
    value: string;
  }[];
}
