-- Stroom-plan 1.4: soft delete voor undo zonder bevestigingsdialogen.
-- Verwijderen zet deleted_at; "Ongedaan maken" zet 'm terug op NULL.
-- De dagelijkse cron ruimt records ouder dan 30 dagen definitief op.
-- Toepassen: npx wrangler d1 migrations apply fresh-forward-db --remote
ALTER TABLE posts ADD COLUMN deleted_at INTEGER;
ALTER TABLE reacties ADD COLUMN deleted_at INTEGER;
ALTER TABLE polls ADD COLUMN deleted_at INTEGER;
ALTER TABLE agenda_events ADD COLUMN deleted_at INTEGER;
