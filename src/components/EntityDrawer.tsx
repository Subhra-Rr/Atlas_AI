import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import {
  GeographicEntity,
  WeatherData,
  ClimateData,
  RainfallData,
  AgricultureData,
  EconomicData,
  CommercialData,
  PopulationData,
  CultureData,
  NaturalHazard,
  HistoricalRecord,
  User
} from '../types/atlas.js';
import { TrustIndicator } from './TrustIndicator.js';
import { SourceBadge } from './SourceBadge.js';
import { SubmitCorrectionModal } from './SubmitCorrectionModal.js';
import {
  X,
  RefreshCw,
  Thermometer,
  CloudRain,
  Sprout,
  TrendingUp,
  Landmark,
  ShieldAlert,
  History,
  FileText,
  MapPin,
  Bookmark,
  Share2,
  ExternalLink,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface EntityDrawerProps {
  entityId: string | null;
  onClose: () => void;
  user: User | null;
  onToggleFollow?: (entityId: string) => void;
  isFollowed?: boolean;
  onSelectEntity?: (entityId: string) => void;
}

export const EntityDrawer: React.FC<EntityDrawerProps> = ({
  entityId,
  onClose,
  user,
  onToggleFollow,
  isFollowed = false,
  onSelectEntity
}) => {
  const [entity, setEntity] = useState<GeographicEntity | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(false);
  const [refreshingWeather, setRefreshingWeather] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);

  // Domain states
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [climate, setClimate] = useState<ClimateData | null>(null);
  const [rainfall, setRainfall] = useState<RainfallData | null>(null);
  const [agriculture, setAgriculture] = useState<AgricultureData | null>(null);
  const [economy, setEconomy] = useState<EconomicData | null>(null);
  const [commerce, setCommerce] = useState<CommercialData | null>(null);
  const [population, setPopulation] = useState<PopulationData | null>(null);
  const [culture, setCulture] = useState<CultureData | null>(null);
  const [hazards, setHazards] = useState<NaturalHazard[]>([]);
  const [historical, setHistorical] = useState<HistoricalRecord[]>([]);
  const [surroundingPlaces, setSurroundingPlaces] = useState<GeographicEntity[]>([]);

  useEffect(() => {
    if (!entityId) {
      setEntity(null);
      setSurroundingPlaces([]);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const ent = await api.getEntity(entityId);
        setEntity(ent);

        // Fetch surrounding places and domain datasets concurrently
        const [w, c, r, a, e, com, p, cul, h, hist, surr] = await Promise.allSettled([
          api.getWeather(entityId),
          api.getClimate(entityId),
          api.getRainfall(entityId),
          api.getAgriculture(entityId),
          api.getEconomy(entityId),
          api.getCommerce(entityId),
          api.getPopulation(entityId),
          api.getCulture(entityId),
          api.getHazards(entityId),
          api.getHistorical(entityId),
          ent?.coordinates ? api.getSurrounding({ entityId, lat: ent.coordinates[0], lng: ent.coordinates[1], radiusKm: 250 }) : Promise.resolve([])
        ]);

        if (w.status === 'fulfilled') setWeather(w.value);
        if (c.status === 'fulfilled') setClimate(c.value);
        if (r.status === 'fulfilled') setRainfall(r.value);
        if (a.status === 'fulfilled') setAgriculture(a.value);
        if (e.status === 'fulfilled') setEconomy(e.value);
        if (com.status === 'fulfilled') setCommerce(com.value);
        if (p.status === 'fulfilled') setPopulation(p.value);
        if (cul.status === 'fulfilled') setCulture(cul.value);
        if (h.status === 'fulfilled') setHazards(h.value);
        if (hist.status === 'fulfilled') setHistorical(hist.value);
        if (surr.status === 'fulfilled' && Array.isArray(surr.value)) setSurroundingPlaces(surr.value);
      } catch (err) {
        console.error('Failed to load entity details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [entityId]);

  const handleRefreshWeather = async () => {
    if (!entityId) return;
    setRefreshingWeather(true);
    try {
      const res = await api.refreshWeather(entityId);
      setWeather(res.data);
    } catch (err) {
      console.error('Failed to refresh weather observation:', err);
    } finally {
      setRefreshingWeather(false);
    }
  };

  const [copiedShare, setCopiedShare] = useState(false);

  const handleShare = async () => {
    if (!entity) return;
    try {
      const shareData = {
        title: `${entity.name} | ATLASAI World Atlas`,
        text: `Explore ${entity.name} (${entity.type}) on ATLASAI verified cartography platform.`,
        url: window.location.href
      };
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}?entity=${entity.id}`);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2200);
      }
    } catch {
      // User cancelled or clipboard fallback
    }
  };

  if (!entityId) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: MapPin },
    { id: 'weather', label: 'Weather', icon: Thermometer },
    { id: 'rainfall', label: 'Rainfall', icon: CloudRain },
    { id: 'agriculture', label: 'Agriculture & Crops', icon: Sprout },
    { id: 'economy', label: 'Economy & Commerce', icon: TrendingUp },
    { id: 'culture', label: 'Culture & Festivals', icon: Landmark },
    { id: 'hazards', label: 'Hazards & Vulnerability', icon: ShieldAlert },
    { id: 'history', label: 'Historical Geography', icon: History },
    { id: 'provenance', label: 'Provenance & Audit', icon: FileText }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[2000] map-floating-overlay md:hidden animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 z-[2000] map-floating-overlay w-full sm:w-[500px] lg:w-[580px] bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-300">
        {loading && !entity ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
            <div className="w-10 h-10 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            <div className="text-center">
              <h3 className="text-sm font-semibold text-slate-200">Loading Geographic Intelligence...</h3>
              <p className="text-xs text-slate-400 mt-1">Retrieving verified cartographic & domain datasets</p>
            </div>
          </div>
        ) : !entity ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <div className="text-sm text-slate-300">Entity details could not be retrieved.</div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Drawer Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/90">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-100 tracking-wide truncate">
                      {entity.name}
                    </h2>
                    {entity.nativeName && (
                      <span className="text-sm font-sans text-amber-400/90 truncate">
                        ({entity.nativeName})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-mono uppercase text-amber-400 font-bold px-1.5 py-0.5 bg-amber-950/60 border border-amber-800/80 rounded">
                      {entity.type}
                    </span>
                    {entity.parentName && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs text-slate-400 truncate">{entity.parentName}</span>
                      </>
                    )}
                    <span className="text-slate-600">·</span>
                    <TrustIndicator
                      status={entity.sources.verificationStatus}
                      verifiedAt={entity.sources.verifiedAt}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Share button */}
                  <button
                    onClick={handleShare}
                    title="Share Geographic Entity Link"
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors relative"
                    aria-label="Share entity"
                  >
                    <Share2 className="w-4 h-4" />
                    {copiedShare && (
                      <span className="absolute -bottom-7 right-0 whitespace-nowrap bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded shadow">
                        Copied!
                      </span>
                    )}
                  </button>

                  {onToggleFollow && (
                    <button
                      onClick={() => onToggleFollow(entity.id)}
                      title={isFollowed ? 'Unfollow Location' : 'Follow Location Updates'}
                      className={`p-2 rounded-lg transition-colors ${
                        isFollowed ? 'text-amber-400 bg-amber-950/50 border border-amber-800' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                      }`}
                      aria-label="Bookmark entity"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                    aria-label="Close details"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-3.5 no-scrollbar border-t border-slate-800/70 mt-3.5">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors touch-manipulation min-h-[38px] ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                {entity.description}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/60 border border-slate-800 p-3 rounded">
                  <div className="text-[11px] font-mono text-slate-500 uppercase">Coordinates</div>
                  <div className="text-sm font-mono text-slate-200 mt-0.5">
                    {entity.coordinates[0].toFixed(4)}°N, {entity.coordinates[1].toFixed(4)}°E
                  </div>
                </div>

                {entity.capital && (
                  <div className="bg-slate-950/60 border border-slate-800 p-3 rounded">
                    <div className="text-[11px] font-mono text-slate-500 uppercase">Capital / HQ</div>
                    <div className="text-sm font-semibold text-slate-200 mt-0.5">{entity.capital}</div>
                  </div>
                )}

                {entity.areaKm2 && (
                  <div className="bg-slate-950/60 border border-slate-800 p-3 rounded">
                    <div className="text-[11px] font-mono text-slate-500 uppercase">Geographic Area</div>
                    <div className="text-sm font-mono text-slate-200 mt-0.5">
                      {entity.areaKm2.toLocaleString()} sq km
                    </div>
                  </div>
                )}

                {entity.population && (
                  <div className="bg-slate-950/60 border border-slate-800 p-3 rounded">
                    <div className="text-[11px] font-mono text-slate-500 uppercase">Population</div>
                    <div className="text-sm font-mono text-slate-200 mt-0.5">
                      {entity.population.toLocaleString()}
                    </div>
                  </div>
                )}

                {entity.elevationM && (
                  <div className="bg-slate-950/60 border border-slate-800 p-3 rounded">
                    <div className="text-[11px] font-mono text-slate-500 uppercase">Elevation Peak</div>
                    <div className="text-sm font-mono text-slate-200 mt-0.5">
                      {entity.elevationM} meters
                    </div>
                  </div>
                )}
              </div>

              {/* Surrounding Places & Adjacent Areas in this Region */}
              {surroundingPlaces.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>Surrounding Areas ({surroundingPlaces.length})</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">In this vicinity</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {surroundingPlaces.slice(0, 10).map((place) => (
                      <button
                        key={place.id}
                        onClick={() => {
                          if (onSelectEntity) {
                            onSelectEntity(place.id);
                          }
                        }}
                        className="text-left p-2.5 rounded-lg bg-slate-950/70 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/50 transition-all flex flex-col group"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 transition-colors truncate">
                            {place.name}
                          </span>
                          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {place.type}
                          </span>
                        </div>
                        {place.parentName && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {place.parentName}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Source Provenance Box */}
              <div className="pt-2">
                <div className="text-[11px] font-mono uppercase text-slate-400 mb-2">Authoritative Citation:</div>
                <SourceBadge metadata={entity.sources} showDetails />
              </div>
            </div>
          )}

          {/* TAB 2: WEATHER */}
          {activeTab === 'weather' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">Surface Meteorology</h3>
                  <p className="text-xs text-slate-400">Open-Meteo & IMD High-Resolution Gridded Observation</p>
                </div>
                <button
                  onClick={handleRefreshWeather}
                  disabled={refreshingWeather}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40 rounded transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingWeather ? 'animate-spin' : ''}`} />
                  <span>{refreshingWeather ? 'Ingesting...' : 'Refresh Live'}</span>
                </button>
              </div>

              {weather ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-4xl font-mono font-bold text-slate-100">
                          {weather.temperatureC.toFixed(1)}°C
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Feels like {weather.feelsLikeC.toFixed(1)}°C · {weather.condition}
                        </div>
                      </div>
                      <TrustIndicator status={weather.metadata.dataStatus} />
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
                      <div>
                        <div className="text-slate-500 font-mono">Precipitation</div>
                        <div className="font-mono text-slate-200 font-semibold">{weather.rainfallMm} mm</div>
                      </div>
                      <div>
                        <div className="text-slate-500 font-mono">Relative Humidity</div>
                        <div className="font-mono text-slate-200 font-semibold">{weather.humidityPct}%</div>
                      </div>
                      <div>
                        <div className="text-slate-500 font-mono">Surface Pressure</div>
                        <div className="font-mono text-slate-200 font-semibold">{weather.pressureHpa} hPa</div>
                      </div>
                      <div>
                        <div className="text-slate-500 font-mono">Wind Speed</div>
                        <div className="font-mono text-slate-200 font-semibold">{weather.windSpeedKph} km/h</div>
                      </div>
                      <div>
                        <div className="text-slate-500 font-mono">Cloud Cover</div>
                        <div className="font-mono text-slate-200 font-semibold">{weather.cloudCoverPct}%</div>
                      </div>
                      <div>
                        <div className="text-slate-500 font-mono">UV Index</div>
                        <div className="font-mono text-slate-200 font-semibold">{weather.uvIndex}</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono">
                    Observation Timestamp: {new Date(weather.observationTime).toLocaleString()}
                  </div>

                  <SourceBadge metadata={weather.metadata} showDetails />
                </div>
              ) : (
                <div className="p-4 bg-slate-950/40 border border-slate-800 text-xs text-slate-400 rounded">
                  No meteorological observation currently available for this entity.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RAINFALL & CLIMATE */}
          {activeTab === 'rainfall' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Hydro-Meteorological Rainfall</h3>
                <p className="text-xs text-slate-400">Precipitation Climatology & Annual Monsoon Dynamics</p>
              </div>

              {rainfall && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950/60 border border-slate-800 p-3 rounded">
                      <div className="text-[11px] font-mono text-slate-500 uppercase">Annual Average</div>
                      <div className="text-lg font-mono font-bold text-sky-400 mt-0.5">
                        {rainfall.annualAverageMm} mm
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">IMD 30-year normal baseline</div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 p-3 rounded">
                      <div className="text-[11px] font-mono text-slate-500 uppercase">Current Hydromet Total</div>
                      <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
                        {rainfall.currentYearTotalMm} mm
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        Anomaly: {rainfall.rainfallAnomalyPct > 0 ? '+' : ''}{rainfall.rainfallAnomalyPct}%
                      </div>
                    </div>
                  </div>

                  {/* Monthly Precipitation Distribution Table */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                    <div className="text-xs font-semibold text-slate-200 mb-2 font-mono">
                      Monthly Rainfall Distribution (mm)
                    </div>
                    <div className="grid grid-cols-6 gap-2 text-center text-xs font-mono">
                      {rainfall.monthlyRainfallMm.map((m) => (
                        <div key={m.month} className="p-1.5 bg-slate-900 border border-slate-800/80 rounded">
                          <div className="text-[10px] text-slate-400">{m.month}</div>
                          <div className="font-bold text-sky-300 mt-0.5">{m.mm}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <SourceBadge metadata={rainfall.metadata} showDetails />
                </div>
              )}

              {/* Climate Classification */}
              {climate && (
                <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                  <h4 className="text-sm font-semibold text-slate-200 font-serif">Köppen Climate Classification</h4>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded text-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 px-2 py-0.5 bg-amber-950/60 rounded border border-amber-800">
                        {climate.koppenClassification}
                      </span>
                      <span className="text-slate-300">{climate.koppenDescription}</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">{climate.seasonalPatterns}</p>
                    <p className="text-slate-500 text-[11px] font-mono italic">Trend: {climate.observedTrend}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AGRICULTURE & CROPS */}
          {activeTab === 'agriculture' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Agricultural Geography & Crop Acreage</h3>
                <p className="text-xs text-slate-400">Directorate of Agriculture & Krushi Bhavan Official Statistics</p>
              </div>

              {agriculture ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950/60 border border-slate-800 p-3 rounded">
                      <div className="text-slate-500 font-mono">Agricultural Land</div>
                      <div className="text-base font-mono font-bold text-amber-400 mt-0.5">
                        {agriculture.agriculturalLandPct}%
                      </div>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800 p-3 rounded">
                      <div className="text-slate-500 font-mono">Irrigation Coverage</div>
                      <div className="text-base font-mono font-bold text-teal-400 mt-0.5">
                        {agriculture.irrigatedLandPct}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-mono uppercase text-slate-400 mb-2">Major Soil Classifications:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {agriculture.majorSoilTypes.map((soil) => (
                        <span
                          key={soil}
                          className="text-xs font-sans px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300"
                        >
                          {soil}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Crop Breakdown Cards */}
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-mono uppercase text-slate-400">Verified Crop Production (Kharif / Rabi):</div>
                    {agriculture.crops.map((crop) => (
                      <div
                        key={crop.name}
                        className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-slate-200 text-sm">{crop.name}</span>
                            <span className="text-xs text-slate-500 ml-2 font-mono">({crop.type})</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-amber-400 font-semibold">
                            {crop.season} Season
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1 border-t border-slate-800/80">
                          <div>
                            <div className="text-slate-500 text-[10px]">Acreage</div>
                            <div className="text-slate-200">{crop.areaCultivatedHa.toLocaleString()} ha</div>
                          </div>
                          <div>
                            <div className="text-slate-500 text-[10px]">Production</div>
                            <div className="text-slate-200">{crop.productionMetricTons.toLocaleString()} MT</div>
                          </div>
                          <div>
                            <div className="text-slate-500 text-[10px]">Average Yield</div>
                            <div className="text-amber-300 font-bold">{crop.yieldKgPerHa} kg/ha</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>Sowing: {crop.sowingMonths}</span>
                          <span>Harvest: {crop.harvestMonths}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <SourceBadge metadata={agriculture.metadata} showDetails />
                </div>
              ) : (
                <div className="p-4 bg-slate-950/40 border border-slate-800 text-xs text-slate-400 rounded">
                  No verified agricultural dataset found for this entity.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ECONOMY & COMMERCE */}
          {activeTab === 'economy' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Economic Profile & Commerce</h3>
                <p className="text-xs text-slate-400">Directorate of Economics & Statistics Verified Indicators</p>
              </div>

              {economy && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {economy.gsdpBillionUsd && (
                      <div className="bg-slate-950/60 border border-slate-800 p-3 rounded">
                        <div className="text-slate-500 font-mono">Gross District Product (GSDP)</div>
                        <div className="text-base font-mono font-bold text-slate-100 mt-0.5">
                          ${economy.gsdpBillionUsd} Billion USD
                        </div>
                      </div>
                    )}
                    {economy.gdpPerCapitaUsd && (
                      <div className="bg-slate-950/60 border border-slate-800 p-3 rounded">
                        <div className="text-slate-500 font-mono">GDP Per Capita</div>
                        <div className="text-base font-mono font-bold text-slate-100 mt-0.5">
                          ${economy.gdpPerCapitaUsd.toLocaleString()} USD
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-mono uppercase text-slate-400 mb-2">Key Industrial Clusters:</div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {economy.keyIndustries.map((ind, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400">•</span>
                          <span>{ind}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {commerce && commerce.majorPorts.length > 0 && (
                    <div className="pt-2">
                      <div className="text-xs font-mono uppercase text-slate-400 mb-2">Major Maritime Ports:</div>
                      {commerce.majorPorts.map((port) => (
                        <div key={port.name} className="p-2.5 bg-slate-950 border border-slate-800 rounded text-xs flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-slate-200">{port.name}</div>
                            <div className="text-[11px] text-slate-500">{port.type}</div>
                          </div>
                          {port.annualCargoMt && (
                            <span className="font-mono text-amber-400 text-xs font-semibold">
                              {port.annualCargoMt} MT/yr
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <SourceBadge metadata={economy.metadata} showDetails />
                </div>
              )}
            </div>
          )}

          {/* TAB 6: CULTURE & FESTIVALS */}
          {activeTab === 'culture' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Culture, Heritage & Living Festivals</h3>
                <p className="text-xs text-slate-400">Intangible Cultural Heritage & Astronomical Calendars</p>
              </div>

              {culture ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-mono uppercase text-slate-400 mb-1.5">Languages & Scripts:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {culture.primaryLanguages.map((lang) => (
                        <span key={lang} className="text-xs font-sans px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Festivals List */}
                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-mono uppercase text-slate-400">Regional Festivals & Observances:</div>
                    {culture.festivals.map((fest) => (
                      <div key={fest.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-serif font-bold text-slate-100 text-sm">{fest.name}</div>
                            {fest.nativeName && (
                              <div className="text-xs text-slate-400">{fest.nativeName}</div>
                            )}
                          </div>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800 text-purple-300">
                            {fest.datesRule}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{fest.culturalBackground}</p>
                        <div className="text-[11px] text-amber-400 font-mono">
                          Celebrated: {fest.approximateGregorianMonths} · Duration: {fest.durationDays} days
                        </div>
                      </div>
                    ))}
                  </div>

                  <SourceBadge metadata={culture.metadata} showDetails />
                </div>
              ) : (
                <div className="p-4 bg-slate-950/40 border border-slate-800 text-xs text-slate-400 rounded">
                  No cultural records found for this entity.
                </div>
              )}
            </div>
          )}

          {/* TAB 7: HAZARDS & VULNERABILITY */}
          {activeTab === 'hazards' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Disaster Vulnerability & Hazard History</h3>
                <p className="text-xs text-slate-400">Odisha State Disaster Management Authority (OSDMA) Records</p>
              </div>

              {hazards.length > 0 ? (
                <div className="space-y-3">
                  {hazards.map((h) => (
                    <div key={h.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="font-semibold text-slate-100 text-sm">{h.title}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 font-bold uppercase">
                          {h.severity} Severity
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{h.description}</p>
                      {h.casualtyOrImpactSummary && (
                        <div className="p-2 bg-slate-900 border border-slate-800/80 rounded text-[11px] text-slate-400 font-mono">
                          Impact: {h.casualtyOrImpactSummary}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500 font-mono">
                        Date: {h.dateOrPeriod} · Category: {h.category}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-950/40 border border-slate-800 text-xs text-slate-400 rounded">
                  No active hazard records or historical disaster events indexed for this specific entity.
                </div>
              )}
            </div>
          )}

          {/* TAB 8: HISTORICAL ATLAS */}
          {activeTab === 'history' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Historical Geography & Boundary Evolution</h3>
                <p className="text-xs text-slate-400">Chronological Administrative Atlas & Territorial Formations</p>
              </div>

              {historical.length > 0 ? (
                <div className="relative pl-4 border-l border-slate-800 space-y-6">
                  {historical.map((rec) => (
                    <div key={rec.id} className="relative space-y-1.5">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-slate-900" />
                      <div className="text-xs font-mono font-bold text-amber-400">{rec.yearOrEra}</div>
                      <div className="text-sm font-semibold text-slate-200">{rec.historicalName}</div>
                      <div className="text-xs text-slate-400">{rec.administrativeStatus}</div>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        {rec.historicalBoundariesSummary}
                      </p>
                      {rec.keyEvents.length > 0 && (
                        <ul className="space-y-1 text-xs text-slate-400 pt-1">
                          {rec.keyEvents.map((ev, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-amber-500">→</span>
                              <span>{ev}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-950/40 border border-slate-800 text-xs text-slate-400 rounded">
                  No historical boundary records found for this entity.
                </div>
              )}
            </div>
          )}

          {/* TAB 9: PROVENANCE & AUDIT */}
          {activeTab === 'provenance' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Dataset Provenance & Verification Audit</h3>
                <p className="text-xs text-slate-400">Immutable Lineage, Custodianship & Licensing</p>
              </div>

              <div className="space-y-4">
                <SourceBadge metadata={entity.sources} showDetails />

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2 text-xs">
                  <div className="font-semibold text-slate-200 font-mono uppercase text-[11px]">
                    Verification Policy
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    This entity has been verified in compliance with the ATLASAI Data Integrity Standard.
                    Any discrepancies between official state gazettes and satellite sensor readings trigger automated
                    <span className="text-amber-400 font-mono"> SOURCE_CONFLICT</span> records for human review.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Action */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={() => setIsCorrectionModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Report Data Problem / Submit Evidence</span>
          </button>

          <span className="text-[11px] font-mono text-slate-500">
            Atlas ID: {entity.id}
          </span>
        </div>
        </>
        )}
      </div>

      {/* Submit Correction Modal */}
      {entity && (
        <SubmitCorrectionModal
          isOpen={isCorrectionModalOpen}
          onClose={() => setIsCorrectionModalOpen(false)}
          entity={entity}
          user={user}
        />
      )}
    </>
  );
};
