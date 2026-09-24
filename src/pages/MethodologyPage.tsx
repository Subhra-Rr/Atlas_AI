import React from 'react';
import { BookOpen, CheckCircle2, ShieldAlert, Cpu, GitBranch, Database, ShieldCheck } from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  const steps = [
    { num: 1, title: 'Discover', desc: 'Continuous automated polling of registered official feeds, WMO GTS services, Open-Meteo API, and government gazettes.' },
    { num: 2, title: 'Collect', desc: 'Secure payload retrieval with TLS certificate verification, cryptographic hash fingerprinting, and payload size bounds.' },
    { num: 3, title: 'Ingest', desc: 'Staging raw observation records into isolated ingestion buffers with immutable raw payload capture.' },
    { num: 4, title: 'Parse', desc: 'Conversion from heterogeneous provider formats (GeoJSON, WMO GRIB2/BUFR tables, CSV, XML) into standardized domain schemas.' },
    { num: 5, title: 'Normalize', desc: 'Unit harmonization to SI standards (Celsius, millimeters, square kilometers, metric tons, ISO-8601 timestamps).' },
    { num: 6, title: 'Schema Validate', desc: 'Strict runtime verification using strongly typed schemas preventing null, NaN, or type confusion.' },
    { num: 7, title: 'Geo Validate', desc: 'PostGIS topological boundary containment checks, coordinate bounding boxes (-90 to +90 lat, -180 to +180 lng).' },
    { num: 8, title: 'Quality Check', desc: 'Physical bounds evaluation (e.g. ambient surface temperature bounded within -90°C to +65°C; relative humidity 0-100%).' },
    { num: 9, title: 'Anomaly Detection', desc: 'Statistical variance analysis flagging sudden jumps exceeding 20°C or demographic projections exceeding 15% variance.' },
    { num: 10, title: 'Cross-Source Comparison', desc: 'Automated delta calculation against IMD 30-year normals, Census benchmarks, and satellite crop-cutting baselines.' },
    { num: 11, title: 'Provenance Attachment', desc: 'Attaching definitive SourceMetadata (origin agency, license, datasetVersion, timestamp, ingestion run ID).' },
    { num: 12, title: 'Verification', desc: 'Automated verification for within-threshold readings; automated promotion to SOURCE_CONFLICT for discrepant readings.' },
    { num: 13, title: 'Version & Snapshot', desc: 'Immutable version bumping (e.g. v2025.4.1) maintaining historic rollback capability.' },
    { num: 14, title: 'Publish or Queue', desc: 'Safe updates published directly to live vector maps; disputed or high-variance records queued for human reviewer appraisal.' },
    { num: 15, title: 'Audit Log', desc: 'Cryptographically appended event written to immutable audit ledger recording actor, change delta, and verification state.' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4" />
          <span>System Architecture & Verification Standard</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100 tracking-wide">
          How ATLASAI Works: The 15-Step Ingestion Pipeline
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl mt-2 leading-relaxed font-sans">
          ATLASAI is not a static encyclopedia or an unverified wiki. It is an automated, living geospatial engine
          that applies continuous verification, source-aware provenance, and human-in-the-loop review to every data point.
        </p>
      </div>

      {/* 15 Steps Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-serif font-bold text-slate-100">
          Continuous Ingestion & Verification Workflow
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {steps.map((s) => (
            <div
              key={s.num}
              className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800">
                    Step {s.num.toString().padStart(2, '0')}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                </div>
                <h3 className="font-semibold text-slate-200 text-sm mt-2">{s.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conflict Resolution & Anomaly Thresholds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs uppercase font-bold">
            <ShieldAlert className="w-4 h-4" />
            <span>Conflict Resolution Policy</span>
          </div>
          <h3 className="text-base font-serif font-bold text-slate-100">Source Priority Hierarchy</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            When multiple reports conflict, ATLASAI resolves authority using an explicit multi-tiered precedence hierarchy:
          </p>
          <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside font-mono">
            <li><strong className="text-amber-400">Statutory Gazettes & Official Survey</strong> (Survey of India, DES, Census)</li>
            <li><strong className="text-teal-400">Intergovernmental & Treaty Organizations</strong> (UNESCO, Ramsar, WMO)</li>
            <li><strong className="text-sky-400">Scientific Calibration Networks</strong> (IMD Gridded Stations, Open-Meteo, USGS)</li>
            <li><strong className="text-indigo-400">Verified Peer Researchers</strong> (Reviewed with published bibliography)</li>
            <li><strong className="text-slate-400">Community Corrections</strong> (Must pass human reviewer confirmation before publication)</li>
          </ol>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase font-bold">
            <Cpu className="w-4 h-4" />
            <span>AI Safety & Grounding Guardrails</span>
          </div>
          <h3 className="text-base font-serif font-bold text-slate-100">Zero Hallucination Tolerance</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            "Ask Atlas" is engineered with strict system-level tool grounding:
          </p>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span><strong>Controlled Tool Execution:</strong> Gemini only synthesizes answers from verified database records.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span><strong>Explicit Provenance Citations:</strong> Every statement links directly to its source metadata and dataset version.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span><strong>Prompt Injection Hardening:</strong> User inquiries cannot alter administrative boundaries or bypass verification checks.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
