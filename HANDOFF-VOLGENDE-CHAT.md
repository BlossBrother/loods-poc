# Handoff — verder in een nieuwe Cowork-chat

> Lees dit + `PROJECT-CONTEXT.md` als eerste. Daarna ben je ready.
> Bijgewerkt: 7 juni 2026, na build v58 (emoji-403 + reacties-direct-zichtbaar; v57 = emoji dev-fix; v56 = Competitie->Fun).

## Huidige staat (schoon)
- **Laatste build: v89** · **PWA-cache: ff-v64** (`src/pwa.ts`).
- `npx tsc --noEmit` groen, Linux-esbuild-bundel schoon. Alles hieronder is af + gezipt (v56).
- Deploy: zip uitpakken over de projectmap -> `npm run deploy`. Alle D1-migraties
  (t/m `0006_emoji_reacties`) staan al live toegepast; alleen code deployen.
- v56 wijzigt GEEN database/schema; puur frontend/menu.

## Net afgerond in v56
**Structurele basis "Competitie -> Fun" + per-gebruiker-toggle.**
1. `src/views/layout.ts`, `MOD_BLOCKS`: sectie-`title` "Competitie" -> **"Fun"**.
   Module-key blijft `competitie`; alleen de zijbalk-sectiekop veranderde.
2. `navGroup()` kreeg `data-section="${title}"` op de `.navsec`-wrapper.
3. **Per-gebruiker-toggle** (apparaat-lokaal, geen DB-kolom): in Mijn account
   (`src/views/account.ts`) nieuwe kaart **"Weergave"** met checkbox
   "Fun-onderdelen in het menu tonen". Schrijft localStorage `ff_hide_fun`.
4. Flikker-vrij verbergen: inline `<script>` direct na `<body>` in `layout.ts`
   injecteert bij `ff_hide_fun==="1"` een `<style id="ff-hide-fun-style">`-regel
   die `[data-section="Fun"]` verbergt (draait bij parse, vóór de zijbalk).
   De account-checkbox voegt/verwijdert diezelfde style live + toast.
> Tenant-brede per-onderdeel-toggles bestonden al via Beheer -> Modules + de module-guard.

## v89 — compose-sheet keyboard-proof (iOS Safari + PWA + Android) — premium behouden
Bevestigd: iPhone. Oorzaak = iOS-gedrag waarbij een input in een `position:fixed`-overlay
de laag van het scherm duwt bij toetsenbord-focus. Fix (premium slide-up sheet blijft):
- **VisualViewport-sync**: bij open sheet zet JS `--ff-kb` (toetsenbordhoogte) en `--ff-vh`
  (zichtbare hoogte); sheet-CSS `bottom:var(--ff-kb,0)` + `max-height:min(92dvh, calc(--ff-vh - 12px))`.
  De sheet blijft zo bóven het toetsenbord -> iOS hoeft niet te scrollen -> geen flyaway.
- **viewport-meta** `interactive-widget=resizes-content` (Android/Chromium native juist).
- **auto-focus verwijderd** (één trigger minder); gebruiker tikt zelf, sheet beweegt mee.
- Premium afgeronde bottom-sheet (max 92dvh, slide-up) + swipe-back-guard (v88) blijven.
> Test: prikbord/agenda/meldingen + -> tik veld, typ, open keuzemenu -> sheet blijft staan, boven keyboard.

## v102 — 2 UI-bugfixes (prikbord)
1. **Roze balk boven reacties** weg: `.reactie` had `margin-top:10px`, en de absolute swipe-
   "Verwijderen"-achtergrond (berry, `inset:0`) vulde die marge -> roze strook. Fix:
   `.reactie.swipe-fg{ margin-top:0; }` (border-top/padding blijven als scheiding).
2. **Undo-snackbar** netter: was een felwit blok (`var(--ink)`-bg in dark) met afbrekende tekst.
   Nu surface-bg + rand, `width:max-content` + `white-space:nowrap` -> nette 1-regel-balk.
   Cache `ff-v77`, tsc+esbuild groen.
> Donderdag verder met Buddee (geautoriseerd service-account + voorbeeld-leave-response -> mapping).
## v101 — Verlof-planner per afdeling + realistische demo (op echt team)
- **`verlof.afdeling`-kolom** toegevoegd (migratie `0008_verlof_afdeling.sql`; **al toegepast op prod
  via de D1-connector** -> niet opnieuw runnen, alleen voor verse/lokale deploys).
- **Planner herbouwd**: toont nu ALLE actieve medewerkers, **gegroepeerd per afdeling** (Tuin/Breeding/
  Concepts/Prebreeding/HR & Finance/Directie), met gekleurde cellen waar verlof is + samenvatting
  "X van Y collega's deze week weg". `getActiveMedewerkers` (naam/email/afdeling) in `verlof.ts`; route
  levert het team mee aan `verlofPage`.
- **Demo-data server-side geseed** in D1 (source='demo', op basis van de echte `medewerkers`, ~25 van 43
  met verlof gespreid over 2 weken; GEEN namen in de repo). Vervangen/bijwerken: `DELETE FROM verlof
  WHERE source='demo';` + opnieuw seeden, of de Buddee-sync (source='buddee') zodra creds er zijn.
  Cache `ff-v76`, tsc+esbuild groen, render-getest.
> Deploy v101 -> `/agenda?view=verlof` toont meteen het volledige team per afdeling met demo-verlof.
> Buddee live: nog wachten op geautoriseerd service-account + 1 voorbeeld-`leave`-response (mapping).
## v100 — Buddee (HR) verlofkoppeling + Verlof-weergave in de agenda (fundering)
Wens directeur: verlof van iedereen in 1 agenda-overzicht. Gekozen: **afwezigheidsplanner**
(medewerkers x werkdagen) als aparte weergave `/agenda?view=verlof`, gevoed via **dagelijkse
cron-sync naar D1** (cron stond al op `0 3 * * *`).
**Gebouwd:**
- `migrations/0007_verlof.sql`: tabel `verlof` (+ index) met **6 demo-rijen** (source='demo') zodat
  de planner meteen iets toont. De Buddee-sync raakt alleen `source='buddee'` aan.
- `src/verlof.ts`: `getVerlofInRange`, `replaceBuddeeVerlof` (idempotent: delete buddee-rijen + insert).
- `src/buddee.ts`: auth **Basic (e-mail:wachtwoord) -> POST /auth/token -> JWT -> Bearer** (gedocumenteerd),
  haalt `/employees?active=1` + `/leave_registrations?status=approved`, mapt naar verlof-rijen.
  **Veld-mapping is defensief + geisoleerd (`mapRegistration`) met TODO** — exacte veldnamen nog
  bevestigen met een echte `/leave_registrations`-response.
- `src/index.ts`: route `view=verlof` (planner), `POST /agenda/verlof/sync` (beheerder, handmatig
  verversen), en dagelijkse `syncVerlof(env)` in de scheduled-handler (alleen als creds gezet).
- `src/views/agenda.ts`: `verlofPage` (planner) + Verlof-pill in de agenda-header. Env: `BUDDEE_EMAIL/PASSWORD`.
  Cache `ff-v75`, tsc+esbuild groen, planner render-getest met demo-data.
