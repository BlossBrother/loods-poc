-- v202: Kennisdump-administratie. kb_docs/kb_chunks bestaan al (RAG-kennisbank);
-- deze tabel is het beheer-overzicht van gedumpte bestanden + klant-suggestie.
CREATE TABLE IF NOT EXISTS kennisdump_log (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  bestand TEXT NOT NULL,
  r2_key TEXT,
  titel TEXT NOT NULL,
  categorie TEXT NOT NULL,
  samenvatting TEXT,
  audience TEXT NOT NULL DEFAULT 'internal',
  suggestie_klant INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'verwerkt',
  door TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_kennisdump_tenant_created ON kennisdump_log(tenant_id, created_at DESC);
