-- Eenmalig: markeer reeds (handmatig) toegepaste migraties als 'applied' in wranglers
-- d1_migrations-boekhouding, zodat `wrangler d1 migrations apply` voortaan alleen écht
-- nieuwe bestanden draait. Veilig herhaalbaar (NOT EXISTS-guards; geen dubbele rijen).
-- Uitvoeren: npx wrangler d1 execute fresh-forward-db --remote --file migratie/sync-migratie-administratie.sql
-- LET OP: dit bestand staat bewust in migratie/ (niet migrations/), anders pakt
-- `migrations apply` het zelf op.
CREATE TABLE IF NOT EXISTS d1_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO d1_migrations (name) SELECT '0001_events.sql' WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name='0001_events.sql');
INSERT INTO d1_migrations (name) SELECT '0002_account_competitie_kantine_agenda.sql' WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name='0002_account_competitie_kantine_agenda.sql');
INSERT INTO d1_migrations (name) SELECT '0003_shoutouts.sql' WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name='0003_shoutouts.sql');
INSERT INTO d1_migrations (name) SELECT '0004_cleanup_wedstrijden.sql' WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name='0004_cleanup_wedstrijden.sql');
INSERT INTO d1_migrations (name) SELECT '0005_nieuws_reacties.sql' WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name='0005_nieuws_reacties.sql');
INSERT INTO d1_migrations (name) SELECT '0006_emoji_reacties.sql' WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name='0006_emoji_reacties.sql');
INSERT INTO d1_migrations (name) SELECT '0007_verlof.sql' WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name='0007_verlof.sql');
INSERT INTO d1_migrations (name) SELECT '0008_verlof_afdeling.sql' WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name='0008_verlof_afdeling.sql');
INSERT INTO d1_migrations (name) SELECT '0009_vertaal_cache.sql' WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name='0009_vertaal_cache.sql');
INSERT INTO d1_migrations (name) SELECT '0010_polls.sql' WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name='0010_polls.sql');
INSERT INTO d1_migrations (name) SELECT '0011_user_module_seen.sql' WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name='0011_user_module_seen.sql');
INSERT INTO d1_migrations (name) SELECT '0012_kennisbank.sql' WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name='0012_kennisbank.sql');
INSERT INTO d1_migrations (name) SELECT '0013_soft_delete.sql' WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name='0013_soft_delete.sql');
