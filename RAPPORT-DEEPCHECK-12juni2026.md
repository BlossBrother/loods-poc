# Deepcheck — redundancy · sanity · security · smoke · literatuur (12 juni 2026)

> Onafhankelijke diepe doorlichting t/m **v209**, één week vóór de interne livegang.
> Methode: hele `src/`-boom read-only gelezen, `tsc --noEmit` gedraaid in een
> sandbox-kopie, **live D1 read-only** bevraagd (migratiestatus + data-hygiëne),
> twee subagents losgelaten op security en redundancy, alle bevindingen daarna
> hér-geverifieerd tegen de code, plus verse 2026-literatuurspotchecks.
> Bouwt voort op (vervangt niet): `RAPPORT-diepteonderzoek-user-succes-juni2026.md`
> en `RAPPORT-audit-live-vs-literatuur-12juni2026.md`. Eigen optimalisatieplan in §7.

---

## 0. Verdict in één alinea

De code is gezond: **tsc 0 fouten**, SQL overal geparametriseerd, XSS afgedekt door
Hono-auto-escaping, beheer-routes volledig gegate, ownership consequent. De twee
openstaande audit-items van 12/6 (medisch-getint agenda-event + onafgevangen
View-Transition-fout) zijn **allebei al opgelost**. Maar de **livegang verandert het
risicoprofiel**: zodra er echte klanten in het portaal zitten, worden twee
bestands-endpoints (`/portaal/bestand`, `/bestand`) een reëel datalek-risico, en
draait de hele toegangsbeveiliging nog op de "vertrouw-de-header"-fallback i.p.v.
echte JWT-verificatie. Mijn advies: schuif een kleine **security-hardening-ronde
vóór de feature-roadmap** (§7). Dat is deze week het hoogste rendement, niet pulse
of onboarding.

---

## 1. Wat ik gedraaid heb (en wat eruit kwam)

| Check | Resultaat |
|---|---|
| `tsc --noEmit` (sandbox-kopie, TS 5.9.3) | **exit 0, 0 fouten** — compileert schoon |
| Versie/cache-consistentie | `BUILD=v209` + `CACHE="ff-v181"` (pwa.ts) = CHANGELOG v209 "PWA ff-v181" ✓ |
| Migratiereeks 0001–0022 | compleet, geen gat; dubbele 0005/0006 zijn lege redirect-stubs ✓ |
| Live D1 — tabellen | `kennisdump_log` (0020) + `event_rsvp` (0021) bestaan → handmatig toegepast ✓ |
| Live D1 — demo-data | `verlof` = **0 rijen** → demo-verlof weg (0022 effectief) ✓ |
| Live D1 — agenda-hygiëne | alleen "Bijzondere middag" (23/6) + "Fresh BBQ" (3/7); **GGZ/SOA-event weg** ✓ |
| Live D1 — `d1_migrations`-ledger | **staat stil op 0017** terwijl 0018–0022 wél live zijn → zie §2.1 (latente val) |
| View-Transition-catch | try/catch aanwezig (layout.ts:2170/2212/2230, "audit 12/6 §0") → **opgelost** ✓ |

Read-only; ik heb niets aan de code, repo of database gewijzigd.

---

## 2. Sanity — wat klopt en de ene scherpe rand

Het meeste is in orde: schone tsc, kloppende versielabels, complete migratiereeks,
nette wrangler-config (test-omgeving los van prod, secrets als secrets, publieke
VAPID-sleutel terecht publiek). Eén structureel punt verdient aandacht.

### 2.1 De twee migratiemechanismen lopen uiteen (latente val) — MIDDEL

De live `d1_migrations`-tabel kent alleen **0001 t/m 0017**. Toch bestaan de tabellen
uit 0018 (CRM), 0019 (leesbevestiging/aanwezigheid), 0020 (kennisdump) en 0021
(RSVP) live. Verklaring: jullie passen migraties toe met
`wrangler d1 execute --file=…` (handmatig, idempotent), niet met
`wrangler d1 migrations apply`. Daardoor is de migratie-ledger sinds 0017 bevroren.

Dat werkt prima zolang je bij `execute` blijft. De val: als iemand ooit
`wrangler d1 migrations apply --remote` draait, probeert wrangler 0018–0022 én de
twee 0005/0006-stubs opnieuw toe te passen. Dat is op zich **veilig** — ik heb
geverifieerd dat 0018–0021 puur `CREATE TABLE/INDEX IF NOT EXISTS` zijn en 0022
idempotent (`DELETE … WHERE source != 'buddee'`), en alle niet-idempotente
`ALTER TABLE ADD COLUMN` zitten in 0002–0017 (die al in de ledger staan). Maar de
**dubbele volgnummers 0005/0006** kunnen `migrations apply` laten klagen over
niet-unieke nummering.

