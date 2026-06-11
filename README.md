# Fresh Forward — intern platform (intranet + bezoekmelding)

Eerste onderdeel van het Fresh Forward platform: een Cloudflare Worker
(Hono + TypeScript) die de Airtable-base **Fresh Forward Platform**
(`appfamE6fOFcwcONn`) uitleest en schrijft.

## Wat het doet
- `GET /` — intranet: gepubliceerd nieuws + documenten
- `GET /bezoek` — bezoekmelding: formulier + bezoekers van vandaag
- `POST /bezoek` — meldt een bezoeker aan (status "Verwacht")
- `GET /health` — statuscheck

## Lokaal draaien
1. `npm install`
2. `cp .dev.vars.example .dev.vars` en vul `AIRTABLE_TOKEN`
3. `npm run dev`  → http://localhost:8787

## Airtable-token
Maak een Personal Access Token op https://airtable.com/create/tokens met:
- scopes: `data.records:read`, `data.records:write`
- toegang tot de base `Fresh Forward Platform` (`appfamE6fOFcwcONn`)

## Deploy naar Cloudflare
1. `npx wrangler login`
2. `npx wrangler secret put AIRTABLE_TOKEN`  (plak het token)
3. `npm run deploy`

## GitHub → automatische deploy
`git init && git add -A && git commit -m "init"` en push naar je repo.
Koppel de repo in Cloudflare (Workers Builds) zodat elke push deployt.

## Collega-login
Zet **Cloudflare Access** op de route van deze Worker, gekoppeld aan
Microsoft 365, zodat alleen collega's binnenkomen. (Dashboard, geen code.)

## Logs (latere fase)
`npx wrangler d1 create ff-logs`, vul de `database_id` in `wrangler.toml`
en activeer de `[[d1_databases]]`-binding.

## Koppeling met de bestaande iPad-Bezoekersregistratie
De bezoekpagina toont onder "Vandaag binnengekomen" de receptie-aankomsten
read-only uit de bestaande base `Bezoekersregistratie` (`appXsofo09R8Qax8q`,
tabel `Bezoekers`). Het draaiende iPad-systeem en de Teams-webhook blijven
ongemoeid. Voorwaarde: het Airtable-token heeft (lees)toegang tot die base.
De koppeling is niet-kritiek: lukt het lezen niet, dan blijft de pagina werken
met een nette melding.

## Nieuw: competitie, PWA, AVG
- **Competitie** (`/competitie`): ranglijst per sport (pingpong/darten) + uitslag invoeren. Tabel `Wedstrijden` in Airtable.
- **PWA**: installeerbaar als telefoon-app (`manifest.webmanifest`, `sw.js`, app-icons). Mobile-first met bottom-tab navigatie.
- **Security**: security-headers op alle responses (`src/security.ts`).
- **AVG-opschoning**: dagelijkse cron verwijdert bezoekmeldingen ouder dan `RETENTIE_DAGEN` (default 90). Staat uit tot `AVG_CLEANUP_ENABLED="true"`.

Zie `GO-LIVE-EN-AVG.md` voor deployen + Cloudflare Access, en `STATUS-HANDOFF.md` voor de actuele stand.
