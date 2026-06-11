# ADR-001 — Klantenportaal & CRM: integreren in de bestaande Worker

**Datum:** 2026-06-10 · **Status:** geaccepteerd

## Besluit
Het klantenportaal (uitbreiding) en de nieuwe CRM-module worden gebouwd **in de
bestaande Worker `fresh-forward-intranet`**, niet als aparte Worker. We bouwen wel
**platform-klaar**, zodat porten naar het multi-tenant platform (`platform-saas`,
fase 3) later mechanisch is.

## Context
- Het portaal bestaat al in deze Worker (`/portaal`: magic-link, sessies, i18n,
  mail, Access-bypass).
- CRM en portaal delen dezelfde data (Klanten/documenten/advies in D1
  `fresh-forward-db`).
- `PLATFORM-SPOOR-CONTEXT.md` plant CRM als platform-module (Deel 6, stap 9); de
  afgesproken route is: bouwen in de PoC → later porten → FF wordt tenant #1.
- Precedent bezoeker-Worker: aparte Workers kosten service bindings, dubbele
  deploys/secrets/Access-config (zie 1042-problematiek), zonder isolatiewinst.

## Overwogen alternatieven
1. **Aparte Worker voor portaal/CRM** — afgewezen: gedeelde D1 vereist toch
   koppeling; dubbele infra; geen security- of schaalvoordeel op deze omvang.
2. **CRM direct in `platform-saas`** — afgewezen voor nu: platform mist nog echte
   auth, onboarding en billing; CRM zou daar onbruikbaar zijn tot FF tenant #1 is.

## Consequenties / bouwregels (platform-klaar)
- Eigen mappen: `src/crm/` + `src/views/crm.ts`; portaal-uitbreiding in `src/portal/`.
- Alle DB-toegang via een repository-laag (`src/crm/data.ts`) die een db-handle
  krijgt — geen losse `env.DB`-queries in handlers (→ later 1-op-1 naar `tenantDb`).
- Nieuwe tabellen krijgen een `tenant_id`-kolom (default 'ff'), zoals `app_settings`.
- Overal `canEditOrDelete` (ownership.ts) + audit-log (audit.ts).
- Module volgt MODULE-SJABLOON.md (page/detail/formPage, emptyState, 1 primaire actie).
- Toegang CRM v1: team **Concepts** + beheerders (later uitbreidbaar).

## Heroverwegen wanneer
- Portaal/CRM krijgt fors extern verkeer, eigen domein of eigen SLA → dan alsnog
  splitsen (of versneld naar het platform-spoor).
