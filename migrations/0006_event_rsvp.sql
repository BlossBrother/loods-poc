-- v205: RSVP op agenda-events ("Ben je erbij?") — idempotent per (event, email).
CREATE TABLE IF NOT EXISTS event_rsvp (
  tenant_id TEXT NOT NULL DEFAULT 'default',
  event_id TEXT NOT NULL,
  email TEXT NOT NULL,
  naam TEXT,
  gaat INTEGER NOT NULL,           -- 1 = komt, 0 = komt niet
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (tenant_id, event_id, email)
);
CREATE INDEX IF NOT EXISTS idx_event_rsvp_event ON event_rsvp(tenant_id, event_id);
