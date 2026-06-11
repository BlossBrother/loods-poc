# Module-sjabloon (Stroom-plan 3.1) — conventies & bewuste afwijkingen

> Eén vaste schermanatomie zodat elk scherm "dezelfde app" is en nieuwe modules
> alleen nog content kosten. De helpers staan in `src/views/templates.ts`.

## De anatomie per schermtype

**Lijst-/overzichtsscherm** — gebruik `page({ title, intro?, actions?, children })`:
één `<h1>`, optionele intro (`.page-intro`), maximaal één contextactie rechts
(`.page-actions`). Sub-navigatie binnen een module via pills (`gamePills`-patroon)
of de sub-tabs.

**Detailscherm** — gebruik `detail({ backHref, backLabel?, title, children })` of
minimaal een `.detail-back`-link BOVEN de `<h1>` (chevron + context, bv. "Agenda",
"Ranglijst"). Geen terug-linkjes meer onderaan de pagina.

**Formulierscherm** — `formPage(...)`: één taak, één primaire submit onderaan.
iOS-zoom voorkomen: inputs ≥16px in sheets (staat al in de tokens).

**Lege staat** — altijd `emptyState({ icon, title, text?, action? })`. Nooit een
kale "—" of "Geen items"-regel op schermniveau.

**Primaire actie** — maximaal één `.btn` (primair groen) per scherm; alles
daarnaast is `.btn-soft`. De mobiele primaire actie is de FAB (via `PRIMARY` in
layout.ts) of een sticky knop. Quick actions via bottom sheets (`[data-sheet]`,
hergebruikt de dvh/visualViewport-fix).

**Navigatiediepte** — maximaal 3 niveaus: module → lijst → detail.

## Stand na de 3.1-slag (v161)

- Alle 19 views hebben precies één `<h1>` ✓
- Detail-terug-links bovenaan: event-detail (agenda) en spelerprofiel (competitie) ✓
- Lege staten gemigreerd naar `emptyState()`: competitie (laatste/recente potten),
  agenda (dagweergave), kantine (menu, mutaties, bestellingen vandaag) ✓
- Beheer-koppen: "Reset" is `btn-soft` naast "Opslaan" ✓ (was al zo)

## Bewuste afwijkingen (laten staan)

1. **Noodmelding-kaart op /meldingen** is opzettelijk een tweede prominente actie
   (SOS, berry-stijl): veiligheidsfunctie wint van sjabloonregels.
2. **Destructieve knoppen** gebruiken `.btn-berry` naast een primaire knop
   (bv. "Cursus verwijderen"): kleuronderscheid is hier de bedoeling; berry is
   semantisch "destructief", niet "tweede primaire".
3. **Maand-/weekcellen in de agenda** tonen een compacte "—" bij lege dagen:
   een `emptyState`-kaart per kalendercel zou de grid breken. De dag-WEERGAVE
   (volledig scherm) gebruikt wél `emptyState`.
4. **Kale "—" in kleine kaart-statistieken** (bv. "Laatste 5" zonder potten) is
   een waarde-placeholder binnen een card, geen schermstaat.
5. **Portaal** (klant-kant) volgt een eigen, smallere huisstijl; sjabloonslag
   volgt daar bij het Stroom-traject (multi-tenant).

## Nieuwe module toevoegen?

1. Scherm bouwen met `page()`/`detail()`/`formPage()` + `emptyState()`.
2. Navigatie: item in `HEAD_LINKS`/`SUBMODULES` (layout.ts) + module-id in Beheer → Modules.
3. Primaire actie registreren in `PRIMARY` (layout.ts) → FAB + sheet.
4. Status-ondertitel toevoegen in `src/summary.ts` (één extra statement in de batch).
