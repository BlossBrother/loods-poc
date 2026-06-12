# Audit — live app vs. literatuur & onderzoek (12 juni 2026, hertoetst op v199)

> Live meegekeken via Chrome (ingelogde sessie) op home, prikbord, agenda, kantine,
> competitie, trainingen, meldingen, nieuws, mijn-account, notificaties, /vandaag en
> beheer. Daarnaast verse literatuur-spotchecks (juni 2026) bovenop het
> diepteonderzoek van 11 juni (`RAPPORT-diepteonderzoek-user-succes-juni2026.md`).
> Eerste ronde op v197; dezelfde dag hertoetst op **v199** (zie §0).
> Conclusie vooraf: **de UI/UX voldoet vrijwel volledig aan de literatuur; de
> resterende gaps zitten in 4 feature-table-stakes, home-personalisatie en — het
> belangrijkst voor "veel gebruikt" — content & gewoontevorming.**

## 0. Hertoets op v199 (zelfde dag, na deploy)

**Wat v199 live oplost — bevestigd:**
- Footer toont **v199**; de deploy-kanttekening uit de eerste ronde vervalt.
- **Home draait nu in de shell.** Marker-test (window-variabele overleeft
  navigatie): /social → home → /agenda zijn échte SPA-content-swaps, geen
  herlaad. Het structurele stotter-probleem (home was los document) is daarmee
  verholpen — precies het HONK-doel "premium gevoel zonder restjes".
- Begroeting-hero, chips, actiekaart, nieuws-cover, snel-naar en push-kaart
  staan 1-op-1 in de shell-home; zijbalk/capsule komen overal uit dezelfde bron.

**Nieuw puntje (klein, S):** bij snelle opeenvolgende SPA-wissels logt de console
`InvalidStateError: Transition was aborted because of invalid state` (2× gezien,
op /social en /). Onschuldig — de swap valt terug op direct renderen — maar
onafgevangen. Advies: `try/catch` (of `.skipTransition()`-pad) rond
`startViewTransition` en de fout stil negeren; hoort bij badge-/console-hygiëne.
Overige console-fouten waren extensie-ruis, niet de app.

**Wat onveranderd blijft na v199** (alle inhoudelijke gaps uit §2): geen
analytics in Beheer (tegel ontbreekt nog), meldingen-empty-state nog zonder CTA,
prikbord nog 1 bericht, geen vandaag-info (afwezigen/events) op home — de
"vandaag-rail" toont vandaag niets terwijl /vandaag 5 afwezigen kent. Pulse,
onboarding, checklists, RSVP, afdelings-targeting: status gelijk. De
geadviseerde volgorde in §5 geldt dus onverkort, minus de deploy-stap.

## 1. Wat live klopt met de literatuur (bevestigd op v197)

| Eis uit literatuur | Live gezien |
|---|---|
| Must-read/actie-banner bovenaan home | ✓ "Alles is bij / geen acties die op je wachten" + done-state |
| Leesbevestiging + beheer-overzicht | ✓ Beheer → Leesbevestiging |
| Emoji-reacties + reacties op nieuws/prikbord | ✓ incl. welkomstpost |
| Polls | ✓ "Maak hier een peiling van" in prikbord-composer |
| Shout-outs (peer recognition — trend 2026 bevestigd) | ✓ ontvanger-dropdown met alle 43 collega's |
| Auto-vertaling naar voorkeurstaal | ✓ 12 talen in Mijn account — uniek vs. concurrenten |
| /vandaag met afwezigen (Buddee-verlof) | ✓ toont vakantie per afdeling |
| Push opt-in prompt + notificatiecentrum | ✓ home-kaart "Meldingen aanzetten" + /notificaties |
| Empty states met uitleg + CTA | ✓ agenda, competitie ("Start er een met de teller"), kantine-gesloten-banner; nette 404 |
| Geen streaks/dwingende gamification (ethiek-literatuur) | ✓ alleen opt-in competitie |
| Capsule-tabbar, View Transitions, haptics, skeletons, motion-tokens | ✓ per HONK-stand v191–v197 (desktop bevestigd; mobiel uit code) |
| Audit-log, ownership, module-guards | ✓ Beheer → Audit-log + CSV |

Benchmark: eigen 86% wekelijks actief zit boven de markt (>80% activatie / >50%
wekelijks = "goed"; moderne frontline-platforms halen 80–90% adoptie). Bewaken.

## 2. Gaps — wat nog niet aan de literatuur voldoet

### A. Doorslaggevend voor "veel gebruikt": gebruik & content, niet UI
Live valt op: prikbord heeft **1 bericht** (de welkomstpost), competitie **"Nog geen
potjes"**, 2 cursussen, BBQ-nieuws vraagt RSVP "via het prikbord". De literatuur is
hier eenduidig: persoonlijk nut + content-cadans + teamleiders als kanaal bepalen
adoptie — niet extra features. Concreet:
1. **Content-ritme afspreken**: ≥2 nieuwsitems/week, teamleiders laten posten
   (afdelings-targeting ontbreekt nog — zie B5).
2. **Competitie aanjagen**: lunchtoernooi + eerste potjes seeden; lege ranglijst
   nodigt niet uit.
3. **RSVP op events** (S): "Ben je erbij? Ja/Nee" op agenda-event/nieuws i.p.v.
   prikbord-reacties — direct nut voor de BBQ van 3 juli, hoge fun-waarde.

