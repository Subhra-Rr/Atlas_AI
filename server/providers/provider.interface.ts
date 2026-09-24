import { SourceMetadata, DataStatus } from '../../src/types/atlas.js';

export interface ProviderFetchResult<T> {
  data: T;
  source: SourceMetadata;
  status: DataStatus;
  rawPayload?: any;
}

export interface AtlasDataProvider<T> {
  providerId: string;
  providerName: string;
  domain: string;
  getSourceMetadata(): SourceMetadata;
  fetchLatest(entityId: string, coordinates: [number, number]): Promise<ProviderFetchResult<T>>;
}
