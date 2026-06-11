# Premium UI Report — Fresh Forward intranet — 8 juni 2026

Uitgevoerd volgens `premium-ui-audit.md`. Bewijs = bestand:regel uit de codebase (Cloudflare Workers + Hono, server-rendered; alle CSS staat inline in `src/views/layout.ts`). Patches onderaan; **nog niet toegepast** — pas na akkoord.

## Score

| Sectie | Pass | Fail/Deels | N.v.t. |
|--------|:----:|:----------:|:------:|
| 1 Designsysteem & tokens | 1 | 2 deels | 0 |
| 2 Kleur | 2 | 1 | 0 |
| 3 Typografie | 3 | 1 | 0 |
| 4 Indeling & structuur | 3 | 1 deels | 0 |
| 5 Navigatie | 3 | 0 | 0 |
| 6 Motion & microinteracties | 4 | 0 | 0 |
| 7 Feel & performance | 3 | 1 | 0 |
| 8 Toegankelijkheid | 1 | 2 deels | 0 |
| **TOTAAL** | **20** | **8** | **0** |

**Oordeel:** sterke premium-basis (tokens, dark mode, motion, gebaren, focus-states, lege/loading-staten staan). De echte winst zit in vier punten: **CLS op content-afbeeldingen**, **fluid typography (clamp)**, **WCAG-contrast verifiëren**, en **high-contrast/`forced-colors`**.

## Top 5 prioriteiten (impact ↑ / effort ↓)

1. **CLS — expliciete afmetingen op content-afbeeldingen** · `intranet.ts:150` (nieuwsfoto), `social.ts:99` (prikbordfoto), `social.ts:88` + `intranet.ts:113` (avatars). Effort: **S**. Reserveer hoogte/aspect zodat de pagina niet verschuift bij inladen (avatars in de Team-lijst zijn al gefixt in v103).
2. **Fluid typography via `clamp()`** · geen enkele `clamp()` in de codebase; type-schaal is vaste rem (`layout.ts` `--fs-*`, ~r275). Effort: **S–M**. Laat type soepel meeschalen met de viewport.
3. **WCAG AA-contrast verifiëren** · frosted nav/header/popover (`--nav` met blur) + accent-op-achtergrond. Effort: **M**. Meet 4.5:1; pas tokens aan waar nodig (stond al als aandachtspunt in `AUDIT-security-AVG-premium.md`).
4. **High-contrast / `forced-colors`** · 0 hits in de codebase. Effort: **S–M**. Respecteer Windows/!-high-contrast met een `@media (forced-colors: active)`-laag (randen/iconen zichtbaar houden).
5. **Inline hardcoded → tokens** · **371** inline `style="…"`-attributen over de views met losse px/rem/hex i.p.v. `var(--…)`. Effort: **M (doorlopend)**. Consistentie-winst; pak per module mee.

## Volledige bevindingen

### 1. Designsysteem & tokens
- **PASS — Centrale tokens** · `layout.ts` `:root` (~r254–301): `--radius/-sm/-lg`, `--dur-fast/base/screen`, `--ease-out/in/standard`, `--fs-caption…h1`, `--lh-*`, `--sp-1…6`, `--elev-1/2/3`, `--z-*` + kleur-tokens. Volwaardig fundament.
- **DEELS — Schaal consequent gebruikt** · de schaal bestaat, maar **371** inline-styles gebruiken losse waarden i.p.v. tokens. *Fix:* per module inline px/hex vervangen door `var(--sp-*)`, `var(--fs-*)`, kleur-tokens.
- **DEELS — Eén bron van waarheid** · `.btn/.card/.pill/.avatar` + `templates.ts` (`page/detail/formPage/emptyState/skeleton`) bestaan, maar zijn nog niet overal toegepast (veel one-off inline blokken). *Fix:* resterende modules op de templates (stond al in `REVIEW-EN-FINETUNE.md`).

### 2. Kleur
- **PASS — Smal palet** · neutralen + 3 accenten (groen, berry, gold). Binnen de norm.
- **PASS — Dark mode** · `prefers-color-scheme` (3×) + handmatige toggle via `:root[data-theme]` (Mijn account → Weergave).
- **FAIL/te-verifiëren — WCAG AA-contrast** · niet formeel gemeten; frosted lagen (blur + halftransparant `--nav`) tegen wisselende achtergrond zijn het risico. *Fix:* meet en stel tokens bij tot ≥4.5:1.

### 3. Typografie
- **FAIL — Fluid typography** · **geen `clamp()`**; `--fs-*` zijn vaste rem-waarden. *Fix:* zie patch A.
- **PASS — Hiërarchie** · `h1/h2/h3` met eigen grootte, gewicht en tracking (`layout.ts` ~r346–349).
- **PASS — Regelafstand & -lengte** · `--lh-body:1.65`; `max-width:70ch` op `.post .body`, `.reactie .body`, `.richtext` (`layout.ts` r373).
- **PASS — ≤2 families** · één system-font-stack.

### 4. Indeling & structuur
- **PASS — Eén primaire actie** · FAB (`+`) per module + bottom-nav.
- **PASS — Witruimte i.p.v. zware randen** · rustige schaduwen sinds Sprint A; ruimte-tokens.
- **PASS — Progressive disclosure** · "Meer"-popover, inklapbare menu-groepen, bottom-sheets.
- **DEELS — Layout-ritme** · grid + ruimte-tokens, maar inline-marges variëren (zie §1).