**Deploy/aan-de-praat:** (1) deploy v100; (2) migratie toepassen:
`npx wrangler d1 execute fresh-forward-db --remote --file=migrations/0007_verlof.sql`; (3) open
`/agenda?view=verlof` -> demo-planner. **Voor echte data:** `wrangler secret put BUDDEE_EMAIL` +
`BUDDEE_PASSWORD`, en een voorbeeld-`/leave_registrations`-response zodat de veld-mapping exact wordt;
daarna "Ververs uit Buddee" of de nachtelijke cron.
> NB: base-URL `https://api.buddee.nl`. Verlof-resource vermoedelijk `/leave_registrations`.
## v98/v99 — consistente in/uit-microanimaties (menu + alle overlays)
**v98 — menu:** de "Meer"-popover opent met een zachte spring-overshoot (origin rechtsonder) en
sluit nu **strak en snel** (asymmetrisch: enter spring/`--dur-base`, exit `--dur-fast` ease-in);
de menu-secties **zetten zich gestaffeld neer** bij openen en sluiten vlot mee.
**v99 — huis-patroon doorgerold:** zelfde enter/exit-grammatica (**enter = zachte ease-out
`--dur-base`, exit = strak ease-in `--dur-fast`**) op de **bottom-sheet**, **lightbox**, **scrim**,
**toasts** en **undo-snackbar**. Plus: een verwijderd lijst-item **glijdt netjes weg** (fade +
translateX) i.p.v. abrupt verdwijnen, en **glijdt terug** bij "Ongedaan maken". Cache `ff-v74`,
tsc+esbuild groen.
> **Live geverifieerd (freeze-preventie):** `elementFromPoint(midden)` = pagina-content vóór én na
> menu-toggle — geen enkele overlay blokkeert klikken. (Bevestigd dat v97 live staat: lightbox
> aanwezig én niet-blokkerend.) Alleen `transition`-timing gewijzigd; verberg/pointer-logica intact.
> VOLGENDE (op verzoek PJ): **Buddee (HR) API-koppeling** -> Verlof van iedereen in 1 agenda-overzicht
> (aparte weergave `view=verlof`). Architectuur + benodigde API-info nog te bespreken.

## v97 — HOTFIX freeze (v96 lightbox dekte het scherm af) + ronde 2 quick wins
**Incident:** v96 liet de hele app "vastlopen" (geen klikken/navigeren, iPhone+iPad+desktop).
**Oorzaak (live gevonden via Chrome-MCP):** `.ff-lightbox{ display:flex }` overschreef het
`hidden`-attribuut (UA `[hidden]{display:none}` heeft lagere specificiteit) -> de lightbox lag
onzichtbaar (opacity:0) maar `display:flex` over het hele scherm (`inset:0`, z-index 205) en ving
ALLE tikken op. `elementFromPoint(midden)` gaf `#ff-lightbox` terwijl die "hidden" was.
**Fix (`layout.ts`):** globale regel `[hidden]{ display:none !important; }` — dekt lightbox,
snackbar en elk toekomstig hidden-element. Live bevestigd: na de regel is het bovenste element in
het midden weer de pagina-content. **Les:** tsc/esbuild vangen geen CSS/overlay-runtime-bugs; nieuwe
full-screen overlays altijd live testen met `elementFromPoint`.
**Ronde 2 (quick wins, meegnomen in v97):**
- **Licht/donker-toggle** (Systeem/Licht/Donker) in Mijn account > Weergave; donker-vars ook onder
  `:root[data-theme="dark"]`, media-query alleen zonder handmatige keuze; pre-paint tegen flash.
- **Focus-trap** in de sheet (Tab/Shift+Tab blijven binnen; focus terug naar de trigger bij sluiten).
- **Knop-laadstaat + dubbel-submit-guard** op navigerende formulieren (spinner; `[data-undo]`/GET uitgesloten).
Cache `ff-v72`, tsc+esbuild groen.
> Deploy v97 en test op één toestel: open/sluit een foto (lightbox), klik gewoon rond (geen freeze),
> verwijder iets (undo-snackbar), wissel thema in Mijn account.

## v96 — Premium-parity, ronde 1 (wow): lightbox + undo-snackbar + shared-element
Op basis van `PREMIUM-PARITY-CHECKLIST.md` (wow-dingen eerst, dan de rest stapsgewijs):
1. **Foto-lightbox + pinch-zoom** (`layout.ts`): tik op een `.zoomable`-afbeelding (prikbord-post +
   nieuws) -> full-screen overlay; 2-vinger pinch-zoom (1-4x), pan bij ingezoomd, dubbeltik-zoom,
   sluiten via veeg-omlaag / Esc / sluitknop. Pointer-events, desktop+touch.
2. **Undo-snackbar i.p.v. confirm** (`layout.ts` + `social.ts` + `meldingen.ts`): verwijderen/
   archiveren met `[data-undo]` verbergt het item meteen + toont "Ongedaan maken" (5s). Bij undo
   herstellen; anders de delete alsnog versturen (fetch; `sendBeacon` bij weg-navigeren). `confirm()`
   eruit op prikbord-post/reactie + meldingen-archief.
3. **Shared-element lijst->detail** (`agenda.ts`): event-titel morpht van de dag-weergave naar
   `eventDetail` via `view-transition-name:evt-<id>` (uniek per pagina; Chromium-only, valt elders
   terug op de fade). Cache `ff-v71`, tsc+esbuild groen.
> Nog uit de checklist (volgende rondes, "rest gradueel"): optimistic posten (vergt JSON/HTML-
> endpoint dat het item teruggeeft), focus-trap in de sheet, knop-laadstaat + dubbel-submit-guard,
> licht/donker-toggle, blur-up/compressie bij upload, offline-indicator + acties-in-wachtrij,
> page()/detail() overal. Zie PREMIUM-PARITY-CHECKLIST.md.
> Test: lightbox op een prikbord/nieuws-foto; verwijder een bericht -> "Ongedaan maken"; agenda
> dag-weergave -> event openen (Chromium) voor de morph.

## v95 — compose-finetune + Sprint B/finesse (deploybaar)
**Compose (vervolg op v93-portal-fix, nu bevestigd werkend op iPhone):**
- **iOS auto-zoom weg:** velden in de sheet op `font-size:16px` (iOS zoomt anders in op <16px).
- **Sleepbaar sluiten:** de sheet volgt nu de vinger en sluit voorbij de drempel (70px); armt op de
  sleep-handle of vanaf bovenin de sheet als die bovenaan staat (niet op een veld). touchcancel-safe.
**Sprint A:** al af (v87, calm surfaces). **Sprint B:** koppen-tracking zat al in (h1/h2/h3); nu ook
**tabulaire cijfers** (`font-variant-numeric:tabular-nums` op body + `.tnum`) -> saldo/ELO/tellers/
datums lijnen uit en springen niet bij doortellen. **Sprint C (finesse):** press-states/transities/
focus-visible/reduced-motion waren al breed aanwezig; consistentie aangevuld met `.pill`/`.subtab`
press-scale. Cache `ff-v70`, tsc+esbuild groen.
> **Bewust NIET gedaan (om de werkende build niet te destabiliseren terwijl PJ weg was):** Sprint C
> "page()/detail() overal" = invasieve refactor over alle modules, niet betrouwbaar te verifiëren
> zonder render-run. Klaar om als losse, gerichte ronde op te pakken (per module: lijst->page(),
> detail->detail(), form->formPage()), met render-smoke per scherm. Zie REVIEW-EN-FINETUNE.md punt 1.

