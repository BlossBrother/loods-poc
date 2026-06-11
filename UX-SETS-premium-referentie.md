# UX-polish sets — premium feel & structuur (los te geven aan Cowork)

> Vier bij elkaar horende sets. Geef ze samen of los aan Cowork.
> SET 1 = micro-animaties (NU.nl-feel). SET 2 = intuïtieve gebaren (pull-to-refresh, swipe, haptiek). SET 3 = premium looks & visuele taal (diepte, tokens, typografie). SET 4 = informatie-architectuur & schermstructuur (navigatie, layout-templates, responsive).
> Belangrijk: looks + motion + feedback + structuur zijn ÉÉN systeem. Set 4 is de laag waar 1–3 bovenop rusten. Bouw alles als één designsysteem/componentbibliotheek, niet per scherm. Onderbouwd met UI/UX-literatuur 2026.

-----

## SET 1 — PREMIUM MICRO-ANIMATIES

> Concrete uitwerking van het micro-animatie-punt (blok Q / UX-schema E3) met exacte timings en easing, zodat Cowork het kan bouwen zonder gokken. Doel: de vloeiende, “dure” feel van premium nieuws-apps (NU.nl e.d.).
> Kernprincipe: animatie is functioneel (feedback, oriëntatie, statusverandering), nooit versiering. Als een animatie geen van die drie doet, weglaten.

## De gouden regels (timing & easing — dit maakt het verschil)

1. **Standaard timing-set vastleggen als design-tokens** (één keer, overal hergebruiken):

- Micro-feedback (knop-press, toggle, icoon): **100–200ms**.
- Standaard overgang (element verschijnt/verdwijnt, state change): **200–300ms**.
- Scherm-/contextovergang (lijst → detail): **250–300ms** (max ~400ms).
- Easing: **ease-out** voor binnenkomende elementen (start snel, remt af), **ease-in** voor verdwijnende, **ease-in-out** voor beweging tussen states van hetzelfde element. Nooit lineair — lineair voelt mechanisch.
- Leg deze als CSS-variabelen/tokens vast (`--dur-fast`, `--dur-base`, `--dur-screen`, `--ease-out`, etc.) zodat alles consistent is en in één keer bij te stellen.

## De patronen (NU.nl-achtig)

1. **Shared-element / lijst-naar-detail overgang** — tik je op een kaart in een lijst (bericht, event, training), dan groeit/schuift die kaart vloeiend door naar de detailweergave i.p.v. een harde sprong. Dit is dé “premium” beweger: het houdt context vast (de hersenen volgen het element). Toepassen op prikbord→bericht, agenda→event, trainingen→cursus.
1. **Gelaagde (staggered) entrance** — als een lijst of scherm laadt, verschijnen items net iets na elkaar (elk ~30–50ms later) met een korte fade+slide-up van ~8–12px. Geeft ritme en die “alles valt netjes op zijn plek”-feel i.p.v. alles ineens.
1. **Press-feedback met physics** — knoppen/kaarten “drukken in” bij tap (scale ~0.96, 120ms) en veren terug. Combineer met haptische feedback op mobiel waar mogelijk. Voelt als een echt object i.p.v. een vlak.
1. **Skeleton → content cross-fade** — skeletons (staan al op de UX-lijst) niet hard vervangen door content, maar een korte cross-fade (~200ms) als de data binnen is. Maakt het laadmoment vloeiend; verhoogt de waargenomen snelheid.
1. **State-overgangen animeren** — toggle die van uit→aan glijdt, een kaart die uitvouwt voor details, een item dat wegglijdt bij verwijderen (slide-out + collapse, ~250ms) i.p.v. abrupt verdwijnen. “Wegglijden” vertelt de gebruiker letterlijk “dit is weg”.
1. **Pull-to-refresh & scroll-polish** — vloeiende pull-to-refresh met een eigen animatie, en momentum/overscroll die natuurlijk aanvoelt. Klein, maar zeer kenmerkend voor de premium app-feel.
1. **Micro-reacties op interactie** — emoji-reactie die kort oppopt/bounce bij aantikken, een teller die soepel doortelt i.p.v. verspringt, een “verzonden”-vinkje dat intekent. Kleine bevestigingen die de app levend maken.
1. **Toegankelijkheid: respecteer “reduce motion”** — honoreer de systeeminstelling `prefers-reduced-motion`: voor wie dat aan heeft, animaties sterk inkorten/uitzetten. Premium betekent ook inclusief. Niet vergeten.

