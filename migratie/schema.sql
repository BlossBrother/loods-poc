-- =====================================================================
-- Fresh Forward Platform — D1-schema (vervangt Airtable base appfamE6fOFcwcONn)
-- SQLite/D1. Booleans als INTEGER (0/1), datums als TEXT (ISO 8601).
-- Primaire sleutels = oorspronkelijke Airtable-record-IDs (recXXXX), zodat
-- relaties 1-op-1 mee migreren. Nieuwe records krijgen een app-gegenereerd id.
-- Draai met:  npx wrangler d1 execute fresh-forward-db --remote --file=migratie/schema.sql
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ---- Medewerkers (persoonsgegevens, AVG) ----------------------------
CREATE TABLE IF NOT EXISTS medewerkers (
  id            TEXT PRIMARY KEY,
  naam          TEXT,
  email         TEXT,
  rol           TEXT,
  afdeling      TEXT,
  actief        INTEGER DEFAULT 1,
  foto_key      TEXT,            -- R2-sleutel (was Airtable-attachment 'Foto')
  telefoon      TEXT,
  verjaardag    TEXT,            -- YYYY-MM-DD
  nieuws_gezien TEXT,            -- ISO datetime; door de app gezet ('Nieuw'-badge)
  functie       TEXT,
  created_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_medewerkers_naam ON medewerkers(naam);
CREATE INDEX IF NOT EXISTS idx_medewerkers_email ON medewerkers(email);

-- ---- Nieuws ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS nieuws (
  id              TEXT PRIMARY KEY,
  titel           TEXT,
  inhoud          TEXT,          -- richText (HTML-veilige weergave in richtext.ts)
  categorie       TEXT,
  publicatiedatum TEXT,
  status          TEXT,          -- Concept / Gepubliceerd / Gearchiveerd
  zichtbaarheid   TEXT,
  uitgelicht      INTEGER DEFAULT 0,
  afbeelding_key  TEXT,          -- R2-sleutel (was attachment 'Afbeelding' + 'Afbeeldingssleutel')
  auteur_id       TEXT REFERENCES medewerkers(id) ON DELETE SET NULL,
  created_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_nieuws_status ON nieuws(status);
CREATE INDEX IF NOT EXISTS idx_nieuws_pub ON nieuws(publicatiedatum);

-- ---- Documenten (intern) --------------------------------------------
CREATE TABLE IF NOT EXISTS documenten (
  id             TEXT PRIMARY KEY,
  titel          TEXT,
  omschrijving   TEXT,
  externe_link   TEXT,
  categorie      TEXT,
  bestandssleutel TEXT,          -- R2-sleutel
  bestandsnaam   TEXT,
  afbeelding_key TEXT,           -- R2-sleutel (optionele thumbnail)
  eigenaar_id    TEXT REFERENCES medewerkers(id) ON DELETE SET NULL,
  created_at     TEXT
);

-- ---- Bezoekmeldingen (persoonsgegevens, AVG) ------------------------
CREATE TABLE IF NOT EXISTS bezoekmeldingen (
  id               TEXT PRIMARY KEY,
  bezoeker         TEXT,
  bedrijf          TEXT,
  email            TEXT,
  verwacht_op      TEXT,
  reden            TEXT,
  status           TEXT,
  ingecheckt_om    TEXT,
  vertrokken_om    TEXT,
  opmerkingen      TEXT,
  host_id          TEXT REFERENCES medewerkers(id) ON DELETE SET NULL,
  aangemeld_door_id TEXT REFERENCES medewerkers(id) ON DELETE SET NULL,
  created_at       TEXT
);
CREATE INDEX IF NOT EXISTS idx_bezoek_verwacht ON bezoekmeldingen(verwacht_op);
CREATE INDEX IF NOT EXISTS idx_bezoek_created ON bezoekmeldingen(created_at);

-- ---- Wedstrijden (competitie) ---------------------------------------
CREATE TABLE IF NOT EXISTS wedstrijden (
  id          TEXT PRIMARY KEY,
  wedstrijd   TEXT,
  sport       TEXT,
  speler1_id  TEXT REFERENCES medewerkers(id) ON DELETE SET NULL,
  speler2_id  TEXT REFERENCES medewerkers(id) ON DELETE SET NULL,
  score1      INTEGER,
  score2      INTEGER,
  winnaar_id  TEXT REFERENCES medewerkers(id) ON DELETE SET NULL,
  gespeeld_op TEXT,
  opmerking   TEXT,
  created_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_wedstrijden_gespeeld ON wedstrijden(gespeeld_op);

-- ---- Prikbord: Posts & Reacties -------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id         TEXT PRIMARY KEY,
  bericht    TEXT,
  auteur_id  TEXT REFERENCES medewerkers(id) ON DELETE SET NULL,
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);

CREATE TABLE IF NOT EXISTS reacties (
  id         TEXT PRIMARY KEY,
  reactie    TEXT,
  post_id    TEXT REFERENCES posts(id) ON DELETE CASCADE,
  auteur_id  TEXT REFERENCES medewerkers(id) ON DELETE SET NULL,
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_reacties_post ON reacties(post_id);

-- ---- Afdelingen ------------------------------------------------------
CREATE TABLE IF NOT EXISTS afdelingen (
  id   TEXT PRIMARY KEY,
  naam TEXT
);

-- ---- Klanten (portaaltoegang, persoonsgegevens) ---------------------
CREATE TABLE IF NOT EXISTS klanten (
  id            TEXT PRIMARY KEY,
  naam          TEXT,
  email         TEXT,
  bedrijf       TEXT,
  actief        INTEGER DEFAULT 1,
  laatste_login TEXT,
  notitie       TEXT,
  taal          TEXT
);
CREATE INDEX IF NOT EXISTS idx_klanten_email ON klanten(email);

-- ---- Portaal-content: Rassen / Teeltadvies / Snoei en pluk ----------
CREATE TABLE IF NOT EXISTS rassen (
  id             TEXT PRIMARY KEY,
  naam           TEXT,
  gewas          TEXT,
  omschrijving   TEXT,
  smaak          TEXT,
  kleur          TEXT,
  seizoen        TEXT,
  afbeelding_key TEXT,
  volgorde       INTEGER,
  gepubliceerd   INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_rassen_pub ON rassen(gepubliceerd, volgorde);

CREATE TABLE IF NOT EXISTS teeltadvies (
  id             TEXT PRIMARY KEY,
  titel          TEXT,
  inhoud         TEXT,
  ras_id         TEXT REFERENCES rassen(id) ON DELETE SET NULL,
  categorie      TEXT,
  volgorde       INTEGER,
  gepubliceerd   INTEGER DEFAULT 0,
  afbeelding_key TEXT
);
CREATE INDEX IF NOT EXISTS idx_teelt_pub ON teeltadvies(gepubliceerd, volgorde);

CREATE TABLE IF NOT EXISTS snoei_pluk (
  id             TEXT PRIMARY KEY,
  titel          TEXT,
  type           TEXT,
  inhoud         TEXT,
  ras_id         TEXT REFERENCES rassen(id) ON DELETE SET NULL,
  periode        TEXT,
  volgorde       INTEGER,
  gepubliceerd   INTEGER DEFAULT 0,
  afbeelding_key TEXT
);
CREATE INDEX IF NOT EXISTS idx_snoei_pub ON snoei_pluk(gepubliceerd, volgorde);

CREATE TABLE IF NOT EXISTS klantdocumenten (
  id             TEXT PRIMARY KEY,
  titel          TEXT,
  omschrijving   TEXT,
  externe_link   TEXT,
  bestandssleutel TEXT,
  bestandsnaam   TEXT,
  categorie      TEXT,
  gepubliceerd   INTEGER DEFAULT 0,
  afbeelding_key TEXT
);
CREATE INDEX IF NOT EXISTS idx_klantdoc_pub ON klantdocumenten(gepubliceerd);

-- ---- Web-push abonnementen ------------------------------------------
CREATE TABLE IF NOT EXISTS pushabonnementen (
  id             TEXT PRIMARY KEY,
  endpoint       TEXT UNIQUE,
  email          TEXT,
  p256dh         TEXT,
  auth           TEXT,
  laatst_gebruikt TEXT
);

-- ---- Logging (optioneel, gebruikt door logs.ts) ---------------------
CREATE TABLE IF NOT EXISTS events (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  ts     TEXT,
  type   TEXT,
  ref    TEXT,
  detail TEXT,
  actor  TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
