// Core ATLASAI Types & Domain Models

export type UserRole = 'PUBLIC_USER' | 'VERIFIED_CONTRIBUTOR' | 'REVIEWER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt?: string;
  isEmailVerified: boolean;
  followedEntities: string[]; // entity IDs
}

export type DataStatus = 
  | 'LIVE'
  | 'CACHED'
  | 'HISTORICAL'
  | 'ESTIMATED'
  | 'SAMPLE'
  | 'VERIFIED'
  | 'UNVERIFIED'
  | 'UNDER_REVIEW'
  | 'OUTDATED'
  | 'SOURCE_CONFLICT'
  | 'ARCHIVED';

export type SourceType = 
  | 'AUTHORITATIVE_OFFICIAL'
  | 'RECOGNIZED_SCIENTIFIC'
  | 'RESEARCH_INSTITUTION'
  | 'ESTABLISHED_DATASET'
  | 'COMMUNITY_CONTRIBUTION'
  | 'UNVERIFIED';

export type GeographicEntityType = 
  | 'continent'
  | 'country'
  | 'state'
  | 'province'
  | 'district'
  | 'city'
  | 'river'
  | 'mountain'
  | 'mountain_range'
  | 'plateau'
  | 'plain'
  | 'desert'
  | 'valley'
  | 'island'
  | 'sea'
  | 'ocean'
  | 'lake'
  | 'forest'
  | 'wetland'
  | 'glacier'
  | 'volcano';

export type MapLayerType = 
  | 'PHYSICAL'
  | 'POLITICAL'
  | 'WEATHER'
  | 'TEMPERATURE'
  | 'RAINFALL'
  | 'CLIMATE'
  | 'AGRICULTURE'
  | 'CROPS'
  | 'POPULATION'
  | 'ECONOMY'
  | 'COMMERCE'
  | 'CULTURE'
  | 'FESTIVALS'
  | 'INFRASTRUCTURE'
  | 'ENVIRONMENT'
  | 'HAZARDS'
  | 'HISTORICAL';

export interface SourceMetadata {
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  sourceUrl?: string;
  authorityLevel: 'HIGH' | 'MEDIUM' | 'COMMUNITY' | 'EXPERIMENTAL';
  license: string;
  datasetName: string;
  datasetVersion: string;
  updateCadence?: string;
  publicationDate: string;
  effectiveDate: string;
  collectionTime: string;
  verificationStatus: DataStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  dataStatus: DataStatus;
  attribution: string;
}

export interface GeographicEntity {
  id: string;
  name: string;
  nativeName?: string;
  type: GeographicEntityType;
  parentId?: string;
  parentName?: string;
  coordinates: [number, number]; // [lat, lng]
  bbox?: [number, number, number, number]; // [minLat, minLng, maxLat, maxLng]
  areaKm2?: number;
  elevationM?: number;
  population?: number;
  capital?: string;
  description: string;
  geometryType?: 'Point' | 'Polygon' | 'MultiPolygon' | 'LineString';
  geojson?: any;
  sources: SourceMetadata;
  updatedAt: string;
}

export interface WeatherData {
  entityId: string;
  temperatureC: number;
  feelsLikeC: number;
  rainfallMm: number;
  humidityPct: number;
  windSpeedKph: number;
  windDirectionDeg?: number;
  pressureHpa: number;
  cloudCoverPct: number;
  visibilityKm: number;
  uvIndex: number;
  condition: string;
  observationTime: string;
  freshness: string;
  metadata: SourceMetadata;
}

export interface ClimateData {
  entityId: string;
  koppenClassification: string;
  koppenDescription: string;
  avgAnnualRainfallMm: number;
  avgSummerTempC: number;
  avgWinterTempC: number;
  seasonalPatterns: string;
  observedTrend: string;
  period: string;
  metadata: SourceMetadata;
}

export interface RainfallData {
  entityId: string;
  annualAverageMm: number;
  currentYearTotalMm: number;
  monthlyRainfallMm: { month: string; mm: number; avgMm: number }[];
  monsoonContributionPct: number;
  rainfallAnomalyPct: number;
  status: string;
  period: string;
  metadata: SourceMetadata;
}

export interface CropInfo {
  name: string;
  type: 'Cereal' | 'Pulse' | 'Oilseed' | 'Cash' | 'Horticulture';
  season: 'Kharif' | 'Rabi' | 'Zaid' | 'Perennial';
  sowingMonths: string;
  harvestMonths: string;
  areaCultivatedHa: number;
  productionMetricTons: number;
  yieldKgPerHa: number;
  waterRequirement: 'High' | 'Medium' | 'Low';
  suitabilityScore: number; // 0-100
}

export interface AgricultureData {
  entityId: string;
  agriculturalLandPct: number;
  irrigatedLandPct: number;
  majorSoilTypes: string[];
  crops: CropInfo[];
  livestockOverview?: string;
  period: string;
  metadata: SourceMetadata;
}