## Aanpak

> Bouw dit als één gedeelde animatielaag/componentbibliotheek (sluit aan op UX-schema E2), niet als losse effecten per scherm. Definieer de tokens (punt 103) eerst, pas daarna de patronen toe. Zo blijft het consistent, performant en in één keer bij te stellen — en schaalt het mee in het platformmodel (elke tenant krijgt dezelfde premium feel).
> Performance: animeer bij voorkeur alleen `transform` en `opacity` (GPU-vriendelijk), vermijd het animeren van layout-eigenschappen — anders wordt het juist schokkerig, wat het tegenovergestelde van premium is.

## ⭐ Prioritering — Set 1 (animaties)

1. **Timing-tokens (103)** — fundament; zonder dit blijft het inconsistent.
1. **Lijst-naar-detail overgang (104)** — grootste “wow”-impact, dé NU.nl-beweger.
1. **Staggered entrance (105)** + **press-feedback (106)** — overal merkbaar, relatief klein.
1. **Skeleton cross-fade (107)** + **state-overgangen (108)** — sluiten aan op bestaande UX-fundamenten.
1. **Pull-to-refresh (109)**, **micro-reacties (110)** — verfijning.
1. **reduce-motion (111)** — doe dit meteen mee, niet achteraf.

-----

## SET 2 — INTUÏTIEVE GEBAREN & SENSORISCHE FEEDBACK

> Aanvulling op de animatie-laag (ronde 9), nu gericht op intuïtieve touch-gebaren zoals omlaagtrekken-om-te-vernieuwen, met bredere onderbouwing uit mobiele UX-literatuur (2026).
> Twee ijzeren wetten die uit ALLE bronnen komen, leidend voor alles hieronder:
> 
> 1. **Een gebaar is een snelkoppeling, nooit een vereiste** — elk gebaar heeft een zichtbaar alternatief (knop/cue). Anders sluit je mensen met motorische beperkingen uit (WCAG/toegankelijkheid).
> 1. **Ontdekbaarheid**: “als de gebruiker niet weet dat een gebaar bestaat, bestaat het niet.” Hint gebaren op het moment dat ze relevant zijn, niet in een vooraf-tutorial.

## Onderbouwing in het kort (waarom dit ertoe doet)

- Onderzoek (aangehaald door Nielsen Norman via vakliteratuur) stelt dat een groeiende meerderheid van mobiele interacties gebaar-gedreven is i.p.v. knop-tik; gebruikers behandelen apps als “verlengstuk van hun handen”. Grote schermen duwen interactie naar de duim-zone (onderkant) — vandaar dat bottom-navigatie en duim-bereikbare gebaren beter werken dan top-knoppen.
- Het ontbreken van verwachte patronen (pull-to-refresh op feeds, swipe-to-delete) wordt expliciet genoemd als frictiepunt: gebruikers *verwachten* ze; afwezigheid voelt kapot.
- De verschuiving in 2026 is van losse gebaren naar **gebaren met feedback-lagen**: visueel + haptisch (+ soms geluid). “De haptische laag maakt van ‘ik hoop dat dit werkt’ → ‘ik voelde dat het werkte’.”

## De gebaren-set (geprioriteerd)

