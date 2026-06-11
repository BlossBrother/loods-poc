# Handoff — t/m v189: restyle af, spoor B-1, rollen/HR, visuele overhaul (lees eerst)

> Vervangt HANDOFF-NIEUWE-CHAT.md (10 juni) als startpunt. Sessies 11 juni 2026:
> Loods-restyle (v170–v179), spoor A (v181–v184), spoor B-1 + HR-rondes (v185–v188),
> visuele overhaul (v189).

## Stand
- **v189** klaar voor deploy (BUILD v189 / PWA-cache ff-v161). v188 draait live.
- **Spoor A is af** (v181–v184): beheer-schermen gecomponeerd (eyebrow/lijstkaarten),
  module-koppen in home-stijl via `pageTitle()`/`page({icon})` (views/templates.ts),
  skeleton-laadstaat bij koude SPA-navigatie >300ms, stijlgids met Loods-sectie.
- **Spoor B-1 (v185)**: leesbevestiging ("Gelezen"-knop op nieuws/Beleid-documenten,
  /api/gelezen idempotent, Beheer → Leesbevestiging x/N + wie) en **/vandaag**
  (Buddee-afwezigen + eigen dagstatus, AVG-licht: alleen vandaag, cron wist ouder;
  migratie 0019 live). Logo (merk-chip) uit alle headers (v185).
