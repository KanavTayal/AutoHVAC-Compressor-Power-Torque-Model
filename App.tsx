import React, { useState, useMemo } from 'react';
import { calculateSystemState, generateChartData } from './utils/physics';
import { SimulationInputs, CompressorType } from './types';
import { Controls } from './components/Controls';
import { MetricCard } from './components/MetricCard';
import { TechComparison } from './components/TechComparison';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine, Legend, Label
} from 'recharts';
import { Zap, Activity, Snowflake, Flame, Cpu, Info, Droplets, GaugeCircle, BarChart3, LineChart as LineChartIcon, AlertTriangle, CloudSun } from 'lucide-react';

const App: React.FC = () => {
  // Initial Simulation State
  const [inputs, setInputs] = useState<SimulationInputs>({
    ambientTemp: 35, // Hot day
    targetCabinTemp: 22,
    engineRpm: 1500, // Cruising
    compressorType: CompressorType.VARIABLE_DISPLACEMENT,
    humidity: 50
  });

  // Real-time Physics Calculations
  const metrics = useMemo(() => calculateSystemState(inputs), [inputs]);
  const charts = useMemo(() => generateChartData(inputs), [inputs]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-brand-blue selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Snowflake className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">AutoHVAC <span className="text-slate-500 font-normal">| Digital Twin</span></h1>
              <p className="text-xs text-slate-500">Project 6: Real-Time Power & Thermal Model</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm">
             <span className="flex items-center gap-1 text-slate-400"><Cpu className="w-4 h-4" /> Physics Engine v2.1</span>
             <span className="w-px h-4 bg-slate-700"></span>
             {metrics.iscAction !== 'None' ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-900/30 border border-amber-700/50 rounded-full">
                  <Activity className="w-3 h-3 text-amber-500" />
                  <span className="text-amber-400 font-medium text-xs">ECU INTERVENTION: {metrics.iscAction.toUpperCase()}</span>
                </div>
             ) : metrics.idleStatus === 'stall_risk' ? (
                <span className="text-red-500 font-bold animate-pulse flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> STALL WARNING</span>
             ) : (
                <span className="text-emerald-500 font-medium">System Nominal</span>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard 
            label="Fuel Penalty" 
            value={metrics.fuelPenalty} 
            unit="L/h" 
            icon={Flame} 
            colorClass="text-indigo-400"
            subValue={`Est. Cost: $${(metrics.fuelPenalty * 1.2).toFixed(2)}/hr`}
          />
          <MetricCard 
            label="Peak Torque Load" 
            value={metrics.torqueLoad} 
            unit="Nm" 
            icon={Activity} 
            colorClass="text-red-400"
            subValue={metrics.iscAction !== 'None' ? 'Corrected by ISC' : metrics.idleStatus !== 'stable' ? 'Idle Instability Risk' : 'Within Limits'}
            alert={metrics.idleStatus !== 'stable' && metrics.iscAction === 'None'}
          />
          <MetricCard 
            label="Displacement" 
            value={metrics.displacement} 
            unit="%" 
            icon={GaugeCircle} 
            colorClass="text-emerald-400" 
            subValue={inputs.compressorType === CompressorType.VARIABLE_DISPLACEMENT ? 'Variable Stroke' : 'Fixed Stroke (Cycling)'}
          />
          <MetricCard 
            label="Thermal Load" 
            value={metrics.coolingLoad} 
            unit="kW" 
            icon={CloudSun} 
            colorClass="text-orange-400" 
            subValue={`Latent: ${metrics.latentLoad}kW | Sens: ${metrics.sensibleLoad}kW`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Controls (3 columns) - Sticky */}
          <div className="lg:col-span-3 lg:sticky lg:top-24 space-y-6">
            <Controls inputs={inputs} setInputs={setInputs} />
            <div className="hidden lg:block p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
               <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sim Info</h4>
               <p className="text-xs text-slate-500 leading-relaxed">
                  Adjust parameters to see real-time updates on the dashboard. 
                  The charts on the right visualize the system's operating envelope (Ambient Sweep) and powertrain impact (RPM Sweep).
               </p>
            </div>
          </div>

          {/* Right Column: Charts (9 columns) */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* 1. Transient Analysis (Full Width) */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400"/> Transient Pull-Down
                  </h3>
                  <p className="text-sm text-slate-400">Cabin cool-down performance (15 min simulation)</p>
                </div>
                <div className="text-right">
                   <span className="text-xs text-slate-500 block">Relative Humidity</span>
                   <span className="text-sm font-mono text-blue-400">{inputs.humidity}%</span>
                </div>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.pullDownCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="time" stroke="#94a3b8" tick={{fontSize: 12}} unit="m" />
                    <YAxis stroke="#94a3b8" tick={{fontSize: 12}} unit="°C" domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                    <Area type="monotone" dataKey="cabinTemp" stroke="#3b82f6" fill="url(#colorTemp)" strokeWidth={2} name="Cabin Temp" />
                    <ReferenceLine y={inputs.targetCabinTemp} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: 'Target', fill:'#10b981', fontSize: 10}} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Comparison Section */}
            <TechComparison inputs={inputs} />

            {/* 2. Engineering Maps Header */}
            <div className="flex items-center gap-2 pt-2">
               <LineChartIcon className="w-5 h-5 text-brand-accent"/>
               <h2 className="text-lg font-bold text-slate-100">Performance Maps & Operating Envelope</h2>
            </div>

            {/* 3. Combined Charts Grid (3 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              
              {/* Row 1: Thermodynamic & Efficiency Focus */}
              
              {/* Power vs Ambient */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg flex flex-col">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Compressor Power vs Ambient</h3>
                <div className="h-[180px] w-full flex-grow">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.ambientSweep}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="ambient" stroke="#64748b" tick={{fontSize: 10}} unit="°C" />
                      <YAxis stroke="#64748b" tick={{fontSize: 10}} unit="kW" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="power" stroke="#f97316" dot={{r:2}} strokeWidth={2} name="Avg Power" />
                      <ReferenceLine x={45} stroke="#ef4444" strokeDasharray="3 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* COP vs Ambient */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg flex flex-col">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">COP vs Ambient</h3>
                <div className="h-[180px] w-full flex-grow">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.ambientSweep}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="ambient" stroke="#64748b" tick={{fontSize: 10}} unit="°C" />
                      <YAxis stroke="#64748b" tick={{fontSize: 10}} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="cop" stroke="#10b981" dot={{r:2}} strokeWidth={2} name="COP" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

               {/* Cycle Temperatures */}
               <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg flex flex-col">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Cycle Temps (Cond/Evap)</h3>
                <div className="h-[180px] w-full flex-grow">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.ambientSweep}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="ambient" stroke="#64748b" tick={{fontSize: 10}} unit="°C" />
                      <YAxis stroke="#64748b" tick={{fontSize: 10}} unit="°C" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', fontSize: '12px' }} />
                      <Legend wrapperStyle={{fontSize: '10px'}} />
                      <Line type="monotone" dataKey="tCond" stroke="#ef4444" dot={false} strokeWidth={2} name="T_cond" />
                      <Line type="monotone" dataKey="tEvap" stroke="#3b82f6" dot={false} strokeWidth={2} name="T_evap" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Row 2: Mechanical & Powertrain Focus */}

              {/* Torque vs Ambient */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg flex flex-col">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Torque Penalty vs Ambient</h3>
                <div className="h-[180px] w-full flex-grow">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.ambientSweep}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="ambient" stroke="#64748b" tick={{fontSize: 10}} unit="°C" />
                      <YAxis stroke="#64748b" tick={{fontSize: 10}} unit="Nm" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="torque" stroke="#d946ef" dot={{r:2}} strokeWidth={2} name="Peak Torque" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

               {/* Power vs RPM */}
               <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg flex flex-col">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Power vs Engine Speed</h3>
                <div className="h-[180px] w-full flex-grow">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.rpmSweep}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="rpm" stroke="#64748b" tick={{fontSize: 10}} unit="RPM" />
                      <YAxis stroke="#64748b" tick={{fontSize: 10}} unit="kW" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="power" stroke="#f97316" dot={false} strokeWidth={2} name="Avg Power" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Torque vs RPM */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg flex flex-col">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Torque Penalty vs Speed</h3>
                <div className="h-[180px] w-full flex-grow">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.rpmSweep}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="rpm" stroke="#64748b" tick={{fontSize: 10}} unit="RPM" />
                      <YAxis stroke="#64748b" tick={{fontSize: 10}} unit="Nm" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="torque" stroke="#ef4444" dot={false} strokeWidth={2} name="Peak Torque" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
            
            <div className="p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg flex gap-3 items-center">
                <Info className="w-5 h-5 text-blue-400 shrink-0" />
                <p className="text-xs text-slate-400">
                  <strong className="text-slate-300">Engineering Note:</strong> Fixed Displacement compressors cycle on/off; charts show Average Power but Peak Torque. "Heat Rejection Limit" simulates condenser saturation &gt;45°C. "ISC" simulates ECU idle bump logic.
                </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;