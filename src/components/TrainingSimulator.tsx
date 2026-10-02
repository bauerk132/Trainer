import React, { useState, useEffect, useRef } from 'react';
import { TrainingConfig } from '../types/notebook';
import { GpuRamMonitor } from './GpuRamMonitor';
import { Play, Pause, RotateCcw, Cpu, Activity, Clock, Zap, ArrowRight, Sparkles } from 'lucide-react';

interface TrainingSimulatorProps {
  config: TrainingConfig;
  onUpdateConfig?: (newConfig: TrainingConfig) => void;
}

interface StepLog {
  step: number;
  loss: number;
  valLoss?: number;
  lr: number;
  perplexity: number;
  timestamp: string;
}

export const TrainingSimulator: React.FC<TrainingSimulatorProps> = ({ config, onUpdateConfig }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 200;
  const [logs, setLogs] = useState<StepLog[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [testPromptIndex, setTestPromptIndex] = useState(0);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customResponse, setCustomResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sampleTestPrompts = [
    {
      user: "Explain how gradient descent works using a hiking in dense fog analogy.",
      baseOutput: "Gradient descent is an optimization algorithm that minimizes the cost function by taking steps proportional to the negative of the gradient. It iteratively adjusts weights.",
      tunedOutput: "Imagine you are blindfolded on a foggy mountain ridge at dusk and need to reach the lowest valley basin. You cannot see the landscape, but with each step, your boots can sense the steepest downhill slope under your soles. You take a measured stride downward. That slope is the 'gradient', your stride length is the 'learning rate', and the valley floor is the 'global minimum' where prediction error reaches zero."
    },
    {
      user: "Write a Python function to check if a binary tree is symmetric.",
      baseOutput: "def isSymmetric(root): pass # checks if tree is mirror",
      tunedOutput: `def is_symmetric(root) -> bool:
    """Checks if a binary tree is a mirror of itself around its center."""
    if not root:
        return True
    
    def is_mirror(t1, t2):
        if not t1 and not t2:
            return True
        if not t1 or not t2:
            return False
        return (t1.val == t2.val and 
                is_mirror(t1.left, t2.right) and 
                is_mirror(t1.right, t2.left))
                
    return is_mirror(root.left, root.right)`
    },
    {
      user: "A farmer has 17 sheep. All but 9 die of illness. How many sheep are still alive?",
      baseOutput: "17 - 9 = 8 sheep are alive.",
      tunedOutput: "9 sheep are still alive. The phrase 'all but 9 die' explicitly states that 9 sheep survived, so no subtraction is required."
    }
  ];

  // Simulation tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= totalSteps) {
            setIsRunning(false);
            return totalSteps;
          }
          const next = prev + 5;
          setElapsedSeconds((s) => s + 3);

          // Calculate decaying loss along a realistic cosine curve
          const progress = next / totalSteps;
          const baseLoss = 2.4;
          const finalLoss = 0.82;
          const noise = (Math.random() - 0.5) * 0.04;
          const loss = Number((finalLoss + (baseLoss - finalLoss) * Math.pow(1 - progress, 1.4) + noise).toFixed(4));
          const lr = Number((config.learningRate * (0.5 * (1 + Math.cos(Math.PI * progress)))).toExponential(2));
          const perplexity = Number(Math.exp(loss).toFixed(2));
          
          const newLog: StepLog = {
            step: next,
            loss,
            valLoss: next % 20 === 0 ? Number((loss * 1.05).toFixed(4)) : undefined,
            lr,
            perplexity,
            timestamp: new Date().toLocaleTimeString(),
          };

          setLogs((l) => [...l.slice(-40), newLog]);
          return next;
        });
      }, 500);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, totalSteps, config.learningRate]);

  const handleReset = () => {
    setIsRunning(false);
    setCurrentStep(0);
    setLogs([]);
    setElapsedSeconds(0);
  };

  const handleTestGeneration = () => {
    if (!customPrompt.trim()) return;
    setIsGenerating(true);
    setCustomResponse('');
    setTimeout(() => {
      setCustomResponse(
        `[Gemma E4B Fine-Tuned Output for: "${customPrompt}"]\n\n` +
        `Based on the OpenHermes instruction tuning schema:\n` +
        `The optimal solution takes into account structured reasoning and verified constraints. When dealing with this query, we approach the problem by decomposing the core components and executing clear, concise steps with verified correctness.`
      );
      setIsGenerating(false);
    }, 1200);
  };

  const currentLoss = logs.length > 0 ? logs[logs.length - 1].loss : 2.45;
  const currentPpl = logs.length > 0 ? logs[logs.length - 1].perplexity : Math.exp(2.45).toFixed(2);
  const currentLr = logs.length > 0 ? logs[logs.length - 1].lr : config.learningRate;

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold text-amber-400">
              TRL SFTTrainer Live Sandbox
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">
              {config.modelId} (4-bit QLoRA)
            </span>
          </div>
          <h1 className="text-xl font-bold text-white font-['Cabinet_Grotesk'] tracking-tight">
            Supervised Training Loop & Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate the SFTTrainer training loop in real time. Watch gradient updates, cross-entropy loss convergence, validation perplexity, and compare pre-trained vs fine-tuned Gemma responses.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md transition-all active:scale-95 shadow-sm ${
              isRunning
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-slate-950" />
                <span>Pause Training</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>{currentStep > 0 ? 'Resume Training' : 'Start SFT Loop'}</span>
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Real-time GPU & Host RAM Usage Monitor */}
      <GpuRamMonitor
        config={config}
        onUpdateConfig={onUpdateConfig}
        isTrainingActive={isRunning}
        currentStep={currentStep}
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-[#0C1220] border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Training Cross-Entropy Loss</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {currentLoss}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Target threshold: &lt; 1.00
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#0C1220] border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Validation Perplexity (PPL)</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-cyan-400">
            {currentPpl}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            exp(loss) on held-out validation
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#0C1220] border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Progress & Step</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {currentStep} / {totalSteps}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {Math.round((currentStep / totalSteps) * 100)}% complete ({elapsedSeconds}s)
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#0C1220] border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Learning Rate Decay</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
            {currentLr}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {config.lrScheduler} annealing schedule
          </div>
        </div>
      </div>

      {/* Real-time Loss Curve SVG Chart */}
      <div className="p-5 rounded-xl bg-[#0C1220] border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-['Cabinet_Grotesk']">
              Live Loss Convergence & Perplexity Curve
            </h3>
            <p className="text-xs text-slate-400">
              Cross-entropy loss recorded at 10-step intervals during SFTTrainer execution
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Training Loss</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Validation Eval</span>
            </div>
          </div>
        </div>

        {/* SVG Curve Plot */}
        <div className="w-full h-52 bg-[#070B14] rounded-lg border border-slate-800/80 p-3 relative overflow-hidden flex items-end">
          {logs.length > 1 ? (
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
              {/* Grid lines */}
              <line x1="0" y1="20" x2="100" y2="20" stroke="#1E293B" strokeDasharray="2" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#1E293B" strokeDasharray="2" />
              <line x1="0" y1="80" x2="100" y2="80" stroke="#1E293B" strokeDasharray="2" />

              {/* Training Loss Path */}
              <polyline
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.5"
                points={logs
                  .map((log, i) => {
                    const x = (i / (logs.length - 1)) * 100;
                    // Loss range: 0.5 to 2.8
                    const normalizedY = 100 - ((log.loss - 0.5) / (2.8 - 0.5)) * 100;
                    return `${x},${Math.min(95, Math.max(5, normalizedY))}`;
                  })
                  .join(' ')}
              />

              {/* Validation dots */}
              {logs
                .filter((l) => l.valLoss !== undefined)
                .map((log, i, arr) => {
                  const originalIndex = logs.findIndex((l) => l.step === log.step);
                  const x = (originalIndex / (logs.length - 1)) * 100;
                  const normalizedY = 100 - (((log.valLoss ?? 1) - 0.5) / (2.8 - 0.5)) * 100;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={Math.min(95, Math.max(5, normalizedY))}
                      r="3"
                      fill="#06B6D4"
                      stroke="#0F172A"
                      strokeWidth="1.5"
                    />
                  );
                })}
            </svg>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              Click &quot;Start SFT Loop&quot; above to begin streaming training loss telemetry.
            </div>
          )}
        </div>
      </div>

      {/* Model Output Comparison: Pre-Tuned vs Fine-Tuned */}
      <div className="p-5 rounded-xl bg-[#0C1220] border border-slate-800 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Inference Evaluation Benchmark</span>
            </div>
            <h3 className="text-sm font-bold text-white font-['Cabinet_Grotesk']">
              Pre-Trained Base Gemma vs. OpenHermes Fine-Tuned Gemma
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            {sampleTestPrompts.map((_, pIdx) => (
              <button
                key={pIdx}
                onClick={() => setTestPromptIndex(pIdx)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  testPromptIndex === pIdx
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Sample {pIdx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Prompt */}
        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs">
          <div className="text-slate-400 text-[11px] uppercase tracking-wider mb-1">
            Instruction Prompt (Formatted in Gemma Turn Schema):
          </div>
          <div className="font-mono text-slate-200">
            &lt;start_of_turn&gt;user<br />
            {sampleTestPrompts[testPromptIndex].user}<br />
            &lt;end_of_turn&gt;&lt;start_of_turn&gt;model
          </div>
        </div>

        {/* Comparison Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Base Model */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-xs flex flex-col justify-between">
            <div>
              <div className="text-slate-400 font-semibold mb-2 flex items-center justify-between">
                <span>Base Gemma 2B (Pre-Trained)</span>
                <span className="text-[10px] text-slate-500 font-mono">Loss ~2.45</span>
              </div>
              <div className="text-slate-400 leading-relaxed font-mono whitespace-pre-wrap">
                {sampleTestPrompts[testPromptIndex].baseOutput}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
              Truncated or vague responses lacking instruction hierarchy.
            </div>
          </div>

          {/* Fine-Tuned Model */}
          <div className="p-4 rounded-lg bg-gradient-to-b from-amber-500/10 to-slate-900/90 border border-amber-500/40 text-xs flex flex-col justify-between">
            <div>
              <div className="text-amber-300 font-semibold mb-2 flex items-center justify-between">
                <span>Gemma E4B + OpenHermes-2.5 Fine-Tuned</span>
                <span className="text-[10px] text-amber-400 font-mono">PPL 2.27 (Low)</span>
              </div>
              <div className="text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                {sampleTestPrompts[testPromptIndex].tunedOutput}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-amber-500/20 text-[11px] text-amber-400/90">
              Clear algorithmic reasoning, precise markdown formatting, and chain-of-thought deduction.
            </div>
          </div>
        </div>

        {/* Custom Prompt Tester */}
        <div className="mt-2 pt-4 border-t border-slate-800 flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300">
            Test Your Own Custom Instruction Prompt:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTestGeneration()}
              placeholder="e.g. Write a Python decorator that logs execution time of a function..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
            />
            <button
              onClick={handleTestGeneration}
              disabled={isGenerating || !customPrompt.trim()}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>

          {customResponse && (
            <div className="p-3 bg-black/60 border border-slate-800 rounded-md font-mono text-xs text-emerald-300 mt-2 whitespace-pre-wrap">
              {customResponse}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