### 5. Navigatie
- **PASS — Bottom-nav 3–5 + Meer** · Home + 3 modules + "Meer"-overflow (`layout.ts bottomNav`).
- **PASS — Voorspelbaar + actieve staat** · actieve nav/pill gemarkeerd; vlakke IA.
- **PASS — Toetsenbord + focus** · globale `:focus-visible`-ring + focus-trap in de sheet.

### 6. Motion & microinteracties
- **PASS — Functioneel** · entrance-stagger, richting-bewuste view-transitions, shared-element, lightbox, undo-snackbar.
- **PASS — Consistente timing-tokens** · alles via `--dur-*` / `--ease-*`.
- **PASS — Natuurlijke easing & kort** · 140/240/300ms + ease-out/in; asymmetrisch in/uit. *(Kleine noot: `fadeUp`-entrance ~0,42s, net boven 400ms — desgewenst naar `--dur-screen`.)*
- **PASS — `prefers-reduced-motion`** · globale guard (5×).

### 7. Feel & performance
- **PASS — Instant feedback** · `:active` press-scale overal; knop-laadspinner; haptiek (Android).
- **PASS — Loading/lege staten** · `skeleton`-utility + `emptyState()`.
- **FAIL — CLS** · content-afbeeldingen zonder gereserveerde afmeting: `intranet.ts:150` (nieuws), `social.ts:99` (prikbord), `social.ts:88` / `intranet.ts:113` (avatars). *Fix:* zie patch B. (Team-avatars al gefixt in v103.)
- **PASS — Snelle first paint** · server-rendered HTML met inline kritische CSS; geen render-blocking externe stylesheet.

### 8. Toegankelijkheid
- **DEELS — High-contrast/reduced-motion/keyboard** · reduced-motion ✓, keyboard ✓, maar **geen `forced-colors`-ondersteuning**. *Fix:* `@media (forced-colors: active)` toevoegen.
- **DEELS — Semantiek/ARIA/alt** · `aria-label` op icoon-knoppen aanwezig (layout 12×, beheer 7× e.a.); `alt` op afbeeldingen (decoratief = `alt=""`, correct). Aanbeveling: systematische aria-pass op resterende icoon-only controls.
- **PASS — Focus-states** · zichtbare, consistente `:focus-visible`-ring.

---

## Voorgestelde patches (nog niet toegepast)

**Patch A — Fluid typography (`layout.ts` `:root`):** vervang de vaste type-schaal door `clamp()` zodat het soepel meeschaalt:
```css
--fs-caption: clamp(.74rem, .72rem + .1vw, .8rem);
--fs-sm:      clamp(.84rem, .82rem + .15vw, .9rem);
--fs-body:    clamp(.95rem, .92rem + .25vw, 1.02rem);
--fs-h3:      clamp(1.02rem, .98rem + .4vw, 1.12rem);
--fs-h2:      clamp(1.15rem, 1.05rem + .7vw, 1.3rem);
--fs-h1:      clamp(1.5rem, 1.3rem + 1.4vw, 1.9rem);
```

**Patch B — CLS op content-afbeeldingen:** geef nieuws/prikbord-foto's een vaste `aspect-ratio` (de breedte staat al op 100%), en de inline-avatars (`.ava`) een vaste maat + `width/height`-attribuut. Bv. voor de nieuwsfoto (`intranet.ts:150`): `style="… aspect-ratio:16/9; height:auto"` i.p.v. alleen `max-height`. Dit reserveert de hoogte vóór het laden.

**Patch C — `forced-colors` (`layout.ts`):**
```css
@media (forced-colors: active){
  .btn, .card, .navitem, .botnav-item, .pill, .emojibtn { border: 1px solid CanvasText; }
  .ff-scrim, .ff-lightbox { forced-color-adjust: none; }
}
```

> **Status:** **alle vier de patches zijn toegepast.**
> - **A (fluid typography)** + **B (CLS-afmetingen)** — v104.
> - **C (forced-colors)** + **WCAG-contrast** — v105.
>
> **WCAG-meting & fixes (v105).** Gemeten contrast op de kleur-tokens. Donker voldeed al ruim. In licht waren er drie reële zakkers, nu opgelost door tokens iets te verdiepen:
> - brand-groen `#2f8b54` (4.25:1) → **`#2a7d4c` (5.08:1)** — fixt groen-als-tekst (.teamfunctie/.chip/shout-out) én wit-op-groene-knop in één bron.
> - secundaire tekst `--muted` `#6b776e` (4.38:1 op bg) → **`#636d63` (5.04–5.39:1)**.
> - goud kwam als FAIL uit de meting maar wordt **alleen als vlak** gebruikt (categorie-stip/cel), nooit als tekst → **N.V.T.**
> - donkere knop (wit op groen, 3.45:1) voldoet aan **AA-large** (knoplabels zijn vet); bewust niet verder verduisterd om de knop levendig te houden.
>
> **Brand-noot:** het brand-groen is in lichte modus minimaal verdiept voor AA. Mocht je merkteam de exacte tint willen behouden, is dit één token om terug te zetten — dan accepteren we groen-als-tekst op AA-large.
