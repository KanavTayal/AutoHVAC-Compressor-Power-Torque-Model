import React, { useMemo } from 'react';
import { SimulationInputs, CompressorType } from '../types';
import { calculateSystemState, generateChartData } from '../utils/physics';
import { ArrowRightLeft, Zap, Activity, Flame, Timer, Check, AlertTriangle } from 'lucide-react';

interface TechComparisonProps {
  inputs: SimulationInputs;
}

export const TechComparison: React.FC<TechComparisonProps> = ({ inputs }) => {
  
  const comparison = useMemo(() => {
    const fixedInputs = { ...inputs, compressorType: CompressorType.FIXED_DISPLACEMENT };
    const variableInputs = { ...inputs, compressorType: CompressorType.VARIABLE_DISPLACEMENT };

    const fixedMetrics = calculateSystemState(fixedInputs);
    const variableMetrics = calculateSystemState(variableInputs);

    const fixedCharts = generateChartData(fixedInputs);
    const variableCharts = generateChartData(variableInputs);

    const getTime = (data: {time: number, cabinTemp: number}[], target: number) => {
      const hit = data.find(d => d.cabinTemp <= target + 1.0);
      return hit ? hit.time : null;
    };

    const tFixed = getTime(fixedCharts.pullDownCurve, inputs.targetCabinTemp);
    const tVar = getTime(variableCharts.pullDownCurve, inputs.targetCabinTemp);

    return {
      fixed: { metrics: fixedMetrics, time: tFixed },
      variable: { metrics: variableMetrics, time: tVar }
    };
  }, [inputs]);

  const { fixed, variable } = comparison;
  const isFixed = inputs.compressorType === CompressorType.FIXED_DISPLACEMENT;

  const MetricRow = ({ label, icon: Icon, fixedVal, varVal, unit, lowerIsBetter = true }: any) => {
    const fixedNum = parseFloat(fixedVal);
    const varNum = parseFloat(varVal);
    
    // Determine winner
    const fixedWins = lowerIsBetter ? fixedNum < varNum : fixedNum > varNum;
    const tie = fixedNum === varNum;

    return (
      <div className="grid grid-cols-3 gap-4 py-3 border-b border-slate-700/50 last:border-0 items-center">
        <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
          <Icon className="w-4 h-4 text-slate-500" /> {label}
        </div>
        
        <div className={`px-3 py-1 rounded-lg text-sm font-mono flex items-center justify-between ${
          isFixed 
            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' 
            : 'text-slate-400'
        }`}>
          <span>{fixedVal} <span className="text-xs opacity-70">{unit}</span></span>
          {fixedWins && !tie && <Check className="w-3 h-3 text-emerald-500 ml-2" />}
        </div>

        <div className={`px-3 py-1 rounded-lg text-sm font-mono flex items-center justify-between ${
          !isFixed 
            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' 
            : 'text-slate-400'
        }`}>
           <span>{varVal} <span className="text-xs opacity-70">{unit}</span></span>
           {!fixedWins && !tie && <Check className="w-3 h-3 text-emerald-500 ml-2" />}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-purple-400" /> Technology Trade-off
        </h3>
        <div className="flex gap-2 text-xs font-medium">
           <span className={`px-2 py-1 rounded border ${isFixed ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-transparent text-slate-500'}`}>
             Fixed Disp (Current)
           </span>
           <span className={`px-2 py-1 rounded border ${!isFixed ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-transparent text-slate-500'}`}>
             Variable Disp {(!isFixed) && '(Current)'}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <div>Metric</div>
        <div>Fixed Displacement</div>
        <div>Variable Displacement</div>
      </div>

      <div className="space-y-1">
        <MetricRow 
          label="Avg Power" 
          icon={Zap} 
          fixedVal={fixed.metrics.compressorPower} 
          varVal={variable.metrics.compressorPower} 
          unit="kW"
          lowerIsBetter={true} 
        />
        <MetricRow 
          label="Peak Torque" 
          icon={Activity} 
          fixedVal={fixed.metrics.peakTorque} 
          varVal={variable.metrics.peakTorque} 
          unit="Nm"
          lowerIsBetter={true} 
        />
        <MetricRow 
          label="Fuel Use" 
          icon={Flame} 
          fixedVal={fixed.metrics.fuelPenalty} 
          varVal={variable.metrics.fuelPenalty} 
          unit="L/h"
          lowerIsBetter={true} 
        />
        <div className="grid grid-cols-3 gap-4 py-3 border-b border-slate-700/50 last:border-0 items-center">
          <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
             <Timer className="w-4 h-4 text-slate-500" /> Time to Cool (±1°C)
          </div>
          <div className={`px-3 py-1 rounded-lg text-sm font-mono ${isFixed ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400'}`}>
            {fixed.time ? `${fixed.time} min` : '>15 min'}
          </div>
          <div className={`px-3 py-1 rounded-lg text-sm font-mono ${!isFixed ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400'}`}>
             {variable.time ? `${variable.time} min` : '>15 min'}
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 text-xs text-slate-400 flex gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        <p>
          <strong>Analysis:</strong> {
            fixed.metrics.fuelPenalty > variable.metrics.fuelPenalty 
              ? "Variable Displacement offers better fuel economy at part-load but adds system complexity." 
              : "Fixed Displacement is simpler but imposes higher peak torque loads on the engine belt drive."
          }
          { (fixed.metrics.peakTorque > 15 || variable.metrics.peakTorque > 15) && " High torque loads may trigger ECU idle bumps."}
        </p>
      </div>
    </div>
  );
};
