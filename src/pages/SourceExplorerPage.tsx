import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { SourceMetadata } from '../types/atlas.js';
import { TrustIndicator } from '../components/TrustIndicator.js';
import { ShieldCheck, Search, ExternalLink, Calendar, RefreshCw, FileCode, CheckCircle } from 'lucide-react';

export const SourceExplorerPage: React.FC = () => {
  const [sources, setSources] = useState<SourceMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await api.getSources();
        setSources(list);
      } catch (err) {
        console.error('Failed to load sources:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredSources = sources.filter((s) => {
    const matchesSearch =
      s.sourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sourceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.datasetVersion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'ALL' || s.sourceType === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-teal-400 font-mono text-xs uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Authoritative Lineage & Verification Records</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100 tracking-wide">
          Source & Provenance Registry
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl mt-2 leading-relaxed">
          Every statistic, polygon, temperature reading, and cultural narrative in ATLASAI is bound
          to an authoritative publisher, a verifiable dataset version, an explicit license, and an immutable audit hash.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search provider, dataset version, ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'GOVERNMENT_OFFICIAL', 'INTERGOVERNMENTAL', 'SCIENTIFIC_INSTITUTION'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded text-xs font-mono whitespace-nowrap transition-colors ${
                selectedType === type
                  ? 'bg-amber-600/20 border border-amber-600/40 text-amber-300 font-semibold'
                  : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSources.map((source) => (
          <div
            key={source.sourceId}
            className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition-colors flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] uppercase text-amber-400 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800">
                    {source.authorityLevel}
                  </span>
                  <h3 className="font-serif font-bold text-slate-100 text-base mt-2">
                    {source.sourceName}
                  </h3>
                </div>
                <TrustIndicator status={source.dataStatus} />
              </div>

              <div className="space-y-1.5 text-xs font-mono text-slate-400 bg-slate-950/60 border border-slate-800/80 p-3 rounded">
                <div className="flex justify-between">
                  <span className="text-slate-500">Dataset Version:</span>
                  <span className="text-slate-200 font-semibold">{source.datasetVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Update Cadence:</span>
                  <span className="text-slate-200">{source.updateCadence}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Effective Date:</span>
                  <span className="text-slate-200">{source.effectiveDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">License:</span>
                  <span className="text-slate-200 truncate ml-2 text-right">{source.license}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-slate-500">ID: {source.sourceId}</span>
              {source.sourceUrl && (
                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 underline font-mono text-[11px]"
                >
                  <span>Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
