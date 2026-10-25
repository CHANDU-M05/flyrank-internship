-- 001_init.sql
-- Core schema: tenants (widget owners), widgets, submissions.
-- Every widget and submission row carries tenant_id so isolation is a WHERE
-- clause away, never an application-layer assumption.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS widgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('signup_form', 'cta_popover', 'contact_form')),
  title         TEXT NOT NULL,
  description   TEXT,
  fields        JSONB NOT NULL DEFAULT '[]',   -- [{ "name": "email", "label": "Email", "required": true }, ...]
  button_text   TEXT NOT NULL DEFAULT 'Submit',
  display       JSONB NOT NULL DEFAULT '{}',   -- position, colors, delay, etc.
  bundle_version INTEGER NOT NULL DEFAULT 1,   -- bumped on config change to bust the cached bundle URL
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_widgets_tenant ON widgets(tenant_id);

CREATE TABLE IF NOT EXISTS submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id       UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data            JSONB NOT NULL,               -- validated form field values
  ip_address      TEXT,
  geo_country     TEXT,
  geo_city        TEXT,
  geo_provider    TEXT,                          -- 'A', 'B', or NULL if both failed
  notify_status   TEXT NOT NULL DEFAULT 'pending', -- 'sent' | 'failed' | 'pending'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_tenant ON submissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_submissions_widget ON submissions(widget_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);