1. **Omlaagtrekken om te vernieuwen (pull-to-refresh)** — op alle content-feeds (prikbord/home, agenda-lijst, meldingen, trainingen). Premium-uitvoering: de beweging reageert op hóe ver je trekt (rubber-band/elastisch gevoel), met een merk-eigen indicator (in jouw kleur) i.p.v. de standaard spinner, en een korte haptische “tik” op het punt dat loslaten gaat verversen. Dit is de meest verwachte en meest intuïtieve — hoogste prioriteit. **(Hoofdpunt van deze ronde.)**
1. **Swipe-acties op lijstitems** — veeg een item voor de meest logische actie: op een melding/reactie swipe-to-delete of swipe-to-archive; op een taak swipe-to-complete. Met visuele onthulling (gekleurd vlak + icoon dat meegroeit) en een haptische “thump” bij het voltooien. **Verplicht: altijd ook een zichtbare knop voor dezelfde actie** (gebaar = versneller, niet de enige weg). Consistentie-regel: dezelfde veegrichting betekent overal hetzelfde (niet “verwijderen” op het ene scherm en “openen” op het andere).
1. **Swipe-to-go-back (terug-vegen)** — vanaf de schermrand terug naar de vorige weergave (detail → lijst). iOS-gebruikers hebben dit als spiergeheugen; het meeleveren voelt native. Combineer met de lijst-naar-detail-overgang uit ronde 9 zodat heen én terug vloeisch zijn.
1. **Long-press voor snelacties / context** — ingedrukt houden op een bericht/kaart toont extra opties (reageren, bewerken, verwijderen — leunt op de ownership-regel) of een emoji-reactiekiezer. Met haptische bevestiging bij het openen. Onthul dit contextueel (bv. de eerste keer een subtiele hint) i.p.v. verstoppen.
1. **Haptische feedback als ontwerpmiddel** — koppel korte, gekalibreerde trillingen aan betekenisvolle momenten: toggle aan/uit (lichte puls), grens bereikt (bump), verwijderen (distinct “thump”), succesvol verzonden (zachte tik). Subtiel en betekenisvol — niet bij elke tap. Dit is wat goedkoop “af” voelt vs. duur “levend”. Respecteer systeeminstellingen (sommige gebruikers zetten haptics uit).
1. **Multisensorische bevestiging van een geslaagd gebaar** — een geslaagd gebaar bevestig je met meer dan een schermverandering: visuele beweging + (optioneel zacht) geluid + haptiek samen. Dit “feedback-loopje” bouwt vertrouwen (“ik voelde het werken”). Vooral bij verwijderen/verzenden waardevol.
1. **Ontdekbaarheid + zichtbare alternatieven (overkoepelend, niet overslaan)** — bouw voor elk gebaar een zichtbare cue of knop. Hint gebaren *in context* op het moment dat ze nuttig zijn (zoals premium apps doen), niet in een lange vooraf-tutorial. Eventueel één korte, oversla-bare “zo werken de gebaren”-moment bij eerste gebruik (sluit aan op de eerste-login tour). Vervaag hints zodra de gebruiker het gebaar zelf gaat gebruiken.
1. **Duim-zone & tap-targets (foundation onder gebaren)** — plaats primaire acties in de duim-bereikbare onderzone; tap-targets minimaal ~44pt/48dp (anders “rage-taps” op buurelementen). Dit is de basis waarop gebaren prettig werken op de telefoon — relevant want jij en de werkvloer gebruiken het mobiel.

## Toegankelijkheid (hard vereiste, geen optie)

- Elk gebaar heeft een tap-/knop-alternatief (anders uitsluiting van motorisch beperkte gebruikers).
- Respecteer `prefers-reduced-motion` (animatiedeel) én haptiek-uit.
- Voldoende contrast (WCAG: 4.5:1 normale tekst) en schermlezer-labels op interactieve elementen — gebaren mogen schermlezers niet breken.

## ⭐ Prioritering — Set 2 (gebaren)

1. **Pull-to-refresh (112)** — meest verwacht en intuïtief; doe dit eerst, premium-uitvoering met haptiek.
1. **Swipe-acties op lijsten (113)** + **zichtbare alternatieven (118)** — hoge dagelijkse waarde; samen met de fallback-knoppen.
1. **Swipe-to-go-back (114)** — native gevoel, koppelt aan ronde 9-overgangen.
1. **Haptiek-laag (116)** — tilt de hele app naar “premium”; één keer goed opzetten, overal gebruiken.
1. **Long-press (115)** + **multisensorische bevestiging (117)** — verfijning.
1. **Duim-zone/tap-targets (119)** — foundation, meenemen bij de navigatie/layout.

