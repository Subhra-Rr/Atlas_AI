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
  ScheduledJob
} from '../../src/types/atlas.js';

export const OFFICIAL_SOURCES: Record<string, SourceMetadata> = {
  IMD: {
    sourceId: 'SRC-IMD-001',
    sourceName: 'India Meteorological Department (IMD)',
    sourceType: 'AUTHORITATIVE_OFFICIAL',
    sourceUrl: 'https://mausam.imd.gov.in',
    authorityLevel: 'HIGH',
    license: 'Government Open Data License - India (GODL)',
    datasetName: 'National Hydro-Meteorological Gridded Observation & Rainfall Reports',
    datasetVersion: 'v2025.4.1',
    publicationDate: '2025-01-15',
    effectiveDate: '2025-01-01',
    collectionTime: '2026-09-23T18:00:00Z',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'IMD Climatological Division',
    verifiedAt: '2025-02-01T10:00:00Z',
    dataStatus: 'VERIFIED',
    attribution: 'Ministry of Earth Sciences, Government of India'
  },
  DES_ODISHA: {
    sourceId: 'SRC-OD-DES-002',
    sourceName: 'Directorate of Economics and Statistics, Odisha',
    sourceType: 'AUTHORITATIVE_OFFICIAL',
    sourceUrl: 'https://desodisha.nic.in',
    authorityLevel: 'HIGH',
    license: 'Government of Odisha Public Information Mandate',
    datasetName: 'Odisha Economic Survey & District Statistical Handbooks',
    datasetVersion: 'v2024-25.Final',
    publicationDate: '2025-02-20',
    effectiveDate: '2024-04-01',
    collectionTime: '2025-03-01T00:00:00Z',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Chief Economist Office, Planning & Convergence Dept',
    verifiedAt: '2025-03-05T12:00:00Z',
    dataStatus: 'VERIFIED',
    attribution: 'Directorate of Economics & Statistics, Bhubaneswar'
  },
  AGRI_ODISHA: {
    sourceId: 'SRC-OD-AGRI-003',
    sourceName: 'Department of Agriculture & Farmers Empowerment, Odisha',
    sourceType: 'AUTHORITATIVE_OFFICIAL',
    sourceUrl: 'https://agri.odisha.gov.in',
    authorityLevel: 'HIGH',
    license: 'National Data Sharing and Accessibility Policy (NDSAP)',
    datasetName: 'Crop Acreage, Production & Productivity Estimates (Kharif/Rabi)',
    datasetVersion: 'v2024.R2',
    publicationDate: '2025-01-10',
    effectiveDate: '2024-11-01',
    collectionTime: '2025-01-15T00:00:00Z',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Agricultural Statistics Bureau',
    verifiedAt: '2025-01-20T14:30:00Z',
    dataStatus: 'VERIFIED',
    attribution: 'Krushi Bhavan, Government of Odisha'
  },
  OSDMA: {
    sourceId: 'SRC-OSDMA-004',
    sourceName: 'Odisha State Disaster Management Authority (OSDMA)',
    sourceType: 'AUTHORITATIVE_OFFICIAL',
    sourceUrl: 'https://osdma.org',
    authorityLevel: 'HIGH',
    license: 'State Disaster Vulnerability & Hazard Database License',
    datasetName: 'Disaster Hazard Atlas & Vulnerability Profile',
    datasetVersion: 'v2025.1',
    publicationDate: '2025-03-01',
    effectiveDate: '2025-01-01',
    collectionTime: '2026-09-20T00:00:00Z',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'State Emergency Operation Centre (SEOC)',
    verifiedAt: '2025-03-10T09:00:00Z',
    dataStatus: 'VERIFIED',
    attribution: 'Revenue & Disaster Management Dept, Odisha'
  },
  SURVEY_OF_INDIA: {
    sourceId: 'SRC-SOI-005',
    sourceName: 'Survey of India (National Mapping Agency)',
    sourceType: 'AUTHORITATIVE_OFFICIAL',
    sourceUrl: 'https://surveyofindia.gov.in',
    authorityLevel: 'HIGH',
    license: 'National Geospatial Policy 2022 Open Data Terms',
    datasetName: 'National Administrative Boundaries & Digital Topographic Database',
    datasetVersion: 'v2024.3',
    publicationDate: '2024-11-30',
    effectiveDate: '2024-01-01',
    collectionTime: '2024-12-01T00:00:00Z',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Geodetic and Research Branch, Dehradun',
    verifiedAt: '2024-12-15T08:00:00Z',
    dataStatus: 'VERIFIED',
    attribution: 'Surveyor General of India, Dehradun'
  },
  OPEN_METEO: {
    sourceId: 'SRC-OPENMETEO-006',
    sourceName: 'Open-Meteo & WMO Global Ensemble Forecast',
    sourceType: 'RECOGNIZED_SCIENTIFIC',
    sourceUrl: 'https://open-meteo.com',
    authorityLevel: 'HIGH',
    license: 'CC-BY 4.0 (attribution required)',
    datasetName: 'Global High-Resolution Weather & Climate Reanalysis',
    datasetVersion: 'v2.12',
    publicationDate: '2026-09-23',
    effectiveDate: '2026-09-23',
    collectionTime: '2026-09-23T22:30:00Z',
    verificationStatus: 'LIVE',
    verifiedBy: 'Automated Sensor & Satellite Pipeline',
    verifiedAt: '2026-09-23T22:35:00Z',
    dataStatus: 'LIVE',
    attribution: 'ECMWF / NOAA / DWD via Open-Meteo API'
  },
  UNESCO: {
    sourceId: 'SRC-UNESCO-007',
    sourceName: 'UNESCO World Heritage Centre',
    sourceType: 'AUTHORITATIVE_OFFICIAL',
    sourceUrl: 'https://whc.unesco.org',
    authorityLevel: 'HIGH',
    license: 'UNESCO Open Access Repository',
    datasetName: 'World Cultural & Natural Heritage List',
    datasetVersion: 'v2025.1',
    publicationDate: '2025-01-01',
    effectiveDate: '2025-01-01',
    collectionTime: '2025-02-01T00:00:00Z',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'World Heritage Committee',
    verifiedAt: '2025-02-10T00:00:00Z',
    dataStatus: 'VERIFIED',
    attribution: 'UNESCO, Paris'
  },
  RAMSAR: {
    sourceId: 'SRC-RAMSAR-008',
    sourceName: 'Ramsar Convention on Wetlands',
    sourceType: 'RECOGNIZED_SCIENTIFIC',
    sourceUrl: 'https://rsis.ramsar.org',
    authorityLevel: 'HIGH',
    license: 'Ramsar Sites Information Service Open Terms',
    datasetName: 'Information Sheet on Ramsar Wetlands (RIS) - Chilika Lake (Site 229)',
    datasetVersion: 'v2024.2',
    publicationDate: '2024-09-01',
    effectiveDate: '2024-01-01',
    collectionTime: '2024-10-01T00:00:00Z',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Chilika Development Authority & Ramsar Secretariat',
    verifiedAt: '2024-10-15T00:00:00Z',
    dataStatus: 'VERIFIED',
    attribution: 'Ramsar Secretariat, Gland, Switzerland'
  },
  USGS: {
    sourceId: 'SRC-USGS-009',
    sourceName: 'United States Geological Survey (USGS)',
    sourceType: 'AUTHORITATIVE_OFFICIAL',
    sourceUrl: 'https://www.usgs.gov',
    authorityLevel: 'HIGH',
    license: 'US Public Domain',
    datasetName: 'Global Elevation & Earthquake Hazards Program',
    datasetVersion: 'v2025.0',
    publicationDate: '2025-01-01',
    effectiveDate: '2025-01-01',
    collectionTime: '2026-09-23T00:00:00Z',
    verificationStatus: 'VERIFIED',
    dataStatus: 'VERIFIED',
    attribution: 'USGS National Geospatial Program'
  }
};

