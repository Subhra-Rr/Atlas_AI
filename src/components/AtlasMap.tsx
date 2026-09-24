import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { GeographicEntity, MapLayerType } from '../types/atlas.js';
import { Layers, Eye, EyeOff, MapPin, Compass, Maximize2, ShieldAlert } from 'lucide-react';

interface AtlasMapProps {
  entities: GeographicEntity[];
  selectedEntityId: string | null;
  onSelectEntity: (entityId: string) => void;
  activeLayers: MapLayerType[];
  onToggleLayer: (layer: MapLayerType) => void;
  targetCoordinates?: [number, number];
  targetZoom?: number;
}

export const AtlasMap: React.FC<AtlasMapProps> = ({
  entities,
  selectedEntityId,
  onSelectEntity,
  activeLayers,
  onToggleLayer,
  targetCoordinates,
  targetZoom
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [baseMap, setBaseMap] = useState<'dark' | 'positron' | 'osm' | 'topo'>('dark');
  const [isLayerModalOpen, setIsLayerModalOpen] = useState(false);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.9517, 85.0985], // Odisha / India centered
      zoom: 6,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial dark matter tile layer
    const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const tileLayer = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    baseTileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileLayerRef.current) return;

    let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; CARTO &copy; OpenStreetMap';

    if (baseMap === 'positron') {
      url = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    } else if (baseMap === 'osm') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    } else if (baseMap === 'topo') {
      url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenTopoMap &copy; OpenStreetMap';
    }

    baseTileLayerRef.current.setUrl(url);
  }, [baseMap]);

  // Center/Pan when target coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !targetCoordinates) return;
    mapInstanceRef.current.setView(targetCoordinates, targetZoom || 7, { animate: true });
  }, [targetCoordinates, targetZoom]);

  // Render Geospatial Entities, Polygons, and Thematic Layers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clean up previous layers
    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
    }
    if (markersLayerRef.current) {
      map.removeLayer(markersLayerRef.current);
    }

    const markersGroup = L.layerGroup();

    // Custom styler for boundaries & thematic layers
    const getEntityStyle = (feature: any) => {
      const entityId = feature?.properties?.id;
      const isSelected = entityId === selectedEntityId;
      const isGanjam = entityId === 'ganjam';
      const isOdisha = entityId === 'odisha';

      // Base style
      let fillColor = '#0f766e'; // teal
      let fillOpacity = 0.25;
      let strokeColor = '#14b8a6';
      let weight = 1.5;

      // Thematic layer styling
      if (activeLayers.includes('AGRICULTURE') || activeLayers.includes('CROPS')) {
        if (isGanjam) {
          fillColor = '#eab308'; // Amber for Rice / Agriculture Hub
          fillOpacity = 0.55;
          strokeColor = '#facc15';
          weight = 2.5;
        } else if (isOdisha) {
          fillColor = '#84cc16';
          fillOpacity = 0.25;
        }
      }

      if (activeLayers.includes('RAINFALL')) {
        if (isGanjam) {
          fillColor = '#0284c7'; // Blue precipitation gradient
          fillOpacity = 0.5;
          strokeColor = '#38bdf8';
        } else if (isOdisha) {
          fillColor = '#0369a1';
          fillOpacity = 0.35;
        }
      }

      if (activeLayers.includes('HAZARDS')) {
        if (isGanjam || isOdisha) {
          fillColor = '#dc2626'; // Red cyclone/coastal risk zone
          fillOpacity = 0.45;
          strokeColor = '#ef4444';
          weight = 2.5;
        }
      }

      if (isSelected) {
        strokeColor = '#f59e0b'; // Amber selection ring
        weight = 3.5;
        fillOpacity = Math.max(fillOpacity, 0.45);
      }

      return {
        fillColor,
        weight,
        opacity: 1,
        color: strokeColor,
        dashArray: isSelected ? '4, 4' : '',
        fillOpacity
      };
    };

    // Build GeoJSON FeatureCollection
    const features = entities
      .filter((e) => e.geojson)
      .map((e) => ({
        type: 'Feature',
        properties: {
          id: e.id,
          name: e.name,
          nativeName: e.nativeName,
          type: e.type,
          areaKm2: e.areaKm2,
          population: e.population
        },
        geometry: e.geojson
      }));

    if (features.length > 0) {
      const geojson = L.geoJSON(
        {
          type: 'FeatureCollection',
          features
        } as any,
        {
          style: getEntityStyle,
          onEachFeature: (feature, layer) => {
            const props = feature.properties;
            layer.on({
              click: () => onSelectEntity(props.id),
              mouseover: (e) => {
                const target = e.target;
                target.setStyle({ weight: 3, color: '#f59e0b' });
              },
              mouseout: (e) => {
                geojson.resetStyle(e.target);
              }
            });

            // Clean custom tooltip
            layer.bindTooltip(
              `<div class="text-xs font-sans">
                <div class="font-bold text-slate-100">${props.name}</div>
                <div class="text-[10px] text-slate-400 capitalize font-mono">${props.type}</div>
              </div>`,
              { className: 'atlas-tooltip', sticky: true }
            );
          }
        }
      );

      geojson.addTo(map);
      geojsonLayerRef.current = geojson;
    }

    // Add Markers for Point landmarks (Peaks, Towns, Centers)
    entities.forEach((e) => {
      const isSelected = e.id === selectedEntityId;
      const isPeak = e.type === 'mountain';
      const isRiver = e.type === 'river';

      if (isRiver) return; // Rivers are LineStrings

      const markerHtml = `
        <div class="group relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-125">
          <div class="w-3.5 h-3.5 rounded-full ${
            isSelected
              ? 'bg-amber-400 ring-4 ring-amber-400/40'
              : isPeak
              ? 'bg-rose-500 ring-2 ring-rose-500/30'
              : 'bg-teal-400 ring-2 ring-teal-400/30'
          } shadow-lg flex items-center justify-center text-[9px] font-bold text-slate-950 font-mono">
            ${isPeak ? '▲' : ''}
          </div>
          <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-slate-200 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            ${e.name}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-atlas-pin',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker(e.coordinates, { icon: customIcon });
      marker.on('click', () => onSelectEntity(e.id));
      markersGroup.addLayer(marker);
    });

    markersGroup.addTo(map);
    markersLayerRef.current = markersGroup;
  }, [entities, selectedEntityId, activeLayers]);

  // When selectedEntityId changes, pan to it
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedEntityId) return;
    const target = entities.find((e) => e.id === selectedEntityId);
    if (target) {
      const zoom = target.type === 'district' ? 9 : target.type === 'state' ? 7 : 5;
      mapInstanceRef.current.setView(target.coordinates, zoom, { animate: true });
    }
  }, [selectedEntityId, entities]);

  const allAvailableLayers: { id: MapLayerType; label: string; description: string; color: string }[] = [
    { id: 'PHYSICAL', label: 'Physical & Terrain', description: 'Topography, rivers, mountain ranges & wetlands', color: 'border-emerald-500' },
    { id: 'POLITICAL', label: 'Administrative & Political', description: 'Borders, districts, and municipalities', color: 'border-teal-500' },
    { id: 'WEATHER', label: 'Live Weather Observations', description: 'Real-time surface meteorology & isobar streams', color: 'border-sky-500' },
    { id: 'RAINFALL', label: 'Precipitation & Monsoons', description: 'IMD rainfall distribution & catchment hydrology', color: 'border-blue-500' },
    { id: 'AGRICULTURE', label: 'Agriculture & Cropping', description: 'Acreage, soil types & irrigation coverage', color: 'border-yellow-500' },
    { id: 'CROPS', label: 'Rice & Commercial Crops', description: 'High-density paddy production clusters (Ganjam)', color: 'border-amber-500' },
    { id: 'HAZARDS', label: 'Natural Hazards & Cyclones', description: 'Bay of Bengal cyclone tracks, storm surge & floods', color: 'border-rose-500' },
    { id: 'CULTURE', label: 'Culture & Festivals', description: 'Regional heritage sites, Rath Yatra & Nuakhai routes', color: 'border-purple-500' },
    { id: 'POPULATION', label: 'Population & Demographics', description: 'Settlement density & census handbooks', color: 'border-indigo-500' }
  ];

  return (
    <div className="relative w-full h-full min-h-[500px] bg-slate-950 overflow-hidden">
      {/* The Leaflet Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Layer Selection & Base Map Control */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* Layer Manager Button */}
        <button
          onClick={() => setIsLayerModalOpen(!isLayerModalOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg text-xs font-medium text-slate-100 shadow-xl hover:border-amber-500/80 transition-colors"
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Atlas Layers</span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">
            {activeLayers.length}
          </span>
        </button>

        {/* Base Map Toggle */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setBaseMap('dark')}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
              baseMap === 'dark' ? 'bg-slate-800 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dark Matter
          </button>
          <button
            onClick={() => setBaseMap('topo')}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
              baseMap === 'topo' ? 'bg-slate-800 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Topographic
          </button>
          <button
            onClick={() => setBaseMap('osm')}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
              baseMap === 'osm' ? 'bg-slate-800 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Street (OSM)
          </button>
        </div>
      </div>

      {/* Layer Modal / Panel */}
      {isLayerModalOpen && (
        <div className="absolute top-16 left-4 z-20 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-lg shadow-2xl p-4 space-y-3 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
              Combine Atlas Layers
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Multi-Layer Vector Overlay</span>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {allAvailableLayers.map((layer) => {
              const isActive = activeLayers.includes(layer.id);
              return (
                <button
                  key={layer.id}
                  onClick={() => onToggleLayer(layer.id)}
                  className={`w-full text-left p-2 rounded border transition-all flex items-start gap-2.5 ${
                    isActive
                      ? `bg-slate-800/80 ${layer.color} text-slate-100 shadow-sm`
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="mt-0.5">
                    {isActive ? (
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold">{layer.label}</div>
                    <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{layer.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Example: Odisha + Rain + Rice</span>
            <button
              onClick={() => {
                if (!activeLayers.includes('AGRICULTURE')) onToggleLayer('AGRICULTURE');
                if (!activeLayers.includes('CROPS')) onToggleLayer('CROPS');
                if (!activeLayers.includes('RAINFALL')) onToggleLayer('RAINFALL');
              }}
              className="text-amber-400 hover:underline"
            >
              Preset: Agri & Rain
            </button>
          </div>
        </div>
      )}

      {/* Cartographic Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-3 shadow-xl max-w-xs hidden md:block pointer-events-auto">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
          Cartographic Layers Active:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {activeLayers.map((layer) => (
            <span
              key={layer}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300"
            >
              {layer}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
