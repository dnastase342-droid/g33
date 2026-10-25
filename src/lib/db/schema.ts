/**
 * Idempotent schema, applied on first connection (and by `npm run db:migrate`).
 *
 * Data minimisation: the full application answers live only in the Google
 * Sheet (the review interface). The database keeps what is needed for the
 * workflow: identity/contact for payment links, statuses, consent records,
 * payments and memberships.
 */
export const SCHEMA_SQL = /* sql */ `
CREATE TABLE IF NOT EXISTS applications (
  id                     TEXT PRIMARY KEY,
  submission_key         UUID NOT NULL UNIQUE,
  submitted_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  full_name              TEXT NOT NULL,
  email                  TEXT NOT NULL,
  phone                  TEXT NOT NULL,
  preferred_plan         TEXT NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'Nouă',
  privacy_ack_at         TIMESTAMPTZ NOT NULL,
  privacy_notice_version TEXT NOT NULL,
  marketing_consent      BOOLEAN NOT NULL DEFAULT false,
  marketing_consent_at   TIMESTAMPTZ,
  sheets_synced_at       TIMESTAMPTZ,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS applications_email_idx ON applications (email);
CREATE INDEX IF NOT EXISTS applications_status_idx ON applications (status);

CREATE TABLE IF NOT EXISTS payment_links (
  id              SERIAL PRIMARY KEY,
  application_id  TEXT NOT NULL REFERENCES applications(id),
  token_hash      TEXT NOT NULL UNIQUE,
  plan_id         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS payment_links_app_idx ON payment_links (application_id);

CREATE TABLE IF NOT EXISTS payments (
  id                          SERIAL PRIMARY KEY,
  application_id              TEXT NOT NULL REFERENCES applications(id),
  plan_id                     TEXT NOT NULL,
  mode                        TEXT NOT NULL,
  stripe_checkout_session_id  TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id    TEXT,
  stripe_subscription_id      TEXT,
  stripe_customer_id          TEXT,
  amount_cents                INTEGER,
  currency                    TEXT,
  status                      TEXT NOT NULL DEFAULT 'pending',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_app_idx ON payments (application_id);
CREATE INDEX IF NOT EXISTS payments_pi_idx ON payments (stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS payments_sub_idx ON payments (stripe_subscription_id);

CREATE TABLE IF NOT EXISTS memberships (
  id                      SERIAL PRIMARY KEY,
  application_id          TEXT NOT NULL UNIQUE REFERENCES applications(id),
  plan_id                 TEXT NOT NULL,
  status                  TEXT NOT NULL,
  started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at                 TIMESTAMPTZ,
  stripe_subscription_id  TEXT,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS memberships_status_idx ON memberships (status);

CREATE TABLE IF NOT EXISTS stripe_events (
  id            TEXT PRIMARY KEY,
  type          TEXT NOT NULL,
  received_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key           TEXT PRIMARY KEY,
  count         INTEGER NOT NULL,
  window_start  TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id              SERIAL PRIMARY KEY,
  at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor           TEXT NOT NULL,
  action          TEXT NOT NULL,
  application_id  TEXT,
  details         JSONB
);
CREATE INDEX IF NOT EXISTS audit_log_app_idx ON audit_log (application_id);
`;
