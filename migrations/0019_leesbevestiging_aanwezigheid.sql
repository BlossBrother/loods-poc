-- 0019 — Spoor B ronde 1 (v185)
-- Leesbevestiging: wie heeft welk nieuwsbericht/beleidsdocument gelezen (idempotent per doel+email).
CREATE TABLE IF NOT EXISTS leesbevestigingen (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  doel_type TEXT NOT NULL,           -- 'nieuws' | 'document'
  doel_id TEXT NOT NULL,
  email TEXT NOT NULL,
  naam TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE (tenant_id, doel_type, doel_id, email)
);
CREATE INDEX IF NOT EXISTS idx_lees_doel ON leesbevestigingen (tenant_id, doel_type, doel_id);
CREATE INDEX IF NOT EXISTS idx_lees_email ON leesbevestigingen (tenant_id, email);

-- Aanwezigheid "wie is er vandaag" (BLOK-F-light, AVG-dataminimalisatie):
-- alleen de status van vandaag; oudere dagen worden door de cron gewist (geen historie).
CREATE TABLE IF NOT EXISTS aanwezigheid_status (
  tenant_id TEXT NOT NULL DEFAULT 'default',
  email TEXT NOT NULL,
  naam TEXT,
  dag TEXT NOT NULL,                 -- YYYY-MM-DD (Europe/Amsterdam)
  status TEXT NOT NULL,              -- 'kantoor' | 'thuis' | 'onderweg' | 'afwezig'
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (tenant_id, email, dag)
);
CREATE INDEX IF NOT EXISTS idx_aanw_dag ON aanwezigheid_status (tenant_id, dag);
