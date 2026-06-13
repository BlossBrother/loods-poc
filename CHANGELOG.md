# Changelog — Fresh Forward intranet & klantenportaal

> Doorlopend logboek van wijzigingen. Bovenaan het nieuwste. Bijgewerkt: 9 juni 2026.
> Werkwijze: één Cloudflare Worker (Hono + TS, server-rendered). Per ronde: code →
> `npx tsc --noEmit` (0 fouten) → Linux-esbuild bundelcheck → PWA-cache ophogen
> (`CACHE` in `src/pwa.ts`) → versie-zip. D1-schemawijzigingen worden live toegepast
> op `fresh-forward-db` (id `db5f9671-5f68-459c-a41e-5accece9233e`, EU).
> Deploy: zip uitpakken over de map → `npm run deploy` (vanuit **cmd**, niet PowerShell).

---

### v215 — AI-R1: meertalig embeddingmodel (bge-m3) + herindex-migratie  (PWA ff-v187)
- `EMBED_MODEL` van `bge-base-en-v1.5` (Engels, 768 dims) naar **`@cf/baai/bge-m3`**
  (meertalig, 1024 dims, goedkoper). Betere Nederlandse retrieval = vaker een raak
  kennisbank-antwoord en minder doorvallen naar de trage web/algemeen-stap (pakt ook
  de snelheidsklacht aan de bron). Nulmeting vóór: 20/46 vragen (~43%) door kennisbank.
- **Migratie verplicht (Vectorize-index 768→1024, niet uitwisselbaar) — door PJ:**
  `npx wrangler vectorize delete ff-kb` →
  `npx wrangler vectorize create ff-kb --dimensions=1024 --metric=cosine` →
  `npx wrangler vectorize create-metadata-index ff-kb --property-name=audience --type=string`.
  Dán `push` + `npm run deploy`, dán herindexeren (Beheer → reindex / POST /api/kennisbank/reindex).
  Tussen delete en reindex valt de kennisbank even leeg (assistent valt dan door naar web/algemeen).

### v214 — Hotfix: streaming-assistent viel niet door van kennisbank naar web/algemeen  (PWA ff-v186)
- Symptoom (PJ): "Hoeveel mensen wonen er in Arnhem?" gaf "UIT DE KENNISBANK — ik kan
  dit niet vinden" i.p.v. een Tavily/algemeen-antwoord (v1.0 deed dat wél).
- Oorzaak: in de v212-streamingroute koos `beslisBron` de bron puur op retrieval-hits.
  De vector-zoek matcht met drempel 0.3 bijna altijd íets (losse chunks), dus mode werd
  "kennisbank", het 70B-model weigerde correct ("niet in de context"), maar er was geen
  doorval meer naar web/algemeen — die zat alleen in het oude (niet-streaming) `/api/assist`.
- Fix: `beslisBron` voert nu dezelfde cascade als v1.0 — kennisbank via `ask()` (mét
  weigering-doorval), dán web (Tavily), dán algemeen. Kennisbank-antwoorden komen
  gebufferd terug (al goedgekeurd), web/algemeen streamen token-voor-token. De route
  stuurt een gebufferd kennisbank-antwoord als één blok, en streamt alleen web/algemeen.

### v213 — Hotfix: assistent-knop werkte niet (syntaxfout in inline script)  (PWA ff-v185)
- De streaming-client-JS uit v212 staat als string in een template-literal in
  `layout.ts`; daardoor werd elke geschreven `\n` door TS omgezet naar een ECHTE
  regelovergang in de uitgestuurde JS → een regex/string-literal over twee regels →
  **SyntaxError → het hele assistent-script (incl. de sparkle-openknop) deed niets**.
  tsc ziet dit niet (het zit in een string). Fix: `\n` → `\\n` op vier plekken
  (`indexOf("\\n\\n")`, `split("\\n")`, 2× `replace(/\\n/g,"<br>")`). De server-SSE in
  index.ts gebruikt terecht echte newlines (geen template-literal-string).

### v212 — AI-assistent: modelwissel-nazorg + streaming + 70B + dart/UX-fixes  (PWA ff-v184)
> **LET OP (geverifieerd 13/6):** de "vanavond al gedane" modelwissel stond NIET in
> deze repo — `rag.ts`/`kennisdump.ts` hadden nog het uitgefaseerde
> `llama-3.1-8b-instruct` + oude parsing. Hier alsnog volledig (en verbeterd) gedaan.
- **Taak 1 — centraal model:** `GEN_MODEL`/`EMBED_MODEL`/`CLASS_MODEL` geëxporteerd
  uit `rag.ts`; `kennisdump.ts` importeert ze (losse modelstring weg). Eén plek.
- **Taak 2 — tolerante parser:** `leesAntwoord()` (+`leesDelta()` voor streaming)
  leest zowel `{response}` (oud) als `{choices[].message.content}` (OpenAI-formaat).
  Op alle generatie-/classificatieplekken. Leeg = fout: in `ask()` valt een leeg of
  weigerend antwoord door naar web/algemeen (nooit meer `answered:true` op een lege).
- **Taak 3 — `max_tokens:300`** op alle generatiecalls (ask/web/algemeen + classificatie).
- **Taak 4 — logging:** alle AI-catches loggen nu `console.error("ai:…", e)` (rag, route, kennisdump).
- **Taak 5 — weigering soepeler:** leeg/heel kort (<20 tekens) telt als weigering;
  lang/normaal antwoord blijft staan (minder onnodige extra generaties). Eén plek (`isWeigering`).
- **Taak 6 — streaming:** nieuwe SSE-route `POST /api/assist-stream`. `beslisBron()`
  kiest de bron uit retrieval (kennisbank → web → algemeen) zodat normaal één generatie
  vuurt; label + bronnen + intranet-treffers komen als `meta` vóór het eerste token,
  daarna stream van het antwoord (`delta`). FTS-treffers + bronbesluit draaien parallel.
  De client valt bij élke streaming-fout terug op het bestaande `/api/assist` (JSON),
  dus een streaming-probleem kan de assistent niet breken. Chatgeschiedenis in
  `sessionStorage` (overleeft een onverhoopte reload).
- **Taak 10 — zwaar model:** `GEN_MODEL = @cf/meta/llama-3.3-70b-instruct-fp8-fast`
  (leestekst); classificatie op `@cf/meta/llama-3.2-3b-instruct`. Samen met streaming
  live, zodat de tragere 70B niet als stilte voelt.
- **Taak 7 — assistent-paneel:** (7a) alleen interne links sluiten het paneel; externe
  bronlinks openen in een nieuw tabblad en laten het antwoord staan. (7b)
  `overscroll-behavior-y:contain` op het paneel + `:none` app-breed (stond er al) →
  geen pull-to-refresh-reload; chat in `sessionStorage` als vangnet. (7c) paneelhoogte
  volgt de inhoud tot `70dvh`, pas dáárboven interne scroll.
- **Taak 8 — darts:** Spotify-embed werkte niet door ontbrekende CSP `frame-src`
  (viel terug op `default-src 'self'` → wit blok); `frame-src https://open.spotify.com`
  + `media-src 'self' https: blob:` toegevoegd, iframe `allow` met autoplay. Shotcaller:
  iOS audio-/speech-unlock op de eerste aanraking (warmTTS). NB: een Spotify-speler ín
  de dart pit zelf zit (nog) niet in de code — alleen op de accountpagina; los te bouwen.
- **Taak 9 — sparkle-knop:** dekkende pil (`--card-hi`/`--surface` + `--line`-rand)
  i.p.v. transparant, zodat het icoon niet wegvalt over content (light + dark via tokens).

### v211 — Pulse-surveys (anoniem) + vandaag-kop bevestigd  (PWA ff-v183)
- **Pulse-surveys (Beheer → Pulse, nieuw — migratie 0023 vereist):** anonieme
  peilingen als kaart in de home-feed (Workvivo-patroon). Eén vraag tegelijk actief;
  type schaal 1–5 of meerkeuze. **Anoniem by design**: het antwoord (pulse_antwoorden)
  bevat géén persoonskoppeling; dubbel stemmen wordt voorkomen via pulse_stemmers met
  een onomkeerbare HMAC-hash van het e-mailadres die NIET aan het antwoord gekoppeld is.
  Resultaten verschijnen pas vanaf **5 reacties** en worden **niet per afdeling**
  uitgesplitst (privacy bij kleine groepen, 47 medewerkers). Beheer: vraag activeren
  (sluit de vorige), live resultaat met balkjes + gemiddelde, vraag sluiten. Home-kaart
  alleen voor herkende gebruikers die nog niet stemden; stem via POST /pulse/antwoord
  (?ok=pulse omzeilt de SW-cache). src/pulse.ts + src/views/beheer.ts (beheerPulse) +
  home2.ts (kaart). **Draaien:** `npx wrangler d1 execute fresh-forward-db --remote --file=migrations/0023_pulse.sql`
- **Vandaag-kop**: geverifieerd dat de "VANDAAG"-sectie op home (datum, statusvraag,
  events vandaag, kantine) al live is sinds v201–v205; geen herbouw nodig. Resterend
  rapport-puntje (kantine-deadlinetijd "tot 10:30") staat als kleine optionele
  vervolgklus genoteerd.

### v210 — Security-hardening (Ronde 0) + beheerbare snelkoppelingen  (PWA ff-v182)
**Security (deepcheck 12/6 — geen nieuwe migraties nodig):**
- **Portaal-bestands-IDOR dicht** (§3.1): `/portaal/bestand` serveert nu alleen
  sleutels die bij GEPUBLICEERDE portaal-content horen (klantdocumenten/rassen/
  teeltadvies/snoei) via `portaalKeyToegestaan()` — voorkomt dat een ingelogde klant
  interne of andermans bestanden ophaalt door een sleutel te raden. Faalt dicht.
- **Portaal-afbeeldingen via `/portaal/bestand`** i.p.v. het interne `/bestand`
  (`portalAsset()` in views/portal.ts): `/bestand` zit achter Access (alleen
  /portaal* krijgt de bypass), dus content-afbeeldingen (rassen/teelt) zouden voor
  externe klanten geblokkeerd zijn — nu lopen ze via de portaal-route mét allowlist.
- **`/bestand` eist een interne identiteit** (§3.3, defense-in-depth) — geen serveren
  meer zonder Access-identiteit.
- **Key-entropie**: upload-sleutels gebruiken nu `crypto.randomUUID()` i.p.v. 6
  base36-tekens (medewerkers/nieuws/docs/klantdocs).
- **CSRF-hardening** (§3.4): nieuwe middleware weigert state-changing POSTs die
  aantoonbaar cross-site zijn (Sec-Fetch-Site, met Origin-Host-terugval); server-naar-
  server endpoints (PUSH_API_KEY) en GET/HEAD blijven ongemoeid.
- **Open-redirect dicht** (§3.5): `veiligTerug()` valideert de `back`-parameter
  (competitie) en de notificatie-`url` — alleen interne paden, geen `//evil`.

**Beheerbare snelkoppelingen (Beheer → Snelkoppelingen, nieuw):** de app-tegels op
home (Buddee, TimeChimp, WK-poule + eigen links) zijn nu beheerbaar zonder code/deploy:
label, URL, icoon, aan/uit en volgorde, opgeslagen als JSON in `app_settings`
(src/tiles.ts, zelfde patroon als header/modules). Standaard = exact de bestaande
env-tiles, dus zonder config verandert er niets. Lost o.a. de "WK-poule verbergen na
het WK"-klus op (uitvinken i.p.v. code wijzigen). URL-validatie: alleen https/intern pad.

### v209 — Livegang-klaar: welkomsttour v2 + demo-verlof eruit  (PWA ff-v181)
- **Welkomsttour vernieuwd** (interne livegang volgende week): scrollbaar gemaakt
  (content > viewport werd afgekapt — melding PJ; body scrollt nu in een eigen
  laag, knop vast onderin, safe-areas), inhoud geactualiseerd (assistent,
  ochtendvraag/Vandaag-chip, meldingen, "we zijn net live — meld bugs!") en
  localStorage-key v1→v2 zodat iedereen 'm bij de livegang één keer opnieuw ziet.
