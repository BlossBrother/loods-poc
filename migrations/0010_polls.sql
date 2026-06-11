-- Polls/peilingen op het prikbord. Stemmen geaggregeerd (geen publieke "wie stemde wat").
CREATE TABLE IF NOT EXISTS polls (
  id         TEXT PRIMARY KEY,
  tenant_id  TEXT NOT NULL DEFAULT 'default',
  vraag      TEXT NOT NULL,
  opties     TEXT NOT NULL,                 -- JSON-array van labels
  multi      INTEGER NOT NULL DEFAULT 0,    -- 0=één keuze, 1=meerkeuze
  maker_id   TEXT,
  maker_naam TEXT,
  status     TEXT NOT NULL DEFAULT 'open',  -- 'open' | 'gesloten'
  created_at INTEGER NOT NULL,
  closes_at  INTEGER
);
CREATE TABLE IF NOT EXISTS poll_stemmen (
  id         TEXT PRIMARY KEY,
  poll_id    TEXT NOT NULL,
  optie      INTEGER NOT NULL,
  stemmer_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_poll_stemmen_poll ON poll_stemmen(poll_id);
