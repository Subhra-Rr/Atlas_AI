import React, { useState } from 'react';
import { api } from '../api/client.js';
import { AIAtlasQueryResponse, MapLayerType } from '../types/atlas.js';
import { TrustIndicator } from './TrustIndicator.js';
import {
  Sparkles,
  Send,
  Minimize2,
  Maximize2,
  Layers,
  MapPin,
  HelpCircle,
  ShieldCheck,
  Compass
} from 'lucide-react';

interface AskAtlasDockProps {
  onApplyAIAction: (action: {
    entityId?: string;
    layers?: MapLayerType[];
    coordinates?: [number, number];
    zoom?: number;
  }) => void;
  activeEntityId?: string;
  activeLayers?: MapLayerType[];
}

export const AskAtlasDock: React.FC<AskAtlasDockProps> = ({
  onApplyAIAction,
  activeEntityId,
  activeLayers
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ query: string; response: AIAtlasQueryResponse }[]>([]);

  const samplePrompts = [
    'Show major rice-producing areas of Odisha',
    'What is the annual rainfall and climate of Ganjam?',
    'What festivals occur in Odisha?',
    'What natural hazards affect Ganjam and coastal Odisha?'
  ];

  const handleAsk = async (textToAsk?: string) => {
    const q = textToAsk || query;
    if (!q.trim() || loading) return;

    setLoading(true);
    try {
      const response = await api.askAtlas(q, activeEntityId, activeLayers);
      setHistory((prev) => [...prev, { query: q, response }]);
      setQuery('');

      // If the AI suggested map actions, auto-apply them
      if (response.suggestedLayers || response.targetCoordinates || response.suggestedEntityId) {
        onApplyAIAction({
          entityId: response.suggestedEntityId,
          layers: response.suggestedLayers,
          coordinates: response.targetCoordinates,
          zoom: response.targetZoom
        });
      }
    } catch (err: any) {
      console.error('Ask Atlas failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-semibold text-xs rounded-full shadow-2xl transition-all transform hover:scale-105 pointer-events-auto border border-amber-400/40"
      >
        <Sparkles className="w-4 h-4 text-slate-950" />
        <span className="font-serif tracking-wider font-bold">Ask Atlas AI</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-30 w-96 sm:w-[440px] max-h-[580px] bg-slate-900/98 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-serif font-bold text-slate-100 tracking-wider">
              ASK ATLAS INTELLIGENCE
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">Factual & Provenance-Grounded</p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages / Response History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[380px]">
        {history.length === 0 ? (
          <div className="space-y-3 py-2">
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Inquire about administrative geographies, agricultural yields, seasonal rainfall, living festivals, or natural hazard records with strict citations.
            </p>

            <div className="space-y-1.5 pt-2">
              <div className="text-[10px] font-mono uppercase text-slate-500">Sample Inquiries:</div>
              {samplePrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleAsk(p)}
                  className="w-full text-left p-2 rounded bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 text-xs text-slate-300 transition-colors flex items-center justify-between group"
                >
                  <span className="truncate">{p}</span>
                  <Compass className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          history.map((item, idx) => (
            <div key={idx} className="space-y-2.5">
              <div className="text-xs font-semibold text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-amber-400 font-mono mr-1.5">Q:</span>
                {item.query}
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800/90 rounded space-y-3 text-xs">
                <div className="text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                  {item.response.answer}
                </div>

                {/* Provenance Badge */}
                {item.response.provenance && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <TrustIndicator status={item.response.provenance.status} />
                    {item.response.provenance.sources.length > 0 && (
                      <span className="font-mono text-slate-400 truncate max-w-[200px]">
                        {item.response.provenance.sources[0].sourceName}
                      </span>
                    )}
                  </div>
                )}

                {/* Map Action Button */}
                {(item.response.suggestedLayers || item.response.suggestedEntityId) && (
                  <button
                    onClick={() =>
                      onApplyAIAction({
                        entityId: item.response.suggestedEntityId,
                        layers: item.response.suggestedLayers,
                        coordinates: item.response.targetCoordinates,
                        zoom: item.response.targetZoom
                      })
                    }
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/40 text-amber-300 rounded font-semibold text-[11px] transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Apply Thematic Layers & Center Map</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded text-xs text-amber-400 font-mono flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Consulting verified datasets and geospatial layers...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-800 bg-slate-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about agriculture, rainfall, culture, hazards..."
            className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="p-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
