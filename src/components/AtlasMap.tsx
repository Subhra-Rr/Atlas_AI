import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import {
  GeographicEntity,
  MapLayerType,
  AtlasBaseMapMode,
  PrimaryMapType,
  SecondaryLayerType,
  SavedMapConfig
} from '../types/atlas.js';
import { api } from '../api/client.js';
import { StreetViewModal } from './StreetViewModal.js';
import {
  Map as MapIcon,
  Satellite,
  Mountain,
  Flag,
  TreePine,
  Briefcase,
  Car,
  Camera,
  Flame,
  Wind,
  Layers,
  MapPin,
  Globe,
  RotateCcw,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Sliders,
  Bookmark,
  CheckCircle2,
  Navigation,
  Info
} from 'lucide-react';

interface AtlasMapProps {
  entities: GeographicEntity[];
  selectedEntityId: string | null;
  onSelectEntity: (entityId: string) => void;
  activeLayers: MapLayerType[];
  onToggleLayer: (layer: MapLayerType) => void;
  targetCoordinates?: [number, number];
  targetZoom?: number;
  onResetView?: () => void;
}

// Helpers
const formatPopulation = (num?: number): string => {
  if (!num) return '';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'k';
  return num.toLocaleString();
};

const formatCoords = (coords?: [number, number]): string => {
  if (!coords || coords.length < 2) return '';
  const lat = Math.abs(coords[0]).toFixed(2) + '°' + (coords[0] >= 0 ? 'N' : 'S');
  const lng = Math.abs(coords[1]).toFixed(2) + '°' + (coords[1] >= 0 ? 'E' : 'W');
  return `${lat}, ${lng}`;
};

const getCategoryEmoji = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'city':
    case 'town':
    case 'district':
      return '🏙️';
    case 'state':
    case 'province':
    case 'country':
      return '🏛️';
    case 'river':
    case 'lake':
    case 'waterfall':
      return '🌊';
    case 'mountain':
    case 'volcano':
    case 'peak':
      return '🏔️';
    case 'wonder':
    case 'national_park':
    case 'wetland':
      return '🌲';
    default:
      return '📍';
  }
};