### B. Feature-table-stakes (élke concurrent heeft ze; volgorde = advies)
1. **Pulse-surveys/eNPS, anoniem** — polls zijn géén vervanging. Verse check 2026:
   maandelijks is de veilige cadans, anonimiteit **by design** met
   minimum-groepsgrootte ≥5 vóór tonen, vraag ín de feed (Workvivo-patroon).
2. **Analytics-dashboard beheer** — `/beheer/analytics` = 404, niets in Beheer.
   Events-tabel bestaat al; geaggregeerd + privacyvriendelijk is genoeg.
3. **Onboarding-journeys** (dag 1/week 1/maand 1-checklist) — relevant voor
   seizoenskrachten; contextuele tooltips i.p.v. de eenmalige tour kan meeliften.
4. **Formulieren/checklists** (HACCP/schoonmaak/veiligheid) — meldingen-module is
   het embryo; ops-platforms maken hier hun moat van.
5. **Afdelings-targeting** voor nieuws/push (teamleiders = vertrouwde kanaal,
   Gallagher 2025) — Beheer kent alleen tenant-brede push.

### C. Home-personalisatie (grootste driver van dagelijkse terugkeer — bevestigd 2026)
1. **Vandaag-kop op home**: datum + wie afwezig (staat al op /vandaag!) + events
   vandaag + kantine-deadline. Nu staat die info een klik verder.
2. **Kantine-deadline-kaart** op besteldagen ("Bestellen kan nog tot 10:30") —
   kon ik niet verifiëren (lijst was dicht); zo niet aanwezig: bouwen (S).
3. **Snel-naar pinbaar/op gebruik** — nu statisch; eigenaarschap > algoritme.

### D. UI-restpunten (uit HONK-stand, klein)
Optimistic UI dekkend maken (bestellen/RSVP/gelezen + rollback-toast),
badge-beleid audit, afbeelding-dimensies/lazy/fetchpriority, R2-thumbnails,
meldingen-empty-state mist een CTA ("Geen openstaande meldingen." is een dood
eind), en de meetpunten die jouw machine vergen: Lighthouse-baseline + RUM.

## 3. Verse literatuur-spotchecks (verandert het beeld van 11 juni niet, scherpt aan)

- **NN/g Intranet Design Annual is gestopt** (laatste editie 2023) — niet meer als
  jaarlijks kompas gebruiken; NN/g-artikelen blijven wel geldig voor nav/IA.
- **Personalisatie** wordt in 2026-bronnen expliciet "de grootste driver van
  dagelijkse terugkeer" → onderbouwt C1–C3 als hoogste home-prioriteit.
- **Pulse-best-practice 2026**: maandelijks, kort, anonimiteit by design,
  drempel ≥5 respondenten, resultaten terugkoppelen ("you said, we did").
- **Peer-recognition/shout-outs** bevestigd als top-trend 2026 → ons shout-out-blok
  evt. promoten op home (toggle bestaat al, staat default uit).
- **Adoptie-benchmarks 2026**: moderne mobile-first platforms 80–90%; legacy
  30–40%. Wij: 86% wekelijks — vasthouden via A.

## 4. Kanttekeningen (geen literatuur, wel belangrijk)

- ~~v198 is nog niet live~~ → **opgelost: v199 staat live** (zie §0).
- **AVG-hygiëne gedeelde agenda**: er staat een medisch getint event in
  ("Uitslag GGZ + SOA test", 15-06) dat via push/notificaties bij iedereen komt.
  Vermoedelijk geintje, maar: maak een gedragsafspraak en/of voeg een
  "privé/niet-pushen"-event-type toe.
- Schermopname-freeze die ik 1× zag op /social was extensie-ruis, geen app-fout
  (DOM en console van de app waren schoon).

## 5. Geadviseerde volgorde

1. **Console-hygiëne**: View-Transition-catch (§0) + meldingen-empty-state-CTA (minuten).
2. **Ronde B-rest**: vandaag-kop op home + kantine-deadline-kaart + RSVP (S–M).
3. **Ronde C: pulse-surveys** met de 2026-parameters hierboven (M).
4. **Ronde D: analytics-dashboard** (M) — meet meteen het effect van 1–3.
5. **Adoptie-acties (geen code)**: content-ritme, toernooi-seed, teamleiders.
6. Daarna: onboarding-journeys → checklists; besluiten over chat (advies blijft:
   niet voor PoC) en rooster/loonstrook-integratie (welk HR-pakket draait FF?).

## 6. Bronnen (aanvullend op 11-juni-rapport)

- NN/g annual-status: https://www.nngroup.com/reports/past-intranet-design-annuals/
- Adoptie-benchmarks: https://www.mangoapps.com/articles/top-25-intranet-platforms-frontline-desk-workers · https://staffbase.com/blog/employee-app-adoption-frontline-workers
- Pulse 2026: https://culturequest.io/blog/pulse-surveys-in-2026-the-complete-guide · https://www.contactmonkey.com/blog/pulse-survey · https://www.vantagecircle.com/en/blog/pulse-surveys/
- Personalisatie/home: https://www.lumapps.com/insights/blog/intranet-design · https://www.happeo.com/blog/intranet-employee-portal
- Recognition-trends 2026: https://www.vantagecircle.com/en/blog/trends-in-employee-recognition/