Advies (klein, vóór livegang): kies bewust één mechanisme. Of (a) documenteer in de
CHANGELOG/handoff dat de ledger dood is en jullie uitsluitend `execute` gebruiken,
of (b) backfill de ledger (`INSERT INTO d1_migrations(name) VALUES …` voor 0018–0022)
en verwijder de twee stub-bestanden, zodat `migrations apply` weer een geldige bron
van waarheid is. Optie (a) is de minste moeite en past bij de huidige werkwijze.

### 2.2 CHANGELOG-kopdatum is stale (cosmetisch)
De kop van `CHANGELOG.md` zegt "Bijgewerkt: 9 juni 2026" terwijl de inhoud t/m v209
(12 juni) loopt. Triviaal, maar verwarrend bij een handoff. Eén regel.

---

## 3. Security — geverifieerde bevindingen

SQL-injectie: **geen**. Alle ~150 `.prepare()`-aanroepen gebruiken `?`-placeholders
met `.bind()`, ook de dynamische builders, `IN(...)`-clausules en LIKE-zoek. XSS:
**geen direct exploiteerbaar** — de views renderen via Hono's `html`-tag die elke
`${…}` escapet; `raw()` wordt vrijwel uitsluitend voor statische SVG/CSS/JS gebruikt.
Beheer-autorisatie: **volledig** — elke `/beheer/*`-route (GET+POST) roept
`magBeheren` aan, met aparte gates voor kantinegeld (`isKantineBeheerder`), agenda
(`canEditAgenda`) en CRM. Ownership (`canEditOrDelete`) zit consequent op
verwijderen/herstellen, met audit-logging. Geen hardcoded secrets; `.dev.vars`
correct ge-gitignored. Dit is een nette codebase.

De punten die wél aandacht vragen, op volgorde van urgentie gegeven de livegang:

### 3.1 `/portaal/bestand` — cross-tenant IDOR op R2 — **HOOG**
`index.ts:3111-3118`. Na de portaal-sessiecheck wordt **elke** opgegeven `?k=<key>`
uit de gedeelde `DOCS`-bucket geserveerd, zónder te controleren dat die key bij de
ingelogde klant hoort. Interne documenten, medewerkersfoto's én álle
klantdocumenten zitten in dezelfde bucket. Een ingelogde portaalklant kan dus
bestanden van een andere klant (of interne docs) ophalen als hij een key kent of
raadt. En keys zijn deels raadbaar: `docs/${Date.now()}-${Math.random().toString(36)
.slice(2,8)}-${bestandsnaam}` (index.ts:2187 e.a.) — ~6 base36-tekens entropie plus
vaak een bekende bestandsnaam.

Dit is vandaag laag-risico (nog geen externe klanten), maar wordt **op de dag van de
portaal-livegang een echt datalek-pad**. Fix: koppel klantdocumenten aan een klant
en serveer in `/portaal/bestand` alleen keys die in de klantdocumenten van díé
sessie-klant staan. Verhoog meteen de key-entropie (`crypto.randomUUID()`).

### 3.2 Echte Access-JWT-verificatie staat uit — **HOOG (config, geen code)**
`access.ts` heeft een correcte RS256-JWT-verificatie klaarstaan, maar die draait
alleen als `ACCESS_TEAM_DOMAIN` + `ACCESS_AUD` gezet zijn. Nu niet → de Worker
vertrouwt op de door Access gezette e-mailheader, en valt anders terug op het
**lezen van de `email`-claim uit het cookie zónder handtekeningcontrole**
(access.ts:165-174). Zolang Cloudflare Access écht vóór elke request zit, is dat
acceptabel. Het risico zit in de combinatie met de `*.workers.dev`-host
(`fresh-forward-intranet.peterjan-vaningen.workers.dev`, staat in wrangler.toml):
als Access alleen aan het custom domain hangt en niet aan de workers.dev-host, dan
is het hele intranet daar ongeauthenticeerd bereikbaar — en kan iemand zelf een
cookie met een beheerder-e-mailadres meesturen en beheerder worden.

