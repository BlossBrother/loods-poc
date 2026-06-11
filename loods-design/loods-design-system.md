# Cowork-taak: Stroom design system — tenant-tokens & componentbibliotheek

> Drop dit bestand in je Cowork-sessie, sámen met `home-redesign.md`.
> Dit is de **bron van waarheid voor look & feel van het hele platform** — niet
> alleen de home. Referentie-implementatie: `home-mockup.html` (bevat onderaan
> een werkende tenant-thema-switcher: Stroom / Warm / Groen — zelfde UI, alleen
> drie tokens wisselen).
> 
> Inplannen als **Fase B0**: vóór de home-UI uit home-redesign.md, want elke
> component daar consumeert deze tokens.

-----

## 1. Architectuur: drie lagen

**Laag 1 — Platform-tokens (VAST, identiek voor elke tenant).**
Spacing, radii, schaduwen, motion-curves, typografie, iconenstijl, neutrale
kleuren (light + dark). Dit ís Stroom: het product voelt overal hetzelfde.

**Laag 2 — Tenant-tokens (de ENIGE per-tenant instelbare waarden).**

```css
--t-accent:   #2B7BFF;   /* primaire merkkleur */
--t-accent2:  #39E0FF;   /* secundaire/gradient-partner */
--t-onaccent: #06243F;   /* tekst/glyph óp accentvlakken */
```

Plus één asset: `logo_key` (R2, SVG/PNG voor de logo-tegel; fallback =
Stroom-bliksem).

**Laag 3 — Afgeleide tokens (berekend, nooit opgeslagen).**

```css
--grad: linear-gradient(135deg, var(--t-accent2), var(--t-accent));
--tile: color-mix(in srgb, var(--t-accent) 10%, transparent);  /* icoon-tegels */
--glow: color-mix(in srgb, var(--t-accent) 35%, transparent);  /* accent-schaduw */
```

> Prod-note: de Worker mag laag 3 server-side voorberekenen (hex i.p.v.
> `color-mix`) voor maximale compatibiliteit. De mockup gebruikt `color-mix`
> (iOS 16.2+, prima voor onze doelgroep).

**Onderbouwing (NN/g):** merk-theming per tenant = waardevol; layout/spacing/
motion themen = “frivolous customization” die faalt. Dus: tenants kiezen kleur
en logo, nooit structuur.

**Semantisch vast, NOOIT tenant-kleur:**

```css
--alarm-grad: linear-gradient(135deg, #FF7A4D, #F23B2F);  /* BHV/noodmelding */
```

Veiligheid is altijd rood-oranje, bij élke tenant. (Bekend en geaccepteerd:
bij een warme tenant liggen alarm en accent dicht bij elkaar — alarm
onderscheidt zich dan door de witte ring-puls, het alert-icoon en de positie
bovenaan.)

-----

## 2. Platform-tokens — exacte waarden (uit de mockup)

### Neutralen

|token    |light               |dark                   |
|---------|--------------------|-----------------------|
|`--bg`   |`#F4F7FB` (Mist)    |`#0A0E14` (Inkt)       |
|`--card` |`#FFFFFF`           |`#121925`              |
|`--ink`  |`#0A0E14`           |`#F4F7FB`              |
|`--sub`  |`#5E6B7A`           |`#9AA6B4`              |
|`--faint`|`#8A95A3`           |`#6E7A88`              |
|`--line` |`rgba(10,14,20,.07)`|`rgba(244,247,251,.08)`|

Schakelen via `prefers-color-scheme`; tenant-tokens blijven gelijk in beide modi.

### Radii (vast)

|element              |radius|
|---------------------|------|
|kaart                |22px  |
|binnen-blok (kantine)|16px  |
|icoon-tegel          |13px  |
|logo-tegel           |14px  |
|demo/dashed blok     |18px  |
|tabbar-capsule       |40px  |
|blob                 |28px  |
|pill/chip/badge      |999px |

### Schaduwen (vast, gelaagd)

```css
/* light */
--sh:      0 1px 2px rgba(10,14,20,.04), 0 10px 30px rgba(10,14,20,.07);
--sh-soft: 0 1px 2px rgba(10,14,20,.03), 0 6px 18px rgba(10,14,20,.05);
/* dark */
--sh:      0 1px 2px rgba(0,0,0,.3),  0 12px 34px rgba(0,0,0,.45);
--sh-soft: 0 1px 2px rgba(0,0,0,.25), 0 8px 22px rgba(0,0,0,.35);
/* accent (afgeleid) */
logo: 0 6px 16px var(--glow);   pill-CTA: 0 5px 14px var(--glow);
tabbar: 0 12px 36px rgba(0,0,0,.4);   alarm: 0 10px 28px rgba(242,59,47,.35);
```

### Motion (vast)