> Aanpak: bouw gebaren + haptiek als herbruikbare laag (net als de animatie-tokens uit ronde 9). Houd de consistentie-regel heilig: één gebaar = één betekenis door de hele app. En bouw nooit een gebaar zonder zichtbaar alternatief — dat is zowel toegankelijkheid als ontdekbaarheid in één.

-----

## SET 3 — PREMIUM LOOKS & VISUELE TAAL

> De visuele laag die samenwerkt met de animaties (ronde 9) en gebaren/feedback (ronde 10). Onderbouwd met UI-literatuur 2026.
> Kernidee uit alle bronnen: premium = **diepte als functioneel signaal + terughoudendheid**. Looks, motion en feedback zijn één systeem, geen losse lagen. “Elegantie zit in de restraint, niet in het effect.”

## Hoe looks en motion/feedback samenwerken (het verbindende principe)

1. **Diepte/elevatie als één taal met de animaties** — een kaart die “boven de basislaag” ligt, krijgt schaduw + lichte schaal + (soms) blur. Dat is precies hetzelfde signaal dat je press-feedback (ronde 9, scale ~0.96) en je lijst-naar-detail-overgang gebruiken. Definieer **z-lagen** (Apple HIG-stijl: basis-content, verhoogde elementen, overlays) elk met vaste schaduwwaarden, hoekradius en gedrag. Zo “klopt” een element visueel met hoe het beweegt: verhoogd = werpt schaduw = drukt in bij tap = groeit door naar detail. Dit is dé reden dat premium apps “samenhangend” voelen.

## De visuele tokens (leg vast naast de motion-tokens uit ronde 9)

1. **Design-tokens voor de looks** — net als de timing-tokens: structureer kleur, witruimte, typografie, hoekradius en elevatie/schaduw als variabelen. Eén bron, overal hergebruikt, in één keer bij te stellen — en meteen per-tenant themabaar (verkoopbaar: elke klant zijn merkkleur zonder de rest aan te raken). Tokens zijn ook wat dark/light en high-contrast mogelijk maakt.

## De stijlrichting (passend bij jouw donkere, rustige app)

1. **“Soft/calm” als richting** — zachte gradiënten, gedempte schaduwen, subtiele textuur voor warmte en diepte zónder rommel. Gedempte neutralen + een paar accentkleuren (jouw groen/rood-merk) die rustig en bewust aanvoelen. Past bij je bestaande donkere thema en bij de trend weg van visuele drukte.
1. **Royale witruimte + duidelijke hiërarchie** — ruimte laten ademen; hiërarchie via grootte/gewicht/ruimte, niet via meer kleur of lijnen. Editorial/magazine-gevoel. Minder elementen, meer rust = oogt duurder.
1. **Sterke typografie als dragend element** — een doordachte typeschaal (duidelijke niveaus voor titel/sub/body/caption), genereuze regelafstand, en consistente NL-notatie. Typografie doet in 2026 actief werk in de hiërarchie, niet alleen “tekst tonen”. Dit alleen al tilt de waargenomen kwaliteit fors.
1. **Consistente hoekradius & iconen** — één radius-schaal (bv. klein voor knoppen, groter voor kaarten/sheets) en de uniforme icoonset (blok A). Consistentie hier is een groot deel van de “af”-indruk.

## Selectieve effecten (met mate — restraint is de regel)

