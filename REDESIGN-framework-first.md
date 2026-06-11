# Redesign-document — framework-first: UI/UX & structuur als fundament

> Strategie en uitvoering voor een redesign van het draaiende platform. Kernkeuze: bouw EERST het complete UI/UX-framework en de structuur (het “skelet”), en herplaats DAARNA de bestaande, werkende inhoud daarop — in plaats van de huidige app stuk voor stuk op te lappen.
> Hoort bij de vier UX-sets (animaties, gebaren, looks, structuur) en de bredere planning.

-----

## 1. Waarom framework-first (en niet stapsgewijs patchen)

De app draait en de inhoud werkt — competitie, agenda, kantine, prikbord, trainingen, meldingen. De verleiding is om de verbeterpunten (premium looks, animaties, gebaren, betere indeling) er één voor één in te schuiven. Toch is dat hier de verkeerde volgorde. Redenen:

- **Consistentie ontstaat alleen als het fundament er eerst is.** Als je losse schermen oplapt, krijg je een lappendeken: het ene scherm heeft de nieuwe look, het andere nog niet. Een gedeeld framework (tokens, componenten, layout-templates) dwingt consistentie af — elk scherm dat je erop zet is automatisch goed.
- **De vier lagen zijn één systeem, geen losse toevoegingen.** Looks, motion, feedback en structuur versterken elkaar (een verhoogd element werpt schaduw én drukt in bij tap én groeit door naar detail). Dat samenspel kun je niet per scherm na-bouwen; het moet in de basislaag zitten.
- **Eén keer goed bouwen is goedkoper dan tien keer aanpassen.** Een component (knop, kaart, lijst, formulier) die je één keer correct maakt — met zijn rust-staat, beweging en feedback — hoef je daarna alleen nog te vullen. Patchen betekent telkens opnieuw dezelfde beslissingen nemen, vaak inconsistent.
- **Het is de basis van het verkoopbare platform.** Een token-gebaseerd designsysteem is precies wat per-tenant theming (merkkleur per klant) mogelijk maakt. Patchwork schaalt niet naar meerdere klanten; een framework wel.
- **De inhoud is al bewezen.** Je hoeft de functionaliteit niet opnieuw uit te vinden — die werkt. Het risico van een redesign (functionaliteit kwijtraken) is dus laag: je verplaatst werkende inhoud naar een betere structuur, je herbouwt hem niet.

> Kort: de inhoud is af, het fundament niet. Bouw het fundament, herplaats de inhoud. Dat is sneller, consistenter en toekomstvast.

-----

## 2. De omkering in één beeld

**Nu (gegroeid):** inhoud eerst gebouwd → look/structuur per scherm verschillend → verbeteringen los erin patchen.

**Redesign (framework-first):**

```
Laag 0  Designsysteem-fundament   →  tokens (kleur, ruimte, type, radius, elevatie, motion-timing)
Laag 1  Componentbibliotheek      →  knoppen, kaarten, lijsten, formulieren, modals, toasts —
                                      elk mét rust-staat (looks) + beweging (motion) + feedback (haptiek)
Laag 2  Layout-templates          →  PageLayout / DetailLayout / FormLayout + navigatie/structuur (Set 4)
Laag 3  Interactiepatronen        →  gebaren (pull-to-refresh, swipe, long-press) + overgangen (Set 1+2)
─────────────────────────────────────────────────────────────────
Laag 4  Bestaande INHOUD          →  competitie, agenda, kantine, prikbord, trainingen, meldingen, ...
                                      wordt op het framework HERPLAATST, niet herbouwd
```

Laag 0–3 = het skelet (de vier UX-sets). Laag 4 = wat al draait, opnieuw ingehangen.

-----

## 3. Wat er behouden blijft (belangrijk: dit is geen herbouw)

- **Alle functionaliteit** blijft: dezelfde features, dezelfde logica, dezelfde data (D1/R2), dezelfde auth (Entra).
- **De backend/Workers-logica** verandert niet of nauwelijks — dit is primair een front-end/structuur-redesign.
- **De inhoud/teksten** blijven; ze krijgen alleen een consistente plek en vorm.

> Het redesign raakt hóe het eruitziet en is ingedeeld, niet wát het doet. Daardoor is het risico beheersbaar en kun je per module migreren.

-----

## 4. Uitvoering in fases (veilig, naast de draaiende app)

> Sleutel: bouw het nieuwe framework naast de bestaande app (bv. in de testomgeving / een nieuwe route of branch), migreer module voor module, en zet pas live als een module op het nieuwe framework af is. Nooit alles tegelijk omgooien.

### Fase 0 — Designsysteem-fundament (Laag 0)

