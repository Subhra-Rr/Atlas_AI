import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { VerificationRecord, User } from '../types/atlas.js';
import { TrustIndicator } from '../components/TrustIndicator.js';
import {
  FileCheck2,
  Check,
  X,
  HelpCircle,
  ExternalLink,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';

interface ReviewerDashboardProps {
  user: User | null;
}

export const ReviewerDashboard: React.FC<ReviewerDashboardProps> = ({ user }) => {
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<VerificationRecord | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const list = await api.getVerificationQueue(filterStatus === 'ALL' ? undefined : filterStatus);
      setRecords(list);
      if (list.length > 0 && !selectedRecord) {
        setSelectedRecord(list[0]);
      }
    } catch (err) {
      console.error('Failed to load verification queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [filterStatus]);

  const handleReviewAction = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_MORE_EVIDENCE') => {
    if (!selectedRecord) return;
    setSubmitting(true);
    try {
      const updated = await api.reviewVerification(selectedRecord.id, action, reviewerNotes);
      setActionSuccess(`Record ${selectedRecord.id} successfully marked as ${action}`);
      setReviewerNotes('');
      // Reload queue
      await loadQueue();
      // Select next available
      setSelectedRecord(null);
    } catch (err: any) {
      console.error('Action failed:', err);
    } finally {
      setSubmitting(false);
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-mono text-xs uppercase tracking-wider mb-2">
            <FileCheck2 className="w-4 h-4" />
            <span>Human-in-the-Loop Verification Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100 tracking-wide">
            Data Quality & Conflict Review Queue
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Verify statistical anomalies, cross-reference external submissions with official gazettes,
            and approve transactional updates before publication to the live Atlas.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-lg text-xs font-mono">
          {['ALL', 'PENDING', 'SOURCE_CONFLICT', 'APPROVED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded transition-colors ${
                filterStatus === status
                  ? 'bg-amber-600/20 text-amber-300 font-bold border border-amber-600/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-teal-950/60 border border-teal-800 text-teal-300 text-xs rounded-lg flex items-center gap-2 font-mono">
          <ShieldCheck className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Grid: Queue List + Inspection Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Records List */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-mono uppercase text-slate-400 font-semibold">
              Items in Queue ({records.length})
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {records.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                No verification records matching filter.
              </div>
            ) : (
              records.map((rec) => {
                const isSelected = selectedRecord?.id === rec.id;
                return (
                  <button
                    key={rec.id}
                    onClick={() => {
                      setSelectedRecord(rec);
                      setReviewerNotes(rec.reviewerNotes || '');
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all space-y-2 ${
                      isSelected
                        ? 'bg-slate-800/90 border-amber-500/80 ring-1 ring-amber-500/40'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-200 text-xs truncate">
                        {rec.entityName}
                      </span>
                      <span className="font-mono text-[10px] uppercase text-amber-400 px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800">
                        {rec.domain}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {rec.discrepancySummary}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                      <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
                      <TrustIndicator status={rec.status === 'SOURCE_CONFLICT' ? 'SOURCE_CONFLICT' : 'CACHED'} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Columns: Inspection & Decision Desk */}
        <div className="lg:col-span-2">
          {selectedRecord ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-serif font-bold text-slate-100">
                      {selectedRecord.entityName}
                    </h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400 uppercase">
                      {selectedRecord.domain}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-1">
                    Record ID: {selectedRecord.id} · Proposed by: {selectedRecord.proposedBy} ({selectedRecord.proposerRole})
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-slate-200 uppercase">
                    Status: <span className="text-amber-400">{selectedRecord.status}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {new Date(selectedRecord.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Discrepancy Statement */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-mono font-bold uppercase">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Proposed Change / Discrepancy Evaluation:</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {selectedRecord.discrepancySummary}
                </p>
              </div>

              {/* Version Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-1">
                  <div className="text-slate-500 font-mono uppercase text-[10px]">Current Live Baseline</div>
                  <div className="font-mono text-slate-200 font-bold">{selectedRecord.currentVersion}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Verified official state publication</div>
                </div>

                <div className="p-3 bg-slate-950 border border-amber-800/40 rounded text-xs space-y-1">
                  <div className="text-amber-400 font-mono uppercase text-[10px]">Proposed New Version</div>
                  <div className="font-mono text-amber-300 font-bold">{selectedRecord.proposedVersion}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Under appraisal</div>
                </div>
              </div>

              {/* Evidence URLs */}
              {selectedRecord.evidenceUrls.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-mono uppercase text-slate-400">Submitted Verification Evidence:</div>
                  {selectedRecord.evidenceUrls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 underline font-mono break-all p-2 bg-slate-950 border border-slate-800 rounded"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span>{url}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Change Payload Preview */}
              {selectedRecord.changePayload && Object.keys(selectedRecord.changePayload).length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-mono uppercase text-slate-400">Structured Change Payload:</div>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded text-[11px] font-mono text-slate-300 overflow-x-auto">
                    {JSON.stringify(selectedRecord.changePayload, null, 2)}
                  </pre>
                </div>
              )}

              {/* Reviewer Action Desk */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                    Reviewer Justification Notes & Decision Basis:
                  </label>
                  <textarea
                    rows={3}
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="Document alignment with official gazette, crop cutting reports, or reason for rejection..."
                    className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5">
                  <button
                    onClick={() => handleReviewAction('REQUEST_MORE_EVIDENCE')}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors disabled:opacity-50"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Request More Evidence</span>
                  </button>

                  <button
                    onClick={() => handleReviewAction('REJECT')}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 transition-colors disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject Proposal</span>
                  </button>

                  <button
                    onClick={() => handleReviewAction('APPROVE')}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded bg-teal-600 hover:bg-teal-500 text-slate-950 transition-colors shadow-lg disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Publish to Atlas</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center text-slate-500 font-mono text-xs">
              Select a verification record from the queue to review evidence and record decisions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
