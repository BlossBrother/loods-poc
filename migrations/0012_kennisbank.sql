-- Kennisbank/vraagbaak (RAG). Vectorize bewaart de vectoren; D1 bewaart de bron-docs,
-- de chunk-teksten (voor context) en optioneel een vraag-log.
CREATE TABLE IF NOT EXISTS kb_docs (
  id TEXT PRIMARY KEY, category TEXT NOT NULL, variety TEXT, title TEXT NOT NULL,
  body TEXT NOT NULL, url TEXT,
  audience TEXT NOT NULL DEFAULT 'internal' CHECK (audience IN ('public','grower','internal')),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS kb_chunks (
  id TEXT PRIMARY KEY, doc_id TEXT NOT NULL REFERENCES kb_docs(id) ON DELETE CASCADE,
  chunk_ix INTEGER NOT NULL, text TEXT NOT NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_chunks_doc ON kb_chunks(doc_id);
CREATE TABLE IF NOT EXISTS ask_log (
  id TEXT PRIMARY KEY, user_ref TEXT, question TEXT NOT NULL, answered INTEGER NOT NULL,
  source_ids TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_asklog_time ON ask_log(created_at);
