import React, { useState } from 'react';
import { api } from '../api/client.js';
import { GeographicEntity, User } from '../types/atlas.js';
import { X, Send, AlertCircle, FileCheck, CheckCircle2 } from 'lucide-react';

interface SubmitCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: GeographicEntity;
  user: User | null;
}

export const SubmitCorrectionModal: React.FC<SubmitCorrectionModalProps> = ({
  isOpen,
  onClose,
  entity,
  user
}) => {
  const [domain, setDomain] = useState('agriculture');
  const [description, setDescription] = useState('');
  const [suggestedCorrection, setSuggestedCorrection] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (user?.role === 'VERIFIED_CONTRIBUTOR' || user?.role === 'ADMIN') {
        // Propose high-priority verification item
        await api.proposeVerification({
          entityId: entity.id,
          domain,
          proposedVersion: 'v-contributor-proposal',
          discrepancySummary: `${description}: ${suggestedCorrection}`,
          evidenceUrls: evidenceUrl ? [evidenceUrl] : [],
          changePayload: { notes: suggestedCorrection }
        });
      } else {
        // Public user correction report
        await api.submitReport({
          entityId: entity.id,
          domain,
          description,
          suggestedCorrection,
          evidenceUrl,
          email: user?.email || email
        });
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-base font-semibold text-slate-100 font-serif">
              Submit Data Correction / Evidence
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Entity: <span className="text-amber-400 font-mono">{entity.name}</span> ({entity.type})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto" />
              <h3 className="text-base font-semibold text-slate-100">Correction Received</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your report has been securely registered in the verification audit log and routed to the Human Reviewer Queue.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs bg-rose-950/40 border border-rose-800 text-rose-300 rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Domain</label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="agriculture">Agriculture & Crops</option>
                    <option value="weather">Weather & Climate</option>
                    <option value="rainfall">Rainfall Data</option>
                    <option value="economy">Economy & Commerce</option>
                    <option value="population">Population & Demographics</option>
                    <option value="culture">Culture & Festivals</option>
                    <option value="hazards">Natural Hazards</option>
                    <option value="boundaries">Geographic Boundaries</option>
                  </select>
                </div>

                {!user && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Your Email (Optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="researcher@example.org"
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Observed Discrepancy / Problem</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what appears inaccurate, outdated, or conflicting..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Proposed Corrected Value / Description</label>
                <input
                  type="text"
                  required
                  value={suggestedCorrection}
                  onChange={(e) => setSuggestedCorrection(e.target.value)}
                  placeholder="e.g. Revised Kharif paddy yield should be 3,740 kg/ha..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Source / Verification Evidence URL</label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://official-government-gazette.gov.in/report.pdf"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Required for automated cross-source validation against verified publishers.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-slate-950 rounded transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting to Queue...' : 'Submit to Verification Queue'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