export interface EconomicData {
  entityId: string;
  gdpBillionUsd?: number;
  gsdpBillionUsd?: number;
  gdpPerCapitaUsd?: number;
  agricultureSharePct: number;
  industrySharePct: number;
  servicesSharePct: number;
  keyIndustries: string[];
  majorExports: string[];
  majorImports: string[];
  primaryCommodities: string[];
  economicHubs: string[];
  period: string;
  metadata: SourceMetadata;
}

export interface CommercialData {
  entityId: string;
  majorPorts: { name: string; type: string; annualCargoMt?: number }[];
  airports: { name: string; code: string; type: 'International' | 'Domestic' }[];
  wholesaleMarkets: { name: string; commodity: string; location: string }[];
  logisticsHubs: string[];
  period: string;
  metadata: SourceMetadata;
}

export interface PopulationData {
  entityId: string;
  totalPopulation: number;
  densityPerKm2: number;
  urbanizationPct: number;
  literacyRatePct: number;
  growthRatePct: number;
  sexRatio?: number;
  year: number;
  settlementPatternNotes: string;
  metadata: SourceMetadata;
}

export interface FestivalInfo {
  id: string;
  name: string;
  nativeName?: string;
  datesRule: 'Fixed Gregorian' | 'Lunar Calendar' | 'Solar Calendar' | 'Seasonal Equinox';
  approximateGregorianMonths: string;
  durationDays: number;
  culturalBackground: string;
  traditions: string[];
  significance: string;
}

export interface CultureData {
  entityId: string;
  primaryLanguages: string[];
  scripts: string[];
  traditionalClothing: string[];
  cuisineSpecialties: string[];
  performingArts: string[];
  festivals: FestivalInfo[];
  unescoHeritageSites: string[];
  prominentMuseums: string[];
  metadata: SourceMetadata;
}

export interface InfrastructureData {
  entityId: string;
  roadNetworkKm: number;
  railwayNetworkKm: number;
  majorHighways: string[];
  powerGenerationMw?: number;
  renewableEnergyPct?: number;
  notableProjects: string[];
  period: string;
  metadata: SourceMetadata;
}

export interface EnvironmentData {
  entityId: string;
  forestCoverPct: number;
  protectedAreasCount: number;
  protectedAreasList: string[];
  airQualityIndexAvg: number;
  aqiCategory: 'Good' | 'Moderate' | 'Unhealthy' | 'Hazardous';
  keyEcosystems: string[];
  conservationChallenges: string[];
  period: string;
  metadata: SourceMetadata;
}

export interface NaturalHazard {
  id: string;
  type: 'Cyclone' | 'Flood' | 'Drought' | 'Earthquake' | 'Heatwave' | 'Landslide' | 'Tsunami';
  category: 'HISTORICAL_EVENT' | 'CURRENT_EVENT' | 'WARNING' | 'FORECAST' | 'RISK_ASSESSMENT';
  severity: 'Extreme' | 'High' | 'Moderate' | 'Low';
  title: string;
  dateOrPeriod: string;
  affectedRegions: string[];
  description: string;
  casualtyOrImpactSummary?: string;
  mitigationNotes?: string;
  source: SourceMetadata;
}

export interface HistoricalRecord {
  id: string;
  entityId: string;
  yearOrEra: string;
  historicalName?: string;
  administrativeStatus: string;
  historicalBoundariesSummary: string;
  keyEvents: string[];
  populationEstimate?: number;
  source: SourceMetadata;
}

export interface VerificationRecord {
  id: string;
  entityId: string;
  entityName: string;
  domain: string;
  currentVersion: string;
  proposedVersion: string;
  proposedBy: string;
  proposerRole: UserRole;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUEST_MORE_EVIDENCE' | 'SOURCE_CONFLICT';
  discrepancySummary?: string;
  evidenceUrls: string[];
  sourceMetadata: SourceMetadata;
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  changePayload: any;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress?: string;
  details: Record<string, any>;
}

export interface ScheduledJob {
  id: string;
  name: string;
  description?: string;
  provider: string;
  frequencyDescription: string;
  intervalMinutes: number;
  lastRunAt?: string;
  nextRunAt: string;
  status: 'IDLE' | 'RUNNING' | 'FAILED' | 'SUCCEEDED';
  recordsProcessedLastRun?: number;
  lastError?: string;
}

export interface UserCorrectionReport {
  id: string;
  entityId: string;
  entityName: string;
  reportedByEmail?: string;
  domain: string;
  description: string;
  evidenceUrl?: string;
  suggestedCorrection: string;
  status: 'RECEIVED' | 'IN_REVIEW' | 'ACCEPTED' | 'DISMISSED';
  createdAt: string;
}

export interface AIAtlasQueryRequest {
  query: string;
  activeEntityId?: string;
  activeLayers?: MapLayerType[];
}

export interface AIAtlasQueryResponse {
  answer: string;
  suggestedEntityId?: string;
  suggestedLayers?: MapLayerType[];
  targetCoordinates?: [number, number];
  targetZoom?: number;
  provenance: {
    sources: SourceMetadata[];
    verifiedAt?: string;
    status: DataStatus;
    notes?: string;
  };
}