export const SEED_ENTITIES: GeographicEntity[] = [
  // 1. Countries
  {
    id: 'india',
    name: 'India',
    nativeName: 'भारत (Bhārat)',
    type: 'country',
    coordinates: [20.5937, 78.9629],
    bbox: [6.7535, 68.1624, 35.5087, 97.3956],
    areaKm2: 3287263,
    population: 1428627663,
    capital: 'New Delhi',
    description: 'South Asian nation spanning from the snow-capped Himalayan ranges to the tropical Indian Ocean, boasting exceptional geographic and agricultural diversity.',
    geometryType: 'Polygon',
    geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [68.16, 23.70], [72.82, 18.96], [76.50, 9.93], [77.53, 8.08],
          [79.80, 11.93], [80.27, 13.08], [85.82, 19.80], [87.50, 21.60],
          [88.36, 22.57], [92.00, 24.50], [97.30, 28.00], [94.00, 29.50],
          [88.50, 27.50], [81.00, 30.50], [77.00, 32.50], [74.50, 34.50],
          [73.50, 31.00], [70.50, 27.00], [68.16, 23.70]
        ]
      ]
    },
    sources: OFFICIAL_SOURCES.SURVEY_OF_INDIA,
    updatedAt: '2025-03-01T00:00:00Z'
  },
  {
    id: 'japan',
    name: 'Japan',
    nativeName: '日本 (Nihon)',
    type: 'country',
    coordinates: [36.2048, 138.2529],
    bbox: [24.0, 122.9, 45.5, 153.9],
    areaKm2: 377975,
    population: 124500000,
    capital: 'Tokyo',
    description: 'East Asian island nation along the Pacific Ring of Fire featuring rugged volcanic terrain, maritime temperate climate, and world-class technological infrastructure.',
    geometryType: 'Polygon',
    geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [130.0, 31.0], [135.0, 34.0], [139.7, 35.6], [141.5, 38.5],
          [145.5, 43.5], [141.0, 45.4], [138.5, 37.0], [131.0, 34.0], [130.0, 31.0]
        ]
      ]
    },
    sources: OFFICIAL_SOURCES.USGS,
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'usa',
    name: 'United States of America',
    nativeName: 'United States',
    type: 'country',
    coordinates: [37.0902, -95.7129],
    bbox: [24.5, -125.0, 49.38, -66.9],
    areaKm2: 9833517,
    population: 335893238,
    capital: 'Washington, D.C.',
    description: 'Federal republic in North America comprising 50 states, spanning multiple biomes from Arctic tundra in Alaska to subtropical wetlands and vast agricultural plains.',
    geometryType: 'Polygon',
    geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [-124.7, 48.4], [-117.0, 32.5], [-106.5, 31.7], [-97.1, 25.9],
          [-80.2, 25.8], [-75.5, 35.2], [-70.0, 41.5], [-67.0, 44.8],
          [-75.0, 45.0], [-95.0, 49.0], [-124.7, 48.4]
        ]
      ]
    },
    sources: OFFICIAL_SOURCES.USGS,
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'germany',
    name: 'Germany',
    nativeName: 'Deutschland',
    type: 'country',
    coordinates: [51.1657, 10.4515],
    bbox: [47.27, 5.86, 55.05, 15.04],
    areaKm2: 357022,
    population: 84400000,
    capital: 'Berlin',
    description: 'Central European country characterized by the North European Plain, central uplands, Bavarian Alps, and major navigable river basins like the Rhine and Danube.',
    geometryType: 'Polygon',
    geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [6.0, 50.5], [6.5, 49.0], [7.5, 47.5], [13.0, 47.5],
          [14.5, 51.0], [14.0, 53.5], [9.5, 54.8], [7.0, 53.5], [6.0, 50.5]
        ]
      ]
    },
    sources: OFFICIAL_SOURCES.USGS,
    updatedAt: '2025-01-01T00:00:00Z'
  },

  // 2. States / Provinces
  {
    id: 'odisha',
    name: 'Odisha',
    nativeName: 'ଓଡ଼ିଶା (Oḍiśā)',
    type: 'state',
    parentId: 'india',
    parentName: 'India',
    coordinates: [20.9517, 85.0985],
    bbox: [17.78, 81.37, 22.57, 87.53],
    areaKm2: 155707,
    population: 43700000,
    capital: 'Bhubaneswar',
    description: 'Eastern coastal state of India bounded by the Bay of Bengal, known as Utkala/Kalinga historically. Blessed with a 480 km coastline, the Mahanadi river basin, fertile deltaic plains, Similipal biosphere reserve, and rich mineral wealth.',
    geometryType: 'Polygon',
    geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [81.40, 18.20], [82.50, 18.00], [84.50, 18.90], [85.00, 19.40],
          [86.00, 19.80], [86.70, 20.30], [87.10, 21.20], [87.50, 21.60],
          [86.80, 22.30], [85.50, 22.30], [84.00, 22.00], [82.70, 21.00],
          [82.30, 20.00], [81.40, 18.20]
        ]
      ]
    },
    sources: OFFICIAL_SOURCES.DES_ODISHA,
    updatedAt: '2025-03-01T00:00:00Z'
  },

  // 3. Key Districts of Odisha
  {
    id: 'ganjam',
    name: 'Ganjam',
    nativeName: 'ଗଞ୍ଜାମ (Gañjām)',
    type: 'district',
    parentId: 'odisha',
    parentName: 'Odisha',
    coordinates: [19.3800, 84.8800],
    bbox: [19.05, 84.15, 20.08, 85.18],
    areaKm2: 8206,
    population: 3529031,
    capital: 'Chhatrapur',
    description: 'Prominent southern coastal district of Odisha along the Bay of Bengal and Rushikulya River. Renowned as the "Granary of Southern Odisha" for intensive Kharif paddy cultivation, Chilika lake fisheries, Gopalpur port, and Olive Ridley sea turtle nesting at Rushikulya rookery.',
    geometryType: 'Polygon',
    geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [84.18, 19.30], [84.50, 19.10], [84.90, 19.25], [85.15, 19.55],
          [85.10, 19.85], [84.70, 20.05], [84.30, 19.80], [84.18, 19.30]
        ]
      ]
    },
    sources: OFFICIAL_SOURCES.DES_ODISHA,
    updatedAt: '2025-03-01T00:00:00Z'
  },
  {
    id: 'khordha',
    name: 'Khordha',
    nativeName: 'ଖୋର୍ଦ୍ଧା (Khorddhā)',
    type: 'district',
    parentId: 'odisha',
    parentName: 'Odisha',
    coordinates: [20.1800, 85.6200],
    bbox: [19.65, 84.95, 20.45, 86.05],
    areaKm2: 2813,
    population: 2251673,
    capital: 'Khordha (State Capital: Bhubaneswar)',
    description: 'Central administrative and economic hub of Odisha housing the state capital Bhubaneswar ("Temple City"), Daya River plains where the historic Kalinga War occurred, and part of northern Chilika Lake.',
    geometryType: 'Polygon',
    geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [84.95, 20.10], [85.30, 19.70], [85.70, 19.80], [86.00, 20.25],
          [85.80, 20.45], [85.30, 20.35], [84.95, 20.10]
        ]
      ]
    },
    sources: OFFICIAL_SOURCES.DES_ODISHA,
    updatedAt: '2025-03-01T00:00:00Z'
  },
  {
    id: 'cuttack',
    name: 'Cuttack',
    nativeName: 'କଟକ (Kaṭaka)',
    type: 'district',
    parentId: 'odisha',
    parentName: 'Odisha',
    coordinates: [20.4625, 85.8830],
    bbox: [20.05, 85.35, 20.75, 86.30],
    areaKm2: 3932,
    population: 2624470,
    capital: 'Cuttack',
    description: 'Millennium-old commercial and judicial capital of Odisha situated at the bifurcation of Mahanadi and Kathajodi rivers. Renowned for Silver Filigree (Tarakasi), Bali Jatra festival on Mahanadi banks, and high-yielding alluvial rice fields.',
    geometryType: 'Polygon',
    geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [85.35, 20.40], [85.70, 20.10], [86.20, 20.30], [86.30, 20.65],
          [85.85, 20.75], [85.50, 20.60], [85.35, 20.40]
        ]
      ]
    },
    sources: OFFICIAL_SOURCES.DES_ODISHA,
    updatedAt: '2025-03-01T00:00:00Z'
  },
  {
    id: 'puri',
    name: 'Puri',
    nativeName: 'ପୁରୀ (Purī)',
    type: 'district',
    parentId: 'odisha',
    parentName: 'Odisha',
    coordinates: [19.8135, 85.8312],
    bbox: [19.45, 85.10, 20.15, 86.40],
    areaKm2: 3479,
    population: 1698730,
    capital: 'Puri',
    description: 'Spiritual and coastal tourist heartland of Odisha on the Bay of Bengal, home to the 12th-century Jagannath Temple, the world-famous annual Rath Yatra (Chariot Festival), Konark Sun Temple (UNESCO World Heritage Site), and extensive coconut/paddy farming.',
    geometryType: 'Polygon',
    geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [85.10, 19.55], [85.60, 19.70], [86.10, 19.85], [86.40, 20.05],
          [86.10, 20.15], [85.70, 19.95], [85.10, 19.55]
        ]
      ]
    },
    sources: OFFICIAL_SOURCES.DES_ODISHA,
    updatedAt: '2025-03-01T00:00:00Z'
  },
  {
    id: 'mayurbhanj',
    name: 'Mayurbhanj',
    nativeName: 'ମୟୂରଭଞ୍ଜ (Mayūrbhañja)',
    type: 'district',
    parentId: 'odisha',
    parentName: 'Odisha',
    coordinates: [21.9300, 86.7300],
    bbox: [21.25, 85.65, 22.55, 87.15],
    areaKm2: 10418,
    population: 2519738,
    capital: 'Baripada',
    description: 'Largest district of Odisha by land area, home to the Similipal Biosphere Reserve, UNESCO Man and Biosphere network, Royal Bengal tigers, rich tribal culture (Santhal, Ho, Kolha), and Chhau dance.',
    geometryType: 'Polygon',
    geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [85.70, 21.80], [86.20, 21.30], [86.90, 21.50], [87.15, 22.20],
          [86.60, 22.55], [85.90, 22.30], [85.70, 21.80]
        ]
      ]
    },
    sources: OFFICIAL_SOURCES.DES_ODISHA,
    updatedAt: '2025-03-01T00:00:00Z'
  },
  {
    id: 'koraput',
    name: 'Koraput',
    nativeName: 'କୋରାପୁଟ (Korāpuṭa)',
    type: 'district',
    parentId: 'odisha',
    parentName: 'Odisha',
    coordinates: [18.8100, 82.7100],
    bbox: [18.20, 82.05, 19.25, 83.25],
    areaKm2: 8807,
    population: 1379647,
    capital: 'Koraput',
    description: 'Highland plateau district in the Eastern Ghats housing Deomali (highest peak in Odisha at 1,672m), renowned for shade-grown organic Arabica coffee, traditional millet bio-diversity (recognized by FAO as Globally Important Agricultural Heritage System), and tribal heritage.',
    geometryType: 'Polygon',
    geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [82.10, 18.30], [82.80, 18.20], [83.20, 18.80], [83.10, 19.25],
          [82.50, 19.10], [82.20, 18.70], [82.10, 18.30]
        ]
      ]
    },
    sources: OFFICIAL_SOURCES.DES_ODISHA,
    updatedAt: '2025-03-01T00:00:00Z'
  },
  {
    id: 'sambalpur',
    name: 'Sambalpur',
    nativeName: 'ସମ୍ବଲପୁର (Sambalapura)',
    type: 'district',
    parentId: 'odisha',
    parentName: 'Odisha',
    coordinates: [21.4669, 83.9812],
    bbox: [20.75, 83.60, 21.85, 84.70],
    areaKm2: 6657,
    population: 1041099,
    capital: 'Sambalpur',
    description: 'Western Odisha cultural and industrial hub on the Mahanadi River, home to the Hirakud Dam (one of the longest earthen dams in the world), world-famous Sambalpuri handloom ikat textiles, and the harvest festival of Nuakhai.',
    geometryType: 'Polygon',
    geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [83.60, 21.30], [84.10, 20.80], [84.65, 21.10], [84.70, 21.80],
          [84.20, 21.85], [83.75, 21.60], [83.60, 21.30]
        ]
      ]
    },
    sources: OFFICIAL_SOURCES.DES_ODISHA,
    updatedAt: '2025-03-01T00:00:00Z'
  },

  // 4. Physical Geography: Rivers & Water Bodies
  {
    id: 'mahanadi-river',
    name: 'Mahanadi River',
    nativeName: 'ମହାନଦୀ (Maha-nadi - The Great River)',
    type: 'river',
    parentId: 'odisha',
    parentName: 'Odisha / Chhattisgarh',
    coordinates: [20.4000, 85.5000],
    areaKm2: 141600, // Basin area
    description: 'Major river of East Central India flowing 858 km through Chhattisgarh and Odisha into the Bay of Bengal. Provides life-sustaining irrigation to millions of hectares across Odisha delta and feeds the Hirakud reservoir.',
    geometryType: 'LineString',
    geojson: {
      type: 'LineString',
      coordinates: [
        [81.90, 21.15], [83.20, 21.50], [83.85, 21.52], [84.80, 20.60],
        [85.80, 20.48], [86.70, 20.30]
      ]
    },
    sources: OFFICIAL_SOURCES.SURVEY_OF_INDIA,
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'rushikulya-river',
    name: 'Rushikulya River',
    nativeName: 'ଋଷିକୂଲ୍ୟା (Ruṣikūlyā)',
    type: 'river',
    parentId: 'ganjam',
    parentName: 'Ganjam, Odisha',
    coordinates: [19.3667, 85.0500],
    areaKm2: 8475,
    description: 'River of southern Odisha originating from Daringbadi hills (Eastern Ghats) and draining into the Bay of Bengal near Ganjam town. The estuary is one of the world\'s largest mass-nesting (Arribada) rookeries for endangered Olive Ridley sea turtles.',
    geometryType: 'LineString',
    geojson: {
      type: 'LineString',
      coordinates: [
        [84.10, 19.90], [84.40, 19.70], [84.75, 19.50], [85.08, 19.37]
      ]
    },
    sources: OFFICIAL_SOURCES.SURVEY_OF_INDIA,
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'chilika-lake',
    name: 'Chilika Lake',
    nativeName: 'ଚିଲିକା ହ୍ରଦ (Cilikā Hrada)',
    type: 'wetland',
    parentId: 'odisha',
    parentName: 'Ganjam / Puri / Khordha, Odisha',
    coordinates: [19.7000, 85.3333],
    areaKm2: 1165,
    description: 'Largest brackish water lagoon in Asia and second largest in the world, designated as the first Indian wetland of international importance under the Ramsar Convention in 1981. Wintering sanctuary for over 1 million migratory waterfowl and home to endangered Irrawaddy dolphins.',
    geometryType: 'Polygon',
    geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [85.10, 19.50], [85.35, 19.65], [85.55, 19.85], [85.45, 19.90],
          [85.25, 19.75], [85.05, 19.55], [85.10, 19.50]
        ]
      ]
    },
    sources: OFFICIAL_SOURCES.RAMSAR,
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'deomali-peak',
    name: 'Deomali Peak',
    nativeName: 'ଦେଓମାଳୀ (Deomāḷī)',
    type: 'mountain',
    parentId: 'koraput',
    parentName: 'Koraput, Odisha',
    coordinates: [18.6667, 82.9667],
    elevationM: 1672,
    description: 'Highest mountain peak in the state of Odisha, located in the Chandragiri-Pottangi sub-range of the Eastern Ghats. Features bauxite-capped plateaus, rich endemic montane flora, and rolling mist-clad valleys.',
    geometryType: 'Point',
    sources: OFFICIAL_SOURCES.SURVEY_OF_INDIA,
    updatedAt: '2025-01-01T00:00:00Z'
  }
];