1. **Glassmorphism, selectief** — frosted-glas/transparantie alleen voor lagen die het functioneel verdienen (overlays, de blurred bottom-tabbar die al in de huisstijl zit), nooit overal. Kritische tekst houdt hoog contrast; decoratieve lagen mogen subtiel transparant. “Verantwoorde glassmorphism” zoals iOS: nooit ten koste van leesbaarheid.
1. **Subtiele parallax/diepte bij scroll** — achtergrond iets trager dan voorgrond geeft ruimtegevoel. Spaarzaam inzetten (bv. een header-afbeelding van een bericht/oogstmoment), NIET op snelle taaklijsten of in de checkout-/bestelflow — daar telt snelheid boven sjeu.
1. **Elevatie strategisch inzetten** — schaduw/diepte niet overal, maar om het oog te leiden naar wat telt (een primaire CTA, een uitgelicht bericht). Diepte als wegwijzer, niet als decoratie.

## Toegankelijkheid is onderdeel van “premium” (geen aparte stap)

1. **Contrast & leesbaarheid bewaken** — diepte-/glaseffecten mogen contrast nooit breken: WCAG 4.5:1 voor normale tekst, 3:1 voor grote. High-contrast modus, dark/light, en `prefers-reduced-motion` ingebouwd vanaf het begin (niet achteraf). In 2026 is toegankelijkheid infrastructuur, geen feature — en het is in B2B-verkoop soms een eis.

## Aanpak

> Bouw de visuele tokens (121) samen met de motion-tokens (ronde 9) als één designsysteem-fundament in de componentbibliotheek. Elk component definieert dan in één keer: zijn rust-staat (looks), zijn beweging (motion) en zijn feedback (haptiek/animatie bij interactie). Dat drie-in-één is wat een interface “duur” en samenhangend maakt — en het schaalt per tenant (eigen merkkleur via tokens).
> Performance blijft leidend: mooie diepte mag niet schokkerig worden — zware blur/parallax spaarzaam en GPU-vriendelijk.

## ⭐ Prioritering — Set 3 (looks)

1. **Visuele tokens + z-lagen/elevatie (120, 121)** — het fundament dat looks aan motion knoopt; eerst doen.
1. **Typografie-schaal + witruimte/hiërarchie (123, 124)** — grootste “duur”-winst per uur, raakt elk scherm.
1. **Soft/calm richting + consistente radius/iconen (122, 125)** — samenhang en rust.
1. **Selectieve glassmorphism + strategische elevatie (126, 128)** — accenten, met mate.
1. **Parallax (127)** — verfijning, spaarzaam.
1. **Contrast/toegankelijkheid (129)** — vanaf het begin meebouwen, niet achteraf.

-----

## SET 4 — INFORMATIE-ARCHITECTUUR & SCHERMSTRUCTUUR

> De organisatie-laag waar Set 1–3 (looks/motion/gebaren) bovenop rusten. Gericht op het AANPASSEN van de al draaiende app, niet vanaf nul.
> Kernidee uit de literatuur: goede IA is “onzichtbaar” — alles “werkt gewoon” en de gebruiker voelt zich op instinct geleid. Een mooie animatie op een verkeerd ingedeeld scherm blijft een verkeerd ingedeeld scherm.

## Navigatie & diepte (harde regels uit onderzoek)

1. **Primaire acties ≤ 2 taps van home** — de kernfuncties (event aanmaken, melding doen, bestellen, training starten, prikbord) mogen maximaal twee taps van het startscherm liggen. Loop de huidige app na: wat kost nu meer dan 2 taps? Dat naar voren halen.
1. **Beperk de hoofdnavigatie tot ~4–6 items** — onderzoek (Baymard) toont dat ~46% van gebruikers vastloopt op complexe menu’s. Je uitklapbare groepen (blok L) helpen, maar houd het áántal hoofdingangen klein; de rest onder groepen of in “meer”. Niet 20 items zichtbaar.
1. **Duim-zone respecteren** — meest gebruikte acties + navigatie in de onderste schermhelft (waar de duim rust), niet bovenaan. Je hebt al een blurred bottom-tabbar in de huisstijl — benut die voor de echte kernfuncties. Zoek/profiel mogen boven, kernacties onder.
1. **Heldere hiërarchie via “nested doll” / stack-navigatie** — lijst → detail → sub-detail als een duidelijk hiërarchisch pad waar je makkelijk van terugkomt (sluit aan op swipe-to-go-back, Set 2, en de lijst→detail-overgang, Set 1). Houd diepte beperkt; bij 3+ niveaus oriëntatie toevoegen (titel/terug-context, evt. breadcrumb-achtige cue).

