import React from 'react';
import { SimulationInputs, CompressorType } from '../types';
import { Settings, Thermometer, Gauge, Fan, Droplets } from 'lucide-react';

interface ControlsProps {
  inputs: SimulationInputs;
  setInputs: React.Dispatch<React.SetStateAction<SimulationInputs>>;
}

export const Controls: React.FC<ControlsProps> = ({ inputs, setInputs }) => {
  
  const handleChange = (field: keyof SimulationInputs, value: number | string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-full flex flex-col gap-6">
      <div className="flex items-center gap-2 border-b border-slate-700 pb-4">
        <Settings className="text-brand-accent w-5 h-5" />
        <h2 className="text-lg font-semibold text-slate-100">Simulation Parameters</h2>
      </div>

      {/* Ambient Temp */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <label className="text-slate-400 flex items-center gap-2">
            <Thermometer className="w-4 h-4" /> Ambient Temp (T<sub>amb</sub>)
          </label>
          <span className="text-brand-accent font-mono">{inputs.ambientTemp}°C</span>
        </div>
        <input 
          type="range" min="20" max="50" step="1" 
          value={inputs.ambientTemp}
          onChange={(e) => handleChange('ambientTemp', Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-accent"
        />
        <div className="flex justify-between text-xs text-slate-600">
          <span>20°C</span>
          <span>50°C</span>
        </div>
      </div>
      
      {/* Humidity (New) */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <label className="text-slate-400 flex items-center gap-2">
            <Droplets className="w-4 h-4" /> Relative Humidity
          </label>
          <span className="text-blue-400 font-mono">{inputs.humidity}%</span>
        </div>
        <input 
          type="range" min="10" max="90" step="5" 
          value={inputs.humidity}
          onChange={(e) => handleChange('humidity', Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-slate-600">
          <span>Dry (10%)</span>
          <span>Tropical (90%)</span>
        </div>
      </div>

      {/* Engine RPM */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <label className="text-slate-400 flex items-center gap-2">
            <Gauge className="w-4 h-4" /> Engine Speed
          </label>
          <span className="text-brand-accent font-mono">{inputs.engineRpm} RPM</span>
        </div>
        <input 
          type="range" min="800" max="6000" step="100" 
          value={inputs.engineRpm}
          onChange={(e) => handleChange('engineRpm', Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-accent"
        />
        <div className="flex justify-between text-xs text-slate-600">
          <span>Idle (800)</span>
          <span>Redline (6000)</span>
        </div>
      </div>

      {/* Target Temp */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <label className="text-slate-400 flex items-center gap-2">
            <Fan className="w-4 h-4" /> Target Cabin Temp
          </label>
          <span className="text-brand-accent font-mono">{inputs.targetCabinTemp}°C</span>
        </div>
        <input 
          type="range" min="16" max="26" step="0.5" 
          value={inputs.targetCabinTemp}
          onChange={(e) => handleChange('targetCabinTemp', Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-accent"
        />
      </div>

      {/* Compressor Type */}
      <div className="space-y-2">
        <label className="text-slate-400 text-sm block mb-1">Compressor Technology</label>
        <select 
          value={inputs.compressorType}
          onChange={(e) => handleChange('compressorType', e.target.value)}
          className="w-full bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-brand-accent focus:border-brand-accent block p-2.5"
        >
          <option value={CompressorType.FIXED_DISPLACEMENT}>Fixed Displacement</option>
          <option value={CompressorType.VARIABLE_DISPLACEMENT}>Variable Displacement</option>
        </select>
        <p className="text-xs text-slate-500 mt-1">
          {inputs.compressorType === CompressorType.VARIABLE_DISPLACEMENT 
            ? "Optimizes stroke. Better drivability."
            : "Cycling Clutch. High peak torque."}
        </p>
      </div>
    </div>
  );
};