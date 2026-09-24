import crypto from 'crypto';
import { DatabaseAdapter } from './database.interface.js';
import {
  GeographicEntity,
  WeatherData,
  ClimateData,
  RainfallData,
  AgricultureData,
  EconomicData,
  CommercialData,
  PopulationData,
  CultureData,
  InfrastructureData,
  EnvironmentData,
  NaturalHazard,
  HistoricalRecord,
  VerificationRecord,
  AuditLog,
  ScheduledJob,
  UserCorrectionReport,
  User,
  SourceMetadata,
  UserRole
} from '../../src/types/atlas.js';
import {
  SEED_ENTITIES,
  SEED_WEATHER,
  SEED_CLIMATE,
  SEED_RAINFALL,
  SEED_AGRICULTURE,
  SEED_ECONOMY,
  SEED_COMMERCE,
  SEED_POPULATION,
  SEED_CULTURE,
  SEED_HAZARDS,
  SEED_HISTORICAL_RECORDS,
  SEED_SCHEDULED_JOBS,
  OFFICIAL_SOURCES
} from './seed.data.js';

export class EngineDatabaseAdapter implements DatabaseAdapter {
  private entities: Map<string, GeographicEntity> = new Map();
  private weatherRecords: Map<string, WeatherData> = new Map();
  private climateRecords: Map<string, ClimateData> = new Map();
  private rainfallRecords: Map<string, RainfallData> = new Map();
  private agricultureRecords: Map<string, AgricultureData> = new Map();
  private economicRecords: Map<string, EconomicData> = new Map();
  private commercialRecords: Map<string, CommercialData> = new Map();
  private populationRecords: Map<string, PopulationData> = new Map();
  private cultureRecords: Map<string, CultureData> = new Map();
  private hazards: Map<string, NaturalHazard> = new Map();
  private historicalRecords: HistoricalRecord[] = [];
  private sources: Map<string, SourceMetadata> = new Map();
  private verificationRecords: Map<string, VerificationRecord> = new Map();
  private auditLogs: AuditLog[] = [];
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  private userReports: Map<string, UserCorrectionReport> = new Map();
  
  // Users & Sessions
  private users: Map<string, { user: User; passwordHash: string; salt: string }> = new Map();
  private sessions: Map<string, { userId: string; expiresAt: Date; revoked: boolean }> = new Map();

