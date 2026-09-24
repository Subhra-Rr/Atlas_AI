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
  SourceMetadata,
  VerificationRecord,
  AuditLog,
  ScheduledJob,
  UserCorrectionReport,
  User,
  AIAtlasQueryResponse,
  MapLayerType
} from '../types/atlas.js';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('atlas_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('atlas_token', token);
    } else {
      localStorage.removeItem('atlas_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || `Request failed with status ${res.status}`);
    }

    return json.data;
  }

  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(res.token);
    return res;
  }

  async register(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });
    this.setToken(res.token);
    return res;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Geo
  async getEntities(filter?: { type?: string; parentId?: string; search?: string; bbox?: [number, number, number, number] }): Promise<GeographicEntity[]> {
    const params = new URLSearchParams();
    if (filter?.type) params.set('type', filter.type);
    if (filter?.parentId) params.set('parentId', filter.parentId);
    if (filter?.search) params.set('search', filter.search);
    if (filter?.bbox) params.set('bbox', filter.bbox.join(','));
    const qs = params.toString();
    return this.request<GeographicEntity[]>(`/geo/entities${qs ? `?${qs}` : ''}`);
  }

  async getEntity(id: string): Promise<GeographicEntity> {
    return this.request<GeographicEntity>(`/geo/entities/${id}`);
  }

  async search(query: string): Promise<GeographicEntity[]> {
    return this.request<GeographicEntity[]>(`/geo/search?q=${encodeURIComponent(query)}`);
  }

  async getSurrounding(params: { entityId?: string; lat?: number; lng?: number; radiusKm?: number }): Promise<GeographicEntity[]> {
    const q = new URLSearchParams();
    if (params.entityId) q.set('entityId', params.entityId);
    if (params.lat !== undefined) q.set('lat', String(params.lat));
    if (params.lng !== undefined) q.set('lng', String(params.lng));
    if (params.radiusKm !== undefined) q.set('radiusKm', String(params.radiusKm));
    return this.request<GeographicEntity[]>(`/geo/surrounding?${q.toString()}`);
  }

  async toggleFollow(entityId: string): Promise<string[]> {
    const res = await this.request<{ followedEntities: string[] }>(`/geo/entities/${entityId}/follow`, { method: 'POST' });
    return res.followedEntities;
  }

  // Domain Data
  async getWeather(entityId: string): Promise<WeatherData> {
    return this.request<WeatherData>(`/data/${entityId}/weather`);
  }

  async refreshWeather(entityId: string): Promise<{ data: WeatherData; ingestionReport: any }> {
    return this.request<{ data: WeatherData; ingestionReport: any }>(`/data/${entityId}/weather/refresh`, { method: 'POST' });
  }

  async getClimate(entityId: string): Promise<ClimateData> {
    return this.request<ClimateData>(`/data/${entityId}/climate`);
  }

  async getRainfall(entityId: string): Promise<RainfallData> {
    return this.request<RainfallData>(`/data/${entityId}/rainfall`);
  }

  async getAgriculture(entityId: string): Promise<AgricultureData> {
    return this.request<AgricultureData>(`/data/${entityId}/agriculture`);
  }

  async getEconomy(entityId: string): Promise<EconomicData> {
    return this.request<EconomicData>(`/data/${entityId}/economy`);
  }

  async getCommerce(entityId: string): Promise<CommercialData> {
    return this.request<CommercialData>(`/data/${entityId}/commerce`);
  }

  async getPopulation(entityId: string): Promise<PopulationData> {
    return this.request<PopulationData>(`/data/${entityId}/population`);
  }

  async getCulture(entityId: string): Promise<CultureData> {
    return this.request<CultureData>(`/data/${entityId}/culture`);
  }

  async getInfrastructure(entityId: string): Promise<InfrastructureData> {
    return this.request<InfrastructureData>(`/data/${entityId}/infrastructure`);
  }

  async getEnvironment(entityId: string): Promise<EnvironmentData> {
    return this.request<EnvironmentData>(`/data/${entityId}/environment`);
  }

  async getHazards(entityId?: string): Promise<NaturalHazard[]> {
    const q = entityId ? `?entityId=${entityId}` : '';
    return this.request<NaturalHazard[]>(`/data/hazards${q}`);
  }

  async getHistorical(entityId: string): Promise<HistoricalRecord[]> {
    return this.request<HistoricalRecord[]>(`/data/${entityId}/historical`);
  }

  async getSources(): Promise<SourceMetadata[]> {
    return this.request<SourceMetadata[]>('/data/sources');
  }

  // AI Ask Atlas
  async askAtlas(query: string, activeEntityId?: string, activeLayers?: MapLayerType[]): Promise<AIAtlasQueryResponse> {
    return this.request<AIAtlasQueryResponse>('/ai/query', {
      method: 'POST',
      body: JSON.stringify({ query, activeEntityId, activeLayers })
    });
  }

  // Verification
  async getVerificationQueue(status?: string): Promise<VerificationRecord[]> {
    const q = status ? `?status=${status}` : '';
    return this.request<VerificationRecord[]>(`/verification/queue${q}`);
  }

  async reviewVerification(id: string, action: 'APPROVE' | 'REJECT' | 'REQUEST_MORE_EVIDENCE', notes?: string): Promise<VerificationRecord> {
    return this.request<VerificationRecord>(`/verification/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, notes })
    });
  }

  async proposeVerification(payload: any): Promise<VerificationRecord> {
    return this.request<VerificationRecord>('/verification/propose', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async submitReport(payload: any): Promise<UserCorrectionReport> {
    return this.request<UserCorrectionReport>('/reports/submit', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Admin
  async getAdminStats(): Promise<{ entitiesCount: number; sourcesCount: number; pendingVerifications: number; auditLogsCount: number; activeJobsCount: number }> {
    return this.request('/admin/stats');
  }

  async getAuditLogs(limit?: number): Promise<AuditLog[]> {
    return this.request<AuditLog[]>(`/admin/audit-logs${limit ? `?limit=${limit}` : ''}`);
  }

  async getScheduledJobs(): Promise<ScheduledJob[]> {
    return this.request<ScheduledJob[]>('/admin/jobs');
  }

  async runJob(id: string): Promise<{ success: boolean; recordsProcessed: number; message: string }> {
    return this.request(`/admin/jobs/${id}/run`, { method: 'POST' });
  }
}

export const api = new ApiClient();
