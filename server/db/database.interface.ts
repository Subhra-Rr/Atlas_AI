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
  MapLayerType
} from '../../src/types/atlas.js';

export interface DatabaseAdapter {
  init(): Promise<void>;
  
  // Geographic Entities
  getEntities(filter?: { type?: string; parentId?: string; search?: string; bbox?: [number, number, number, number] }): Promise<GeographicEntity[]>;
  getEntityById(id: string): Promise<GeographicEntity | null>;
  createEntity(entity: GeographicEntity): Promise<GeographicEntity>;
  updateEntity(id: string, updates: Partial<GeographicEntity>): Promise<GeographicEntity | null>;
  searchEntities(term: string): Promise<GeographicEntity[]>;
  getSurroundingEntities(params: { lat: number; lng: number; radiusKm?: number; excludeId?: string; entityType?: string }): Promise<GeographicEntity[]>;

  // Domain Data
  getWeather(entityId: string): Promise<WeatherData | null>;
  saveWeather(weather: WeatherData): Promise<void>;

  getClimate(entityId: string): Promise<ClimateData | null>;
  getRainfall(entityId: string): Promise<RainfallData | null>;
  getAgriculture(entityId: string): Promise<AgricultureData | null>;
  getEconomy(entityId: string): Promise<EconomicData | null>;
  getCommerce(entityId: string): Promise<CommercialData | null>;
  getPopulation(entityId: string): Promise<PopulationData | null>;
  getCulture(entityId: string): Promise<CultureData | null>;
  getInfrastructure(entityId: string): Promise<InfrastructureData | null>;
  getEnvironment(entityId: string): Promise<EnvironmentData | null>;
  getHazards(entityId?: string): Promise<NaturalHazard[]>;
  getHistoricalRecords(entityId: string): Promise<HistoricalRecord[]>;

  // Provenance & Sources
  getSources(): Promise<SourceMetadata[]>;
  getSourceById(id: string): Promise<SourceMetadata | null>;

  // Verification & Review Workflow
  getVerificationRecords(status?: string): Promise<VerificationRecord[]>;
  getVerificationRecordById(id: string): Promise<VerificationRecord | null>;
  createVerificationRecord(record: Omit<VerificationRecord, 'id' | 'createdAt'>): Promise<VerificationRecord>;
  updateVerificationRecord(id: string, status: 'APPROVED' | 'REJECTED' | 'REQUEST_MORE_EVIDENCE', reviewerId: string, notes?: string): Promise<VerificationRecord | null>;

  // Audit Logs
  createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;

  // Scheduled Jobs
  getScheduledJobs(): Promise<ScheduledJob[]>;
  updateJobStatus(jobId: string, status: 'IDLE' | 'RUNNING' | 'FAILED' | 'SUCCEEDED', recordsProcessed?: number, lastError?: string): Promise<void>;

  // User Reports / Corrections
  getUserReports(): Promise<UserCorrectionReport[]>;
  createUserReport(report: Omit<UserCorrectionReport, 'id' | 'createdAt' | 'status'>): Promise<UserCorrectionReport>;

  // Users & Auth
  getUserByEmail(email: string): Promise<{ user: User; passwordHash: string } | null>;
  getUserById(id: string): Promise<User | null>;
  createUser(user: User, passwordHash: string): Promise<User>;
  updateUserRole(userId: string, newRole: User['role']): Promise<User | null>;
  createSession(userId: string, token: string, expiresAt: Date): Promise<void>;
  validateSession(token: string): Promise<User | null>;
  revokeSession(token: string): Promise<void>;
  
  // Followed Entities
  toggleFollowEntity(userId: string, entityId: string): Promise<string[]>;

  // System Stats
  getStats(): Promise<{
    entitiesCount: number;
    sourcesCount: number;
    pendingVerifications: number;
    auditLogsCount: number;
    activeJobsCount: number;
  }>;
}