export const AtlasMap: React.FC<AtlasMapProps> = ({
  entities,
  selectedEntityId,
  onSelectEntity,
  activeLayers,
  onToggleLayer,
  targetCoordinates,
  targetZoom,
  onResetView
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const surroundingMarkersRef = useRef<L.LayerGroup | null>(null);
  const focalLayerRef = useRef<L.LayerGroup | null>(null);
  const overlayLayersRef = useRef<Map<string, L.Layer>>(new Map());

  // Current map zoom level state for level-of-detail & decluttering
  const [currentZoom, setCurrentZoom] = useState<number>(targetZoom || 3);

  // 1. PRIMARY MAP (MUTUALLY EXCLUSIVE: Exactly ONE is active at all times)
  const [primaryMap, setPrimaryMap] = useState<PrimaryMapType>('POLITICAL');

  // 2. SECONDARY LAYERS (INDEPENDENT COMPATIBLE TOGGLES)
  const [secondaryLayers, setSecondaryLayers] = useState<SecondaryLayerType[]>([]);

  // Layer Opacity Controls for Overlays
  const [layerOpacity, setLayerOpacity] = useState<Record<string, number>>({
    SATELLITE: 0.9,
    WILDFIRES: 0.85,
    AIRQUALITY: 0.75
  });

  // Layer Fade-in Animation State
  const [isLayerTransitioning, setIsLayerTransitioning] = useState<boolean>(false);

  // Tile layer references for base & reference layers
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const secondaryBaseTileRef = useRef<L.TileLayer | null>(null);
  const referenceTileLayerRef = useRef<L.TileLayer | null>(null);

  // 3. SEARCH & SURROUNDING / NEARBY PLACES (CRITICAL: OFF BY DEFAULT TO PREVENT CLUTTER)
  const [surroundingPlaces, setSurroundingPlaces] = useState<GeographicEntity[]>([]);
  const [isNearbyVisible, setIsNearbyVisible] = useState<boolean>(false); // Strict default: OFF
  const [isSurroundingTrayExpanded, setIsSurroundingTrayExpanded] = useState<boolean>(false);
  const [loadingSurrounding, setLoadingSurrounding] = useState<boolean>(false);
  const [surroundingCategoryFilter, setSurroundingCategoryFilter] = useState<'all' | 'towns' | 'mountains' | 'rivers'>('all');

  // Floating Control Panel State (Desktop & Mobile Drawer)
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState<boolean>(true);
  const [isLegendsOpen, setIsLegendsOpen] = useState<boolean>(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState<boolean>(false);

  // Street View Modal State
  const [isStreetViewOpen, setIsStreetViewOpen] = useState<boolean>(false);
  const [streetViewCoords, setStreetViewCoords] = useState<[number, number]>([20.5937, 78.9629]);
  const [streetViewName, setStreetViewName] = useState<string>('World Map Point');

  // Helper to switch Primary Map (Strict mutual exclusivity with radio semantics)
  const handleSelectPrimary = (type: PrimaryMapType) => {
    if (primaryMap === type) return;
    triggerFadeIn();
    setPrimaryMap(type);

    // Keep activeLayers in sync for backwards-compatibility
    if (type === 'PHYSICAL') {
      if (!activeLayers.includes('PHYSICAL')) onToggleLayer('PHYSICAL');
      if (activeLayers.includes('POLITICAL')) onToggleLayer('POLITICAL');
    } else if (type === 'POLITICAL') {
      if (!activeLayers.includes('POLITICAL')) onToggleLayer('POLITICAL');
      if (activeLayers.includes('PHYSICAL')) onToggleLayer('PHYSICAL');
    } else if (type === 'ECONOMICAL') {
      if (activeLayers.includes('POLITICAL')) onToggleLayer('POLITICAL');
      if (activeLayers.includes('PHYSICAL')) onToggleLayer('PHYSICAL');
    }
  };

  // Helper to toggle Secondary Layer (independent checkboxes)
  const handleToggleSecondary = (layer: SecondaryLayerType) => {
    triggerFadeIn();
    setSecondaryLayers((prev) => {
      const exists = prev.includes(layer);
      const next = exists ? prev.filter((l) => l !== layer) : [...prev, layer];
      return next;
    });

    // Sync legacy MapLayerType if applicable
    if (layer === 'TRAFFIC') onToggleLayer('TRAFFIC');
    if (layer === 'WILDFIRES') onToggleLayer('WILDFIRES');
    if (layer === 'AIRQUALITY') onToggleLayer('AIRQUALITY');
  };

  // Trigger subtle map fade-in transition
  const triggerFadeIn = useCallback(() => {
    setIsLayerTransitioning(true);
    setTimeout(() => {
      setIsLayerTransitioning(false);
    }, 280);
  }, []);

  // Update Opacity for a secondary overlay
  const handleOpacityChange = (key: string, val: number) => {
    setLayerOpacity((prev) => ({ ...prev, [key]: val }));
    const layer = overlayLayersRef.current.get(key.toLowerCase());
    if (layer && 'setOpacity' in layer) {
      (layer as L.TileLayer).setOpacity(val);
    }
    if (key === 'SATELLITE' && secondaryBaseTileRef.current) {
      secondaryBaseTileRef.current.setOpacity(val);
    }
  };

  // Apply Map Presets
  const handleApplyPreset = (preset: 'default' | 'physical' | 'political' | 'economical' | 'satellite' | 'terrain') => {
    triggerFadeIn();
    switch (preset) {
      case 'default':
      case 'political':
        setPrimaryMap('POLITICAL');
        setSecondaryLayers([]);
        break;
      case 'physical':
        setPrimaryMap('PHYSICAL');
        setSecondaryLayers([]);
        break;
      case 'economical':
        setPrimaryMap('ECONOMICAL');
        setSecondaryLayers([]);
        break;
      case 'satellite':
        setPrimaryMap('POLITICAL');
        setSecondaryLayers(['SATELLITE']);
        break;
      case 'terrain':
        setPrimaryMap('PHYSICAL');
        setSecondaryLayers(['TERRAIN']);
        break;
    }
  };

  // Save current Map Configuration to localStorage
  const handleSaveMapConfig = () => {
    const map = mapInstanceRef.current;
    const center = map ? [map.getCenter().lat, map.getCenter().lng] : targetCoordinates || [22, 20];
    const zoom = map ? map.getZoom() : currentZoom;

    const config: SavedMapConfig = {
      id: 'saved_map_config',
      name: 'Custom Atlas View',
      primaryMap,
      secondaryLayers,
      layerOpacity,
      zoom,
      center: center as [number, number],
      savedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('atlas_saved_map', JSON.stringify(config));
      setIsSavedFeedback(true);
      setTimeout(() => setIsSavedFeedback(false), 2200);
    } catch (e) {
      console.warn('Could not save map config', e);
    }
  };

  // Load Saved Map Configuration from localStorage
  const handleLoadMapConfig = () => {
    try {
      const data = localStorage.getItem('atlas_saved_map');
      if (data) {
        const config: SavedMapConfig = JSON.parse(data);
        if (config.primaryMap) setPrimaryMap(config.primaryMap);
        if (config.secondaryLayers) setSecondaryLayers(config.secondaryLayers);
        if (config.layerOpacity) setLayerOpacity(config.layerOpacity);
        if (mapInstanceRef.current && config.center && config.zoom) {
          mapInstanceRef.current.flyTo(config.center, config.zoom, { duration: 1.2 });
        }
        triggerFadeIn();
      }
    } catch (e) {
      console.warn('Could not load map config', e);
    }
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCoords = targetCoordinates || [22, 20];
    const initialZoom = targetZoom || 2.8;

    const map = L.map(mapContainerRef.current, {
      center: initialCoords,
      zoom: initialZoom,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: false,
      worldCopyJump: true,
      maxBounds: [[-85.06, -540], [85.06, 540]],
      maxBoundsViscosity: 0.6
    });

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Track current zoom level for level-of-detail marker rendering
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Clean 1x1 transparent PNG fallback tile to guarantee no broken tile artifacts
    const blankTileUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAA';

    // Initialize Base Tile Layer (Default Political: Carto Positron with crisp borders & worldwide coverage)
    const initialBaseUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    const tileLayer = L.tileLayer(initialBaseUrl, {
      subdomains: 'abcd',
      maxZoom: 19,
      minZoom: 2,
      errorTileUrl: blankTileUrl,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
    baseTileLayerRef.current = tileLayer;

    // Initialize Reference Labels & Borders Layer (Crisp typography & sovereign division labels)
    const initialRefUrl = 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png';
    const refLayer = L.tileLayer(initialRefUrl, {
      subdomains: 'abcd',
      maxZoom: 19,
      minZoom: 2,
      zIndex: 4,
      errorTileUrl: blankTileUrl
    }).addTo(map);
    referenceTileLayerRef.current = refLayer;

    // Touch-responsive popup listener
    const handlePopupOpen = (event: L.PopupEvent) => {
      const popupEl = event.popup.getElement();
      if (!popupEl) return;

      const exploreBtn = popupEl.querySelector('.atlas-popup-btn') as HTMLElement;
      if (exploreBtn) {
        const entityId = exploreBtn.getAttribute('data-explore-entity');
        if (entityId) {
          const triggerSelect = (ev: Event) => {
            ev.preventDefault();
            ev.stopPropagation();
            onSelectEntity(entityId);
            window.dispatchEvent(new CustomEvent('explore-entity', { detail: { entityId } }));
            map.closePopup();
          };
          exploreBtn.addEventListener('click', triggerSelect);
          exploreBtn.addEventListener('touchend', triggerSelect);
        }
      }

      const streetViewBtn = popupEl.querySelector('.atlas-popup-streetview-btn') as HTMLElement;
      if (streetViewBtn) {
        const coordsStr = streetViewBtn.getAttribute('data-coords');
        const nameStr = streetViewBtn.getAttribute('data-name') || 'Location';
        if (coordsStr) {
          const parts = coordsStr.split(',').map(Number);
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            const openSV = (ev: Event) => {
              ev.preventDefault();
              ev.stopPropagation();
              setStreetViewCoords([parts[0], parts[1]]);
              setStreetViewName(nameStr);
              setIsStreetViewOpen(true);
              map.closePopup();
            };
            streetViewBtn.addEventListener('click', openSV);
            streetViewBtn.addEventListener('touchend', openSV);
          }
        }
      }
    };

    map.on('popupopen', handlePopupOpen);
    mapInstanceRef.current = map;

    return () => {
      map.off('popupopen', handlePopupOpen);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. PRIMARY MAP & SECONDARY CARTOGRAPHY ENGINE
  // Updates base tile and secondary base tiles with smooth transitions
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileLayerRef.current) return;
    const map = mapInstanceRef.current;
    const blankTileUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAA';

    let primaryUrl = '';
    let primaryRefUrl: string | null = null;
    let attribution = '';
    let subdomains: string | string[] = 'abcd';

    // Primary Map Selection
    if (primaryMap === 'PHYSICAL') {
      // Physical geography: mountains, plateaus, valleys, deserts, rivers, oceans, biomes, natural relief
      // Carto Voyager: Designed specifically for physical geography, elevation contours, biomes & topography
      primaryUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      primaryRefUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a> &mdash; Physical Relief & Natural Formations';
      subdomains = 'abcd';
    } else if (primaryMap === 'ECONOMICAL') {
      // Economic geography: commercial hubs, ports, shipping lines, trade networks
      // Carto Dark Matter: High-contrast dark theme for trade routes, shipping corridors, and economic hubs
      primaryUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      primaryRefUrl = 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a> &mdash; Economic Corridors & Global Grid';
      subdomains = 'abcd';
    } else {
      // POLITICAL (Default): Administrative boundaries, countries, states, capitals, sovereign borders
      // Carto Positron: Crisp sovereign borders & administrative clarity
      primaryUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      primaryRefUrl = 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a> &mdash; Sovereign Boundaries & Political Divisions';
      subdomains = 'abcd';
    }

    baseTileLayerRef.current.setUrl(primaryUrl);
    (baseTileLayerRef.current.options as any).subdomains = subdomains;
    baseTileLayerRef.current.options.attribution = attribution;

    // Handle Secondary Base: SATELLITE
    const hasSatellite = secondaryLayers.includes('SATELLITE');
    if (hasSatellite) {
      const satUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      if (!secondaryBaseTileRef.current) {
        secondaryBaseTileRef.current = L.tileLayer(satUrl, {
          maxZoom: 19,
          maxNativeZoom: 18, // Leaflet resamples zoom 18 so zoom 19 never requests missing tiles
          zIndex: 2,
          opacity: layerOpacity.SATELLITE || 0.9,
          errorTileUrl: blankTileUrl,
          attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics'
        }).addTo(map);
      } else {
        secondaryBaseTileRef.current.setUrl(satUrl);
        secondaryBaseTileRef.current.setOpacity(layerOpacity.SATELLITE || 0.9);
        if (!map.hasLayer(secondaryBaseTileRef.current)) {
          secondaryBaseTileRef.current.addTo(map);
        }
      }
      // When satellite is on, float crisp labels over the satellite imagery
      primaryRefUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png';
    } else {
      if (secondaryBaseTileRef.current && map.hasLayer(secondaryBaseTileRef.current)) {
        map.removeLayer(secondaryBaseTileRef.current);
      }
    }

    // Handle Secondary Base: STREET
    const hasStreet = secondaryLayers.includes('STREET');
    const existingStreet = overlayLayersRef.current.get('street');
    if (hasStreet) {
      const streetUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      if (!existingStreet) {
        const streetLayer = L.tileLayer(streetUrl, {
          maxZoom: 19,
          subdomains: 'abc',
          zIndex: hasSatellite ? 3 : 2,
          opacity: 0.85,
          errorTileUrl: blankTileUrl,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        overlayLayersRef.current.set('street', streetLayer);
      }
    } else {
      if (existingStreet && map.hasLayer(existingStreet)) {
        map.removeLayer(existingStreet);
        overlayLayersRef.current.delete('street');
      }
    }

    // Handle Secondary Base: TERRAIN
    const hasTerrain = secondaryLayers.includes('TERRAIN');
    const existingTerrain = overlayLayersRef.current.get('terrain');
    if (hasTerrain) {
      const topoUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      if (!existingTerrain) {
        const topoLayer = L.tileLayer(topoUrl, {
          maxZoom: 19,
          maxNativeZoom: 17,
          subdomains: 'abc',
          zIndex: hasSatellite ? 3 : 2,
          opacity: 0.85,
          errorTileUrl: blankTileUrl,
          attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
        }).addTo(map);
        overlayLayersRef.current.set('terrain', topoLayer);
      }
    } else {
      if (existingTerrain && map.hasLayer(existingTerrain)) {
        map.removeLayer(existingTerrain);
        overlayLayersRef.current.delete('terrain');
      }
    }

    // Reference Layer (Administrative boundaries, labels)
    if (primaryRefUrl) {
      if (referenceTileLayerRef.current) {
        referenceTileLayerRef.current.setUrl(primaryRefUrl);
        (referenceTileLayerRef.current.options as any).subdomains = 'abcd';
        if (!map.hasLayer(referenceTileLayerRef.current)) {
          referenceTileLayerRef.current.addTo(map);
        }
      } else {
        referenceTileLayerRef.current = L.tileLayer(primaryRefUrl, {
          maxZoom: 19,
          subdomains: 'abcd',
          zIndex: 4,
          errorTileUrl: blankTileUrl
        }).addTo(map);
      }
    } else {
      if (referenceTileLayerRef.current && map.hasLayer(referenceTileLayerRef.current)) {
        map.removeLayer(referenceTileLayerRef.current);
      }
    }
  }, [primaryMap, secondaryLayers, layerOpacity.SATELLITE]);

  // 3. SECONDARY OVERLAYS: TRAFFIC, WILDFIRES, AIR QUALITY
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const currentOverlays = overlayLayersRef.current;

    // Helper to sync tile overlay
    const syncOverlay = (key: string, enabled: boolean, url: string, options: L.TileLayerOptions = {}) => {
      const existing = currentOverlays.get(key);
      if (enabled) {
        if (!existing) {
          const layer = L.tileLayer(url, { ...options, zIndex: 5 });
          layer.addTo(map);
          currentOverlays.set(key, layer);
        } else if ('setUrl' in existing) {
          (existing as L.TileLayer).setOpacity(options.opacity ?? 1);
        }
      } else {
        if (existing) {
          map.removeLayer(existing);
          currentOverlays.delete(key);
        }
      }
    };

    // 1. TRAFFIC FLOW OVERLAY
    const hasTraffic = secondaryLayers.includes('TRAFFIC');
    const existingTrafficVector = currentOverlays.get('traffic_vector');
    if (hasTraffic) {
      if (!existingTrafficVector) {
        const trafficGroup = L.layerGroup();
        // High-density arterial corridors
        const majorCorridors = [
          { coords: [[28.6139, 77.209], [28.7041, 77.1025]], status: 'busy' },
          { coords: [[19.076, 72.8777], [19.2183, 72.978]], status: 'slow' },
          { coords: [[12.9716, 77.5946], [12.9352, 77.6245]], status: 'congested' },
          { coords: [[40.7128, -74.006], [40.7589, -73.9851]], status: 'busy' },
          { coords: [[51.5074, -0.1278], [51.5155, -0.0922]], status: 'normal' },
          { coords: [[35.6762, 139.6503], [35.6895, 139.6917]], status: 'normal' },
          { coords: [[19.3149, 84.794], [19.325, 84.81]], status: 'normal' }
        ];

        majorCorridors.forEach((route) => {
          const color =
            route.status === 'congested' ? '#ef4444' : route.status === 'slow' ? '#f59e0b' : '#10b981';
          const line = L.polyline(route.coords as [number, number][], {
            color,
            weight: 4.5,
            opacity: 0.85,
            dashArray: route.status === 'congested' ? '5, 8' : undefined
          });
          trafficGroup.addLayer(line);
        });

        trafficGroup.addTo(map);
        currentOverlays.set('traffic_vector', trafficGroup);
      }
    } else {
      if (existingTrafficVector) {
        map.removeLayer(existingTrafficVector);
        currentOverlays.delete('traffic_vector');
      }
    }

    // 2. NASA FIRMS WILDFIRES HOTSPOTS OVERLAY
    const hasWildfires = secondaryLayers.includes('WILDFIRES');
    const existingWildfireGroup = currentOverlays.get('wildfires_group');
    if (hasWildfires) {
      if (!existingWildfireGroup) {
        const wildfireGroup = L.layerGroup();
        const activeHotspots = [
          { lat: -3.4653, lng: -62.2159, name: 'Amazon Basin Thermal Hotspot', fRP: '142 MW', temp: '345K' },
          { lat: -14.235, lng: -51.9253, name: 'Cerrado Active Fire Cluster', fRP: '98 MW', temp: '332K' },
          { lat: -1.2921, lng: 36.8219, name: 'East African Savannah Burn Anomaly', fRP: '64 MW', temp: '328K' },
          { lat: -25.2744, lng: 133.7751, name: 'Central Australian Brush Hotspot', fRP: '115 MW', temp: '339K' },
          { lat: 37.7749, lng: -122.4194, name: 'California Coastal Thermal Anomaly', fRP: '52 MW', temp: '320K' },
          { lat: 21.1458, lng: 79.0882, name: 'Central Indian Forest Thermal Cluster', fRP: '47 MW', temp: '318K' }
        ];

        activeHotspots.forEach((spot) => {
          const circle = L.circleMarker([spot.lat, spot.lng], {
            radius: 8,
            fillColor: '#f43f5e',
            color: '#fda4af',
            weight: 2,
            opacity: 0.9,
            fillOpacity: layerOpacity.WILDFIRES || 0.85
          });

          circle.bindPopup(`
            <div class="atlas-popup-card" style="padding: 10px; min-width: 220px;">
              <div style="font-size: 11px; font-weight: 700; color: #f43f5e; margin-bottom: 4px; display: flex; items-center; gap: 4px;">
                🔥 NASA FIRMS Active Fire Hotspot
              </div>
              <div style="font-size: 12px; font-weight: 600; color: #f8fafc;">${spot.name}</div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
                Radiation Power: <strong style="color: #fbbf24;">${spot.fRP}</strong> · Temp: <strong>${spot.temp}</strong>
              </div>
            </div>
          `);

          wildfireGroup.addLayer(circle);
        });

        wildfireGroup.addTo(map);
        currentOverlays.set('wildfires_group', wildfireGroup);
      }
    } else {
      if (existingWildfireGroup) {
        map.removeLayer(existingWildfireGroup);
        currentOverlays.delete('wildfires_group');
      }
    }

    // 3. AIR QUALITY WAQI REAL-TIME PM2.5 HEATMAP OVERLAY
    const hasAirQuality = secondaryLayers.includes('AIRQUALITY');
    const blankTileUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAA';
    syncOverlay(
      'airquality',
      hasAirQuality,
      'https://tiles.aqicn.org/tiles/usepa-aqi/{z}/{x}/{y}.png?token=demo',
      {
        opacity: layerOpacity.AIRQUALITY || 0.75,
        maxZoom: 18,
        maxNativeZoom: 12,
        errorTileUrl: blankTileUrl,
        attribution: 'Air Quality &copy; WAQI / OpenAQ Atmospheric Stream'
      }
    );
  }, [secondaryLayers, layerOpacity]);

  // 4. SMOOTH ZOOM-TO-BOUNDS & CAMERA GLIDE ANIMATION
  // Intelligently fits entity polygon bounds or glides smoothly to center
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const selected = entities.find((e) => e.id === selectedEntityId);

    // If selected entity has bounding box or GeoJSON, use smooth zoom-to-bounds!
    if (selected) {
      if (selected.bbox && selected.bbox.length === 4) {
        const bounds: L.LatLngBoundsExpression = [
          [selected.bbox[0], selected.bbox[1]],
          [selected.bbox[2], selected.bbox[3]]
        ];
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 14,
          duration: 1.4,
          animate: true
        });
        return;
      }

      if (selected.geojson) {
        try {
          const geoLayer = L.geoJSON(selected.geojson);
          const bounds = geoLayer.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: 14,
              duration: 1.4,
              animate: true
            });
            return;
          }
        } catch (e) {
          console.warn('Could not compute bounds from geojson', e);
        }
      }

      // If no valid polygon/bbox, determine appropriate zoom level by entity type
      if (selected.coordinates) {
        const recZoom =
          selected.type === 'continent'
            ? 3.2
            : selected.type === 'country'
            ? 5.0
            : selected.type === 'state' || selected.type === 'province'
            ? 6.8
            : selected.type === 'river'
            ? 7.5
            : selected.type === 'mountain' || selected.type === 'volcano'
            ? 9.5
            : selected.type === 'district'
            ? 9.0
            : selected.type === 'city' || selected.type === 'town'
            ? 11.0
            : 10.0;

        map.flyTo(selected.coordinates, recZoom, {
          duration: 1.4,
          easeLinearity: 0.25
        });
        return;
      }
    }

    // Default target coordinates pan
    if (targetCoordinates) {
      map.flyTo(targetCoordinates, targetZoom || 6, {
        duration: 1.4,
        easeLinearity: 0.25
      });
    }
  }, [selectedEntityId, targetCoordinates, targetZoom]);

  // 5. SURROUNDING PLACES FETCH (STRICTLY TRIGGERED ONLY WHEN USER ENABLES "SHOW NEARBY")
  useEffect(() => {
    let isCancelled = false;

    // IF NEARBY IS OFF: do not load or render nearby places!
    if (!isNearbyVisible) {
      setSurroundingPlaces([]);
      return;
    }

    const fetchSurrounding = async () => {
      let lat = targetCoordinates ? targetCoordinates[0] : 20.5937;
      let lng = targetCoordinates ? targetCoordinates[1] : 78.9629;

      if (selectedEntityId) {
        const sel = entities.find((e) => e.id === selectedEntityId);
        if (sel?.coordinates) {
          lat = sel.coordinates[0];
          lng = sel.coordinates[1];
        }
      }

      setLoadingSurrounding(true);
      try {
        const places = await api.getSurrounding({
          entityId: selectedEntityId || undefined,
          lat,
          lng,
          radiusKm: 250
        });

        if (!isCancelled) {
          setSurroundingPlaces(places || []);
        }
      } catch (err) {
        console.warn('Failed to load surrounding places:', err);
      } finally {
        if (!isCancelled) {
          setLoadingSurrounding(false);
        }
      }
    };

    fetchSurrounding();

    return () => {
      isCancelled = true;
    };
  }, [selectedEntityId, targetCoordinates, isNearbyVisible]);

  // 6. RENDER GEOJSON & DECLUTTERED LEVEL-OF-DETAIL ENTITY MARKERS
  // Prevents marker collisions and stops hundreds of overlapping pins at low zoom
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clean up previous entity layers
    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
    }
    if (markersLayerRef.current) {
      map.removeLayer(markersLayerRef.current);
    }

    const markersGroup = L.layerGroup();

    // Thematic styler for polygons
    const getEntityStyle = (feature: any) => {
      const entityId = feature?.properties?.id;
      const isSelected = entityId === selectedEntityId;

      let strokeColor = primaryMap === 'PHYSICAL' ? '#10b981' : primaryMap === 'ECONOMICAL' ? '#38bdf8' : '#6366f1';
      let fillColor = strokeColor;
      let fillOpacity = 0.15;
      let weight = 1.5;

      if (isSelected) {
        strokeColor = '#f59e0b';
        weight = 3.5;
        fillOpacity = 0.45;
      }

      return {
        fillColor,
        weight,
        opacity: 0.9,
        color: strokeColor,
        dashArray: isSelected ? '4 2' : '',
        fillOpacity
      };
    };

    const createPopupHTML = (props: any) => {
      const cleanDesc = (props.description || '').replace(/"/g, '&quot;');
      const popDisplay = formatPopulation(props.population);
      const coordsDisplay = formatCoords(props.coordinates);
      const statusLabel = props.verificationStatus === 'LIVE' ? 'LIVE' : 'VERIFIED';
      const coordsAttr = props.coordinates ? `${props.coordinates[0]},${props.coordinates[1]}` : '';

      return `
        <div class="atlas-popup-card" data-entity-id="${props.id}">
          <div class="atlas-popup-accent-bar"></div>
          
          <div class="atlas-popup-header">
            <div class="atlas-popup-taxonomy">
              <span class="atlas-popup-type">${props.type}</span>
              ${props.parentName ? `<span class="atlas-popup-parent">· ${props.parentName}</span>` : ''}
              <span class="atlas-popup-badge-verified">
                <svg class="atlas-badge-icon" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>${statusLabel}</span>
              </span>
            </div>

            <div class="atlas-popup-title-wrap">
              <h3 class="atlas-popup-title">${props.name}</h3>
              ${props.nativeName ? `<span class="atlas-popup-native">${props.nativeName}</span>` : ''}
            </div>
          </div>

          ${
            props.capital || popDisplay || coordsDisplay
              ? `
            <div class="atlas-popup-stats-grid">
              ${
                props.capital
                  ? `
                <div class="atlas-popup-stat-item">
                  <span class="atlas-stat-label">Capital</span>
                  <span class="atlas-stat-value" title="${props.capital}">${props.capital}</span>
                </div>
              `
                  : ''
              }
              ${
                popDisplay
                  ? `
                <div class="atlas-popup-stat-item">
                  <span class="atlas-stat-label">Population</span>
                  <span class="atlas-stat-value">${popDisplay}</span>
                </div>
              `
                  : ''
              }
              ${
                coordsDisplay
                  ? `
                <div class="atlas-popup-stat-item">
                  <span class="atlas-stat-label">Position</span>
                  <span class="atlas-stat-value atlas-stat-coords" title="${coordsDisplay}">${coordsDisplay}</span>
                </div>
              `
                  : ''
              }
            </div>
          `
              : ''
          }

          <p class="atlas-popup-desc">${cleanDesc}</p>

          <div class="atlas-popup-footer flex items-center gap-2">
            <button
              type="button"
              class="atlas-popup-btn flex-1"
              data-explore-entity="${props.id}"
              onclick="window.dispatchEvent(new CustomEvent('explore-entity', { detail: { entityId: '${props.id}' } }));"
              aria-label="Explore ${props.name} in Atlas"
            >
              <span>Explore in Atlas</span>
              <svg class="atlas-btn-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"/>
                <path d="m12 5 7 7-7 7"/>
              </svg>
            </button>

            ${
              coordsAttr
                ? `
              <button
                type="button"
                class="atlas-popup-streetview-btn px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700 flex items-center gap-1"
                data-coords="${coordsAttr}"
                data-name="${props.name}"
                title="Open Ground 360° Street View"
              >
                <span>🚶 360°</span>
              </button>
            `
                : ''
            }
          </div>
        </div>
      `;
    };

    // Filter GeoJSON features (omit continent polygons to preserve base map)
    const features = entities
      .filter((e) => e.geojson && e.type !== 'continent')
      .map((e) => ({
        type: 'Feature',
        properties: {
          id: e.id,
          name: e.name,
          nativeName: e.nativeName,
          type: e.type,
          parentName: e.parentName,
          description: e.description,
          capital: e.capital,
          coordinates: e.coordinates,
          population: e.population,
          verificationStatus: e.sources?.verificationStatus || 'VERIFIED'
        },
        geometry: e.geojson
      }));

    if (features.length > 0) {
      const geojson = L.geoJSON(
        {
          type: 'FeatureCollection',
          features: features as any
        } as any,
        {
          style: getEntityStyle,
          onEachFeature: (feature, layer) => {
            const props = feature.properties;
            const popupContent = createPopupHTML(props);
            layer.bindPopup(popupContent, {
              className: 'atlas-popup',
              maxWidth: 325,
              minWidth: 275
            });

            layer.on('click', () => {
              onSelectEntity(props.id);
            });
          }
        }
      );

      geojson.addTo(map);
      geojsonLayerRef.current = geojson;
    }

    // LEVEL-OF-DETAIL FILTERING: Prevent marker clutter and overlap based on zoom
    // When zoomed out (< 5): only show major countries, continents, or selected entity
    // When zoomed in (>= 5 and < 8): show states, major physical features
    // When zoomed in (>= 8): show cities, towns, local features
    entities.forEach((e) => {
      const isSelected = e.id === selectedEntityId;
      const isContinent = e.type === 'continent';
      const isCountry = e.type === 'country';
      const isState = e.type === 'state' || e.type === 'province';
      const isMajorPhysical = ['mountain_range', 'ocean', 'sea', 'desert', 'river'].includes(e.type);
      const isTownOrCity = ['city', 'town', 'village', 'district'].includes(e.type);

      // Do not clutter map with continent pins unless selected
      if (isContinent && !isSelected) return;

      // Decluttering logic:
      if (!isSelected) {
        if (currentZoom < 4.5 && (isTownOrCity || e.type === 'mountain')) {
          // Hide minor places when zoomed out at world scale
          return;
        }
        if (currentZoom < 6.5 && (e.type === 'village' || e.type === 'district')) {
          // Hide minor local entities at intermediate zoom
          return;
        }

        // Align with active primary map
        if (primaryMap === 'PHYSICAL' && isTownOrCity && currentZoom < 8) {
          return;
        }
      }

      const markerColor = isSelected
        ? '#f59e0b'
        : isMajorPhysical || ['mountain', 'volcano', 'lake', 'wetland'].includes(e.type)
        ? '#10b981'
        : isCountry
        ? '#ec4899'
        : isState
        ? '#3b82f6'
        : '#06b6d4';

      const customIcon = L.divIcon({
        className: 'custom-atlas-pin',
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isSelected ? '32px' : '22px'};
            height: ${isSelected ? '32px' : '22px'};
            background: ${markerColor};
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 4px 14px rgba(0,0,0,0.7);
            transform: translate(-50%, -50%);
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            <div style="width: 6px; height: 6px; background: #020617; border-radius: 50%;"></div>
            <div style="
              position: absolute;
              bottom: 100%;
              left: 50%;
              transform: translateX(-50%);
              margin-bottom: 5px;
              white-space: nowrap;
              font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
              font-size: ${isSelected ? '12px' : '10px'};
              font-weight: 700;
              color: #f8fafc;
              background: rgba(10, 15, 29, 0.95);
              padding: 2px 6px;
              border-radius: 4px;
              border: 1px solid ${isSelected ? '#f59e0b' : 'rgba(255,255,255,0.2)'};
              pointer-events: none;
              box-shadow: 0 2px 8px rgba(0,0,0,0.6);
            ">${e.name}</div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker(e.coordinates, { icon: customIcon });

      const markerPopup = createPopupHTML({
        id: e.id,
        name: e.name,
        nativeName: e.nativeName,
        type: e.type,
        parentName: e.parentName,
        description: e.description,
        capital: e.capital,
        coordinates: e.coordinates,
        population: e.population,
        verificationStatus: e.sources?.verificationStatus || 'VERIFIED'
      });

      marker.bindPopup(markerPopup, {
        className: 'atlas-popup',
        maxWidth: 325,
        minWidth: 275
      });

      marker.on('click', () => onSelectEntity(e.id));
      markersGroup.addLayer(marker);
    });

    markersGroup.addTo(map);
    markersLayerRef.current = markersGroup;
  }, [entities, selectedEntityId, primaryMap, currentZoom]);

  // 7. SELECTED LOCATION FOCUS RING & SURROUNDING REGIONS (NEARBY REMAINS OFF BY DEFAULT)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (surroundingMarkersRef.current) {
      map.removeLayer(surroundingMarkersRef.current);
    }
    if (focalLayerRef.current) {
      map.removeLayer(focalLayerRef.current);
    }

    const surroundingGroup = L.layerGroup();
    const focalGroup = L.layerGroup();

    // 1. Draw elegant focal spotlight beacon on selected location
    const selected = entities.find((e) => e.id === selectedEntityId);
    const centerCoords = selected?.coordinates || targetCoordinates;

    if (centerCoords && centerCoords.length === 2) {
      // Subtle pulsing radar ring on searched place
      const focalRadarOuter = L.circle(centerCoords, {
        radius: 12000,
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.12,
        weight: 1.8,
        dashArray: '4, 6',
        className: 'focal-radar-halo'
      });
      focalGroup.addLayer(focalRadarOuter);

      const focalRadarInner = L.circle(centerCoords, {
        radius: 4000,
        color: '#f59e0b',
        fillColor: '#fbbf24',
        fillOpacity: 0.25,
        weight: 2
      });
      focalGroup.addLayer(focalRadarInner);
    }

    focalGroup.addTo(map);
    focalLayerRef.current = focalGroup;

    // IF USER HAS NOT EXPLICITLY TURNED ON "SHOW NEARBY", DO NOT DRAW ANY NEARBY MARKERS!
    if (!isNearbyVisible || surroundingPlaces.length === 0) {
      return;
    }

    // Filter surrounding places based on active category filter
    const filteredPlaces = surroundingPlaces.filter((place) => {
      if (surroundingCategoryFilter === 'towns') {
        return ['city', 'town', 'village', 'district'].includes(place.type);
      }
      if (surroundingCategoryFilter === 'mountains') {
        return ['mountain', 'volcano', 'mountain_range'].includes(place.type);
      }
      if (surroundingCategoryFilter === 'rivers') {
        return ['river', 'lake', 'wetland', 'sea', 'ocean', 'waterway'].includes(place.type);
      }
      return true;
    });

    filteredPlaces.forEach((place) => {
      if (place.id === selectedEntityId) return;

      const isMountain = ['mountain', 'volcano', 'mountain_range'].includes(place.type);
      const isRiver = ['river', 'lake', 'wetland', 'waterway'].includes(place.type);
      const isTown = ['city', 'town', 'village', 'district'].includes(place.type);

      const emoji = isMountain ? '🏔️' : isRiver ? '🌊' : isTown ? '🏙️' : getCategoryEmoji(place.type);
      const borderColor = isMountain ? '#10b981' : isRiver ? '#06b6d4' : isTown ? '#6366f1' : '#f59e0b';
      const textColor = isMountain ? '#6ee7b7' : isRiver ? '#67e8f9' : isTown ? '#a5b4fc' : '#fcd34d';

      // Connecting ray from center to surrounding place
      if (centerCoords && centerCoords.length === 2) {
        const ray = L.polyline([centerCoords, place.coordinates], {
          color: borderColor,
          weight: 1.5,
          opacity: 0.45,
          dashArray: '3, 6'
        });
        surroundingGroup.addLayer(ray);
      }

      const distText = place.distanceKm ? `${place.distanceKm} km ${place.bearing || ''}` : '';
      const elevText = place.elevationM ? `${place.elevationM.toLocaleString()}m` : '';
      const metaBadge = [elevText, distText].filter(Boolean).join(' · ');

      const icon = L.divIcon({
        className: 'surrounding-region-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 22px;
              height: 22px;
              background: #090d16;
              border: 2px solid ${borderColor};
              border-radius: 50%;
              box-shadow: 0 0 10px ${borderColor}88, 0 4px 10px rgba(0,0,0,0.8);
              cursor: pointer;
            ">
              <span style="font-size: 11px;">${emoji}</span>
            </div>
            
            <div class="surrounding-region-badge" style="
              position: absolute;
              bottom: 100%;
              margin-bottom: 5px;
              border: 1px solid ${borderColor}aa;
              background: rgba(8, 12, 22, 0.95);
            ">
              <span style="font-size: 10px; font-weight: 700; color: #f8fafc;">${place.name}</span>
              ${metaBadge ? `<span style="font-size: 9px; font-family: ui-monospace, monospace; color: ${textColor}; padding: 1px 4px; background: rgba(255,255,255,0.08); border-radius: 3px;">${metaBadge}</span>` : ''}
            </div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker(place.coordinates, { icon });
      marker.on('click', () => onSelectEntity(place.id));
      surroundingGroup.addLayer(marker);
    });

    surroundingGroup.addTo(map);
    surroundingMarkersRef.current = surroundingGroup;
  }, [selectedEntityId, targetCoordinates, isNearbyVisible, surroundingPlaces, surroundingCategoryFilter]);

  // Handle World View Reset
  const handleResetToWorld = () => {
    if (onResetView) {
      onResetView();
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([22, 20], 2.8, { duration: 1.2 });
    }
    setIsNearbyVisible(false);
  };

  // Selected entity lookup
  const selectedEntity = useMemo(() => {
    return entities.find((e) => e.id === selectedEntityId) || null;
  }, [entities, selectedEntityId]);

  return (
    <div
      className={`relative w-full h-full min-h-[50vh] bg-slate-950 overflow-hidden ${
        isLayerTransitioning ? 'map-layer-transitioning' : 'map-layer-settled'
      }`}
    >
      {/* 1. Map Canvas Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 2. TOP-LEFT: SELECTED ENTITY CONTEXT BANNER & "SHOW NEARBY" TOGGLE (CLEAN & CONTROLLED) */}
      {selectedEntity && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-[1500] map-floating-overlay pointer-events-auto max-w-sm sm:max-w-md">
          <div className="bg-slate-950/95 backdrop-blur-md border border-amber-500/40 rounded-2xl shadow-2xl p-3 sm:p-3.5 text-slate-100 flex flex-col gap-2 transition-all">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                <span className="font-serif font-bold text-sm sm:text-base text-white truncate">
                  {selectedEntity.name}
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                  {selectedEntity.type}
                </span>
              </div>

              <button
                onClick={() => onSelectEntity('')}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                title="Deselect entity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
              {selectedEntity.description}
            </p>

            {/* User-Controlled Action: Explicit "Show Nearby" Toggle */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setIsNearbyVisible(!isNearbyVisible)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  isNearbyVisible
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{isNearbyVisible ? 'Hide Nearby Places' : 'Explore Nearby Places'}</span>
                {isNearbyVisible && (
                  <span className="ml-1 text-[10px] font-mono px-1 rounded bg-black/20">
                    {surroundingPlaces.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setStreetViewCoords(selectedEntity.coordinates);
                  setStreetViewName(selectedEntity.name);
                  setIsStreetViewOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium flex items-center gap-1 transition-colors"
                title="Launch 360° Ground Panorama"
              >
                <Camera className="w-3.5 h-3.5 text-sky-400" />
                <span>360°</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. TOP-RIGHT: DEDICATED MAP CONTROL PANEL (PRIMARY & SECONDARY ARCHITECTURE) */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[1500] map-floating-overlay pointer-events-auto flex flex-col items-end">
        {!isLayersPanelOpen ? (
          <button
            onClick={() => setIsLayersPanelOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-amber-500/50 shadow-2xl text-slate-100 hover:text-amber-400 hover:border-amber-400 transition-all font-medium text-xs group pointer-events-auto"
            title="Open Map Layer Controls"
          >
            <div className="w-5 h-5 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold tracking-wide">Map Layers & Views</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {primaryMap} · +{secondaryLayers.length}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        ) : (
          <div className="w-72 sm:w-84 max-w-[calc(100vw-2rem)] bg-slate-950/98 backdrop-blur-2xl border border-amber-500/40 rounded-2xl shadow-2xl p-3 sm:p-4 text-slate-100 flex flex-col gap-3 max-h-[calc(100dvh-13rem)] overflow-y-auto no-scrollbar pointer-events-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Map Layers & Views
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    User-Controlled Digital Atlas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleSaveMapConfig}
                  className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isSavedFeedback
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'hover:bg-slate-850 text-slate-400 hover:text-amber-400'
                  }`}
                  title="Save preferred map configuration"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsLayersPanelOpen(false)}
                  className="w-6 h-6 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                  title="Collapse Layer Panel"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PRESETS SHORTCUTS */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Quick Presets
              </span>
              <div className="grid grid-cols-3 gap-1 text-[10px] font-medium">
                <button
                  onClick={() => handleApplyPreset('physical')}
                  className={`py-1 px-1.5 rounded-lg text-center transition-colors border ${
                    primaryMap === 'PHYSICAL' && secondaryLayers.length === 0
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Physical
                </button>
                <button
                  onClick={() => handleApplyPreset('political')}
                  className={`py-1 px-1.5 rounded-lg text-center transition-colors border ${
                    primaryMap === 'POLITICAL' && secondaryLayers.length === 0
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Political
                </button>
                <button
                  onClick={() => handleApplyPreset('economical')}
                  className={`py-1 px-1.5 rounded-lg text-center transition-colors border ${
                    primaryMap === 'ECONOMICAL' && secondaryLayers.length === 0
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Economic
                </button>
                <button
                  onClick={() => handleApplyPreset('satellite')}
                  className={`py-1 px-1.5 rounded-lg text-center transition-colors border ${
                    secondaryLayers.includes('SATELLITE')
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Satellite
                </button>
                <button
                  onClick={() => handleApplyPreset('terrain')}
                  className={`py-1 px-1.5 rounded-lg text-center transition-colors border ${
                    secondaryLayers.includes('TERRAIN')
                      ? 'bg-teal-500/20 border-teal-500/50 text-teal-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Terrain
                </button>
                <button
                  onClick={handleLoadMapConfig}
                  className="py-1 px-1.5 rounded-lg text-center bg-slate-900 border border-slate-800 text-amber-400 hover:bg-slate-800 transition-colors"
                  title="Restore saved map configuration"
                >
                  Saved Map
                </button>
              </div>
            </div>

            {/* 1. PRIMARY MAP (MUTUALLY EXCLUSIVE RADIO BUTTONS) */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                  <span>Primary Map</span>
                  <span className="text-[9px] text-amber-400 lowercase font-normal">(choose exactly 1)</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono font-bold">
                  ◉ {primaryMap}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1.5" role="radiogroup" aria-label="Primary Map Type">
                {/* 1. PHYSICAL MAP */}
                <button
                  role="radio"
                  aria-checked={primaryMap === 'PHYSICAL'}
                  onClick={() => handleSelectPrimary('PHYSICAL')}
                  className={`flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                    primaryMap === 'PHYSICAL'
                      ? 'bg-emerald-950/70 border border-emerald-500/80 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-900/70 border border-slate-800/70 hover:bg-slate-800/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        primaryMap === 'PHYSICAL'
                          ? 'border-emerald-400 bg-emerald-500/20'
                          : 'border-slate-600 bg-transparent'
                      }`}
                    >
                      {primaryMap === 'PHYSICAL' && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                    </div>
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        primaryMap === 'PHYSICAL' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-emerald-400'
                      }`}
                    >
                      <TreePine className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <span>Physical Map</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Mountains, relief, rivers, biomes
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      primaryMap === 'PHYSICAL'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-500'
                    }`}
                  >
                    {primaryMap === 'PHYSICAL' ? 'ACTIVE' : 'OFF'}
                  </span>
                </button>

                {/* 2. POLITICAL MAP */}
                <button
                  role="radio"
                  aria-checked={primaryMap === 'POLITICAL'}
                  onClick={() => handleSelectPrimary('POLITICAL')}
                  className={`flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                    primaryMap === 'POLITICAL'
                      ? 'bg-blue-950/70 border border-blue-500/80 shadow-md shadow-blue-500/10'
                      : 'bg-slate-900/70 border border-slate-800/70 hover:bg-slate-800/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        primaryMap === 'POLITICAL'
                          ? 'border-blue-400 bg-blue-500/20'
                          : 'border-slate-600 bg-transparent'
                      }`}
                    >
                      {primaryMap === 'POLITICAL' && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                    </div>
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        primaryMap === 'POLITICAL' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-blue-400'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <span>Political Map</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Country borders, states & capitals
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      primaryMap === 'POLITICAL'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'text-slate-500'
                    }`}
                  >
                    {primaryMap === 'POLITICAL' ? 'ACTIVE' : 'OFF'}
                  </span>
                </button>

                {/* 3. ECONOMICAL MAP */}
                <button
                  role="radio"
                  aria-checked={primaryMap === 'ECONOMICAL'}
                  onClick={() => handleSelectPrimary('ECONOMICAL')}
                  className={`flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                    primaryMap === 'ECONOMICAL'
                      ? 'bg-amber-950/70 border border-amber-500/80 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/70 border border-slate-800/70 hover:bg-slate-800/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        primaryMap === 'ECONOMICAL'
                          ? 'border-amber-400 bg-amber-500/20'
                          : 'border-slate-600 bg-transparent'
                      }`}
                    >
                      {primaryMap === 'ECONOMICAL' && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                    </div>
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        primaryMap === 'ECONOMICAL' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <span>Economical Map</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Trade corridors, ports, industries
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      primaryMap === 'ECONOMICAL'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-500'
                    }`}
                  >
                    {primaryMap === 'ECONOMICAL' ? 'ACTIVE' : 'OFF'}
                  </span>
                </button>
              </div>
            </div>

            {/* 2. SECONDARY MAP LAYERS (INDEPENDENT COMPATIBLE TOGGLES) */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Secondary Layers
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {secondaryLayers.length} active
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {/* 1. SATELLITE */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleToggleSecondary('SATELLITE')}
                    className={`flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                      secondaryLayers.includes('SATELLITE')
                        ? 'bg-cyan-950/60 border border-cyan-500/80 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900/70 border border-slate-800/70 hover:bg-slate-800/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                          secondaryLayers.includes('SATELLITE')
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-cyan-400'
                        }`}
                      >
                        <Satellite className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">Satellite</div>
                        <div className="text-[10px] text-slate-400">Orbital earth imagery</div>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        secondaryLayers.includes('SATELLITE')
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-slate-500'
                      }`}
                    >
                      {secondaryLayers.includes('SATELLITE') ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Satellite Opacity Slider */}
                  {secondaryLayers.includes('SATELLITE') && (
                    <div className="px-2 py-1 bg-slate-900/50 rounded-lg flex items-center justify-between text-[10px] text-slate-400">
                      <span>Opacity: {Math.round((layerOpacity.SATELLITE || 0.9) * 100)}%</span>
                      <input
                        type="range"
                        min="0.2"
                        max="1"
                        step="0.05"
                        value={layerOpacity.SATELLITE || 0.9}
                        onChange={(e) => handleOpacityChange('SATELLITE', parseFloat(e.target.value))}
                        className="w-28 accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* 2. STREET */}
                <button
                  onClick={() => handleToggleSecondary('STREET')}
                  className={`flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                    secondaryLayers.includes('STREET')
                      ? 'bg-amber-950/60 border border-amber-500/80 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/70 border border-slate-800/70 hover:bg-slate-800/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        secondaryLayers.includes('STREET')
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-amber-400'
                      }`}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">Street</div>
                      <div className="text-[10px] text-slate-400">Roads & navigation grid</div>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      secondaryLayers.includes('STREET')
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-500'
                    }`}
                  >
                    {secondaryLayers.includes('STREET') ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* 3. TERRAIN */}
                <button
                  onClick={() => handleToggleSecondary('TERRAIN')}
                  className={`flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                    secondaryLayers.includes('TERRAIN')
                      ? 'bg-teal-950/60 border border-teal-500/80 shadow-md shadow-teal-500/10'
                      : 'bg-slate-900/70 border border-slate-800/70 hover:bg-slate-800/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        secondaryLayers.includes('TERRAIN')
                          ? 'bg-teal-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-teal-400'
                      }`}
                    >
                      <Mountain className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">Terrain</div>
                      <div className="text-[10px] text-slate-400">Topography & contours</div>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      secondaryLayers.includes('TERRAIN')
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                        : 'text-slate-500'
                    }`}
                  >
                    {secondaryLayers.includes('TERRAIN') ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* 4. TRAFFIC */}
                <button
                  onClick={() => handleToggleSecondary('TRAFFIC')}
                  className={`flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                    secondaryLayers.includes('TRAFFIC')
                      ? 'bg-orange-950/60 border border-orange-500/80 shadow-md shadow-orange-500/10'
                      : 'bg-slate-900/70 border border-slate-800/70 hover:bg-slate-800/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        secondaryLayers.includes('TRAFFIC')
                          ? 'bg-orange-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-orange-400'
                      }`}
                    >
                      <Car className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">Traffic</div>
                      <div className="text-[10px] text-slate-400">Live arterial road flow</div>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      secondaryLayers.includes('TRAFFIC')
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                        : 'text-slate-500'
                    }`}
                  >
                    {secondaryLayers.includes('TRAFFIC') ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* 5. WILDFIRES */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleToggleSecondary('WILDFIRES')}
                    className={`flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                      secondaryLayers.includes('WILDFIRES')
                        ? 'bg-rose-950/70 border border-rose-500/80 shadow-md shadow-rose-500/20'
                        : 'bg-slate-900/70 border border-slate-800/70 hover:bg-slate-800/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                          secondaryLayers.includes('WILDFIRES')
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-slate-800 text-rose-400'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">Wildfires</div>
                        <div className="text-[10px] text-slate-400">NASA FIRMS active hotspots</div>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        secondaryLayers.includes('WILDFIRES')
                          ? 'bg-rose-600 text-white font-bold'
                          : 'text-slate-500'
                      }`}
                    >
                      {secondaryLayers.includes('WILDFIRES') ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Wildfires Opacity Slider */}
                  {secondaryLayers.includes('WILDFIRES') && (
                    <div className="px-2 py-1 bg-slate-900/50 rounded-lg flex items-center justify-between text-[10px] text-slate-400">
                      <span>Opacity: {Math.round((layerOpacity.WILDFIRES || 0.85) * 100)}%</span>
                      <input
                        type="range"
                        min="0.2"
                        max="1"
                        step="0.05"
                        value={layerOpacity.WILDFIRES || 0.85}
                        onChange={(e) => handleOpacityChange('WILDFIRES', parseFloat(e.target.value))}
                        className="w-28 accent-rose-500 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* 6. AIR QUALITY */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleToggleSecondary('AIRQUALITY')}
                    className={`flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                      secondaryLayers.includes('AIRQUALITY')
                        ? 'bg-teal-950/60 border border-teal-500/80 shadow-md shadow-teal-500/10'
                        : 'bg-slate-900/70 border border-slate-800/70 hover:bg-slate-800/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                          secondaryLayers.includes('AIRQUALITY')
                            ? 'bg-teal-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-teal-400'
                        }`}
                      >
                        <Wind className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">Air Quality</div>
                        <div className="text-[10px] text-slate-400">WAQI real-time PM2.5 AQI</div>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        secondaryLayers.includes('AIRQUALITY')
                          ? 'bg-teal-500 text-slate-950 font-bold'
                          : 'text-slate-500'
                      }`}
                    >
                      {secondaryLayers.includes('AIRQUALITY') ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Air Quality Opacity Slider */}
                  {secondaryLayers.includes('AIRQUALITY') && (
                    <div className="px-2 py-1 bg-slate-900/50 rounded-lg flex items-center justify-between text-[10px] text-slate-400">
                      <span>Opacity: {Math.round((layerOpacity.AIRQUALITY || 0.75) * 100)}%</span>
                      <input
                        type="range"
                        min="0.2"
                        max="1"
                        step="0.05"
                        value={layerOpacity.AIRQUALITY || 0.75}
                        onChange={(e) => handleOpacityChange('AIRQUALITY', parseFloat(e.target.value))}
                        className="w-28 accent-teal-400 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. DYNAMIC LAYER LEGENDS SECTION */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setIsLegendsOpen(!isLegendsOpen)}
                className="w-full flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold hover:text-white transition-colors"
              >
                <span>Active Legends</span>
                {isLegendsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {isLegendsOpen && (
                <div className="mt-2 space-y-2 text-[10px] bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                  {secondaryLayers.includes('AIRQUALITY') && (
                    <div className="space-y-1">
                      <span className="font-semibold text-teal-400">Air Quality Index (AQI):</span>
                      <div className="h-2 w-full rounded-full bg-linear-to-r from-emerald-500 via-amber-400 to-rose-600" />
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                        <span>0 (Good)</span>
                        <span>100 (Mod)</span>
                        <span>300+ (Hazardous)</span>
                      </div>
                    </div>
                  )}

                  {secondaryLayers.includes('WILDFIRES') && (
                    <div className="space-y-1">
                      <span className="font-semibold text-rose-400">Fire Thermal Energy (FRP):</span>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-slate-300">NASA FIRMS active infrared hotspots</span>
                      </div>
                    </div>
                  )}

                  {secondaryLayers.includes('TRAFFIC') && (
                    <div className="space-y-1">
                      <span className="font-semibold text-orange-400">Traffic Congestion:</span>
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span className="text-emerald-400">■ Free Flow</span>
                        <span className="text-amber-400">■ Moderate</span>
                        <span className="text-rose-400">■ Heavy</span>
                      </div>
                    </div>
                  )}

                  {primaryMap === 'PHYSICAL' && (
                    <div className="space-y-1">
                      <span className="font-semibold text-emerald-400">Terrain Relief Elevation:</span>
                      <div className="h-2 w-full rounded-full bg-linear-to-r from-teal-700 via-yellow-600 to-amber-100" />
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                        <span>0m Sea Level</span>
                        <span>4,000m Alpine</span>
                        <span>8,848m Peak</span>
                      </div>
                    </div>
                  )}

                  {!secondaryLayers.includes('AIRQUALITY') &&
                    !secondaryLayers.includes('WILDFIRES') &&
                    !secondaryLayers.includes('TRAFFIC') &&
                    primaryMap !== 'PHYSICAL' && (
                      <span className="text-slate-500 italic">No dynamic overlays requiring legends.</span>
                    )}
                </div>
              )}
            </div>

            {/* Quick Action Footer */}
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/80">
              <button
                onClick={handleResetToWorld}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-colors"
                title="Reset to Full World View"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>World View</span>
              </button>

              <button
                onClick={() => {
                  const center = mapInstanceRef.current
                    ? mapInstanceRef.current.getCenter()
                    : { lat: 20.5937, lng: 78.9629 };
                  setStreetViewCoords([center.lat, center.lng]);
                  setStreetViewName('Selected Center');
                  setIsStreetViewOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-colors"
                title="Launch 360° Ground Panorama Viewer"
              >
                <Camera className="w-3.5 h-3.5 text-sky-400" />
                <span>Street View</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. BOTTOM DOCK: NEARBY PLACES (STRICTLY SHOWN ONLY IF USER EXPLICITLY CLICKS "SHOW NEARBY") */}
      {isNearbyVisible && surroundingPlaces.length > 0 && (
        <div className="absolute bottom-4 left-3 right-3 sm:left-24 sm:right-auto sm:max-w-2xl z-[1500] map-floating-overlay pointer-events-auto">
          <div className="bg-slate-950/95 backdrop-blur-md border border-amber-500/40 rounded-2xl shadow-2xl p-3 text-slate-100 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  Nearby Places in Context
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    {surroundingPlaces.length}
                  </span>
                </h4>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  onClick={() => setSurroundingCategoryFilter('all')}
                  className={`px-2 py-0.5 rounded-md ${
                    surroundingCategoryFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSurroundingCategoryFilter('towns')}
                  className={`px-2 py-0.5 rounded-md ${
                    surroundingCategoryFilter === 'towns'
                      ? 'bg-indigo-500 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cities
                </button>
                <button
                  onClick={() => setSurroundingCategoryFilter('mountains')}
                  className={`px-2 py-0.5 rounded-md ${
                    surroundingCategoryFilter === 'mountains'
                      ? 'bg-emerald-500 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mountains
                </button>
                <button
                  onClick={() => setSurroundingCategoryFilter('rivers')}
                  className={`px-2 py-0.5 rounded-md ${
                    surroundingCategoryFilter === 'rivers'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Rivers
                </button>

                <button
                  onClick={() => setIsNearbyVisible(false)}
                  className="ml-2 text-slate-400 hover:text-rose-400 p-0.5"
                  title="Close nearby places"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Horizontal Carousel */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {surroundingPlaces
                .filter((place) => {
                  if (surroundingCategoryFilter === 'towns') {
                    return ['city', 'town', 'village', 'district'].includes(place.type);
                  }
                  if (surroundingCategoryFilter === 'mountains') {
                    return ['mountain', 'volcano', 'mountain_range'].includes(place.type);
                  }
                  if (surroundingCategoryFilter === 'rivers') {
                    return ['river', 'lake', 'wetland', 'sea', 'ocean', 'waterway'].includes(place.type);
                  }
                  return true;
                })
                .map((place) => {
                  const isMountain = ['mountain', 'volcano', 'mountain_range'].includes(place.type);
                  const isRiver = ['river', 'lake', 'wetland', 'waterway'].includes(place.type);
                  const isTown = ['city', 'town', 'village', 'district'].includes(place.type);
                  const emoji = isMountain ? '🏔️' : isRiver ? '🌊' : isTown ? '🏙️' : getCategoryEmoji(place.type);
                  const tagColor = isMountain
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : isRiver
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : isTown
                    ? 'text-indigo-400 bg-indigo-500/10'
                    : 'text-amber-400 bg-amber-500/10';

                  return (
                    <button
                      key={place.id}
                      onClick={() => {
                        onSelectEntity(place.id);
                        if (mapInstanceRef.current && place.coordinates) {
                          mapInstanceRef.current.flyTo(place.coordinates, 10.5, { duration: 1.2 });
                        }
                      }}
                      className="flex flex-col text-left p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800/80 hover:border-amber-500/50 transition-all shrink-0 w-44 group shadow-sm"
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-sm">{emoji}</span>
                        <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${tagColor}`}>
                          {place.type}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-white truncate w-full group-hover:text-amber-300 transition-colors">
                        {place.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate w-full mt-0.5 flex items-center justify-between">
                        <span className="truncate">{place.parentName || 'Surrounding'}</span>
                        {place.distanceKm !== undefined && (
                          <span className="font-mono text-amber-400/90 font-semibold ml-1 shrink-0">
                            {place.distanceKm} km
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Street View 360° Modal */}
      <StreetViewModal
        isOpen={isStreetViewOpen}
        onClose={() => setIsStreetViewOpen(false)}
        coordinates={streetViewCoords}
        locationName={streetViewName}
      />
    </div>
  );
};
