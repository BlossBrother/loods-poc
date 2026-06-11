-- D1-schema voor in-/uitcheck- en portaal-logging.
-- Toepassen: npx wrangler d1 execute ff-logs --remote --file=./migrations/0001_events.sql

CREATE TABLE IF NOT EXISTS events (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  ts     TEXT NOT NULL,            -- ISO-tijdstip (UTC)
  type   TEXT NOT NULL,            -- bijv. bezoek_incheck, bezoek_uitcheck, portaal_login
  ref    TEXT,                     -- record-id of e-mail
  detail TEXT,                     -- vrije omschrijving
  actor  TEXT                      -- wie de actie deed (indien bekend)
);

CREATE INDEX IF NOT EXISTS idx_events_ts ON events (ts);
CREATE INDEX IF NOT EXISTS idx_events_type ON events (type);
