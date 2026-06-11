# Premium-parity checklist — wat top-apps doen dat wij nog niet hebben

> Polish-ronde vóór we features toevoegen. Bijgewerkt 8 juni 2026 (na v95).
> Moeite: **S** = uur(en) · **M** = ~dag · **L** = meerdere dagen. Impact: ★–★★★.

## Wat we al goed doen (niet in de lijst)
Designtokens, motion-laag (entrance, press, pull-to-refresh, emoji-pop + count-tick, view-transitions, reduced-motion), gebaren (pull-to-refresh, swipe-acties, swipe-to-go-back, long-press), bottom-nav + Meer-popover + sub-tabs, frosted nav/header/popover, skeletons + lege staten, premium bottom-sheet compose (nu iOS-proof), focus-visible, PWA met install-prompt + push + SWR-cache, tabulaire cijfers. Dit is al ver — de lijst hieronder is puur de **resterende premium-laag**.

---

## 1. Feedback & micro-interacties (grootste "premium gevoel"-winst)

- **★★★ Undo-snackbar i.p.v. bevestigingsdialoog · M** — Top-apps (Gmail, Slack) laten je verwijderen/archiveren *meteen* gebeuren met een "Verwijderd · Ongedaan maken"-balk (5s). Voelt sneller en minder eng dan een `confirm()`-popup. Wij gebruiken nu `confirm()` bij verwijderen van posts/reacties/meldingen.
- **★★★ Optimistic UI bij plaatsen · M** — Bericht/reactie/melding verschijnt **direct** in de lijst (optimistisch), met stille reconciliatie op de achtergrond. Nu: volledige POST → redirect → herladen. Optimistisch posten is dé verschilmaker in perceived speed.
- **★★ "Verzonden"-vinkje / succes-micro-animatie · S** — Korte check-draw of pulse na een geslaagde actie (al genoteerd als open punt, Set 1 #107/#110).
- **★★ Knop-laadstaat + dubbel-submit-guard · S** — Submit-knop toont een spinner en disablet zichzelf tijdens versturen. Voorkomt dubbele posts en geeft duidelijke status.
- **★ Lege-staat-illustraties · S–M** — Nu nette tekst+icoon; top-apps gebruiken een kleine illustratie/animatie voor warmte.

## 2. Navigatie & overgangen

- **★★★ Shared-element lijst→detail-overgang · M** — De grootste resterende "wow": de aangetikte kaart groeit naar de detailpagina (named view-transitions op agenda-event/training/speler; Chromium, iOS valt terug op fade). Staat al als #1-wow in REVIEW-EN-FINETUNE.
- **★★ Scroll-positie onthouden bij terug · S** — Terug navigeren herstelt de scrollpositie van de lijst (top-apps doen dit standaard; voelt "verloren" zonder).
- **★★ Instant-navigatie / prefetch · M** — Pagina's voorladen bij hover/zichtbaar (of `speculationrules`), zodat tikken instant voelt.
- **★ Swipe tussen tabs · M** — Horizontaal vegen tussen sub-tabs (ranglijst/toernooien) zoals Instagram/Twitter.

## 3. Offline & betrouwbaarheid

- **★★★ Offline-indicator + acties in wachtrij · L** — Top-PWA's tonen een "je bent offline"-balk en **bewaren acties** (post/reactie) om te versturen zodra je weer online bent (Background Sync). Wij cachen nu lezen (SWR) maar schrijven faalt offline.
- **★★ Echte AJAX pull-to-refresh · M** — Nu een `location.reload()`-flits; top-apps swappen alleen de inhoud (geen witte flits).
- **★★ Fout- + retry-staat bij mislukte fetch · S–M** — Nette "Kon niet laden · Opnieuw"-staat i.p.v. stil falen of lege boel.

## 4. Content & media

- **★★ Foto-viewer (lightbox) met pinch-zoom · M** — Tik op een prikbord-/nieuws-afbeelding → full-screen, pinch-to-zoom, vegen om te sluiten. Standaard in elke social app.
- **★★ Client-side beeldcompressie bij upload · M** — Foto's vóór upload verkleinen/comprimeren (sneller, minder R2-opslag, minder data voor de gebruiker).
- **★ Blur-up placeholders · S–M** — Afbeeldingen laden met een wazige mini-versie i.p.v. een lege plek (LQIP) — voelt sneller.
- **★ Paginatie / infinite-scroll op lange feeds · M** — Prikbord/agenda laden nu (vermoedelijk) alles; lazy bijladen houdt het snel bij groei.

## 5. Personalisatie & instellingen

- **★★ Handmatige licht/donker-toggle · S** — Nu alleen automatisch (`prefers-color-scheme`). Top-apps geven Licht / Donker / Systeem als keuze (in Mijn account).
- **★★ Granulaire meldings-voorkeuren + stille uren · M** — Per type aan/uit + "geen meldingen tussen 22–07u". Sluit aan op de bestaande push-laag.
- **★ Respecteer iOS/Android tekstgrootte (Dynamic Type) · S** — Met `rem` + geen harde caps schaalt de UI mee met de systeem-tekstgrootte (toegankelijkheid + comfort).

## 6. Toegankelijkheid & inclusiviteit

- **★★★ Focus-trap in de bottom-sheet/modals · S** — Bij een open sheet moet Tab/VoiceOver *binnen* de sheet blijven (en focus terug naar de + bij sluiten). Nu kan focus achter de overlay belanden. Belangrijk voor toetsenbord/schermlezer.
- **★★ WCAG-contrast-audit op de frosted lagen · S–M** — De blur/transparante nav/header tegen wisselende achtergronden checken op 4.5:1 (al genoteerd, Set 3 #129).
- **★★ Schermlezer-labels op alle icoon-knoppen + `prefers-reduced-transparency` · S** — Systematische `aria-label`-pass; frosted lagen uitzetten bij reduced-transparency.

## 7. Meldingen & aanwezigheid

- **★★ Ongelezen-badges + app-icoon-badge (Badging API) · M** — Een telbol op nav-items én op het PWA-icoon op het beginscherm voor ongelezen meldingen/berichten. Heel "native".
- **★★ Lees-status per item · M** — Markeer berichten/meldingen als gelezen; nieuw = subtiele markering. Sluit aan op het aanwezigheid-spoor (Blok-F).
- **★ Notificatie-centrum · M** — Eén plek met recente meldingen/activiteit.

## 8. Formulieren & invoer

- **★★ Concept automatisch bewaren · S–M** — Half-getypt bericht bewaren (localStorage) zodat het niet verdwijnt bij per ongeluk sluiten/herladen.
- **★ Inline-validatie + tekenteller · S** — Directe veld-feedback en een teller op tekstvelden met limiet.
- **★ Relatieve tijd ("2u geleden") · S** — Naast de absolute datum; voelt levendiger en is standaard in feeds.

## 9. Delight & consistentie

- **★★ Templates overal doortrekken (`page()`/`detail()`/`formPage()`) · M** — De resterende modules op de layout-templates (bewust uitgesteld in v95). Grootste consistentie-winst, laag risico, met render-check per scherm.
- **★ "Wat is er nieuw"-scherm · S** — Korte changelog na een update (top-apps tonen dit één keer).
- **★ iOS-haptiek via native wrapper · L** — Nu Android-only; echte Taptic vereist een Capacitor/WKWebView-schil (geparkeerd, platform-spoor).

---

## Mijn top 5 om eerst te doen (impact ÷ moeite)
1. **Undo-snackbar** i.p.v. `confirm()` (§1) — meteen premiumer + sneller gevoel.
2. **Focus-trap in de sheet** (§6) — kleine moeite, echte correctheid/toegankelijkheid.
3. **Optimistic UI bij plaatsen** (§1) — grootste sprong in perceived speed.
4. **Knop-laadstaat + dubbel-submit-guard** (§1) — betrouwbaarheid, bijna gratis.
5. **Shared-element lijst→detail** (§2) — de "wow" die de app af maakt.

> Security-P1 (echte Access-JWT-verificatie + workers.dev achter Access) staat los hiervan, maar zou ik vóór bredere/externe uitrol echt eerst regelen — zie REVIEW-EN-FINETUNE.md.
