-- Notificatiecentrum (Stroom-plan 4.2): historie per gebruiker + voorkeuren per module.
-- Toepassen: npx wrangler d1 migrations apply fresh-forward-db --remote
CREATE TABLE IF NOT EXISTS notificaties (
  id         TEXT PRIMARY KEY,
  tenant_id  TEXT NOT NULL DEFAULT 'default',
  user_email TEXT NOT NULL,
  module     TEXT NOT NULL,
  titel      TEXT NOT NULL,
  body       TEXT,
  url        TEXT,
  created_at INTEGER NOT NULL,
  read_at    INTEGER
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notificaties(user_email, created_at DESC);

CREATE TABLE IF NOT EXISTS push_prefs (
  user_email TEXT NOT NULL,
  module     TEXT NOT NULL,
  enabled    INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_email, module)
);
