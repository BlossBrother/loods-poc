-- Reacties onder nieuwsberichten (platte reacties, ownership: maker/admin verwijderen).
CREATE TABLE IF NOT EXISTS nieuws_reacties (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  nieuws_id TEXT NOT NULL,
  auteur_id TEXT,
  reactie TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nieuws_reacties_nieuws ON nieuws_reacties(tenant_id, nieuws_id);
