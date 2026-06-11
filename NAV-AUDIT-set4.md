# Navigatie-audit (Set 4 — informatie-architectuur)

> Analyse van de **draaiende app** (build v58) tegen de harde IA-regels uit UX-Set 4.
> Geen code gewijzigd. Doel: vaststellen wat nu schuurt + een concreet herindelings-
> voorstel dat OPDRACHT 1 (modulebeheer) en het framework-redesign voedt.
> Methode: code-inspectie van `src/views/layout.ts` (zijbalk, CSS, breakpoints) en de
> routelijst in `src/index.ts`; tik-tellingen geredeneerd vanaf de home.

-----

## 1. Huidige navigatiestructuur (feitelijk)

**Model:** één navigatielaag in een zijbalk. Geen bottom-nav, geen FAB.

- **Header (vast boven):** burger (opent menu), logo → home, pagina-titel, zoek-icoon → `/zoek`.
- **Zijbalk-inhoud (in volgorde):** Home · Zoek · [herordenbare module-blokken] · groep **Persoonlijk** (Trainingen, Team, Mijn account, Bug melden) · groep **Beheer** (alleen beheerder).
- **Module-blokken:** Agenda · Prikbord · **Fun** (Competitie + Ranglijst + Toernooien) · **Kantine** (Bestellen + Mijn saldo + Kantine-beheer) · Meldingen · Noodmelding · (Trainingen/Team vast onder Persoonlijk).

**Responsive gedrag:**

- **Desktop (>880px):** vaste, sticky zijbalk (236px) naast de content. Navigeren = **1 tik**. Goed.
- **Mobiel (≤880px):** zijbalk is een van-links-inschuivend drawer (`translateX(-105%)`), te openen via de burger (linksboven) of een veeg vanaf de linkerrand. Standaard dicht.

**Telbare feiten:** ~10–12 zichtbare hoofdingangen in het menu (Home, Zoek, 6 modulegroepen met deels subitems, 4× Persoonlijk, Beheer). Menu-items zijn 44px hoog (goed); de burger is 38×38px (onder de 44px-norm).

-----

## 2. Toetsing aan de harde regels

### 2.1 Primaire acties ≤ 2 taps van home — **grotendeels NIET gehaald op mobiel**

Op mobiel kost elke navigatie eerst een tik om het menu te openen. Tik-telling vanaf home:

| Primaire actie        | Pad                                         | Taps (mobiel) |
|-----------------------|---------------------------------------------|:-------------:|
| Prikbord lezen/posten | burger → Prikbord → (schrijven)             | 2 → 3         |
| Bestellen (kantine)   | burger → Bestellen → (bestellen)            | 2 → 3         |
| Event aanmaken        | burger → Agenda → “+”                        | 3             |
| Melding doen          | burger → Meldingen → aanmaken               | 3             |
| Training starten      | burger → Trainingen → cursus → hoofdstuk    | 4             |
| **Noodmelding/BHV**   | burger → Noodmelding → alarmknop            | **3**         |

De **menu-tik telt mee**: bijna elke kerntaak is 3 taps op de telefoon. Op desktop is het 1 navigatie-tik (binnen de regel). De `noodmelding` op 3 taps is het meest zorgelijk — een alarmfunctie hoort 1 tik weg te zijn.

### 2.2 Hoofdnavigatie ~4–6 items — **NIET gehaald**

~10–12 ingangen in één menu. De inklapbare groepen verzachten dit, maar het áántal blijft hoog; Baymard noemt complexe menu’s als faalpunt (~46% loopt vast). Geen onderscheid tussen “de 4–5 dagelijkse taken” en de rest.

### 2.3 Duim-zone — **NIET gehaald op mobiel**

Alle navigatie zit achter een burger **linksboven** = de moeilijkst bereikbare hoek voor eenhandig gebruik (zeker rechtshandig). Er is geen bottom-nav, terwijl de werkvloer de app vooral mobiel gebruikt. De swipe-vanaf-links helpt, maar is niet ontdekbaar en niet de duim-zone voor de meeste acties.

### 2.4 Hiërarchie / stack-navigatie — **deels**

Lijst → detail bestaat (prikbord→bericht, agenda→event, competitie→speler, trainingen→cursus→hoofdstuk), maar zonder consistente terug-context/overgang (sluit aan op Set 1 lijst→detail en Set 2 swipe-to-go-back, nog te bouwen). Bij 3+ niveaus (trainingen) ontbreekt oriëntatie.

### 2.5 Consistentie van structuur — **inconsistent**

Competitie en Kantine tonen subitems ín het menu; Agenda, Prikbord, Meldingen, Noodmelding niet. Daardoor is de menudiepte ongelijk. Subnavigatie hoort per scherm consistent (template), niet half in het menu.

### 2.6 Labels & iconen — **aandachtspunt**

“Competitie” (item) staat nu onder groep “Fun” → label/kop kunnen verwarren. “Bestellen” vs groep “Kantine”. Inventariseer of dezelfde actie overal dezelfde naam + icoon heeft (findability).