## v94 — compose: iOS auto-zoom + sleepbaar (tussenstand, opgenomen in v95)
16px-velden tegen iOS-zoom; sleepbare bottom-sheet. (Volledig opgenomen in v95.)

## v93 — ECHTE rode draad gevonden: fixed-sheet zat binnen de scrollende .shell (iOS-bug)
**Dit verklaart ALLE eerdere mislukkingen (v85-v92).** Via live Chrome-MCP-onderzoek + 2 video's:
de compose-sheet (`position:fixed`) stond in de DOM **binnen `DIV.shell`** — de app-shell-scroller
(`overflow-y:auto`). Op **iOS Safari** gedraagt een `position:fixed`-element binnen een overflow-
scroll-container zich fout: wel zichtbaar, maar verkeerd geplaatst/geklemd → **niet-interactief,
of het "vliegt weg", of tikken landen op de verkeerde laag → sluit**. Op desktop speelt dit niet
(daar werkte het altijd). Geen JS-sluiter, geen stacking-trigger op de ouders, geen vh-feedbacklus —
het zat puur in de fixed-binnen-scroll-container.
**Fix (`layout.ts`):**
1. **Portal:** `open()` hangt de sheet op mobiel bij het openen direct onder `<body>` (buiten
   `.shell`) via `document.body.appendChild(el)` + reflow. Daar werkt `position:fixed` correct op iOS.
   (Live geverifieerd: na portal is de enige ouder `<body>`.)
2. **Terug naar PARTIËLE bottom-sheet** (gebruiker wilde GEEN volledig scherm): afgeronde kaart
   (`border-radius:22px 22px 0 0`, max 88dvh), van onderaf opschuivend met behoud van slide + easing
   en toetsenbord-bewuste bottom (`--ff-kb`).
3. Normale sluit-opties hersteld: sleep-handle (tik/veeg-omlaag) + tik naast de sheet (scrim),
   met focus-guard (600ms) tegen iOS-ghost-clicks. Cache `ff-v68`, tsc+esbuild groen.
> Test iPhone (Safari + PWA, app eerst volledig uit de app-switcher vegen ivm SW-cache): + ->
> partiële sheet schuift omhoog; typ, open dropdown, kies bestand -> blijft staan EN reageert;
> sluiten via veeg-omlaag op de handle of tik naast de sheet.

## v92 — compose definitief gefixt: volledig-scherm + ALLEEN bewust sluiten
**Bevestigd via video + live Chrome-MCP-onderzoek op de draaiende build:** de sheet sloot op
iPhone zodra je een veld/dropdown/"Kies bestand" aanraakte (desktop ok, geen toetsenbord). JS-
sluiters, stacking en een vh-feedbacklus zijn allemaal uitgesloten (open-staat = CSS-klasse `.open`,
nooit afgeleid uit hoogte; geen resize-handler sluit). **Oorzaak:** iOS-ghost-click — bij het tikken
in een control komt het toetsenbord/keuzewiel op, de layout verschuift, en de ~300ms vertraagde
synthetische click landt nét naast het veld op de scrim of de sleep-balk (die pal boven het eerste
veld zat) → close.
**Fix (`layout.ts`, centrale sheet = prikbord+meldingen+agenda in één):**
1. Compose is nu een **volledig-scherm view** (`position:fixed; inset:0; height:100dvh`, eigen scroll)
   met **premium slide-up + easing behouden** (`transform:translateY(100%)->none; transition var(--dur-screen) var(--ease-out)`).
2. **Sluiten kan ALLEEN bewust:** een ✕-knop rechtsboven (de oude sleep-`.sheet-handle` is nu die
   ✕, ver van de velden) + Escape. Beide via `closeAll(true)`.
3. **Alle accidentele sluit-paden weg:** scrim-tik-sluit verwijderd, veeg-omlaag-sluit verwijderd.
   Er bestaat nu geen niet-bewuste `closeAll`-aanroep meer -> tikken in veld/dropdown/bestandskiezer
   kan 'm per definitie niet sluiten. Cache `ff-v67`, tsc+esbuild groen.
> Test iPhone (Safari + PWA): + -> formulier schuift volledig-scherm omhoog; tik in tekst, open de
> dropdown, kies een bestand -> blijft staan; sluiten alleen via ✕ rechtsboven of Escape.

## v91 — iPhone: compose sloot bij focus (iOS ghost-click) — opgelost
**Symptoom (na v90):** op iPhone opende de sheet en bleef staan, maar **schoof dicht zodra je
in een veld tikte** (desktop = ok, want geen toetsenbord). JS-sluiters + stacking waren al
uitgesloten (live geverifieerd via Chrome-MCP: geen handler haalt `.open` weg, sheet z=201 >
scrim z=200, geen getransformeerde ouders). **Oorzaak:** iOS-ghost-click. Bij tikken in een veld
komt het toetsenbord op → de layout verschuift (sheet omhoog via `--ff-kb`) → de ~300ms vertraagde
synthetische `click` landt nét naast het veld op scrim/handle → `closeAll()` → sheet schuift dicht.
**Fix (`layout.ts`):** `closeAll(force)` negeert een niet-bewuste close binnen **600ms na een
veld-focus in de sheet** (`lastFocus` gezet in de `focusin`-handler). Escape = `force` (altijd).
Bewust sluiten (scrim/handle ná het typen, of later) werkt gewoon. Cache `ff-v66`, tsc+esbuild groen.
> Test iPhone: prikbord/agenda/meldingen → + → tik in een veld en typ → blijft staan; sluiten via
> handle/scrim/Escape werkt nog. Als het tóch nog sluit: volgende stap = volledig-scherm native
> compose-view (veld = gewoon document-element, toetsenbord 100% native) i.p.v. fixed bottom-sheet.

## v90 — ECHTE oorzaak compose "schiet terug": FAB opende via hash i.p.v. JS
**Eindelijk de kern.** De + (FAB) linkte via `href="/social#ff-compose"` → de sheet opende
puur via CSS `:target`, NIET via de JS `open()`. Daardoor:
- de swipe-back-guard checkte `.sheet-m**.open**`, maar de sheet had die klasse nooit
  (open via `:target`) → guard bleef scherp → terug-veeg bij typen vuurde `history.back()`;
- de hash voegde een **history-entry** toe → één kleine veeg → terug naar de hash-loze URL
  → `:target` matcht niet → **sheet klapt dicht ("schiet terug naar prikbord")**;
- `closeAll()`/scrim/Escape/handle deden niets (werken op `.open`). Het hele JS-sheet-systeem
  werd omzeild → álle fixes v85–v88 (die op `.open` mikten) konden nooit werken.
**Fix:** `PRIMARY` gebruikt nu `sheet`-ids i.p.v. `href`-hash → `fab()` rendert een
`data-sheet`-knop → `open()` draait (klasse `.open`, `body.sheet-open`, scrim, scroll-lock,
focus). Geen hash, dus geen history-entry → `history.back()` kan de sheet niet meer sluiten.
Prikbord (`social.ts`) + meldingen (`meldingen.ts`) compose kregen hun `card sheet-m` +
sleep-handle terug (waren in de halve revert inline `card` geworden); agenda had het al goed.
**Extra hardening:** swipe-back-touchstart + pull-to-refresh `blocked()` herkennen nu óók
`.sheet-m:target` én `body.sheet-open` (defense-in-depth). Cache `ff-v65`, tsc + esbuild groen.
> Test mobiel: prikbord/agenda/meldingen → + opent de slide-up; tik in elk veld, typ, veeg een
> beetje — blijft staan; sluiten via handle/scrim/Escape. Niets schiet meer terug.

