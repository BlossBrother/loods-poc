-- Emoji-reacties op prikbord-posts en nieuwsberichten (live toggle).
CREATE TABLE IF NOT EXISTS emoji_reacties (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  target_type TEXT NOT NULL,   -- 'post' | 'nieuws'
  target_id TEXT NOT NULL,
  emoji TEXT NOT NULL,
  auteur_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(tenant_id, target_type, target_id, emoji, auteur_id)
);
CREATE INDEX IF NOT EXISTS idx_emoji_target ON emoji_reacties(tenant_id, target_type, target_id);
