# Handoff — t/m v209 (12 juni 2026, lees dit eerst in de nieuwe chat)

> **LIVEGANG: volgende week intern.** v209 = welkomsttour v2 (scrollbaar, iedereen
> ziet 'm 1×) + demo-verlof eruit (migratie 0022). Migraties draaien: 0020
> (kennisdump), 0021 (event_rsvp), 0022 (demo-verlof weg) — let op: 0005/0006
> waren botsende nummers en zijn redirect-comments geworden.

> Vervangt HANDOFF-RESTYLE-stand.md als startpunt. Details per ronde: CHANGELOG.md
> (v191–v208). Rapporten: RAPPORT-diepteonderzoek-user-succes-juni2026.md (markt/
> literatuur), RAPPORT-audit-live-vs-literatuur-12juni2026.md (live-audit),
> RAPPORT-HONK-stand-van-zaken.md (HONK-mapping), HONK-DEEP-POLISH-PERFORMANCE.md.

## Stand (wat er nu staat)
- **v208 klaar in de code.** PJ pusht/deployt zelf: `push` (script, doet tsc →
  commit → push) + `npm run deploy`. Migraties 0005 (kennisdump) en 0006
  (event_rsvp) moeten éénmalig op de live D1 (commando's in CHANGELOG v202/v205).
- **Home in de shell (v199)** — terug-naar-home = SPA-swap, stotteren structureel
  opgelost. Home-feel behouden (greeting-hero, chips, vandaag-kaart, .hm-scope).
- **AI-assistent (v200–v206)**: sparkle linksboven = dé zoek-ingang (vergrootglas
  weg). Keten: intern FTS → kennisbank-RAG (bronnen) → webzoek Tavily (bronnen,
  "Van het web") → algemene kennis (gelabeld). TAVILY_API_KEY staat als secret.
- **Kennisdump (v202)**: Beheer → Kennisdump — PDF/Word/foto droppen → toMarkdown
  → AI-categorisatie → kennisbank → direct vindbaar. Default intern; klant-
  zichtbaar alleen via expliciete knop (AI suggereert, ✦).
- **Verwijder-cascades (v203/v205)**: event/nieuws verwijderen ruimt notificaties
  + kb-index op; notificaties zelf wisbaar (✕ / alles).
- **Ochtendflow (v204)**: push 08:15 ma-vr "Waar werk je vandaag?" (alleen wie nog
  niets invulde, opt-out via prefs 'team') + one-tap-vraag in de vandaag-kaart.
  Aanwezigheid = "Vandaag"-chip bovenin (v205); WK-poule-chip mag na het WK weg.
- **RSVP (v205)**: Ja/Nee + teller + namen op event-detail (BBQ 3/7).
- **Analytics (v206)**: Beheer → Analytics — actief week/dag, assistent-vragen,
  ochtendvraag-respons, prikbord, leesregistraties + dagstaafjes + module-bereik.
- **Leesbevestiging (v194)**: knop default UIT (vlag lees_knop); stille
  gezien-registratie zichtbaar in Beheer → Leesbevestiging.
- v207/v208: chips alleen horizontaal scrollbaar; appgrid-tegels min 13.5rem.

## WERKWIJZE nieuwe sessie (kritiek)
- **Bestanden ALLEEN via file-tools** (Read/Edit/Write, Windows-pad). De bash-mount
  toont bestanden die in de sessie groeien AFGEKAPT — nooit via bash
  schrijven/committen; git doet PJ zelf (`push`-script). Verificatie: tsc bij PJ.
- Per ronde: BUILD + CACHE (+1) bumpen in src/pwa.ts + CHANGELOG-entry bovenaan.
- home2.ts (.hm) en layout.ts synchroon houden bij stijl/VT-wijzigingen.

## Volgende stappen (voorstel, op volgorde)
1. **Eerst valideren na deploy v208**: regressie-flow (Agenda↔Home×3↔Prikbord↔
   Meldingen), kassen-vraag aan assistent (hoort web-antwoord met bronnen te
   geven), Kennisdump-test met 1 rassen-PDF, ochtendpush morgen 08:15,
   RSVP op de BBQ, Analytics-tegel.
2. **Kennisdump vullen** (PJ, geen code): rassen-docs/nieuwsbrieven erin — dit
   maakt de assistent pas écht indrukwekkend, ook richting klantenportaal.
3. **Pulse-surveys (ronde C, M)** — laatste grote table-stake. 2026-parameters:
   maandelijks, anoniem by design, drempel ≥5 respondenten vóór tonen, vraag als
   kaart ín de home-feed (Workvivo-patroon), "you said, we did"-terugkoppeling.
4. **Onboarding-journeys** (dag 1/week 1/maand 1-checklist; seizoenskrachten) en
   daarna formulieren/checklists (HACCP) — bouwt op meldingen-module.
5. **Adoptie-acties zonder code** (PJ): content-ritme ≥2 nieuws/week, toernooi
   seeden, AVG-gedragsafspraak agenda-items ("Uitslag GGZ"-incident, audit §4).
6. **Besluiten/klein**: WK-poule-chip verwijderen na de finale; "Moggel"-groet
   checken in Beheer → Header (is D1-data); chat = bewust niet (PoC);
   rooster/loonstrook-integratie verkennen (welk HR-pakket draait FF?);
   nieuws-targeting per afdeling (teamleiders, Gallagher).
7. **Loods/platform-spoor + HONK fase 0** (Lighthouse-baseline op PJ's machine)
   zodra de PoC-featureset rust heeft. Prijsanker Oneteam €1,49–3,99 verwerken
   in businessplan.

## Open issues (klein)
- Access-sync e2e testen bij eerste echte uitzendkracht (stond al open).
- Ziekteverlof-maskering: huidige default toont alleen "afwezig" — HR-besluit
  formeel afronden.
- Shotcaller-voicepack (optie, zie HANDOFF-RESTYLE-stand §A1).
