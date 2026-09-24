import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { AuditLog, ScheduledJob } from '../types/atlas.js';
import {
  ShieldAlert,
  Play,
  CheckCircle,
  Clock,
  Activity,
  Database,
  Users,
  FileCheck2,
  RefreshCw
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, j, a] = await Promise.all([
        api.getAdminStats(),
        api.getScheduledJobs(),
        api.getAuditLogs(30)
      ]);
      setStats(s);
      setJobs(j);
      setAuditLogs(a);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunJob = async (jobId: string) => {
    setRunningJobId(jobId);
    try {
      await api.runJob(jobId);
      await loadData();
    } catch (err) {
      console.error('Job run failed:', err);
    } finally {
      setRunningJobId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider mb-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Root Operational Telemetry & Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100 tracking-wide">
            System Administration & Audit Ledger
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Monitor automated ingestion pipelines, trigger scheduled data collectors, and inspect the
            tamper-evident audit ledger.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-slate-200 hover:border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono uppercase">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              <span>Geospatial Entities</span>
            </div>
            <div className="text-2xl font-mono font-bold text-slate-100">{stats.entitiesCount}</div>
            <div className="text-[11px] text-slate-500 font-mono">Boundaries & Polygons</div>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono uppercase">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Authoritative Sources</span>
            </div>
            <div className="text-2xl font-mono font-bold text-slate-100">{stats.sourcesCount}</div>
            <div className="text-[11px] text-slate-500 font-mono">Official Catalogs</div>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono uppercase">
              <FileCheck2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Pending Reviews</span>
            </div>
            <div className="text-2xl font-mono font-bold text-amber-400">{stats.pendingVerifications}</div>
            <div className="text-[11px] text-slate-500 font-mono">In Reviewer Desk</div>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono uppercase">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
              <span>Audit Ledger Records</span>
            </div>
            <div className="text-2xl font-mono font-bold text-slate-100">{stats.auditLogsCount}</div>
            <div className="text-[11px] text-slate-500 font-mono">Cryptographically Logged</div>
          </div>
        </div>
      )}

      {/* Background Scheduled Pipelines */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-serif font-bold text-slate-100">
              Automated Data Harvesting Pipelines
            </h3>
            <p className="text-xs text-slate-400 font-mono">Scheduled Ingestion, Quality Checks & Boundary Sentry</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 text-xs">{job.name}</span>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      job.status === 'RUNNING'
                        ? 'bg-amber-950 text-amber-400 animate-pulse border border-amber-800'
                        : job.status === 'SUCCEEDED'
                        ? 'bg-teal-950 text-teal-400 border border-teal-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{job.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div>
                  <span>Frequency: </span>
                  <span className="text-slate-200">{job.intervalMinutes}m</span>
                </div>
                <button
                  onClick={() => handleRunJob(job.id)}
                  disabled={runningJobId === job.id}
                  className="flex items-center gap-1.5 px-3 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40 rounded transition-colors text-xs font-semibold disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  <span>{runningJobId === job.id ? 'Running...' : 'Run Pipeline'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Immutable Audit Ledger */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-serif font-bold text-slate-100">
              Immutable System Audit Ledger
            </h3>
            <p className="text-xs text-slate-400 font-mono">Append-Only Cryptographic Event Chain</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Actor Email</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Target Resource</th>
                <th className="py-2 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-amber-400 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{log.actorEmail}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      {log.actorRole}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                    {log.resourceType}: {log.resourceId}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
