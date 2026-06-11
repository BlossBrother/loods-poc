# Audit-rapport v178 — sanity / smoke / security / redundantie

> Uitgevoerd op de geverifieerde v178-broncode (spiegel byte-gelijk aan deploy),
> 11 juni 2026. Statische audit: tsc + esbuild + gerichte code-inspectie.

## 1. Security — GROEN, met 2 hardening-aanbevelingen

Geverifieerd en in orde:
- **Module-guard** (PAD_MODULE): uitgeschakelde module → GET redirect naar home, POST 403.
- **Beheer-gate**: aparte middleware met geverifieerde identiteit + beheerdersrol vóór alle /beheer-routes.
- **CRM**: rol-check op de hele sub-app (redirect/403) + ownership (`magMuteren`) op alle mutaties.
- **Verwijderen/herstellen**: alle delete-handlers checken `canEditOrDelete` + schrijven audit-log; `/api/herstel` checkt ownership per type (post/reactie/poll/agenda) vóór restore.
- **Security-headers/CSP** aanwezig (nosniff, DENY framing, CSP met form-action/base-uri 'self'). `unsafe-inline` is noodzakelijk door de inline scripts van de shell — bekend en geaccepteerd binnen Access-perimeter.
- **JSON-in-script** (beheerheader) escapet `<` correct; SPA-cachenaam gebruikt een server-constante.
- **raw()-inventarisatie**: vrijwel alle gevallen zijn statische SVG/script-literals; interpolaties zijn server-gegenereerde ids/paden.

Aanbevelingen (laag risico, alleen door beheerders te misbruiken — voorstel voor v179):
1. **"Externe link" (documenten)** wordt ongefilterd als `href` gebruikt (intranet.ts:342, zoek.ts:74). Een `javascript:`-URL is mogelijk. Fix: scheme-whitelist (alleen `http(s):`).
2. **Nieuws-cover op home** (home2.ts: `raw("…url('${n.cover}')…")`): bron is geëncodeerde key of Airtable-URL, maar een quote in de URL zou de stijl-attribuut kunnen breken. Fix: `n.cover.replace(/'/g, "%27")`.

## 2. Sanity / smoke — GROEN

- `tsc --noEmit`: 0 fouten; esbuild-bundel: groen (809 kB).
- CSS-accoladebalans van de volledige shell-stylesheet: 0 afwijkingen.
- Alle v17x-features aantoonbaar in de bundel (capsule, menu-token, versie-footers, FAB-fix, desktop-breedte).
- Scripts die naar verwijderde elementen verwijzen zijn null-guarded; geen runtime-breuk gevonden.
- Pariteit home ↔ shell gecontroleerd: kleuren/tokens, tabbar (tabs, iconen, geometrie, Meer + ballon), header (merk-chip, zoek, avatar incl. bron), menu-inhoud (zelfde nav-bron + rollen), thema-volgen, offsets (FAB/snackbar/ballon). **Bewust resterend verschil**: shell-tabbar toont nog geen badge-tellertjes (home wel) — kandidaat v179 via /api/badge.

## 3. Redundantie — opruimlijst (niet blokkerend, voorstel v179)

| Bestand | Dood sinds | Wat |
|---|---|---|
| views/layout.ts | v178 | collapse-script (`.navtoggle-grp`) + `.navsec.collapsed`/`.chev`-CSS |
| views/layout.ts | v178 | `side-head`-markup + `.side-title`/`.side-close`-CSS (verborgen, kan weg) |
| views/layout.ts | v175 | `.bn-ava`-CSS (avatar zat kort in de tabbar) |
| views/layout.ts | v175 | badge-script selector `.hmore` (element bestaat niet meer) |
| views/home2.ts | v175 | `.avatar`-CSS (Profiel-tab vervangen door Meer) |
| views/templates.ts | — | `skeletonList` ongebruikt (bibliotheek; bewust laten of opruimen) |
| views/loods.ts | — | `actionCard` nog niet gebruikt (bibliotheek; bedoeld voor ronde 5+) |

Dubbele dark-tokenblokken (media + data-theme) zijn bewust (handmatige themakeuze).

## 4. Voorstel v179 (opruim + rest)
1. Twee security-hardenings (zie §1).
2. Opruimlijst §3 doorvoeren.
3. Badges op de shell-tabbar (pariteit met home) — /api/badge uitbreiden met per-module-tellers.
4. Handoff-docs actualiseren (HANDOFF, PROJECT-CONTEXT-werkwijze incl. mount-gedrag, MODULE-SJABLOON + lds()-recept).
