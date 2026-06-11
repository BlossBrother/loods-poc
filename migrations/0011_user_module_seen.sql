-- "Voor jou": onthoudt per gebruiker per module wanneer die voor het laatst gezien is,
-- zodat de home-header kan tellen wat er nieuw is sinds je laatste bezoek.
CREATE TABLE IF NOT EXISTS user_module_seen (
  user_id      TEXT NOT NULL,
  module_key   TEXT NOT NULL,
  last_seen_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, module_key)
);