// Rich meteorological, agricultural, economic, cultural, and hazard data
export const SEED_WEATHER: Record<string, WeatherData> = {
  ganjam: {
    entityId: 'ganjam',
    temperatureC: 31.4,
    feelsLikeC: 36.8,
    rainfallMm: 3.2,
    humidityPct: 78,
    windSpeedKph: 18.5,
    windDirectionDeg: 135,
    pressureHpa: 1008.2,
    cloudCoverPct: 42,
    visibilityKm: 9.5,
    uvIndex: 8.2,
    condition: 'Partly Cloudy with Coastal Breeze',
    observationTime: '2026-09-23T18:00:00Z',
    freshness: 'Observation recorded within last 30 minutes',
    metadata: OFFICIAL_SOURCES.IMD
  },
  odisha: {
    entityId: 'odisha',
    temperatureC: 30.8,
    feelsLikeC: 35.5,
    rainfallMm: 4.8,
    humidityPct: 76,
    windSpeedKph: 14.2,
    pressureHpa: 1009.1,
    cloudCoverPct: 55,
    visibilityKm: 10.0,
    uvIndex: 7.9,
    condition: 'Tropical Humid with Scattered Showers',
    observationTime: '2026-09-23T18:00:00Z',
    freshness: 'Aggregated state meteorological grid',
    metadata: OFFICIAL_SOURCES.IMD
  },
  india: {
    entityId: 'india',
    temperatureC: 28.5,
    feelsLikeC: 31.2,
    rainfallMm: 5.1,
    humidityPct: 72,
    windSpeedKph: 12.0,
    pressureHpa: 1010.0,
    cloudCoverPct: 50,
    visibilityKm: 8.0,
    uvIndex: 7.5,
    condition: 'Monsoon Retreating / Post-Monsoon Transition',
    observationTime: '2026-09-23T18:00:00Z',
    freshness: 'National composite meteorological grid',
    metadata: OFFICIAL_SOURCES.IMD
  }
};

