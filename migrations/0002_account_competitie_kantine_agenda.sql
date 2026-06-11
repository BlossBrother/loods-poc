-- 0002: Mijn Account + Competitie (ELO) + Kantine (Friet/Vis) + Agenda
-- Keuzes: speler = medewerker (uitbreiding, gekoppeld op e-mail); nieuw ELO-model
-- (matches/ratings) vervangt de oude wedstrijden-tabel; agenda-tabel heet
-- agenda_events om botsing met de bestaande logging-tabel 'events' te vermijden.

-- Identiteit uitbreiden op medewerkers
ALTER TABLE medewerkers ADD COLUMN nickname TEXT;
ALTER TABLE medewerkers ADD COLUMN intro_tune TEXT;
ALTER TABLE medewerkers ADD COLUMN roles TEXT NOT NULL DEFAULT '';

-- Per-speler spelinstellingen (voice aan/uit per spel)
CREATE TABLE IF NOT EXISTS player_game_prefs (
  player_id   TEXT NOT NULL,
  game_type   TEXT NOT NULL,            -- 'darts' | 'draughts'
  voice_calls INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (player_id, game_type)
);

-- Competitie: één rij per gespeelde pot
CREATE TABLE IF NOT EXISTS matches (
  id            TEXT PRIMARY KEY,
  game_type     TEXT NOT NULL,          -- 'darts' | 'draughts'
  player_a      TEXT NOT NULL,
  player_b      TEXT NOT NULL,
  winner        TEXT NOT NULL,
  score_a       INTEGER, score_b INTEGER,
  elo_a_before  INTEGER, elo_a_after INTEGER,
  elo_b_before  INTEGER, elo_b_after INTEGER,
  tournament_id TEXT,
  played_at     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_matches_game ON matches (game_type, played_at);

CREATE TABLE IF NOT EXISTS ratings (
  player_id TEXT NOT NULL,
  game_type TEXT NOT NULL,
  elo       INTEGER NOT NULL DEFAULT 1000,
  wins      INTEGER NOT NULL DEFAULT 0,
  losses    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, game_type)
);

CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY, game_type TEXT NOT NULL, name TEXT NOT NULL,
  format TEXT NOT NULL, status TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS tournament_players (
  tournament_id TEXT NOT NULL, player_id TEXT NOT NULL,
  PRIMARY KEY (tournament_id, player_id)
);

-- Kantine (Friet/Vis): ledger-model, saldo = SUM(amount_cents)
CREATE TABLE IF NOT EXISTS snack_ledger (
  id TEXT PRIMARY KEY, player_id TEXT NOT NULL, amount_cents INTEGER NOT NULL,
  kind TEXT NOT NULL, description TEXT, created_by TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_snack_player ON snack_ledger (player_id);

CREATE TABLE IF NOT EXISTS snack_menu (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, price_cents INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1
);

-- Agenda (let op: agenda_events i.p.v. events vanwege bestaande logtabel)
CREATE TABLE IF NOT EXISTS agenda_events (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, location TEXT,
  category TEXT NOT NULL, start_at INTEGER NOT NULL, end_at INTEGER NOT NULL,
  all_day INTEGER NOT NULL DEFAULT 0, source TEXT NOT NULL DEFAULT 'manual',
  external_id TEXT, created_by TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agenda_range ON agenda_events (start_at, end_at);
