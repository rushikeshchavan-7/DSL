-- =============================================================================
-- 001_core.sql  |  Core metadata: tenants, entities, fields
-- Run order: 1 of 7
-- Idempotent: safe to re-run
-- =============================================================================

-- Enable pgcrypto for gen_random_uuid() if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tenants
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meta_tenants (
    tenant_id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    slug        TEXT        NOT NULL UNIQUE,          -- URL-safe identifier
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meta_tenants_slug ON meta_tenants (slug);

-- ---------------------------------------------------------------------------
-- Entities  (logical data objects, e.g. "LoanApplication")
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meta_entities (
    entity_id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID        NOT NULL REFERENCES meta_tenants (tenant_id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    description TEXT,
    plural_name TEXT,                                  -- e.g. "Loan Applications"
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_meta_entities_tenant ON meta_entities (tenant_id);

-- ---------------------------------------------------------------------------
-- Fields  (columns of a logical entity)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meta_fields (
    field_id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id       UUID        NOT NULL REFERENCES meta_entities (entity_id) ON DELETE CASCADE,
    name            TEXT        NOT NULL,              -- machine name, e.g. "loan_amount"
    label           TEXT        NOT NULL,              -- display label
    data_type       TEXT        NOT NULL
                    CHECK (data_type IN ('string','number','boolean','date','enum')),
    is_required     BOOLEAN     NOT NULL DEFAULT FALSE,
    display_order   INT         NOT NULL DEFAULT 0,
    options_json    JSONB,                             -- enum options: [{"value":"home","label":"Home"}]
    default_value   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (entity_id, name)
);

CREATE INDEX IF NOT EXISTS idx_meta_fields_entity ON meta_fields (entity_id);

-- ---------------------------------------------------------------------------
-- Trigger: auto-update updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION meta_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tenants_updated_at') THEN
        CREATE TRIGGER trg_tenants_updated_at
            BEFORE UPDATE ON meta_tenants
            FOR EACH ROW EXECUTE FUNCTION meta_set_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_entities_updated_at') THEN
        CREATE TRIGGER trg_entities_updated_at
            BEFORE UPDATE ON meta_entities
            FOR EACH ROW EXECUTE FUNCTION meta_set_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_fields_updated_at') THEN
        CREATE TRIGGER trg_fields_updated_at
            BEFORE UPDATE ON meta_fields
            FOR EACH ROW EXECUTE FUNCTION meta_set_updated_at();
    END IF;
END $$;
