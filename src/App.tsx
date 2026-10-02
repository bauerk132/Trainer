/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TrainingConfig } from './types/notebook';
import { Header } from './components/Header';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { NotebookViewer } from './components/NotebookViewer';
import { TrainingSimulator } from './components/TrainingSimulator';
import { DatasetInspector } from './components/DatasetInspector';
import { EvaluationSection } from './components/EvaluationSection';
import { ScriptViewer } from './components/ScriptViewer';
import { ExportModal } from './components/ExportModal';
import { buildNotebookJson } from './utils/colabGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'notebook' | 'simulator' | 'dataset' | 'evaluation' | 'script'>('notebook');
  const [isColabModalOpen, setIsColabModalOpen] = useState(false);

  const [config, setConfig] = useState<TrainingConfig>({
    modelId: 'google/gemma-2-2b',
    modelName: 'Gemma 2 2B (4-bit NF4)',
    framework: 'trl_peft',
    quantization: '4bit_nf4',
    gpu: 't4',
    loraRank: 16,
    loraAlpha: 16,
    loraDropout: 0.05,
    targetModules: [
      'q_proj',
      'k_proj',
      'v_proj',
      'o_proj',
      'gate_proj',
      'up_proj',
      'down_proj',
    ],
    datasetName: 'teknium/OpenHermes-2.5',
    sampleCount: 10000,
    maxSeqLength: 2048,
    batchSize: 2,
    gradientAccumulation: 4,
    learningRate: 0.0002,
    epochs: 1,
    maxSteps: 250,
    warmupRatio: 0.05,
    weightDecay: 0.01,
    lrScheduler: 'cosine',
    optim: 'paged_adamw_8bit',
    outputDir: './gemma_openhermes_output',
    saveMerged16bit: false,
    exportGGUF: false,
    hubModelId: 'username/gemma-e4b-openhermes',
  });

  const handleDownloadNotebook = () => {
    const jsonStr = buildNotebookJson(config);
    const blob = new Blob([jsonStr], { type: 'application/x-ipynb+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gemma_E4B_4bit_OpenHermes_FineTuning.ipynb`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-amber-400/30 selection:text-amber-200">
      {/* 3-Zone Compliant Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadNotebook={handleDownloadNotebook}
        onOpenColabModal={() => setIsColabModalOpen(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Hyperparameter & GPU Control Workbench */}
        <ConfigurationPanel config={config} onChange={setConfig} />

        {/* Primary Viewport Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#070A12]">
          {activeTab === 'notebook' && (
            <NotebookViewer
              config={config}
              onOpenColabModal={() => setIsColabModalOpen(true)}
              onDownloadNotebook={handleDownloadNotebook}
            />
          )}

          {activeTab === 'simulator' && (
            <TrainingSimulator config={config} onUpdateConfig={setConfig} />
          )}

          {activeTab === 'dataset' && (
            <DatasetInspector config={config} />
          )}

          {activeTab === 'evaluation' && (
            <EvaluationSection
              config={config}
              onUpdateConfig={setConfig}
            />
          )}

          {activeTab === 'script' && (
            <ScriptViewer config={config} />
          )}
        </main>
      </div>

      {/* Colab Launch & Export Modal */}
      <ExportModal
        isOpen={isColabModalOpen}
        onClose={() => setIsColabModalOpen(false)}
        config={config}
        onDownloadNotebook={handleDownloadNotebook}
      />
    </div>
  );
}