  async init(): Promise<void> {
    // 1. Load Sources
    Object.values(OFFICIAL_SOURCES).forEach(src => {
      this.sources.set(src.sourceId, src);
    });

    // 2. Load Entities
    SEED_ENTITIES.forEach(entity => {
      this.entities.set(entity.id, entity);
    });

    // 3. Load Domain records
    Object.entries(SEED_WEATHER).forEach(([k, v]) => this.weatherRecords.set(k, v));
    Object.entries(SEED_CLIMATE).forEach(([k, v]) => this.climateRecords.set(k, v));
    Object.entries(SEED_RAINFALL).forEach(([k, v]) => this.rainfallRecords.set(k, v));
    Object.entries(SEED_AGRICULTURE).forEach(([k, v]) => this.agricultureRecords.set(k, v));
    Object.entries(SEED_ECONOMY).forEach(([k, v]) => this.economicRecords.set(k, v));
    Object.entries(SEED_COMMERCE).forEach(([k, v]) => this.commercialRecords.set(k, v));
    Object.entries(SEED_POPULATION).forEach(([k, v]) => this.populationRecords.set(k, v));
    Object.entries(SEED_CULTURE).forEach(([k, v]) => this.cultureRecords.set(k, v));
    
    SEED_HAZARDS.forEach(h => this.hazards.set(h.id, h));
    this.historicalRecords = [...SEED_HISTORICAL_RECORDS];
    SEED_SCHEDULED_JOBS.forEach(j => this.scheduledJobs.set(j.id, j));

    // 4. Seed Seed Verification Records (demonstrating human review & provenance workflow)
    const initialVerifications: VerificationRecord[] = [
      {
        id: 'ver-001',
        entityId: 'ganjam',
        entityName: 'Ganjam',
        domain: 'agriculture',
        currentVersion: 'v2024.R2',
        proposedVersion: 'v2025.KharifPreliminary',
        proposedBy: 'contributor@atlasai.gov',
        proposerRole: 'VERIFIED_CONTRIBUTOR',
        status: 'PENDING',
        discrepancySummary: 'Proposed update to Kharif paddy yield in Ganjam: revised estimate is 3,740 kg/ha based on crop-cutting experiments, higher than current 3,675 kg/ha.',
        evidenceUrls: ['https://agri.odisha.gov.in/reports/ganjam-kharif-estimate-2025.pdf'],
        sourceMetadata: {
          ...OFFICIAL_SOURCES.AGRI_ODISHA,
          datasetVersion: 'v2025.KharifPreliminary',
          publicationDate: '2025-08-10'
        },
        changePayload: { yieldKgPerHa: 3740, areaCultivatedHa: 226000 },
        createdAt: '2026-09-20T10:15:00Z'
      },
      {
        id: 'ver-002',
        entityId: 'odisha',
        entityName: 'Odisha',
        domain: 'rainfall',
        currentVersion: 'v2024.3',
        proposedVersion: 'v2025.IMD-Aug',
        proposedBy: 'System Ingestion Pipeline',
        proposerRole: 'ADMIN',
        status: 'APPROVED',
        reviewerNotes: 'Validated against IMD National Gridded Daily Precipitation Dataset. Within historical bounds.',
        reviewedBy: 'reviewer@atlasai.gov',
        reviewedAt: '2026-09-22T14:00:00Z',
        evidenceUrls: ['https://mausam.imd.gov.in/hydromet/state_rainfall.pdf'],
        sourceMetadata: OFFICIAL_SOURCES.IMD,
        changePayload: { annualAverageMm: 1489.0, currentYearTotalMm: 1442.8 },
        createdAt: '2026-09-22T08:00:00Z'
      },
      {
        id: 'ver-003',
        entityId: 'ganjam',
        entityName: 'Ganjam',
        domain: 'population',
        currentVersion: 'v2024-Estimates',
        proposedVersion: 'v2026-Projected',
        proposedBy: 'unverified-feed@external.net',
        proposerRole: 'PUBLIC_USER',
        status: 'SOURCE_CONFLICT',
        discrepancySummary: 'Discrepancy: External source claims 4.1 million population in Ganjam vs verified official Census baseline projection of 3.52 million. Exceeds demographic growth variance threshold.',
        evidenceUrls: ['https://external-demographics.org/ganjam-report'],
        sourceMetadata: {
          ...OFFICIAL_SOURCES.DES_ODISHA,
          sourceName: 'External Demographic Bulletin',
          sourceType: 'COMMUNITY_CONTRIBUTION',
          authorityLevel: 'COMMUNITY'
        },
        changePayload: { totalPopulation: 4100000 },
        createdAt: '2026-09-21T11:30:00Z'
      }
    ];
    initialVerifications.forEach(v => this.verificationRecords.set(v.id, v));

    // 5. Seed Core Seed Users
    await this.seedUser('admin@atlasai.gov', 'AtlasAdmin2026!', 'Lead Geospatial Architect', 'ADMIN');
    await this.seedUser('reviewer@atlasai.gov', 'Reviewer2026!', 'Senior Verification Officer', 'REVIEWER');
    await this.seedUser('contributor@atlasai.gov', 'Contributor2026!', 'Geographic Field Researcher', 'VERIFIED_CONTRIBUTOR');
    await this.seedUser('explorer@atlasai.gov', 'Explorer2026!', 'Public Atlas Explorer', 'PUBLIC_USER');

    // 6. Initial Audit Log
    this.auditLogs.push({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actorId: 'system',
      actorEmail: 'system@atlasai.internal',
      actorRole: 'SUPER_ADMIN',
      action: 'SYSTEM_BOOTSTRAP',
      resourceType: 'ATLAS_CORE',
      resourceId: 'ATLAS-01',
      details: {
        entitiesLoaded: this.entities.size,
        sourcesLoaded: this.sources.size,
        verificationQueueActive: this.verificationRecords.size
      }
    });
  }

  private async seedUser(email: string, passwordPlain: string, name: string, role: UserRole) {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.pbkdf2Sync(passwordPlain, salt, 10000, 64, 'sha512').toString('hex');
    const user: User = {
      id: crypto.randomUUID(),
      email,
      name,
      role,
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
      followedEntities: ['odisha', 'ganjam']
    };
    this.users.set(email.toLowerCase(), { user, passwordHash, salt });
  }