## v88 — ECHTE oorzaak compose-bug: swipe-back-handler + premium bottom-sheet
**Oorzaak gevonden:** de swipe-to-go-back/drawer-handler was óók actief met een open sheet
en armde al bij een aanraking <=28px van de linkerrand — precies waar een tekstveld in de
sheet begint. Tikken om te typen kon zo `history.back()` triggeren -> pagina "schiet weg".
**Fix:** die handler armt nu NIET tijdens een open `.sheet-m.open` en NIET op input/textarea/
select/button/a/label of binnen een `.sheet-m`.
**Plus:** full-screen modaal teruggedraaid naar een **nette afgeronde bottom-sheet** (max 92dvh,
border-radius top, eigen scroll, slide-up) — premium i.p.v. heel-scherm. focusin-scrollIntoView
+ body.sheet-open verbergt FAB/botnav blijven.
> Test: prikbord/agenda/meldingen -> + open de sheet, tik in elk veld, typ -> blijft staan; niets schiet weg.

## v87 — popover-animatie + Sprint A (calm surfaces)
- **"Meer"-popover** opent nu met een mooiere pop-vanuit-de-hoek (origin bottom-right,
  scale .9 + lichte spring-overshoot `cubic-bezier(.34,1.26,.64,1)`).
- **Sprint A (Set 3 restraint):** knoppen + actieve nav/pill-highlights zijn nu **solide**
  (geen 180deg-gradient meer = moderner/premium), met strategische CTA-elevatie (subtielere
  schaduw). Basis-`.card` heeft een **rustiger** schaduw; diepte bewaard voor hover/overlays/FAB.
  Kaart-marge via ruimte-token (`--sp-3`). Decoratieve icoon/avatar-gradients (135deg) gelaten.
> Vervolg-finetune: Sprint B (tabular numbers op saldo/ELO/tellers + koppen-tracking),
> Sprint C (interactie-finesse + page()/detail() overal).

## v86 — OPDRACHT 8: compose-formulieren centraal gefixt (volledig-scherm modaal)
De bottom-sheet (prikbord/agenda/meldingen) bleef onbetrouwbaar (sluiten bij focus, FAB
overlapt "Plaatsen", valt half over titel/lege-staat). Centraal opgelost: `.sheet-m` is op
mobiel nu een **volledig-scherm modaal** (`position:fixed; inset:0; height:100dvh; eigen
overflow-y`), schuift van onderaf op (`translateY(100%)`).
- Toetsenbord: eigen scroll + `focusin`-scrollIntoView -> actief veld komt boven het
  toetsenbord; focus sluit niets meer.
- Geen overlap: de modaal dekt alles; `body.sheet-open` verbergt FAB + bottom-nav.
- Sluiten alleen via handle (tik/veeg-omlaag op de handle), scrim, Escape, close.
Eén gedeelde component -> alle compose-formulieren in één klap goed. Desktop = inline kaart (ongewijzigd).
> Daarna: premium-finetune (Sprint A: calm surfaces + ruimte-ritme).

## v85 — sheet-bug (toetsenbord sluit sheet) + VT-shake fix
- **Bottom-sheet sloot bij tikken in een veld** (prikbord/agenda/meldingen): de "veeg-omlaag-
  om-te-sluiten" vuurde bij elke neerwaartse touchmove (toetsenbord opent / inhoud scrollt).
  Nu **alleen** als de veeg op de `.sheet-handle` start. Sluiten verder via scrim/Escape/handle.
  (Auth was niet de oorzaak — reacties onder nieuws werken, audit-log heeft writes.)
- **Zijwaartse "shake" bij schermwissel**: de richting-bewuste view-transition (horizontale
  slide) leesde als een schok. Vervangen door een rustige **cross-fade** (geen translateX);
  pagereveal zet alleen nog `vt-nav` (stagger uit op navigatie).
> Security: workers.dev is je ENIGE hostname en zit achter Access -> fallback-auth is veilig;
> JWT-verificatie (Deel A) is optioneel en stond corruptie/typfout-gevoelig (wrangler.toml NUL-
> corruptie trad weer op bij Windows-edit -> opgeschoond, ACCESS-vars weer uit). Edit toml voortaan via shell.