### 2.7 Schermanatomie / templates — **ad hoc**

Schermen zijn los opgebouwd (kaarten), zonder gedeelde `PageLayout`/`DetailLayout`/`FormLayout`. Laad-/lege-/foutstaten bestaan deels (toast, errorPage) maar niet als gegarandeerd patroon per scherm. Eén primaire actie per scherm is niet expliciet vormgegeven.

### 2.8 Responsief & leesbreedte — **redelijk**

Desktop heeft een vaste zijbalk + content (goed, geen “uitgerekte telefoon”). Maximale leesbreedte voor tekstcontent is niet expliciet begrensd; meenemen bij de looks (Set 3).

-----

## 3. Concreet herindelingsvoorstel

### 3.1 Mobiel: introduceer een bottom-nav in de duim-zone (kernwijziging)

Vervang “alles achter de burger” door een **vaste bottom-tabbar (≤5 ingangen)** + een **Meer-sheet**. Voorstel voor de 4 vaste + 1:

1. **Home** · 2. **Prikbord** (meest-bezochte feed) · 3. **Agenda** · 4. **Kantine/Bestellen** · 5. **Meer**.

- **Zoek** blijft het icoon rechtsboven (secundair, prima buiten de duim-zone).
- **Meer-sheet** bevat de rest: Fun/competitie, Trainingen, Team, Meldingen, Mijn account, Beheer, Bug melden.
- **Noodmelding/BHV** krijgt **snelle toegang** los van “Meer”: óf een vaste, herkenbare SOS-affordance, óf bovenaan elke Meer-sheet — nooit 3 taps diep.
- Effect: dagelijkse kerntaken naar **1 tik** (tab) + 1 actie = binnen de ≤2-regel; duim-zone gehaald.

> Belangrijk: maak de bottom-nav **config-gedreven** (welke modules op de balk, in welke volgorde) — dit haakt direct in OPDRACHT 1 (modulebeheer met groepen/volgorde). De balk toont de top-N ingeschakelde modules + “Meer”; de rest valt in de sheet. Eén databron voedt bottom-nav, Meer-sheet én (desktop) zijbalk.

### 3.2 Desktop: zijbalk behouden, maar ≤6 hoofdingangen + groepen

De vaste zijbalk werkt; reduceer het aantal **top-level** items en stop de rest onder de (al bestaande) inklapbare groepen. Lijn de groepen 1-op-1 uit met OPDRACHT 1 (Persoonlijk, Fun, Werk/Beheer …).

### 3.3 Subnavigatie consistent maken

Haal de subitems (Competitie-ranglijst/toernooien, Kantine-saldo/beheer) uit het hoofdmenu en toon ze **binnen het scherm** (tab-strip/segmented control bovenin de module), via één template. Menu wordt vlakker en uniform.

### 3.4 Schermtemplates vastleggen (sluit aan op redesign-Fase 2)

Definieer `PageLayout` (lijst), `DetailLayout`, `FormLayout` met vaste anatomie: titel/terug-context → (filter/zoek) → inhoud → **één** primaire actie in de duim-zone, en ingebouwde laad-/lege-/foutstaat. Nieuwe modules vallen er dan vanzelf goed in.

### 3.5 Labels & iconen uniformeren

Eén naam + icoon per actie/concept; los de “Competitie vs Fun”-dubbeling op (kop = groep “Fun”, item = “Ranglijst/Darten/…”, niet nogmaals “Competitie”).

-----

## 4. Prioritering (grootste winst eerst)

1. **Bottom-nav + Meer-sheet op mobiel** (config-gedreven) — lost ≤2-taps + duim-zone in één klap op. Bouw samen met OPDRACHT 1.
2. **Noodmelding snelle toegang** — klein, hoog risico-rendement.
3. **Hoofdnav reduceren tot ≤6 + subnav naar in-scherm** — vlakkere, consistente IA.
4. **Schermtemplates** (PageLayout/DetailLayout/FormLayout) — fundament voor Fase 4 (module-migratie).
5. **Labels/iconen-inventaris** — findability, goedkoop.
6. **Leesbreedte + responsive tokens** — meenemen met Set 3 (looks).

-----

## 5. Aansluiting op het vervolg

- **OPDRACHT 1 (modulebeheer):** lever meteen de databron op die zowel bottom-nav, Meer-sheet als zijbalk voedt (`groups` + per module `group_id`/`order_index`/`enabled`). De server-side module-guard (`PAD_MODULE`) blijft leidend: uit = ook op URL/API geblokkeerd.
- **Redesign-Fase 2 (layout-templates):** §3.4 hierboven is de input.
- **Redesign-Fase 3 (gebaren/overgangen):** §2.4 (lijst→detail + swipe-to-go-back) hoort hier.

> Eén zin: de IA is op desktop oké maar op mobiel het zwakst — breng de kerntaken naar een config-gedreven bottom-nav in de duim-zone, maak subnavigatie in-scherm en consistent, en leg schermtemplates vast vóór de module-migratie.
