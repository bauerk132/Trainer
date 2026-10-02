import React, { useState } from 'react';
import { TrainingConfig } from '../types/notebook';
import { buildStandalonePythonScript } from '../utils/colabGenerator';
import { Copy, Check, Download, FileCode2 } from 'lucide-react';

interface ScriptViewerProps {
  config: TrainingConfig;
}

export const ScriptViewer: React.FC<ScriptViewerProps> = ({ config }) => {
  const [copied, setCopied] = useState(false);
  const scriptContent = buildStandalonePythonScript(config);

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([scriptContent], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `train_gemma_${config.modelId.replace(/[^a-zA-Z0-9]/g, '_')}_openhermes.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold text-amber-400">
              CLI & Production Script
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">
              Standalone Python
            </span>
          </div>
          <h1 className="text-xl font-bold text-white font-['Cabinet_Grotesk'] tracking-tight">
            Single-File Python Training Script
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Clean, modular Python script ready for execution on multi-GPU nodes, local machines, RunPod, Lambda Labs, or headless Colab via terminal.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-md border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Script'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-md transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .py</span>
          </button>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[#0C1220] border border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-slate-200">train_gemma_openhermes.py</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            {scriptContent.split('\n').length} lines
          </span>
        </div>

        <pre className="p-4 bg-[#070B14] border border-slate-800/80 rounded-lg font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto">
          {scriptContent}
        </pre>
      </div>
    </div>
  );
};