## Schermstructuur (consistente opbouw — leg dit als templates vast)

1. **Vaste anatomie per schermtype** — definieer een herbruikbaar stramien zodat elk scherm hetzelfde “skelet” heeft:

- **Lijst-scherm**: titel/koptekst → (optioneel filter/zoek) → lijst met consistente kaarten → primaire actie (bv. “+”) in de duim-zone. Lege/laad/foutstaat ingebouwd.
- **Detail-scherm**: terug-context bovenaan → hoofdinhoud → gerelateerde acties (bewerken/verwijderen volgens ownership-regel) → eventueel een tijdlijn/reacties onderaan.
- **Formulier-scherm**: één duidelijke taak per scherm, velden logisch gegroepeerd, primaire knop vast onderaan binnen duimbereik, inline validatie (Set 1).

> Eén `PageLayout`/`DetailLayout`/`FormLayout`-component zodat alle schermen consistent zijn en nieuwe modules automatisch “goed” staan. Sluit aan op de componentbibliotheek.

1. **Eén primaire actie per scherm** — maak visueel één ding de hoofdactie (de CTA, met de elevatie/accent uit Set 3). Secundaire acties ondergeschikt. Voorkomt “welke knop moet ik nu hebben”-verwarring.
1. **Content-prioritering** — het belangrijkste bovenaan en zichtbaar zonder scrollen; minder belangrijk eronder. Per scherm bewust kiezen wat de gebruiker hier 80% van de tijd komt doen, en dat vooropzetten.
1. **Consistente labels & iconen voor dezelfde dingen** — dezelfde actie heet overal hetzelfde en heeft hetzelfde icoon (sluit aan op de uniforme iconenset). “Verwijderen” is niet ergens anders “wissen”. Findability staat of valt hiermee.

## Responsief gedrag (de app draait óók in de browser/desktop)

1. **Adaptieve layout mobiel ↔ desktop** — leg vast hoe de zijbalk en content zich gedragen over schermmaten: op mobiel een drawer/bottom-nav, op desktop een vaste zijbalk + bredere contentkolom, met een doordacht tussengebied (tablet). Eén set breekpunten als tokens (sluit aan op de design-tokens uit Set 3). Voorkomt dat desktop “een uitgerekte telefoon” is.
1. **Maximale leesbreedte voor content** — tekstkolommen niet eindeloos breed op desktop; begrens voor leesbaarheid (editorial-gevoel, Set 3).

## Modulariteit (sluit aan op het platformmodel)

1. **Schermstructuur scheidt UI van logica/data** — modulaire opbouw zodat nieuwe modules/updates het bestaande niet verstoren, en zodat een module aan/uit (module-guard) netjes in/uit het stramien valt. Dit is ook wat de IA toekomstvast en multi-tenant-vriendelijk maakt.

## ⭐ Prioritering — Set 4 (structuur)

1. **Navigatie-audit (130, 131, 132)** — loop de draaiende app na: wat is >2 taps, staan kernacties in de duim-zone, is de hoofdnav niet te vol? Grootste directe winst.
1. **Layout-templates (134, 135)** — vaste anatomie per schermtype als componenten; maakt alles consistent en nieuwe modules vanzelf goed.
1. **Content-prioritering + consistente labels (136, 137)** — per scherm scherpstellen op de hoofdtaak.
1. **Responsief gedrag (138, 139)** — desktop fatsoenlijk laten meedoen.
1. **Hiërarchie/stack-navigatie (133)** + **modulariteit (140)** — borgt oriëntatie en toekomstvastheid.

> Aanpak voor de draaiende app: begin met de navigatie-audit (snel, hoog rendement), leg daarna de layout-templates vast en pas modules daar één voor één op aan. Zo migreer je de bestaande app naar een consistente structuur zonder alles tegelijk om te gooien.