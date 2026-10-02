import React, { useState } from 'react';
import { NotebookCell, TrainingConfig } from '../types/notebook';
import { generateNotebookCells } from '../utils/colabGenerator';
import { Play, Check, Copy, Terminal, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';

interface NotebookViewerProps {
  config: TrainingConfig;
  onOpenColabModal: () => void;
  onDownloadNotebook: () => void;
}

export const NotebookViewer: React.FC<NotebookViewerProps> = ({
  config,
  onOpenColabModal,
  onDownloadNotebook,
}) => {
  const cells = generateNotebookCells(config);
  const [runningCellId, setRunningCellId] = useState<string | null>(null);
  const [completedCells, setCompletedCells] = useState<Record<string, boolean>>({});
  const [copiedCellId, setCopiedCellId] = useState<string | null>(null);
  const [collapsedCells, setCollapsedCells] = useState<Record<string, boolean>>({});

  const handleRunCell = (cellId: string) => {
    setRunningCellId(cellId);
    setTimeout(() => {
      setRunningCellId(null);
      setCompletedCells((prev) => ({ ...prev, [cellId]: true }));
    }, 900);
  };

  const handleRunAll = () => {
    let index = 0;
    const runNext = () => {
      if (index >= cells.length) {
        setRunningCellId(null);
        return;
      }
      const cell = cells[index];
      if (cell.cell_type === 'code') {
        setRunningCellId(cell.id);
        setTimeout(() => {
          setCompletedCells((prev) => ({ ...prev, [cell.id]: true }));
          index++;
          runNext();
        }, 400);
      } else {
        index++;
        runNext();
      }
    };
    runNext();
  };

  const handleCopyCode = (cellId: string, source: string[]) => {
    navigator.clipboard.writeText(source.join(''));
    setCopiedCellId(cellId);
    setTimeout(() => setCopiedCellId(null), 2000);
  };

  const toggleCollapse = (cellId: string) => {
    setCollapsedCells((prev) => ({ ...prev, [cellId]: !prev[cellId] }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-950/40 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold text-amber-400">
              Interactive Colab Notebook
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">
              {config.modelName} (4-bit NF4)
            </span>
          </div>
          <h1 className="text-xl font-bold text-white font-['Cabinet_Grotesk'] tracking-tight">
            Gemma E4B 4-Bit Fine-Tuning on OpenHermes-2.5
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Fully executable Google Colab notebook featuring 4-bit BitsAndBytes NF4 quantization, QLoRA PEFT, OpenHermes preprocessing, SFTTrainer training loop, validation perplexity evaluation, and checkpoint persistence to Google Drive.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={handleRunAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Simulate Run All</span>
          </button>
          <button
            onClick={onDownloadNotebook}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-all active:scale-95 shadow-sm"
          >
            <span>Download .ipynb</span>
          </button>
        </div>
      </div>

      {/* Cells List */}
      <div className="flex flex-col gap-5">
        {cells.map((cell, idx) => {
          const isCode = cell.cell_type === 'code';
          const isRunning = runningCellId === cell.id;
          const isCompleted = completedCells[cell.id];
          const isCollapsed = collapsedCells[cell.id];

          return (
            <div
              key={cell.id}
              className={`rounded-lg border transition-all duration-200 ${
                isRunning
                  ? 'border-amber-400/80 shadow-lg shadow-amber-500/10'
                  : 'border-slate-800/90 bg-[#0B101D]'
              }`}
            >
              {/* Cell Header Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 rounded-t-lg">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => toggleCollapse(cell.id)}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  <span className="text-xs font-mono tabular-nums font-bold text-slate-400">
                    {isCode ? `[${isCompleted ? idx + 1 : isRunning ? '*' : ' '}]` : 'MD'}
                  </span>

                  <h3 className="text-xs font-bold text-slate-200 tracking-tight">
                    {cell.title}
                  </h3>

                  {cell.description && (
                    <span className="hidden md:inline text-[11px] text-slate-500">
                      — {cell.description}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isCode && (
                    <>
                      <button
                        onClick={() => handleCopyCode(cell.id, cell.source)}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-800/70 hover:bg-slate-700/70 rounded transition-colors"
                        title="Copy code cell"
                      >
                        {copiedCellId === cell.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleRunCell(cell.id)}
                        disabled={isRunning}
                        className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded transition-all active:scale-95 ${
                          isRunning
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 cursor-wait'
                            : isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                        }`}
                        title="Execute cell"
                      >
                        {isRunning ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                            <span>Executing...</span>
                          </>
                        ) : isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Re-run</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-slate-950" />
                            <span>Run</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Cell Body */}
              {!isCollapsed && (
                <div className="p-4">
                  {isCode ? (
                    <div className="relative font-mono text-xs text-slate-200 bg-[#070B14] p-3.5 rounded border border-slate-800/80 overflow-x-auto leading-relaxed">
                      <pre>
                        {cell.source.map((line, lIdx) => (
                          <div key={lIdx} className="table-row">
                            <span className="table-cell pr-4 text-slate-600 select-none text-right w-8 text-[11px]">
                              {lIdx + 1}
                            </span>
                            <span className="table-cell whitespace-pre font-mono">
                              {line.startsWith('#') ? (
                                <span className="text-slate-500 italic">{line}</span>
                              ) : line.startsWith('!') ? (
                                <span className="text-amber-400 font-semibold">{line}</span>
                              ) : line.includes('import ') || line.includes('from ') ? (
                                <span className="text-cyan-400">{line}</span>
                              ) : (
                                <span>{line}</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </pre>
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-xs max-w-none text-slate-300 space-y-2 text-xs leading-relaxed">
                      {cell.source.join('').split('\n\n').map((para, pIdx) => {
                        if (para.startsWith('# ')) {
                          return (
                            <h2 key={pIdx} className="text-base font-bold text-white font-['Cabinet_Grotesk']">
                              {para.replace('# ', '')}
                            </h2>
                          );
                        }
                        if (para.startsWith('### ')) {
                          return (
                            <h3 key={pIdx} className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                              {para.replace('### ', '')}
                            </h3>
                          );
                        }
                        return <p key={pIdx}>{para}</p>;
                      })}
                    </div>
                  )}

                  {/* Simulated Cell Output if executed */}
                  {isCode && (isCompleted || isRunning) && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60 font-mono text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-1.5 text-[11px]">
                        <Terminal className="w-3 h-3 text-slate-400" />
                        <span>Execution Output:</span>
                      </div>
                      <div className="p-3 rounded bg-black/60 border border-slate-800 text-slate-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                        {cell.id === 'cell_02_install' &&
                          "✓ Dependencies installed: transformers 4.44.2, datasets 2.21.0, peft 0.12.0, trl 0.9.6, bitsandbytes 0.43.3\nEnvironment dependencies installed successfully."}
                        {cell.id === 'cell_03_hardware' &&
                          `PyTorch Version: 2.3.1+cu121\nCUDA Available:  True\nActive GPU:      ${config.gpu === 't4' ? 'NVIDIA Tesla T4' : 'NVIDIA L4'}\nVRAM Capacity:   15.00 GB\nCUDA Capability: 7.5\nBF16 Precision:  Not Supported (Using FP16 for T4)`}
                        {cell.id === 'cell_04_auth_drive' &&
                          `Google Drive mounted at /content/drive.\nCheckpoints destination: /content/drive/MyDrive/gemma_e4b_openhermes_checkpoints\nAuthenticated with Hugging Face Hub successfully.`}
                        {cell.id === 'cell_05_load_model' &&
                          `Loading ${config.modelId} with 4-bit NF4 Quantization...\n4-bit Gemma model loaded successfully.\nActive GPU Memory: 2.68 GB (4-bit NF4 double quant loaded)`}
                        {cell.id === 'cell_06_peft_lora' &&
                          `LoRA Config: r=${config.loraRank}, alpha=${config.loraAlpha}, target_modules=${config.targetModules.length}\nTrainable Parameters: 18,432,000 / 2,614,341,632 (0.705% of total model)`}
                        {cell.id === 'cell_07_load_dataset_and_preprocess' &&
                          `Loading '${config.datasetName}' using Hugging Face datasets...\nRaw dataset loaded: ${config.sampleCount.toLocaleString()} total conversation samples.\nFormatting OpenHermes conversations into Gemma turn tokens... done.\nPreprocessing Complete!\n- Training set:   ${Math.round(config.sampleCount * 0.9).toLocaleString()} samples\n- Validation set: ${Math.round(config.sampleCount * 0.1).toLocaleString()} samples`}
                        {cell.id === 'cell_08_setup_training_loop' &&
                          `Training loop setup complete. SFTTrainer initialized with hyperparameter specifications:\n- Learning rate: ${config.learningRate}\n- Batch size: ${config.batchSize} (Grad Accum: ${config.gradientAccumulation})\n- Epochs: ${config.epochs} | Optimizer: ${config.optim} | Scheduler: ${config.lrScheduler}`}
                        {cell.id === 'cell_09_execute_training' &&
                          `Beginning Training Loop on NVIDIA Tesla T4\nEffective Batch Size: ${config.batchSize * config.gradientAccumulation}\nStep [10/250] - Loss: 1.8420 - LR: 1.95e-4\nStep [50/250] - Loss: 1.4210 - LR: 1.82e-4\nStep [100/250] - Loss: 1.1890 - LR: 1.41e-4\nStep [200/250] - Loss: 0.9420 - LR: 4.20e-5\nTraining finished in 22.40 minutes. Peak VRAM: 7.82 GB`}
                        {cell.id === 'cell_10_eval_perplexity' &&
                          `Running evaluation on validation set...\n==================================================\nValidation Cross-Entropy Loss: 1.0842\nValidation Perplexity (PPL):   2.9571\nRuntime / Sample Throughput:  18.42 samples/sec\n==================================================`}
                        {cell.id === 'cell_11_save_drive_hub' &&
                          `Checkpoints saved to local directory: ./gemma_openhermes_output_lora_final\nSUCCESS: Checkpoints backed up to Google Drive at:\n  -> /content/drive/MyDrive/gemma_e4b_openhermes_checkpoints\nAdapter configuration and safetensors verified.`}
                        {cell.id === 'cell_12_inference_verification' &&
                          `Prompt: Explain the difference between quantum superposition and quantum entanglement to a high schooler.\n--- Gemma E4B Fine-Tuned Output ---\nThink of quantum superposition like a spinning coin on a table: while it spins, it isn't definitely 'heads' or 'tails'—it's in a blend of both states until you slap your hand down on it. Quantum entanglement is when you have two such coins that were spun together in a special way...`}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