- **Rollen (v186–v188)**: hoofdrol **Redacteur** (HR) = content-beheer via pad-bewuste
  magBeheren-gate (REDACTEUR_PADEN in index.ts) zonder platform/escalatie; hoofdrol
  **Uitzendkracht** = alleen prikbord/agenda/nieuws (EXTERN_MODULES-filter in de
  middleware → menu's/guards volgen vanzelf); extra-rollen in kolom `roles`:
  admin (breed), pv (agenda), **kantine** (alleen /friet/beheer, vinkje in
  Medewerkers-beheer). Wendelien: rol Medewerker + kantine (admin eraf, 11 juni).
- **Access-sync (v187, src/accesssync.ts)**: Cloudflare-groep "Uitzendkrachten"
  volgt Beheer → Medewerkers automatisch (opslaan + dagelijkse cron). Config in
  wrangler.toml (CF_ACCOUNT_ID/CF_ACCESS_GROUP_ID ingevuld) + secret CF_API_TOKEN.
  Dashboard heet nu "Cloudflare One": Integrations → Identity providers (OTP),
  Access controls → Policies → Rule groups.
- **Visuele overhaul (v189, literatuur-gedreven)**: schaduwen = key+ambient
  (ink-getint, 3 niveaus); dark = surface-ladder (--surface-3/--card-hi #232F40
  voor ballon/Meer-menu) + gehalveerde schaduwen + ontzadigde accenten
  (--t-ink/menu-ink #5fbe85); OKLCH-ramps voor groen+muted via @supports (hex =
  fallback); glow 24%; **capsule-tabbar adaptief** via --cap-tokens (licht glas in
  light mode) — home2.ts en layout.ts synchroon houden bij wijzigingen!
- Noodmelding: actieve melding (<30 min) toont "Afgehandeld"-knop (BHV/beheer/melder).
- Fix v188: foryou filtert soft-deleted (posts/polls/agenda) — verwijderd = ook weg van home.
- **Meer-menu & zijbalk zijn nu 1-op-1 home** (v181–v184, na 3 correctierondes met
  PJ's screenshots). Lessen — NIET terugdraaien: (1) versie-footer staat ÍN de nav
  (scrolt mee, home-patroon); (2) menurij/groepstitel/footer hebben EXPLICIETE
  px-line-heights (20/14/16px) in home2.ts én layout.ts — de body-lh van 1.65 en
  font-'normal' gaven anders rij-verschillen; (3) geen min-height op ballonrijen,
  geen navsec-marge; (4) desktop: navtitle .66rem/14px-toppadding, aside 18px,
  hover-tint = vaste accent-10%; (5) documenten-icoon = boek, overal (CHIP_ICON).
- Hele app in Loods-stijl: componentbibliotheek `src/views/loods.ts` (tokens +
  componenten, CSS gescoped onder `.lds`), globale `.lds`-wrapper in layout.ts
  (<main>), home (`home2.ts`) is de stijlreferentie — **home is leidend**.
- Navigatie: donkere capsule-tabbar app-breed (Home·Agenda·Prikbord·Meldingen·
  Meer) met badges; profiel-avatar (initialen/teamfoto via `me:`-rol-token)
  rechtsboven; Meer-ballon rechtsonder, identiek op home (eigen popover) en
  shell (drawer), beide uit het nav-token (groepen/rollen/module aan/uit) met
  versie-footer. Desktop: zijbalk-layout, ook op home (max 1500px).
- Iconen: één set (home-sprite-vormen) in layout-ICONS én home-sprite.
- SPA-cache (`ff-spa-<BUILD>`) leegt zichzelf per deploy. Gesloten sheets zijn
  hard onzichtbaar (containing-block-fix v172 — NIET terugdraaien).

## Werkwijze nieuwe sessie (BELANGRIJK — mount-gedrag)
- Lezen/schrijven PoC: ALLEEN file-tools (Read/Edit/Write, Windows-pad).
- De bash-mount kapt GEGROEIDE bestanden af op de byte-grootte van de
  sessie-start en padt GEKROMPEN bestanden met NUL-bytes. Verificatie dus op een
  /tmp-spiegel: kopieer, `tr -d '\000'`, vergelijk `wc -l` met Grep-regeltelling
  via file-tools, repareer staarten met head-n + bekende inhoud, dan
  `npx tsc --noEmit` + Linux-esbuild (apart geïnstalleerd; mount-node_modules is
  win32). Deploy doet PJ zelf: `npx tsc --noEmit` → `npm run deploy` → footer-check.
- Per ronde: BUILD én CACHE (+1) bumpen in src/pwa.ts + CHANGELOG-entry.

## Open punten / volgende rondes

### Open besluiten/acties (klein)
- **Ziekteverlof maskeren** op /vandaag + verlofoverzicht (HR-besluit pending) —
  veilige default: alleen "afwezig" tonen, geen verloftype.
- Wendelien evt. `pv` geven als ze agenda-items moet kunnen bewerken.
- Access-sync end-to-end testen bij de eerste echte uitzendkracht.
- Git/GitHub-repo opzetten (zie GO-LIVE-EN-AVG.md §A1; .gitignore + workflow staan klaar).

### A. Afgerond in v181–v184 — resteert alleen:
1. **Shotcaller-voicepack (LATER, optie)**: infra + TTS-fallback staat (v179,
   R2-keys `caller/<score>.mp3`, `noscore`, `gameshot`). Kandidaat-bron:
   https://github.com/lbormann/darts-caller/releases — daar circuleren
   caller-voicepacks; per pack de licentie/rechten checken vóór gebruik, dan
   hernoemen naar onze keys en uploaden (`npx wrangler r2 object put
   ff-documenten/caller/180.mp3 --file=...`).
2. CRM-module: staat mogelijk nog AAN door modules_known-default — Beheer →
   Modules opnieuw opslaan zet 'm echt uit (actie PJ, geen code).

### B. Nieuwe modules/features (uit FEATURES-ROADMAP/ROADMAP, geactualiseerd —
### polls, vertaling, agenda, AI-zoeken/kennisbank-antwoorden bestaan al)
Volgorde = voorstel op impact ÷ moeite:
1. **Leesbevestiging** (S–M, ★) — "Gelezen"-knop op beleid/nieuws + beheeroverzicht.
2. **Afwezigheid / "wie is er vandaag"** (M, ★★) — verlofdata (Buddee) bestaat al;
   alleen vandaag-status + thuis/op pad toevoegen (BLOK-F-verkenning ligt er).
3. **Reserveren** (M–L, ★★) — vergaderruimte/poolauto/apparatuur; bouwt op
   agenda-patronen + D1; agenda-weergave + conflict-check.
4. **Analytics-dashboard beheer** (M, ★★) — geaggregeerd, privacyvriendelijk;
   events-tabel bestaat al als bron.
5. **Kennisbank/FAQ als artikelen** (M, ★★) — beheer + artikelvorm bovenop de
   bestaande RAG/vraagbaak.
6. **Ideeënbus** (S–M, ★) — uitbreiding op meldingen, evt. met stemmen.
7. **Fotoalbums** (M, ★) — lightbox + R2 bestaan al.
8. **BHV-plattegrond/noodnummers** (S–M) — statische infopagina in noodmodule.
9. **SharePoint/M365-docs in intranet** (L) — nu Entra er is.
10. **Vacatures / refereer-een-collega** (M).
11. **Offline-PWA verdieping** (L) — offline-queue bestaat; offline lézen erbij.

### C. Platform-spoor (Loods SaaS)
Designsysteem + componentbibliotheek 1-op-1 porten naar het multi-tenant
scaffold; FF wordt tenant #1 — zie PLATFORM-SPOOR-CONTEXT.md.

Audit: RAPPORT-audit-v178.md (alles opgevolgd in v179).
