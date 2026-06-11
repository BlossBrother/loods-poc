# Migratie Airtable → Cloudflare D1 (EU)

> Doel: de platform-database weghalen bij **Airtable (VS)** en onderbrengen in
> **Cloudflare D1 met de harde `eu`-jurisdictie**, zodat alle data gegarandeerd
> binnen de EU draait en wordt opgeslagen (AVG). Content beheer je daarna
> **volledig in de app** (beheer-pagina's) — geen Airtable meer.

## Keuzes (vastgesteld)
- **EU-borging:** `eu`-jurisdictie (harde garantie), niet de best-effort `weur`-hint.
- **Beheer:** volledig in-app voor álle content-types.
- **Aanpak:** in één keer alles (alle 14 tabellen), Airtable eruit.

## Scope
**Wel:** de platform-base `appfamE6fOFcwcONn` — alle 14 tabellen:
Medewerkers, Nieuws, Documenten, Bezoekmeldingen, Wedstrijden, Posts, Reacties,
Afdelingen, Klanten, Rassen, Teeltadvies, Snoei en pluk, Klantdocumenten,
Pushabonnementen.

**Niet (apart systeem, blijft voorlopig op Airtable):** de iPad-base
`appXsofo09R8Qax8q` (Bezoekersregistratie). Die voedt alleen de receptie-weergave
en hangt aan een fysiek iPad-registratieproces; losse beslissing.
→ Gevolg: `AIRTABLE_TOKEN` + `AIRTABLE_BEZOEKERS_BASE_ID` blijven bestaan, maar
worden na de migratie **alleen** nog voor die iPad-base gebruikt. De rest van de
app raakt Airtable niet meer aan.

## EU-jurisdictie: belangrijk
- De `eu`-jurisdictie kan **alleen bij het aanmaken** worden gezet en **niet later
  gewijzigd**. Eén keer goed doen.
- De Cloudflare-connector (MCP) ondersteunt alleen de zwakke locatiehint, dus de
  database maak je via de CLI aan:
  ```
  npx wrangler d1 create fresh-forward-db --jurisdiction eu
  ```
- Cloudflare R2 (voor afbeeldingen/bestanden) zetten we ook op een EU-bucket
  (location hint EU) zodat ook attachments binnen de EU blijven.

## Architectuur
- **`src/db.ts` vervangt `src/airtable.ts`.** Alle lees/schrijf-functies houden
  **dezelfde namen en return-vormen** (`{ id, fields: {...} }` met dezelfde
  Nederlandse veldnamen). Zo blijven de views vrijwel ongewijzigd; alleen de
  implementatie eronder gaat naar D1.
- **Binding:** de bestaande `DB` (D1) wordt de hoofddatabase. De optionele
  in-/uitcheck-logging (`logs.ts`) gaat naar een `logs`-tabel in diezelfde DB.
- **Relaties** worden gewone foreign keys (TEXT-ids). Omdat we de Airtable-record-
  IDs als primary key overnemen, migreren alle koppelingen 1-op-1 mee.
- **Afbeeldingen/bestanden:** Airtable-attachments (medewerker-foto's, nieuws-
  afbeeldingen, portaal-afbeeldingen) worden naar **R2** gekopieerd; in D1 staat
  alleen de R2-sleutel. Views renderen overal uniform via R2.

## Schema
Volledige DDL staat in `migratie/schema.sql` (14 tabellen, indexen, foreign keys).
Kernpunten: booleans als `INTEGER` (0/1), datums als ISO-`TEXT`, PK = `recXXXX`.

## Runbook (eenmalig, door Peter-Jan)
Code/scripts lever ik als zip in de projectmap. De eenmalige stappen:

1. **Database aanmaken (EU):**
   ```
   npx wrangler d1 create fresh-forward-db --jurisdiction eu
   ```
   Zet de teruggegeven `database_id` in `wrangler.toml` onder de `DB`-binding.

2. **Schema laden:**
   ```
   npx wrangler d1 execute fresh-forward-db --remote --file=migratie/schema.sql
   ```

3. **Data laden** (seed gegenereerd uit je live Airtable):
   ```
   npx wrangler d1 execute fresh-forward-db --remote --file=migratie/seed.sql
   ```

4. **Afbeeldingen/bestanden naar R2** — eenmalige beheer-route
   `/beheer/migratie-r2` (draait zolang `AIRTABLE_TOKEN` nog gezet is): kopieert
   alle attachments vanuit Airtable naar R2 en vult de `*_key`-kolommen. Daarna
   verwijderen we de route.

5. **Deploy** de nieuwe code: `npm run deploy`.

6. **Controle:** alles zichtbaar? Beheer werkt (toevoegen/bewerken/verwijderen)?
   Portaal toont rassen/teelt/snoei/documenten?

7. **Afronden:** Airtable-koppeling voor de platform-base is dan dood. Token pas
   intrekken nadat de iPad-base (receptie) eventueel ook is verplaatst of
   uitgezet.

## Terugrolplan
- De oude `airtable.ts` blijft als `airtable.legacy.ts` in de repo tot je tevreden
  bent. Terug = binding/datalaag terugzetten en deployen. Airtable-data wordt
  tijdens de migratie **niet** gewijzigd of verwijderd, dus blijft als back-up
  staan tot je 'm bewust opruimt.
- D1 heeft **Time Travel** (30 dagen point-in-time herstel) als extra vangnet.

## Fasering van het bouwwerk
- **Ronde 1 — datalaag-swap (kern):** `db.ts` (lees+schrijf, gelijke vormen),
  `schema.sql`, `seed.sql` uit live data, wrangler.toml-binding, logs naar D1.
  Resultaat: app draait identiek, maar op D1 i.p.v. Airtable.
- **Ronde 2 — afbeeldingen:** R2-migratieroute + views uniform op R2-keys.
- **Ronde 3 — volledig beheer:** beheer-pagina's voor rassen, teeltadvies,
  snoei & pluk, klantdocumenten en wedstrijden (CRUD), zodat je niets meer in
  Airtable hoeft.
- **Ronde 4 — opruimen:** `airtable.legacy.ts` weg, ongebruikte env-vars weg,
  PROJECT-CONTEXT/ROADMAP bijwerken.

---

## Go-live (actuele stand na het Airtable-incident)
Airtable is verwijderd; de data is **hersteld uit de PWA-cache + personeelslijst**
(zie `migratie/herstel/`). `migratie/seed.sql` is daaruit opgebouwd: 43 collega's
(naam, e-mail, functie, verjaardag, rol) + 2 nieuwsberichten. De app draait nu op
de D1-versie van `airtable.ts`; de tijdelijke dump-route is verwijderd;
`airtable.legacy.ts` blijft als rollback. Geverifieerd met `tsc` (strict) + esbuild.

**Nog te doen door Peter-Jan (eenmalig):**
1. Schema laden (sla over als al gedaan):
   `npx wrangler d1 execute fresh-forward-db --remote --file=migratie/schema.sql`
2. Herstelde data laden:
   `npx wrangler d1 execute fresh-forward-db --remote --file=migratie/seed.sql`
3. Deployen: `npm run deploy`

**Daarna opnieuw invoeren via het (nog te bouwen) beheer:** afdeling, telefoon,
foto's en rol per collega; documenten; portaal-content (rassen, teeltadvies,
snoei & pluk, klantdocumenten); klantenlijst. Pushabonnementen en de Nieuw-badge
herstellen zichzelf.

**Obsoleet:** `migratie/export.mjs` (Airtable bestaat niet meer) — laat staan als
referentie of verwijder.
