# Fresh Forward intranet — PROJECT-CONTEXT (handoff voor nieuwe chat)

> Lees dit als eerste in een nieuwe Cowork-chat voor vervolg/bugfixes op de PoC.
> Bijgewerkt: 7 juni 2026, na de volledige PoC-opbouw + RONDE 2.
> Voor het aparte multi-tenant **platform-spoor** zie `PLATFORM-SPOOR-CONTEXT.md`
> (los project, niet dit intranet).

## In één zin
Intern platform voor Fresh Forward (kweekbedrijf, ~43 medewerkers): één Cloudflare
Worker (Hono + TypeScript), server-rendered, **intern intranet** achter Cloudflare
Access / M365-SSO, plus een **publiek klantenportaal** (magic-link), met **D1
(EU-jurisdictie)** als database en **R2** voor bestanden/foto's. PWA.

## Waar woont wat
- **Code/projectmap:** `C:\Users\FreshFPeterJanvanIng\fresh-forward-intranet`
- **Live Worker:** `fresh-forward-intranet` (achter Cloudflare Access; `/portaal*` publiek)
- **D1:** `fresh-forward-db` (id `db5f9671-5f68-459c-a41e-5accece9233e`, jurisdiction **eu**)
- **R2:** `ff-documenten` (binding `DOCS`)
- **Laatste build:** v89 · **PWA-cache:** `ff-v64` (in `src/pwa.ts`)

## ⚠️ Werkwijze (belangrijk — zo voorkom je problemen)
- **Schrijf/wijzig bestanden via de shell (bash/heredoc/python), NIET via de Edit/Write-
  filetools.** Die kapten in deze omgeving meermaals bestanden af (layout.ts, index.ts,
  wrangler.toml). Na schrijven altijd verifiëren: `npx tsc --noEmit` (strict, 0 fouten),
  en bundelcheck met een **Linux-esbuild** (de meegeleverde esbuild is een Windows-binary
  die in de sandbox niet draait — installeer eenmalig `npm i esbuild` in /tmp en draai
  `/tmp/node_modules/.bin/esbuild src/index.ts --bundle --format=esm --outfile=/tmp/x.js`).
- **D1-schema/data**: via de Cloudflare-connector (MCP `d1_database_query`) of
  `npx wrangler d1 execute`. Schema staat live; alleen code vereist `npm run deploy`.
- **Na elke ronde**: PWA-cache `CACHE` in `src/pwa.ts` ophogen (nu `ff-v23`) zodat de
  service worker ververst; collega's app 1× sluiten/heropenen.
- **Deploy**: zip uitpakken over de projectmap → `npm run deploy`.

## Tech & architectuur
- `src/index.ts` — alle Hono-routes + middleware. Middleware zet per request: `roles`
  (rollen + `mod:<id>`-tokens voor aan-staande modules, in ingestelde volgorde),
  `playerId`, `modules`.
- `src/views/layout.ts` — zijbalk + alle component-CSS + PWA-head + body-scripts
  (SW-registratie, swipe-to-open menu, /api/modules nav-sync, inklapbare groepen).
- Server-rendered met `hono/html`. Iconen = Lucide/Feather-stijl inline SVG (geen emoji).

### Navigatie/zijbalk
- Home (vast bovenaan) → herordenbare module-blokken → **Persoonlijk** (Trainingen,
  Team, Mijn account, Bug melden) → **Beheer** (beheerder-rol).
- Groepen (Competitie, Kantine, Persoonlijk, Beheer) zijn **inklapbaar** (stand in
  localStorage). Volgorde van de modules: **tenant-breed** instelbaar via Beheer →
  Modules (↑/↓). Trainingen/Team staan vast onder Persoonlijk (geen pijltjes).
- Snappy: pagina's komen uit cache (stale-while-revalidate); de zijbalk-modulestand
  wordt licht bijgewerkt via `GET /api/modules` (altijd vers, niet gecachet).

## Modules (aan/uit + volgorde via Beheer → Modules, tenant-breed)
agenda, competitie, kantine, prikbord, team, meldingen, noodmelding, trainingen.
Config in `src/modules.ts` (`MODULES`) + opgeslagen in D1 `app_settings`
(keys: `modules`, `module_order`). Route-guards: een uit-module is niet bereikbaar.