- **Demo-verlofdata eruit** (PJ; Buddee-API volgt later): migratie
  0022_verwijder_demo_verlof.sql — `DELETE FROM verlof WHERE source != 'buddee'`.
  /vandaag + Vandaag-chip tonen tot de koppeling dus geen (neppe) afwezigen.
- **Migratie-nummering gerepareerd**: mijn 0005/0006 botsten met bestaande
  bestanden (map liep al t/m 0019) → hernummerd naar **0020_kennisdump.sql** en
  **0021_event_rsvp.sql** (idempotent; oude bestanden zijn redirect-comments).
  Draaien: `npx wrangler d1 execute fresh-forward-db --remote --file=migrations/00NN_….sql`
  voor 0020, 0021 en 0022.

### v208 — Desktop-tegels schalen netjes  (PWA ff-v180, meegeleverd in v209)
- Beheer-/app-tegels (appgrid) kropen op desktop naar 160px en braken titels
  mid-woord ("Pushmeldin g", "Medewerke rs"). Min-kolombreedte naar 13.5rem en
  auto-fit → auto-fill (consistente tegelbreedte, geen uitgerekte laatste rij).
  Geldt voor alle appgrid-gebruikers (beheer-hub e.a.).

### v207 — Chips-rij alleen horizontaal scrollbaar  (PWA ff-v179, meegeleverd in v208)
- De header-chips op home waren ook verticaal sleepbaar (PJ): de onzichtbare
  44px-hit-area (::after, inset -6px) stak boven/onder de rij uit, en bij
  overflow-x:auto wordt overflow-y impliciet ook auto. Fix: verticale padding
  in de rij (6px, marges gecompenseerd: 13/2 → 7/-4) zodat de hit-area past,
  plus expliciet overflow-y:hidden en touch-action:pan-x.

### v206 — AI-webzoek (Tavily) + analytics-dashboard  (PWA ff-v178, meegeleverd in v207)
- **Webzoek in de assistent-keten** (TAVILY_API_KEY staat als secret): de keten is
  nu intern zoeken → kennisbank (bronnen) → **web** → algemene kennis. `webZoek()`
  (rag.ts): Tavily basic search (1 credit), top-5 fragmenten, NL-samenvatting via
  het eigen LLM, bronchips openen in een nieuw tabblad (target=_blank), label
  "Van het web (AI)". Webzoek is een verrijking: elke fout valt stil terug op
  algemene kennis. Gratis tier = 1.000 credits/mnd — alleen échte vragen die de
  kennisbank niet kent kosten een credit.
- **Beheer → Analytics (nieuwe tegel)**: geaggregeerd, privacyvriendelijk
  (alleen tellingen): actief deze week/vandaag (user_module_seen, x/N + %),
  assistent-vragen 7d + % intern beantwoord (ask_log), ochtendvraag-respons
  vandaag (aanwezigheid_status), prikbord 7d (posts+polls), leesregistraties
  (gezien/bevestigd). Plus: activiteit-per-dag-staafjes (14d) en module-bereik
  (unieke gebruikers per module, 7d) — pure CSS, geen chart-library
  (HONK §7.4: dependencies snoeien). Elke bronquery defensief; src/analytics.ts.
  Meet vanaf nu het effect van de adoptie-acties en nieuwe features.

