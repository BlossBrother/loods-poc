# Doorlichting — security · smoke · AVG/GDPR · premium-feel

> Volledige run vóór de Buddee-go-live. Bijgewerkt 8 juni 2026 (build v102).
> Korte versie: **technisch gezond en premium; één kritieke security-blocker (P1) vóór bredere/HR-uitrol.**

---

## 0. Verdict in één blik

| Spoor | Stand | Belangrijkste actie |
|------|------|---------------------|
| Smoke-test | ✅ groen | — |
| Security | ✅ voordeur dicht (Access/Azure AD) | In-Worker JWT-verificatie als 2e laag (aanbevolen) |
| AVG/GDPR (HR) | ⚠️ paar acties | Ziekteverlof uitsluiten, demo-namen wissen, transparantie + DPA |
| Premium-feel | ✅ hoog | Resterende checklist-items (optioneel) |

**Update 8 juni:** Cloudflare Access (Azure AD) staat op de (enige) workers.dev-hostname en is geverifieerd — een **vers incognito-venster gaat direct naar de Microsoft-login**, dus er is géén onauthenticated ingang. Daarmee is de kritieke identiteits-bypass **aan de rand al afgevangen** (Access zet de identiteits-header en strípt een vervalste). De echte poortwachters vóór de Buddee-go-live zijn nu **AVG** (ziekteverlof uitsluiten) en het **wissen van de demo-namen**; de in-Worker JWT-verificatie is een aanbevolen tweede laag. **Inmiddels ook aangezet (8 juni):** `ACCESS_TEAM_DOMAIN` + `ACCESS_AUD` staan als secrets, de Worker verifieert het Access-JWT nu zelf, en de identiteit wordt correct herkend (live geverifieerd — "Je plaatst als …" toont de juiste medewerker). Beide lagen staan dus.

---

## 1. Smoke-test ✅

- `npx tsc --noEmit`: **0 fouten** (strict).
- Linux-esbuild-bundel: schoon, **±556 KB**.
- D1: alle `.prepare()`-queries gebruiken **bind-parameters** (geen SQL-injectie; de enige `${...}` in een query is een **statische kolomlijst**, geen user-input).
- `.dev.vars` staat in `.gitignore`; projectmap is geen git-repo → niets gecommit.
- Verlof-planner render-getest met demo-data; hoofdschermen compileren/bundelen schoon.
- Geen `eval`/`new Function`; `innerHTML`-gebruik is in client-scripts met gecontroleerde/ge-escapete inhoud.

---

## 2. Security (onafhankelijke review)

### P1 — was kritiek, nu aan de rand afgevangen ✅

**P1-1 · Vervalsbare identiteit — gemitigeerd door Access (Azure AD).**
De Worker verifieert de Access-JWT (nog) niet zelf: `resolveAccessEmail` vertrouwt de header `cf-access-authenticated-user-email` / het `CF_Authorization`-cookie (`src/access.ts`), en élke autorisatie hangt aan dat e-mailadres. Dít zou een volledige bypass zijn **als** de Worker buiten Access om bereikbaar was. **Bevestigd op 8 juni:** Cloudflare Access (Azure AD) staat op de enige hostname (`…workers.dev`) — een vers incognito-venster gaat direct naar de Microsoft-login. Access zet de identiteits-header zelf en strípt een binnengesmokkelde waarde, dus de header is betrouwbaar en er is geen onauthenticated ingang. **Restrisico = laag.**
**Aanbevolen (defense-in-depth, niet kritiek):** zet `ACCESS_TEAM_DOMAIN` + `ACCESS_AUD` zodat `verifyAccessJwt` (staat al klaar) óók in de Worker draait. Dan weigert de Worker zélf elk verzoek zonder geldig Access-token — bescherming tegen een toekomstige misconfig of een route die ooit naast Access ontstaat. **Niet** doen: de workers.dev-route uitzetten — dat is jullie énige hostname en Access staat erop.

### P2 — Belangrijk