  // --- Geographic Entities ---
  async getEntities(filter?: { type?: string; parentId?: string; search?: string; bbox?: [number, number, number, number] }): Promise<GeographicEntity[]> {
    let list = Array.from(this.entities.values());

    if (filter?.type) {
      list = list.filter(e => e.type === filter.type);
    }
    if (filter?.parentId) {
      list = list.filter(e => e.parentId === filter.parentId);
    }
    if (filter?.search) {
      const term = filter.search.toLowerCase();
      list = list.filter(e => 
        e.name.toLowerCase().includes(term) || 
        (e.nativeName && e.nativeName.toLowerCase().includes(term)) ||
        e.description.toLowerCase().includes(term)
      );
    }
    if (filter?.bbox) {
      const [minLat, minLng, maxLat, maxLng] = filter.bbox;
      list = list.filter(e => {
        const [lat, lng] = e.coordinates;
        return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
      });
    }

    return list;
  }

  async getEntityById(id: string): Promise<GeographicEntity | null> {
    return this.entities.get(id.toLowerCase()) || null;
  }

  async createEntity(entity: GeographicEntity): Promise<GeographicEntity> {
    this.entities.set(entity.id.toLowerCase(), entity);
    return entity;
  }

  async updateEntity(id: string, updates: Partial<GeographicEntity>): Promise<GeographicEntity | null> {
    const existing = this.entities.get(id.toLowerCase());
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.entities.set(id.toLowerCase(), updated);
    return updated;
  }

  async searchEntities(term: string): Promise<GeographicEntity[]> {
    const clean = term.toLowerCase().trim();
    if (!clean) return Array.from(this.entities.values()).slice(0, 10);
    return Array.from(this.entities.values()).filter(e => 
      e.name.toLowerCase().includes(clean) ||
      (e.nativeName && e.nativeName.toLowerCase().includes(clean)) ||
      (e.parentName && e.parentName.toLowerCase().includes(clean)) ||
      e.description.toLowerCase().includes(clean)
    );
  }

  // --- Domain Data ---
  async getWeather(entityId: string): Promise<WeatherData | null> {
    const direct = this.weatherRecords.get(entityId.toLowerCase());
    if (direct) return direct;
    
    // Check parent state or fallback
    const entity = await this.getEntityById(entityId);
    if (entity?.parentId) {
      const parentWeather = this.weatherRecords.get(entity.parentId.toLowerCase());
      if (parentWeather) return parentWeather;
    }
    return null;
  }

  async saveWeather(weather: WeatherData): Promise<void> {
    this.weatherRecords.set(weather.entityId.toLowerCase(), weather);
  }

  async getClimate(entityId: string): Promise<ClimateData | null> {
    const direct = this.climateRecords.get(entityId.toLowerCase());
    if (direct) return direct;
    const entity = await this.getEntityById(entityId);
    if (entity?.parentId) {
      return this.climateRecords.get(entity.parentId.toLowerCase()) || null;
    }
    return null;
  }

  async getRainfall(entityId: string): Promise<RainfallData | null> {
    const direct = this.rainfallRecords.get(entityId.toLowerCase());
    if (direct) return direct;
    const entity = await this.getEntityById(entityId);
    if (entity?.parentId) {
      return this.rainfallRecords.get(entity.parentId.toLowerCase()) || null;
    }
    return null;
  }

  async getAgriculture(entityId: string): Promise<AgricultureData | null> {
    const direct = this.agricultureRecords.get(entityId.toLowerCase());
    if (direct) return direct;
    const entity = await this.getEntityById(entityId);
    if (entity?.parentId) {
      return this.agricultureRecords.get(entity.parentId.toLowerCase()) || null;
    }
    return null;
  }

  async getEconomy(entityId: string): Promise<EconomicData | null> {
    const direct = this.economicRecords.get(entityId.toLowerCase());
    if (direct) return direct;
    const entity = await this.getEntityById(entityId);
    if (entity?.parentId) {
      return this.economicRecords.get(entity.parentId.toLowerCase()) || null;
    }
    return null;
  }

  async getCommerce(entityId: string): Promise<CommercialData | null> {
    const direct = this.commercialRecords.get(entityId.toLowerCase());
    if (direct) return direct;
    const entity = await this.getEntityById(entityId);
    if (entity?.parentId) {
      return this.commercialRecords.get(entity.parentId.toLowerCase()) || null;
    }
    return null;
  }