export const SEED_CLIMATE: Record<string, ClimateData> = {
  ganjam: {
    entityId: 'ganjam',
    koppenClassification: 'Aw',
    koppenDescription: 'Tropical Savanna (Wet-and-Dry) Climate with maritime modulation along the Bay of Bengal.',
    avgAnnualRainfallMm: 1296.0,
    avgSummerTempC: 34.5,
    avgWinterTempC: 17.2,
    seasonalPatterns: 'Hot dry pre-monsoon summer (March-May); intense South-West monsoon rainfall (June-September); active cyclonic post-monsoon (October-November); mild dry winter (December-February).',
    observedTrend: 'Increase in extreme precipitation events and cyclonic intensity in the Bay of Bengal over the 1991-2025 climatological baseline.',
    period: '1991-2025 Climatological Normal Baseline',
    metadata: OFFICIAL_SOURCES.IMD
  },
  odisha: {
    entityId: 'odisha',
    koppenClassification: 'Aw / Cwa',
    koppenDescription: 'Tropical Savanna in coastal and central zones; Subtropical Humid in the northern highland plateau (Similipal).',
    avgAnnualRainfallMm: 1489.0,
    avgSummerTempC: 37.2,
    avgWinterTempC: 15.0,
    seasonalPatterns: 'Receives approximately 78% of its total annual precipitation during the southwest monsoon season (June to September).',
    observedTrend: 'Spatial variation in monsoon onset dates, with higher frequency of heatwaves in western districts (Sambalpur, Titlagarh) during April-May.',
    period: '1991-2025 Climatological Baseline',
    metadata: OFFICIAL_SOURCES.IMD
  }
};

