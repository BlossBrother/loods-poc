# HONK Deep Polish — stand van zaken t.o.v. de PoC (12 juni 2026, na v191)

> Mapping van HONK-DEEP-POLISH-PERFORMANCE.md op wat er in de PoC al bestond,
> wat v191 heeft toegevoegd, en wat resteert. Voorkomt dubbel werk: de PoC bleek
> al verder dan het HONK-plan aanneemt.

## Al af vóór v191 (niet opnieuw doen)

| HONK-item | Waar het al zit |
|---|---|
| §8.5 View Transitions (SPA) | layout.ts: `startViewTransition` in de router + `@view-transition{navigation:auto}` + named groups ff-header/ff-botnav/page |
| §10.7 Haptics | layout.ts: échte haptiek (geen stub) — `navigator.vibrate` + iOS-Taptic via `switch`-checkbox; gekoppeld aan nav/submit/toggles |
| §8.2 Skeletons + shimmer | layout.ts `.skeleton` (ffShimmer) + skeleton-laadstaat bij koude SPA-navigatie >300ms (v183) |
| §10.1 Entrance stagger | shell: `main .card` fadeUp, 40ms stagger, cap op n+6 — exact de HONK-norm |
| §9.1 Motion/typo-tokens (deels) | Laag-0: `--dur-fast/base/screen`, `--ease-out/in/standard`, fluid type via clamp (`--fs-*`), spacing-schaal |
| §3.4 Touch-basis (deels) | tap-highlight transparent, `touch-action:manipulation`, passive listeners, botnav-items min-height 44px |
| §10.6 Reduced motion | globale kill (animation/transition) + VT-pseudo-kill |
| §10.4 Tabbar frosted pill | capsule v189, adaptief glas, safe-area |
| §6.3 Update-flow / §6 SW | network-first SW, per-deploy cache-bump, SPA-cache leegt zichzelf |
| §10.2 Press-states | `.press`/`:active`-patroon app-breed; hover-lift op kaarten |
| C4 app-frame | shell scrollt in eigen container (`.shell`), body niet |

## Toegevoegd in v191 (ronde A)

- Cross-doc View Transitions op **home** (home2 miste de at-rule → home↔shell vloeit nu; capsule + header blijven staan).
- `.wabar.mini` op home (capsule krimpt bij omlaag scrollen, shell-pariteit).
- Haptiek op home (zelfde patroon als shell, incl. iOS-fallback).
- HONK-motion-aliassen `--dur-press/--dur-enter/--stagger/--ease-spring` in beide stijlbronnen; home-entrance op .42s/40ms/max 6.
- Chips-hit-area ≥44px (onzichtbare ::after, visueel ongewijzigd).
- HONK C1/C2: user-select/touch-callout uit op UI-chroom (home + shell), content selecteerbaar; `-webkit-overflow-scrolling` verwijderd (4×).

## Resteert — kan zonder metingen (volgende rondes)

1. **Optimistic UI dekkend maken** (HONK §8.3): inventariseren welke mutaties al optimistic zijn (emoji-reconcile bestaat); bestellen/RSVP/Gelezen aanvullen + rollback-toast.
2. **Empty/error-states per view** (§9.3): EmptyState-component bestaat in loods.ts? — check; elke lijst 3/3 states.
3. **Badge-beleid** (rapport §4.7): cijfers = actie vereist; dot = nieuw. Audit op tabbar + chips.
4. **Afbeeldingen** (§3.2): width/height/aspect-ratio overal, lazy onder de vouw, LCP-element fetchpriority=high.
5. **R2-varianten** (§4.4): thumb/card/full bij upload (Web Worker-compressie client-side, §7.7).
6. **Token-audit** (§9.1/Appendix B): grep-scan hardcoded waarden; uitzonderingen documenteren. NB: bewuste hex-fallbacks voor OKLCH (iOS<15.4) en de home/shell-neutralen zijn gewild — whitelisten.
7. **Summary-endpoints + D1-batch** (§5): per view 1 fetch; `EXPLAIN QUERY PLAN`-check indexen.
8. **Edge-cache middleware** (§4.2): alleen tenant-brede GET; pas op met per-user content (vrijwel alles achter Access is gepersonaliseerd — kleinere winst dan HONK aanneemt; eerst meten).

## Resteert — vergt PJ's machine / metingen

- **Fase 0 baseline**: Lighthouse mobile (Home/Prikbord/Agenda/Kantine), DevTools-traces, `esbuild --metafile`-bundelanalyse → /docs/perf/baseline.md. Zonder baseline geen fase 2/3/5-besluiten.
- **RUM-beacon** (web-vitals → D1 `perf_log`): klein bouwwerk, maar pas zinvol ná baseline.
- **QA-matrix** (§11): echte devices (iPhone standalone, mid-range Android).

## Kanttekeningen bij het HONK-plan (afwijkingen, met reden)

- **Haptics-stub (§10.7)**: overbodig — er is al een werkende web-implementatie; bij
  Capacitor-conversie de bestaande `ffHaptic` achter het native plugin-API zetten.
- **Code-splitting per module (§7.1)**: de app is server-rendered met minimale JS per
  pagina; er ís geen grote client-bundle. Eerst meten (fase 0) — waarschijnlijk n.v.t.
- **C4 body-scroll op home**: home scrolt nu op body (standalone pagina). Werkt; pas
  aanpassen als iOS-QA rubber-band-problemen toont, niet preventief.
- **Naam "Honk"**: plan gebruikt Honk waar eerdere docs Loods zeggen — aannemende
  zelfde platform; bij naamswissel loods-design/ + businessplan bijwerken.

## Deploy v191

Zelfde flow als v190 (cmd): `npx tsc --noEmit` → commit/push → `npm run deploy` →
footer-check v191. v190 en v191 kunnen in één commit/deploy mee.
