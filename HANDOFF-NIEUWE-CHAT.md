# Handoff — sessie 10 juni 2026 (afgebroken, hier verder)

## ⬆️ UPDATE (zelfde dag, parallelle CRM-sessie) — lees dit eerst
- **CRM-module gebouwd (v166, NOG NIET gedeployed)**: `/crm` voor team Concepts +
  beheerders (rol-token `crm` o.b.v. Medewerkers→Afdeling). Klantenlijst+kerncijfers,
  klantenkaart, klant aanmaken/bewerken (gedeelde `klanten`-tabel, portaal-toegang
  loopt mee), contactpersonen, contactmomenten, taken, deal-pipeline. Nieuw:
  `src/crm/data.ts` (datalaag met db-handle, platform-klaar), `src/crm/routes.ts`
  (sub-app op /crm), `src/views/crm.ts`, `migrations/0018_crm.sql`. Gewijzigd:
  index.ts (rol-token, PAD_MODULE, mount, home-tegelfilter, cron-opschoning crm),
  layout.ts (briefcase-icoon, SUBMODULES/PRIMARY/PATH_HEAD/bottomnav-rolfilter),
  modules.ts, nav.ts, account.ts (Player.afdeling), summary.ts (crm-tegel, eigen
  try/catch), pwa.ts (BUILD v166, CACHE ff-v138 — offset 28 behouden). Besluit in
  `ADR-001-crm-en-portaal-in-bestaande-worker.md`; details in CHANGELOG v166.
- **Deploy-volgorde**: eerst `npx tsc --noEmit` (op Windows), dan migratie 0018 op
  `fresh-forward-db` (en -test), dan `npm run deploy`.
- **Mount-bevinding bevestigd + aangescherpt**: de PoC-mount capt LEESACTIES op de
  grootte van de initiële sync; edits via file-tools komen wél door binnen die cap.
  Eigen, in de sessie nieuw aangemaakte bestanden zijn aanvankelijk volledig leesbaar,
  maar na latere groei geldt dezelfde cap. Outputs-map: roundtrip in beide richtingen
  getest en betrouwbaar.
- **Spiegel + tsc-nulmeting NIET gelukt in deze sessie**: de drie spiegelagents
  (root A–I / I–Z+portal+push+crm / views+config) konden niet starten (sessie-/
  maandlimiet). Stappenplan hieronder (§Volgende sessie) blijft dus staan; neem de
  CRM-bestanden daarin mee.


> Sessie gestopt halverwege. Doel was: PoC-bugfixes + platform-spoor (modules porten).
> Codebase is NIET gewijzigd (één comment-edit in src/pwa.ts is teruggedraaid).

## ⚠️ Belangrijkste bevinding: bash-mount is nu óók voor de PoC-map onbetrouwbaar
- De Linux-shell ziet bestanden in `fresh-forward-intranet` **afgekapt/verouderd**
  (bv. pwa.ts: 108 regels via bash vs 136 echt; index.ts 2712 regels echt).
  `tsc` via de mount geeft daardoor valse "Unterminated string/template literal"-fouten.
- **Gevolg**: lees/schrijf de PoC in Cowork ALLEEN via de file-tools (Read/Write/Edit,
  Windows-pad). Dit is het omgekeerde van het oude advies in PROJECT-CONTEXT.md §Werkwijze.
- **Verificatie (tsc/esbuild)** kan alleen op een spiegelkopie in de outputs-map van de
  sessie (die mount is wél betrouwbaar, roundtrip getest): bestanden via Read→Write
  spiegelen en daar `npm install` + `npx tsc --noEmit` draaien.

## Stand van de spiegelkopie (sessie-outputs, gaat verloren na de sessie!)
- Gespiegeld via agents (regelaantallen geverifieerd): src-root A–L (16 bestanden,
  incl. brand.ts/icons.ts met grote base64-regels) en src-root M–Z + portal/ + push/
  (24 bestanden, incl. index.ts 2712 regels, met behoud van letterlijke \uXXXX-escapes
  en de BOM op index.ts:1467).
- **NIET meer gedaan**: src/views/* (22 bestanden, incl. layout.ts) spiegelen,
  package.json/tsconfig.json, npm install + tsc-run. In een nieuwe sessie dus opnieuw
  spiegelen (outputs-map is per sessie).

## Versiestand
- BUILD = **v165** (src/pwa.ts), PWA-cache = **ff-v137**. Het vaste offset BUILD↔CACHE
  is 28 (v139↔ff-v111), dus v165↔ff-v137 klopt — géén mismatch.
- CHANGELOG.md stopt bij v139; v140–v165 zijn niet gelogd. MODULE-SJABLOON.md (3.1-slag,
  v161) is het meest recente document.

## Bug-audit (door verkenningsagent; NOG NIET zelf geverifieerd — eerst checken!)
Let op: de agent las deels via de kapotte bash-mount; regelnummers/claims kunnen fout
zijn. De "cache-mismatch"-claim is al ontkracht (zie hierboven). Te verifiëren claims:
1. (P1?) SPA-router: event listeners op document/window stapelen per `ff:page` zonder
   cleanup → dubbele handlers/API-calls na veel navigaties.
2. (P1?) SPA-fetch-fallback onvolledig bij offline/timeout op cache-hit.
3. (P1?) formPage() in views/templates.ts: `raw()` op een attribuutwaarde (enctype) —
   mogelijke attribute-injection; check of de waarde ooit user-input is (waarschijnlijk niet).
4. (P2) Scroll-listeners header/pill her-registreren per ff:page.
5. (P2) visualViewport-handler (sheets) niet herijkt na SPA-swap.
6. (P2) install-hint binding multi-tab; (P2) nav-collapse-stand na SPA-swap.
Server-side oogde schoon (guards/ownership/audit aanwezig).

## Platform-spoor (Intranet Platform-map) — port-plan ligt klaar
- Sjabloon = `src/modules/agenda.ts`: tenantDb + requireModule + pick/str/int +
  canEditOrDelete + audit; migraties genummerd; tests met node:sqlite-helper.
- Eerstvolgende modules: **prikbord** (posts/reacties/emoji; afbeelding-upload vereist
  nog een R2-binding in platform-wrangler.toml) → migratie `0003_prikbord.sql`, en
  **kantine** (snack_menu + snack_ledger met amount_cents/kind) → `0004_kantine.sql`.
- Platform-map: alléén via file-tools lezen/schrijven; verifiëren in /tmp-kopie met
  eigen npm install (zie PLATFORM-SPOOR-CONTEXT.md §9).

## Volgende sessie — volgorde
1. Spiegel de PoC opnieuw naar de sessie-outputs (3 agents: root A–L, root M–Z+portal/push,
   views/*; daarna package.json+tsconfig) en draai daar tsc als nulmeting.
2. Verifieer buglijst hierboven in de echte code (file-tools) en fix wat standhoudt;
   PWA-cache ophogen, tsc+esbuild op de spiegel, gewijzigde bestanden terugschrijven.
3. Daarna platform: prikbord + kantine porten volgens het plan.
