-- Shout-outs: optionele ontvanger op een prikbord-bericht.
-- Een post met ontvanger_id rendert als shout-out (accent + "Shout-out voor X").
ALTER TABLE posts ADD COLUMN ontvanger_id TEXT;
