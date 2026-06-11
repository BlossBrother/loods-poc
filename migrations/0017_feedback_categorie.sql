-- In-app feedback (Stroom-plan 4.4): categorie (bug / idee / anders) op meldingen.
-- Toepassen: npx wrangler d1 migrations apply fresh-forward-db --remote
ALTER TABLE bugmeldingen ADD COLUMN categorie TEXT;
