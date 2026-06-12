# HONK — Deep Polish & Performance
## Cowork-implementatiedocument: optimalisatie · uniformisatie · laden minimaliseren · smooth feel
**Voor:** Cowork (uitvoerend agent)
**Stack:** Cloudflare Workers · Hono/TypeScript · D1 · R2 · Entra ID · PWA (→ Capacitor)
**Relatie tot eerdere docs:** dit plan orkestreert en integreert de bestaande *Premium UX-auditchecklist* en het *Optimistic UI/Offline-plan*. Waar die documenten detail geven, verwijst dit plan ernaar i.p.v. te dupliceren.
---
## 0. Doel & Definition of Done
Honk moet aanvoelen als een native app: direct openen, nooit een wit scherm, identieke look & feel in elke module, vloeiende motion op 60fps.
**Harde budgets (meetbaar, mobiel, mid-range Android op 4G):**
| Metric | Budget |
|---|---|
| LCP eerste bezoek | < 2,0 s |
| LCP herhaalbezoek | < 1,0 s |
| INP | < 200 ms |
| CLS | < 0,05 |
| TTFB (edge) | < 200 ms |
| API p95 (summary-endpoints) | < 300 ms |
| Initiële JS (gzip) | ≤ 130 KB |
| CSS (gzip) | ≤ 40 KB |
| Fetches per scherm-load | 1 (summary-endpoint) |
| Lighthouse mobile performance | ≥ 95 |
**Niet-meetbare DoD:** geen enkel hardcoded kleur-/px-waarde buiten tokenbestanden; elke module gebruikt uitsluitend de gedeelde componentenbibliotheek; elke view heeft loading-, empty- én error-state; alle motion volgt de huisstijl-tokens; `prefers-reduced-motion` overal gerespecteerd.
---
## 1. Werkwijze voor Cowork
1. **Meten vóór optimaliseren.** Fase 0 levert de baseline; elke fase eindigt met een hermeting van de relevante metrics.
2. **Eén commit/PR per fase**, met in de PR-beschrijving: baseline → resultaat per metric.
3. **Volgorde aanhouden.** Fase 1 (quick wins) geeft direct merkbaar resultaat; fase 6–8 bouwen op de eerdere fundering.
4. **Capacitor-proof bouwen.** Alle cache-/offline-logica komt in de app-laag (fetch-helper), níet uitsluitend in de service worker. Bij de geplande Capacitor-conversie (WKWebView) blijft die laag dan ongewijzigd werken; de SW wordt optioneel.
5. **Multi-tenant discipline.** Elke cache-key bevat `tenantId`. Per-user data wordt nóóit op edge gecachet.
---
## 2. Fase 0 — Baseline meten (0,5 dag)
- Lighthouse (mobile, throttled) op: Home, Prikbord, Agenda, Kantine. Scores + filmstrips vastleggen in `/docs/perf/baseline.md`.
- Chrome DevTools Performance-trace van: cold start, tabwissel, lange lijst scrollen (Prikbord). Long tasks > 50 ms noteren.
- Network-tab: aantal requests per scherm, waterfall-diepte, payload-groottes.
- Bundle-analyse: `esbuild --metafile` → grootste modules identificeren.
- Eenvoudige RUM (optioneel, aanbevolen): `web-vitals`-beacon naar een Worker-endpoint → D1-tabel `perf_log (tenant_id, metric, value, path, ua, ts)`. Geeft echte cijfers van Fresh Forward-gebruikers.
**Acceptatie:** baseline-document met alle bovenstaande cijfers per scherm.
---
## 3. Fase 1 — Quick wins, vandaag al merkbaar (1 dag)
1. **Fonts:** WOFF2-subset (latin), max 2 gewichten, `<link rel="preload" as="font" crossorigin>`, `font-display: swap`, fallback-font met `size-adjust` zodat de swap geen layout-shift geeft.
2. **Afbeeldingen:** elke `<img>` krijgt `width`/`height` (of `aspect-ratio`) → CLS naar ~0. Alles onder de vouw `loading="lazy" decoding="async"`. Het LCP-element (hero/eerste kaart) juist `fetchpriority="high"` en **niet** lazy.
3. **Asset-headers:** gehashte JS/CSS/fonts → `Cache-Control: public, max-age=31536000, immutable`.
4. **Touch-basis:** `-webkit-tap-highlight-color: transparent`, alle scroll-/touch-listeners `{ passive: true }`, tap-targets ≥ 44 px (controle via audit, §10).
5. **Lange lijsten:** `content-visibility: auto` + `contain-intrinsic-size` op Prikbord-/Meldingen-items → render-kosten buiten beeld vervallen.
6. **Preconnect** naar het API-origin als dat een ander (sub)domein is.
7. **iOS native-feel laag** (Appendix C) in één keer toepassen: `touch-action: manipulation` op interactieve elementen, *scoped* `user-select: none` op UI-chroom, app-frame met interne scrollers i.p.v. body-scroll.
**Acceptatie:** CLS < 0,05 op alle schermen; Lighthouse +5–10 punten t.o.v. baseline.
---
## 4. Fase 2 — Netwerk & edge: Cloudflare (1,5 dag)
### 4.1 Cache-strategie per resourcetype
| Resource | Strategie | Headers / locatie |
|---|---|---|
| App-shell HTML | network-first + ETag | `no-cache` (revalidate), shell in SW-precache |
| Gehashte JS/CSS/fonts | cache-first, immutable | `public, max-age=31536000, immutable` |
| R2-afbeeldingen (varianten) | cache-first | `public, max-age=2592000` |
| API GET, tenant-breed (agenda, prikbord, toernooien) | edge cache + SWR | tenant-key, `max-age=60, stale-while-revalidate=300` |
| API GET, per-user (mijn bestellingen, mijn meldingen) | **geen edge cache** | `no-store`; alleen client-SWR (§8) |
| Mutaties (POST/PUT/DELETE) | nooit cachen | `no-store` |
### 4.2 Edge-cache middleware (Hono, tenant-aware)
Toepassen op tenant-brede GET-routes; zie Appendix A1 voor de volledige snippet. Kern: cache-key = `tenantId + pathname + search`, schrijven via `executionCtx.waitUntil`, response krijgt `max-age=60, stale-while-revalidate=300`. **Nooit** responses met user-specifieke inhoud door deze middleware halen.
### 4.3 Cache-invalidatie
Bij elke mutatie op tenant-brede data: betreffende cache-keys verwijderen (`caches.default.delete(key)`) in dezelfde Worker-request. Lijst van key-patronen per module documenteren in `/docs/perf/cache-keys.md`.
### 4.4 R2-afbeeldingsvarianten
Bij upload direct drie varianten wegschrijven: `thumb` 160 px, `card` 640 px, `full` 1280 px (WebP). Frontend vraagt altijd de passende variant; nooit een origineel van 4 MB in een lijstje.
**Acceptatie:** herhaalde GET op tenant-brede endpoints < 50 ms (edge-hit); afbeeldingspayload per scherm −70 % of meer.
---
## 5. Fase 3 — API & D1: één fetch per scherm (1 dag)
1. **Summary-endpoint per view.** Naar het model van `/api/home/summary`: ook `/api/prikbord/summary`, `/api/kantine/summary`, etc. Eén round-trip levert alles wat de view nodig heeft. Geen request-waterfalls dieper dan 2.
2. **Parallel in de Worker:** alle queries binnen een summary-endpoint via `env.DB.batch([...])` (één round-trip naar D1) of `Promise.all`. Zie Appendix A2.
3. **Indexen.** Voor elke veelgebruikte filter/sortering een samengestelde index, altijd beginnend met `tenant_id`. Voorbeelden in Appendix A3. Controle: `EXPLAIN QUERY PLAN` mag geen `SCAN` tonen op grote tabellen.
4. **Payload-discipline:** alleen velden die de UI toont; lijsten gepagineerd (cursor, `limit 20`); datums als ISO-string, geen verwerkte presentatie-strings vanaf de server.
5. **N+1 elimineren:** nooit per lijst-item een extra query; joins of een tweede batch-query.
**Acceptatie:** elk scherm laadt met exact 1 API-call; API p95 < 300 ms; `EXPLAIN QUERY PLAN`-rapport zonder table scans.
---
## 6. Fase 4 — App-shell, service worker & fetch-laag (1 dag)
1. **App-shell-model:** shell (HTML-frame, tabbar, kritieke CSS) in SW-precache met versienummer. Cold start toont de shell instant, data volgt via SWR (§8).
2. **SW runtime-strategieën:** gehashte assets cache-first; afbeeldingen cache-first (30 d, max-entries 200); API GET *niet* in de SW afhandelen — dat doet de fetch-helper in de app-laag (Capacitor-proof, zie §1.4).
3. **Update-flow:** nieuwe SW geïnstalleerd → onopvallende toast "Nieuwe versie beschikbaar — Vernieuw". Nooit hard auto-reloaden midden in gebruik.
4. **Offline-fallback:** offline.html in huisstijl (empty-state component) + de offline-queue uit het bestaande Optimistic UI/Offline-plan.
5. **Navigation preload** aanzetten zodat de shell-fetch niet op SW-boot wacht.
**Acceptatie:** herhaalbezoek toont shell < 300 ms; vliegtuigmodus geeft nette offline-state i.p.v. dino.
---
## 7. Fase 5 — Rendering & JS-prestaties (1 dag)
1. **Code-splitting per module:** elke tab/module een eigen chunk via dynamic `import()`. Initiële bundle bevat alleen shell + Home.
2. **Prefetch op intentie:** bij `touchstart`/`mouseenter` op een tabicoon alvast de module-chunk importeren én de summary-SWR starten. Tabwissel voelt daardoor instant.
3. **Idle-prefetch:** via `requestIdleCallback` na first paint de twee meest gebruikte modules voorladen.
4. **Dependencies snoeien:** datums via native `Intl.DateTimeFormat` (geen date-lib); iconen als inline SVG-subset conform huisstijl (geen icon-font, geen volledige iconenlib in de bundle).
5. **Main-thread-hygiëne:** DOM-reads en -writes batchen (geen layout thrashing); geen werk in scroll-handlers; zware verwerking > 50 ms opknippen of naar een Worker.
6. **Lijst-rendering:** boven ~100 items simpele windowing; daaronder volstaat `content-visibility: auto` uit fase 1.
7. **Foto-uploads (Prikbord/Meldingen):** client-side verkleinen en comprimeren in een **Web Worker** (OffscreenCanvas, max 1600 px, WebP ~q0.8) vóór upload naar R2. Main thread blijft vrij (geen haperende animatie tijdens upload) én de upload wordt 5–10× kleiner.
**Acceptatie:** initiële JS ≤ 130 KB gzip; geen long tasks > 50 ms bij start of tabwissel; tabwissel < 100 ms tot visuele respons.
---
## 8. Fase 6 — Perceived performance: nooit wachten, nooit wit (1,5 dag)
1. **Client-SWR-helper** (Appendix A4): toon direct de laatst bekende data uit memory/localStorage, ververs op de achtergrond, update de UI subtiel. Geldt voor élke view. `staleTime` 5 min: binnen die tijd geen spinner of skeleton bij terugkeren naar een tab.
2. **Skeleton-screens i.p.v. spinners**, exact in de layout van de echte content (lijst-, kaart-, agenda-variant), met shimmer (Appendix A5). Skeleton verschijnt pas na 150 ms — bij snelle responses dus nooit een flits.
3. **Optimistic UI op alle mutaties** (bestellen, melden, RSVP, prikbord-post): UI direct bijwerken, rollback + toast bij fout. Implementatie volgens het bestaande Optimistic UI/Offline-plan; dit plan maakt het verplicht voor álle modules.
4. **Tabs blijven warm:** module-state (scrollpositie, data) cachen bij tabwissel; terugkeren = exact dezelfde staat, geen refetch binnen staleTime, geen witte flits.
5. **View Transitions** voor navigatie binnen modules: `document.startViewTransition` met feature-detect en fade-fallback (Appendix A6).
6. **Entrance-animatie alleen bij eerste mount** van een view; bij terugkeren naar een warme tab géén stagger — anders voelt herhaald navigeren juist traag.
**Acceptatie:** demo-scenario "open app → 4 tabs → terug naar Home" zonder één spinner, witte flits of layout-sprong.
---
## 9. Fase 7 — Uniformisatie: één Honk, overal (2 dagen)
### 9.1 Token-enforcement (drielaags architectuur)
- **Regel:** geen enkele hardcoded hex-, px- (spacing/radius) of duration-waarde buiten de tokenbestanden. Alles via `var(--…)` uit de bestaande drielaags architectuur (platform → tenant → derived).
- **Audit:** grep-scan (Appendix B) draaien; elke treffer fixen of expliciet whitelisten met reden.
- **Motion-tokens toevoegen** aan de platformlaag: `--dur-press: .16s`, `--dur-enter: .42s`, `--stagger: 40ms`, `--ease-spring: cubic-bezier(.2,.7,.3,1)`. Alle transities/animaties verwijzen hiernaar.
### 9.2 Componentenbibliotheek — single source
Eén gedeelde set, conform huisstijl-vocabulaire; modules mogen uitsluitend deze gebruiken:
`Button` · `Card` (statisch + hover-lift) · `ListItem` · `SectionHeader` (met gradient-accentbalkje) · `EmptyState` · `ErrorState` · `Skeleton` · `Toast` · `Sheet/Modal` · `Badge/Pill` · `Avatar` (initialen) · `AppTile` · `FAB` · `Tabbar` (bestaande v4 floating pill).
Dubbel geïmplementeerde varianten in modules verwijderen en vervangen door de gedeelde component.
### 9.3 Uniformiteitsmatrix per module
Voor elke module (Agenda, Prikbord, Meldingen, Kantine, BHV, Toernooien, Team) deze checks afvinken; resultaat als tabel in de PR:
| Check | Norm |
|---|---|
| Alleen tokens (kleur/spacing/radius/motion) | 100 % |
| Alleen gedeelde componenten | 100 % |
| Iconen: stroke 1.8, 24×24, `currentColor`, geen fills/emoji | 100 % |
| Radii: kaart 18 / control 13 / hero 24 / pill 999 | tokens |
| Schaduwen: gelaagd (`--shadow`/`--shadow-lg`), nooit één harde drop | overal |
| Loading- (skeleton), empty- én error-state aanwezig | 3/3 |
| Pagina-anatomie: header (titel + actie) → content → tabbar | identiek |
| Microcopy: actieve vorm, zelfde werkwoord door de hele flow, NL consistent | per view |
| Safe-area insets (boven/onder) correct | ja |
| Dark mode klopt via tokens (geen hex-lekken) | ja |
**Acceptatie:** grep-audit = 0 treffers; matrix volledig groen voor alle 7 modules.
---
## 10. Fase 8 — Smooth feel: motion & touch (huisstijl-handhaving) (1 dag)
De huisstijl-non-negotiables overal exact zo afdwingen:
1. **Entrance:** staggered fade-up op directe kinderen van `main` — `.42s`, 40 ms stagger, max 6 kinderen, alleen bij eerste mount (§8.6).
2. **Twee-richtingen-feedback:** kaarten/tiles hover-lift `translateY(-2px)` + diepere schaduw op `cubic-bezier(.2,.7,.3,1)` ~.16s; buttons/tappables op `:active` omlaag (`translateY(1px) scale(.99)`), tab-iconen `scale(.94)`.
3. **Alleen `transform` en `opacity` animeren.** Nooit `top/left/width/height/box-shadow` direct animeren (schaduw-lift via pseudo-element met opacity). `will-change` uitsluitend kortstondig op het element dat écht beweegt.
4. **Tabbar:** bestaande frosted pill v4 — `backdrop-filter: saturate(180%) blur(16px)`, hairline-border, actieve tab accent-tint met icoon licht omhoog/geschaald, `env(safe-area-inset-bottom)`.
5. **Scroll & touch:** app-frame volgens Appendix C4 — body scrollt nooit, elke view scrollt in een eigen container met `overscroll-behavior: contain` (geen rubber-band achter de shell, geen grijze rand). Momentum-scroll is op iOS 13+ standaard. Gemeten: geen dropped frames bij Prikbord-scroll.
6. **Reduced motion:** de globale `prefers-reduced-motion: reduce`-override blijft heilig; QA-check op alle views.
7. **Haptics-interface voorbereiden** (Capacitor): `haptic('light'|'success'|'error')`-stub in de app-laag; nu no-op, straks native. Aanroepen bij: pull-to-refresh-trigger, optimistic-confirm, error-rollback.
**Acceptatie:** 60 fps in Performance-trace bij entrance, tabwissel en lijst-scroll; reduced-motion-modus volledig statisch maar functioneel.
---
## 11. QA-matrix & regressie (binnen fase 8)
| Device/context | Checks |
|---|---|
| iPhone Safari (PWA, standalone) | 100vh/safe-area, backdrop-filter, geen rubber-band achter shell, fonts |
| Android Chrome (mid-range) | Lighthouse ≥ 95, INP < 200 ms, touch-targets |
| Desktop | hover-lift, focus-visible ring, toetsenbordnavigatie |
| Traag netwerk (Slow 4G-throttle) | skeleton-flow, SWR toont oude data direct |
| Offline | offline-state + queue uit Offline-plan |
| Dark mode | token-flip zonder hex-lekken |
---
## 12. Oplevering
1. Hermeting van álle budgets uit §0, naast de baseline uit fase 0, in `/docs/perf/resultaat.md` (tabel baseline → resultaat → budget → ✅/❌).
2. Korte changelog per fase.
3. Openstaande punten + aanbevolen vervolg (koppeling met Capacitor-conversieplan: wat hier gebouwd is — fetch-laag-caching, safe-areas, haptics-stub — is daar al op voorbereid).
**Totale inschatting: ~9,5 dagen Cowork-werk.** Fase 1 levert na dag één al zichtbaar resultaat.
---
## Appendix A — Code-snippets
### A1 · Edge-cache middleware (Hono, tenant-aware, SWR)
```ts
// middleware/edgeCache.ts — alléén voor tenant-brede GET-routes
import type { Context, Next } from 'hono';
export function edgeCache(maxAge = 60, swr = 300) {
  return async (c: Context, next: Next) => {
    if (c.req.method !== 'GET') return next();
    const tenant = c.get('tenantId'); // uit auth-middleware (Entra ID)
    const u = new URL(c.req.url);
    const key = new Request(`https://edge.honk.internal/${tenant}${u.pathname}${u.search}`);
    const cache = caches.default;
    const hit = await cache.match(key);
    if (hit) return hit;
    await next();
    if (c.res.ok) {
      const res = c.res.clone();
      const h = new Headers(res.headers);
      h.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${swr}`);
      c.executionCtx.waitUntil(
        cache.put(key, new Response(res.body, { status: res.status, headers: h }))
      );
    }
  };
}
// Invalidatie bij mutaties: caches.default.delete(keyVoorDezeRoute)
```
### A2 · D1 batch in een summary-endpoint
```ts
const [events, posts, alerts] = await env.DB.batch([
  env.DB.prepare(Q_EVENTS).bind(tenantId),
  env.DB.prepare(Q_POSTS).bind(tenantId),
  env.DB.prepare(Q_ALERTS).bind(tenantId),
]);
return c.json({ events: events.results, posts: posts.results, alerts: alerts.results });
```
### A3 · Index-voorbeelden (altijd tenant_id eerst)
```sql
CREATE INDEX IF NOT EXISTS idx_posts_tenant_created  ON posts(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_tenant_start   ON events(tenant_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_user    ON orders(tenant_id, user_id, created_at DESC);
-- Controle per query: EXPLAIN QUERY PLAN SELECT ... → geen 'SCAN' op grote tabellen
```
### A4 · Client-SWR-helper (Capacitor-proof, app-laag)
```ts
// lib/swr.ts
const mem = new Map<string, { data: unknown; ts: number }>();
const STALE_MS = 5 * 60_000;
export async function swrFetch<T>(
  url: string,
  onData: (d: T, meta: { fromCache: boolean }) => void
) {
  const k = `swr:${url}`;
  const cached = mem.get(url) ?? JSON.parse(localStorage.getItem(k) ?? 'null');
  if (cached) onData(cached.data as T, { fromCache: true });
  if (cached && Date.now() - cached.ts < STALE_MS) return; // vers genoeg: geen refetch
  const res = await fetch(url);
  if (!res.ok) return; // cached blijft staan; ErrorState alleen als er níets is
  const data = (await res.json()) as T;
  const entry = { data, ts: Date.now() };
  mem.set(url, entry);
  localStorage.setItem(k, JSON.stringify(entry));
  onData(data, { fromCache: false });
}
```
### A5 · Skeleton met shimmer (tokens, reduced-motion-proof)
```css
.skeleton{
  background: var(--line);
  border-radius: var(--r-sm);
  position: relative; overflow: hidden;
}
.skeleton::after{
  content:""; position:absolute; inset:0; transform:translateX(-100%);
  background:linear-gradient(90deg, transparent,
    color-mix(in srgb, var(--surface) 60%, transparent), transparent);
  animation: shimmer 1.2s infinite;
}
@keyframes shimmer{ to{ transform:translateX(100%);} }
/* pas tonen na 150ms — geen flits bij snelle responses */
.skeleton-wrap{ animation: skel-in 0s .15s both; }
@keyframes skel-in{ from{opacity:0} to{opacity:1} }
```
### A6 · View Transitions met fallback
```ts
export function transition(render: () => void) {
  if (document.startViewTransition) document.startViewTransition(render);
  else render();
}
```
---
## Appendix B — Audit-commando's (fase 7)
```bash
# 1. Hardcoded kleuren buiten tokenbestanden
grep -rn --include='*.css' --include='*.ts' --include='*.tsx' \
  -E '#[0-9a-fA-F]{3,8}\b' src/ | grep -v -E 'tokens|theme'
# 2. Losse spacing/radius in componenten (hoort uit tokens te komen)
grep -rn --include='*.css' -E '(margin|padding|gap|border-radius):\s*[0-9]+px' src/ \
  | grep -v -E 'tokens|theme'
# 3. Losse durations/easings buiten motion-tokens
grep -rn --include='*.css' -E '(transition|animation)[^;]*[0-9]+m?s' src/ \
  | grep -v -E 'tokens|theme'
# 4. Verboden icon-praktijken (fills, emoji, icon-fonts)
grep -rn --include='*.tsx' --include='*.html' -E 'fill="(?!none)' src/ || true
```
*Elke treffer: fixen of whitelisten met een regel uitleg in `/docs/perf/audit-uitzonderingen.md`.*
---
## Appendix C — iOS native-feel laag (PWA → Capacitor)
Eén CSS-blok, toe te passen in fase 1. Vult de eerder opgeloste iOS-quirks (100dvh, backdrop-filter op pseudo-elementen) aan. Werkt identiek in WKWebView, dus gaat 1-op-1 mee naar Capacitor.
```css
/* C1 · Geen dubbeltik-zoom-delay op interactieve elementen */
button, a, [role="button"], .apptile, .pill, .fab,
.tabbar a, input, select, label {
  touch-action: manipulation;
}
/* C2 · UI-chroom niet selecteerbaar, geen long-press menu — content WÉL selecteerbaar */
header.app, .tabbar, button, .btn, .apptile, .pill, .fab, .skeleton {
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}
input, textarea, [contenteditable] {
  -webkit-user-select: text;
  user-select: text;
}
/* C3 · Geen grijze tap-overlay — verplicht i.c.m. de press-states uit §10.2 */
* { -webkit-tap-highlight-color: transparent; }
/* C4 · App-frame: body scrollt nooit, views scrollen zelf */
html, body { height: 100%; overscroll-behavior: none; } /* iOS 16+ */
#app  { height: 100dvh; display: flex; flex-direction: column; overflow: hidden; }
.view { flex: 1; overflow-y: auto; overscroll-behavior: contain; }
```
**Toelichting & valkuilen:**
- **C2 bewust níet globaal (`*`)**: gebruikers moeten tekst uit Prikbord-posts, Meldingen en bestel-details kunnen kopiëren (telefoonnummers, adressen). Alleen UI-chroom blokkeren.
- **C3 alleen samen met press-states.** Tap-highlight weghalen zonder de huisstijl-pressfeedback (`translateY(1px) scale(.99)`) maakt taps "dood" — beide horen bij elkaar, zelfde commit.
- **C4 vervangt de `position: fixed`-hack op body.** Die oude truc breekt scroll-restore en geeft beruchte sprongen wanneer het iOS-toetsenbord een input focust. Alleen als allerlaatste fallback voor ≤ iOS 15 inzetten, met die caveat gedocumenteerd.
**Bewust níet doen (verouderd/overbodig):**
1. `-webkit-overflow-scrolling: touch` — momentum is sinds iOS 13 standaard; de property is genegeerd op moderne iOS en veroorzaakte historisch juist renderbugs (verdwijnende content, stacking-context-issues). Niet toevoegen; bestaande voorkomens verwijderen.
2. `user-select: none` op `*` — zie C2.
3. Custom "Zet op beginscherm"-prompt — overslaan: de Capacitor-conversie levert straks echte App Store-installatie; tijd hier niet aan besteden.
4. De 300ms-tapvertraging zelf bestaat met de juiste viewport-meta al niet meer; C1 vangt alleen het resterende dubbeltik-zoom-gedrag op controls af.
**Web Workers (aanvulling op §7.7):** in Honk is fotocompressie vóór R2-upload het enige reële zware client-werk. Patroon: `worker.postMessage(file)` → OffscreenCanvas resize/encode → WebP-blob terug → optimistic upload met voortgangs-toast. Datafetching hoort *niet* in een Worker; dat lost de SWR-laag (§8) al op.
