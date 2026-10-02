import React, { useState } from 'react';
import { TrainingConfig } from '../types/notebook';
import { Award, HardDrive, CloudUpload, Calculator, Check, Copy, ExternalLink, BarChart3 } from 'lucide-react';

interface EvaluationSectionProps {
  config: TrainingConfig;
  onUpdateConfig: (newConfig: TrainingConfig) => void;
}

export const EvaluationSection: React.FC<EvaluationSectionProps> = ({ config, onUpdateConfig }) => {
  const [valLossInput, setValLossInput] = useState('1.0842');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const evalLoss = parseFloat(valLossInput) || 1.0842;
  const calculatedPerplexity = Math.exp(evalLoss);

  const benchmarks = [
    { benchmark: 'HumanEval (Python Code Gen)', baseGemma: '28.4%', tunedGemma: '42.8%', delta: '+14.4%' },
    { benchmark: 'GSM8K (Grade School Math)', baseGemma: '44.2%', tunedGemma: '61.5%', delta: '+17.3%' },
    { benchmark: 'ARC-Challenge (Reasoning)', baseGemma: '51.8%', tunedGemma: '63.2%', delta: '+11.4%' },
    { benchmark: 'TruthfulQA (Factuality)', baseGemma: '48.1%', tunedGemma: '57.9%', delta: '+9.8%' },
  ];

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const evalCodeSnippet = `# Standalone Perplexity & Validation Loss Evaluation
import math
import torch

print("Evaluating fine-tuned Gemma E4B on held-out validation set...")
eval_results = trainer.evaluate()
eval_loss = eval_results.get("eval_loss", 0.0)
perplexity = math.exp(eval_loss)

print("=" * 50)
print(f"Validation Loss:            {eval_loss:.4f}")
print(f"Validation Perplexity (PPL): {perplexity:.4f}")
print(f"Eval Samples / Second:      {eval_results.get('eval_samples_per_second', 0.0):.2f}")
print("=" * 50)`;

  const driveCodeSnippet = `# 1. Mount Google Drive
from google.colab import drive
drive.mount('/content/drive')

# 2. Save LoRA Adapters to Google Drive
drive_dir = "/content/drive/MyDrive/gemma_e4b_openhermes_checkpoints"
model.save_pretrained(drive_dir)
tokenizer.save_pretrained(drive_dir)
print(f"Saved checkpoints securely to Google Drive: {drive_dir}")`;

  const hubCodeSnippet = `# Push LoRA Adapters to Hugging Face Hub
from huggingface_hub import login
login()

repo_id = "${config.hubModelId}"
model.push_to_hub(repo_id, private=False)
tokenizer.push_to_hub(repo_id)
print(f"Model pushed to Hugging Face Hub: https://huggingface.co/{repo_id}")`;

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold text-amber-400">
              Evaluation & Checkpoints
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">
              Validation Set & Cloud Persistence
            </span>
          </div>
          <h1 className="text-xl font-bold text-white font-['Cabinet_Grotesk'] tracking-tight">
            Evaluation Metrics & Model Checkpoint Persistence
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Evaluate fine-tuned Gemma E4B using cross-entropy validation loss and exact Perplexity (PPL = exp(loss)). Save adapters to Google Drive or publish directly to Hugging Face Hub.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
            <div className="text-slate-500 text-[10px]">Computed Perplexity</div>
            <div className="text-emerald-400 font-bold text-lg tabular-nums">
              {calculatedPerplexity.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Perplexity Calculation Section */}
      <div className="p-5 rounded-xl bg-[#0C1220] border border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white font-['Cabinet_Grotesk']">
              Validation Perplexity (PPL) Calculator & Formula
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            PPL = exp(Eval_Loss)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Simulated Validation Loss</label>
            <input
              type="number"
              step="0.05"
              value={valLossInput}
              onChange={(e) => setValLossInput(e.target.value)}
              className="w-full bg-[#070B14] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Cross-entropy loss on held-out 10% test split
            </span>
          </div>

          <div>
            <div className="text-slate-400 mb-1">Calculated Perplexity (PPL)</div>
            <div className="text-xl font-mono font-bold text-amber-400 tabular-nums py-1">
              {calculatedPerplexity.toFixed(3)}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Lower is better (represents branching factor uncertainty)
            </span>
          </div>

          <div>
            <div className="text-slate-400 mb-1">Quality Interpretation</div>
            <div className="text-xs font-semibold text-emerald-400 py-1 flex items-center gap-1">
              <span>{calculatedPerplexity < 4.0 ? 'Exceptional Convergence' : 'Moderate Convergence'}</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              OpenHermes instruction tuning yields ~2.5 to 3.5 PPL on Gemma 2B
            </span>
          </div>
        </div>

        {/* Code Snippet for Evaluation */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Colab Evaluation Code:</span>
            <button
              onClick={() => handleCopyCode('eval', evalCodeSnippet)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            >
              {copiedCodeId === 'eval' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCodeId === 'eval' ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="p-3 bg-[#070B14] border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 overflow-x-auto">
            {evalCodeSnippet}
          </pre>
        </div>
      </div>

      {/* Benchmark Improvements Table */}
      <div className="p-5 rounded-xl bg-[#0C1220] border border-slate-800 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white font-['Cabinet_Grotesk']">
            Expected Benchmark Lift on OpenHermes-2.5
          </h3>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Evaluation Benchmark</th>
                <th className="py-2.5 px-4">Base Gemma 2B</th>
                <th className="py-2.5 px-4 text-amber-300">Fine-Tuned Gemma E4B</th>
                <th className="py-2.5 px-4 text-emerald-400">Delta Lift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
              {benchmarks.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-4 text-slate-200 font-sans">{row.benchmark}</td>
                  <td className="py-2.5 px-4 text-slate-400 tabular-nums">{row.baseGemma}</td>
                  <td className="py-2.5 px-4 text-amber-400 font-bold tabular-nums">{row.tunedGemma}</td>
                  <td className="py-2.5 px-4 text-emerald-400 font-bold tabular-nums">{row.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Checkpoints & Storage Persistence: Drive + Hugging Face Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Part 1: Google Drive */}
        <div className="p-5 rounded-xl bg-[#0C1220] border border-slate-800 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <HardDrive className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white font-['Cabinet_Grotesk']">
                Google Drive Persistence
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Google Colab instances are ephemeral. Save LoRA adapter weights directly into your Google Drive root to ensure checkpoints survive runtime disconnection.
            </p>
            <pre className="p-3 bg-[#070B14] border border-slate-800 rounded text-xs font-mono text-amber-300/90 whitespace-pre-wrap overflow-x-auto">
              {driveCodeSnippet}
            </pre>
          </div>

          <button
            onClick={() => handleCopyCode('drive', driveCodeSnippet)}
            className="self-start flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-700 transition-colors"
          >
            {copiedCodeId === 'drive' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Drive Code</span>
          </button>
        </div>

        {/* Part 2: Hugging Face Hub */}
        <div className="p-5 rounded-xl bg-[#0C1220] border border-slate-800 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CloudUpload className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white font-['Cabinet_Grotesk']">
                Hugging Face Hub Publishing
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Publish fine-tuned weights directly to Hugging Face Model Hub so you or your team can load them anywhere via <code className="text-slate-300 font-mono">AutoModelForCausalLM.from_pretrained()</code>.
            </p>

            <div className="mb-2">
              <label className="text-[11px] text-slate-400 block mb-1">Target Hub Repo ID</label>
              <input
                type="text"
                value={config.hubModelId}
                onChange={(e) => onUpdateConfig({ ...config, hubModelId: e.target.value })}
                className="w-full bg-[#070B14] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <pre className="p-3 bg-[#070B14] border border-slate-800 rounded text-xs font-mono text-indigo-300 whitespace-pre-wrap overflow-x-auto">
              {hubCodeSnippet}
            </pre>
          </div>

          <button
            onClick={() => handleCopyCode('hub', hubCodeSnippet)}
            className="self-start flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
          >
            {copiedCodeId === 'hub' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Hub Push Code</span>
          </button>
        </div>
      </div>
    </div>
  );
};
