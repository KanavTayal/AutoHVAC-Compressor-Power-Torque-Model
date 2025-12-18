import React, { useState } from 'react';
import { SimulationInputs, SimulationMetrics } from '../types';
import { analyzeSimulation } from '../services/geminiService';
import { Bot, Loader2, Sparkles } from 'lucide-react';

interface AnalysisPanelProps {
  inputs: SimulationInputs;
  metrics: SimulationMetrics;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ inputs, metrics }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalysis = async () => {
    setLoading(true);
    const result = await analyzeSimulation(inputs, metrics);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col h-full relative overflow-hidden">
       {/* Background decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue opacity-5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className="text-emerald-400 w-5 h-5" />
          <h2 className="text-lg font-semibold text-slate-100">AI Engineering Insight</h2>
        </div>
        {!analysis && !loading && (
          <button 
            onClick={handleAnalysis}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-900/20"
          >
            <Sparkles className="w-4 h-4" />
            Analyze Scenario
          </button>
        )}
      </div>

      <div className="flex-1 bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 overflow-y-auto min-h-[120px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <span className="text-sm">Gemini is analyzing thermodynamic cycle...</span>
          </div>
        ) : analysis ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="whitespace-pre-line text-slate-300 leading-relaxed">{analysis}</p>
            <button 
              onClick={handleAnalysis} 
              className="mt-4 text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
            >
              Re-analyze current state
            </button>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm text-center px-6">
            Click "Analyze" to get an expert assessment of the current compressor load and engine torque penalties.
          </div>
        )}
      </div>
    </div>
  );
};