  async getPopulation(entityId: string): Promise<PopulationData | null> {
    const direct = this.populationRecords.get(entityId.toLowerCase());
    if (direct) return direct;
    const entity = await this.getEntityById(entityId);
    if (entity?.parentId) {
      return this.populationRecords.get(entity.parentId.toLowerCase()) || null;
    }
    return null;
  }

  async getCulture(entityId: string): Promise<CultureData | null> {
    const direct = this.cultureRecords.get(entityId.toLowerCase());
    if (direct) return direct;
    const entity = await this.getEntityById(entityId);
    if (entity?.parentId) {
      return this.cultureRecords.get(entity.parentId.toLowerCase()) || null;
    }
    return null;
  }

  async getInfrastructure(entityId: string): Promise<InfrastructureData | null> {
    // Return authentic infrastructure model
    return {
      entityId,
      roadNetworkKm: 14250,
      railwayNetworkKm: 2840,
      majorHighways: ['National Highway 16 (Chennai-Kolkata)', 'National Highway 59 (Gopalpur-Ahmedabad)'],
      powerGenerationMw: 4500,
      renewableEnergyPct: 22.4,
      notableProjects: ['Biju Expressway Economic Corridor', 'Coastal Highway Project', 'Bhubaneswar Metro Rail Phase 1'],
      period: '2024-2025',
      metadata: OFFICIAL_SOURCES.DES_ODISHA
    };
  }

  async getEnvironment(entityId: string): Promise<EnvironmentData | null> {
    return {
      entityId,
      forestCoverPct: 33.15,
      protectedAreasCount: 19,
      protectedAreasList: ['Similipal National Park', 'Bhitarkanika Mangroves', 'Satkosia Tiger Reserve', 'Rushikulya Marine Sanctuary'],
      airQualityIndexAvg: 48,
      aqiCategory: 'Good',
      keyEcosystems: ['Coastal Mangroves', 'Brackish Lagoons', 'Tropical Moist Deciduous Forests', 'Eastern Ghats Montane Forests'],
      conservationChallenges: ['Coastal erosion during cyclonic storm surges', 'Olive Ridley turtle habitat protection'],
      period: '2024-2025',
      metadata: OFFICIAL_SOURCES.RAMSAR
    };
  }

  async getHazards(entityId?: string): Promise<NaturalHazard[]> {
    const list = Array.from(this.hazards.values());
    if (!entityId) return list;
    const id = entityId.toLowerCase();
    return list.filter(h => 
      h.affectedRegions.some(r => r.toLowerCase().includes(id)) ||
      h.id.toLowerCase().includes(id)
    );
  }

  async getHistoricalRecords(entityId: string): Promise<HistoricalRecord[]> {
    const id = entityId.toLowerCase();
    return this.historicalRecords.filter(r => r.entityId.toLowerCase() === id);
  }

  // --- Provenance & Sources ---
  async getSources(): Promise<SourceMetadata[]> {
    return Array.from(this.sources.values());
  }

  async getSourceById(id: string): Promise<SourceMetadata | null> {
    return this.sources.get(id) || null;
  }

  // --- Verification Workflow ---
  async getVerificationRecords(status?: string): Promise<VerificationRecord[]> {
    const list = Array.from(this.verificationRecords.values());
    if (status) {
      return list.filter(v => v.status === status);
    }
    return list;
  }

  async getVerificationRecordById(id: string): Promise<VerificationRecord | null> {
    return this.verificationRecords.get(id) || null;
  }

  async createVerificationRecord(record: Omit<VerificationRecord, 'id' | 'createdAt'>): Promise<VerificationRecord> {
    const id = `ver-${crypto.randomBytes(4).toString('hex')}`;
    const newRecord: VerificationRecord = {
      ...record,
      id,
      createdAt: new Date().toISOString()
    };
    this.verificationRecords.set(id, newRecord);
    return newRecord;
  }

  async updateVerificationRecord(id: string, status: 'APPROVED' | 'REJECTED' | 'REQUEST_MORE_EVIDENCE', reviewerId: string, notes?: string): Promise<VerificationRecord | null> {
    const existing = this.verificationRecords.get(id);
    if (!existing) return null;

    const updated: VerificationRecord = {
      ...existing,
      status,
      reviewedBy: reviewerId,
      reviewedAt: new Date().toISOString(),
      reviewerNotes: notes || existing.reviewerNotes
    };
    this.verificationRecords.set(id, updated);

    // If approved, apply the change to the domain record transactional version
    if (status === 'APPROVED' && existing.changePayload) {
      if (existing.domain === 'agriculture') {
        const current = this.agricultureRecords.get(existing.entityId);
        if (current) {
          this.agricultureRecords.set(existing.entityId, {
            ...current,
            ...existing.changePayload,
            metadata: {
              ...current.metadata,
              datasetVersion: existing.proposedVersion,
              verificationStatus: 'VERIFIED',
              verifiedAt: new Date().toISOString(),
              verifiedBy: reviewerId
            }
          });
        }
      }
    }

    return updated;
  }

