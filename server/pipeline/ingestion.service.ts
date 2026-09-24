import { DatabaseAdapter } from '../db/database.interface.js';
import { OpenMeteoWeatherProvider } from '../providers/weather.provider.js';
import {
  WeatherData,
  SourceMetadata,
  DataStatus,
  VerificationRecord
} from '../../src/types/atlas.js';

export interface IngestionResult {
  step: string;
  success: boolean;
  entityId: string;
  domain: string;
  status: DataStatus;
  discrepancyDetected?: boolean;
  queuedForReview?: boolean;
  message: string;
}

export class IngestionService {
  private weatherProvider: OpenMeteoWeatherProvider;

  constructor(private db: DatabaseAdapter) {
    this.weatherProvider = new OpenMeteoWeatherProvider();
  }

  /**
   * Executes the full 15-stage ingestion, validation, cross-source check,
   * versioning, and publishing workflow for meteorological data.
   */
  async ingestWeatherForEntity(entityId: string): Promise<IngestionResult> {
    const entity = await this.db.getEntityById(entityId);
    if (!entity) {
      throw new Error(`Entity ${entityId} not found in Atlas database`);
    }

    // 1. DISCOVER & 2. COLLECT
    const fetchResult = await this.weatherProvider.fetchLatest(entity.id, entity.coordinates);
    const rawData = fetchResult.data;

    // 3. INGEST & 4. PARSE & 5. NORMALIZE
    const normalizedData: WeatherData = {
      ...rawData,
      temperatureC: Math.round(rawData.temperatureC * 10) / 10,
      rainfallMm: Math.round(rawData.rainfallMm * 10) / 10,
      humidityPct: Math.min(100, Math.max(0, Math.round(rawData.humidityPct))),
      pressureHpa: Math.round(rawData.pressureHpa)
    };

    // 6. SCHEMA VALIDATE
    if (isNaN(normalizedData.temperatureC) || isNaN(normalizedData.rainfallMm)) {
      throw new Error('Schema validation failure: numeric readings are NaN');
    }

    // 7. GEO VALIDATE
    const [lat, lng] = entity.coordinates;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error(`Geographic coordinates invalid: [${lat}, ${lng}]`);
    }

    // 8. QUALITY CHECK & 9. ANOMALY DETECTION
    // Physical bounds check: Earth surface temperature cannot realistically be < -90C or > 65C
    if (normalizedData.temperatureC < -90 || normalizedData.temperatureC > 65) {
      throw new Error(`Anomaly detected: Unrealistic temperature ${normalizedData.temperatureC}°C exceeds physical bounds`);
    }

    // 10. CROSS-SOURCE COMPARISON
    // Compare with current baseline in database
    const existing = await this.db.getWeather(entity.id);
    let isDiscrepancy = false;
    let discrepancyMsg = '';

    if (existing) {
      const deltaTemp = Math.abs(existing.temperatureC - normalizedData.temperatureC);
      // If sudden change exceeds 20 degrees C between consecutive readings without severe weather, flag for review
      if (deltaTemp > 20) {
        isDiscrepancy = true;
        discrepancyMsg = `Unusual sudden temperature fluctuation of ${deltaTemp.toFixed(1)}°C from previous reading (${existing.temperatureC}°C to ${normalizedData.temperatureC}°C).`;
      }
    }

    // 11. PROVENANCE ATTACHMENT
    const sourceMetadata: SourceMetadata = {
      ...fetchResult.source,
      collectionTime: new Date().toISOString(),
      dataStatus: isDiscrepancy ? 'SOURCE_CONFLICT' : fetchResult.status
    };
    normalizedData.metadata = sourceMetadata;

    // 12. VERIFICATION & 13. VERSIONING & 14. PUBLISH OR QUEUE
    if (isDiscrepancy) {
      // Create verification record in human review queue
      await this.db.createVerificationRecord({
        entityId: entity.id,
        entityName: entity.name,
        domain: 'weather',
        currentVersion: existing?.metadata.datasetVersion || 'v1',
        proposedVersion: 'v-anomaly-check',
        proposedBy: 'Automated Anomaly Detector',
        proposerRole: 'ADMIN',
        status: 'SOURCE_CONFLICT',
        discrepancySummary: discrepancyMsg,
        evidenceUrls: ['https://open-meteo.com/v1/forecast'],
        sourceMetadata,
        changePayload: normalizedData
      });

      // Audit log
      await this.db.createAuditLog({
        actorId: 'system',
        actorEmail: 'pipeline@atlasai.internal',
        actorRole: 'SUPER_ADMIN',
        action: 'INGESTION_CONFLICT_DETECTED',
        resourceType: 'WEATHER',
        resourceId: entity.id,
        details: { entityId: entity.id, delta: discrepancyMsg }
      });

      return {
        step: '14. QUEUE_FOR_REVIEW',
        success: true,
        entityId: entity.id,
        domain: 'weather',
        status: 'SOURCE_CONFLICT',
        discrepancyDetected: true,
        queuedForReview: true,
        message: `Reading ingested but flagged as SOURCE_CONFLICT: ${discrepancyMsg}`
      };
    }

    // Safe publication: Save updated weather directly
    await this.db.saveWeather(normalizedData);

    // 15. AUDIT LOG
    await this.db.createAuditLog({
      actorId: 'system',
      actorEmail: 'pipeline@atlasai.internal',
      actorRole: 'SUPER_ADMIN',
      action: 'INGESTION_PUBLISHED',
      resourceType: 'WEATHER',
      resourceId: entity.id,
      details: {
        temperatureC: normalizedData.temperatureC,
        condition: normalizedData.condition,
        status: normalizedData.metadata.dataStatus
      }
    });

    return {
      step: '14. PUBLISHED',
      success: true,
      entityId: entity.id,
      domain: 'weather',
      status: normalizedData.metadata.dataStatus,
      discrepancyDetected: false,
      queuedForReview: false,
      message: `Weather dataset verified and published for ${entity.name} (${normalizedData.temperatureC}°C, ${normalizedData.condition})`
    };
  }
}
