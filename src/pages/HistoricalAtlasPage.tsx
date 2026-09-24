import React, { useState } from 'react';
import { History, Calendar, MapPin, ArrowRight, ShieldCheck, Layers } from 'lucide-react';

interface TemporalMilestone {
  year: number;
  label: string;
  title: string;
  description: string;
  districtsCount: number;
  keyChanges: string[];
  historicalContext: string;
}

const MILESTONES: TemporalMilestone[] = [
  {
    year: 1990,
    label: '1990',
    title: 'Post-Independence 13 Undivided Districts',
    description: 'Odisha administered under the historic 13 undivided districts framework (Cuttack, Puri, Balasore, Sambalpur, Ganjam, Koraput, Dhenkanal, Keonjhar, Sundargarh, Bolangir, Kalahandi, Mayurbhanj, Phulbani).',
    districtsCount: 13,
    keyChanges: [
      'Ganjam encompassed the entire southern coastal and southern highland corridor.',
      'Koraput covered vast southern tribal highlands prior to quad-furcation.',
      'Agrarian economy predominantly monsoon-dependent rainfed rice.'
    ],
    historicalContext: 'Administrative apparatus oriented toward revenue collection and decentralized tehsils prior to modern digital district decentralization.'
  },
  {
    year: 1993,
    label: '1993',
    title: 'Statewide Administrative Reorganization (30 Districts)',
    description: 'Historic decentralization bifurcating and trifurcating the 13 legacy districts into 30 modern revenue districts to improve public service delivery.',
    districtsCount: 30,
    keyChanges: [
      'Ganjam bifurcated into modern Ganjam (HQ Chhatrapur) and Gajapati district (HQ Paralakhemundi).',
      'Koraput reorganized into Koraput, Malkangiri, Rayagada, and Nabarangpur.',
      'Cuttack divided into Cuttack, Jagatsinghpur, Kendrapara, and Jajpur.'
    ],
    historicalContext: 'Catalyzed by the recommendations of the Justice G.B. Patnaik Committee on district reorganization.'
  },
  {
    year: 1999,
    label: '1999',
    title: 'Odisha Super Cyclone & Creation of OSDMA',
    description: 'Category 5 Super Cyclone 05B struck the coast, catalyzing a paradigm shift from ad-hoc disaster relief to institutionalized disaster preparedness and GIS hazard mapping.',
    districtsCount: 30,
    keyChanges: [
      'Founding of Odisha State Disaster Management Authority (OSDMA), the first dedicated disaster authority in South Asia.',
      'Establishment of coastal multi-purpose cyclone shelters along the Ganjam and Jagatsinghpur coastline.',
      'Initiation of automated Doppler weather radar integration and early warning sirens.'
    ],
    historicalContext: 'Transformed Odisha into a globally cited model for cyclonic disaster preparedness recognized by the UN.'
  },
  {
    year: 2011,
    label: '2011',
    title: '96th Constitutional Amendment: Orissa to Odisha',
    description: 'Parliament passed the Constitution (Ninety-sixth Amendment) Act, 2011 and the Orissa (Alteration of Name) Act, officially changing the name from Orissa to Odisha and the official language from Oriya to Odia.',
    districtsCount: 30,
    keyChanges: [
      'Official statutory transition in all national and state cartographic records.',
      'Odia designated as the 6th Classical Language of India in 2014 based on >1,500 years of literary antiquity.',
      'Digitization of state survey cadastral maps and GIS boundary polygons.'
    ],
    historicalContext: 'Cultural and administrative milestone aligning anglicized colonial nomenclature with authentic native phonetics.'
  },
  {
    year: 2026,
    label: '2026',
    title: 'Modern Living Atlas Era: Continuous Ingestion',
    description: 'Modern administrative geography enriched with real-time gridded weather from IMD and Open-Meteo, satellite crop-cutting yield estimates, and automated source conflict resolution.',
    districtsCount: 30,
    keyChanges: [
      'Continuous daily meteorological gridding and real-time precipitation tracking.',
      'Biju Expressway economic corridor connecting western and southern Odisha to coastal Gopalpur port.',
      'Rushikulya Olive Ridley nesting sanctuary protected through satellite telemetry and GIS enforcement.'
    ],
    historicalContext: 'Integration of real-time telemetry, immutable audit lineage, and automated provenance.'
  }
];

export const HistoricalAtlasPage: React.FC = () => {
  const [selectedMilestone, setSelectedMilestone] = useState<TemporalMilestone>(MILESTONES[4]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider mb-2">
          <History className="w-4 h-4" />
          <span>Temporal Geospatial Reconstruction</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100 tracking-wide">
          Historical Atlas & Territorial Evolution
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl mt-2 leading-relaxed">
          Explore administrative reorganization, border changes, and landmark geographic transformations
          across modern history. Select an era along the interactive timeline below.
        </p>
      </div>

      {/* Interactive Timeline Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-slate-400">Temporal Milestones:</span>
          <span className="text-xs font-mono text-amber-400 font-bold">
            Selected Era: {selectedMilestone.year}
          </span>
        </div>

        {/* Timeline Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {MILESTONES.map((m) => {
            const isSelected = selectedMilestone.year === m.year;
            return (
              <button
                key={m.year}
                onClick={() => setSelectedMilestone(m)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/80 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="font-mono text-base font-bold">{m.year}</div>
                <div className="text-[11px] truncate mt-1 text-slate-300">{m.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Selected Era Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-amber-400 font-bold">
                YEAR {selectedMilestone.year}
              </span>
              <h2 className="text-xl font-serif font-bold text-slate-100 mt-2">
                {selectedMilestone.title}
              </h2>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-slate-100">
                {selectedMilestone.districtsCount}
              </div>
              <div className="text-[11px] font-mono text-slate-500 uppercase">Revenue Districts</div>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            {selectedMilestone.description}
          </p>

          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider">
              Landmark Territorial & Administrative Developments:
            </h3>
            <ul className="space-y-2">
              {selectedMilestone.keyChanges.map((change, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300"
                >
                  <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{change}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <div className="text-xs font-mono uppercase text-slate-500 mb-1">Historical Context:</div>
            <p className="text-xs text-slate-400 italic leading-relaxed">
              "{selectedMilestone.historicalContext}"
            </p>
          </div>
        </div>

        {/* Deep Ancient History Sidebar */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-serif font-bold text-slate-100">Ancient & Colonial Antecedents</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The historical geography of Odisha traces across millennia of maritime dominance and territorial statehood:
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded">
              <div className="font-mono text-amber-400 font-semibold">261 BCE · Kalinga Empire</div>
              <p className="text-slate-300 mt-1">
                The landmark Kalinga War fought along the Daya River near Dhauli led to Emperor Ashoka's renunciation of conquest in favor of Dhamma.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded">
              <div className="font-mono text-amber-400 font-semibold">1st Century BCE · Mahameghavahana Dynasty</div>
              <p className="text-slate-300 mt-1">
                Emperor Kharavela ruled from Sisupalgarh near modern Bhubaneswar, commemorated in the Hathigumpha inscription of Udayagiri.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded">
              <div className="font-mono text-amber-400 font-semibold">1 April 1936 · First Linguistic State</div>
              <p className="text-slate-300 mt-1">
                Orissa Province formed as the first separate state in British India organized on a linguistic basis, celebrated annually as Utkal Divas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