## Features (gereed, draait op D1)
- **Globaal zoeken** (`/zoek`): één zoekbalk over nieuws + documenten + mensen (in-memory
  filter, hoofdletterongevoelig, AND op zoekwoorden). Header-zoekicoon + menu-item;
  mensen tonen als contactkaart, nieuws linkt naar `/#nieuws-<id>`-anker op home.
  **Live zoeken tijdens typen** via `GET /api/zoek` (server-rendered fragment, debounced);
  form blijft fallback zonder JS.
- **Emoji-reacties**: reactiebalk (👍❤️😄🎉👏) onder prikbord- én nieuwsberichten, live
  toggle via `POST /api/reactie` (tabel `emoji_reacties`), gedeelde `emojiBar()` + script in layout.
- **Reacties onder nieuws**: platte reacties per bericht op home (tabel `nieuws_reacties`),
  ownership (maker/admin verwijderen). **Eerste-login tour**: eenmalige welkomstoverlay
  (localStorage `ff_tour_v1`). **Agenda**: nieuw event standaard op de bekeken dag.
- **Intranet/home**: nieuws, documenten, jarigen (met foto), app-tegels (Buddee/
  TimeChimp/WK-poule), push-aanmelden, PWA-install-hint.
- **Mijn account**: bijnaam, Spotify intro-tune, voice-prefs, ELO+nemesis, saldo,
  **verjaardag-zichtbaar-toggle**.
- **Competitie** (ELO darts/dammen/pingpong): ranglijst, spelerprofiel (nemesis/laatste-5),
  **klikbaar 501-dartbord met voice + score-persistentie (localStorage) + gast**, toernooien.
- **Kantine**: bestellen, saldo, kantine-beheer (bijboeken/zet-saldo/verrekenen, menu),
  **bestellijst open/dicht** + **bestellingen-van-vandaag**.
- **Prikbord**: berichten + reacties + **afbeelding-upload**; verwijderen door maker óf beheerder.
  **Shout-outs**: een bericht met optionele ontvanger rendert als shout-out-kaart (award-
  icoon + "Shout-out voor X"). Optioneel home-blok via Beheer → Modules (toggle
  `shoutouts_home`, **standaard uit**).
- **Team** (smoelenboek), **Agenda** (dag/week/maand, event-detail + push bij update).
- **Meldingen** (voorraad/defect): aanmaken (start `open`), afhandelen, **archiveren**
  (AVG: geen hard delete — status `gearchiveerd`, retentie-cron ruimt op);
  ontvangers per categorie + **wekelijkse push** (maandag).
- **Noodmelding/BHV**: alarmknop → directe push naar getagde BHV'ers + logboek
  (wisbaar per stuk/alles). 112-disclaimer.
- **Trainingen**: cursussen + hoofdstukken (markdown + kennischecks), **voortgang +
  gating** (volgend hoofdstuk pas na afronden), **zoek/filter**. Twee cursussen geseed
  (Copilot + Teams). Beheer-CRUD.
- **Bugmelding**: "Bug melden" in zijmenu + footer → meldformulier met **screenshot-
  upload**; in Beheer met **status** (open→in_behandeling→opgelost/afgewezen).
- **Klantenportaal** (`/portaal`): magic-link login (Resend), rassen/teeltadvies/snoei
  (met **bestand-upload**), klantdocumenten.
- **Beheer** (tegels, rol "beheerder"): Modules, Pushmelding (+push-toggles), Meldingen-
  ontvangers, BHV-groep, Bugmeldingen, Nieuws/Documenten/Medewerkers/Afdelingen/
  Trainingen, Klanten/Rassen/Teeltadvies/Snoei/Klantdocumenten, Wedstrijden.

## Dwarsdoorsnijdend (platform-bril — al toegepast)
- **Ownership/moderatie**: `src/ownership.ts` → `canEditOrDelete(player, created_by)` =
  admin/beheerder óf de maker. Gebruikt bij prikbord/meldingen-verwijderen.
