import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Compass,
  Navigation,
  ExternalLink,
  RotateCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  MapPin,
  Eye,
  Camera,
  Layers
} from 'lucide-react';

interface StreetViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  coordinates: [number, number];
  locationName?: string;
}

export const StreetViewModal: React.FC<StreetViewModalProps> = ({
  isOpen,
  onClose,
  coordinates,
  locationName = 'Selected Location'
}) => {
  const [heading, setHeading] = useState(45);
  const [pitch, setPitch] = useState(0);
  const [fov, setFov] = useState(90);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const lat = coordinates[0];
  const lng = coordinates[1];

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const googleMapsStreetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}&heading=${heading}&pitch=${pitch}&fov=${fov}`;
  const osmUrl = `https://www.openstreetmap.org/#map=18/${lat}/${lng}`;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 map-floating-overlay">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-inner">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                  Street View 360° Explorer
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold tracking-wider uppercase border border-emerald-500/30">
                  Ground Level
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                <MapPin className="w-3 h-3 text-amber-400" />
                {locationName} &bull; {lat.toFixed(4)}°, {lng.toFixed(4)}°
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCoords}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              title="Copy GPS coordinates"
            >
              {copied ? '✓ Copied' : 'Copy GPS'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 360 Panoramic Viewport */}
        <div className="relative flex-1 bg-slate-900 min-h-[380px] sm:min-h-[460px] overflow-hidden select-none flex items-center justify-center">
          {/* Panoramic Simulation Background with Ground Grid and Horizon */}
          <div
            className="absolute inset-0 transition-transform duration-100 ease-out"
            style={{
              background: `
                radial-gradient(ellipse at 50% ${50 - pitch * 0.5}%, rgba(56, 189, 248, 0.18) 0%, rgba(15, 23, 42, 0.95) 75%),
                linear-gradient(to bottom, #030712 0%, #0f172a 50%, #020617 100%)
              `
            }}
          >
            {/* Horizon and Perspective Grid */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(245, 158, 11, 0.2) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(56, 189, 248, 0.2) 1px, transparent 1px)
                `,
                backgroundSize: '48px 48px',
                transform: `perspective(600px) rotateX(${45 + pitch * 0.3}deg) rotateZ(${heading * 0.2}deg) scale(1.5)`
              }}
            />

            {/* Simulated 360 Ground Landmark Markers */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center px-6 py-4 rounded-xl bg-slate-950/80 border border-slate-700/60 backdrop-blur-md shadow-2xl max-w-md">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-400 flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <Eye className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">
                  Ground-Level View: {locationName}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  Street View vantage active at latitude {lat.toFixed(5)}, longitude {lng.toFixed(5)}. Facing {heading}° with {fov}° field of view.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <a
                    href={googleMapsStreetViewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-all hover:scale-105"
                  >
                    Launch High-Res 360° Panorama
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={osmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-600 transition-colors"
                  >
                    OpenStreetMap Detail
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* HUD Overlay: Compass & Heading */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-xs text-slate-300 backdrop-blur-md">
            <Compass className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />
            <span className="font-mono font-bold text-white">Heading: {heading}°</span>
            <span className="text-slate-500">|</span>
            <span className="font-mono text-slate-300">Pitch: {pitch}°</span>
          </div>

          {/* Interactive Pan & Zoom Controls */}
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5 bg-slate-950/90 p-1.5 rounded-xl border border-slate-700 backdrop-blur-md shadow-xl">
            <div className="grid grid-cols-3 gap-1 w-28">
              <div />
              <button
                onClick={() => setPitch(p => Math.min(60, p + 10))}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center transition-colors"
                title="Look Up"
              >
                ▲
              </button>
              <div />
              <button
                onClick={() => setHeading(h => (h - 15 + 360) % 360)}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center transition-colors"
                title="Turn Left"
              >
                ◀
              </button>
              <button
                onClick={() => { setHeading(0); setPitch(0); }}
                className="p-2 rounded bg-slate-800 hover:bg-amber-600/30 text-amber-400 text-xs font-bold flex items-center justify-center transition-colors"
                title="Reset Center"
              >
                ⊙
              </button>
              <button
                onClick={() => setHeading(h => (h + 15) % 360)}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center transition-colors"
                title="Turn Right"
              >
                ▶
              </button>
              <div />
              <button
                onClick={() => setPitch(p => Math.max(-60, p - 10))}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center transition-colors"
                title="Look Down"
              >
                ▼
              </button>
              <div />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] text-slate-400 px-1 font-mono">
              <span>FOV: {fov}°</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFov(f => Math.min(120, f + 10))}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  title="Zoom Out"
                >
                  -
                </button>
                <button
                  onClick={() => setFov(f => Math.max(50, f - 10))}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  title="Zoom In"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              Interactive Street Level 360° Coverage
            </span>
            <span className="hidden sm:inline text-slate-600">&bull;</span>
            <span className="hidden sm:inline">Use directional buttons or mouse to look around</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors border border-slate-700"
          >
            Close Street View
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
