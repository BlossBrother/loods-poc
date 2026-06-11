# Doorlichting + finetune-plan — Fresh Forward intranet (v83)

> Sanity/smoke · security · AVG · UX/UI tegen de literatuur (UX-sets). Bijgewerkt 8 juni 2026.

## 1. Sanity / smoke (technisch) — ✅ groen

- `npx tsc --noEmit`: 0 fouten (strict). Linux-esbuild-bundel: schoon (~595 KB).
- NUL-byte-corruptie in `src/`: geen (alleen 2 losse rommelbestanden in de projectroot — `zibnVpXT`, `zioK96yY` — die niet bij het project horen; veilig te verwijderen).
- Render-smoke van de hoofdschermen zonder fouten: home, prikbord, beheer-modules, meldingen, agenda, trainingen-lijst/detail, stijlgids.
- Deploy-flow: zip uitpakken -> `npm run deploy`. Geen DB-migraties nodig sinds v55 (alle UI/nav-config zit in `app_settings`, geen schema-wijziging).

## 2. Security

**Sterk:**
- **XSS**: alle gebruikers-/admincontent wordt escape-first gerenderd — `renderMd` (trainingen) en `renderRich` (nieuws) escapen eerst álle HTML en passen pas daarna opmaak toe; live-zoek-fragment komt server-rendered (hono-escaped) binnen. De 51 `raw()`-aanroepen zijn statische SVG-iconen / gecontroleerde waarden, geen user input.
- **Module-guard**: server-side (`PAD_MODULE` + `isModuleOn`) — een uitgezette module is ook op URL/API geblokkeerd, niet alleen verborgen.
- **Ownership/moderatie**: `canEditOrDelete` (maker of beheerder) bij verwijderen; **audit-log** (`audit_log`) op delete-acties.
- **Emoji/reactie-auth** (sinds v58): identiteit ook uit het `CF_Authorization`-cookie bij fetch-calls.

**Aandachtspunten (geprioriteerd):**
1. **[P1] Zet volledige Access-JWT-verificatie aan.** `ACCESS_TEAM_DOMAIN` + `ACCESS_AUD` staan nog uitgecommentarieerd, dus `resolveAccessEmail` draait in **fallback** (vertrouwt de door Access gezette header/cookie zónder handtekening te verifiëren). De code (`verifyAccessJwt`) staat er al klaar — alleen de twee vars invullen. **Cruciaal i.c.m. punt 2.**
2. **[P1] Sluit/bescherm de `*.workers.dev`-route.** De Worker is óók bereikbaar op `fresh-forward-intranet.peterjan-vaningen.workers.dev` (zie `PORTAL_BASE_URL`). Staat die hostname niet óók achter Cloudflare Access, dan kan iemand de fallback-identiteit spoofen (header/cookie zelf zetten). Zet Access op alle hostnames óf schakel de workers.dev-route uit (custom domain only). Met punt 1 (echte JWT-verificatie) vervalt dit risico grotendeels.
3. **[P2] Pen-test vóór externe/betalende gebruikers** (hoort bij het platform-spoor): IDOR/recordniveau-autorisatie systematisch, upload-validatie (type/grootte/origin van prikbord- en bug-uploads), CORS, rate-limiting op `/api/reactie` + magic-link.
4. **[P3] Secrets-hygiëne**: controleer dat `.dev.vars` (bevat tokens) nooit in git zit; roteer de daarin zichtbare dev-sleutels indien ooit gedeeld.

## 3. AVG / privacy

**Op orde:**
- **D1 in EU-jurisdictie** (queries served vanuit EEUR) + R2 voor bestanden.
- **Minimale PII**: medewerkers (naam/e-mail/afdeling/telefoon/verjaardag), reacties, saldo. Verjaardag-zichtbaarheid is per gebruiker instelbaar (opt-out).
- **Client-storage bevat geen PII** — alleen UI-voorkeuren (`ff_hide_fun`, `ff_tour_v1`, `ffInstallDismissed`, `ff_seen`). Geen cookie-consent nodig (functioneel).
- **Geen hard delete** waar gevoelig: meldingen worden **gearchiveerd** (status), retentie-cron ruimt later op.

**Aanbevelingen:**
1. **Zet de retentie-cron daadwerkelijk aan** (`AVG_CLEANUP_ENABLED="true"`, `RETENTIE_DAGEN`) zodra je live bent — nu staat 'm uit.
2. **Verwerkersovereenkomst (DPA)** met Cloudflare + (indien gebruikt) Resend/Mailchimp vastleggen; **privacyverklaring** voor medewerkers (welke data, hoelang, waarom).
3. **Lief-en-leed/"het potje"** (toekomstige fun-module) is privacygevoelig — bouw daar expliciete zichtbaarheids-/opt-in-controles in (al genoteerd in de feature-docs).
4. **Audit-log retentie** ook een bewaartermijn geven (nu onbeperkt).

## 4. UX/UI tegen de literatuur (UX-sets) + finetune-plan

| Laag | Set | Stand | Finetune |
|------|-----|-------|----------|
| Tokens | 0/Set 3 | ✅ kleur/type/ruimte/radius/elevatie/motion/z-lagen | type-schaal per scherm nog finetunen waar krap |
| Motion | Set 1 | ✅ tokens, entrance (1×/sessie), press, pull-to-refresh, emoji-pop + count-tick, view-transitions, reduced-motion | lijst→detail **shared-element-morph** (de echte "wow"); "verzonden"-vinkje; skeletons op trage fetches |
| Gebaren | Set 2 | ✅ pull-to-refresh, swipe-acties (+knop-fallback), swipe-to-go-back, long-press, duim-zone | haptiek op iOS alleen via native wrapper (geparkeerd); swipe-acties breder uitrollen (kantine/agenda) |
| Looks | Set 3 | ✅ tokens, frosted nav/header/popover, soft/calm, leesbreedte | **strategische elevatie** consequenter (alleen CTA/uitgelicht); selectieve glassmorphism bewust beperken; consistente radius-audit |
| Structuur | Set 4 | ✅ bottom-nav (kernmodules), Meer-popover, sub-tabs, config-beheer, audit gedaan | `PageLayout`/`DetailLayout`/`FormLayout` overal toepassen (nu deels: prikbord/home/lege staten); `detail()` op agenda-event/competitie-speler/training |

**Concreet finetune-plan (prioriteit):**
1. **Templates afmaken** (Set 4): resterende lijstpagina's via `page()`, detailpagina's via `detail()`, formulieren via `formPage()`. Grootste consistentie-winst, laag risico.
2. **Strategische elevatie + radius-audit** (Set 3): diepte alleen als wegwijzer (primaire CTA, uitgelicht); één radius-schaal consequent. Tilt "premium" zonder nieuwe componenten.
3. **Lijst→detail shared-element-overgang** (Set 1 #104): de grootste resterende "wow", via named view-transitions op agenda-event/training (Chromium; iOS valt terug op de huidige fade).
4. **Swipe-acties breder** (Set 2 #113) + **"verzonden"-vinkje** (Set 1 #107/#110).
5. **Toegankelijkheid-pass** (Set 3 #129): contrast (WCAG 4.5:1) op de frosted lagen verifiëren, focus-states, schermlezer-labels op icoon-knoppen.

> Kern: het fundament en de IA staan; de finetune zit in (a) templates overal doortrekken, (b) diepte/elevatie spaarzaam-maar-consequent, (c) de shared-element-overgang, en (d) een toegankelijkheids-controle. Security-P1 (JWT-verificatie + workers.dev) is het enige dat ik vóór bredere uitrol echt eerst zou regelen.
