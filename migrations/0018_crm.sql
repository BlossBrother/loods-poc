-- 0018 — CRM-module (ADR-001): contactpersonen, contactmomenten, taken en deals.
-- Platform-klaar: tenant_id op elke tabel (default 'default', conform app_settings),
-- soft delete via deleted_at (opschoning loopt mee in de bestaande cron).
-- Klanten zelf staan in de bestaande tabel `klanten` (gedeeld met het portaal).

CREATE TABLE IF NOT EXISTS crm_contactpersonen (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  klant_id TEXT NOT NULL,
  naam TEXT NOT NULL,
  functie TEXT,
  email TEXT,
  telefoon TEXT,
  notitie TEXT,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_crm_cp_klant ON crm_contactpersonen (tenant_id, klant_id);

CREATE TABLE IF NOT EXISTS crm_contactmomenten (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  klant_id TEXT NOT NULL,
  contact_id TEXT,
  type TEXT NOT NULL DEFAULT 'overig' CHECK (type IN ('bezoek','telefoon','email','overig')),
  notitie TEXT NOT NULL,
  datum INTEGER NOT NULL,
  created_by TEXT,
  created_naam TEXT,
  created_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_crm_moment_klant ON crm_contactmomenten (tenant_id, klant_id, datum);

CREATE TABLE IF NOT EXISTS crm_taken (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  klant_id TEXT,
  titel TEXT NOT NULL,
  omschrijving TEXT,
  deadline INTEGER,
  eigenaar_id TEXT,
  eigenaar_naam TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','klaar')),
  created_by TEXT,
  created_at INTEGER NOT NULL,
  done_at INTEGER,
  deleted_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_crm_taken_status ON crm_taken (tenant_id, status, deadline);

CREATE TABLE IF NOT EXISTS crm_deals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  klant_id TEXT NOT NULL,
  titel TEXT NOT NULL,
  waarde_cents INTEGER,
  fase TEXT NOT NULL DEFAULT 'lead' CHECK (fase IN ('lead','contact','offerte','gewonnen','verloren')),
  notitie TEXT,
  eigenaar_id TEXT,
  eigenaar_naam TEXT,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_crm_deals_fase ON crm_deals (tenant_id, fase);
