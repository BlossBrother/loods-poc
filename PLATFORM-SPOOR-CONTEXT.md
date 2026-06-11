# Platform-spoor — CONTEXT & vervolg (lees dit eerst in een nieuwe chat)

> Handoff voor het **multi-tenant SaaS-platform** (fase 3). Apart, los project naast
> de Fresh Forward PoC. Geef in de nieuwe chat mee: dit doc, het project
> `fresh-forward-platform-saas-v*.zip`, en de hoofdbriefing (Deel 3–6).

## 0. Productnaam & merk: LOODS (toegevoegd juni 2026)
Het platform heet **Loods** — "Alles onder één dak. Het intranet voor de werkvloer."
Merk-assets + businessplan v2 + flyer staan in `loods-design/` (logo's SVG/PNG,
merksysteem, app-mockups: donkere UI met amber/oranje accent, mobile-first PWA).
Kern uit businessplan v2 (`loods-design/loods-businessplan.pdf`):
- Doelgroep: NL mkb 50–100 medewerkers, deskless (agri/food, bouw, productie);
  de FF-pilot is de showcase (47 live, 86% wekelijks actief, livegang <1 dag).
- **9 modules, per tenant aan/uit**: Nieuws, Prikbord, Agenda, Meldingen,
  Bestellen (kantine), BHV & Nood, Team, Toernooien (competitie), Documenten.
  De PoC-module-registry (`src/modules.ts`, incl. nieuws/documenten sinds v167)
  spoort hier vrijwel 1-op-1 mee — porten = mappen.
- Prijs: Pilot €3 / Core €4,50 / Plus €6 p/gebruiker/mnd (per-stoel via Stripe).
- Roadmap: Q3'26 multi-tenant GA + Stripe + self-serve onboarding · Q4'26 push +
  PWA + tenant 2–3 · Q1'27 zoeken-over-alles + AI-assistent · Q2'27 integratie-
  marktplaats. Domein: loods.app.

## 1. Twee sporen
- **PoC** = dit intranet (`fresh-forward-intranet`), single-tenant, draait live. Bevat
  alle features. Wordt niet aangeraakt vanuit het platform-spoor.
- **Platform** = `platform-saas` (nieuw, multi-tenant). Hier: multi-tenancy + onboarding
  + billing; daarna PoC-modules porten; uiteindelijk wordt FF tenant #1.

## 2. Wat al staat in het scaffold (v1)
Deploybare Hono-Worker met de kern uit briefing Deel 4:
- Middleware-keten `auth → tenant → (rbac) → handler` (`src/index.ts`).
- KERN tenant-resolver (`src/middleware/tenant.ts`) + KERN tenantDb (`src/db/client.ts`).
- `auth.ts` stub (DEV_MODE headers; echte Entra-JWT nog te doen), `rbac.ts`.
- Voorbeeldmodule `modules/agenda.ts` (tenant-scoped).
- `migrations/0001_init.sql` (tenants/players/agenda_events + seed tenant A/B).
- `test/isolation.test.ts` (vitest, isolatiebewijs).

## 3. Opstarten
```
cd platform-saas
npm install
npx wrangler d1 create platform-db        # database_id in wrangler.toml
npm run db:init
npm run dev      # test met -H "x-dev-email:" -H "x-dev-tenant:"
npm test
npm run deploy
```

## 4. Volgende stappen (fase 3 → 5)
1. Isolatie-test in CI uitbreiden (miniflare + echte D1 + alle endpoints) — poort, moet groen.
2. Echte Entra/Access-JWT in `auth.ts` (ACCESS_TEAM_DOMAIN + ACCESS_AUD).
3. Onboarding (Entra admin-consent → tenants-record, eerste admin).
4. Stripe per-seat billing (Checkout, webhooks → suspend, seat-sync cron).
5. Tenant-admin paneel (modules/branding/facturen).
6. PoC-modules porten via tenantDb (agenda done als bewijs; daarna competitie, kantine,
   account, prikbord, meldingen, noodmelding, trainingen, bugmelding).
7. Fresh Forward als tenant #1 migreren; PoC archiveren.
8. Compliance (audit-log, dataverwijdering, AVG) + pen-test op isolatie vóór 1e klant.
9. CRM als module (Deel 6).

## 5. Principes & valkuilen
- Nooit rauwe `env.DB` in handlers — alleen `tenantDb` (overweeg CI-grepcheck).
- Ownership-helper `canEditOrDelete(user, record)` overal (PoC heeft `src/ownership.ts`).
- Audit-spoor (PoC `src/audit.ts` + `audit_log`).
- **Schrijf bestanden via bash**, niet via Edit/Write-filetools (kapten af). Verifieer
  met tsc + losse Linux-esbuild. `npm install` kan langer duren dan 1 tool-call.
- Eigen `platform-db` aanmaken (NIET de PoC-db `fresh-forward-db`).
- Optie A (gedeelde D1 + tenant_id) nu; ontwerp zó dat optie B (D1-per-tenant) later kan.

## 6. PoC-referentie (Cloudflare)
- PoC-Worker `fresh-forward-intranet`, achter Cloudflare Access / M365-SSO.
- PoC-D1 `fresh-forward-db` (id `db5f9671-5f68-459c-a41e-5accece9233e`, jurisdiction eu).
- PoC-R2 `ff-documenten` (binding DOCS). De PoC heeft al een platform-bril:
  `app_settings` (tenant_id) voor modules/volgorde/push-flags/ontvangers.

Details: zie de hoofdbriefing Deel 3 (businessplan), 4 (architectuur), 5 (onboarding/
billing), 6 (CRM).