export const SEED_RAINFALL: Record<string, RainfallData> = {
  ganjam: {
    entityId: 'ganjam',
    annualAverageMm: 1296.0,
    currentYearTotalMm: 1184.5,
    monthlyRainfallMm: [
      { month: 'Jan', mm: 8.2, avgMm: 10.5 },
      { month: 'Feb', mm: 14.1, avgMm: 15.2 },
      { month: 'Mar', mm: 18.0, avgMm: 19.5 },
      { month: 'Apr', mm: 24.5, avgMm: 28.0 },
      { month: 'May', mm: 65.2, avgMm: 68.4 },
      { month: 'Jun', mm: 158.4, avgMm: 165.0 },
      { month: 'Jul', mm: 242.0, avgMm: 255.8 },
      { month: 'Aug', mm: 278.5, avgMm: 282.4 },
      { month: 'Sep', mm: 215.2, avgMm: 220.1 },
      { month: 'Oct', mm: 122.4, avgMm: 150.2 },
      { month: 'Nov', mm: 32.0, avgMm: 65.0 },
      { month: 'Dec', mm: 6.0, avgMm: 16.0 }
    ],
    monsoonContributionPct: 76.5,
    rainfallAnomalyPct: -4.2,
    status: 'Normal rainfall category (-19% to +19%) per IMD classification standards',
    period: '2024-2025 Hydro-Meteorological Year',
    metadata: OFFICIAL_SOURCES.IMD
  },
  odisha: {
    entityId: 'odisha',
    annualAverageMm: 1489.0,
    currentYearTotalMm: 1442.8,
    monthlyRainfallMm: [
      { month: 'Jan', mm: 11.0, avgMm: 12.4 },
      { month: 'Feb', mm: 21.0, avgMm: 23.5 },
      { month: 'Mar', mm: 25.5, avgMm: 26.2 },
      { month: 'Apr', mm: 38.0, avgMm: 39.5 },
      { month: 'May', mm: 84.5, avgMm: 85.0 },
      { month: 'Jun', mm: 218.0, avgMm: 225.4 },
      { month: 'Jul', mm: 335.2, avgMm: 340.5 },
      { month: 'Aug', mm: 362.4, avgMm: 365.0 },
      { month: 'Sep', mm: 245.0, avgMm: 248.2 },
      { month: 'Oct', mm: 82.2, avgMm: 105.0 },
      { month: 'Nov', mm: 16.0, avgMm: 35.0 },
      { month: 'Dec', mm: 4.0, avgMm: 9.0 }
    ],
    monsoonContributionPct: 78.2,
    rainfallAnomalyPct: -3.1,
    status: 'Normal Rainfall',
    period: '2024-2025',
    metadata: OFFICIAL_SOURCES.IMD
  }
};

export const SEED_AGRICULTURE: Record<string, AgricultureData> = {
  ganjam: {
    entityId: 'ganjam',
    agriculturalLandPct: 58.4,
    irrigatedLandPct: 62.8,
    majorSoilTypes: ['Coastal Alluvial Soil', 'Red Sandy Loam Soil', 'Laterite Soil in Upper Catchment'],
    crops: [
      {
        name: 'Rice (Paddy)',
        type: 'Cereal',
        season: 'Kharif',
        sowingMonths: 'June - July',
        harvestMonths: 'November - December',
        areaCultivatedHa: 224500,
        productionMetricTons: 825000,
        yieldKgPerHa: 3675,
        waterRequirement: 'High',
        suitabilityScore: 94
      },
      {
        name: 'Black Gram (Biri) & Green Gram (Mung)',
        type: 'Pulse',
        season: 'Rabi',
        sowingMonths: 'November - December',
        harvestMonths: 'February - March',
        areaCultivatedHa: 68400,
        productionMetricTons: 42500,
        yieldKgPerHa: 621,
        waterRequirement: 'Low',
        suitabilityScore: 88
      },
      {
        name: 'Groundnut & Mustard',
        type: 'Oilseed',
        season: 'Rabi',
        sowingMonths: 'December',
        harvestMonths: 'March - April',
        areaCultivatedHa: 32000,
        productionMetricTons: 54400,
        yieldKgPerHa: 1700,
        waterRequirement: 'Medium',
        suitabilityScore: 82
      },
      {
        name: 'Sugarcane',
        type: 'Cash',
        season: 'Perennial',
        sowingMonths: 'January - March',
        harvestMonths: 'December - February',
        areaCultivatedHa: 12500,
        productionMetricTons: 780000,
        yieldKgPerHa: 62400,
        waterRequirement: 'High',
        suitabilityScore: 85
      }
    ],
    livestockOverview: 'Strong inland fisheries along Chilika and Rushikulya canals; coastal brackish water shrimp aquaculture (L. vannamei).',
    period: '2024-2025 Agricultural Statistical Survey',
    metadata: OFFICIAL_SOURCES.AGRI_ODISHA
  },
  odisha: {
    entityId: 'odisha',
    agriculturalLandPct: 61.8,
    irrigatedLandPct: 44.5,
    majorSoilTypes: ['Red Soils (Hilly tract)', 'Laterite Soils', 'Coastal Alluvial', 'Deltaic Saline Soils'],
    crops: [
      {
        name: 'Rice (Paddy)',
        type: 'Cereal',
        season: 'Kharif',
        sowingMonths: 'June - July',
        harvestMonths: 'November - December',
        areaCultivatedHa: 3950000,
        productionMetricTons: 9800000,
        yieldKgPerHa: 2481,
        waterRequirement: 'High',
        suitabilityScore: 92
      },
      {
        name: 'Ragi (Finger Millet) & Minor Millets',
        type: 'Cereal',
        season: 'Kharif',
        sowingMonths: 'July',
        harvestMonths: 'October - November',
        areaCultivatedHa: 185000,
        productionMetricTons: 220000,
        yieldKgPerHa: 1189,
        waterRequirement: 'Low',
        suitabilityScore: 96
      }
    ],
    livestockOverview: 'Odisha Millet Mission promoting climate-resilient indigenous millets; extensive freshwater aquaculture under Mission Shakti.',
    period: '2024-2025',
    metadata: OFFICIAL_SOURCES.AGRI_ODISHA
  }
};

