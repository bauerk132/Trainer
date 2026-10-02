import React, { useState, useEffect } from 'react';
import { TrainingConfig } from '../types/notebook';
import { calculateVramUsage, GPU_SPECS } from '../utils/vramCalculator';
import { Cpu, HardDrive, Zap, CheckCircle2, AlertTriangle, Layers, Gauge } from 'lucide-react';

interface GpuRamMonitorProps {
  config: TrainingConfig;
  onUpdateConfig?: (newConfig: TrainingConfig) => void;
  isTrainingActive?: boolean;
  currentStep?: number;
}

export const GpuRamMonitor: React.FC<GpuRamMonitorProps> = ({
  config,
  onUpdateConfig,
  isTrainingActive = false,
  currentStep = 0,
}) => {
  const vram = calculateVramUsage(config);

  // Micro-fluctuation simulation during active training steps
  const [dynamicOffset, setDynamicOffset] = useState(0);

  useEffect(() => {
    if (isTrainingActive) {
      // Simulate forward/backward activation fluctuation (+/- 0.25 GB)
      const interval = setInterval(() => {
        const jitter = (Math.sin(Date.now() / 600) * 0.28) + (Math.random() * 0.1);
        setDynamicOffset(Number(jitter.toFixed(2)));
      }, 350);
      return () => clearInterval(interval);
    } else {
      setDynamicOffset(0);
    }
  }, [isTrainingActive]);

  const activeVramGb = Number(
    Math.min(
      vram.gpuCapacityGb + 4,
      Math.max(0.5, vram.totalEstimatedGb + (isTrainingActive ? dynamicOffset : 0))
    ).toFixed(2)
  );

  const activeVramPct = Math.min(
    100,
    Math.round((activeVramGb / vram.gpuCapacityGb) * 100)
  );

  const activeSystemRamGb = Number(
    Math.min(
      vram.systemRamCapacityGb,
      Math.max(1.0, vram.systemRamGb + (isTrainingActive ? 0.35 : 0))
    ).toFixed(2)
  );

  const activeSystemRamPct = Math.min(
    100,
    Math.round((activeSystemRamGb / vram.systemRamCapacityGb) * 100)
  );

  // Simulated hardware telemetry
  const gpuUtilization = isTrainingActive ? 92 + Math.floor(Math.random() * 6) : 4;
  const powerWatts = isTrainingActive ? (config.gpu === 't4' ? 64 : 185) : 18;
  const maxPowerWatts = config.gpu === 't4' ? 70 : 300;
  const tempCelsius = isTrainingActive ? 67 : 39;

  const handleModelChange = (modelId: string, modelName: string) => {
    if (onUpdateConfig) {
      onUpdateConfig({
        ...config,
        modelId,
        modelName,
      });
    }
  };

  const handleQuantChange = (quant: TrainingConfig['quantization']) => {
    if (onUpdateConfig) {
      onUpdateConfig({
        ...config,
        quantization: quant,
      });
    }
  };

  return (
    <div className="rounded-xl p-5 bg-[#0C1220] border border-slate-800 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-['Cabinet_Grotesk'] tracking-tight">
              Real-Time GPU VRAM & System RAM Monitor
            </h3>
            <p className="text-xs text-slate-400">
              Live estimation scaling dynamically with model parameters, quantization precision, and batch context
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded flex items-center gap-1.5 border font-mono ${
              vram.fitsOnGpu
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {vram.fitsOnGpu ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>VRAM Fit: Safe (+{vram.headroomGb.toFixed(1)} GB Free)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Out of Memory: Exceeds by {Math.abs(vram.headroomGb).toFixed(1)} GB</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Model & Quantization Interactive Selectors */}
      <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Model Size Switcher */}
        <div>
          <label className="text-slate-400 block mb-1.5 font-semibold text-[11px] uppercase tracking-wider">
            Gemma Model Size ({vram.paramsBillion}B parameters):
          </label>
          <div className="grid grid-cols-3 gap-1.5 font-mono">
            {[
              { id: 'google/gemma-2-2b', name: 'Gemma 2 2B', label: '2B (~2.6B)' },
              { id: 'google/gemma-2-9b', name: 'Gemma 2 9B', label: '9B (~9.2B)' },
              { id: 'google/gemma-7b', name: 'Gemma 7B', label: '7B (~8.5B)' },
            ].map((m) => {
              const isSelected = config.modelId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleModelChange(m.id, m.name)}
                  className={`py-1.5 px-2 rounded text-center text-xs transition-colors border ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 font-bold border-amber-400 shadow-sm'
                      : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantization Switcher */}
        <div>
          <label className="text-slate-400 block mb-1.5 font-semibold text-[11px] uppercase tracking-wider">
            Quantization Level ({vram.quantizationBytesPerParam} bytes/param):
          </label>
          <div className="grid grid-cols-4 gap-1.5 font-mono">
            {[
              { id: '4bit_nf4', label: '4-bit NF4' },
              { id: '4bit_fp4', label: '4-bit FP4' },
              { id: '8bit', label: '8-bit Int8' },
              { id: '16bit_bf16', label: '16-bit' },
            ].map((q) => {
              const isSelected = config.quantization === q.id;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleQuantChange(q.id as TrainingConfig['quantization'])}
                  className={`py-1.5 px-1 rounded text-center text-[11px] transition-colors border ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 font-bold border-amber-400 shadow-sm'
                      : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {q.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dual Real-Time Meters: GPU VRAM & Host System RAM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Meter 1: GPU VRAM */}
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs font-bold text-slate-200">
                  GPU VRAM Usage ({GPU_SPECS[config.gpu]?.name ?? 'NVIDIA Tesla T4'})
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Target device: {GPU_SPECS[config.gpu]?.colabTier}
                </span>
              </div>
            </div>

            <div className="text-right font-mono">
              <span
                className={`text-sm font-bold tabular-nums ${
                  vram.fitsOnGpu ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {activeVramGb} / {vram.gpuCapacityGb.toFixed(1)} GB
              </span>
              <span className="text-[10px] text-slate-400 block tabular-nums">
                {activeVramPct}% allocated
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800 relative">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                activeVramPct > 95
                  ? 'bg-rose-500'
                  : activeVramPct > 75
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, activeVramPct)}%` }}
            />
          </div>

          {/* Stacked Breakdown */}
          <div className="flex flex-col gap-1.5 pt-1 text-xs">
            <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
              <span>VRAM Layer Breakdown</span>
              <span className="font-mono text-[10px] text-slate-500">
                {isTrainingActive ? 'Dynamic Active State' : 'Pre-flight Calculation'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono">
              <div className="flex justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Base Model Weights:</span>
                </span>
                <span className="text-slate-200 tabular-nums">{vram.baseModelGb} GB</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>LoRA Adapters (r={config.loraRank}):</span>
                </span>
                <span className="text-slate-200 tabular-nums">{vram.loraGb} GB</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>8-bit Optimizer State:</span>
                </span>
                <span className="text-slate-200 tabular-nums">{vram.optimizerGb} GB</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Forward Activations:</span>
                </span>
                <span className="text-slate-200 tabular-nums">
                  {(vram.activationsGb + (isTrainingActive ? dynamicOffset : 0)).toFixed(2)} GB
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>CUDA Context Overhead:</span>
                </span>
                <span className="text-slate-200 tabular-nums">{vram.cudaOverheadGb} GB</span>
              </div>

              <div className="flex justify-between text-slate-400 font-semibold">
                <span className="text-slate-300">Remaining Headroom:</span>
                <span
                  className={`tabular-nums ${
                    vram.fitsOnGpu ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {vram.headroomGb > 0 ? `+${vram.headroomGb} GB` : `${vram.headroomGb} GB`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Meter 2: Host System RAM (Colab CPU RAM) */}
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-xs font-bold text-slate-200">
                  Colab Host System RAM
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Dataset cache & DataLoader worker pool
                </span>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-sm font-bold text-cyan-400 tabular-nums">
                {activeSystemRamGb} / {vram.systemRamCapacityGb.toFixed(1)} GB
              </span>
              <span className="text-[10px] text-slate-400 block tabular-nums">
                {activeSystemRamPct}% utilized
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800 relative">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                activeSystemRamPct > 90
                  ? 'bg-rose-500'
                  : activeSystemRamPct > 70
                  ? 'bg-amber-400'
                  : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, activeSystemRamPct)}%` }}
            />
          </div>

          {/* Host RAM details */}
          <div className="flex flex-col gap-1.5 pt-1 text-xs">
            <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
              <span>System Memory Allocation</span>
              <span className="font-mono text-[10px] text-slate-500">
                PyTorch Worker Threads
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono">
              <div className="flex justify-between text-slate-400">
                <span>PyTorch / CUDA Binaries:</span>
                <span className="text-slate-200 tabular-nums">2.10 GB</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>OpenHermes Arrow Cache:</span>
                <span className="text-slate-200 tabular-nums">
                  {((config.sampleCount / 10000) * 0.75).toFixed(2)} GB
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>DataLoader Batch Queues:</span>
                <span className="text-slate-200 tabular-nums">1.40 GB</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Active Process Headroom:</span>
                <span className="text-emerald-400 tabular-nums">
                  +{(vram.systemRamCapacityGb - activeSystemRamGb).toFixed(2)} GB
                </span>
              </div>
            </div>
          </div>

          {/* Live Telemetry Chips */}
          <div className="grid grid-cols-3 gap-2 mt-auto pt-2 border-t border-slate-800/80 text-center font-mono text-[10px]">
            <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800">
              <div className="text-slate-500">GPU Util</div>
              <div className="text-amber-400 font-bold tabular-nums">{gpuUtilization}%</div>
            </div>
            <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800">
              <div className="text-slate-500">Power Draw</div>
              <div className="text-slate-300 font-bold tabular-nums">{powerWatts}W / {maxPowerWatts}W</div>
            </div>
            <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800">
              <div className="text-slate-500">Core Temp</div>
              <div className="text-slate-300 font-bold tabular-nums">{tempCelsius}°C</div>
            </div>
          </div>
        </div>
      </div>

      {/* T4 Free Tier Recommendation Note */}
      <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800 flex items-start gap-2.5 text-xs">
        <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-slate-400 leading-relaxed text-[11px]">
          <strong className="text-slate-200">Hardware Compatibility Tip:</strong>{' '}
          {config.modelId.includes('2b') && config.quantization.startsWith('4bit') && (
            <span>
              <strong>Gemma 2B with 4-bit NF4</strong> consumes only <strong>~{vram.totalEstimatedGb} GB VRAM</strong>, operating safely within the <strong>15.0 GB limit of Google Colab&apos;s Free Tier Tesla T4</strong> with over <strong>{vram.headroomGb} GB</strong> of safety headroom.
            </span>
          )}
          {config.modelId.includes('9b') && config.quantization.startsWith('4bit') && (
            <span>
              <strong>Gemma 9B with 4-bit NF4</strong> requires <strong>~{vram.totalEstimatedGb} GB VRAM</strong>. It fits tightly on T4 with batch size 1, but Colab Pro <strong>L4 (24GB) or A100 (40GB)</strong> is recommended to prevent activation spikes during longer sequence generation.
            </span>
          )}
          {!config.quantization.startsWith('4bit') && (
            <span className="text-amber-300">
              Notice: At {config.quantization}, total footprint reaches <strong>{vram.totalEstimatedGb} GB</strong>. For Google Colab Free Tier (15GB limit), <strong>4-bit NF4 quantization</strong> is strongly recommended.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
