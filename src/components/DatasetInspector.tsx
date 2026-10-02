import React, { useState } from 'react';
import { OPENHERMES_SAMPLES, formatToGemmaPrompt } from '../data/openhermesSamples';
import { TrainingConfig } from '../types/notebook';
import { Database, ArrowRight, Code2, Sparkles, Filter, Copy, Check } from 'lucide-react';

interface DatasetInspectorProps {
  config: TrainingConfig;
}

export const DatasetInspector: React.FC<DatasetInspectorProps> = ({ config }) => {
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const currentSample = OPENHERMES_SAMPLES[selectedSampleIndex];
  const gemmaFormatted = formatToGemmaPrompt(currentSample);

  const handleCopy = () => {
    navigator.clipboard.writeText(gemmaFormatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleTokenEstimate = Math.round(gemmaFormatted.length / 3.8);

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold text-amber-400">
              Hugging Face Datasets Pipeline
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">
              teknium/OpenHermes-2.5
            </span>
          </div>
          <h1 className="text-xl font-bold text-white font-['Cabinet_Grotesk'] tracking-tight">
            OpenHermes-2.5 Preprocessing & Tokenization
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            OpenHermes-2.5 contains ~1,000,000 high-quality synthetic conversations across coding, mathematical deduction, and roleplay. The preprocessing pipeline maps ShareGPT schema into Gemma&apos;s turn token sequence.
          </p>
        </div>

        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono shrink-0">
          <div className="text-slate-500 text-[10px]">Dataset Slicing</div>
          <div className="text-amber-400 font-bold tabular-nums">
            {config.sampleCount.toLocaleString()} samples
          </div>
          <div className="text-slate-400 text-[11px]">
            {Math.round(config.sampleCount * 0.9).toLocaleString()} Train / {Math.round(config.sampleCount * 0.1).toLocaleString()} Eval
          </div>
        </div>
      </div>

      {/* Dataset Schema Comparison Card */}
      <div className="p-5 rounded-xl bg-[#0C1220] border border-slate-800 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white font-['Cabinet_Grotesk']">
              ShareGPT Conversation to Gemma Turn Tokens
            </h3>
            <p className="text-xs text-slate-400">
              Compare how raw JSON from OpenHermes is formatted for Gemma 2&apos;s special tokens
            </p>
          </div>

          {/* Sample Selector */}
          <div className="flex items-center gap-2">
            {OPENHERMES_SAMPLES.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setSelectedSampleIndex(idx)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  selectedSampleIndex === idx
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Sample {idx + 1}: {s.category.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Side by Side Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Raw ShareGPT */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Raw OpenHermes-2.5 (ShareGPT JSON)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {currentSample.conversations.length} turns
              </span>
            </div>

            <div className="h-96 overflow-y-auto p-3.5 bg-[#070B14] border border-slate-800/80 rounded-lg font-mono text-xs text-slate-300 leading-relaxed">
              <pre>{JSON.stringify(currentSample, null, 2)}</pre>
            </div>
          </div>

          {/* Right: Gemma Turn Tokens */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Gemma 2 Chat Template (Tokenized Target)</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-amber-400 tabular-nums">
                  ~{sampleTokenEstimate} tokens
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="h-96 overflow-y-auto p-3.5 bg-[#070B14] border border-slate-800/80 rounded-lg font-mono text-xs text-amber-300/90 leading-relaxed whitespace-pre-wrap">
              {gemmaFormatted}
            </div>
          </div>
        </div>

        {/* Tokenizer Details Info */}
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-slate-400 font-semibold mb-1">Gemma Special Tokens</div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Uses <code className="text-amber-400">&lt;start_of_turn&gt;</code> and <code className="text-amber-400">&lt;end_of_turn&gt;</code> with <code className="text-cyan-400">user</code> and <code className="text-cyan-400">model</code> roles.
            </p>
          </div>
          <div>
            <div className="text-slate-400 font-semibold mb-1">Context Length & Padding</div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Sequences exceeding <span className="font-mono text-slate-300">{config.maxSeqLength}</span> tokens are cleanly truncated. Shorter sequences use right padding with <code className="text-slate-400">eos_token</code>.
            </p>
          </div>
          <div>
            <div className="text-slate-400 font-semibold mb-1">System Prompt Handling</div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Gemma doesn&apos;t have a dedicated system role tag. System instructions are cleanly prepended to the initial user turn.
            </p>
          </div>
        </div>
      </div>

      {/* Live Custom Prompt Formatter */}
      <div className="p-5 rounded-xl bg-[#0C1220] border border-slate-800 flex flex-col gap-3">
        <h3 className="text-sm font-bold text-white font-['Cabinet_Grotesk']">
          Test Gemma Tokenization on Your Custom Input
        </h3>
        <p className="text-xs text-slate-400">
          Type any user instruction to see how it formats into Gemma&apos;s special tokens for training:
        </p>

        <textarea
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Type an instruction prompt (e.g., 'Write a quicksort function in Rust with benchmarks...')"
          rows={3}
          className="w-full bg-[#070B14] border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-400"
        />

        {customInput.trim() && (
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 whitespace-pre-wrap">
            {`<start_of_turn>user\n${customInput.trim()}<end_of_turn>\n<start_of_turn>model\n`}
          </div>
        )}
      </div>
    </div>
  );
};