Definieer alle tokens als één bron: kleur (incl. merkaccenten + dark/light), witruimte-schaal, typografie-schaal, hoekradius-schaal, elevatie/schaduw-niveaus (z-lagen), en motion-timing + easing. → Set 3 + Set 1.
*Resultaat: één tokenbestand dat alles voedt en per tenant themabaar is.*

### Fase 1 — Componentbibliotheek (Laag 1)

Bouw de kerncomponenten één keer goed, elk mét looks + motion + feedback ingebakken: knop (press-scale + haptiek), kaart (elevatie + hover/press), lijst-item (swipe-acties + zichtbaar alternatief), formulierveld (inline validatie), modal/sheet, toast, skeleton, lege/foutstaat. → Set 1 + 2 + 3.
*Resultaat: een bibliotheek waarmee elk scherm automatisch consistent en “premium” is.*

### Fase 2 — Layout-templates & navigatie (Laag 2)

Bouw PageLayout / DetailLayout / FormLayout en de navigatiestructuur: bottom-nav/zijbalk in de duim-zone, ≤4–6 hoofdingangen, primaire acties ≤2 taps, responsive mobiel↔desktop. → Set 4.
*Resultaat: het “skelet” waar elke module in valt; nieuwe modules staan vanzelf goed.*

### Fase 3 — Interactiepatronen (Laag 3)

Leg de globale patronen vast: pull-to-refresh op feeds, lijst→detail-overgang, swipe-to-go-back, één gebaar = één betekenis. → Set 1 + 2.
*Resultaat: de app voelt overal hetzelfde en intuïtief aan.*

### Fase 4 — Inhoud herplaatsen, module voor module (Laag 4)

Hang de bestaande modules één voor één in het nieuwe framework. Voorgestelde volgorde (van eenvoudig/zichtbaar naar complex), zodat je het patroon vroeg bewijst:

1. Prikbord/home (veel zichtbaar, valideert lijst+detail+reacties+pull-to-refresh).
1. Agenda (lijst/detail + dag/week/maand binnen het stramien).
1. Kantine (lijst + formulier + saldo).
1. Fun/competitie (rijkere schermen).
1. Trainingen (modules + voortgang).
1. Meldingen/beheer (lijst + status + bulk).
   Per module: zelfde inhoud, nu op de nieuwe componenten/templates. Test elke module tegen de QA-meetlat voordat hij live gaat.

### Fase 5 — Opruimen

Oude, vervangen schermen/CSS verwijderen zodra alle modules gemigreerd zijn. Geen dode code laten staan.

-----

## 5. QA-meetlat (per gemigreerde module aflopen)

Voordat een module “af” is op het nieuwe framework:

- Gebruikt hij uitsluitend de tokens en componenten (geen losse styling)?
- Heeft elk scherm een laad-, lege- én foutstaat?
- Staan primaire acties in de duim-zone, ≤2 taps van home?
- Werken de gebaren (pull-to-refresh/swipe) mét zichtbaar alternatief?
- Animaties: vloeiend, en respecteren ze `prefers-reduced-motion`?
- Contrast/toegankelijkheid op orde (WCAG), schermlezer-labels aanwezig?
- Werkt het op mobiel én desktop (responsive)?
- Consistente labels/iconen met de rest van de app?

-----

## 6. Risico’s & hoe je ze beheerst

- **“Big bang”-risico** → niet alles tegelijk; migreer per module, framework draait naast de bestaande app tot een module af is.
- **Functionaliteit kwijtraken** → inhoud wordt herplaatst, niet herbouwd; backend blijft. Test elke module tegen de meetlat.
- **Scope creep** (redesign wordt “alles nieuw”) → houd vast: hetzelfde wat, beter hoe. Nieuwe features lopen via de gewone planning, niet via dit redesign.
- **Tijdsdruk** → de fasering levert na elke fase iets bruikbaars; je kunt pauzeren tussen modules zonder een half-kapotte app.

-----

## 7. Waarom dit het juiste moment is

De inhoud is bewezen en de lijst met gewenste verbeteringen (looks, motion, gebaren, structuur) is compleet en onderbouwd. Dat is precies het moment om het fundament te leggen: je weet wat het moet dragen. Later — met meer modules en (betalende) tenants — wordt een redesign veel duurder en risicovoller. Nu één keer het skelet goed neerzetten betekent dat elke toekomstige module, en elke nieuwe klant, er meteen premium en consistent op staat.

> Eén zin om vast te houden: **eerst het skelet (UI/UX + structuur), dan de bewezen inhoud erop — bouw het fundament één keer goed, en alles wat je erop zet is automatisch in orde.**
> EOF
> echo “Redesign-document gemaakt.” && wc -l redesign-framework-first.md