# Diepteonderzoek — wat ontbreekt nog voor user-succes? (11 juni 2026)

> Gap-analyse t/m v190: (1) features vs. de markt voor deskless/frontline-apps,
> (2) dashboard/home, (3) layout/kleur/interactie vs. literatuur en premium apps.
> Bronnen: webresearch juni 2026 (Speakap, Oneteam, Flip, Beekeeper, Staffbase,
> Workvivo, Connecteam, Haiilo/Sociabble; M3 Expressive, iOS 26 Liquid Glass,
> WCAG 2.2, NN/g e.a.) + eigen code/docs. URL's onderaan.

## 0. Samenvatting

We zitten met de PoC **vóór op de markt** op punten waar concurrenten nog mee
worstelen (AI-zoeken/RAG over documenten, leesbevestiging, vertaling, kantine,
competitie/gamification, noodmodule) en het designsysteem (v189) zit vrijwel
volledig op best practice. De echte gaten zitten in vier **table-stakes
features** die élke concurrent heeft (chat, pulse-surveys, onboarding-journeys,
formulieren/checklists), twee **dagelijkse-gewoonte-haakjes** (rooster- en
loonstrook-inzage, beide integratieplays) en het **analytics-dashboard** (wat
de kóper overal verwacht). Op UI-vlak resteert polish: motion-tokens/View
Transitions, optimistic UI, touch-targets, empty states.

## 1. Waar we al sterk staan (niet aan tornen)

- **AI-document-Q&A (RAG)**: concurrenten zijn dit in 2025/26 pas aan het
  toevoegen ("Buddy" bij Oneteam, "AI answers" bij Staffbase enterprise-tier).
  Wij hebben het al — uniek op dit prijspunt.
- **Leesbevestiging** = Speakaps "news with acknowledgement" (Basic-tier): af.
- **Vertaling, push, events, smoelenboek, polls, shout-outs, /vandaag**: alle
  aanwezig; dekt de comms-laag van Speakap Basic vrijwel volledig.
- **Kantine-bestellen en darts/competitie** heeft níémand native — echte
  differentiators voor de werkvloer ("selfish use case" die adoptie drijft).
- Designsysteem: OKLCH-ramps, ontzadigd dark-accent, surface-ladder,
  key+ambient-schaduwen, skeletons, capsule-tabbar — allemaal bevestigd door
  M3 Expressive én iOS 26 Liquid Glass (zwevende glas-tabbar is nu hét patroon).

## 2. Feature-gaps t.o.v. de markt

### 2a. Table stakes (élke concurrent heeft dit)

