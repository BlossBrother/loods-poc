-- Vertaalcache: bewaart machinevertalingen per (taal+bron+tekst)-hash zodat populaire
-- berichten niet telkens opnieuw door het model gaan (sneller + goedkoper).
CREATE TABLE IF NOT EXISTS vertaal_cache (
  id         TEXT PRIMARY KEY,   -- sha256(target_lang + "\n" + source_lang + "\n" + tekst)
  lang       TEXT NOT NULL,
  vertaald   TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
