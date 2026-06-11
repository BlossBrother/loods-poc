-- Potten corrigeren (competitie): soft delete op matches, zodat een verkeerd
-- ingevulde laatste pot verwijderd kan worden met exacte ELO-terugzet.
-- Toepassen: npx wrangler d1 migrations apply fresh-forward-db --remote
ALTER TABLE matches ADD COLUMN deleted_at INTEGER;