| Gap | Bewijs | Inschatting voor ons |
|---|---|---|
| **Chat / DM (1:1 + groep)** | 9/9 platforms; hét "WhatsApp-vervanger"-adoptiehaakje | Grootste bouwwerk (realtime, AVG, moderatie). **Besluit nodig**: bouwen, of bewust laten (WhatsApp bestaat) en positioneren als "wij vervangen niet je chat". Voor de PoC (47 man) twijfelachtig nut; voor Loods-SaaS verkoopbaar gemis. |
| **Pulse-surveys / eNPS (anoniem)** | Overal; Workvivo injecteert de vraag ín de feed — dat lift respons | **M**. Onze polls zijn géén vervanging (niet anoniem, geen reeksen). Eén pulse-kaartje in de foryou-feed + anonieme opslag + beheer-trend. Sluit aan op "51% frontline voelt zich niet gewaardeerd" (MS Work Trend Index). |
| **Onboarding-journeys** | Speakap Premium+ (betaalde add-on!), Oneteam-kernmodule | **M**. Gefaseerde checklist voor nieuwe/seizoenscollega's (dag 1, week 1, maand 1) met taken + leesbevestigingen. Hoog relevant voor agri/food met seizoenskrachten; sterk Loods-verkoopargument. |
| **Formulieren / checklists** (met routing, handtekening, status) | Oneteam, Beekeeper, Connecteam, Flip — ops-platforms maken er de moat van | **M–L**. Onze meldingen-module is het embryo. HACCP-/schoonmaak-/veiligheidschecklists passen exact bij de doelgroep. |
| **Analytics-dashboard (beheer)** | Overal; verkocht aan de admin/kóper, niet de gebruiker | **M**. Events-tabel bestaat al; alleen de geaggregeerde, privacyvriendelijke view bouwen. Stond al op onze roadmap (#4). |

### 2b. Gewoonte-haakjes (hoogfrequent "selfish" gebruik)

- **Mijn rooster (read-only)** en **loonstrook-inzage**: Flip en Beekeeper
  crediteren hun adoptie expliciet hieraan. Vergt integratie (NL: AFAS, Nmbrs,
  Loket, L1NDA/Shiftbase). Voor de PoC: check wat Fresh Forward gebruikt;
  zelfs een simpele rooster-weergave naast /vandaag is goud. Voor Loods:
  integratie-marktplaats stond al op Q2'27 — overwegen te vervroegen.
- **Quizzen/micro-training** op de bestaande trainingen-module (BHV-herhaling,
  voedselveiligheid): Oneteam-kern, kleine stap voor ons (**M**).

### 2c. Adoptie-lessen uit de research (voor PoC én Loods)

1. **Persoonlijk nut verslaat communicatie** — mensen komen dagelijks terug
   voor hún rooster/loonstrook/taken; nieuws lift mee.
2. **Geen zakelijk e-mailadres = adoptiemuur**: Toolstation bereikte eerst 20%,
   na e-mailloze onboarding 90%+ (Oneteam-case). Onze M365-SSO + Access-OTP
   voor uitzendkrachten dekt dit, maar **test het end-to-end** (stond al open).
3. **Gemiddelde intranetsessie ≈ 6 min/dag** (SWOOP): ontwerp voor blikken van
   30 seconden — home is daarvoor al goed ingericht.
4. **Teamleiders zijn het vertrouwde kanaal** (Gallagher 2025): geef
   leidinggevenden eigen post-/targetingrechten per afdeling — onze
   Redacteur-rol is er bijna; afdelings-targeting van nieuws/push ontbreekt nog.
5. **Benchmark**: >80% activatie en >50% wekelijks actief is "goed". Wij zitten
   op 86% wekelijks actief — boven de markt; bewaken, niet repareren.
6. **Prijsanker NL**: Oneteam publiceert €1,49/€2,99/€3,99 p/u/mnd (min. 100
   users). Loods-prijzen (€3/€4,50/€6) liggen daarboven — verdedigbaar met
   AI + kantine + competitie, maar het businessplan moet dit adresseren.

## 3. Dashboard (home) — wat er nog kan

Home is feed-first met vandaag-kaart en snel-naar-tegels: dat ís het juiste
patroon (Beekeeper/Flip-school; zware widget-dashboards schaden frontline-
bruikbaarheid). Verfijningen, op volgorde van impact:

1. **Must-read-banner**: ongelezen beleid/nieuws-met-leesbevestiging als vaste
   bovenste kaart tot bevestigd ("1 document wacht op je bevestiging").
2. **Pulse-kaart ín de feed** (zodra surveys bestaan) — Workvivo-patroon, geen
   apart scherm.
3. **"Vandaag"-framing versterken**: vandaag-kaart promoveren tot vaste kop
   (datum/dienst + wie afwezig + kantine-deadline + events vandaag) — Headspace
   "Today"-patroon; tijd-van-de-dag-relevantie.
4. **Snel-naar personaliseren**: pinbaar door de gebruiker en/of op gebruik
   gesorteerd (eigenaarschap > algoritme, blijkt uit de literatuur).
5. **Kantine-deadline-kaart** op bestel-dagen ("Bestellen kan nog tot 10:30").

## 4. Layout / kleur / interactie / interface — restpunten

Al op best practice (laten staan): OKLCH, surface-ladder, ontzadigde
dark-accenten, key+ambient, skeletons, capsule-bar met 5 items + labels, geen
FAB, desktop-zijbalk op 1500px.

Verbeterlijst, geprioriteerd:

1. **Motion-tokens met springs** (S–M): twee presets — "spatial" (mag
   overshooten: sheets, ballon, kaarten) en "effects" (nooit overshoot: kleur/
   opacity) — via CSS `linear()`. M3 Expressive-onderzoek (46 studies, 18k
   deelnemers): elementen tot 4× sneller gevonden, grootste winst bij 45+.
   Relevant voor onze gemengde leeftijden op de werkvloer.
2. **View Transitions API** (S): sinds okt 2025 Baseline in alle browsers —
   native paginatransities voor onze SPA-navigatie, bijna gratis premium-gevoel.
   Mét `prefers-reduced-motion`-fallback (opacity-only) — geldt voor álle motion.
3. **Optimistic UI** (S–M): likes/reacties/Gelezen/RSVP direct tonen, server
   reconciliet bij fout. Check wat al optimistic is; maak het consequent.
4. **Touch-target-audit** (S): 48px voor primaire controls (handschoenen!);
   WCAG 2.2 minimum is 24px maar dat is te krap voor onze doelgroep. Let op
   de glas-capsule (hit-areas krimpen daar snel) en dichte lijstkaarten.
5. **Dark-contrast per surface-trede** (S): contrast checken op --surface-3/
   --card-hi apart van --card; geen puur-wit-op-puur-zwart (halatie).
6. **Empty states ontwerpen** (S): elke lege lijst/feed = uitleg + één CTA,
   geen dood scherm. Conversiemoment, zeker voor nieuwe gebruikers.
7. **Badge-hygiëne vastleggen** (S): cijfers alléén voor actie-vereist
   (meldingen, must-reads); dot voor "nieuw"; nooit badgen op marketing/nieuws.
8. **Tabbar minimize-on-scroll** (S): iOS 26-patroon — capsule krimpt bij
   scrollen, meer content zichtbaar.
9. **Eerste-gebruik**: contextuele tooltips + checklist i.p.v. een tour (als we
   onboarding-journeys bouwen, lift dit mee).
10. **Typografie** (optioneel, S): variabele font (één file, optical sizing) +
    `clamp()`-fluid type scale.
11. **Géén streaks** voor medewerkers — de ethiek-literatuur is eenduidig
    (verplichtingsangst, toxische competitie). Voortgangs-framing (checklist
    x/y af) wél; darts-leaderboard is opt-in spel en kan blijven.

## 5. Voorstel: volgorde voor we verder gaan

**Ronde A — UI-polish (1 sessie, alles S/M):** motion-tokens + View
Transitions + reduced-motion, optimistic UI, touch-targets, empty states,
badge-policy, minimize-on-scroll. Maakt v190 af tot "premium zonder restjes".

**Ronde B — Must-read-banner + vandaag-kop op home (S–M):** hoogste
home-impact, bouwt op bestaande leesbevestiging en /vandaag.

**Ronde C — Pulse-surveys (M):** anoniem, kaartje in de feed, beheer-trend.
Grootste features-gat dat we zónder integraties kunnen dichten.

**Ronde D — Analytics-dashboard beheer (M):** events-tabel → geaggregeerd
dashboard. Table stakes voor de Loods-koper; meet meteen het effect van A–C.

**Ronde E — Checklists/formulieren (M–L):** HACCP/schoonmaak/veiligheid;
opstap naar onboarding-journeys (F).

**Besluiten (geen bouwwerk nu):** chat ja/nee (advies: niet voor de PoC,
roadmap-item voor Loods); rooster/loonstrook-integratie verkennen (welk
HR-pakket draait FF?); afdelings-targeting voor teamleiders; Oneteam-prijsanker
in het Loods-businessplan verwerken.

## 6. Bronnen (selectie)

- Speakap pricing/features: https://www.speakap.com/pricing
- Oneteam pricing/modules: https://www.oneteam.io/en/pricing
- Flip (adoptie-claims): https://www.getflip.com/blog/frontline-app/
- Beekeeper: https://www.beekeeper.io/platform/employee-app/
- Staffbase: https://staffbase.com/employee-app · Workvivo: https://www.workvivo.com/product/
- Vergelijking (derde partij): https://www.jasp.eu/en/magazine/employee-app-comparison-2026/
- Gallagher State of the Sector 2025: https://www.ajg.com/employeeexperience/state-of-the-sector/
- Microsoft Work Trend Index frontline: https://www.microsoft.com/en-us/worklab/work-trend-index/technology-unlocks-a-new-future-for-frontline
- SWOOP 6-min-stat: https://www.breakroomapp.com/blog/desktop-employee-platform-low-mobile-adoption-rate
- M3 Expressive (onderzoek): https://design.google/library/expressive-material-design-google-research · motion: https://m3.material.io/styles/motion/overview/how-it-works
- iOS 26 Liquid Glass tabbars: https://www.donnywals.com/exploring-tab-bars-on-ios-26-with-liquid-glass/
- View Transitions API (Baseline): https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- WCAG 2.2 target size: https://testparty.ai/blog/wcag-target-size-guide
- Skeleton-onderzoek: https://www.researchgate.net/publication/326858669
- Streak-ethiek: https://thedecisionlab.com/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification
- Tabbar/nav: https://www.nngroup.com/articles/find-navigation-mobile-even-hamburger/
- Empty states: https://www.pencilandpaper.io/articles/empty-states
- M3 tone-based surfaces: https://m3.material.io/blog/tone-based-surface-color-m3