Fix vóór livegang: (1) **controleer in het Cloudflare-dashboard dat de
workers.dev-host óók achter Access valt** (of zet 'm uit), en (2) vul
`ACCESS_TEAM_DOMAIN` + `ACCESS_AUD` in zodat de echte verificatie aangaat. Beide
staan al als voorbereide config-regels in wrangler.toml — alleen invullen + deployen.

### 3.3 `/bestand` (intern) zonder object-autorisatie — MIDDEL
`index.ts:502-508` staat in de `skip`-lijst (geen identiteitsresolutie) en checkt
zelf niets: elke `?k=` wordt geserveerd. Leunt volledig op Access. Combineer met de
raadbare keys (§3.1) en het is dezelfde klasse zwakte intern. Fix: uit de skip-lijst
halen (achter identiteit) en bij voorkeur ook object-eigendom afdwingen.

### 3.4 Geen CSRF-bescherming op interne POSTs — MIDDEL
Interne state-changing POSTs (verwijderen, beheer, agenda, kantinegeld) hebben geen
CSRF-token en geen `Origin`/`Sec-Fetch-Site`-check; de veiligheid hangt aan het
SameSite-gedrag van Cloudflare's `CF_Authorization`-cookie, dat de app niet zelf
beheert. Het portaal doet dit wél goed (`SameSite=Strict`). Goedkope fix: één
middleware die cross-site POSTs weigert op basis van de `Origin`/`Sec-Fetch-Site`-header.

### 3.5 Open redirect via `back`-parameter — LAAG
`index.ts:1142`: `c.redirect(back || …)` met `back` rechtstreeks uit het formulier,
geen prefixvalidatie → `back=https://evil.com` werkt. Idem protocol-relative
(`//evil.com`) bij notificatie-open (index.ts:1587). Fix:
`back.startsWith("/") && !back.startsWith("//")` afdwingen (zoals crm/routes.ts dat
al doet).

### 3.6 Kleinere hardening — LAAG / INFO
- Portaal-externe-documentlink mist de `veiligeLink()`-filter die de interne kant
  wél heeft (portal.ts:335) — een opgeslagen `javascript:`-URL blijft staan.
- `PUSH_API_KEY` wordt met `===` vergeleken (index.ts:455) i.p.v. constant-tijd
  `safeEqual` (die al bestaat in portal/session.ts).
- CSP gebruikt `'unsafe-inline'` voor `script-src` (security.ts:16) omdat de app veel
  inline scripts injecteert. Bewuste keuze, maar het betekent dat CSP geen tweede
  verdedigingslinie tegen XSS biedt. Lange-termijn: inline scripts → nonce-CSP.

**Goed geregeld (niet aankomen):** geparametriseerde SQL, Hono-escaping,
`magBeheren`-dekking, ownership + audit, portaal-sessies (HMAC-SHA256, constant-tijd,
HttpOnly/Secure/SameSite=Strict), magic-link zonder e-mail-enumeratie + rate-limit,
portaal-AI met audience-allowlist + harde backstop in rag.ts, AVG-cron en
soft-delete-opschoning volledig geparametriseerd.

---

## 4. Redundancy & hygiëne — geverifieerd

De codebase is opvallend schoon: precies **één** TODO in de hele boom
(buddee.ts:81), geen `debugger`/debugresten, `console.log` uitsluitend in cron-jobs,
icons.ts (300k) en layout.ts (179k) bevatten geen verborgen bloat. De eerder
opgeruimde dubbele `removeDoc` is bevestigd weg. Wat resteert:

### 4.1 Dode code (veilig op te ruimen, ~235 regels)
- `intranetPage` (intranet.ts:88, ~172 regels) — de oude home-pagina, nergens meer
  geïmporteerd. **Grootste enkele winst.** (De andere exports van dat bestand —
  `nieuwsPagina`, `documentenPagina`, `voorJouPage` — zijn wél in gebruik.)
- ~13 kleine dode helpers/consts: `isPv` (account.ts:30), `fillSubtitle`
  (headercfg.ts:103), `inserted` (idem.ts:20), `MELDING_TYPES` (meldingen.ts:7),
  `moveModule`/`getModulesOrdered` (modules.ts), `getNavOrderedEnabled` (nav.ts:79),
  `activityFeed`+`FeedItem` (summary.ts:107/115), `close`-icon-entry (layout.ts:26).
- **Controleren (mogelijk bewust):** `deleteMelding`, `BUG_CATEGORIE`, en de
  CRM-helpers `getMoment`/`deleteMoment`/`getTaak`/`deleteTaak` (data.ts) — kunnen
  voor een nog-te-bouwen CRM-detailroute bedoeld zijn.

### 4.2 Bewust bewaard rollback-pad (laat staan tot livegang stabiel is)
`loodsHome` (home2.ts:625) + de bijbehorende `const CSS` (home2.ts:35-255) — samen
~370 dode regels, met expliciete comment "blijft bestaan als rollback-pad"
(home2.ts:384). Prima keuze nu. Ná een stabiele livegang is dit opruim-kandidaat #1.

### 4.3 Duplicaten die uiteen kunnen lopen (ontdubbelen)
- **`euro()` divergeert al**: snacks.ts:11 formatteert handmatig (`€ 1,50`),
  crm.ts:23 via `toLocaleString`. Zelfde data, andere output. Dit is een echte bug-
  in-wording → één helper.
- Initialen-berekening staat **5×** (intranet.ts:51, smoelenboek.ts:6, social.ts:27,
  zoek.ts:11, agenda.ts:209 inline) — twee paren byte-identiek. `esc()` 2× server-side
  (richtext.ts:7, competitie2.ts:8). `pad()` 2× (access.ts:63, portal/session.ts:13).
  Laag risico, maar consolidatie in `views/templates.ts` voorkomt drift.

### 4.4 home2 ↔ layout drift (de handoff waarschuwt hier expliciet voor)
De accent-kleur lóópt al uiteen: `layout.ts:320` zet `--accent:#379a5f` (mid-groen)
voor de hele app, maar `home2.ts:37/388` zet `--accent:var(--t-accent)` met
`--t-accent:#236b41` (donker-groen, in layout het knop-press/`--green-deep`). De
home-feed gebruikt dus een **andere accent-groen dan de rest**. Daarnaast staan
neutralen, capsule-tabbar-tokens, schaduwen en motion-tokens in **beide** bestanden
hardcoded → elke stijlwijziging moet je nu op twee plekken doen. Aanbeveling: laat de
`.hm`-scope de tokens érven uit `:root` (layout) i.p.v. ze te herdefiniëren; bevestig
eerst of de accent-divergentie bedoeld is (home bewust donkerder) of een bug.

### 4.5 Repo-rommel (git-hygiëne)
- `~$-OVERZICHT-intranet-juni-2026.docx` — Office lock-tempbestand, **per ongeluk
  getrackt**. Weg.
- `_wtest` — 0 bytes, getrackt, geen functie. Weg (en de `.gitignore`-regel `_wtest/`
  matcht alleen een map, niet dit bestand → corrigeren naar `_wtest`).
- 38 `.md`-bestanden in de root: de handoff merkt `HANDOFF-RESTYLE-stand.md` aan als
  "vervangen"; `HANDOFF-NIEUWE-CHAT.md` en `HANDOFF-VOLGENDE-CHAT.md` (47k) zijn
  oudere voorgangers. Archiveerbaar naar een `docs/archief/`-map voor rust in de root.
- `app icoon.png` (~1 MB) en `logo.png` (148k) zijn design-bron, worden niet door
  code geserveerd (icoon/logo komen uit base64-constanten). Naar een assets-map.

---

## 5. Literatuur — twee correcties op de eigen rapporten

De rapporten van 11/12 juni zijn grondig en grotendeels actueel; ik herhaal ze niet.
Twee load-bearing claims kloppen niet helemaal meer in juni 2026:

1. **View Transitions is níét "Baseline in alle browsers".** *Same-document* VT is
   Baseline (Chrome 111 / Safari 18 / **Firefox 144**). *Cross-document* VT zit in
   Chromium + Safari 18.2, maar **Firefox ondersteunt het nog niet** → niet Baseline.
   Goede nieuws: jullie SPA-router gebruikt `document.startViewTransition`
   (same-document), dus het wérkt overal — maar juist omdát jullie die route kozen,
   niet omdat cross-document Baseline is. De claim in het 11-juni-rapport ("Baseline
   in alle browsers") moet genuanceerd: blijf bij same-document, vermijd
   `@view-transition` (cross-document) tot Firefox bijtrekt.

2. **Pulse-drempel ≥5 is de ondergrens, niet de norm.** 2026-guidance zet de veilige
   suppressie-drempel op **5–10 (vaak 8–10), nooit onder 3** — en cruciaal: de drempel
   moet gelden voor **elk gefilterd segment**, niet alleen bedrijfsbreed. Bij 47
   medewerkers betekent dat: per-afdeling-uitsplitsingen breken de anonimiteit bijna
   altijd. Advies: houd ≥5 aan zoals gepland, maar **toon pulse-resultaten alléén
   bedrijfsbreed** (geen afdelingsfilter) tot de organisatie groot genoeg is, en maak
   de drempel niet door beheerders overrijdbaar.

Verder bevestigd en ongewijzigd: feed-first home is het juiste patroon, geen streaks,
personalisatie = grootste terugkeer-driver, 86% wekelijks actief zit boven de markt.

---

## 6. Wat ik NIET kon afvinken (eerlijk)

- **Access-dekking op de workers.dev-host** (§3.2) is dashboard-config, niet uit code
  af te lezen — PJ moet dit zelf verifiëren. Dit is het belangrijkste open punt.
- **Lighthouse/RUM-baseline** vereist jouw machine (HONK fase 0) — niet vanaf hier te
  draaien.
- **Access-sync e2e** met een echte uitzendkracht (stond al open in de handoff).
- Live gedrag (mobiel, haptics, echte push-aflevering) is uit de code afgeleid, niet
  op een toestel getest.

---

## 7. Onze eigen optimalisatie (voorstel, gesequencet op de livegang)

De bestaande roadmap (pulse → analytics → checklists → onboarding) is goed en blijft
staan. Mijn enige structurele toevoeging: **de livegang verandert de prioriteit**.
Zodra er echte mensen + (straks) klanten op zitten, wegen een paar kleine
hardening- en hygiëne-acties zwaarder dan een nieuwe feature. Daarom zet ik er een
korte ronde 0 vóór.

### Ronde 0 — Livegang-hardening (deze week, klein, hoog rendement)
1. **`/portaal/bestand` key-eigendom afdwingen** + key-entropie naar
   `crypto.randomUUID()` (§3.1). *Must vóór de portaal-klanten erop komen.*
2. **Access-JWT aanzetten** (`ACCESS_TEAM_DOMAIN`+`ACCESS_AUD` invullen) **én
   workers.dev-host achter Access controleren/uitschakelen** (§3.2). *Config + 1 deploy.*
3. **`/bestand` achter identiteit** (uit de skip-lijst) (§3.3).
4. **CSRF-`Origin`-check** als één middleware op interne POSTs (§3.4).
5. **`back`-redirect valideren** + protocol-relative dichten (§3.5).
6. **Migratie-ledger-besluit** (§2.1): documenteer "we gebruiken `execute`" óf
   backfill de ledger + verwijder de stubs.

Schatting: samen ongeveer één werksessie. Punt 1 en 2 zijn de echte must-haves.

### Ronde 0.5 — Gratis hygiëne (meeliften met ronde 0)
7. Dode `intranetPage` + de 13 kleine dode helpers weg (§4.1) — ~235 regels lichter,
   minder ruis bij elke volgende sessie.
8. `euro()` ontdubbelen (§4.3) — voorkomt inconsistente geldweergave.
9. home2↔layout accent-divergentie bevestigen/repareren (§4.4) — past bij de
   handoff-regel "home2 en layout synchroon houden".
10. Repo-rommel uit git (`~$…docx`, `_wtest`) + CHANGELOG-kopdatum (§2.2, §4.5).

### Daarna — de bestaande roadmap, ongewijzigd op één punt na
- **Ronde C: pulse-surveys** met de aangescherpte parameters (§5): ≥5,
  **bedrijfsbreed-only tonen** bij 47 man, niet-overrijdbaar.
- **Ronde D: analytics** (staat er al sinds v206 — meet vanaf nu het effect).
- Daarna onboarding-journeys → checklists, en de besluiten (chat: niet voor de PoC;
  rooster/loonstrook-integratie: welk HR-pakket draait FF?; afdelings-targeting).

### Adoptie zonder code (PJ, parallel — bevestigd door de literatuur)
Content-ritme ≥2 nieuws/week, eerste competitie-potjes seeden, RSVP op de BBQ
aanjagen, AVG-gedragsafspraak voor de gedeelde agenda (het GGZ-event was de
waarschuwing — nu weg, maar de afspraak ontbreekt nog).

---

## 8. Bronnen

- View Transitions status: https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available · https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API · https://caniuse.com/view-transitions
- Pulse-anonimiteitsdrempels: https://www.culturemonkey.io/employee-engagement/anonymity-thresholds-in-employee-surveys/ · https://www.contactmonkey.com/blog/pulse-survey
- Eigen rapporten (basis): `RAPPORT-diepteonderzoek-user-succes-juni2026.md`, `RAPPORT-audit-live-vs-literatuur-12juni2026.md`, `HONK-DEEP-POLISH-PERFORMANCE.md`
- Code-/data-bewijs: live D1 `fresh-forward-db` (read-only, 12-06-2026), `tsc --noEmit` (TS 5.9.3), volledige `src/`-review.