## v84 — finetune: a11y-focusring + trainingen op page()
- **Toegankelijkheid (Set 3 #129)**: globale `:focus-visible`-ring (2px accent) op links,
  knoppen, nav-items, sub-tabs, pills, emoji, summary, sluit/menu-labels — duidelijke
  toetsenbord-/schermlezer-focus.
- **Templates doortrekken**: `trainingenLijst` nu via `page({title,intro,children})`.
> Doorlichting + finetune-plan staat in `REVIEW-EN-FINETUNE.md`. SECURITY-P1 (JWT-verificatie
> + workers.dev achter Access) = IT/config-actie. Volgende finetune: meer page()/detail()-wraps,
> strategische elevatie/radius-audit, lijst->detail shared-element-overgang.

## v83 — uitleg-teksten bijgewerkt (welkomst-tour)
De eerste-login tour klopte niet meer (noemde "menu linksboven" + linker-veeg). Nu:
**Navigatie** = kernmodules vast onderin + "Meer" rechtsonder; nieuw **Gebaren**-item
(terug-vegen, swipe-acties, pull-to-refresh); **Feedback** = via Meer -> Bug melden.
Andere intro's (meldingen, beheer "Menu-indeling") gecheckt en nog correct.

## v82 — premium-pass deel 2: emoji count-tick (Set 1 #110)
De emoji-teller telt nu **soepel door** i.p.v. te verspringen: bij een reactie krijgt het
getal een korte `countTick` (slide+fade, --dur-fast, ease-out) — alleen wanneer de telling
echt verandert, niet bij paginalaad. Naast de bestaande emoji-bounce (pop) + haptiek.
> NOG: evt. meer micro-anims ("verzonden"-vinkje), strategische elevatie verfijnen;
> page()-wrap resterende paginas; intro/uitleg-teksten.
> ONTHOUDEN: iOS-haptiek alleen via native wrapper (Capacitor/WKWebView) — platform-spoor.

## v81 — iOS haptiek-fallback
`navigator.vibrate` werkt niet op iOS (WebKit). `window.ffHaptic` gebruikt nu eerst
`navigator.vibrate` (Android); als die ontbreekt/faalt, togglet het een verborgen
`<input type="checkbox" switch id="ff-haptic-switch">` — dat triggert de Taptic Engine
op iOS 17.4+. Best-effort, degradeert netjes (geen effect waar niet ondersteund).

## v80 — premium-pass deel 1: haptiek-laag + frosted overlay
- **Haptiek uitgebreid** (Set 2 #116) via `window.ffHaptic`: toggles/checkboxes = lichte
  puls (5ms, `change`), submit-knoppen = succes-tik (12ms), naast bestaande nav-tap (6),
  emoji (12), sheet-open (10/8), pull-to-refresh (14), swipe-verwijder (thump). iOS = no-op.
- **Frosted overlay** (Set 3 selectieve glassmorphism): het "Meer"-popovermenu gebruikt nu
  `backdrop-filter blur` (zoals de bottom-nav/header), voor een samenhangende premium look.
> NOG TE DOEN (premium-pass deel 2): meer micro-animaties (tellers soepel doortellen,
> "verzonden"-vinkje), strategische elevatie; page()-wrap resterende paginas; intro-teksten.

## v79 — emptyState-migratie (stap 3 vervolg)
Top-level lege staten gemigreerd naar `emptyState()` (consistent, premium): trainingen
(lijst/detail/beheer), competitie (overzicht/ranglijst/toernooien), bugmeldingen,
noodmeldingen — naast prikbord/home (v78). `—`-plaatshouders en kaart-interne meldingen
(friet/meldingen/agenda) bewust inline gelaten (geen geneste kaarten).
> NOG TE DOEN — premium-pass (gevraagd): (1) **haptiek-laag** uitbreiden (Set 2 #116:
> toggles=lichte puls, grens=bump, verwijderen=thump, succes=tik); (2) **micro-animaties**
> + **frosted/overlay-stijl** (Set 1 + Set 3 glassmorphism, met mate). Plus: page()-wrap
> resterende pagina's; uitleg/intro-teksten.

## v78 — stap 3 start: prikbord + home op de templates
- **Prikbord** (`social.ts`) gemigreerd naar `page({title:"Prikbord", children})` en de lege
  staat naar `emptyState({icon:"board", ...})`. Compose-sheet + feed ongewijzigd.
- **Home** (`intranet.ts`): blijft een dashboard (hero), maar de lege staten (nieuws,
  documenten) gebruiken nu `emptyState()` voor consistentie.
> VOLGENDE: overige modules migreren (agenda/kantine/competitie/meldingen/trainingen) op
> page/detail/formPage + emptyState/skeleton. Daarna de uitleg/intro-teksten.

## v77 — popover/safe-area/stagger-fixes + layout-templates (stap 2)
Testfeedback verwerkt:
- **"Meer"-popover smaller** (min(74vw,272px)) en de **witruimte boven "Menu"** weg (erfde
  per ongeluk `safe-area-inset-top` van de oude full-height drawer -> nu vaste kleine padding).
- **Witruimte ONDER de bottom-nav** (home-indicator safe-area, te groot in de webapp) **gecapt**
  op ~6px via `min(env(safe-area-inset-bottom), 6px)`; FAB + popover daarop uitgelijnd.
- **Stagger/stutter bij navigeren**: kwam doordat de fix op de Navigation API/VT leunde, die
  iOS Safari niet heeft. Nu cross-browser via `sessionStorage`: kaart-stagger speelt alleen bij
  de **koude start** van de sessie; bij elke navigatie `html.vt-nav` -> `main .card{animation:none}`
  (zonder !important, zodat inline `ffArrive` voor nieuw item blijft werken).
**Stap 2 (layout-templates):** `src/views/templates.ts` met `page/detail/formPage/emptyState/
skeletonList` + bijbehorende CSS. Nog niet overal toegepast — dat is stap 3 (modules migreren,
start prikbord/home).
> Daarna: uitleg/intro-teksten.

## v76 — grote plaatje stap 1: Set 3 look & feel globaal (typografie)
`src/views/layout.ts`: type-schaal nu token-gedreven en overal toegepast — `body` krijgt
`--fs-body`/`--lh-body` (1.65 regelafstand), `h1/h2/h3` gebruiken `--fs-h1/h2/h3` +
`--lh-tight`, met consistenter kop-ritme. Tokens gematigd bijgesteld (h1 1.62 / h2 1.2 /
h3 1.08) om layout-sprongen te vermijden. Leesbare tekstbreedte (`max-width:70ch`) op
`.post .body`, `.reactie .body`, `.richtext` (editorial). Tilt elk scherm in één keer.
> VOLGENDE (grote plaatje): stap 2 = layout-templates (PageLayout/DetailLayout/FormLayout);
> stap 3 = modules migreren op die templates (start prikbord/home). Daarna uitleg-teksten.

## v75 — module-iconen in beheer (OPDRACHT 5.1) + drawer rechts-geankerd
- **OPDRACHT 5.1**: elke module-unit in het beheerscherm toont nu z'n **eigen icoon uit de
  uniforme set** (precies één, dient ook als sleep-grip). `svg` geexporteerd uit layout.ts;
  `beheerModules`-unit gebruikt `m.icon`. Groep-grip blijft de drag-dots.
- **Drawer counter-intuitief**: "Meer" zit rechtsonder maar de drawer kwam van links.
  Het "Meer"-menu is nu een **opwaartse popover/ballon** (rechtsonder, boven de bottom-nav;
  scale+slide vanuit de hoek, scrim sluit). Linkerrand-veeg = puur terug (swipe-to-go-back).
> OPEN: OPDRACHT 5.2 (modulebeheer verplaatsen — plek bepaalt PJ), intro/uitleg-teksten
> (PJ wijst het scherm aan). Daarna terug naar het grote plaatje (polish/structuur).

## v74 — animatie-polish: stotter (OPDRACHT 6) + soepel nieuw item (OPDRACHT 7)
- **OPDRACHT 6 (stotter bij openen)**: bij navigeren speelden de view-transition én de
  gestaggerde kaart-entrance tegelijk = dubbele animatie/stotter. `pagereveal` zet nu
  `html.vt-nav`; CSS `html.vt-nav main .card{ animation:none }` -> op navigaties speelt
  alleen de paginaovergang. Op een koude load (geen inkomende VT) blijft de kaart-stagger.
- **OPDRACHT 7 (abrupt na plaatsen)**: na een actie-redirect (`?ok=`) komt het nieuwste
  item nu soepel binnen via `@keyframes ffArrive` (fade + slide van boven, --dur-screen,
  ease-out) op de eerste `main article/.post/.card:not(.sheet-m)`. Respecteert reduced-motion.
> OPEN: OPDRACHT 5.1 (max 1 icoon/module), 5.2 (modulebeheer verplaatsen — plek later), intro-teksten.

## v73 — drawer/"Meer"-menu redesign (Set 4)
`src/views/layout.ts`: de mobiele drawer (geopend via "Meer") heeft nu een **kop** met
titel "Menu" + **sluitknop** (close-icoon, `<label for=navtoggle>`), is **breder**
(min(87vw,340px)) en **ruimer** (rijen 48px, icoon+label, luchtige sectiekoppen). Drawer
is een mini app-shell: kop vast bovenaan, `nav` scrollt eronder (veilige-zone-padding).
Alles mobiel-gescoped; desktop-zijbalk ongewijzigd (`.side-head` daar verborgen).
> OPEN: OPDRACHT 6 (stotter bij openen) + 7 (abrupte downslide na plaatsen) — animatie-polish;
> OPDRACHT 5.1 (max 1 icoon/module) + 5.2 (modulebeheer verplaatsen, plek later); intro-teksten.

## v72 — bottom-bar app-shell fix + emoji max-1 (OPDRACHT 4)
- **Bottom-bar zweefde mee bij scrollen/overscroll en zat hoog op lege schermen** (klassiek
  iOS-gedrag: fixed chrome beweegt mee bij body-overscroll). Opgelost met een **app-shell**
  (mobiel): `body{height:100dvh;overflow:hidden;display:flex;flex-direction:column}`,
  `header.app` + `.botnav` = `flex:0 0 auto` (vast), `.shell{flex:1;overflow-y:auto}` is de
  enige scroller. `.botnav` nu `position:static` (geen fixed meer). `footer` verborgen op
  mobiel (Bug melden zit in het menu). Desktop ongewijzigd.
- **OPDRACHT 4**: `toggleEmoji` (airtable.ts) dwingt nu **max 1 emoji per gebruiker per
  bericht** af: dezelfde nogmaals = toggle uit; een andere = verwijder eerst de bestaande,
  voeg dan de nieuwe toe. Tellers blijven kloppen.
> OPEN: zijbalk/"Meer"-drawer redesign (gevraagd); OPDRACHT 5 (max 1 icoon/module + verplaats
> modulebeheer, plek later), 6 (stutter bij openen schermen), 7 (abrupte downslide na plaatsen),
> intro-teksten.

## v71 — duim-menu herzien (Set 4 #3): bestemmings-bottom-nav + sub-tabs + FAB
Bottom-bar toonde submodules (botste met Set 4 #3 "bottom-bar = kernfuncties" + wisselende
betekenis). Nu in `src/views/layout.ts`:
- `bottomNav(active, roles)`: **Home + de eerste 3 ingeschakelde modules + "Meer"** (uit het
  nav:-token, dus config-gedreven). Icoon+label, actieve gemarkeerd (groen), 1 tik wisselen.
  "Meer" = `<label for=navtoggle>` -> opent de volledige drawer (alle groepen + Account/Beheer).
- `fab(active)`: zwevende primaire **＋** (FAB) rechtsonder boven de nav; opent de sheet
  (prikbord/agenda/meldingen) of linkt. Verschijnt alleen waar een PRIMARY bestaat.
- **Sub-tabs** (`subTabs`) nu OOK op mobiel zichtbaar (horizontaal scrollbaar onder de header),
  niet meer alleen desktop. Oude `.botbar/.botsub/.botbtn` vervangen door `.botnav/.fab`.
Geverifieerd (render): home=botnav+Meer+Home-actief+geen FAB; social=FAB+ff-compose; ranglijst=subtabs+actief.
> OPEN: intro/uitleg-teksten reviewen (taak). Daarna Fase 4 (module-migratie op templates).

## v70 — swipe uitgebreid + long-press
- **Swipe-to-delete** nu ook op **nieuws-reacties** (`intranet.ts`) en **prikbord-reacties**
  (`social.ts`), alleen waar verwijderen mag (owner/admin). Zichtbare "verwijder"-knop
  blijft als alternatief. Verberg-form per reactie (`nrdel-`/`srdel-<id>`), bevestiging behouden.
  (Content-rijke post-kaarten bewust NIET swipebaar gemaakt — te risicovol met velden erin.)
- **Long-press** toegevoegd aan de swipe-laag (`layout.ts`): ~450ms indrukken onthult de
  actie (haptiek + ontdekbaarheid), tik elders sluit. Eén gebaar-betekenis door de app.
**OPEN (taak):** intro/uitleg-teksten reviewen die na de rework niet meer kloppen —
Peter-Jan moet aangeven welk scherm; gedaan bij de wrap-up.
> VOLGENDE: evt. richer long-press-contextmenu; anders Fase 4 (module-migratie op templates).

## v69 — Set 2 gebaren: swipe-to-go-back + swipe-acties
- **Swipe-to-go-back**: de linkerrand-veeg (voorheen alleen menu openen) gaat nu **terug**
  als er in-app historie is (same-origin referrer + history.length>1), anders opent-ie het
  menu (fallback). Koppelt aan de back-paginaovergang (v67). Menu blijft via bottom-bar ☰.
- **Swipe-acties op lijstitems** (herbruikbare laag in `layout.ts`): sleep `.swipe-fg` naar
  links voorbij de drempel -> klikt de `.swipe-bg`-actie (haptische thump). Toegepast op
  **meldingen** (swipe-links = archiveren); de zichtbare knoppen blijven als alternatief
  (Set 2-regel). Alleen horizontaal, niet op knoppen/velden; verticaal scrollen normaal.
  Patroon makkelijk uit te breiden naar reacties/posts (zelfde `.swipe`/`.swipe-bg`/`.swipe-fg`).
> VOLGENDE: swipe uitbreiden naar reacties/posts; long-press (Set 2 #115); daarna Fase 4 (module-migratie).

## v68 — UI-fixes (testfeedback)
- Nieuws-reactie op home: "Stuur"-knop nu volle breedte op mobiel (`.cmtform` media-query;
  input + knop stacken full-width i.p.v. knop links).
- Agenda add-event sheet: sleep-handle zat in een wrapper buiten de kaart en zweefde
  boven het kader. `eventForm(.., sheet=true)` zet nu de sheet-classes + handle in de form
  zelf (net als prikbord); agendaPage roept dat aan i.p.v. de wrapper-div. (`raw` geimporteerd.)
- Bottom-bar submodules werden links/rechts afgesneden bij 3 items (centrering kniptte de
  randen): `.botsubs` nu `justify-content:safe center` + padding/scroll-padding -> scrollt netjes.

## v67 — lijst->detail-overgang (Set 1 #104)
`src/views/layout.ts`: bovenop `@view-transition{navigation:auto}` nu richting-bewuste
paginaovergangen. Vooruit (push/replace, dus lijst->detail) = nieuw scherm schuift van
rechts in + fade; terug (traverse) = andersom. Via `pagereveal` + `navigation.activation.
navigationType` wordt `html[data-vt=fwd|back]` gezet; keyframes vtInRight/vtOutLeft/
vtInLeft/vtOutRight (--dur-screen, --ease-out). Chromium-only (zoals VT zelf); elders
geen overgang (geen schade). `reduced-motion` zet alles uit (bestaande guard).
> NB: echte shared-element-morph (kaart groeit naar detail) is bewust NIET gedaan —
> fragiel cross-document; de directionele overgang geeft de premium feel betrouwbaar.
> VOLGENDE (polish-ronde): swipe-acties op lijstitems (+ zichtbare knop), swipe-to-go-back,
> wegglij-animatie bij verwijderen. Daarna Fase 4 (module-migratie).

## v66 — polish op feedback (incl. UX-sets als referentie opgeslagen)
> **Belangrijk:** de vier UX-sets staan nu in de repo als `UX-SETS-premium-referentie.md`
> (+ `REDESIGN-framework-first.md`). Neem die parameters (timings/easing/gebaren/looks/IA)
> over de hele linie mee bij elke verdere ronde.
Feedback van Peter-Jan verwerkt:
- **Dubbele hamburger weg**: de top-burger is verborgen op mobiel; de ☰ in de bottom-bar
  (duim-zone) is de enige menu-ingang.
- **Pull-to-refresh**: native browser-PTR uitgezet (`overscroll-behavior-y:contain`) zodat
  hij niet dubbel komt; indicator volgt nu de vinger 1:1 (`.dragging` = geen transitie) en
  eased bij loslaten (settle via `--ease-out`).
- **Agenda-＋ en Meldingen-＋ openen nu als slide-up sheet** (zelfde mechanisme als prikbord):
  create-form in een `.sheet-m` (#ff-agenda-new / #ff-meld-new), `PRIMARY` -> sheet. Edit
  in agenda blijft inline. Desktop = gewone kaart.
- **Haptiek breder**: tik bij emoji-reactie (12ms) + subtiele tik op nav/actie-taps
  (botsub/botbtn/subtab/navitem/pill/emojibtn, 6ms) via `window.ffHaptic`. iOS = no-op.
- **Press-feedback** steviger (scale ~0.96 knoppen / .97 tiles+navitem) — fysieker.
**Nog open (Set 1/2):** lijst->detail shared-element-overgang, swipe-acties op lijsten,
swipe-to-go-back, long-press, wegglij-animatie bij verwijderen. Daarna Fase 4 (module-migratie).

## v65 — pull-to-refresh (Set 2, Fase 4 start)
`src/views/layout.ts`: herbruikbare pull-to-refresh-laag (mobiel, alleen bij scrollY=0,
geblokkeerd als een `.sheet-m.open` of het menu open is). Rubber-band indicator
(`#ptr`, merk-kleur, refresh-icoon) die meegroeit/roteert met de pull; loslaten boven
drempel = haptische tik + `location.reload()`. `refresh`-icoon toegevoegd. Geverifieerd
(render). NB: verse content leunt op de SWR-revalidatie van de service worker.
> VOLGENDE: PageLayout/DetailLayout-templates (Laag 2) + modules verder migreren; evt.
> echte AJAX-refresh (main-swap met SW cache-bypass) als reload-flits storend blijkt.

## v64 — navigatiemodel afgemaakt: submodules als sub-tabs (desktop)
`src/views/layout.ts`: zijbalk toont nu **alleen head-modules** (competitie/kantine in
HEAD_LINKS; `moduleNavItems` = head-only). Submodules verschijnen als **sub-tabs**
bovenin de content via `subTabs(active, roles)` (alleen als >=2 submodules), op desktop;
op mobiel blijven ze in de bottom-bar (sub-tabs verborgen <=880px). Head-link wordt
actief gemarkeerd als je in die module zit. Geverifieerd: sub-tabs + active op
/competitie/ranglijst, geen sub-tabs op home. IA nu consistent (audit-punt opgelost).
> VOLGENDE: Set 2-gebaren (pull-to-refresh op feeds) of Fase 4 (module-migratie op de
> nieuwe componenten/templates, start prikbord/home). Evt. eerst PageLayout/DetailLayout/FormLayout (Laag 2).

## v63 — OPDRACHT 1: modulebeheer met groepen, gevoed uit één config
**Config-model** `src/nav.ts` (tenant-scoped, app_settings keys `nav_groups` +
`nav_module_groups`; aan/uit blijft in `modules`). `getNavLayout()` = groepen + alle
modules met group/order/enabled (defaults: Werk/Fun/Persoonlijk). Save: `saveNavGroups`,
`saveModuleGroups`. `navSidebarPayload()` -> compact `{g,m}` payload.
**Zijbalk uit dezelfde bron**: middleware (`src/index.ts`) zet één rol-token
`nav:<json>`; `sidebar()` in `layout.ts` rendert daaruit de groepen (modules mét
submodules uit de SUBMODULES-registry; vaste staart Account + Beheer). Fallback op
MOD_BLOCKS als het token ontbreekt. `mod:`-tokens blijven voor de module-guard.
**Beheerscherm** (`beheerModules` in `src/views/beheer.ts`): grouped units met
drag&drop (desktop) + "verplaats naar…" en omhoog/omlaag (mobiel; sleep-handle
verborgen <560px), aan/uit-schakelaar per module, groep toevoegen/hernoemen/
verplaatsen/verwijderen. Eén verborgen `layout`-veld serialiseert alles; POST
/beheer/modules slaat op via saveNavGroups/saveModuleGroups (+ enabled + shoutouts).
Geverifieerd: render + opslaan->teruglezen-rondgang. Server-side module-guard ongewijzigd.
> NB: `getModulesOrdered`/`moveModule` niet meer gebruikt (uit imports verwijderd).
> VOLGENDE: desktop sub-tabs voor submodules (i.p.v. inline in zijbalk) + Set 2-gebaren
> (pull-to-refresh) + Fase 4 module-migratie.

## v62 — sheet-fixes (feedback v61)
- De prikbord-+ werd een "stip": de `<button>` erfde de globale knop-padding. `.botbtn`
  neutraliseert nu padding/min-height/box-shadow/margin -> +-icoon weer correct.
- "Plaatsen" stond linksonder in de sheet: submit-knoppen in `.sheet-m` zijn nu volle breedte (mobiel).
- `src/nav.ts` (config-model voor groepen + module->group/order) staat al klaar maar is
  NOG NIET gekoppeld; dat is v63 (OPDRACHT 1 sleep-beheerscherm + zijbalk uit die config).

## v61 — motion-laag (Set 1) + bottom-sheet (Set 1/2)
Op de tokens van v60: motion app-breed, token-gedreven, `reduced-motion`-veilig.
- `src/views/layout.ts`: enkele transitions gemapt naar motion-tokens; cross-document
  `@view-transition { navigation: auto }`; gelaagde **entrance** op `main .card`
  (fadeUp, gestaggerd); **skeleton**-utility (`.skeleton`); emoji **micro-bounce**
  (`.emojibtn.pop`) na een geslaagde reactie.
- **Bottom-sheet**: de + in de bottom-bar (prikbord) opent nu een van-onder opschuivende
  sheet i.p.v. te navigeren. Generiek systeem: `[data-sheet]` opent, scrim-tap/Escape/
  omlaag-vegen/`[data-sheet-close]` sluit; haptische tik (`navigator.vibrate`).
  `PRIMARY.prikbord = { sheet: "ff-compose" }`. Het prikbord-compose-formulier
  (`src/views/social.ts`) kreeg class `sheet-m` + id `ff-compose` + sleep-handle.
  Mobiel = bottom-sheet (verborgen tot +); desktop = gewoon inline kaart (sheet-CSS is
  mobiel-only). `.sheet-m` uitgesloten van de entrance-animatie (transform-conflict).
**VOLGENDE:** v62 = OPDRACHT 1 (sleep-beheerscherm + groepen-config in D1) op dit systeem;
daarna evt. Set 2-gebaren breder (pull-to-refresh op feeds) + Fase 4 module-migratie.

## v60 — redesign-fundament (Laag 0): designsysteem-tokens + stijlgids
Framework-first gestart. In `src/views/layout.ts` `:root` toegevoegd (additief, niets
gewijzigd aan bestaande styling): **motion-tokens** (`--dur-fast/base/screen`,
`--ease-out/in/standard`), **type-schaal** (`--fs-caption..h1`, `--lh-*`), **witruimte**
(`--sp-1..6`), **radius-xs**, **elevatie** (`--elev-1/2/3`) en **z-lagen** (`--z-*`).
`prefers-reduced-motion` was al gehonoreerd. Nieuwe **/stijlgids**-route (beheerder-only,
`src/views/stijlgids.ts`) toont kleur/type/ruimte/radius/elevatie/motion + kerncomponenten
(knoppen, veld, pills, emoji-bar, lege staat) met live demo (toast, replay-entrance,
skeleton->content cross-fade). Dit is de bron waar de volgende lagen op bouwen.
**VOLGENDE:** v61 = OPDRACHT 1 (sleep-beheerscherm + groepen-config in D1) bovenop deze
tokens/componenten; daarna Fase 1 (componentbibliotheek formaliseren) -> Fase 4 (module-migratie).
> Tip: open `/stijlgids` als beheerder om het fundament te beoordelen vóór we verder bouwen.

## v59 — navigatiemodel: head-modules + submodules onderin (duim-zone)
Vastgelegd nav-model (zie ook `NAV-AUDIT-set4.md`): head-modules via zijbalk/drawer,
submodules onderin op mobiel. Toegevoegd in `src/views/layout.ts`:
- `SUBMODULES` (competitie: Overzicht/Ranglijst/Toernooien; kantine: Bestellen/Saldo/Beheer),
  `PRIMARY` (prikbord/agenda/meldingen), `PATH_HEAD` + `headModuleForPath()`.
- `bottomBar(active, roles)`: vaste mobiele balk (duim-zone, alleen <=880px): links de
  drawer-toggle (head-modules), midden de submodules van de actieve module, rechts de
  primaire actie (+). Desktop ongewijzigd (zijbalk blijft). `main` krijgt padding-bottom op mobiel.
- Ankers `#ff-nieuw` op de social- en meldingen-formulieren; agenda + via `/agenda?new=1`.
NB: bestaande inline subitems in de zijbalk (competitie/kantine) staan er nog; die gaan in
v60 naar in-scherm sub-tabs (desktop) als onderdeel van het sleep-beheerscherm.
**VOLGENDE: v60 = OPDRACHT 1** (sleep-beheerscherm + groepen-config in D1) die dezelfde
nav voedt, daarna het **redesign-fundament** (UX-sets: tokens -> componenten -> motion/gebaren -> looks).

## Bugfix in v58 — emoji "log opnieuw in" (403) + reacties pas na navigatie
**OPDRACHT 2 (emoji-403):** `wrangler.toml` heeft `ACCESS_TEAM_DOMAIN/ACCESS_AUD`
uitgecommentarieerd -> `resolveAccessEmail` draait in fallback en las alleen de header
`cf-access-authenticated-user-email`. Bij paginanavigaties zet Access die header (form-
posts werkten), maar bij `fetch()`/XHR (emoji) ontbreekt-ie vaak terwijl het
`CF_Authorization`-cookie wel meekomt -> geen identiteit -> 403 -> "log opnieuw in".
**Fix:** `src/access.ts` leest in fallback nu ook de `email`-claim uit het Access-
cookie (JWT, zonder verificatie — niet zwakker dan de header-fallback) als de header
ontbreekt. Empirisch: fetch-case levert nu het juiste e-mailadres. Daarnaast krijgen
`/api/reactie` + nieuwe `/api/reacties` dezelfde identiteits-middleware als gewone
paginas (alleen `/api/modules` blijft licht), en `/api/reactie` resolvet via
playerId -> getPlayerByEmail -> medewerkerVoorEmail (`reactieIdentiteit()`).
> Aanrader voor productie: zet alsnog ACCESS_TEAM_DOMAIN+ACCESS_AUD voor echte JWT-verificatie.
**OPDRACHT 3 (reactie pas na navigatie):** `/nieuws/reactie` (+ verwijder) redirectten
naar `/#nieuws-x` zonder `?ok=` -> de service worker serveerde de gecachte home.
Nu `/?ok=1#nieuws-x` (cache-bust, zoals `/social` al deed). Plus: nieuwe GET
`/api/reacties` + on-load client-reconciliatie in `layout.ts` werkt de (mogelijk
gecachte) emoji-balken bij naar de serverstand, zodat tellingen ook na herladen kloppen.
**Testen (apart):** emoji aantikken -> telt op + blijft na herladen; reactie plaatsen
-> meteen zichtbaar; verwijderen -> meteen weg; alles zonder handmatig terug naar home.
> Let op: `src/access.ts` is in deze ronde één keer afgekapt door de Edit-tool en via
> de shell hersteld — bevestig dat cookieValue/medewerkerVoorEmail/isBeheerderVoor er nog in staan.

## Bugfix in v57 — emoji-reacties registreerden niet
**Oorzaak:** in `DEV_MODE` gaf `resolveAccessEmail()` `undefined` terug, dus
`me`/`kanReageren` werd `false` -> de emoji-knoppen renderden `disabled` (maar met
`opacity:.75`, dus ze leken klikbaar). Lokaal kon je dus "klikken" zonder dat er iets
gebeurde, terwijl de rest van de app je wél als beheerder behandelde. (In productie
werkt identiteit via de Access-header; daar is de schrijftabel `emoji_reacties` simpelweg
nog leeg omdat de PoC vers geseed is.)
**Fix:**
1. `src/access.ts`: in dev geeft `resolveAccessEmail` nu een concrete identiteit
   (`DEV_EMAIL`, anders de eerste `BEHEERDER_EMAILS`). Deze tak draait nooit in
   productie (DEV_MODE staat alleen in `.dev.vars`). `DEV_EMAIL?` toegevoegd aan `Env`.
2. `src/views/layout.ts`: de emoji-fetch checkt nu `res.ok` + JSON-content-type en
   toont een **toast** bij mislukken (403/sessie of 5xx) i.p.v. stil te falen.
> Dezelfde dev-identiteitsfix herstelt ook reacties-onder-nieuws en "nieuws gezien" lokaal.
> Let op: voor volledige lokale werking moet de lokale D1 een medewerker met dat e-mailadres bevatten.

## VOLGENDE RONDE — nieuwe features uit het werkdocument
Bron: uploads `COWORK-GEEF-DIT-VOLLEDIG.md` (compleet) + `openstaand-werk-overzicht.md` (Deel A).
Kandidaten die in deze stack passen:
- **Polls & surveys** (nieuwe module).
- **Documenten/kennisbank (FAQ)** (uitbreiding op documenten + R2).
- **Fun-onderdelen** (elk eigen module-key, onder "Fun"): weddenschappen-poule,
  challenges & teamdoelen, lief-en-leed/"het potje" (let op AVG), seizoens-/oogstmomenten.
- Markttrends: offline-PWA, AI-zoeken via Copilot, auto-vertaling, analytics-dashboard.

## Buiten scope van DEZE cowork (apart spoor)
Het **platform-spoor** (multi-tenancy, Entra-onboarding, Stripe-billing, CRM) hoort in de
aparte platform-cowork — zie `PLATFORM-SPOOR-CONTEXT.md`. Ook commercieel + businessplan daar.

## Werkwijze (belangrijk)
- **Schrijf/wijzig bestanden via de shell** (bash/heredoc/python), NIET via Edit/Write.
  Na schrijven: `npx tsc --noEmit` (0 fouten) + losse Linux-esbuild bundelcheck
  (`npm i esbuild` in /tmp; tmp kan per sessie resetten -> desnoods opnieuw installeren).
- **D1** via de Cloudflare-connector (`d1_database_query`) of `wrangler d1 execute`.
- **Na elke ronde** PWA-cache `CACHE` in `src/pwa.ts` ophogen; app 1x sluiten/heropenen.
- Per ronde: verkennen -> bouwen -> verifiëren -> cache-bump -> docs bij -> zip leveren.
