-- v209 (PJ, voor interne livegang): demo-verlofdata eruit. Alles wat niet uit de
-- Buddee-sync komt is destijds als vulling ingezet; de echte Buddee-koppeling
-- volgt later. De dagelijkse sync vult source='buddee' vanzelf opnieuw zodra de
-- inloggegevens (BUDDEE_EMAIL/BUDDEE_PASSWORD) zijn ingesteld.
DELETE FROM verlof WHERE source IS NULL OR source != 'buddee';
