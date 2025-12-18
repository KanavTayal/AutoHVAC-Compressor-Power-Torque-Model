import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  colorClass: string;
  subValue?: string;
  alert?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, icon: Icon, colorClass, subValue, alert }) => {
  return (
    <div className={`bg-slate-800 border ${alert ? 'border-red-500 animate-pulse' : 'border-slate-700'} rounded-xl p-4 flex items-center justify-between shadow-lg hover:border-slate-600 transition-all`}>
      <div>
        <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-2">
          {label}
          {alert && <span className="text-[10px] bg-red-500 text-white px-1.5 rounded-sm font-bold">ALERT</span>}
        </p>
        <div className="flex items-end gap-1 mt-1">
          <span className={`text-2xl font-bold font-mono ${alert ? 'text-red-400' : 'text-slate-100'}`}>{value}</span>
          <span className="text-slate-500 text-sm mb-1">{unit}</span>
        </div>
        {subValue && (
          <p className="text-xs text-slate-500 mt-1 font-mono">{subValue}</p>
        )}
      </div>
      <div className={`p-3 rounded-lg bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
    </div>
  );
};