- **P2-1 · Demo-verlof met echte namen blijft staan.** De demo-rijen (`source='demo'`, echte medewerkernamen + fictieve data) worden voor iedereen getoond en blijven oneindig staan (de Buddee-sync raakt alleen `source='buddee'`). **Fix:** `DELETE FROM verlof WHERE source='demo';` vóór go-live (zie ook AVG §3).
- **P2-2 · Agenda update/delete: geen eigenaarscheck.** `/agenda/:id/update` en `/agenda/:id/delete` checken alleen rol (admin **of** pv), niet of het event van de gebruiker is — een pv-gebruiker kan elk event (ook bedrijfsbreed) wijzigen/verwijderen. **Fix:** eigenaars-/admin-check, of bewust documenteren dat pv = gedeelde agenda-beheerder.
- **P2-3 · `/agenda/verlof/sync` alleen op pv-rol.** Een (eventueel vervalste) pv-identiteit kan herhaald de Buddee-call afvuren (credential-druk op HR + verlof-tabel overschrijven). **Fix:** beperken tot admin/beheerder + minimale interval/lock.
- **P2-4 · Geen rate-limiting** op `/portaal/login` (magic-link → mail-bombing/Resend-quota), `/api/reactie`, `/push/subscribe`. **Fix:** Cloudflare Rate Limiting Rule aan de rand (snelste), of een cooldown per e-mail/identiteit.
- **P2-5 · `/bestand` serveert elke R2-key.** Een ingelogde (of vervalste) gebruiker kan elk geüpload object lezen door de key te raden/enumereren (keys zijn meestal UUID's = onraadbaar, maar enkele zijn `Date.now()+random`). **Fix:** prefix-allowlist per route (intern vs. portaal/klantdocs) en/of eigenaar per object.

### P3 — Hardening (nice-to-have)
- **Upload-validatie**: geen type-allowlist/groottecap (stored-XSS is al voorkomen door `nosniff`+attachment; resteert opslag-misbruik). Voeg image-allowlist + maxgrootte toe.
- **`.dev.vars`**: bevat echt-ogende secrets (lokaal, niet gecommit). Controleer dat ze niet gelijk zijn aan productie; zo wel, roteren.
- **Open redirect** (`/competitie/match` `back`-veld): forceer dat `back` met `/` begint.
- **Undo-snackbar `sendBeacon`**: **niet** misbruikbaar (server checkt zelf `canEditOrDelete`). Geen actie.
- **CSRF**: leunt op Access + `SameSite=Lax` + `form-action 'self'`-CSP. Prima zodra P1 dicht is; overweeg origin-check op destructieve POSTs als extra laag.

**Geen SQL-injectie en geen stored-XSS gevonden** — de geparametriseerde D1-laag en hono-escaping zijn solide. Ook de nieuwe `verlofPage` rendert `employee_name` veilig (auto-escaped).

---

## 3. AVG / GDPR — Buddee (HR) verlofkoppeling

Verlof = persoonsgegevens. Ook al halen we "alleen verlof voor een interne check", er gelden gewoon AVG-eisen. Stand + acties:

**Grondslag (art. 6).** Operationeel afwezigheidsoverzicht past op **gerechtvaardigd belang** (art. 6(1)(f)) — bedrijfsvoering/planning, "wie is er weg". Documenteer deze afweging (LIA) kort.

**⚠️ Bijzondere categorie — ziekteverlof uitsluiten.** Dít is het belangrijkste AVG-punt: **ziekte-/medisch verlof is een gezondheidsgegeven (bijzondere categorie, art. 9)** en mag níét zomaar bedrijfsbreed zichtbaar zijn. Onze mapping moet **alleen vakantie/bijzonder verlof** overnemen en **ziekte/medische types expliciet wegfilteren** (en zeker geen reden/diagnose). → Concrete to-do bij het afmaken van de Buddee-mapping: whitelist op verloftype, ziekte eruit.

**Dataminimalisatie ✅.** We nemen alleen naam, afdeling, datum, type en status over — **geen reden, geen saldo, geen contractdetails**. Houden zo.

**Doelbinding.** Alleen intern afwezigheidsoverzicht; niet gebruiken voor beoordeling/controle van individuen.

**Bewaartermijn.** De dagelijkse sync **vervangt** de Buddee-rijen, dus er hoopt geen oude historie op zolang Buddee de bron blijft. Toon bewust alleen de huidige/nabije periode. Geef de `verlof`-tabel (net als de audit-log) een expliciete retentie.

**Toegang.** Achter Cloudflare Access (intern). **Maar P1-1 ondermijnt dit** — fix P1 vóór er HR-data in komt. Overweeg of álle medewerkers het hele bedrijf moeten zien, of dat per afdeling volstaat (kan later).

**Verwerkersovereenkomsten (DPA).** Leg vast met **Buddee** (bron) en **Cloudflare** (D1/R2 als (sub)verwerker). Data staat in de EU (D1-regio EEUR) — goed.

**Beveiliging van de koppeling ✅/➡️.** HTTPS, credentials als Cloudflare-secret (niet in code), foutmeldingen zonder credentials. **Aanbeveling:** een **apart, read-only service-account** in Buddee (least privilege: alleen leave + employees), géén persoonlijke login.

**Transparantie.** Informeer medewerkers (privacyverklaring/intranet-mededeling) dat hun goedgekeurde verlof intern zichtbaar is, met grondslag en bewaartermijn.

**Demo-data nu.** De demo toont **echte namen met fictief verlof** aan iedereen — geen privacybreuk (data is verzonnen), maar wél verwarrend (collega lijkt afwezig). **Wis de demo vóór go-live** (zie P2-1).

**DPIA.** Waarschijnlijk niet verplicht (geen grootschalige bijzondere categorieën, mits ziekte uitgesloten), maar leg de afweging kort vast.

**Betrokkenenrechten.** Inzage/correctie loopt via de bron (Buddee); het intranet is een read-only spiegel — vermeld dat in de privacyverklaring.

---

## 4. Premium-feel ✅ (hoog)

De app zit op een hoog premium-niveau, en de laatste rondes hebben de scherpe randen weggewerkt:
- **Motion compleet en consistent**: gelaagde entrance, press-feedback overal, view-transitions + shared-element (agenda), foto-lightbox met pinch-zoom, undo-snackbar, en sinds v98/v99 één **asymmetrisch in/uit-patroon** (zachte ease-out in, strakke ease-in uit) op menu, sheets, lightbox, scrim, toasts; lijst-items glijden netjes weg.
- **Gebaren**: pull-to-refresh, swipe-acties, swipe-to-go-back, sleepbare bottom-sheet.
- **Looks**: frosted nav/header/popover, calm surfaces, tabulaire cijfers, licht/donker-toggle.
- **Toegankelijkheid**: focus-visible, focus-trap in de sheet, reduced-motion overal.
- **Stabiliteit**: de iOS-compose-bug (portal-fix) en de overlay-freeze (`[hidden]`) zijn opgelost; de 2 prikbord-bugjes (roze balk, snackbar) in v102.

**Resterende premium-laag** (optioneel, staat in `PREMIUM-PARITY-CHECKLIST.md`): optimistic posten, echte AJAX pull-to-refresh, offline-indicator + acties-in-wachtrij, blur-up/compressie bij foto's, relatieve tijd, ongelezen-badges, en `page()/detail()` overal doortrekken. Geen blockers — puur verfijning.

---

## 5. Aanbevolen volgorde naar go-live

1. **P1-1** — Access-JWT aan (`ACCESS_TEAM_DOMAIN`+`ACCESS_AUD`) **én** workers.dev dicht. *Niets anders telt zolang dit open staat.*
2. **AVG-mapping** — bij het afmaken van Buddee: **ziekteverlof uitsluiten**, alleen vakantie/bijzonder.
3. **P2-1** — demo-rijen wissen (`DELETE FROM verlof WHERE source='demo';`).
4. **P2-3 / P2-2** — verlof-sync admin-only + interval; agenda update/delete eigenaarscheck.
5. **P2-4 / P2-5 / P3-1** — edge-rate-limiting; `/bestand` namespace-restrictie; upload-validatie.
6. **AVG-administratie** — DPA's (Buddee + Cloudflare), privacyverklaring/transparantie, retentie op `verlof`, read-only service-account.

> Punten 1–3 zijn de echte poortwachters vóór er HR-data in komt; 4–6 kort daarna. De rest is hardening/verfijning.
