-- =============================================================================
-- 002_forms.sql  |  Forms, sections, and form-field placement
-- Run order: 2 of 7  (depends on 001_core.sql)
-- Idempotent: safe to re-run
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Forms  (a versioned UI view over an entity)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meta_forms (
    form_id     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id   UUID        NOT NULL REFERENCES meta_entities (entity_id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    description TEXT,
    version     INT         NOT NULL DEFAULT 1,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (entity_id, name, version)
);

CREATE INDEX IF NOT EXISTS idx_meta_forms_entity ON meta_forms (entity_id);

-- ---------------------------------------------------------------------------
-- Form Sections  (visual groupings of fields, e.g. "Applicant Info")
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meta_form_sections (
    section_id      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id         UUID    NOT NULL REFERENCES meta_forms (form_id) ON DELETE CASCADE,
    title           TEXT    NOT NULL,
    display_order   INT     NOT NULL DEFAULT 0,
    columns         INT     NOT NULL DEFAULT 1    -- 1 or 2 column grid layout
                    CHECK (columns IN (1, 2)),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meta_form_sections_form ON meta_form_sections (form_id);

-- ---------------------------------------------------------------------------
-- Form Fields  (placement of an entity field onto a specific form)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meta_form_fields (
    form_field_id   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id         UUID    NOT NULL REFERENCES meta_forms (form_id) ON DELETE CASCADE,
    field_id        UUID    NOT NULL REFERENCES meta_fields (field_id) ON DELETE CASCADE,
    section_id      UUID    REFERENCES meta_form_sections (section_id) ON DELETE SET NULL,
    display_order   INT     NOT NULL DEFAULT 0,
    label_override  TEXT,                          -- override entity-level label for this form
    placeholder     TEXT,
    is_visible      BOOLEAN NOT NULL DEFAULT TRUE,
    is_readonly     BOOLEAN NOT NULL DEFAULT FALSE,
    col_span        INT     NOT NULL DEFAULT 1     -- 1 = half-width, 2 = full-width in 2-col section
                    CHECK (col_span IN (1, 2)),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (form_id, field_id)                    -- a field appears once per form
);

CREATE INDEX IF NOT EXISTS idx_meta_form_fields_form    ON meta_form_fields (form_id);
CREATE INDEX IF NOT EXISTS idx_meta_form_fields_field   ON meta_form_fields (field_id);
CREATE INDEX IF NOT EXISTS idx_meta_form_fields_section ON meta_form_fields (section_id);

-- ---------------------------------------------------------------------------
-- Triggers: auto-update updated_at
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_forms_updated_at') THEN
        CREATE TRIGGER trg_forms_updated_at
            BEFORE UPDATE ON meta_forms
            FOR EACH ROW EXECUTE FUNCTION meta_set_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_form_sections_updated_at') THEN
        CREATE TRIGGER trg_form_sections_updated_at
            BEFORE UPDATE ON meta_form_sections
            FOR EACH ROW EXECUTE FUNCTION meta_set_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_form_fields_updated_at') THEN
        CREATE TRIGGER trg_form_fields_updated_at
            BEFORE UPDATE ON meta_form_fields
            FOR EACH ROW EXECUTE FUNCTION meta_set_updated_at();
    END IF;
END $$;
