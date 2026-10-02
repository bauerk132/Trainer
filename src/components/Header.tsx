import React from 'react';
import { Download, ExternalLink } from 'lucide-react';

interface HeaderProps {
  activeTab: 'notebook' | 'simulator' | 'dataset' | 'evaluation' | 'script';
  setActiveTab: (tab: 'notebook' | 'simulator' | 'dataset' | 'evaluation' | 'script') => void;
  onDownloadNotebook: () => void;
  onOpenColabModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onDownloadNotebook,
  onOpenColabModal,
}) => {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3.5 bg-[#090D16]/95 backdrop-blur-md border-b border-slate-800/80">
      {/* Zone 1: Single text element wordmark in display face */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setActiveTab('notebook');
        }}
        className="text-lg font-black tracking-tight text-white font-['Cabinet_Grotesk'] hover:text-amber-400 transition-colors shrink-0"
      >
        GemmaForge Studio
      </a>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => setActiveTab('notebook')}
          className={`whitespace-nowrap transition-colors py-1 ${
            activeTab === 'notebook'
              ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
              : 'hover:text-white'
          }`}
        >
          Colab Notebook
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`whitespace-nowrap transition-colors py-1 ${
            activeTab === 'simulator'
              ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
              : 'hover:text-white'
          }`}
        >
          Training Loop
        </button>
        <button
          onClick={() => setActiveTab('dataset')}
          className={`whitespace-nowrap transition-colors py-1 ${
            activeTab === 'dataset'
              ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
              : 'hover:text-white'
          }`}
        >
          OpenHermes Preprocessing
        </button>
        <button
          onClick={() => setActiveTab('evaluation')}
          className={`whitespace-nowrap transition-colors py-1 ${
            activeTab === 'evaluation'
              ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
              : 'hover:text-white'
          }`}
        >
          Evaluation & Perplexity
        </button>
        <button
          onClick={() => setActiveTab('script')}
          className={`whitespace-nowrap transition-colors py-1 ${
            activeTab === 'script'
              ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
              : 'hover:text-white'
          }`}
        >
          Standalone Script
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onDownloadNotebook}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 active:scale-95 transition-all rounded-md shadow-sm whitespace-nowrap"
          title="Download complete .ipynb Jupyter notebook file for Colab"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download .ipynb</span>
        </button>

        <button
          onClick={onOpenColabModal}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 active:scale-95 transition-all rounded-md whitespace-nowrap"
          title="Launch in Google Colab with 1-click guide"
        >
          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          <span>Open in Colab</span>
        </button>
      </div>
    </header>
  );
};
