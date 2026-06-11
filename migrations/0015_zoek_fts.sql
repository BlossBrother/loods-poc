-- Globale zoekfunctie (Stroom-plan 4.1): FTS5-index over modules heen.
-- Gevuld door reindexZoek() (dagelijkse cron + herindexeer-knop op /zoek).
-- Toepassen: npx wrangler d1 migrations apply fresh-forward-db --remote
CREATE VIRTUAL TABLE IF NOT EXISTS zoek_fts USING fts5(
  titel,
  tekst,
  entity UNINDEXED,
  ref UNINDEXED,
  route UNINDEXED
);
