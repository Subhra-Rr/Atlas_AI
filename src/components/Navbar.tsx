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
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSelectEntity: (entityId: string) => void;
  pendingReviewCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onOpenAuth,
  onLogout,
  onSelectEntity,
  pendingReviewCount = 0
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeographicEntity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.search(searchQuery);
        setSearchResults(results);
        setIsSearchOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search dropdown
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
    setSearchQuery('');
  };

  const isReviewerOrAdmin = user && ['REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
  const isAdmin = user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          onClick={() => onSelectTab('atlas')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:border-amber-400 transition-colors">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-lg text-slate-100 tracking-wider">ATLASAI</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/50 text-amber-400 font-semibold tracking-wide">
                Living Atlas
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-sans tracking-tight hidden sm:block">
              Source-Aware Continuous Verification
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setIsSearchOpen(true);
              }}
              placeholder="Search countries, states, districts, rivers, crops..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all font-sans"
            />
            {isSearching && (
              <div className="absolute right-3 top-2.5 text-[10px] text-amber-400 font-mono">Searching...</div>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden max-h-80 overflow-y-auto z-50">
              <div className="p-1.5 space-y-1">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectResult(item.id)}
                    className="w-full text-left p-2 rounded hover:bg-slate-800 transition-colors flex items-start gap-2.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-200 truncate">{item.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{item.type}</span>
                      </div>
                      {item.nativeName && (
                        <div className="text-[11px] text-slate-400 font-sans">{item.nativeName}</div>
                      )}
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{item.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Primary Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
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
            <span className="hidden lg:inline">Historical Atlas</span>
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
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 relative ${
                currentTab === 'reviewer'
                  ? 'bg-teal-950/80 text-teal-300 border border-teal-800 font-semibold'
                  : 'text-teal-400 hover:text-teal-200'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Review Queue</span>
              {pendingReviewCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono bg-teal-500 text-slate-950 rounded-full font-bold">
                  {pendingReviewCount}
                </span>
              )}
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                currentTab === 'admin'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800 font-semibold'
                  : 'text-amber-400 hover:text-amber-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}

          {/* User Account / Auth */}
          <div className="relative ml-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs font-mono font-bold text-amber-300">
                    {user.name.charAt(0)}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
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
                className="px-3.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-slate-950 rounded transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