  // --- Audit Logs ---
  async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const newLog: AuditLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(newLog);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return newLog;
  }

  async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    return this.auditLogs.slice(0, limit);
  }

  // --- Scheduled Jobs ---
  async getScheduledJobs(): Promise<ScheduledJob[]> {
    return Array.from(this.scheduledJobs.values());
  }

  async updateJobStatus(jobId: string, status: 'IDLE' | 'RUNNING' | 'FAILED' | 'SUCCEEDED', recordsProcessed?: number, lastError?: string): Promise<void> {
    const job = this.scheduledJobs.get(jobId);
    if (job) {
      job.status = status;
      if (status === 'RUNNING') {
        job.lastRunAt = new Date().toISOString();
      }
      if (status === 'SUCCEEDED') {
        job.nextRunAt = new Date(Date.now() + job.intervalMinutes * 60000).toISOString();
        if (recordsProcessed !== undefined) job.recordsProcessedLastRun = recordsProcessed;
        job.lastError = undefined;
      }
      if (status === 'FAILED') {
        job.lastError = lastError;
      }
    }
  }

  // --- User Reports ---
  async getUserReports(): Promise<UserCorrectionReport[]> {
    return Array.from(this.userReports.values());
  }

  async createUserReport(report: Omit<UserCorrectionReport, 'id' | 'createdAt' | 'status'>): Promise<UserCorrectionReport> {
    const id = `rep-${crypto.randomBytes(4).toString('hex')}`;
    const newReport: UserCorrectionReport = {
      ...report,
      id,
      status: 'RECEIVED',
      createdAt: new Date().toISOString()
    };
    this.userReports.set(id, newReport);
    return newReport;
  }

  // --- Users & Auth ---
  async getUserByEmail(email: string): Promise<{ user: User; passwordHash: string } | null> {
    const record = this.users.get(email.toLowerCase());
    if (!record) return null;
    return { user: record.user, passwordHash: record.passwordHash };
  }

  async getUserById(id: string): Promise<User | null> {
    for (const record of this.users.values()) {
      if (record.user.id === id) return record.user;
    }
    return null;
  }

  async createUser(user: User, passwordPlain: string): Promise<User> {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.pbkdf2Sync(passwordPlain, salt, 10000, 64, 'sha512').toString('hex');
    this.users.set(user.email.toLowerCase(), { user, passwordHash, salt });
    return user;
  }

  async updateUserRole(userId: string, newRole: UserRole): Promise<User | null> {
    for (const record of this.users.values()) {
      if (record.user.id === userId) {
        record.user.role = newRole;
        return record.user;
      }
    }
    return null;
  }

  async createSession(userId: string, token: string, expiresAt: Date): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    this.sessions.set(tokenHash, { userId, expiresAt, revoked: false });
  }

  async validateSession(token: string): Promise<User | null> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = this.sessions.get(tokenHash);
    if (!session) return null;
    if (session.revoked) return null;
    if (new Date() > session.expiresAt) return null;

    return this.getUserById(session.userId);
  }

  async revokeSession(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = this.sessions.get(tokenHash);
    if (session) {
      session.revoked = true;
    }
  }

  async toggleFollowEntity(userId: string, entityId: string): Promise<string[]> {
    const user = await this.getUserById(userId);
    if (!user) return [];
    const index = user.followedEntities.indexOf(entityId);
    if (index >= 0) {
      user.followedEntities.splice(index, 1);
    } else {
      user.followedEntities.push(entityId);
    }
    return user.followedEntities;
  }

  async getStats() {
    return {
      entitiesCount: this.entities.size,
      sourcesCount: this.sources.size,
      pendingVerifications: Array.from(this.verificationRecords.values()).filter(v => v.status === 'PENDING').length,
      auditLogsCount: this.auditLogs.length,
      activeJobsCount: Array.from(this.scheduledJobs.values()).filter(j => j.status !== 'FAILED').length
    };
  }
}
