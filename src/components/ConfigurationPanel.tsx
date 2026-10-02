import React from 'react';
import { TrainingConfig, GpuType } from '../types/notebook';
import { calculateVramUsage, GPU_SPECS } from '../utils/vramCalculator';
import { Cpu, Sliders, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface ConfigurationPanelProps {
  config: TrainingConfig;
  onChange: (newConfig: TrainingConfig) => void;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ config, onChange }) => {
  const vram = calculateVramUsage(config);

  const handleUpdate = <K extends keyof TrainingConfig>(key: K, value: TrainingConfig[K]) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  const toggleTargetModule = (mod: string) => {
    const current = config.targetModules;
    const next = current.includes(mod)
      ? current.filter((m) => m !== mod)
      : [...current, mod];
    if (next.length > 0) {
      handleUpdate('targetModules', next);
    }
  };

  const allAvailableModules = [
    'q_proj',
    'k_proj',
    'v_proj',
    'o_proj',
    'gate_proj',
    'up_proj',
    'down_proj',
  ];

  return (
    <aside className="w-full lg:w-80 shrink-0 bg-[#0C1220] border-r border-slate-800/80 p-5 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-56px)]">
      {/* VRAM Telemetry Box */}
      <div className="rounded-lg p-4 bg-slate-900/90 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>Colab VRAM Budget</span>
          </div>
          <span
            className={`text-xs font-mono tabular-nums font-bold ${
              vram.fitsOnGpu ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {vram.totalEstimatedGb.toFixed(1)} / {vram.gpuCapacityGb.toFixed(0)} GB
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-3">
          <div
            className={`h-full transition-all duration-300 ${
              vram.totalEstimatedGb / vram.gpuCapacityGb > 0.9
                ? 'bg-rose-500'
                : vram.totalEstimatedGb / vram.gpuCapacityGb > 0.75
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{
              width: `${Math.min(100, (vram.totalEstimatedGb / vram.gpuCapacityGb) * 100)}%`,
            }}
          />
        </div>

        {/* Metric Breakdowns */}
        <div className="grid grid-cols-2 gap-y-1.5 text-[11px] text-slate-400 font-mono">
          <div>Base 4-bit: <span className="text-slate-200 tabular-nums">{vram.baseModelGb} GB</span></div>
          <div>LoRA Weights: <span className="text-slate-200 tabular-nums">{vram.loraGb} GB</span></div>
          <div>Optimizer (8-bit): <span className="text-slate-200 tabular-nums">{vram.optimizerGb} GB</span></div>
          <div>Activations: <span className="text-slate-200 tabular-nums">{vram.activationsGb} GB</span></div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Headroom</span>
          <span
            className={`font-mono tabular-nums font-semibold flex items-center gap-1 ${
              vram.fitsOnGpu ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {vram.fitsOnGpu ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>+{vram.headroomGb.toFixed(1)} GB Available</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>OOM: {vram.headroomGb.toFixed(1)} GB</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Target GPU Hardware */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Target Colab GPU Runtime
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {(Object.keys(GPU_SPECS) as GpuType[]).map((key) => {
            const spec = GPU_SPECS[key];
            const isSelected = config.gpu === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleUpdate('gpu', key)}
                className={`flex items-center justify-between px-3 py-2 text-left rounded-md border text-xs transition-colors ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/50 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-semibold">{spec.name}</div>
                  <div className="text-[10px] text-slate-500">{spec.colabTier}</div>
                </div>
                <span className="font-mono tabular-nums font-bold text-slate-300">
                  {spec.capacityGb} GB
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Target Gemma Model
        </label>
        <select
          value={config.modelId}
          onChange={(e) => {
            const val = e.target.value;
            let name = 'Gemma 2 2B (4-bit)';
            if (val.includes('9b')) name = 'Gemma 2 9B (4-bit)';
            if (val.includes('7b')) name = 'Gemma 7B (4-bit)';
            if (val.includes('unsloth')) name = 'Gemma 2 2B (Unsloth 4-bit)';
            handleUpdate('modelId', val);
            handleUpdate('modelName', name);
          }}
          className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
        >
          <option value="google/gemma-2-2b">google/gemma-2-2b (Official 4-bit NF4)</option>
          <option value="unsloth/gemma-2-2b-bnb-4bit">unsloth/gemma-2-2b-bnb-4bit (Pre-quantized)</option>
          <option value="google/gemma-2-9b">google/gemma-2-9b (High Capacity 9B)</option>
          <option value="google/gemma-7b">google/gemma-7b (Gemma v1 7B)</option>
        </select>
      </div>

      {/* Quantization Mode */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Quantization Precision
          </label>
          <span className="text-xs font-mono text-amber-400">
            {vram.quantizationBytesPerParam}B/param
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
          {[
            { id: '4bit_nf4', label: '4-bit NF4 (QLoRA)' },
            { id: '4bit_fp4', label: '4-bit FP4' },
            { id: '8bit', label: '8-bit Int8' },
            { id: '16bit_bf16', label: '16-bit BF16' },
          ].map((q) => {
            const isSelected = config.quantization === q.id;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => handleUpdate('quantization', q.id as TrainingConfig['quantization'])}
                className={`py-1.5 px-2 rounded text-center text-[11px] border transition-colors ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 font-bold border-amber-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {q.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Framework Engine */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Training Framework Engine
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleUpdate('framework', 'trl_peft')}
            className={`px-3 py-2 rounded-md border text-xs font-medium text-center transition-colors ${
              config.framework === 'trl_peft'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Hugging Face TRL
          </button>
          <button
            type="button"
            onClick={() => handleUpdate('framework', 'unsloth')}
            className={`px-3 py-2 rounded-md border text-xs font-medium text-center transition-colors ${
              config.framework === 'unsloth'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Unsloth Kernels
          </button>
        </div>
      </div>

      {/* LoRA Rank & Alpha */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            LoRA Rank ($r$) & Alpha ($\\alpha$)
          </label>
          <span className="text-xs font-mono text-amber-400 tabular-nums">
            r={config.loraRank} / α={config.loraAlpha}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {[8, 16, 32, 64].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                handleUpdate('loraRank', r);
                handleUpdate('loraAlpha', r);
              }}
              className={`py-1.5 text-xs font-mono rounded border text-center transition-colors ${
                config.loraRank === r
                  ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              r={r}
            </button>
          ))}
        </div>
      </div>

      {/* LoRA Target Modules */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Target Modules</span>
          </label>
          <span className="text-[11px] text-slate-400">
            {config.targetModules.length} selected
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          {allAvailableModules.map((mod) => {
            const isChecked = config.targetModules.includes(mod);
            return (
              <button
                key={mod}
                type="button"
                onClick={() => toggleTargetModule(mod)}
                className={`px-2 py-1 rounded text-left font-mono text-[11px] border transition-colors flex items-center justify-between ${
                  isChecked
                    ? 'bg-slate-800 border-amber-500/50 text-amber-300'
                    : 'bg-slate-900/50 border-slate-800/80 text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>{mod}</span>
                <span className="text-[10px]">{isChecked ? '✓' : ''}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SFT Training Loop Hyperparameters */}
      <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Training Loop Hyperparameters</span>
        </div>

        {/* Learning Rate */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Learning Rate</span>
            <span className="font-mono tabular-nums text-amber-400">{config.learningRate}</span>
          </div>
          <select
            value={config.learningRate}
            onChange={(e) => handleUpdate('learningRate', parseFloat(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
          >
            <option value={0.0005}>5e-4 (Aggressive)</option>
            <option value={0.0002}>2e-4 (Standard Recommended)</option>
            <option value={0.0001}>1e-4 (Conservative)</option>
            <option value={0.00005}>5e-5 (Fine adjustments)</option>
          </select>
        </div>

        {/* Batch Size & Gradient Accumulation */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-slate-400 text-xs mb-1">Per-GPU Batch</div>
            <select
              value={config.batchSize}
              onChange={(e) => handleUpdate('batchSize', parseInt(e.target.value, 10))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white font-mono"
            >
              <option value={1}>1 (Safe for T4)</option>
              <option value={2}>2 (Optimal)</option>
              <option value={4}>4 (A100 / L4)</option>
            </select>
          </div>
          <div>
            <div className="text-slate-400 text-xs mb-1">Grad Accum Steps</div>
            <select
              value={config.gradientAccumulation}
              onChange={(e) => handleUpdate('gradientAccumulation', parseInt(e.target.value, 10))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white font-mono"
            >
              <option value={2}>2 (Effective 4)</option>
              <option value={4}>4 (Effective 8)</option>
              <option value={8}>8 (Effective 16)</option>
              <option value={16}>16 (Effective 32)</option>
            </select>
          </div>
        </div>

        {/* Epochs & Max Seq Length */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-slate-400 text-xs mb-1">Epochs</div>
            <select
              value={config.epochs}
              onChange={(e) => handleUpdate('epochs', parseInt(e.target.value, 10))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white font-mono"
            >
              <option value={1}>1 Epoch</option>
              <option value={2}>2 Epochs</option>
              <option value={3}>3 Epochs</option>
            </select>
          </div>
          <div>
            <div className="text-slate-400 text-xs mb-1">Max Seq Length</div>
            <select
              value={config.maxSeqLength}
              onChange={(e) => handleUpdate('maxSeqLength', parseInt(e.target.value, 10))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white font-mono"
            >
              <option value={1024}>1024 tokens</option>
              <option value={2048}>2048 tokens</option>
              <option value={4096}>4096 tokens</option>
            </select>
          </div>
        </div>

        {/* Dataset Slice Count */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">OpenHermes Samples</span>
            <span className="font-mono tabular-nums text-slate-200">
              {config.sampleCount.toLocaleString()}
            </span>
          </div>
          <select
            value={config.sampleCount}
            onChange={(e) => handleUpdate('sampleCount', parseInt(e.target.value, 10))}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
          >
            <option value={2500}>2,500 samples (Quick Test ~15m)</option>
            <option value={10000}>10,000 samples (Recommended SFT ~45m)</option>
            <option value={25000}>25,000 samples (Thorough ~2h)</option>
            <option value={50000}>50,000 samples (High Accuracy)</option>
          </select>
        </div>
      </div>
    </aside>
  );
};