export const SEED_ECONOMY: Record<string, EconomicData> = {
  ganjam: {
    entityId: 'ganjam',
    gsdpBillionUsd: 6.8,
    gdpPerCapitaUsd: 1920,
    agricultureSharePct: 24.2,
    industrySharePct: 32.5,
    servicesSharePct: 43.3,
    keyIndustries: [
      'Gopalpur Port-linked heavy industries',
      'Tata Steel SEZ (Ferro-chrome & heavy engineering)',
      'Grasim Industries Chemical Complex (Caustic Soda)',
      'Indian Rare Earths Limited (IREL) Beach Sand Mineral Processing',
      'Cashew Nut Processing & Fish Cold Storage Clusters'
    ],
    majorExports: ['Processed Mineral Sands (Ilmenite, Rutile, Monazite)', 'Frozen Coastal Shrimp', 'Raw & Roasted Cashew', 'Rice'],
    majorImports: ['Petroleum Products', 'Fertilizers', 'Heavy Machinery'],
    primaryCommodities: ['Paddy Rice', 'Marine Shrimp', 'Beach Sand Heavy Minerals', 'Cashew Kernel', 'Handloom Textiles'],
    economicHubs: ['Brahmapur Commercial Hub', 'Gopalpur Industrial Corridor', 'Chhatrapur Administrative Zone', 'Aska Cooperative Cluster'],
    period: '2024-2025 Fiscal Estimates',
    metadata: OFFICIAL_SOURCES.DES_ODISHA
  },
  odisha: {
    entityId: 'odisha',
    gsdpBillionUsd: 104.5,
    gdpPerCapitaUsd: 2390,
    agricultureSharePct: 20.8,
    industrySharePct: 41.2,
    servicesSharePct: 38.0,
    keyIndustries: ['Steel & Metallurgy', 'Aluminium Smelting', 'Power Generation', 'Information Technology', 'Petrochemicals (Paradip)'],
    majorExports: ['Iron Ore & Steel', 'Aluminium Ingots', 'Marine Seafood', 'IT Services', 'Handicrafts'],
    majorImports: ['Coking Coal', 'Petroleum Crude', 'Capital Equipment'],
    primaryCommodities: ['Iron Ore', 'Bauxite', 'Coal', 'Rice', 'Chromite'],
    economicHubs: ['Bhubaneswar IT & R&D Hub', 'Paradip Industrial Port Complex', 'Rourkela Steel City', 'Jharsuguda Aluminium Hub'],
    period: '2024-2025',
    metadata: OFFICIAL_SOURCES.DES_ODISHA
  }
};

export const SEED_COMMERCE: Record<string, CommercialData> = {
  ganjam: {
    entityId: 'ganjam',
    majorPorts: [
      { name: 'Gopalpur Port (Deepwater All-Weather Port)', type: 'Commercial Deepwater Port', annualCargoMt: 12.5 }
    ],
    airports: [
      { name: 'Rangeilunda Airstrip (Brahmapur)', code: 'VEBM', type: 'Domestic' }
    ],
    wholesaleMarkets: [
      { name: 'Brahmapur Wholesale Grain Market', commodity: 'Rice & Pulses', location: 'Brahmapur' },
      { name: 'Girisola Regulated Market Committee', commodity: 'Cashew, Coconut & Vegetables', location: 'Girisola Border' }
    ],
    logisticsHubs: ['NH-16 Golden Quadrilateral Freight Logistics Corridor', 'East Coast Railway Zone Brahmapur Freight Yard'],
    period: '2024-2025',
    metadata: OFFICIAL_SOURCES.DES_ODISHA
  }
};

export const SEED_POPULATION: Record<string, PopulationData> = {
  ganjam: {
    entityId: 'ganjam',
    totalPopulation: 3529031,
    densityPerKm2: 430,
    urbanizationPct: 21.8,
    literacyRatePct: 71.1,
    growthRatePct: 11.7,
    sexRatio: 983,
    year: 2024,
    settlementPatternNotes: 'Concentration of population in fertile coastal plains along NH-16 corridor, with Brahmapur serving as major urban center and dense rural agricultural villages.',
    metadata: OFFICIAL_SOURCES.DES_ODISHA
  },
  odisha: {
    entityId: 'odisha',
    totalPopulation: 43700000,
    densityPerKm2: 281,
    urbanizationPct: 17.5,
    literacyRatePct: 73.5,
    growthRatePct: 10.2,
    sexRatio: 979,
    year: 2024,
    settlementPatternNotes: 'High coastal plain density contrasts with sparse forest upland settlements in western and southern plateau zones.',
    metadata: OFFICIAL_SOURCES.DES_ODISHA
  }
};

