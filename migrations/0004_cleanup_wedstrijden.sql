-- Opschoning: legacy 'wedstrijden'-tabel verwijderd (vervangen door ELO/matches).
-- De tabel was leeg; beheer-UI is verwijderd.
DROP TABLE IF EXISTS wedstrijden;

-- AVG: meldingen worden voortaan gearchiveerd i.p.v. hard verwijderd.
-- Geen schema-wijziging nodig: status krijgt waarde 'gearchiveerd' (TEXT-kolom bestaat al),
-- en de retentie-cron ruimt afgehandelde + gearchiveerde meldingen op na RETENTIE_DAGEN.
