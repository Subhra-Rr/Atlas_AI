-- ATLASAI Database Schema (PostgreSQL 14+ with PostGIS)
-- Production Geospatial & Audited Relational Storage

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Users and RBAC
CREATE TYPE user_role AS ENUM ('PUBLIC_USER', 'VERIFIED_CONTRIBUTOR', 'REVIEWER', 'ADMIN', 'SUPER_ADMIN');

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'PUBLIC_USER',
    is_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS user_followed_entities (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entity_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, entity_id)
);

-- 2. Provenance Sources & Datasets
CREATE TYPE source_type AS ENUM (
    'AUTHORITATIVE_OFFICIAL',
    'RECOGNIZED_SCIENTIFIC',
    'RESEARCH_INSTITUTION',
    'ESTABLISHED_DATASET',
    'COMMUNITY_CONTRIBUTION',
    'UNVERIFIED'
);

CREATE TYPE data_status AS ENUM (
    'LIVE',
    'CACHED',
    'HISTORICAL',
    'ESTIMATED',
    'SAMPLE',
    'VERIFIED',
    'UNVERIFIED',
    'UNDER_REVIEW',
    'OUTDATED',
    'SOURCE_CONFLICT',
    'ARCHIVED'
);

CREATE TABLE IF NOT EXISTS sources (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    source_type source_type NOT NULL,
    domain VARCHAR(255) NOT NULL,
    url TEXT,
    authority_level VARCHAR(50) NOT NULL,
    license TEXT NOT NULL,
    attribution TEXT NOT NULL,
    update_frequency VARCHAR(100),
    geographic_scope VARCHAR(100),
    last_checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS datasets (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(100) NOT NULL,
    source_id VARCHAR(100) REFERENCES sources(id),
    current_version VARCHAR(50) NOT NULL,
    effective_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Geographic Entities & PostGIS Geometries
CREATE TABLE IF NOT EXISTS geographic_entities (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    native_name VARCHAR(255),
    entity_type VARCHAR(50) NOT NULL,
    parent_id VARCHAR(100) REFERENCES geographic_entities(id),
    centroid GEOMETRY(Point, 4326),
    boundary GEOMETRY(Geometry, 4326),
    bbox_min_lat DOUBLE PRECISION,
    bbox_min_lng DOUBLE PRECISION,
    bbox_max_lat DOUBLE PRECISION,
    bbox_max_lng DOUBLE PRECISION,
    area_km2 DOUBLE PRECISION,
    elevation_m DOUBLE PRECISION,
    capital VARCHAR(255),
    description TEXT NOT NULL,
    source_id VARCHAR(100) REFERENCES sources(id),
    data_status data_status NOT NULL DEFAULT 'SAMPLE',
    dataset_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    last_verified_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_entities_centroid ON geographic_entities USING GIST (centroid);
CREATE INDEX IF NOT EXISTS idx_geo_entities_boundary ON geographic_entities USING GIST (boundary);
CREATE INDEX IF NOT EXISTS idx_geo_entities_parent ON geographic_entities (parent_id);
CREATE INDEX IF NOT EXISTS idx_geo_entities_type ON geographic_entities (entity_type);
CREATE INDEX IF NOT EXISTS idx_geo_entities_name ON geographic_entities (name);

-- 4. Weather & Climate Domain
CREATE TABLE IF NOT EXISTS weather_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(100) REFERENCES geographic_entities(id) ON DELETE CASCADE,
    temperature_c NUMERIC(5,2) NOT NULL,
    feels_like_c NUMERIC(5,2),
    rainfall_mm NUMERIC(7,2) DEFAULT 0,
    humidity_pct NUMERIC(5,2),
    wind_speed_kph NUMERIC(5,2),
    pressure_hpa NUMERIC(6,2),
    uv_index NUMERIC(4,2),
    condition VARCHAR(100),
    observation_time TIMESTAMPTZ NOT NULL,
    data_status data_status NOT NULL,
    source_id VARCHAR(100) REFERENCES sources(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_weather_entity_time ON weather_records (entity_id, observation_time DESC);

CREATE TABLE IF NOT EXISTS climate_records (
    entity_id VARCHAR(100) PRIMARY KEY REFERENCES geographic_entities(id) ON DELETE CASCADE,
    koppen_classification VARCHAR(10) NOT NULL,
    koppen_description TEXT,
    avg_annual_rainfall_mm NUMERIC(7,2),
    avg_summer_temp_c NUMERIC(5,2),
    avg_winter_temp_c NUMERIC(5,2),
    seasonal_pattern TEXT,
    trend TEXT,
    period VARCHAR(100),
    data_status data_status NOT NULL,
    source_id VARCHAR(100) REFERENCES sources(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rainfall_records (
    entity_id VARCHAR(100) PRIMARY KEY REFERENCES geographic_entities(id) ON DELETE CASCADE,
    annual_average_mm NUMERIC(7,2),
    current_year_total_mm NUMERIC(7,2),
    monsoon_contribution_pct NUMERIC(5,2),
    rainfall_anomaly_pct NUMERIC(5,2),
    monthly_distribution JSONB,
    period VARCHAR(100),
    data_status data_status NOT NULL,
    source_id VARCHAR(100) REFERENCES sources(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Agriculture & Crops
CREATE TABLE IF NOT EXISTS agriculture_records (
    entity_id VARCHAR(100) PRIMARY KEY REFERENCES geographic_entities(id) ON DELETE CASCADE,
    agricultural_land_pct NUMERIC(5,2),
    irrigated_land_pct NUMERIC(5,2),
    major_soil_types TEXT[],
    crops JSONB,
    livestock_overview TEXT,
    period VARCHAR(100),
    data_status data_status NOT NULL,
    source_id VARCHAR(100) REFERENCES sources(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Economy, Commerce & Population
CREATE TABLE IF NOT EXISTS economic_records (
    entity_id VARCHAR(100) PRIMARY KEY REFERENCES geographic_entities(id) ON DELETE CASCADE,
    gdp_billion_usd NUMERIC(10,2),
    gsdp_billion_usd NUMERIC(10,2),
    gdp_per_capita_usd NUMERIC(10,2),
    agriculture_share_pct NUMERIC(5,2),
    industry_share_pct NUMERIC(5,2),
    services_share_pct NUMERIC(5,2),
    key_industries TEXT[],
    major_exports TEXT[],
    major_imports TEXT[],
    primary_commodities TEXT[],
    economic_hubs TEXT[],
    period VARCHAR(100),
    data_status data_status NOT NULL,
    source_id VARCHAR(100) REFERENCES sources(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS population_records (
    entity_id VARCHAR(100) PRIMARY KEY REFERENCES geographic_entities(id) ON DELETE CASCADE,
    total_population BIGINT NOT NULL,
    density_per_km2 NUMERIC(10,2),
    urbanization_pct NUMERIC(5,2),
    literacy_rate_pct NUMERIC(5,2),
    growth_rate_pct NUMERIC(5,2),
    year INT NOT NULL,
    settlement_patterns TEXT,
    data_status data_status NOT NULL,
    source_id VARCHAR(100) REFERENCES sources(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Culture, Festivals & Hazards
CREATE TABLE IF NOT EXISTS culture_records (
    entity_id VARCHAR(100) PRIMARY KEY REFERENCES geographic_entities(id) ON DELETE CASCADE,
    primary_languages TEXT[],
    scripts TEXT[],
    traditional_clothing TEXT[],
    cuisine_specialties TEXT[],
    performing_arts TEXT[],
    festivals JSONB,
    unesco_sites TEXT[],
    museums TEXT[],
    data_status data_status NOT NULL,
    source_id VARCHAR(100) REFERENCES sources(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS natural_hazards (
    id VARCHAR(100) PRIMARY KEY,
    entity_id VARCHAR(100) REFERENCES geographic_entities(id),
    hazard_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    date_or_period VARCHAR(100) NOT NULL,
    affected_regions TEXT[],
    description TEXT NOT NULL,
    casualty_or_impact TEXT,
    source_id VARCHAR(100) REFERENCES sources(id),
    data_status data_status NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Verification Queue, Audit Logs, and Scheduled Jobs
CREATE TABLE IF NOT EXISTS verification_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(100) REFERENCES geographic_entities(id),
    domain VARCHAR(100) NOT NULL,
    current_version VARCHAR(50) NOT NULL,
    proposed_version VARCHAR(50) NOT NULL,
    proposed_by VARCHAR(255) NOT NULL,
    proposer_role user_role NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    discrepancy_summary TEXT,
    evidence_urls TEXT[],
    change_payload JSONB NOT NULL,
    reviewer_notes TEXT,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id VARCHAR(100) NOT NULL,
    actor_email VARCHAR(255) NOT NULL,
    actor_role user_role NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    ip_address VARCHAR(50),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    interval_minutes INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'IDLE',
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    records_processed INT DEFAULT 0,
    last_error TEXT
);

CREATE TABLE IF NOT EXISTS user_correction_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(100) REFERENCES geographic_entities(id),
    domain VARCHAR(100) NOT NULL,
    reported_by_email VARCHAR(255),
    description TEXT NOT NULL,
    evidence_url TEXT,
    suggested_correction TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'RECEIVED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
