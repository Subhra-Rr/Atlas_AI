import React from 'react';
import { DataStatus } from '../types/atlas.js';
import { CheckCircle2, Clock, AlertTriangle, HelpCircle, Flame, History, Database } from 'lucide-react';

interface TrustIndicatorProps {
  status: DataStatus;
  verifiedAt?: string;
  sourceName?: string;
  className?: string;
}

export const TrustIndicator: React.FC<TrustIndicatorProps> = ({ status, verifiedAt, sourceName, className = '' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'LIVE':
        return {
          icon: <Flame className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />,
          label: 'Live Stream',
          color: 'text-emerald-400',
          bg: 'bg-emerald-950/40 border-emerald-800/40'
        };
      case 'VERIFIED':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />,
          label: 'Verified Official',
          color: 'text-teal-400',
          bg: 'bg-teal-950/40 border-teal-800/40'
        };
      case 'CACHED':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
          label: 'Cached Observation',
          color: 'text-amber-400',
          bg: 'bg-amber-950/40 border-amber-800/40'
        };
      case 'SOURCE_CONFLICT':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
          label: 'Source Conflict',
          color: 'text-rose-400',
          bg: 'bg-rose-950/40 border-rose-800/40'
        };
      case 'HISTORICAL':
        return {
          icon: <History className="w-3.5 h-3.5 text-indigo-400" />,
          label: 'Historical Baseline',
          color: 'text-indigo-400',
          bg: 'bg-indigo-950/40 border-indigo-800/40'
        };
      case 'SAMPLE':
        return {
          icon: <Database className="w-3.5 h-3.5 text-sky-400" />,
          label: 'Standard Catalog',
          color: 'text-sky-400',
          bg: 'bg-sky-950/40 border-sky-800/40'
        };
      default:
        return {
          icon: <HelpCircle className="w-3.5 h-3.5 text-slate-400" />,
          label: status,
          color: 'text-slate-300',
          bg: 'bg-slate-900 border-slate-700'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border ${config.bg} ${className}`}>
      {config.icon}
      <span className={`font-semibold tracking-wide ${config.color}`}>{config.label}</span>
      {verifiedAt && (
        <>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 text-[11px]">{new Date(verifiedAt).toLocaleDateString()}</span>
        </>
      )}
    </div>
  );
};
