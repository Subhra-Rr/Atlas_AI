import React from 'react';
import { SourceMetadata } from '../types/atlas.js';
import { ShieldCheck, ExternalLink } from 'lucide-react';

interface SourceBadgeProps {
  metadata?: SourceMetadata;
  className?: string;
  showDetails?: boolean;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ metadata, className = '', showDetails = false }) => {
  if (!metadata) return null;

  return (
    <div className={`text-xs text-slate-400 bg-slate-900/70 border border-slate-800 p-2.5 rounded ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="font-medium text-slate-200 truncate">{metadata.sourceName}</span>
        </div>
        <span className="font-mono text-[11px] text-amber-400 shrink-0">{metadata.datasetVersion}</span>
      </div>

      {showDetails && (
        <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500">License:</span>
            <span className="text-slate-300 text-right truncate ml-2">{metadata.license}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Effective:</span>
            <span className="text-slate-300">{metadata.effectiveDate}</span>
          </div>
          {metadata.sourceUrl && (
            <div className="pt-1">
              <a
                href={metadata.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 underline"
              >
                <span>Verify Provider Source</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
