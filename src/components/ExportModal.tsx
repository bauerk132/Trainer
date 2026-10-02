import React, { useState } from 'react';
import { TrainingConfig } from '../types/notebook';
import { buildNotebookJson } from '../utils/colabGenerator';
import { X, Download, ExternalLink, Copy, Check, CheckCircle2, ShieldCheck, Terminal } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TrainingConfig;
  onDownloadNotebook: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  config,
  onDownloadNotebook,
}) => {
  const [copiedJson, setCopiedJson] = useState(false);

  if (!isOpen) return null;

  const rawJson = buildNotebookJson(config);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(rawJson);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0C1220] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-bold text-xs">
              CO
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Cabinet_Grotesk']">
                Launch in Google Colab
              </h2>
              <p className="text-xs text-slate-400">
                Gemma E4B 4-bit fine-tuning with OpenHermes-2.5
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 text-xs">
          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => {
                onDownloadNotebook();
              }}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all active:scale-95 shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download .ipynb Notebook</span>
            </button>

            <a
              href="https://colab.research.google.com/#create=true"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>Go to Colab Web (Upload Tab)</span>
            </a>
          </div>

          {/* 4-Step Instructions */}
          <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-4 flex flex-col gap-3">
            <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              How to Open in 30 Seconds:
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-slate-200">Download the .ipynb file</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Click the amber button above to download <code className="text-amber-300">Gemma_E4B_4bit_OpenHermes_FineTuning.ipynb</code>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-slate-200">Open Google Colab</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Go to <a href="https://colab.research.google.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">colab.research.google.com</a>, choose the <strong className="text-white">Upload</strong> tab, and select or drag the downloaded notebook.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-slate-200">Ensure GPU Runtime is Selected</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  In Colab menu: <code className="text-slate-300">Runtime &gt; Change runtime type &gt; T4 GPU</code> (Free) or <code className="text-slate-300">A100 / L4</code>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                4
              </span>
              <div>
                <strong className="text-slate-200">Add Hugging Face Secret</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Accept Gemma license on HuggingFace Hub, click the Key icon in Colab sidebar (Secrets), and add key <code className="text-amber-300">HF_TOKEN</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Copy Raw Notebook JSON */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold text-slate-300">Or Copy Raw .ipynb JSON:</span>
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
              >
                {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="p-3 bg-[#070B14] border border-slate-800 rounded text-[11px] font-mono text-slate-400 h-28 overflow-y-auto">
              {rawJson}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 bg-slate-900 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