export const SEED_CULTURE: Record<string, CultureData> = {
  ganjam: {
    entityId: 'ganjam',
    primaryLanguages: ['Odia (Southern dialect)', 'Telugu (coastal border community)', 'English', 'Hindi'],
    scripts: ['Odia Lipi'],
    traditionalClothing: ['Berhampuri Pata Silk Saree (GI Tagged)', 'Dhoti & Kurta', 'Sambalpuri Cotton Gamucha'],
    cuisineSpecialties: [
      'Ganjam Achara (Special Mango & Mixed Pickles)',
      'Brahmapur Dosa & Puri Upma',
      'Papad of Bellaguntha',
      'Rushikulya Fresh Marine Crab & Fish Curry',
      'Chenna Poda (Caramelized Cottage Cheese Dessert)'
    ],
    performingArts: ['Danda Nata (Penance Folk Dance)', 'Sakhi Nata', 'Prahlada Nataka (classical Sanskrit-Odia folk theatre)', 'Ghanta Mrudanga'],
    festivals: [
      {
        id: 'danda-nata',
        name: 'Danda Nata',
        nativeName: 'ଦଣ୍ଡ ନାଟ',
        datesRule: 'Solar Calendar',
        approximateGregorianMonths: 'April (Chaitra-Baisakh)',
        durationDays: 13,
        culturalBackground: 'Ancient ascetic folk ritual honoring Lord Shiva and Goddess Gauri, involving rigorous physical austerities on burning sands and water bodies.',
        traditions: ['Pani Danda (water penance)', 'Dhuli Danda (fire and sand penance)', 'Agni Danda (torch dancing)'],
        significance: 'Promotion of social equality across communities through shared ascetic devotion.'
      },
      {
        id: 'thakurani-yatra',
        name: 'Maa Budhi Thakurani Yatra',
        nativeName: 'ମା ବୁଢ଼ୀ ଠାକୁରାଣୀ ଯାତ୍ରା',
        datesRule: 'Lunar Calendar',
        approximateGregorianMonths: 'March - April (Biennial / alternate years)',
        durationDays: 30,
        culturalBackground: 'Grand biennial festival of Brahmapur celebrating the visit of the patron goddess Maa Budhi Thakurani to her parental abode in Desibehera street.',
        traditions: ['Vesa disguises (devotees dressing as mythological characters)', 'Giant earthen pot procession', 'Nightly folk theatre'],
        significance: 'Preeminent socio-religious celebration unifying the southern Odisha trade guilds.'
      }
    ],
    unescoHeritageSites: ['Proposed Marine Heritage buffer zone along Rushikulya Turtle Rookery'],
    prominentMuseums: ['Ganjam District Museum, Brahmapur (Sculptures, coins, palm leaf manuscripts)'],
    metadata: OFFICIAL_SOURCES.DES_ODISHA
  },
  odisha: {
    entityId: 'odisha',
    primaryLanguages: ['Odia (Classical Language of India)', 'Santhali (Ol Chiki)', 'Kui', 'Ho', 'Telugu', 'English'],
    scripts: ['Odia script', 'Ol Chiki (Santhali)'],
    traditionalClothing: ['Khandua Pata silk', 'Kotpad vegetable dye handloom', 'Sambalpuri Ikat saree'],
    cuisineSpecialties: ['Dalma (lentils with local vegetables)', 'Pakhala Bhata (fermented water rice)', 'Rasagola (Puri/Pahal GI)', 'Chhena Gaja', 'Machha Besara'],
    performingArts: ['Odissi (Classical Dance)', 'Chhau Dance of Mayurbhanj', 'Gotipua', 'Pala and Daskathia'],
    festivals: [
      {
        id: 'rath-yatra',
        name: 'Rath Yatra (Puri Chariot Festival)',
        nativeName: 'ରଥଯାତ୍ରା',
        datesRule: 'Lunar Calendar',
        approximateGregorianMonths: 'June - July (Ashadha Shukla Dwitiya)',
        durationDays: 9,
        culturalBackground: 'World-famous pilgrimage where deities Lord Jagannath, Balabhadra, and Subhadra travel on colossal decorated wooden chariots to Gundicha Temple.',
        traditions: ['Chhera Pahanra (King sweeps chariots with golden broom)', 'Pulling of chariots by millions of devotees', 'Bahuda Yatra (return journey)'],
        significance: 'Universal brotherhood and open egalitarian access to the divine beyond caste or nationality.'
      },
      {
        id: 'nuakhai',
        name: 'Nuakhai',
        nativeName: 'ନୂଆଁଖାଇ',
        datesRule: 'Lunar Calendar',
        approximateGregorianMonths: 'August - September (Bhadrapada Shukla Panchami)',
        durationDays: 1,
        culturalBackground: 'Agricultural harvest festival of Western and Central Odisha celebrating the consumption of the season\'s first harvested rice grain.',
        traditions: ['Nuakhai Juhar (greeting elders for blessings)', 'Offering Nabanna to Mother Goddess Samaleswari', 'Sambalpuri folk dances'],
        significance: 'Reverence for agriculture, farmer dignity, and familial harmony.'
      },
      {
        id: 'raja-parba',
        name: 'Raja Parba (Swing Festival of Womanhood)',
        nativeName: 'ରଜ ପର୍ବ',
        datesRule: 'Solar Calendar',
        approximateGregorianMonths: 'Mid-June (Mithuna Sankranti)',
        durationDays: 4,
        culturalBackground: 'Four-day agrarian celebration honoring Mother Earth undergoing her rejuvenative cycle prior to the arrival of monsoon showers.',
        traditions: ['Decorated rope swings (Doli)', 'Poda Pitha baking', 'Refraining from tilling or walking barefoot on soil'],
        significance: 'Celebration of feminine fertility and agricultural rejuvenation.'
      }
    ],
    unescoHeritageSites: ['Sun Temple, Konark (UNESCO World Heritage)', 'Chilika Lake (Ramsar Wetland Site #229)'],
    prominentMuseums: ['Odisha State Museum, Bhubaneswar', 'Kala Bhoomi (Odisha Crafts Museum)', 'Tribal Research Institute Museum'],
    metadata: OFFICIAL_SOURCES.UNESCO
  }
};

export const SEED_HAZARDS: NaturalHazard[] = [
  {
    id: 'hazard-cyclone-phailin',
    type: 'Cyclone',
    category: 'HISTORICAL_EVENT',
    severity: 'Extreme',
    title: 'Very Severe Cyclonic Storm Phailin (2013)',
    dateOrPeriod: 'October 12, 2013',
    affectedRegions: ['Ganjam (Gopalpur landfall)', 'Puri', 'Khordha', 'Srikakulam'],
    description: 'Catastrophic tropical cyclone with peak sustained winds of 260 km/h making landfall precisely near Gopalpur, Ganjam district. Over 1 million people were preemptively evacuated by OSDMA, in a world-recognized masterclass in disaster mitigation lauded by the United Nations.',
    casualtyOrImpactSummary: 'Casualties kept below 45 due to massive evacuation; extensive power transmission and housing damage in Ganjam.',
    mitigationNotes: 'Catalyzed building of 800+ multi-purpose cyclone shelters across coastal belt.',
    source: OFFICIAL_SOURCES.OSDMA
  },
  {
    id: 'hazard-super-cyclone-1999',
    type: 'Cyclone',
    category: 'HISTORICAL_EVENT',
    severity: 'Extreme',
    title: '1999 Odisha Super Cyclone (BOB 06)',
    dateOrPeriod: 'October 29, 1999',
    affectedRegions: ['Jagatsinghpur (landfall)', 'Kendrapara', 'Cuttack', 'Puri', 'Bhubaneswar'],
    description: 'Most intense tropical cyclone ever recorded in the North Indian Ocean basin, with sustained wind speeds of 260 km/h and a 6-meter tidal storm surge that devastated 14 coastal districts.',
    casualtyOrImpactSummary: 'Estimated 9,887 fatalities; loss of over 400,000 livestock and massive agricultural inundation.',
    mitigationNotes: 'Led to the foundational establishment of OSDMA (first state disaster agency in India) and ODRAF specialized response force.',
    source: OFFICIAL_SOURCES.OSDMA
  },
  {
    id: 'hazard-cyclone-fani',
    type: 'Cyclone',
    category: 'HISTORICAL_EVENT',
    severity: 'Extreme',
    title: 'Extremely Severe Cyclonic Storm Fani (2019)',
    dateOrPeriod: 'May 3, 2019',
    affectedRegions: ['Puri (landfall)', 'Khordha', 'Cuttack', 'Bhubaneswar'],
    description: 'Rare pre-monsoon Category 5-equivalent storm making landfall near Puri with winds of 215 km/h, causing widespread tree uprooting and urban infrastructure damage in capital city Bhubaneswar.',
    casualtyOrImpactSummary: 'Over 1.2 million people successfully evacuated in 24 hours.',
    mitigationNotes: 'Showcased early warning siren dissemination across 122 coastal stations.',
    source: OFFICIAL_SOURCES.OSDMA
  },
  {
    id: 'hazard-rushikulya-flood-risk',
    type: 'Flood',
    category: 'RISK_ASSESSMENT',
    severity: 'High',
    title: 'Rushikulya & Mahanadi Delta Monsoonal Flash Inundation Risk',
    dateOrPeriod: 'Continuous (High Risk during July-October)',
    affectedRegions: ['Aska, Ganjam', 'Purushottampur, Ganjam', 'Banki, Cuttack', 'Kendrapada delta'],
    description: 'Low-lying alluvial flats near river confluences face seasonal inundation when upstream catchments receive >150 mm/day rainfall coupled with high astronomical ocean tides blocking discharge.',
    casualtyOrImpactSummary: 'Seasonal disruption of road transit and kharif paddy submergence in non-embanked blocks.',
    mitigationNotes: 'Automated telemetry water level gauges installed by Central Water Commission.',
    source: OFFICIAL_SOURCES.OSDMA
  }
];

