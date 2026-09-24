import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api/client.js';
import { User } from '../types/atlas.js';
import { X, Lock, Mail, User as UserIcon, Shield, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.register(email, password, name);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.login(email, password);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (presetEmail: string, presetPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(presetEmail, presetPass);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 map-floating-overlay">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-lg font-semibold text-slate-100 font-serif tracking-wide">
              {isRegister ? 'Register Atlas Account' : 'Sign in to Atlas'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Role-Based Access Control & Verification Security</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs bg-rose-950/40 border border-rose-800 text-rose-300 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Researcher Name"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/80"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@atlasai.gov"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/80"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/80"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-sm rounded shadow transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
            >
              {isRegister ? 'Already have credentials? Sign in' : "Don't have an account? Register"}
            </button>
          </div>

          {/* Quick RBAC Role Presets */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-2.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Role Demo Logins:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@atlasai.gov', 'AtlasAdmin2026!')}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-left transition-colors"
              >
                <div className="font-semibold text-amber-400">Admin</div>
                <div className="text-[11px] text-slate-500 truncate">admin@atlasai.gov</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('reviewer@atlasai.gov', 'Reviewer2026!')}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-left transition-colors"
              >
                <div className="font-semibold text-teal-400">Reviewer</div>
                <div className="text-[11px] text-slate-500 truncate">reviewer@atlasai.gov</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('contributor@atlasai.gov', 'Contributor2026!')}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-left transition-colors"
              >
                <div className="font-semibold text-sky-400">Contributor</div>
                <div className="text-[11px] text-slate-500 truncate">contributor@atlasai.gov</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('explorer@atlasai.gov', 'Explorer2026!')}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-left transition-colors"
              >
                <div className="font-semibold text-indigo-400">Public User</div>
                <div className="text-[11px] text-slate-500 truncate">explorer@atlasai.gov</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
