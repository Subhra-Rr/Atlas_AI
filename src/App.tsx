import React, { useState, useEffect, useMemo } from 'react';
import { api } from './api/client.js';
import { GeographicEntity, MapLayerType, User } from './types/atlas.js';
import { Navbar } from './components/Navbar.js';
import { AtlasMap } from './components/AtlasMap.js';
import { EntityDrawer } from './components/EntityDrawer.js';
import { AskAtlasDock } from './components/AskAtlasDock.js';
import { AuthModal } from './components/AuthModal.js';
import { HistoricalAtlasPage } from './pages/HistoricalAtlasPage.js';
import { SourceExplorerPage } from './pages/SourceExplorerPage.js';
import { MethodologyPage } from './pages/MethodologyPage.js';
import { ReviewerDashboard } from './pages/ReviewerDashboard.js';
import { AdminDashboard } from './pages/AdminDashboard.js';
import {
  Globe,
  MapPin,
  Mountain,
  Compass,
  ChevronRight,
  ChevronLeft,
  Filter,
  Layers,
  History,
  BookOpen,
  FileCheck2,
  Shield,
  Menu,
  X,
  Sparkles,
  CheckCircle2,
  Radio
} from 'lucide-react';

type ScopeFilter = 'all' | 'continents' | 'countries' | 'states' | 'rivers' | 'mountains' | 'wonders';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('atlas');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [entities, setEntities] = useState<GeographicEntity[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null); // Global overview initially
  const [activeLayers, setActiveLayers] = useState<MapLayerType[]>(['POLITICAL', 'PHYSICAL']);
  const [mapTargetCoords, setMapTargetCoords] = useState<[number, number] | undefined>([22, 12]);
  const [mapTargetZoom, setMapTargetZoom] = useState<number | undefined>(2.8);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

  // Mobile-first responsive navigation sidebar state
  // On screens < 768px, it is collapsed into the hamburger menu by default
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  // On desktop (>= 768px), sidebar can be toggled open or closed
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(true);

  // Initialize session and entities
  useEffect(() => {
    const init = async () => {
      // Restore user if token exists
      if (api.getToken()) {
        try {
          const me = await api.getCurrentUser();
          setUser(me);
        } catch (e) {
          api.setToken(null);
        }
      }

      // Load all geographic entities
      try {
        const list = await api.getEntities();
        setEntities(list);
      } catch (err) {
        console.error('Failed to load entities:', err);
      }

      // Check review queue count if reviewer
      try {
        const queue = await api.getVerificationQueue('PENDING');
        setPendingReviewCount(queue.length);
      } catch (e) {
        // Not authorized or unauthenticated
      }
    };

    init();
  }, []);

  // Listen for decoupled explore-entity custom events from .atlas-popup-btn
  useEffect(() => {
    const handleExploreEvent = async (event: Event) => {
      const customEvent = event as CustomEvent<{ entityId: string }>;
      const entityId = customEvent.detail?.entityId;
      if (!entityId) return;

      setSelectedEntityId(entityId);
      setCurrentTab('atlas');

      // If entity is not yet loaded in local entities, fetch details and center map
      if (!entities.some(e => e.id === entityId)) {
        try {
          const fresh = await api.getEntity(entityId);
          if (fresh) {
            setEntities(prev => [...prev, fresh]);
            if (fresh.coordinates) {
              setMapTargetCoords(fresh.coordinates);
            }
          }
        } catch (err) {
          console.error('Failed to load explored entity details:', err);
        }
      } else {
        const existing = entities.find(e => e.id === entityId);
        if (existing?.coordinates) {
          setMapTargetCoords(existing.coordinates);
        }
      }
    };

    window.addEventListener('explore-entity', handleExploreEvent);
    (window as any).__exploreAtlasEntity = (entityId: string) => {
      window.dispatchEvent(new CustomEvent('explore-entity', { detail: { entityId } }));
    };

    return () => {
      window.removeEventListener('explore-entity', handleExploreEvent);
      delete (window as any).__exploreAtlasEntity;
    };
  }, [entities]);

  // Filtered entities based on active scope
  const filteredEntities = useMemo(() => {
    let result = entities;
    if (scopeFilter === 'continents') {
      result = entities.filter(e => e.type === 'continent');
    } else if (scopeFilter === 'countries') {
      result = entities.filter(e => e.type === 'country');
    } else if (scopeFilter === 'states') {
      result = entities.filter(e => e.type === 'state' || e.type === 'province' || e.type === 'district');
    } else if (scopeFilter === 'rivers') {
      result = entities.filter(e => e.type === 'river');
    } else if (scopeFilter === 'mountains') {
      result = entities.filter(e => e.type === 'mountain' || e.type === 'mountain_range' || e.type === 'volcano');
    } else if (scopeFilter === 'wonders') {
      result = entities.filter(e => ['wetland', 'lake', 'sea', 'ocean', 'desert', 'glacier', 'valley', 'island'].includes(e.type));
    }

    if (selectedEntityId && !result.some(e => e.id === selectedEntityId)) {
      const selected = entities.find(e => e.id === selectedEntityId);
      if (selected) {
        return [...result, selected];
      }
    }
    return result;
  }, [entities, scopeFilter, selectedEntityId]);

  const handleToggleLayer = (layer: MapLayerType) => {
    setActiveLayers((prev) =>
      prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer]
    );
  };

  const handleApplyAIAction = (action: {
    entityId?: string;
    layers?: MapLayerType[];
    coordinates?: [number, number];
    zoom?: number;
  }) => {
    if (action.entityId) {
      setSelectedEntityId(action.entityId);
    }
    if (action.layers && action.layers.length > 0) {
      setActiveLayers((prev) => Array.from(new Set([...prev, ...action.layers!])));
    }
    if (action.coordinates) {
      setMapTargetCoords(action.coordinates);
    }
    if (action.zoom) {
      setMapTargetZoom(action.zoom);
    }
    setCurrentTab('atlas');
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setCurrentTab('atlas');
    setIsMobileNavOpen(false);
  };

  const handleToggleFollow = async (entityId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const followed = await api.toggleFollow(entityId);
      setUser({ ...user, followedEntities: followed });
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  const handleFlyToRegion = (coords: [number, number], zoom: number, scope: ScopeFilter, entityId?: string) => {
    setMapTargetCoords(coords);
    setMapTargetZoom(zoom);
    setScopeFilter(scope);
    if (entityId) {
      setSelectedEntityId(entityId);
    }
    // Close mobile nav menu if open
    setIsMobileNavOpen(false);
  };

  const handleResetWorldView = () => {
    setSelectedEntityId(null);
    setScopeFilter('all');
    setMapTargetCoords([22, 12]);
    setMapTargetZoom(2.8);
    setIsMobileNavOpen(false);
  };

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    setIsMobileNavOpen(false);
  };

  const isReviewerOrAdmin = user && ['REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
  const isAdmin = user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

  // Reusable Sidebar content component for both desktop docking & mobile hamburger drawer
  const renderSidebarContent = (isMobileDrawer: boolean) => (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar py-3 px-3 space-y-4">
      {/* Mobile Drawer Header with Close Button */}
      {isMobileDrawer && (
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="font-serif font-bold text-sm text-slate-100 tracking-wider">ATLASAI</div>
              <div className="text-[10px] text-amber-400 font-mono">World Geospatial Atlas</div>
            </div>
          </div>
          <button
            onClick={() => setIsMobileNavOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Atlas Sections Navigation */}
      <div className="space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 py-1">
          Navigation
        </div>
        <button
          onClick={() => handleNavigate('atlas')}
          className={`w-full text-left px-2.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2.5 ${
            currentTab === 'atlas'
              ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-semibold shadow-xs'
              : 'text-slate-300 hover:bg-slate-900 hover:text-slate-100'
          }`}
        >
          <Globe className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Interactive World Map</span>
        </button>

        <button
          onClick={() => handleNavigate('historical')}
          className={`w-full text-left px-2.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2.5 ${
            currentTab === 'historical'
              ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-semibold shadow-xs'
              : 'text-slate-300 hover:bg-slate-900 hover:text-slate-100'
          }`}
        >
          <History className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Historical Atlas (1700s–Now)</span>
        </button>

        <button
          onClick={() => handleNavigate('sources')}
          className={`w-full text-left px-2.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2.5 ${
            currentTab === 'sources'
              ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-semibold shadow-xs'
              : 'text-slate-300 hover:bg-slate-900 hover:text-slate-100'
          }`}
        >
          <Shield className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Sources & Provenance</span>
        </button>

        <button
          onClick={() => handleNavigate('methodology')}
          className={`w-full text-left px-2.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2.5 ${
            currentTab === 'methodology'
              ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-semibold shadow-xs'
              : 'text-slate-300 hover:bg-slate-900 hover:text-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
          <span>Methodology & Standards</span>
        </button>

        {isReviewerOrAdmin && (
          <button
            onClick={() => handleNavigate('reviewer')}
            className={`w-full text-left px-2.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-between ${
              currentTab === 'reviewer'
                ? 'bg-teal-500/15 border border-teal-500/40 text-teal-300 font-semibold'
                : 'text-teal-400 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileCheck2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Verification Queue</span>
            </div>
            {pendingReviewCount > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] font-mono bg-teal-500 text-slate-950 rounded-full font-bold">
                {pendingReviewCount}
              </span>
            )}
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => handleNavigate('admin')}
            className={`w-full text-left px-2.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2.5 ${
              currentTab === 'admin'
                ? 'bg-amber-950/80 border border-amber-700 text-amber-200 font-semibold'
                : 'text-amber-400 hover:bg-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Admin Architecture</span>
          </button>
        )}
      </div>

      {/* Geographic Scope Filter */}
      <div className="space-y-1 pt-2 border-t border-slate-800/60">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
            Geographic Scope
          </span>
          <span className="text-[10px] font-mono text-amber-400/80">
            {filteredEntities.length} entities
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => {
              setScopeFilter('all');
              handleResetWorldView();
            }}
            className={`px-2 py-1.5 rounded text-[11px] font-medium transition-colors text-left flex items-center gap-1.5 ${
              scopeFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-900/80 border border-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>🌐</span>
            <span className="truncate">World</span>
          </button>

          <button
            onClick={() => {
              setScopeFilter('continents');
              handleFlyToRegion([20, 20], 3, 'continents');
            }}
            className={`px-2 py-1.5 rounded text-[11px] font-medium transition-colors text-left flex items-center gap-1.5 ${
              scopeFilter === 'continents'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-900/80 border border-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>🗺️</span>
            <span className="truncate">Continents</span>
          </button>

          <button
            onClick={() => {
              setScopeFilter('countries');
              handleFlyToRegion([25, 10], 3.2, 'countries');
            }}
            className={`px-2 py-1.5 rounded text-[11px] font-medium transition-colors text-left flex items-center gap-1.5 ${
              scopeFilter === 'countries'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-900/80 border border-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>🏳️</span>
            <span className="truncate">Countries</span>
          </button>

          <button
            onClick={() => {
              setScopeFilter('states');
              if (isMobileDrawer) setIsMobileNavOpen(false);
            }}
            className={`px-2 py-1.5 rounded text-[11px] font-medium transition-colors text-left flex items-center gap-1.5 ${
              scopeFilter === 'states'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-900/80 border border-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>🏛️</span>
            <span className="truncate">States</span>
          </button>

          <button
            onClick={() => {
              setScopeFilter('rivers');
              if (isMobileDrawer) setIsMobileNavOpen(false);
            }}
            className={`px-2 py-1.5 rounded text-[11px] font-medium transition-colors text-left flex items-center gap-1.5 ${
              scopeFilter === 'rivers'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-900/80 border border-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>🌊</span>
            <span className="truncate">Rivers</span>
          </button>

          <button
            onClick={() => {
              setScopeFilter('mountains');
              if (isMobileDrawer) setIsMobileNavOpen(false);
            }}
            className={`px-2 py-1.5 rounded text-[11px] font-medium transition-colors text-left flex items-center gap-1.5 ${
              scopeFilter === 'mountains'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-900/80 border border-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>🏔️</span>
            <span className="truncate">Mountains</span>
          </button>

          <button
            onClick={() => {
              setScopeFilter('wonders');
              if (isMobileDrawer) setIsMobileNavOpen(false);
            }}
            className={`px-2 py-1.5 rounded text-[11px] font-medium transition-colors text-left flex items-center gap-1.5 ${
              scopeFilter === 'wonders'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-900/80 border border-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>🧭</span>
            <span className="truncate">Natural Wonders</span>
          </button>
        </div>
      </div>

      {/* Regional Quick Fly-To Destinations */}
      <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 py-0.5">
          Fly To Region
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => handleFlyToRegion([34, 100], 3.2, 'all', 'asia')}
            className="px-2 py-1 text-[11px] font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded transition-colors"
          >
            Asia
          </button>
          <button
            onClick={() => handleFlyToRegion([52, 15], 4, 'all', 'europe')}
            className="px-2 py-1 text-[11px] font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded transition-colors"
          >
            Europe
          </button>
          <button
            onClick={() => handleFlyToRegion([39, -98], 3.8, 'all', 'usa')}
            className="px-2 py-1 text-[11px] font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded transition-colors"
          >
            Americas
          </button>
          <button
            onClick={() => handleFlyToRegion([2, 20], 3.5, 'all', 'africa')}
            className="px-2 py-1 text-[11px] font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded transition-colors"
          >
            Africa
          </button>
          <button
            onClick={() => handleFlyToRegion([-25, 135], 3.8, 'all', 'oceania')}
            className="px-2 py-1 text-[11px] font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded transition-colors"
          >
            Oceania
          </button>
        </div>
      </div>

      {/* Layer Toggles & Verification Indicators */}
      <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 py-0.5 flex items-center justify-between">
          <span>Active Layers ({activeLayers.length})</span>
          <span className="text-amber-400 font-mono text-[9px]">OpenStreetMap</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
          {(['POLITICAL', 'PHYSICAL', 'WEATHER', 'RAINFALL', 'CROPS', 'HAZARDS'] as MapLayerType[]).map((layer) => {
            const isActive = activeLayers.includes(layer);
            return (
              <button
                key={layer}
                onClick={() => handleToggleLayer(layer)}
                className={`px-2 py-1 rounded border text-left transition-colors truncate ${
                  isActive
                    ? 'bg-slate-800 border-amber-500/40 text-amber-300 font-semibold'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-500 hover:text-slate-300'
                }`}
              >
                {isActive ? '● ' : '○ '}
                {layer.charAt(0) + layer.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* User Followed Entities */}
      {user && user.followedEntities && user.followedEntities.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-slate-800/60">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 py-0.5">
            Followed Places ({user.followedEntities.length})
          </div>
          <div className="space-y-1">
            {user.followedEntities.map((fId) => {
              const ent = entities.find(e => e.id === fId);
              return (
                <button
                  key={fId}
                  onClick={() => {
                    setSelectedEntityId(fId);
                    setCurrentTab('atlas');
                    if (ent) {
                      setMapTargetCoords(ent.coordinates);
                      setMapTargetZoom(6);
                    }
                    if (isMobileDrawer) setIsMobileNavOpen(false);
                  }}
                  className="w-full text-left px-2 py-1 rounded bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 text-slate-300 text-xs flex items-center justify-between"
                >
                  <span className="truncate">{ent ? ent.name : fId}</span>
                  <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Account / Auth Status */}
      <div className="pt-2 border-t border-slate-800/80 mt-auto">
        {user ? (
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 truncate">{user.name}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-400">
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-1 text-xs text-rose-400 hover:bg-rose-950/30 rounded text-center transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setIsAuthModalOpen(true);
              if (isMobileDrawer) setIsMobileNavOpen(false);
            }}
            className="w-full py-2 px-3 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg transition-colors text-center"
          >
            Sign In / Register
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen h-[100dvh] bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200 overflow-hidden">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onSelectEntity={async (id) => {
          setSelectedEntityId(id);
          setCurrentTab('atlas');
          // If entity is freshly discovered via global search, ensure it is added to entities state
          if (!entities.some(e => e.id === id)) {
            try {
              const fresh = await api.getEntity(id);
              if (fresh) {
                setEntities(prev => [...prev, fresh]);
                if (fresh.coordinates) {
                  setMapTargetCoords(fresh.coordinates);
                  const zoom = fresh.type === 'continent' ? 3 :
                    fresh.type === 'country' ? 5 :
                    fresh.type === 'state' || fresh.type === 'province' ? 6.5 :
                    fresh.type === 'river' ? 7.5 :
                    fresh.type === 'mountain' || fresh.type === 'volcano' ? 9.5 :
                    fresh.type === 'city' || fresh.type === 'town' || fresh.type === 'village' ? 10.5 : 8.5;
                  setMapTargetZoom(zoom);
                }
              }
            } catch (err) {
              console.error('Failed to load entity details', err);
            }
          } else {
            const existing = entities.find(e => e.id === id);
            if (existing?.coordinates) {
              setMapTargetCoords(existing.coordinates);
              const zoom = existing.type === 'continent' ? 3 :
                existing.type === 'country' ? 5 :
                existing.type === 'state' || existing.type === 'province' ? 6.5 :
                existing.type === 'river' ? 7.5 :
                existing.type === 'mountain' || existing.type === 'volcano' ? 9.5 :
                existing.type === 'city' || existing.type === 'town' || existing.type === 'village' ? 10.5 : 8.5;
              setMapTargetZoom(zoom);
            }
          }
        }}
        pendingReviewCount={pendingReviewCount}
        onToggleSidebar={() => setIsMobileNavOpen(!isMobileNavOpen)}
        isSidebarOpen={isMobileNavOpen}
      />

      {/* Mobile Off-Canvas Navigation Drawer for screens smaller than 768px (<md) */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileNavOpen(false)}
          />

          {/* Drawer container */}
          <div className="relative w-72 sm:w-80 max-w-[85vw] h-[100dvh] bg-slate-950 border-r border-slate-800 shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-out">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* Main Content Area using relative viewport units */}
      <main className="flex-1 relative flex flex-col overflow-hidden min-h-0">
        {currentTab === 'atlas' && (
          <div className="relative w-full flex-1 min-h-[60vh] h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)] flex flex-row overflow-hidden">
            {/* Desktop Collapsible Navigation Sidebar (screens >= 768px) */}
            <aside
              className={`hidden md:flex flex-col border-r border-slate-800/80 bg-slate-950 transition-all duration-300 ease-in-out shrink-0 relative ${
                isDesktopSidebarExpanded ? 'w-64 lg:w-72' : 'w-12'
              }`}
            >
              {isDesktopSidebarExpanded ? (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 bg-slate-900/40">
                    <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                      Atlas Explorer
                    </span>
                    <button
                      onClick={() => setIsDesktopSidebarExpanded(false)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Collapse Sidebar"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    {renderSidebarContent(false)}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-3 space-y-4 h-full">
                  <button
                    onClick={() => setIsDesktopSidebarExpanded(true)}
                    className="p-2 rounded bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 shadow transition-colors"
                    title="Expand Atlas Sidebar"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="flex flex-col items-center space-y-3 text-slate-400">
                    <button onClick={() => setScopeFilter('all')} title="Global World" className="p-1.5 hover:text-amber-400">
                      🌐
                    </button>
                    <button onClick={() => setScopeFilter('continents')} title="Continents" className="p-1.5 hover:text-amber-400">
                      🗺️
                    </button>
                    <button onClick={() => setScopeFilter('countries')} title="Countries" className="p-1.5 hover:text-amber-400">
                      🏳️
                    </button>
                    <button onClick={() => setScopeFilter('states')} title="States & Regions" className="p-1.5 hover:text-amber-400">
                      🏛️
                    </button>
                    <button onClick={() => setScopeFilter('rivers')} title="Rivers" className="p-1.5 hover:text-amber-400">
                      🌊
                    </button>
                    <button onClick={() => setScopeFilter('mountains')} title="Mountains" className="p-1.5 hover:text-amber-400">
                      🏔️
                    </button>
                  </div>
                </div>
              )}
            </aside>

            {/* Map Canvas and floating overlays */}
            <div className="flex-1 relative w-full h-full min-h-[50vh] flex flex-col overflow-hidden">
              {/* World Scope & Geographic Category Quick Bar */}
              <div className="z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  <span className="text-[10px] sm:text-xs font-mono uppercase text-slate-500 mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-amber-400" />
                    <span className="hidden sm:inline">Scope:</span>
                  </span>

                  <button
                    onClick={() => {
                      setScopeFilter('all');
                      handleResetWorldView();
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                      scopeFilter === 'all'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    🌐 Global World
                  </button>

                  <button
                    onClick={() => {
                      setScopeFilter('continents');
                      handleFlyToRegion([20, 20], 3, 'continents');
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                      scopeFilter === 'continents'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    🗺️ Continents
                  </button>

                  <button
                    onClick={() => {
                      setScopeFilter('countries');
                      handleFlyToRegion([25, 10], 3.2, 'countries');
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                      scopeFilter === 'countries'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    🏳️ Countries
                  </button>

                  <button
                    onClick={() => setScopeFilter('states')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                      scopeFilter === 'states'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    🏛️ States & Regions
                  </button>

                  <button
                    onClick={() => setScopeFilter('rivers')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                      scopeFilter === 'rivers'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    🌊 Rivers
                  </button>

                  <button
                    onClick={() => setScopeFilter('mountains')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                      scopeFilter === 'mountains'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    🏔️ Mountains
                  </button>

                  <button
                    onClick={() => setScopeFilter('wonders')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                      scopeFilter === 'wonders'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    🧭 Natural Wonders
                  </button>
                </div>

                {/* Quick Jump Continent Presets (hidden on small screens, scrollable) */}
                <div className="hidden xl:flex items-center gap-1 shrink-0 text-[11px] font-mono text-slate-400">
                  <span className="text-slate-600 mr-1">Fly to:</span>
                  <button
                    onClick={() => handleFlyToRegion([34, 100], 3.2, 'all', 'asia')}
                    className="px-2 py-0.5 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors"
                  >
                    Asia
                  </button>
                  <button
                    onClick={() => handleFlyToRegion([52, 15], 4, 'all', 'europe')}
                    className="px-2 py-0.5 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors"
                  >
                    Europe
                  </button>
                  <button
                    onClick={() => handleFlyToRegion([39, -98], 3.8, 'all', 'usa')}
                    className="px-2 py-0.5 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors"
                  >
                    Americas
                  </button>
                  <button
                    onClick={() => handleFlyToRegion([2, 20], 3.5, 'all', 'africa')}
                    className="px-2 py-0.5 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors"
                  >
                    Africa
                  </button>
                  <button
                    onClick={() => handleFlyToRegion([-25, 135], 3.8, 'all', 'oceania')}
                    className="px-2 py-0.5 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors"
                  >
                    Oceania
                  </button>
                </div>
              </div>

              {/* Map Canvas with relative viewport sizing */}
              <div className="flex-1 relative w-full h-full min-h-[50vh] overflow-hidden">
                <AtlasMap
                  entities={filteredEntities}
                  selectedEntityId={selectedEntityId}
                  onSelectEntity={(id) => setSelectedEntityId(id)}
                  activeLayers={activeLayers}
                  onToggleLayer={handleToggleLayer}
                  targetCoordinates={mapTargetCoords}
                  targetZoom={mapTargetZoom}
                  onResetView={handleResetWorldView}
                />

                {/* Mobile Backdrop for Drawer */}
                {selectedEntityId && (
                  <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[1999] map-floating-overlay sm:hidden"
                    onClick={() => setSelectedEntityId(null)}
                  />
                )}

                {/* Entity Drawer (Slide-in Inspector) */}
                <EntityDrawer
                  entityId={selectedEntityId}
                  onClose={() => setSelectedEntityId(null)}
                  user={user}
                  onToggleFollow={handleToggleFollow}
                  isFollowed={Boolean(user && selectedEntityId && user.followedEntities?.includes(selectedEntityId))}
                  onSelectEntity={(id) => setSelectedEntityId(id)}
                />

                {/* Grounded Conversational AI Assistant */}
                <AskAtlasDock
                  onApplyAIAction={handleApplyAIAction}
                  activeEntityId={selectedEntityId || undefined}
                  activeLayers={activeLayers}
                />
              </div>
            </div>
          </div>
        )}

        {currentTab === 'historical' && (
          <div className="flex-1 overflow-y-auto min-h-0 h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)]">
            <HistoricalAtlasPage />
          </div>
        )}
        {currentTab === 'sources' && (
          <div className="flex-1 overflow-y-auto min-h-0 h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)]">
            <SourceExplorerPage />
          </div>
        )}
        {currentTab === 'methodology' && (
          <div className="flex-1 overflow-y-auto min-h-0 h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)]">
            <MethodologyPage />
          </div>
        )}
        {currentTab === 'reviewer' && (
          <div className="flex-1 overflow-y-auto min-h-0 h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)]">
            <ReviewerDashboard user={user} />
          </div>
        )}
        {currentTab === 'admin' && (
          <div className="flex-1 overflow-y-auto min-h-0 h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)]">
            <AdminDashboard />
          </div>
        )}
      </main>

      {/* Auth & RBAC Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(newUser) => {
          setUser(newUser);
          if (['REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(newUser.role)) {
            api.getVerificationQueue('PENDING').then((q) => setPendingReviewCount(q.length)).catch(() => {});
          }
        }}
      />
    </div>
  );
}