export const SEED_HISTORICAL_RECORDS: HistoricalRecord[] = [
  {
    id: 'hist-kalinga-war',
    entityId: 'odisha',
    yearOrEra: '261 BCE',
    historicalName: 'Kalinga (କଳିଙ୍ଗ)',
    administrativeStatus: 'Independent Sovereign Maritime Kingdom',
    historicalBoundariesSummary: 'Stretched from the River Ganges (Hooghly delta) in the north to the Godavari in the south, dominating the maritime spice routes to Suvarnabhumi (Java, Sumatra, Bali).',
    keyEvents: [
      'Epic Kalinga War fought on the banks of Daya River near Dhauli (Khordha district) against the Maurya Empire led by Emperor Ashoka.',
      'Profound loss of life transformed Emperor Ashoka from Chandashoka to Dharmashoka, inspiring the global propagation of Buddhism and the Ashokan Edicts at Dhauli.'
    ],
    populationEstimate: 3500000,
    source: OFFICIAL_SOURCES.UNESCO
  },
  {
    id: 'hist-state-formation',
    entityId: 'odisha',
    yearOrEra: '1936 CE (April 1)',
    historicalName: 'Orissa Province (First linguistic province in British India)',
    administrativeStatus: 'Autonomous Province of British India',
    historicalBoundariesSummary: 'Unified Oriya-speaking tracts extracted from Bihar & Orissa Province, Madras Presidency (including Ganjam), and Central Provinces.',
    keyEvents: [
      'April 1, 1936: Official notification of the creation of Orissa as the first separate state organized on a linguistic basis, led by Utkal Gourav Madhusudan Das, Maharaja Krushna Chandra Gajapati of Paralakhemundi, and Gopabandhu Das (celebrated annually as Utkal Divas).'
    ],
    source: OFFICIAL_SOURCES.SURVEY_OF_INDIA
  },
  {
    id: 'hist-timeline-1990',
    entityId: 'odisha',
    yearOrEra: '1990 Timeline',
    historicalName: 'State of Orissa (13 Districts)',
    administrativeStatus: 'State of the Republic of India',
    historicalBoundariesSummary: 'Pre-bifurcation era where undivided Ganjam, Cuttack, Puri, Sambalpur, and Koraput comprised expansive administrative units.',
    keyEvents: [
      '1992-1993: Historic decentralization reforming 13 original districts into the contemporary 30-district administrative architecture to bring governance closer to citizen hubs.'
    ],
    source: OFFICIAL_SOURCES.SURVEY_OF_INDIA
  },
  {
    id: 'hist-timeline-2026',
    entityId: 'odisha',
    yearOrEra: '2026 Present',
    historicalName: 'Odisha (Official constitutional name altered from Orissa via 113th Constitutional Amendment)',
    administrativeStatus: 'Federal State of India (30 Districts, 3 Revenue Divisions)',
    historicalBoundariesSummary: 'Modern verified borders defined by Survey of India with 30 districts, 314 blocks, and 480 km maritime coastal boundary.',
    keyEvents: [
      'Fully automated Living World Atlas integration, pioneering real-time provenance tracking and disaster resilience monitoring.'
    ],
    source: OFFICIAL_SOURCES.SURVEY_OF_INDIA
  }
];

export const SEED_SCHEDULED_JOBS: ScheduledJob[] = [
  {
    id: 'job-weather-live',
    name: 'Live Meteorological Grid Ingestion',
    provider: 'Open-Meteo & IMD Automated Stream',
    frequencyDescription: 'Every 30 minutes',
    intervalMinutes: 30,
    lastRunAt: '2026-09-23T22:00:00Z',
    nextRunAt: '2026-09-23T22:30:00Z',
    status: 'SUCCEEDED',
    recordsProcessedLastRun: 28,
    lastError: undefined
  },
  {
    id: 'job-hazard-monitor',
    name: 'Disaster Hazard & Warning Ingestion',
    provider: 'OSDMA & IMD Cyclone Warning Bulletin',
    frequencyDescription: 'Every 15 minutes (Event-Driven)',
    intervalMinutes: 15,
    lastRunAt: '2026-09-23T22:15:00Z',
    nextRunAt: '2026-09-23T22:30:00Z',
    status: 'SUCCEEDED',
    recordsProcessedLastRun: 4,
    lastError: undefined
  },
  {
    id: 'job-agri-crop-survey',
    name: 'Seasonal Crop Acreage & Yield Revision',
    provider: 'Department of Agriculture / Krushi Bhavan',
    frequencyDescription: 'Bi-Weekly (Seasonal)',
    intervalMinutes: 20160,
    lastRunAt: '2026-09-15T00:00:00Z',
    nextRunAt: '2026-09-29T00:00:00Z',
    status: 'IDLE',
    recordsProcessedLastRun: 30,
    lastError: undefined
  },
  {
    id: 'job-economic-indicators',
    name: 'District Statistical Handbook Update',
    provider: 'Directorate of Economics & Statistics',
    frequencyDescription: 'Monthly',
    intervalMinutes: 43200,
    lastRunAt: '2026-09-01T00:00:00Z',
    nextRunAt: '2026-10-01T00:00:00Z',
    status: 'IDLE',
    recordsProcessedLastRun: 15,
    lastError: undefined
  }
];
