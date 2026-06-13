-- v211: Pulse-surveys (anoniem by design).
-- Eén vraag tegelijk actief; de vraag verschijnt als kaart in de home-feed
-- (Workvivo-patroon). Antwoorden worden ANONIEM opgeslagen: pulse_antwoorden bevat
-- géén koppeling naar wie het antwoord gaf. Dubbel-stemmen wordt voorkomen via een
-- aparte tabel pulse_stemmers met een HMAC-hash van het e-mailadres — die hash is
-- niet terug te rekenen naar een persoon én staat NIET in dezelfde rij als het
-- antwoord, zodat antwoord en stemmer niet te koppelen zijn.
-- Drempel voor het tonen van resultaten (>=5 respondenten) zit in de applicatie.
CREATE TABLE IF NOT EXISTS pulse_vragen (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  vraag TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'schaal',   -- 'schaal' (1-5) | 'keuze'
  opties TEXT,                            -- JSON array (alleen bij type='keuze')
  actief INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  closed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_pulse_vragen_actief ON pulse_vragen (tenant_id, actief, created_at DESC);

CREATE TABLE IF NOT EXISTS pulse_antwoorden (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  vraag_id TEXT NOT NULL,
  waarde TEXT NOT NULL,                   -- '1'..'5' of de gekozen optie-tekst
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pulse_antw ON pulse_antwoorden (tenant_id, vraag_id);

CREATE TABLE IF NOT EXISTS pulse_stemmers (
  tenant_id TEXT NOT NULL DEFAULT 'default',
  vraag_id TEXT NOT NULL,
  stemmer_hash TEXT NOT NULL,             -- HMAC(email) — onomkeerbaar, niet gekoppeld aan het antwoord
  created_at INTEGER NOT NULL,
  PRIMARY KEY (tenant_id, vraag_id, stemmer_hash)
);