|naam  |spec                                                                           |gebruik                 |
|------|-------------------------------------------------------------------------------|------------------------|
|rise  |`.55s cubic-bezier(.2,.7,.2,1)`, translateY 14px→0 + fade, stagger 50ms (`--d`)|entrance van elke sectie|
|blob  |`.4s cubic-bezier(.22,.72,.24,1)` op transform + width                         |tabbar actieve indicator|
|press |`:active scale(.975)` (.94 op tabs), `.15s ease`                               |alle tapbare elementen  |
|lift  |hover `translateY(-2px)` `.2s` — **alleen** `@media (hover:hover)`             |kaarten op desktop      |
|ring  |`1.7s ease-out infinite`, box-shadow 0→12px wit-alpha uitdovend                |alarm-icoon puls        |
|drop  |`3.4s ease-in-out infinite`, druppel top 0→100% met fade in/uit                |stroomlijn (signature)  |
|header|alleen `background-color .25s`; `backdrop-filter` staat permanent aan          |frosted scroll-state    |

`prefers-reduced-motion: reduce` → rise/ring/drop uit, transitions uit, alles
direct zichtbaar. Verplicht op elke nieuwe component.

### Typografie (vast)

Systeemstack: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`. Schaal:

|rol                      |spec                                         |
|-------------------------|---------------------------------------------|
|H1 begroeting            |21px / 800 / ls −.4                          |
|Nieuws-cover titel       |15.5px / 800 / ls −.2                        |
|Kaarttitel / banner-titel|14–15px / 700–800                            |
|Agenda-tijd              |13px / 800 / accent / `tabular-nums`         |
|Subregel                 |12.5–13px / `--sub`                          |
|Eyebrow                  |11.5px / 800 / ls 1.6 / `--faint` / UPPERCASE|
|Badge                    |10–11px / 800                                |
|Tab-label                |10px / 600                                   |

### Iconen (vast)

Lucide/Feather-stijl stroke-iconen, **stroke-width 1.8** (2.0 alleen ≤17px),
`stroke-linecap/linejoin: round`, geen fills. Maten: 25px tabs, 20–22px tegels,
15px chips. Eén `<symbol>`-sprite per pagina (zie mockup) — geen losse SVG-
bestanden per icoon.

### Spacing (vast)

Pagina-padding 18px · kaart-padding 15–16px · gap in rijen 12–13px · sectie:
24px boven eyebrow, 10px eronder · kaart-onderling 10px · content-bottom
`safe-area + 128px` (ruimte voor tabbar).

-----

## 3. Componentbibliotheek (alles uit de mockup, platform-breed)

Elke component consumeert uitsluitend tokens — **nul hex in componentcode**.
Herbruikbaar in álle modules via `ModuleLayout`.

1. **AppHeader** — sticky, `backdrop-filter: saturate(160%) blur(18px)`
   permanent; `.scrolled` toggelt alleen background-color (WebKit-les). Bevat
   LogoTile, begroeting (tijdgebonden) + datum·tenantnaam, ronde IconButton.
1. **LogoTile** — 46px, radius 14, `--grad`-vlak, glyph in `--t-onaccent`,
   glow-schaduw. Toont tenant-logo uit R2; fallback bliksem.
1. **InfoChip** — pill, `--card` + `--line` + `--sh-soft`; icoon in accent;
   count-bolletje in `--grad` met witte tekst. Alleen renderen bij count > 0.
   Horizontaal scrollend, scrollbar verborgen.
1. **AlarmBanner** — `--alarm-grad`, witte tekst, icoon-tegel wit-alpha 20% met
   ring-puls, witte CTA-pill met alarm-rode tekst. In productie **niet**
   wegklikbaar (de ✕ in de mockup is demo). 0 actieve alarmen = niets renderen.
1. **TodayCard + StroomRail** *(signature-element)* — verticale 3px `--grad`-
   rail met dalende druppel in `--t-accent2` + glow. Items: tijd (accent,
   tabular) · titel · subregel; 1px `--line` tussen items.
1. **KantineRow / DeadlineRow** — `--tile`-vlak radius 16, witte icoon-tegel
   met `--sh-soft`, titel + subregel, PillButton rechts.
1. **ActionCard** — kaart met `--tile` icoon-tegel (accent-icoon), titel,
   subregel, GhostButton rechts. Voor alle “Voor jou”-items uit elk module.
1. **PillButton** (primair) — `--grad`, witte tekst 13/700, glow-schaduw.
1. **GhostButton** (secundair) — 1.5px accent-rand, accent-tekst, transparant.
1. **NewsCover** — kaart, cover 128px in `--grad` met groot wit-alpha
   watermerk (tenant-glyph) rechtsonder geroteerd −8°, categorie-chip
   linksboven (wit, donkere alpha-achtergrond, blur 8px). Body: titel + meta.
1. **NewsRow** — compacte rij: unread-dot (8px `--grad`) óf niets, titel,
   meta, chevron in `--faint`.
1. **Eyebrow** — sectielabel + optionele accent-link rechts (“Alles →”).
1. **TabBar** — capsule **altijd donker** (`rgba(13,18,26,.82)` + blur 22 +
   1px wit-alpha rand) in light én dark; witte stroke-iconen .72→1.0;
   blob `rgba(255,255,255,.14)`; badge in `--grad` met 2px capsule-rand;
   avatar-tab in `--grad` met `--t-onaccent` initialen. Blob meten met
   `offsetLeft/offsetWidth`, init via rAF + `fonts.ready` + load + resize.
1. **DemoSwitch / SegmentRow** — dashed `--line` blok (ook bruikbaar als
   instellingen-patroon): opties als pills, actieve = accent-rand.
1. **Skeleton** — vaste aspect-ratio per slot, `--line`-vlakken, geen pop-in
   (Team-les). Elke widget-sectie heeft een skeleton-variant.
1. **EmptyState** — één rustige kaart, icoon-tegel + één zin + één CTA.

**Interactie-recepten:** `.press` op alles wat tapt; `.lift` alleen
hover-devices; `.up` met `--d`-stagger op secties (niet op individuele
lijstitems binnen een kaart).

-----

## 4. Tenant-theming: opslag, levering, beheer

### D1

```sql
CREATE TABLE tenant_theme (
  tenant_id  TEXT PRIMARY KEY,
  accent     TEXT NOT NULL DEFAULT '#2B7BFF',
  accent2    TEXT NOT NULL DEFAULT '#39E0FF',
  on_accent  TEXT NOT NULL DEFAULT '#06243F',
  logo_key   TEXT,                  -- R2; NULL = Stroom-bliksem
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Levering (geen flits van verkeerde kleuren)

De Worker rendert de tenant-tokens **inline in de HTML-shell**:

```ts
// shell.ts — bij elke page render (theme uit KV/D1, gecachet per tenant)
const css = `:root{--t-accent:${t.accent};--t-accent2:${t.accent2};--t-onaccent:${t.on_accent}}`;
// → <style id="tenant-theme">${css}</style> in <head>, vóór tokens.css
```

`tokens.css` (laag 1 + 3 + componenten) is statisch en agressief gecachet —
identiek voor alle tenants. Alleen de drie regels hierboven verschillen.
Theme-wijziging → cache-bust via `updated_at` in een ETag.

### Beheer (tenant-admin)

Instellingen → “Huisstijl”: twee kleurkiezers + logo-upload + **live preview**
(de home in miniatuur, light & dark naast elkaar — exact zoals de
mockup-switcher). Opslaan = `optimisticMutate`.

**WCAG-guardrail bij opslaan (verplicht, server-side):**

- contrast `on_accent` ↔ `accent` én ↔ middenpunt van de gradient ≥ 4.5:1;
- contrast `accent` ↔ `--card` (light én dark) ≥ 3:1 voor GhostButton/links;
- afstand tot alarm-rood: waarschuwing als accent te dicht bij `#F23B2F` ligt;
- faalt een check → blokkeren met auto-suggestie (dichtstbijzijnde geldige tint).

-----

## 5. Regels — wat mag een tenant wél/níét

|        |                                                                                                                |
|--------|----------------------------------------------------------------------------------------------------------------|
|**WEL** |`accent`, `accent2`, `on_accent`, logo                                                                          |
|**NIET**|radius, spacing, motion, schaduwen, typografie, iconenstijl, tabbar-capsulekleur, alarm-kleuren, layout/volgorde|

-----

## 6. Integratieregels (afdwingbaar)

1. Eén `tokens.css`; componenten bevatten **geen** hex/rgb-literals.
   CI-check: `grep -rE '#[0-9a-fA-F]{3,8}|rgb\(' src/components` → moet leeg
   zijn (uitzondering: `tokens.css` zelf).
1. Nieuwe modules (Nieuws, Documenten, alles hierna) bouwen uitsluitend met
   componenten uit §3 — geen eigen knoppen/kaarten/schaduwen.
1. `ModuleLayout` zet de header-, sectie- en empty-state-patronen; modules
   leveren alleen content.
1. Elke PR met UI: screenshot light + dark + minimaal één niet-Stroom-thema.

-----

## 7. Klaar wanneer

- [ ] `tokens.css` bestaat; alle bestaande schermen (home, Agenda, Prikbord,
  Meldingen, Kantine, BHV, Toernooien, Team) zijn hex-vrij (grep slaagt).
- [ ] `tenant_theme`-record wijzigen herkleurt de **hele app** zonder enige
  code-aanpassing — getest met Warm (`#D44D39/#FF9159/#fff`) en Groen
  (`#1E9E5A/#7FE08F/#06351F`) uit de mockup.
- [ ] AlarmBanner blijft rood-oranje bij elke tenant.
- [ ] WCAG-guardrail blokkeert onleesbare combinaties en suggereert alternatief.
- [ ] Tenant-tokens komen inline uit de shell; geen kleurflits bij koude load
  op fysieke iPhone (PWA standalone).
- [ ] Mockup-pariteit per component (§3), light + dark, reduced-motion getest.
- [ ] Huisstijl-instellingenpagina met live preview werkt voor tenant-admins.