### v205 — RSVP op events + aanwezigheid als chip + nieuws-cascade  (PWA ff-v177, meegeleverd in v206)
- **RSVP ("Ben je erbij?")** op agenda-event-detail: Ja/Nee-knoppen + teller +
  voornamen ("7 collega's komen — Anna, Bram, …"), idempotent per persoon,
  omschakelen kan altijd. Alleen op (semi-)toekomstige events; defensief zonder
  tabel. **Migratie 0006_event_rsvp.sql** (PJ draait 'm op live D1). Op tijd voor
  de Fresh BBQ van 3 juli. POST /agenda/event/:id/rsvp.
- **Aanwezigheid als chip** (PJ): "Vandaag"-chip bovenin de header-rij (naast
  WK-poule/Buddee/TimeChimp) mét afwezigen-teller → /vandaag. De afwezigen-regel
  in de vandaag-kaart is weg; de one-tap-statusvraag (v204) blijft als actie.
  Literatuur-onderbouwing: ambient info hoort glanceable (chip + teller),
  de eigen actie verdient de kaart-positie. WK-poule-chip verdwijnt na het WK.
- **Nieuws-verwijder-cascade** (zelfde patroon als agenda v203): notificaties
  (match "nieuws-<id>") + kennisbank-doc `kbnws_<id>` gaan mee weg.
- **AI-webzoek voorbereid (besluit)**: Brave Search API is niet meer gratis
  (melding PJ) → **Tavily**: 1.000 gratis credits/maand, geen creditcard
  (basic search = 1 credit). PJ maakt key op tavily.com en zet
  `npx wrangler secret put TAVILY_API_KEY`; de keten-integratie volgt als v207.

### v204 — "Waar werk je vandaag?"-ochtendflow + avatar-fix  (PWA ff-v176, meegeleverd in v205)
- **Ochtend-push (08:15 Amsterdam, ma-vr)**: "Waar werk je vandaag?" met deeplink
  naar /vandaag. Slim: alléén naar wie vandaag nog geen status heeft én niet met
  verlof is (Buddee); opt-out per gebruiker via Notificaties → Voorkeuren
  (nieuwe module-key 'team'); eenmaal-per-dag-slot in app_settings. Twee
  UTC-crons (06:15/07:15, ma-vr) dekken zomer/wintertijd; de code checkt
  Amsterdam-uur==8. Nachttaken blijven exclusief bij de 03:00-run
  (controller.cron-gate). wrangler.toml: 3 cron-triggers.
- **One-tap-vraag op home** (PJ's idee, niet-opdringerige variant): bovenin de
  VANDAAG-kaart "Waar werk je vandaag? [Kantoor][Thuis][Op pad]" — alleen ma-vr
  én alleen zolang je nog niets hebt ingevuld; één tik → POST /vandaag →
  terug naar verse home (?ok= omzeilt de SW-cache). Bewust GEEN blokkerende
  vraag bij het openen — te opdringerig, went tegen.
- **Afwezigen-tegel gedempt** (PJ: "te dominant"): van tile-rij naar een rustige
  één-regel-link onderin de vandaag-kaart ("5 collega's afwezig · Anna, Bram en
  3 anderen →").
- **Avatar-links-fix**: een latere `.hava`-regel zette margin-left:10px en won
  van de v202-auto-marge — nu staat auto in de hoofdregel zelf; avatar weer
  rechts.

### v203 — Verwijderen = overal weg + notificaties wisbaar + TS-fix  (PWA ff-v175, meegeleverd in v204)
- **Cascade bij event-verwijderen** (melding PJ: "lollig" agendapunt bleef in
  ieders notificatiecentrum staan én werd nog geïndexeerd): /agenda/:id/delete
  ruimt nu via waitUntil ook op: (1) notificatie-rijen van dit event bij ALLE
  ontvangers (`verwijderNotificatiesVoorUrl`, match op /agenda/event/<id>), en
  (2) het kennisbank-doc `kbev_<id>` incl. vectoren (`removeDoc` in rag.ts,
  gedeeld met Kennisdump-verwijderen). NB: een push die al op een toestel is
  AFGELEVERD kan technisch niet worden teruggetrokken — het notificatiecentrum,
  de badge-bron en de zoek/assistent-index zijn wél direct schoon. Bij
  "Ongedaan maken" komen notificaties niet terug (bewust); het event zelf wel,
  en de index herstelt bij de eerstvolgende (her)index.
- **Notificaties zelf wisbaar**: ✕-knop per notificatie + "Alles wissen"
  (alleen je eigen rijen; POST /notificaties/verwijder).
- **TS-fout kennisdump-upload gefixt** (PJ's tsc-log): workers-types typt
  formData.getAll() als string[] — cast naar (string|File)[] met type-guard.
- **Nafix (tsc PJ)**: rag.ts had al een oudere `removeDoc` (alleen
  chunks/vectoren) — dubbele declaratie verwijderd; de complete versie (incl.
  kb_docs-rij) blijft. En een dieper lek gedicht: `syncIntranetContent`
  her-indexeerde agenda-events ZONDER deleted-filter, waardoor een verwijderd
  event bij de eerstvolgende reindex terug in de assistent kwam —
  `WHERE deleted_at IS NULL` toegevoegd.
- Open punt voor later: zelfde cascade voor nieuws-verwijderen (urls
  /nieuws#nieuws-<id>) — agenda was de acute klacht.

### v202 — Kennisdump + assistent is dé zoek-ingang  (PWA ff-v174, meegeleverd in v203)
**Kennisdump (Beheer → Kennisdump, nieuw):** drop PDF/Word/tekst/foto's en de AI
doet de rest — geverifieerd op Cloudflare-docs (`env.AI.toMarkdown`, GA sinds
maart 2025; PDF/Word/afbeeldingen-met-AI-beschrijving).
- Pipeline (src/kennisdump.ts): origineel → R2 (`kennisdump/<id>/…`, DOCS-bucket)
  → toMarkdown → llama-categorisatie (titel/categorie ras|teelt|nieuwsbrief|
  beleid|handleiding|overig/1-zin-samenvatting/klant-suggestie) → kb_docs →
  `indexDoc` (chunks+embeddings+Vectorize) → direct vindbaar in de assistent.
- **Veiligheidsregel**: alles landt als 'internal'. "Klant-zichtbaar maken"
  (portaal-vraagbaak) is een expliciete beheerknop; de AI mag alléén suggereren
  (✦-label). Uitzetten kan ook; verwijderen ruimt vectoren+chunks+doc+log op.
- Migratie **0005_kennisdump.sql** (kennisdump_log) — PJ draait 'm op de live D1.
  Zonder tabel blijft de pagina werken (lege lijst); verwerken vergt 'm wel.
- Beheer-tegel toegevoegd. Max 8 bestanden/keer, 15MB/stuk, body afgekapt op
  200k tekens.
**Header gestroomlijnd (PJ):** vergrootglas weg — sparkle/assistent is dé
zoek-ingang (zoekt intern én beantwoordt vragen); avatar erft de auto-marge.
/zoek blijft bestaan (zijbalk + deep links).

### v201 — Assistent-keten gefixt + audit-opvolging 12/6  (PWA ff-v173, meegeleverd in v202)
- **Assistent gaf geen algemeen antwoord (screenshot "hoeveel kassen")**: de RAG
  vond vaag verwante chunks en antwoordde "kan ik niet vinden in de context" —
  formeel een antwoord, dus de fallback sloeg niet aan. De agent-keten BEOORDEELT
  het interne antwoord nu (weigering-detectie) en schakelt dan alsnog door naar
  het gelabelde algemene-kennis-antwoord. Keten: intern zoeken → kennisbank-RAG →
  beoordelen → algemene kennis. Echte web-zoektocht (live bronnen) = vervolgstap,
  vergt een zoek-API (Brave/Tavily) + key.
- **iOS-toetsenbordzoom op de assistent**: invoerveld stond op ~14,7px; onder
  16px zoomt iOS de pagina in bij focus. Nu 16px — geen auto-zoom meer. Sheet
  volgt het toetsenbord bovendien via visualViewport (de --ff-kb-var werd niet
  overal bijgehouden).
- **Audit §5.1**: try/catch rond alle drie startViewTransition-aanroepen
  (InvalidStateError bij snelle wissels, nu stil met directe render-fallback);
  meldingen-empty-state heeft een CTA ("+ Melding maken" opent de sheet).
- **Audit §C1 — vandaag-kop op home**: afwezigen-rij in de VANDAAG-kaart
  ("5 collega's afwezig vandaag · Anna, Bram en 3 anderen" → /vandaag), zelfde
  bron als /vandaag; AVG-default: alleen "afwezig", geen verloftype.
- Nog open uit het rapport (volgende rondes): RSVP op events (BBQ 3/7),
  pulse-surveys (ronde C), analytics-dashboard (ronde D), kantine-deadline-tekst,
  snel-naar pinbaar; adoptie-acties zonder code (content-ritme, toernooi-seed,
  AVG-afspraak agenda-items) liggen bij PJ.

### v200 — AI-assistent: sparkle-knop + zoek-en-vraag-sheet  (PWA ff-v172, meegeleverd in v201)
Idee PJ ("linksboven is ruimte voor een AI-knop") + aanscherping: combinatie van
intern zoeken en AI-antwoorden.
- **Sparkle-knop linksboven** in de shell-header (die plek was vrij: burger staat
  op display:none, titel hangt gecentreerd). Haptiek doet mee.
- **Assistent-sheet** (nieuw, in het shell-chroom — gesprek blijft staan tijdens
  navigeren): bottom-sheet met chatweergave, keyboard-safe (--ff-kb), Escape/scrim
  sluit, tik op een treffer sluit de sheet en navigeert via de SPA-router.
- **`POST /api/assist`**: altijd interne FTS-treffers (zoekFts, max 3 per groep,
  6 getoond); is de invoer een echte vraag (?, vraagwoord of ≥5 woorden) dan ook
  een AI-antwoord: eerst kennisbank-RAG (mét bronchips), weet die het niet →
  `algemeenAntwoord()` (rag.ts, Workers AI) met label "Algemene kennis (AI)" —
  zodat "hoeveel kassen staan er in Nederland?" gewoon antwoord krijgt zonder dat
  iemand het voor intern beleid aanziet. Zelfde rate-limit (6/min) + ask_log als
  /api/ask; /api/ask en /zoek blijven ongewijzigd bestaan.

### v199 — STRUCTUREEL: home in de shell  (PWA ff-v171, meegeleverd in v200)
Antwoord op PJ's vraag "is home wel hetzelfde gebouwd als de modules?" — nee, en
dát was de bron van het stotteren: home was een losstaand document (volledige
herlaad per bezoek), modules zijn shell-pagina's (alleen content-swap). Nu is
home óók een shell-pagina.
- **Nieuw**: `homeShellContent()` + `HOME_SHELL_CSS` in home2.ts — de home-feel
  (begroeting-hero, chips, vandaag-rail, actiekaarten, nieuws-cover, snel-naar-
  grid) 1-op-1 geport; CSS gescoped onder `.hm` met eigen `--hm-*`-tokens
  (licht/donker), dus de look hangt niet af van shell-tokens.
- **Keuzes PJ (12/6)**: begroeting scrolt mee als content-hero (Today-patroon);
  eigen zoek-/profielknop uit de hero — die zitten al in de vaste shell-balk.
  Entrance = de shell-stagger (zelfde als modules; .up-machinerie vervalt op home).
- **Route "/"** rendert via `layout("Home", "/", …)`; de v192-routeruitzondering
  voor "/" is verwijderd — terug naar home is nu een gewone SPA-content-swap
  (geen herlaad, geen blob-herinit, scrollpositie blijft; profiteert ook van de
  v198 race-venster-fix). SW-SWR voor "/" blijft voor de koude start.
- **Vervallen op home**: eigen wabar/Meer-ballon/zijbalk/avatar — alles komt uit
  de shell (zelfde nav-token, zelfde inhoud). Push-kaart + script verhuisden mee
  de content in (router voert scripts opnieuw uit).
- **Rollback**: `loodsHome()` (standalone pagina) blijft onaangetast in home2.ts;
  route terugzetten = 1 regel.
- Checken na deploy: home↔module net zo vloeiend als agenda↔prikbord; begroeting
  stabiel; capsule blijft staan bij elke wissel; push-kaartje werkt op home.

### v198 — SPA-stotter: één render i.p.v. dubbele swap  (PWA ff-v170)
- Video 14:22 (12 jun): pagina kwam netjes binnen maar "knipperde" direct daarna.
  Oorzaak: SWR toonde eerst de cache-versie (mét view-transition) en deed daarna
  bij élk byte-verschil een stille tweede `innerHTML`-swap — waardoor de
  `fadeUp`-entree-animaties op alle kaarten opnieuw afspeelden. Twee fixes:
  1. **Race-venster (120ms)**: het netwerk krijgt eerst de kans; is de verse
     pagina binnen 120ms binnen, dan is er maar één render en bestaat de stille
     tweede swap niet eens (idee PJ's vriend: eerst de promise, dán de transitie).
  2. **`main.ff-noanim`** tijdens de stille revalidate: entree-animaties staan uit
     bij de tweede, onzichtbare swap; bij echte navigaties wordt de klasse weer
     verwijderd zodat fadeUp gewoon speelt.
- BUILD v198 / PWA-cache ff-v170 (offset 28 ✓). Alleen `views/layout.ts` + `pwa.ts`.

### v197 — Hangende oude header bij home↔module gefixt  (PWA ff-v169)
- Video 14:22: groet stabiel ✓, tabbar config-gedreven ✓, maar de oude header bleef
  op volle dekking over de nieuwe pagina hangen tijdens de overgang. Oorzaak: voor
  `ff-header`/`ff-botnav` stond alléén `animation:none` op old+new — dan laat de
  browser de OUDE snapshot op opacity 1 staan voor de duur van de transitie. Binnen
  de shell onzichtbaar (headers identiek), home↔module zichtbaar fout.
- Fix (home2 + layout synchroon): `old{opacity:0}` + `new{opacity:1}` — nieuwe
  header/capsule staan er direct, content fadet sequentieel (v195). Dubbele
  v191-regel in home2 opgeruimd.
- NB suggestie "promise eerst, dan transitie": klopt — en zo werkt de SPA-router al
  (fetch → dan startViewTransition). Home↔module is cross-document (browser bepaalt
  het moment); daar was de snapshot-styling de boosdoener, niet de volgorde.

### v196 — Capsule-tabbar volgt module-config  (PWA ff-v168, meegeleverd in v197)
Reviewfeature 6 ("dynamische pill"), vertaald naar onze architectuur: geen client-
registry/bootstrap nodig — de server rendert de tabs uit dezelfde bron als
zijbalk/ballon-menu.
- **Shell (layout.ts bottomNav)**: Home + de eerste 3 INGESCHAKELDE modules in
  beheer-volgorde (nav-token; fallback mod:-tokens) + Meer. Rol-gates via
  `mayShowRole` (CRM alleen met rol); klassieke tab-iconen blijven voor
  agenda/prikbord/meldingen, overige modules krijgen hun zijbalk-icoon.
- **Home (home2.ts wabar)**: zelfde regels via `enabledOrder` (al gefilterd voor
  uitzendkrachten/module aan/uit); interface `badges` → generiek `tabs[]` met
  badge-teller per moduleKey (foryou). Blob-breedte volgt het tab-aantal
  (`--tabs` op de wabar) — geen stotter bij minder/meer tabs.
- Overloop zit als vanouds onder Meer (ballon/drawer toont alle modules).
  Server-side blijft de waarheid: URL-guard + module-middleware (uit = redirect/403).
- Acceptatie (reviewdoc 6.6): module uitzetten in Beheer → Menu-indeling → tabbar
  past zich aan na refresh; volgorde wijzigen = tabs schuiven mee.

### v195 — Review-fixes schermopname 12/6 (10:01)  (PWA ff-v167, meegeleverd in v196)
Bron: extern reviewdoc "Honk — Fixes n.a.v. schermopname". Mapping op onze
(server-rendered) architectuur; bevinding 4 bleek de stagger-entrance, niet datafetching.
- **#1 Groet her-randomiseerde per render (HIGH)**: `pickGreeting` accepteert nu een
  seed (FNV-1a-hash); home geeft `email|datum|dagdeel` mee → zelfde groet de hele
  dag(deel), wel per gebruiker/dag anders. Beheer-preview blijft random.
  NB: "Moggel" is een beheer-variant (D1 `greeting_variants`), geen code — PJ checkt
  via Beheer → Header of dat bewust is.
- **#2 "FAB morpht naar avatar" (HIGH)**: dubbele oorzaak aangepakt: (a) FAB heeft nu
  een eigen `view-transition-name:ff-fab` (kan nooit met iets anders paren, fadet
  sequentieel); (b) home-avatar laadde lazy met groene gradient-fallback — de "groene
  cirkel over de profielfoto" — nu `fetchpriority=high`, niet lazy.
- **#3 Dubbele belichting (MEDIUM)**: paginatransitie sequentieel i.p.v. crossfade —
  out .11s, in .16s met .09s delay (+8px rise), `group(page)` animeert niet meer
  (voorkwam ook geometrie-morphs). Home en shell synchroon.
- **#4 Pop-in op home (MEDIUM)**: entrance-stagger speelt alleen nog bij het eerste
  home-bezoek van de sessie (`sessionStorage ff_h1` → `:root.ff-revisit`); terugkeer
  toont alles in één frame. (SWR-cache deed v192 al.)
- **#5 Opruim (LOW)**: "+ Event"-knop weg uit de agenda-toolbar (FAB = zelfde actie);
  clearance onder content verruimd naar 148px (FAB + capsule, shell én home).
  5d (prikbord-welkomsttekst eindigt zonder punt) = content in D1, geen code.
- **Niet in deze ronde**: reviewfeature 6 (tabbar dynamisch uit module-config) —
  voorgesteld als eigen ronde; nav-token + URL-guards bestaan al, alleen de
  capsule-rendering (layout.ts + home2.ts) moet de config volgen.

### v194 — "Gelezen"-knop uitschakelbaar + stille gezien-registratie  (PWA ff-v166, meegeleverd in v195)
- **Vlag `lees_knop`** (default UIT, toggle in Beheer → Menu-indeling): bepaalt of
  medewerkers de "Gelezen"-knop zien op nieuws/Beleid-documenten. Uit = ook geen
  must-read-banner op home (er valt niets te bevestigen).
- **Ghost-registratie**: het openen van /nieuws of /documenten registreert stil
  "gezien" per item (`registreerGezien` in leesbevestiging.ts, doel_types
  `nieuws_gezien`/`document_gezien` in dezelfde tabel, idempotent, via waitUntil —
  geen vertraging voor de gebruiker). Bestaande bevestigingen blijven bewaard.
- **Beheer → Leesbevestiging** toont nu per item "x gezien" naast "y/N bevestigd",
  met uitklapbaar wie (Bevestigd: … / Gezien: …).
- NB AVG: registratie is functioneel (compliance-inzicht voor beheer), zelfde
  grondslag als de bestaande leesbevestiging; alleen zichtbaar voor beheerders.

### v193 — Blob-stotter + traag verlaten van home (video 2, 12/6)  (PWA ff-v165, meegeleverd in v194)
- **Blob stotterde bij aankomst op home**: home miste de shell-gating — de blob
  animeerde bij elke laad vanaf z'n default-positie (en dat werd zichtbaar nu home
  instant uit cache komt). Fix: blob start statisch exact op de Home-positie
  (`translateX(7px)` + breedte `calc((100%-14px)/5)`), animatie pas ná de eerste
  JS-plaatsing via `.wabar.anim` (zelfde patroon als shell `.botnav.anim`).
- **240ms-navigatie-uitstel op de home-tabbar verwijderd**: dat uitstel diende de
  blob-glide vóór er view transitions waren; sinds v191 is het pure vertraging.
  Tik = blob verspringt direct + browser navigeert meteen.
- **Laad-dim bij verlaten van home** (`html.navving main{opacity:.55}`): de view
  transition bevriest het oude beeld tot de nieuwe pagina er is — zonder feedback
  voelt dat traag. Content dimt nu direct bij de tik (tabbar + ballon-menu);
  `pageshow` haalt de dim weer weg (back/bfcache).
- **SWR-guard**: home-cache slaat `?ok=`-redirects over — na een eigen actie zie
  je altijd de verse home, niet de stale gecachte.

### v192 — Must-read-banner + home-laadfix (video-melding PJ)  (PWA ff-v164, meegeleverd in v193)
- **Must-read-banner op home** (rapport §3.1): recente nieuwsberichten (≤14 dagen)
  zonder leesbevestiging van de gebruiker tonen als vaste kaart bovenaan
  ("1 bericht wacht op je leesbevestiging" → deep-link; meerdere → /nieuws).
  Accent-tile (`.mread`); telt mee in de "Alles is bij"-conditie. Data via
  bestaand `gelezenDoor()` (v185), guard op nieuws-module + e-mail.
- **Home laadde telkens traag + "hangende" header** (video 12/6, geanalyseerd):
  (1) module→home: de SPA-router toonde een skeleton, ontdekte dan dat home geen
  app-layout heeft en deed alsnog een volledige navigatie — dubbel laden. Fix:
  router slaat "/" over (`eligible()`-guard in layout.ts).
  (2) De service worker haalde home network-first op terwijl de home-route
  server-side Airtable-werk doet (nieuws + medewerkers) — elke keer wachten.
  Fix: "/" is nu stale-while-revalidate in de SW (pwa.ts): cache direct tonen,
  vers antwoord op de achtergrond; deploy-vers blijft geborgd door de
  CACHE-bump per deploy. Home→module blijft een volle navigatie, maar header +
  capsule blijven nu visueel staan dankzij de cross-doc View Transitions (v191).
  Vervolg (HONK fase 2/3, na baseline): Airtable server-side cachen.
- v191 + v192 deployen samen (BUILD v192 / PWA-cache ff-v164).

### v191 — Ronde A polish: home-pariteit met shell + HONK-tokens  (PWA ff-v163, meegeleverd in v192)
Bron: RAPPORT-diepteonderzoek-user-succes-juni2026.md + HONK-DEEP-POLISH-PERFORMANCE.md.
- **Cross-document View Transitions op home**: home2 had de `@view-transition`-regel
  niet, dus home↔shell was een harde wissel terwijl shell↔shell al vloeide. Home heeft
  nu hetzelfde VT-blok als de shell (content fadet via `page`, header `ff-header` en
  capsule `ff-botnav` blijven staan) — de capsule-tabbar blijft nu visueel staan bij
  navigatie van/naar home. Reduced-motion zet alle VT-pseudo's uit (beide bestanden).
- **Capsule krimpt bij scrollen op home** (`.wabar.mini`, pariteit met shell
  `.botnav-inner.mini`): omlaag scrollen + y>80 → translateY(6px) scale(.9); omhoog =
  terug. Let op: transform bevat de positionerings-translateX(-50%) — niet weghalen.
- **Haptiek op home** (pariteit met shell): zelfde patroon — navigator.vibrate(6) met
  iOS-Taptic-fallback via verborgen `switch`-checkbox `#ff-haptic-switch`; tik op
  wtab/chip/iconbtn/pill/ghost/qcard/acard/titem/kantine.
- **Motion-tokens (HONK §9.1)**: `--dur-press/--dur-enter/--stagger/--ease-spring`
  toegevoegd als aliassen op de bestaande Laag-0-motion (shell) én in home2 (dat geen
  tokens had). Home-entrance volgt nu HONK: .42s, stagger 40ms, max 6 stappen
  (was .55s/50ms ongelimiteerd); `.press` op `--dur-press`.
- **Touch-targets (HONK §3.4)**: header-chips op home waren ~32px hoog; hit-area nu
  ≥44px via onzichtbare `::after` (inset -6px verticaal) — visueel ongewijzigd.
- **iOS native-feel (HONK C1/C2, deels)**: UI-chroom (header-knoppen, chips, capsule,
  Meer-menu, pills) niet meer selecteerbaar + geen long-press-callout; content blijft
  selecteerbaar; inputs expliciet selecteerbaar. Verouderd
  `-webkit-overflow-scrolling:touch` overal verwijderd (genegeerd sinds iOS 13,
  veroorzaakte historisch renderbugs — HONK Appendix C).
- **Niet gedaan (bewust, volgende rondes)**: optimistic-UI-dekking alle modules,
  empty/error-states per view, badge-beleid, edge-cache/summary-endpoints/perf-budgets
  (HONK fase 0/2/3 vergen metingen op PJ's machine). HONK-plan staat in
  HONK-DEEP-POLISH-PERFORMANCE.md; mapping in RAPPORT-HONK-stand-van-zaken.md.

### v190 — Sleutelrotatie na GitGuardian-melding + push-herstel  (PWA ff-v162)
- **Incident**: bij de eerste GitHub-push bleken de VAPID-privésleutel en de
  PUSH_API_KEY in documentatie/.dev.vars.example te staan (GitGuardian-alert).
  Opgeruimd: placeholders in alle docs, repo-historie gewist en opnieuw gepusht,
  beide sleutels geroteerd (nieuwe VAPID_PUBLIC_KEY in wrangler.toml; private +
  PUSH_API_KEY alleen in de secret-store). Regel vastgelegd: geheimen bestaan
  alleen in secrets/wachtwoordmanager — nooit in bestanden.
- **Push-herstel na rotatie**: home detecteert een abonnement van het oude
  sleutelpaar (applicationServerKey-vergelijking), meldt het af en toont het
  "Meldingen aanzetten"-kaartje opnieuw; server-side telt 403 nu ook als
  verlopen abonnement (opruiming oude subs). Collega's zetten meldingen dus
  één keer opnieuw aan; de bezoeker-Worker heeft de nieuwe INTRANET_PUSH_SECRET nodig.

### v189 — Visuele overhaul: licht, schaduw, kleur (literatuur-gedreven)  (PWA ff-v161)
- **Schaduwen = key + ambient** (Material/Fluent): elke elevatie bestaat nu uit een
  scherpe contact-laag + zachte afstands-laag, ink-getint (elev-3 verloor zijn
  groenzweem), consistent over home én shell; accent-glow gedempt (35/30 → 24%).
- **Dark mode: elevation-ladder i.p.v. zwaardere schaduw**: schaduwen gehalveerd,
  nieuwe overlay-laag `--surface-3`/`--card-hi` (#232F40) voor ballon/Meer-menu
  (lichter = hoger), en dark-accenten één stap ontzadigd (#66c28b-ramp,
  `--t-ink`/menu-ink → #5fbe85) — verzadigd groen 'gloeit' op donker.
- **OKLCH-ramps** voor de groen-reeks + muted via `@supports` (perceptueel gelijke
  stappen, L ±0.07 / C vast; hex blijft fallback voor iOS < 15.4). Neutrale vlakken
  bewust hex gehouden — identiek home/shell.
- **Capsule-tabbar adaptief**: licht glas in light mode, donker glas in dark
  (was §3.13 "altijd donker") — wabar/botnav, blob, badges en ring token-gedreven
  (`--cap-*`), home en shell synchroon.

### v188 — Home-fix verwijderde items + aparte kantine-rol  (PWA ff-v160)
- **Fix:** verwijderde agenda-items (en prikbord-posts/peilingen) bleven op home in
  "Voor jou"/de chips staan — de foryou-queries filteren nu op `deleted_at IS NULL`.
- **Kantine-beheer als eigen recht**: nieuw vinkje in Beheer → Medewerkers
  ("Kantine-beheer") = extra-rol `kantine` — geeft alléén /friet/beheer
  (bestellijst, saldo's, menu). De brede `admin`-extra-rol (die ook agenda-bewerken
  en CRM-schrijven geeft) blijft werken maar is voor kantine niet meer nodig.
  Nav-item "Kantine-beheer" volgt de nieuwe rol.

### v187 — Access-groep volgt Beheer → Medewerkers automatisch  (PWA ff-v159)
- **Cloudflare-sync voor uitzendkracht-login** (src/accesssync.ts): bij het opslaan
  van een medewerker wordt de Access-groep "Uitzendkrachten" bijgewerkt naar de
  actuele lijst (actief + rol Uitzendkracht + e-mail) — deactiveren of rol wijzigen
  haalt het adres er direct uit. Idempotent (hele lijst vervangen); dagelijkse
  cron-sync als zelfherstel; mislukt de sync, dan meldt de opslaan-toast dat.
- Setup eenmalig (zie wrangler.toml): groep aanmaken in Zero Trust, policy naar de
  groep laten wijzen + One-time PIN aan, API-token als secret
  (`npx wrangler secret put CF_API_TOKEN`) en CF_ACCOUNT_ID + CF_ACCESS_GROUP_ID
  invullen. Leeg = sync staat stil uit.

### v186 — HR-rol (Redacteur), Uitzendkracht-rol + noodmelding afhandelen  (PWA ff-v158)
- **Rol Redacteur = content-beheer voor HR**: de beheer-gate is pad-bewust geworden —
  Redacteurs kunnen bij Beheer → Nieuws, Documenten, Medewerkers, Afdelingen,
  Trainingen en Leesbevestiging (tegel verhuisd naar de Inhoud-groep); platform-
  onderdelen (Modules/menu, Header, Push, BHV, Feedback, Audit, Klantenportaal)
  blijven beheerder-only, ook via de URL. "Inhoud-beheer" verschijnt in hun menu;
  de beheer-tegelpagina toont alleen de Inhoud-groep. **Geen rol-escalatie**: een
  Redacteur kan Beheerder/Redacteur niet toekennen of afpakken (UI én server-side).
- **Rol Uitzendkracht = beperkte toegang**: alleen Prikbord, Agenda en Nieuws.
  Centrale filtering in de middleware (mod-tokens + nav-payload) — zijbalk, ballon,
  home-menu, chips/Voor jou/Snel naar én de server-side URL-guard volgen allemaal
  vanzelf. Toekennen via Beheer → Medewerkers → rol "Uitzendkracht". Login voor
  externen zonder M365: e-mailcode (OTP) toestaan in Cloudflare Access (IT-actie,
  BLOK-F optie 2) en de medewerker met dat e-mailadres opvoeren.
- **Noodmelding afhandelen**: op /noodmelding toont een actieve melding (<30 min)
  nu een kaart met "Afgehandeld"-knop voor BHV'ers, beheerders en de melder zelf —
  wissen hoefde niet langer via Beheer → BHV-groep.

### v185 — Leesbevestiging + "Wie is er vandaag" (spoor B1+B2) + logo weg  (PWA ff-v157)
- **Leesbevestiging** (migratie 0019, tabel `leesbevestigingen`): "Gelezen"-knop
  (ghost-stijl) op elk nieuwsbericht en op documenten in categorie **Beleid**;
  optimistic via POST /api/gelezen (idempotent per persoon+item), gedelegeerde
  handler in de shell. Beheer → **Leesbevestiging**: per item x/N gelezen + wie
  (uitklapbaar), N = actieve medewerkers met e-mail.
- **Wie is er vandaag** (`/vandaag`, tabel `aanwezigheid_status`): afwezigen uit
  het Buddee-verlof + zelf je dagstatus zetten (Op kantoor / Thuis / Op pad /
  Afwezig, of wissen). AVG-licht conform BLOK-F-verkenning: alleen de status van
  vandáág, cron wist oudere dagen, geen historie/volgsysteem. Links vanuit
  Verlof-toolbar ("Vandaag") en Team-pagina; valt onder de team-module-guard.
- **Fresh Forward-logo (merk-chip) weg uit de header** op home én alle
  module-pagina's — gaf ruimte-ophoping linksboven; de begroeting (home) en
  pagetag (shell) krijgen de ruimte. Klantenportaal houdt zijn logo; de
  header-preview in Beheer → Header is meegenomen.
- D1-migratie 0019 staat in `migrations/` en is live toegepast op
  `fresh-forward-db`.

### v184 — Desktop-zijbalk home-pariteit + skeletons + stijlgids (spoor A4)  (PWA ff-v156)
- **Desktop-zijbalk exact de home-zijbalk**: 18px aside-padding, groeptitels
  .66rem met 14px toppadding als groepsafstand (navsec-marge weg), footer
  14px 12px 6px, en de hover-tint is nu de vaste accent-10%-tile van home
  (was theme-grijs surface-2).
- **Skeleton-laadstaten (§3.15)**: koude SPA-navigatie (geen SWR-cache-hit)
  die >300ms duurt toont een shimmer-skelet (kop + 5 rijen) in plaats van een
  bevroren oude pagina; cache-hits en snelle responses flitsen niet.
- **Stijlgids geactualiseerd**: nieuwe sectie "Loods-componenten (§3)" met
  module-kop (pageTitle), eyebrow, ActionCard, lijstkaart, stroomrail (live
  druppel), .lds-knoppen en de skeleton — de gids dekt nu de bibliotheek die
  sinds v170 app-breed draait.

### v183 — Meer-menu metriek gepind in px (home én shell)  (PWA ff-v155)
- **Restverschil gedood**: beide menu's leunden nog op de font-afhankelijke
  'normale' regelhoogte, waardoor de totale menulengte een rij scheelde
  (onderaan gescrold: home toonde t/m CRM, shell t/m Competitie). Rij (20px),
  groepstitel (14px) en versie-footer (16px) staan nu expliciet in px in
  home2.ts én layout.ts — identieke inhoudshoogte gegarandeerd.

### v182 — Meer-menu rijhoogte exact home  (PWA ff-v154)
- **Menurijen 10% compacter, exact home**: de shell-body zet `line-height:1.65`
  en dat lekte in het ballon-menu (home gebruikt de normale regelafstand);
  menurijen/groepstitels/footer nu op strakke line-height, de `min-height:44px`
  op rijen is weg en de extra 8px groepsmarge vervalt — rijhoogte en verticaal
  ritme zijn nu 1-op-1 het home-menu (geldt ook voor de desktop-zijbalk).

### v181 — Meer-menu 1-op-1 home + beheer gecomponeerd + module-koppen  (PWA ff-v153)
- **Meer-menu (ballon) nu exact het home-menu**: versie-footer scrolt mee als
  laatste regel ín het menu (stond vastgepind onder de lijst, waardoor "Persoonlijk"
  leeg leek en Team/Trainingen onder de schuifvouw verdwenen); iconen terug naar
  20px (een oudere 22px-regel overschreef de v180-maat); nav-padding 8px (home-maat);
  groepen met alleen uit-staande modules renderen hun titel nu ook verborgen.
- **Documenten-icoon = boek, overal**: home-menu/chips gebruikten 'file' (identiek
  aan Nieuws); nu zelfde boek-vorm als zijbalk/ballon — menu's zijn 1-op-1 gelijk.
- **Beheer-schermen gecomponeerd** (spoor A2): groepstitels en "Alle …"-koppen als
  eyebrow, alle overzichtslijsten in Loods-lijstkaarten (medewerkers, nieuws,
  documenten, afdelingen, klanten, rassen, teeltadvies, snoei & pluk,
  klantdocumenten); beheer-home met cog-tegelkop.
- **Module-koppen in home-stijl** (spoor A3): icoon-tegel + titel (patroon van
  Meldingen v180) op Agenda, Verlof, Prikbord, Nieuws, Documenten, Team,
  Trainingen, Competitie, Ranglijst, Toernooien, Kantine (bestellen/saldo/beheer),
  Zoeken, Notificaties, Mijn account, Feedback en CRM — via `pageTitle()`/
  `page({ icon })` in views/templates.ts.

### v180 — Blob-glide vanaf home + menu-pariteit mobiel & desktop  (PWA ff-v152)
- **Blob glijdt nu óók vanaf home**: home is een volledige paginalaad, waardoor de
  glide werd afgekapt; de navigatie wacht nu 240ms tot de blob geland is (zelfde
  gevoel als de shell, die deze tijd "gratis" kreeg van de SPA-fetch).
- **Ballon-menu maatvoering exact home** (mobiel): zelfde positie (rechts 12px,
  86px boven de onderrand), zelfde hoogte (60vh/520px), icoonmaat 20px, en de
  **Home/Zoeken-rijen verdwijnen uit de mobiele ballon** (zitten al in tabbar en
  header) — desktop-zijbalk houdt ze.
- **Desktop-pariteit**: actieve menurij is nu dezelfde gradient-pill als op home
  (was theme-groen, te licht in dark mode) en de zijbalk-scrollbalk is verborgen
  (scrollen blijft werken) — geldt voor shell én home.
- **Meldingen-kop**: bel-icoon (zoals menu/tabbar); de oranje noodkaart houdt
  bewust de waarschuwingsdriehoek.

### v179 — Iconen uniform + avatar-fix + shotcaller + audit-opvolging  (PWA ff-v151)
- **Alle iconen uniform met home** (desktop én PWA): de shell-iconenset (zijbalk,
  ballon-menu, schermen) gebruikt nu exact de home-sprite-vormen — bel i.p.v.
  driehoek voor Meldingen, zelfde nieuws/documenten/team/competitie/kantine/
  CRM-vormen. Drawer-label "Klanten" → **"CRM"** (zoals home; subtabs Klanten/
  Pipeline/Taken blijven op de CRM-pagina's) en de Account-volgorde is gelijk
  (Mijn account · Notificaties · Feedback).
- **Home-avatar definitief gefixt**: absolute fill in de cirkel (sluit
  grid-layoutquirks uit) — exact dezelfde uitsnede als de shell-avatar.
- **Shotcaller op de dartteller**: echte caller-audio per score uit R2
  (key `caller/<score>.mp3`, plus `caller/noscore.mp3` en `caller/gameshot.mp3`;
  uploaden kan met `npx wrangler r2 object put ff-documenten/caller/180.mp3
  --file=...`). Ontbreekt een bestand, dan valt hij automatisch terug op de
  bestaande Engelse TTS. Voice-toggle blijft werken.
- **Badge-tellers op de shell-tabbar** (laatste pariteitspunt): Prikbord/
  Meldingen tonen nu hetzelfde gradient-bolletje als op home, gevoed door
  /api/badge (uitgebreid met per-module-tellers uit dezelfde foryou-bron).
- **Nieuw app-icoon** (navy + oranje FRESH FORWARD, geleverd als `app icoon.png`):
  verwerkt naar 192/512 (hoeken navy gevuld zodat de systeem-afronding strak is),
  ingebakken in `src/icons.ts` en overal cache-bust naar `?v=ff4` (manifest,
  apple-touch-icon, favicon). Opnieuw installeren/toevoegen aan beginscherm kan
  nodig zijn om het oude icoon op een toestel te verversen.
- **Audit-opvolging (RAPPORT-audit-v178)**: scheme-whitelist op "Externe link"
  (documenten + zoeken, geen `javascript:` meer mogelijk), quote-escaping op de
  nieuws-cover-URL, en de hele opruimlijst doorgevoerd (collapse-script,
  side-head/✕, `.bn-ava`, `.hmore`-selector, dode home-`.avatar`-CSS).

### v178 — Meer-menu pixel-gelijk + versie-footer + FAB-fix + desktop-breedte  (PWA ff-v150)
- **Ballon-menu (shell) exact in home-stijl**: inklap-chevrons en groep-toggles
  vervallen (groepen staan altijd open — een eerder ingeklapte groep "Werk"
  verdween anders stilletjes, zie testfoto), effen kaartachtergrond i.p.v.
  doorschijnend glas, en de menu-icoonkleur zit nu in één gedeeld token
  (`--menu-ink`: licht `#236b41` / donker `#3fa468`) voor shell- én home-menu.
- **Versie-footer in elk menu**: het home-Meer-menu en de desktop-zijbalk van
  home tonen nu ook "Fresh Forward · v…" (het shell-menu had 'm al).
- **FAB-fix**: de + knop verdwijnt zodra het Meer-menu opent (stond er bovenop,
  zie testfoto).
- **Desktop-breedte uniform**: home gebruikt nu dezelfde maximale breedte als de
  rest (1500px); content en header vullen de ruimte, SNEL NAAR in 4 kolommen.

### v177 — Home desktop-pariteit: zijbalk zoals de rest  (PWA ff-v149)
- **Home heeft op desktop nu dezelfde opzet als de andere pagina's**: een vaste
  zijbalk links (Home · Zoeken · de menugroepen uit exact dezelfde nav-bron als
  de shell, incl. rol-/modulefilter en Inhoud-beheer) naast de home-kolom, in
  dezelfde maatvoering (236px, zelfde rij-stijl, actieve rij in accent-gradient).
  Mobiel verandert er niets (zijbalk verborgen; capsule + Meer-menu blijven).
- **Meer-menu in de shell in home-stijl**: kopbalk met ✕ vervalt (sluiten =
  scrim-tik of Escape, zoals op home), rijen en groepskopjes in dezelfde maat en
  typografie als het home-menu.
- NB: de profielfoto-uitsnede op home was al gefixt in v176 (zelfde bron als de
  shell-header); dat wordt met deze deploy zichtbaar.

### v176 — Menu-uniformisering + permissies + beheer-polish  (PWA ff-v148)
- **Home-menu = shell-menu**: het Meer-menu op home wordt nu opgebouwd uit exact
  dezelfde bron als de drawer (het nav-token: groepen, volgorde, module aan/uit,
  CRM alleen met crm-rol) + de vaste Account-groep (Mijn account/Notificaties/
  Feedback) en **"Inhoud-beheer" voor beheerders** (die ontbrak). Groepskoppen in
  home-stijl. NB: zie je CRM terwijl je 'm uit had staan, sla dan Beheer → Modules
  één keer opnieuw op — nieuwe modules staan bewust AAN tot expliciet uitgezet
  (v169-gedrag).
- **Profielfoto op home uit dezelfde bron** als de shell-header (me:-token), dus
  identieke uitsnede — geen half wegvallend gezicht meer.
- **Merk-chip linksboven op home**: dezelfde glas-pill met het logo als op de
  andere pagina's (het witte app-icoon-blok detoneerde).
- **FAB botste met de capsule**: + knop, undo-snackbar en het ballon-menu staan nu
  ruim boven de (hogere) tabbar; content-padding meegeschoven.
- **Nieuwsafbeeldingen op /nieuws niet meer afgesneden**: natuurlijke hoogte
  (was harde 16:9-crop); home houdt z'n compacte cover.
- **Beheer-polish**: het header-voorbeeld (Beheer → Header) toont nu de nieuwe
  home-stijl (merk-chip + begroeting + ondertitel); de vervallen gradient-/
  tekstkleur-instellingen zijn opgeruimd (waarden blijven bewaard). Menu-iconen
  in de drawer in accentkleur — uniform met het home-menu.

### v175 — Duim-UI: Meer rechtsonder, profiel rechtsboven + home-pariteit  (PWA ff-v147)
- **Navigatie terug naar duim-zone-logica** (NN/g): de capsule-tabbar heeft weer een
  **"Meer"-tab rechtsonder** (opent het ballon-menu boven de pill, blob volgt zoals
  vroeger, unread-dot terug op de tab) en het **profiel zit rechtsboven in de
  header** als avatar-chip — met **initialen of teamfoto, server-side ingebakken**
  via een nieuw `me:`-rol-token uit de identiteits-middleware (geen flits, geen
  extra fetch). Geldt voor álle shell-pagina's.
- **Home in pariteit**: 5e tab is nu ook "Meer" met een eigen popover-menu
  (alle ingeschakelde modules + Mijn account/Notificaties/Feedback), avatar-chip
  (foto/initialen) rechtsboven naast zoeken, het **app-icoon als logo-tegel**
  (was "FF"-tekst), en de **blob glijdt nu ook bij een tik** op een tab (zelfde
  gevoel als de shell).
- **Home desktop-vriendelijk**: bredere kolom (760px), capsule-tabbar verborgen
  op desktop (navigatie via SNEL NAAR + header), SNEL NAAR in 3 kolommen.
- **"Vandaag" met één item** lijnt nu netjes uit (rail + regel gecentreerd; ook in
  de agenda-dagweergave).
- **Undo-snackbar**: expliciete `z-index` (toast-laag) zodat hij nooit achter de
  donkere capsule kan vallen. Let op: graag verifiëren of "Ongedaan maken" weer
  verschijnt — zo niet, dan graag melden of het item wél direct verdwijnt bij
  verwijderen (dat onderscheidt script- van weergaveprobleem).
- Beheer-headervoorbeeld (Beheer → Header) toont nog de oude home-stijl — bekend,
  volgt in de beheer-polishronde.

### v174 — Loods app-breed: globale wrapper (alles over vóór livegang)  (PWA ff-v146)
- **De `.lds`-laag staat nu globaal aan in de shell** (`<main>` wikkelt alle content):
  daarmee zijn óók alle resterende schermen in één keer over — heel Beheer
  (medewerkers, klanten, modules, nieuws-/documentenbeheer, meldingen-ontvangers,
  BHV-groep, bugmeldingen, trainingen-beheer, kantine-beheer), CRM, audit-log,
  bezoek en de stijlgids. Kaarten 22px, gradient-knoppen, soft-pills en
  accent-tinten dus overal consistent met home.
- De per-scherm `lds()`-wrappers blijven staan (genest is onschadelijk en houdt
  de view-bestanden expliciet); de entrance van `main` is overal de veilige
  opacity-fade (geen transform → geen containing-block-risico voor sheets).
- Het **klantportaal** behoudt bewust zijn eigen, smallere huisstijl
  (`portalLayout`, MODULE-SJABLOON afwijking 5) — dat is klant-zijde, geen
  intranet-chrome.

### v173 — Tabbar uniform met home + SPA-cache per build + restyle ronde 4-rest  (PWA ff-v145)
- **Tabbar-iconen exact gelijk aan home**: de shell-tabbar gebruikt nu dezelfde
  icoonvormen als de home-sprite (huisje, kalender, tekstballon, bel) en de
  Profiel-tab is dezelfde 27px gradient-avatar als op home (initialen volgen
  zodra de shell de ingelogde naam kent; tot die tijd een wit user-glyph).
- **Geen blob-sprong meer naar "het midden"**: de SPA-cache (`ff-spa`) is nu aan
  het buildnummer gekoppeld — een deploy leegt 'm automatisch, dus eerder
  bezochte pagina's kunnen geen oude tabbar-markup (Home-gecentreerd) meer
  terugzetten. Oude ff-spa-caches worden bij paginalaad opgeruimd.
- **Restyle ronde 4-rest** via het `lds()`-recept: Zoeken (eyebrow-secties,
  accent-iconen), Mijn account (accent-saldo/ELO), Trainingen (lijst + cursus)
  en de volledige competitie (overzicht, ranglijst, spelerprofiel, teller/
  dartbord, toernooien). Daarmee zijn alle module-schermen over; alleen de
  beheer-schermen volgen nog (aparte ronde).

### v172 — HOTFIX vastzittende sheet + thema-fix home + restyle ronde 4a  (PWA ff-v144)
- **HOTFIX (P1): "nieuw bericht"-popup hing midden op de pagina en blokkeerde scrollen**
  op agenda/prikbord/meldingen (mobiel, sinds v170). Oorzaak: de `.lds`-wrapper kreeg
  de standaard entrance-animatie van de shell (`main > *` = fadeUp mét translateY);
  een ancestor met transform wordt containing block voor `position:fixed`, waardoor de
  gesloten bottom-sheet (translateY(100%)) niet meer off-screen stond maar onder de
  content "landde" en daar bleef hangen (iOS). Fix dubbel: (1) `main > .lds` animeert
  nu opacity-only (`ldsfade`, geen transform); (2) vangnet in de shell:
  `.sheet-m:not(.open)` is `visibility:hidden` + `pointer-events:none` (flipt pas ná
  de slide-out) — een gesloten sheet kan nooit meer iets blokkeren, wat een ancestor
  ook doet.
- **Home volgt nu ook je handmatige themakeuze**: de standalone home (v168) keek
  alleen naar `prefers-color-scheme`; nu leest hij óók `ff_theme`/`data-theme`
  (bootstrap-script in de head + `:root[data-theme="dark"]`-varianten), dus home en
  de rest van de app staan altijd in dezelfde modus.
- **Home is leidend — shell-kleuren gelijkgetrokken**: de neutralen van de hele app
  staan nu op de designsysteem-waarden van de home (licht: Mist `#F4F7FB`/wit/inkt
  `#0A0E14`; donker: Inkt `#0A0E14`/`#121925`), incl. schaduwen, lijnen, velden,
  theme-color-metas en manifest-kleuren. De groene FF-tint blijft puur als accent.
  Ook de **tabbar-afstand tot de onderrand** is gelijk aan home (`safe-area + 12px`,
  was de halve safe-area) — FAB en content-padding schuiven automatisch mee.
- **Restyle ronde 4a/4b-deel** via hetzelfde `lds()`-recept: Team (smoelenboek),
  Notificaties (lijstkaart + eyebrow), Feedback/bug, Noodmelding (kop + verstuurknop
  in de vaste alarm-gradient), Nieuws, Documenten (lijstkaart) en Voor jou
  (eyebrow-secties + lijstkaarten). Nog te gaan (ronde 4-rest): zoeken, account,
  trainingen, competitie.

### v171 — Capsule-tabbar app-breed (restyle ronde 3)  (PWA ff-v143)
- **De oude glas-pill onderin is vervangen door de donkere capsule-tabbar** van de
  home (designsysteem §3.13), op álle pagina's binnen de shell (mobiel): altijd
  donker in light én dark, witte stroke-iconen + 10px-labels, wit-alpha blob achter
  de actieve tab. Vaste bestemmingen, identiek aan de home-tabbar:
  Home · Agenda · Prikbord · Meldingen · Profiel. Geen actieve tab (bv. kantine via
  "Meer")? Dan verbergt de blob zich (`--blob-o`) i.p.v. op een willekeurige tab te
  springen. Bestaand gedrag behouden: mini-krimp bij scrollen, compact-fallback bij
  Dynamic Type, blob-herijking na SPA-navigatie, verbergen bij open sheet, haptiek.
- **"Meer" verhuisde van de tabbar naar de header**: glas-chip (zelfde recept als de
  zoek-chip) rechts naast zoeken, alleen mobiel. Het ballon-menu opent nu rechtsboven
  onder de header (was: rechtsonder boven de pill); de unread-dot verhuist mee
  (`/api/badge` zet 'm nu op `.hmore`). Drawer-inhoud, scrim en Escape onveranderd.
- Let op: de tabbar toont de vaste vier modules ook als een module in Beheer uit
  staat — de bestaande URL-guard vangt dat af met een redirect naar home (zelfde
  gedrag als de home-tabbar sinds v168). Profiel-tab gebruikt het user-icoon
  (de initialen-avatar zoals op home volgt wanneer de shell de gebruiker kent).
- Verificatie: `tsc --noEmit` (0 fouten) + Linux-esbuild-bundelcheck op de spiegel.

### v170 — Loods-componentbibliotheek + agenda & prikbord (restyle ronde 2)  (PWA ff-v142)
- **Nieuw `src/views/loods.ts`**: de componentbibliotheek uit het designsysteem (§3)
  voor module-schermen BINNEN de bestaande shell — tenant-tokens (FF-groen) +
  afgeleide tokens (`--grad`/`--tile`/`--glow`), Eyebrow, icoon-tegels, ActionCard,
  GhostButton, ronde nav-knoppen, TodayCard + StroomRail (druppel alleen als de
  getoonde dag vandaag is), maandgrid-cellen en prikbord-restyles. CSS gescoped
  onder `.lds` en door layout.ts geïnjecteerd: niet-gerestylede schermen blijven
  pixel-onaangeroerd; alle shell-gedrag (sheets/FAB, undo, swipe, emoji, polls,
  vertaal, offline-wachtrij) blijft werken doordat functionele klassen en
  data-attributen onveranderd zijn. Nieuw token `--t-ink`: accent als tekstkleur,
  in dark de lichtere accent2 (WCAG-guardrail accent↔card ≥ 3:1, designsysteem §4).
- **Agenda in Loods-stijl** (`views/agenda.ts`): toolbar met ronde ‹/›-knoppen +
  "Vandaag"-pill + gradient "+ Event"-pill, chips voor maand/week/dag/verlof,
  maandgrid met 13px-radius-cellen ("vandaag" = accent-tegel), week-/dagregels
  als tijdregels (accent-tijd, tabular-nums) en de **StroomRail in de dagweergave**;
  event-detail met categorie-chip en tijdregels; verlofplanner meegerestyled.
- **Prikbord in Loods-stijl** (`views/social.ts`): postkaarten 22px-radius,
  shout-outs met accent-rand + tegel-kop, peilingopties als accent-tegels,
  avatar-tegels in `--tile`, reactieveld als pill, verwijder-knoppen als soft-pills.
- **Meldingen in Loods-stijl** (`views/meldingen.ts`): kop met icoon-tegel,
  eyebrow-secties met open-teller, meldingen in lijstkaarten (swipe-archiveren
  blijft), en de **noodmeldingskaart in de vaste alarm-gradient** uit het
  designsysteem (`#FF7A4D→#F23B2F`, nooit tenant-kleur; bewuste SOS-afwijking
  uit MODULE-SJABLOON blijft — wel zonder ring-puls: die blijft gereserveerd
  voor een áctief alarm).
- **Kantine in Loods-stijl** (`views/friet.ts`): bestellen/saldo/beheer gewikkeld
  in de componentbibliotheek — eyebrow-secties, lijstkaarten voor mutaties/
  bestellingen/saldo's, totalen en positieve saldi in accent (`--t-ink`),
  gradient-bestelknop; bestelformulier en alle formactions ongewijzigd.
- De capsule-tabbar app-breed + overige modules (competitie, team, trainingen, …)
  volgen in ronde 3 — zelfde recept: `lds()` + componenten, geen gedragswijzigingen.
- Verificatie: `tsc --noEmit` (0 fouten) + Linux-esbuild-bundelcheck op de spiegel.

### v169 — Module-default-fix + home gevuld  (PWA ff-v141)
- **Fix "Alle berichten →" deed niets**: de opgeslagen module-config dateerde van
  vóór de nieuws/documenten-modules, waardoor de URL-guard ze als "uit" zag en
  /nieuws en /documenten terugstuurden naar home. Nieuw: `modules_known` in
  app_settings — modules die nog niet bestonden bij de laatste opslag staan
  automatisch AAN tot een beheerder ze bewust uitzet. (Eénmalig neveneffect: een
  vroeger uitgezette module kan weer aan staan; check Beheer → Modules en sla op.)
- **Home gevuld bij weinig data**: nieuw "SNEL NAAR"-grid met alle ingeschakelde
  modules (CRM alleen voor team Concepts) — navigatiepariteit met de oude zijbalk;
  plus een rustige "Alles is bij"-kaart wanneer er geen alarm, agenda-items,
  kantine-deadline én acties zijn.
- Trainingen-icoon in chips/grid → boekje (was bestand).

### v168 — Loods-home (restyle ronde 1)  (PWA ff-v140)
- **Home volledig in Loods-stijl** (referentie: `loods-design/home-mockup.html` +
  `loods-design-system.md`; nieuw bestand `src/views/home2.ts`, standalone render):
  frosted sticky header met logo-tegel en tijdgebonden begroeting, teller-chips
  (zelfde bron als de headerteller) + app-snelkoppelingen (WK/Buddee/TimeChimp) in
  één chips-rij, BHV-banner (alleen bij noodmelding <30 min, ring-puls), **Vandaag**
  met stroomlijn + vallende druppel (agenda-events tot middernacht + kantine-
  deadline), **Voor jou**-actiekaarten (uit foryou; CRM-taken bovenaan voor team
  Concepts), **Nieuws** (coverkaart + 2 rijen met ongelezen-dot), **Jarig** (TEAM-
  kaart, voornaam) en de donkere capsule-tabbar met blob en badges.
- Tenant-tokens = FF-groen (`--t-accent #236b41`, `--t-accent2 #3fa468`); structuur,
  spacing, motion en de alarm-kleuren zijn platform-vast conform het designsysteem.
  Light + dark + prefers-reduced-motion ondersteund.
- De oude home-blokken ("Vandaag bij ons"-tegels, activiteitenfeed, shout-outs op
  home, hero-header) vervallen op home; alles blijft bereikbaar via de modules.
  Push-aanmeldkaart en SW-registratie verhuisd naar de nieuwe home.
- **Vervolg (rondes 2+)**: zelfde stijl doortrekken naar de moduleschermen
  (ModuleLayout + componentbibliotheek, designsysteem §3) en daarna de zijbalk/
  oude bottom-bar vervangen door de capsule-tabbar app-breed.

### v167 — Home-opruimslag + deeplink-fixes  (PWA ff-v139)
- **Homepage compact** (±5 schermen → ±1,5): nieuws toont nu de top 3 als teasers
  (titel + datum + 1 regel) met "Alle nieuws →"; de volledige artikelen (incl.
  reacties/emoji/vertaalknop) staan op de nieuwe pagina **/nieuws**. De documentenlijst
  verhuisde naar **/documenten**. Beide hebben een vast menu-item (zijbalk, onder Home).
  App-tegels (WK-poule/Buddee/TimeChimp) blijven bovenaan; WK-poule kan na het WK weg.
- **"Vandaag bij ons" slimmer**: tegels zonder actuele inhoud (bv. "Geen open
  meldingen") verdwijnen (`leeg`-vlag in summary.ts); maximaal 4 tegels.
- **"Team vandaag"**: jarigen + shout-outs samengevoegd in één kaart; activiteitenfeed
  van 8 → 5 regels.
- **"Nieuws gezien"** wordt nu op /nieuws bijgewerkt (de leesplek) i.p.v. op home;
  de "Nieuw"-badges blijven dus staan tot je het nieuws echt opent. Reactie-redirects
  gaan naar /nieuws.
- **Fixes**: home-agendategel deeplinkt naar het eerstvolgende event; activiteitenfeed
  en zoekindex linkten naar `/agenda/<id>` (404) i.p.v. `/agenda/event/<id>` — gefixt.
  Na deploy op /zoek één keer herindexeren (of nachtcron afwachten) voor oude treffers.
- Verificatie: volledige spiegel + `tsc --noEmit` (0 fouten) + esbuild-bundel groen.

### v166 — CRM-module (ADR-001)  (PWA ff-v138)
- **Nieuwe module CRM** (`/crm`) voor **team Concepts + beheerders** (rol-token `crm`,
  afgeleid van Medewerkers → Afdeling = "Concepts"): klantenlijst met kerncijfers,
  klantenkaart, contactpersonen, contactmomenten, taken (met deadline/eigenaar) en
  een deal-pipeline (lead → gesprek → offerte → gewonnen/verloren).
- **Architectuurbesluit vastgelegd** in `ADR-001-crm-en-portaal-in-bestaande-worker.md`:
  portaal + CRM integreren in deze Worker, geen aparte Worker; wel platform-klaar
  (tenant_id, datalaag `src/crm/data.ts` met db-handle → later 1-op-1 `tenantDb`).
- **Migratie `migrations/0018_crm.sql`** (4 tabellen + indexes; soft delete). EERST de
  migratie draaien, dan deployen:
  `npx wrangler d1 execute fresh-forward-db --remote --file=./migrations/0018_crm.sql`
  (en idem `fresh-forward-db-test` voor de testomgeving).
- **Klanten aanmaken/bewerken vanuit het CRM** ("+ Klant" op /crm, "Bewerken" op de
  klantenkaart) — zelfde gedeelde `klanten`-tabel en helpers als Beheer → Klanten,
  dus portaal-toegang (e-mail + Actief) loopt automatisch mee.
- Integratie: nav (zijbalk/sub-tabs/bottom-bar, rol-gefilterd), FAB = nieuw contactmoment,
  home-tegel met open taken/deals (alleen voor crm-rol; eigen try/catch zodat een
  ontbrekende migratie de andere tegels niet raakt), audit-log op alle mutaties,
  ownership (maker of beheerder), soft-delete-opschoning in de cron, Beheer → Modules.
- **Werkwijze-correctie (belangrijk voor volgende sessies)**: de eerdere waarschuwing
  "Edit/Write-filetools kappen bestanden af" klopte niet — het is de **Linux-sandbox-mount**
  die bestaande bestanden afgekapt leest (cap op de initiële sync-grootte). Bestanden op
  schijf zijn intact. Dus: bestaande bestanden bewerken via de file-tools (schijf), nooit
  via bash op de mount (risico: afgekapte versie terugschrijven). Volledige
  `npx tsc --noEmit` draait daarom op Windows, niet in de sandbox.

### v139 — Premium shell (WhatsApp/iOS-niveau)  (PWA ff-v111)
- **Glazen header zonder border**: bovenaan volledig transparant (logo direct op de content);
  het glas (blur-laag via `::before`) fadet pas in bij scrollen (y > 8). Hairline weg — de
  blur zelf is de scheiding. Safe-area links/rechts afgedekt (landscape).
- **Zwevende pill-tabbar terug, nu af**: ~12px lucht boven de home-indicator, verlichte
  glasrand (`inset 0 1px 0`-highlight), 44px-targets, ronde glow-capsule (999px) met
  spec-timing. Pill **krimpt bij omlaag scrollen** (.mini) en komt terug bij omhoog —
  één listener op de echte scroll-bron (mobiel `.shell`, desktop window), herijkt na elke
  SPA-wissel via `ff:page`.
- **View transitions content-only**: alleen `<main>` animeert (vt-out .16s / vt-in .2s,
  4-6px verticaal); header en pill blijven stilstaan. Geldt voor SPA-wissels én volledige
  loads. fadeUp-stagger op kaarten speelt opnieuw af per wissel (verse DOM-nodes).
- **Platform-finish**: `theme-color` metas = echte `--bg`-hexen (licht #f6f8f4, donker
  #0e1310; geen witte flits), manifest `background_color`/`theme_color` -> donkere `--bg`,
  `overscroll-behavior-y:none`, `img{-webkit-user-drag:none}`, `touch-action:manipulation`
  op alle tap-targets, zijbalk 100vh -> 100dvh.
- **Test-gotcha (iOS)**: web-clip bevriest viewport-instellingen — app-icoon na deploy
  verwijderen en opnieuw op het beginscherm zetten.

### v138 — Full-bleed dock onderaan + SPA-navigatie  (PWA ff-v110)
- **"Full bottom" definitief**: de zwevende pill is vervangen door een **full-bleed frosted
  dock** die de onderrand van het scherm raakt; de safe-area (home-indicator) zit als padding
  ÍN de balk i.p.v. als losse strook eronder. Content scrollt er geblurd achterlangs
  (zelfde patroon als de header bovenaan -> chrome boven én onder edge-to-edge).
  Blob/haptiek/active-state ongewijzigd; main-clearance en FAB meegeschaald.
- **SPA-router**: zelfde-origin navigatie zonder volledige paginaherlaad. Fetch -> DOMParser ->
  <main>/titel/pagetag/FAB/active-states swappen -> pagina-scripts opnieuw uitvoeren ->
  `ff:page`-event (toasts, emoji-reconcile, vertaal-autorun en tab-blob haken erop in).
  View Transitions API voor de overgang; scrollpositie per history-entry bewaard/hersteld.
  Defensief: /api/*, /portaal*, downloads, externe links en niet-app-antwoorden (Access-login)
  vallen terug op gewone navigatie. Install-hint (`beforeinstallprompt`) 1x globaal gebonden.

### v123 — Fix: app-tegels bij groter lettertype/zoom  (PWA ff-v95)
- `.appgrid` valt nu terug naar **één kolom** zodra de tegels niet meer naast elkaar passen
  (rem-gebaseerd `auto-fit`), zodat bij iOS "grotere tekst"/zoom de Buddee/TimeChimp-tegels
  niet meer middenin het woord breken. `overflow-wrap:anywhere` → `break-word` op tegel-tekst.
  Geldt ook voor de beheer-tegels (zelfde class).

### v124 — Zwevende frosted bottom-nav (WhatsApp-stijl)  (PWA ff-v96)
- Bottom-nav is nu een **zwevende, frosted capsule** (raakt de schermranden niet), met een
  **glijdende highlight-blob** achter de actieve tab (spring-curve, reduced-motion gehonoreerd).
- Puur optisch: dezelfde tabs, routing, active-state (server), tokens (`--nav`, blur, elevatie)
  en interactie (haptiek, view-transitions) blijven. Capsule is theme-aware via `--nav`.
- Content-padding + FAB-positie opgehoogd zodat niets onder de zwevende balk valt.

### v125 — Tabbalk vloeiend (geen stotter)  (PWA ff-v97)
- Blob staat nu **direct** goed bij elke paginalaad (animeert pas ná eerste plaatsing via
  `.botnav.anim`), zodat hij niet meer vanaf links inschuift bij elke navigatie.
- Lichtere frosted blur (20px -> 14px) = minder repaint-kost tijdens beweging op mobiel.
- Alleen `transform` ge-`will-change`'d; transitie alleen bij een tik. Reduced-motion gehonoreerd.

### v126 — Tabbalk lager + transparanter, content full-screen  (PWA ff-v98)
- Zwevende balk zit lager (offset 10px -> 5px) en is duidelijk transparanter/frosted
  (`color-mix(var(--surface) 52%, transparent)` + blur 16px), content schemert er doorheen.
- Content vult nu het scherm; lege band onderaan weg (main padding 96px -> 66px) zodat de
  balk echt als overlay over de content ligt. FAB iets omlaag.

### v127 — Tabbalk-positie fix (geen zwevend gat meer)  (PWA ff-v99)
- `position:fixed` gaf op iOS-standalone een balk die te hoog zweefde met een zwarte band
  eronder. Balk nu **in de flow** als laatste element van de app-shell-kolom (deelt hoogte met
  de scrollende .shell) -> altijd correct onderaan, content vult het scherm tot aan de balk.
- Blijft een zwevende frosted pill (gecentreerd, marges, radius, blur, transparant). Blob/animatie
  ongewijzigd. main-ondermarge terug naar 14px (geen lege band).

### v128 — WhatsApp-tabbalk: frosted overlay + animerende bubble  (PWA ff-v100)
- Betrouwbaar geankerd: fullwidth `position:fixed` container op `bottom:0` (onzichtbaar) met
  daarin de gecentreerde frosted pill. Lost het "te hoog zwevend met zwart gat" op iOS-standalone op.
- Content schuift er weer achterlangs (echte frosted-glass overlay), bubble animeert achter de
  actieve tab. Ondermarge 76px zodat het laatste item vrij boven de balk komt.

### v129 — Fullscreen: zwarte band onderin weg  (PWA ff-v101)
- `html` krijgt de app-achtergrond (`var(--bg)`, min-height:100%) -> de iOS safe-area onder de
  home-indicator en eventuele niet-gedekte ruimte tonen geen PWA-zwart meer.
- Balk dichter naar de onderrand (container-padding 8px -> 4px) en minder gereserveerde ruimte
  boven de balk (76px -> 60px), zodat de content het scherm vult en de frosted balk er net boven
  de onderrand overheen ligt.

### v130 — Echte edge-to-edge fullscreen app-shell  (PWA ff-v102)
- App-shell op het rotsvaste iOS-patroon: `body{position:fixed; inset:0}` (exacte viewport-box)
  i.p.v. `100dvh`+flex -> haalt de viewport-misrekening weg die de ongebruikte zones/zwarte
  band veroorzaakte.
- Header is nu een **frosted overlay** (`position:fixed; top:0`); content scrollt er onder de
  notch achterlangs (.shell padding-top = safe-area-top + header-hoogte).
- Balk blijft onderaan verankerd; content vult tot de onderrand. (Op test verifiëren op toestel.)

### v131 — Balk in de bottom-zone (geen safe-area-reservering)  (PWA ff-v103)
- Onderbalk: `env(safe-area-inset-bottom)`-reservering eruit; balk zit nu vlak boven de
  schermrand (vaste 8px), niet meer boven een phantom "Safari-toolbar"-zone. main-clearance 72px.

### v132 — Header = frosted blur (geen kleurband)  (PWA ff-v104)
- Header-achtergrond transparant gemaakt (`color-mix(var(--surface) 55%, transparent)` + blur 18px)
  i.p.v. dekkend `--nav`; content blurt er nu doorheen zoals WhatsApp. Hairline-rand verzacht.

### v133 — Service worker network-first (einde "stale UI na deploy")  (PWA ff-v105)
- SW serveert pagina's nu NETWORK-FIRST i.p.v. stale-while-revalidate: een nieuwe deploy is
  direct zichtbaar (1 reload), offline valt het terug op de cache. Lost het terugkerende
  "ik deploy maar zie de oude versie" op. Statische assets blijven SWR (snel).

### v134 — Flikker bij verschijnen weg (blur direct)  (PWA ff-v106)
- Header en onderbalk in een eigen GPU-laag (`transform:translateZ(0)`) zodat de backdrop-filter
  vanaf het eerste frame gecomposit is -> geen "eerst scherp, dan blur"-flits meer.
- Beide uitgesloten van de view-transition-snapshot (`view-transition-name` + group `animation:none`)
  zodat ze tijdens navigatie live (geblurd) blijven i.p.v. als platte snapshot.

## Sessie juni 2026 — uitbreiding na de UX/UI-audit (v105 → v121)

Startpunt: **v105** (premium-UI-audit toegepast: fluid typography, CLS-fixes, WCAG AA,
forced-colors). Hieronder alles wat daarna is gebouwd.

### v121 — Auto-herindex + waterdichte kennisbank-scheiding  (PWA ff-v94)
- **Dagelijkse cron-herindex** van de kennisbank (03:00 UTC, bestaande trigger): FAQ +
  portaal-teelt + gepubliceerd nieuws + agenda. Handmatig herindexeren hoeft niet meer.
- **Harde audience-backstop** in `rag.ts` `ask()`: resultaten worden in code gefilterd op
  toegestane audience (portaal = `public`+`grower`, intranet = `public`+`internal`).
  Interne content lekt zo **nooit** naar het portaal, ook niet als het Vectorize-filter faalt.

### v120 — Meldingen/Noodmelding-herinrichting + één zoekbalk  (PWA ff-v93)
- **Noodmelding/BHV** is geen aparte tab/module meer; staat als rode knop onder
  "Snel melden" bovenaan `/meldingen`. `/noodmelding` valt nu onder de meldingen-module.
  Verwijderd uit `MODULES` (`modules.ts`), `DEFAULT_MODULE_GROUP` (`nav.ts`) en de
  zijbalk-navlijst (`layout.ts`); PAD-guard `/noodmelding` → `meldingen`.
- **Mijn account**: blijft altijd zichtbaar (géén aan/uit-module), maar de blokken
  Competitie, Voice-calling en Kantine-saldo verschijnen alleen als die modules aanstaan.
- **Vraagbaak**: twee losse zoekbalken samengevoegd tot **één** balk met twee knoppen
  (Zoek = live nieuws/docs/mensen; Vraag kennisbank = AI-antwoord met bronnen).
- **Kennisbank indexeert nu ook nieuws + agenda** (`syncIntranetContent` in `rag.ts`),
  zodat vragen als "wanneer is de Fresh BBQ" beantwoord worden.

### v119 — Configureerbare begroetingsheader  (PWA ff-v92)
- Nieuw: `src/headercfg.ts` (config + varianten als JSON in `app_settings`, `pickGreeting`).
- Beheer → **Header & begroeting** (`src/views/beheerheader.ts`, routes `/beheer/header`):
  aan/uit, dagdeel-filter, gewogen random, ondertitel-sjabloon, gradient/tekstkleur,
  varianten-editor en live preview. Standaarden = huidige groene hero (geen breaking change).

### v118 — wrangler.toml hersteld
- NUL-bytes (bestandscorruptie) uit `wrangler.toml` verwijderd; deploy werkte daardoor weer.

### v117 — Vectorize-binding actief
- `[[vectorize]]`-binding (`VECTORIZE` → index `ff-kb`) uit commentaar gehaald in wrangler.toml.

### v116 — Kennisbank ook op het klantenportaal  (PWA ff-v91)
- `/portaal/ask` (portaal-sessie vereist), audience `public`+`grower`, **antwoord in de taal
  van de klant** (`klant.Taal`). Vraagbaak op het portaal-dashboard.
- `syncPortalContent` indexeert gepubliceerde rassen/teeltadvies/snoei naar `kb_docs`.
- i18n ask-teksten toegevoegd (nl/en/de/es).

### v115 — Kennisbank/vraagbaak (RAG) op het intranet  (PWA ff-v90)
- Nieuw: `src/rag.ts` (embed → Vectorize → LLM; m.m.v. `@cf/baai/bge-base-en-v1.5` +
  `@cf/meta/llama-3.1-8b-instruct`). Route `/api/ask` + admin `/api/kennisbank/reindex`.
- Vraagbaak-UI op `/zoek`. Migratie **0012** (`kb_docs`, `kb_chunks`, `ask_log`) + 5 interne
  FAQ's geseed (verlof, ziekmelden, IT, kantine, BHV). Defensief: werkt/deployt ook zonder
  Vectorize-index.

### v114 — "Voor jou" dynamische home-header  (PWA ff-v89)
- Nieuw: `src/foryou.ts`. Hero toont tijdsgroet + voornaam + teller van nieuwe dingen sinds
  je laatste bezoek; tik → `/voor-jou` met groepen per module (Nieuws/Prikbord/Agenda/
  Meldingen). Uitgezette modules tellen niet mee. Migratie **0011** (`user_module_seen`).

### v113 — Bug-fix-bundel  (PWA ff-v88)
- Nieuws-reacties verwijderen: `confirm()` → `data-undo` (direct + undo, zoals prikbord).
- "Opslaan"-spinner overlapt tekst niet meer (`padding-right` op `.is-loading`).
- Beheer-Modules labels kappen netjes af (`.ulabel` ellipsis).

### v112 — Polls/peilingen op het prikbord  (PWA ff-v87)
- Nieuw: `src/polls.ts`. Migratie **0010** (`polls`, `poll_stemmen`). Peiling maken in het
  prikbord-formulier; live stemmen via `/api/poll-stem`; sluiten/verwijderen (ownership).
  Stemmen geaggregeerd (AVG).

### v111 — D1-vertaalcache + vertaal-UI-tweaks  (PWA ff-v86)
- Migratie **0009** (`vertaal_cache`): vertalingen gecachet per sha256(taal+bron+tekst).
- "Vertaal dit"-knop rechts van de emoji-reacties; verborgen als voorkeurstaal = Nederlands.

### v110 — Inline vertaling fase 2  (PWA ff-v85)
- Taalvoorkeur in Mijn account ("Taal & vertaling") + automatisch vertalen op paginalaad
  (device-lokaal: localStorage `ff_lang`/`ff_auto`).

### v109 — Inline vertaling MVP  (PWA ff-v84)
- Nieuw: `src/translate.ts` (Workers AI `@cf/meta/m2m100-1.2b`). "Vertaal dit" op nieuws +
  prikbord, taalkeuze onthouden, toggle terug. Route `/api/vertaal`. Binding `[ai]` (AI).

### v108 — Fundament-ronde 2  (PWA ff-v83)
- 58 inline flex-combo's → utility-classes; `fadeUp`-entrance `.42s` → `var(--dur-screen)`;
  ARIA-pass (0 echte icoon-only-controls zonder label).

### v107 — Fundament-ronde 1 (designsysteem-consolidatie)  (PWA ff-v82)
- 59 losse spacing-px → `var(--sp-*)`; utility-classes `.row/.row-top/.wrap/.between/.grow`;
  `meldingen.ts` als referentie op de gedeelde `page()`-template.

### v106 — Scroll-bug fix  (PWA ff-v81)
- Pull-to-refresh las `window.scrollY` (altijd 0 in de app-shell) → nu `.shell.scrollTop`
  op mobiel. Loste het mid-scroll verspringen/verversen op.

---

## D1-migraties (live toegepast op fresh-forward-db)
- `0009_vertaal_cache.sql` — `vertaal_cache`
- `0010_polls.sql` — `polls`, `poll_stemmen`, index
- `0011_user_module_seen.sql` — `user_module_seen`
- `0012_kennisbank.sql` — `kb_docs`, `kb_chunks`, `ask_log` (+ 5 FAQ-seed)
> Eerdere migraties 0001–0008 dateren van vóór deze sessie.

## Nieuwe bronbestanden
`src/translate.ts`, `src/polls.ts`, `src/foryou.ts`, `src/rag.ts`, `src/headercfg.ts`,
`src/views/beheerheader.ts`.

## Bindings & config (wrangler.toml)
- `[ai]` → `AI` (Workers AI: vertaling + kennisbank-embeddings/LLM).
- `[[vectorize]]` → `VECTORIZE` (index `ff-kb`, 768 dims, cosine).
- Bestaand: D1 `DB`, R2 `DOCS`, cron `0 3 * * *`.

## Beveiligingsmodel (kort)
- **Intranet** = achter Cloudflare Access (M365/Entra-SSO). Volledige **JWT-verificatie aan**
  via secrets `ACCESS_TEAM_DOMAIN` + `ACCESS_AUD` (de Worker verifieert zelf de handtekening).
- **Portaal** = eigen tokensysteem (magic-/invitelink ondertekend met secret `PORTAL_SECRET`).
  `/portaal*` is bewust publiek (Access-bypass); Access NIET op het portaal zetten (sluit telers buiten).
- De twee identiteiten staan los: een portaal-token wordt nooit als intranet-identiteit
  geaccepteerd; de rollen-middleware slaat `/portaal*` over.
- **Kennisbank-scheiding**: docs hebben een `audience` (`internal`/`grower`/`public`).
  Vraagbaak filtert op audience in Vectorize én — als harde garantie — in code. Portaal
  (`public`+`grower`) kan nooit interne content (`internal`) teruggeven.

## Eenmalige setup / ops
- Vectorize-index bestaat: `ff-kb` (aangemaakt met `wrangler vectorize create ff-kb --dimensions=768 --metric=cosine`).
- **Aanrader**: metadata-index voor betrouwbaar audience-filteren:
  `npx wrangler vectorize create-metadata-index ff-kb --property-name=audience --type=string`.
- Na deploy met nieuwe content: `/zoek` → beheerder → "Kennisbank herindexeren" (of wacht op de nachtelijke cron).
- **E-mail**: Resend is geannuleerd (DNS-gedoe). Portaal-toegang loopt via **Beheer → Klanten →
  inloglink genereren** (7 dagen geldig, daarna 30 dagen sessie). Self-service e-mail later
  eventueel via Microsoft 365/Graph (geen nieuwe DNS nodig).

## Test-omgeving (staging) opgezet — 9 juni 2026
- Wrangler-environment `[env.test]` → aparte Worker `fresh-forward-intranet-test`.
- Test-D1 `fresh-forward-db-test` (EU) aangemaakt + volledig productieschema toegepast
  (`migratie/schema-test.sql`). Test-R2 `ff-documenten-test` + Vectorize `ff-kb-test` nog
  aan te maken (zie `TEST-OMGEVING.md`).
- npm-scripts: `deploy:test`, `dev:test`. Test draait in DEV_MODE (geen Access) — alleen dummy-data.

## Afgerond (9 juni 2026)
- [x] Vectorize metadata-index op `audience` bestaat (audience-filter werkt nu ook in Vectorize zelf).
- [x] Gelekte Airtable-token verwijderd + misgevormde secret opgeruimd.
- [x] Gedeployed t/m v121; kennisbank herindexeerd (nieuws + agenda vindbaar).

## Open punten / TODO
- [ ] Optioneel: melding-categorieën uitbreiden naar Storing / Onveilige situatie / Defect
      materieel (nu nog voorraad/defect; bewust niet gewijzigd zonder akkoord).
- [ ] Optioneel: self-service portaal-mail via M365/Graph.