- **Audit-log**: `src/audit.ts` → tabel `audit_log` (wie/wat/wanneer), best-effort.
- **Tenant-klaar**: alle config in `app_settings` heeft `tenant_id` (nu `'default'`).
  Bij het platform-spoor wordt dit per tenant.
- **Push-toggles**: `app_settings` keys `push_nieuws`/`push_meldingen`/`push_agenda`.
- **UX/QoL-laag**: centraal **toast-systeem** (flash-banners `data-toast` → toast via
  `showToast()` in layout; no-JS valt terug op inline banner), nette **fout-/404-pagina**
  (`errorPage` + `app.onError`/`notFound`), agenda **onthoudt weergave** (cookie
  `ff_agenda_view`), ruimere **touch-targets** (`@media (pointer:coarse)`), verwijder-
  bevestigingen compleet.
- **Module-guard server-side**: middleware `PAD_MODULE` blokkeert uitgezette modules op
  URL/API (niet alleen in het menu). Beheer blijft admin-gated.
- **Hardening**: competitie-opties nu ge-escaped (was XSS via bijnaam); uploads via
  INLINE_OK-allowlist + `nosniff` + attachment-fallback; SQL met allowlist-identifiers + bind.

## D1-tabellen (belangrijkste)
medewerkers (incl. `verjaardag_zichtbaar`), nieuws, documenten, afdelingen, klanten,
rassen/teeltadvies/snoei_pluk (incl. `bestandssleutel`/`bestandsnaam`), klantdocumenten,
posts (incl. `afbeelding_key`) + reacties, matches/ratings/tournaments(+players),
snack_menu/snack_ledger, agenda_events, pushabonnementen, events(log), **app_settings**,
**meldingen**, **noodmeldingen**, **courses**/**course_chapters**/**course_progress**,
**bugmeldingen**, **audit_log**.

## Env & secrets (wrangler.toml + secrets)
Vars: BUDDEE_URL, TIMECHIMP_URL, WK_POULE_URL, BEZOEK_ENABLED, BEHEERDER_EMAILS,
AVG_CLEANUP_ENABLED, RETENTIE_DAGEN, PORTAL_BASE_URL, RESEND_FROM, VAPID_PUBLIC_KEY,
VAPID_SUBJECT. Secrets: PORTAL_SECRET, VAPID_PRIVATE_KEY, PUSH_API_KEY, RESEND_API_KEY.
(Airtable is volledig verwijderd — draait 100% op D1.)

## Bron-bestanden (src/)
Datalaag: `airtable.ts` (D1-client, oude veldvorm), `account.ts`, `elo.ts`, `snacks.ts`,
`agenda.ts`, `meldingen.ts`, `noodmelding.ts`, `trainingen.ts`(+`courses_seed.ts`),
`bugmelding.ts`, `modules.ts`, `ownership.ts`, `audit.ts`, `birthdays.ts`, `richtext.ts`,
`logs.ts`, `access.ts`, `security.ts`, `tz.ts`, `pwa.ts`, `brand.ts`, `icons.ts`,
`push/webpush.ts`, `portal/{session,mail,i18n}.ts`.
Views: `layout.ts`, `intranet.ts`, `smoelenboek.ts`, `social.ts`, `beheer.ts`,
`account.ts`, `competitie2.ts`, `friet.ts`, `agenda.ts`, `meldingen.ts`,
`noodmelding.ts`, `trainingen.ts`, `bugmelding.ts`, `bezoek.ts`, `portal.ts`.

## Open punten / mogelijke vervolg-bugfixes
- Data aanvullen via beheer: afdeling/telefoon per collega, foto's voor wie er geen heeft,
  portaal-content (rassen/teelt/snoei/klantdocumenten) + klantenlijst, kantine-saldo's.
- Aanwezigheid (wifi) + externe login: zie `BLOK-F-VERKENNING-...md` (eerst verkennen).

## Andere docs in de map
`PLATFORM-SPOOR-CONTEXT.md` (multi-tenant vervolg), `BLOK-F-VERKENNING-aanwezigheid-en-
externe-login.md`, plus de hoofdbriefing `PLATFORM-COMPLETE-BRIEFING.md`, en de oudere
ronde-docs (RONDE-5/6, API-PUSH-INTEGRATIE, GO-LIVE-EN-AVG, etc.).
