-- =============================================================================
-- 005_validations.sql  |  Field-level validation rules
-- Run order: 5 of 7  (depends on 001_core.sql and 002_forms.sql)
-- Idempotent: safe to re-run
-- =============================================================================

CREATE TABLE IF NOT EXISTS meta_validations (
    validation_id   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id        UUID    NOT NULL REFERENCES meta_fields  (field_id)  ON DELETE CASCADE,
    form_id         UUID    NOT NULL REFERENCES meta_forms   (form_id)   ON DELETE CASCADE,

    -- The type of validation rule
    rule_type       TEXT    NOT NULL
                    CHECK (rule_type IN (
                        'required',
                        'min',           -- numeric minimum value
                        'max',           -- numeric maximum value
                        'min_length',    -- string min char count
                        'max_length',    -- string max char count
                        'regex',         -- ECMAScript-compatible pattern
                        'custom_expression'  -- server-side C# expression (Phase 2+)
                    )),

    -- Parameterises the rule (e.g. "2" for min_length, "^\d{5}$" for regex)
    -- NULL for 'required' (presence alone is the rule)
    rule_value      TEXT,

    -- Message shown to the user when this rule fails
    error_message   TEXT    NOT NULL,

    -- Execution order when multiple rules exist on the same field/form
    display_order   INT     NOT NULL DEFAULT 0,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meta_validations_field ON meta_validations (field_id);
CREATE INDEX IF NOT EXISTS idx_meta_validations_form  ON meta_validations (form_id);

-- Composite index — the validator loads all rules for a given form in one query
CREATE INDEX IF NOT EXISTS idx_meta_validations_form_field
    ON meta_validations (form_id, field_id);

-- ---------------------------------------------------------------------------
-- Trigger: auto-update updated_at
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validations_updated_at') THEN
        CREATE TRIGGER trg_validations_updated_at
            BEFORE UPDATE ON meta_validations
            FOR EACH ROW EXECUTE FUNCTION meta_set_updated_at();
    END IF;
END $$;
