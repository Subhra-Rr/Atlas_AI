import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client.js';
import { User, GeographicEntity } from '../types/atlas.js';
import {
  Globe,
  Search,
  History,
  BookOpen,
  FileCheck2,
  Shield,
  User as UserIcon,
  LogOut,
  MapPin,
  Layers,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSelectEntity: (entityId: string) => void;
  pendingReviewCount?: number;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onOpenAuth,
  onLogout,
  onSelectEntity,
  pendingReviewCount = 0,
  onToggleSidebar,
  isSidebarOpen = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeographicEntity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.search(searchQuery);
        setSearchResults(results || []);
        setIsSearchOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Search error:', err);
        // Error resilient: gracefully keep results array empty, never crash UI
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close desktop search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (entityId: string) => {
    onSelectEntity(entityId);
    onSelectTab('atlas');
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    setIsMobileMenuOpen(false);
    setSearchQuery('');
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || searchResults.length === 0) {
      if (e.key === 'Enter' && searchQuery.trim()) {
        // If enter pressed before debounce or while results loading, trigger search
        api.search(searchQuery).then(res => {
          if (res && res.length > 0) handleSelectResult(res[0].id);
        }).catch(() => {});
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = selectedIndex >= 0 ? searchResults[selectedIndex] : searchResults[0];
      if (target) {
        handleSelectResult(target.id);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  const getCategoryBadge = (type: string) => {
    switch (type) {
      case 'country':
        return { icon: '🏳️', label: 'Country', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60' };
      case 'state':
      case 'province':
        return { icon: '🏛️', label: 'State / Province', color: 'text-blue-400 bg-blue-950/60 border-blue-800/60' };
      case 'river':
        return { icon: '🌊', label: 'River System', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60' };
      case 'mountain':
      case 'mountain_range':
      case 'volcano':
        return { icon: '🏔️', label: 'Mountain & Peak', color: 'text-amber-400 bg-amber-950/60 border-amber-800/60' };
      case 'lake':
      case 'sea':
      case 'ocean':
      case 'desert':
      case 'wetland':
      case 'valley':
      case 'glacier':
      case 'island':
        return { icon: '🧭', label: 'Natural Wonder', color: 'text-purple-400 bg-purple-950/60 border-purple-800/60' };
      case 'continent':
        return { icon: '🗺️', label: 'Continent', color: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60' };
      default:
        return { icon: '📍', label: type, color: 'text-slate-400 bg-slate-800/60 border-slate-700/60' };
    }
  };

  const isReviewerOrAdmin = user && ['REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
  const isAdmin = user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <div
          onClick={() => {
            onSelectTab('atlas');
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:border-amber-400 transition-colors">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-base sm:text-lg text-slate-100 tracking-wider">ATLASAI</span>
              <span className="text-[9px] sm:text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/50 text-amber-400 font-semibold tracking-wide">
                World Atlas
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-sans tracking-tight hidden lg:block">
              Global Continuous Geospatial Verification
            </div>
          </div>
        </div>

        {/* Desktop Global Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-lg hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchResults.length > 0 || searchQuery.length > 0) setIsSearchOpen(true);
              }}
              placeholder="Search world countries, states, rivers, mountains, wonders..."
              className="w-full pl-9 pr-16 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all font-sans"
            />
            {isSearching ? (
              <div className="absolute right-3 top-2.5 text-[10px] text-amber-400 font-mono animate-pulse">
                Searching...
              </div>
            ) : searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setIsSearchOpen(false);
                }}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-950/98 border border-slate-800 rounded-lg shadow-2xl overflow-hidden max-h-96 overflow-y-auto z-50 divide-y divide-slate-800/60 backdrop-blur-xl">
              {/* Category Quick Jump Chips */}
              <div className="p-2 bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono no-scrollbar">
                <span className="text-slate-500 shrink-0">Filter:</span>
                <button
                  onClick={() => setSearchQuery('country')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
                >
                  🏳️ Countries
                </button>
                <button
                  onClick={() => setSearchQuery('state')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
                >
                  🏛️ States
                </button>
                <button
                  onClick={() => setSearchQuery('river')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
                >
                  🌊 Rivers
                </button>
                <button
                  onClick={() => setSearchQuery('mountain')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
                >
                  🏔️ Mountains
                </button>
              </div>

              {searchResults.length > 0 ? (
                <div className="p-1.5 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Matches ({searchResults.length})</span>
                    <span className="text-slate-600">Press Enter or click to navigate</span>
                  </div>
                  {searchResults.map((item, idx) => {
                    const badge = getCategoryBadge(item.type);
                    const isSelected = selectedIndex === idx;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectResult(item.id)}
                        className={`w-full text-left p-2 rounded-lg transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-amber-500/15 border border-amber-500/40 text-slate-100 shadow-sm'
                            : 'hover:bg-slate-800/80 border border-transparent text-slate-300'
                        }`}
                      >
                        <span className="text-base shrink-0 mt-0.5">{badge.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-100 truncate">
                              {item.name}
                            </span>
                            <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${badge.color}`}>
                              {badge.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.parentName && (
                              <span className="text-[11px] text-amber-400/90 font-medium truncate">
                                {item.parentName}
                              </span>
                            )}
                            {item.coordinates && (
                              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                {item.coordinates[0].toFixed(2)}°, {item.coordinates[1].toFixed(2)}°
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {item.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : searchQuery.length >= 2 && !isSearching ? (
                <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                  <div className="font-medium text-slate-300">No areas found for "{searchQuery}"</div>
                  <div className="text-[11px] text-slate-500">
                    Try searching for any sovereign country, state, river, mountain peak, or region.
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Right Navigation & Mobile Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Search Toggle Button */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="p-2 rounded md:hidden text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors"
            title="Search Places & Geography"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onSelectTab('atlas')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                currentTab === 'atlas'
                  ? 'bg-slate-800 text-amber-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              World Atlas
            </button>

            <button
              onClick={() => onSelectTab('historical')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                currentTab === 'historical'
                  ? 'bg-slate-800 text-amber-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Historical</span>
            </button>

            <button
              onClick={() => onSelectTab('sources')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                currentTab === 'sources'
                  ? 'bg-slate-800 text-amber-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Sources</span>
            </button>

            <button
              onClick={() => onSelectTab('methodology')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                currentTab === 'methodology'
                  ? 'bg-slate-800 text-amber-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Methodology</span>
            </button>

            {isReviewerOrAdmin && (
              <button
                onClick={() => onSelectTab('reviewer')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 relative ${
                  currentTab === 'reviewer'
                    ? 'bg-teal-950/80 text-teal-300 border border-teal-800 font-semibold'
                    : 'text-teal-400 hover:text-teal-200'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Review</span>
                {pendingReviewCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-mono bg-teal-500 text-slate-950 rounded-full font-bold">
                    {pendingReviewCount}
                  </span>
                )}
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => onSelectTab('admin')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                  currentTab === 'admin'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800 font-semibold'
                    : 'text-amber-400 hover:text-amber-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}
          </nav>

          {/* User Account / Auth Button */}
          <div className="relative">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 p-1 rounded hover:bg-slate-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs font-mono font-bold text-amber-300">
                    {user.name.charAt(0)}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl p-2 z-50 text-xs">
                    <div className="px-2 py-1.5 border-b border-slate-800/80 mb-1">
                      <div className="font-semibold text-slate-200 truncate">{user.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">{user.email}</div>
                      <div className="mt-1">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-400 font-medium">
                          {user.role}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onLogout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-rose-400 hover:bg-rose-950/30 rounded text-left transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-slate-950 rounded transition-colors whitespace-nowrap"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => {
              if (onToggleSidebar) {
                onToggleSidebar();
              } else {
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }
            }}
            className="p-2 rounded md:hidden text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
            title="Toggle Navigation Menu"
            aria-label="Toggle navigation menu"
          >
            {isSidebarOpen || isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Overlay Bar */}
      {isMobileSearchOpen && (
        <div ref={mobileSearchRef} className="md:hidden px-3 pb-3 border-t border-slate-800/80 bg-slate-950/98">
          <div className="relative mt-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search world, countries, rivers, peaks..."
              autoFocus
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/80 transition-all font-sans"
            />
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl max-h-72 overflow-y-auto divide-y divide-slate-800/60">
              <div className="p-1 space-y-1">
                {searchResults.map((item) => {
                  const badge = getCategoryBadge(item.type);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectResult(item.id)}
                      className="w-full text-left p-2 rounded hover:bg-slate-800 transition-colors flex items-start gap-2"
                    >
                      <span className="text-sm shrink-0 mt-0.5">{badge.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-slate-200 truncate">{item.name}</span>
                          <span className={`text-[8px] font-mono uppercase px-1 rounded border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        {item.parentName && (
                          <div className="text-[10px] text-amber-400/90 truncate">{item.parentName}</div>
                        )}
                        <div className="text-[10px] text-slate-400 truncate">{item.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/90 bg-slate-950/98 px-4 py-3 space-y-2 shadow-2xl">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                onSelectTab('atlas');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs font-medium rounded flex items-center gap-2 ${
                currentTab === 'atlas' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-300'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>World Atlas (Interactive Map)</span>
            </button>

            <button
              onClick={() => {
                onSelectTab('historical');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs font-medium rounded flex items-center gap-2 ${
                currentTab === 'historical' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-300'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Historical Atlas (1700s–Present)</span>
            </button>

            <button
              onClick={() => {
                onSelectTab('sources');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs font-medium rounded flex items-center gap-2 ${
                currentTab === 'sources' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-300'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Authoritative Sources & Data Provenance</span>
            </button>

            <button
              onClick={() => {
                onSelectTab('methodology');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs font-medium rounded flex items-center gap-2 ${
                currentTab === 'methodology' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Methodology & Discrepancy Policy</span>
            </button>

            {isReviewerOrAdmin && (
              <button
                onClick={() => {
                  onSelectTab('reviewer');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded flex items-center justify-between ${
                  currentTab === 'reviewer' ? 'bg-teal-950 text-teal-300 font-bold' : 'text-teal-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4" />
                  <span>Verification Queue</span>
                </div>
                {pendingReviewCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-teal-500 text-slate-950 rounded-full font-bold">
                    {pendingReviewCount}
                  </span>
                )}
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => {
                  onSelectTab('admin');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded flex items-center gap-2 ${
                  currentTab === 'admin' ? 'bg-amber-950 text-amber-300 font-bold' : 'text-amber-400'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin Architecture & Ingestion Jobs</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
