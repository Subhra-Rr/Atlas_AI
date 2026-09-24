import React, { useState, useEffect } from 'react';
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

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('atlas');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [entities, setEntities] = useState<GeographicEntity[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>('ganjam'); // Start with Ganjam district focus
  const [activeLayers, setActiveLayers] = useState<MapLayerType[]>(['POLITICAL', 'PHYSICAL', 'CROPS']);
  const [mapTargetCoords, setMapTargetCoords] = useState<[number, number] | undefined>([19.3800, 84.8800]);
  const [mapTargetZoom, setMapTargetZoom] = useState<number | undefined>(8);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onSelectEntity={(id) => {
          setSelectedEntityId(id);
          setCurrentTab('atlas');
        }}
        pendingReviewCount={pendingReviewCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {currentTab === 'atlas' && (
          <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
            <AtlasMap
              entities={entities}
              selectedEntityId={selectedEntityId}
              onSelectEntity={(id) => setSelectedEntityId(id)}
              activeLayers={activeLayers}
              onToggleLayer={handleToggleLayer}
              targetCoordinates={mapTargetCoords}
              targetZoom={mapTargetZoom}
            />

            {/* Entity Drawer (Slide-in Inspector) */}
            <EntityDrawer
              entityId={selectedEntityId}
              onClose={() => setSelectedEntityId(null)}
              user={user}
              onToggleFollow={handleToggleFollow}
              isFollowed={Boolean(user && selectedEntityId && user.followedEntities?.includes(selectedEntityId))}
            />

            {/* Grounded Conversational AI Assistant */}
            <AskAtlasDock
              onApplyAIAction={handleApplyAIAction}
              activeEntityId={selectedEntityId || undefined}
              activeLayers={activeLayers}
            />
          </div>
        )}

        {currentTab === 'historical' && <HistoricalAtlasPage />}
        {currentTab === 'sources' && <SourceExplorerPage />}
        {currentTab === 'methodology' && <MethodologyPage />}
        {currentTab === 'reviewer' && <ReviewerDashboard user={user} />}
        {currentTab === 'admin' && <AdminDashboard />}
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
