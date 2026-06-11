# Ronde 5 — klantenportaal, in-/uitcheck, auth-hardening

Korte handleiding bij deze update. Uitpakken over de projectmap (overschrijven),
dan onderstaande stappen. `.dev.vars` en `node_modules` blijven staan.

## Wat er nieuw is
1. **Klantenportaal** (`/portaal`) — volledig gescheiden van het interne deel.
   Klanten loggen in met een **magic link** naar hun eigen e-mail (geen wachtwoord).
   Toont: rassen, teeltadvies, snoei & pluk, documenten. Beheer in Airtable.
2. **In-/uitcheck** op `/bezoek` — knoppen "Inchecken"/"Uitchecken" per bezoeker,
   met tijdstip in Airtable. Optioneel gelogd naar D1.
3. **Auth-hardening** (intern deel):
   - Niet meer "fail-open": ontbreekt de identiteit, dan géén beheer (vroeger: wél).
   - Optioneel volledige **Access-JWT-verificatie** (zie stap C).
   - R2-downloads worden als *attachment* geserveerd (behalve PDF/afbeeldingen).

## Nieuwe Airtable-tabellen (al aangemaakt, met demodata)
`Klanten`, `Rassen`, `Teeltadvies`, `Snoei en pluk`, `Klantdocumenten`.
Beheer = gewoon in Airtable. Zet **Gepubliceerd** aan om iets in het portaal te tonen.
Een klant krijgt toegang door 'm in **Klanten** te zetten met **Actief** aan.
(Er staat al een testklant met jouw e-mail klaar.)

---

## Stap A — lokaal testen
1. Zet in `.dev.vars` (zie `.dev.vars.example`):
   - `DEV_MODE=true`
   - `PORTAL_SECRET=<lange willekeurige string>`
2. `npm run dev`
3. Intern: open `/` , `/bezoek` (test in-/uitchecken).
4. Portaal: open `/portaal/login`, vul jouw e-mail in. Omdat er geen mailprovider
   is ingesteld, verschijnt de inloglink **in de terminal** (en op het scherm in
   testmodus). Klik die om in te loggen.

## Stap B — live zetten (basis)
```powershell
cd C:\Users\FreshFPeterJanvanIng\fresh-forward-intranet
npx wrangler secret put PORTAL_SECRET     # plak een lange willekeurige string
npm run deploy
```
Daarna in **Cloudflare Zero Trust → Access**:
- Zorg dat het portaal **publiek bereikbaar** is: voeg aan de Access-applicatie een
  **Bypass-policy** toe voor pad `/portaal*` (klanten zitten niet in M365).
  De rest van de site blijft achter Access/M365.

## Stap C — magic-link mail (aanrader voor klanten)
Zonder mailprovider werkt login alleen via de console-link (prima om te testen,
niet voor klanten). Voor echte mail:
1. Maak een account op resend.com, verifieer je afzenddomein.
2. `npx wrangler secret put RESEND_API_KEY`
3. Controleer `RESEND_FROM` en `PORTAL_BASE_URL` in `wrangler.toml`.
4. `npm run deploy`

## Stap D — auth-hardening volledig aanzetten (sterk aangeraden)
Voor échte JWT-verificatie i.p.v. alleen de Access-header:
1. In Cloudflare Access → je applicatie → kopieer **Team domain** en **AUD-tag**.
2. Zet in `wrangler.toml` onder `[vars]`:
   - `ACCESS_TEAM_DOMAIN = "https://JOUW-TEAM.cloudflareaccess.com"`
   - `ACCESS_AUD = "DE-AUD-TAG"`
3. `npm run deploy`. De Worker verifieert dan zelf het Access-token.

## Stap E — in-/uitcheck-logging naar D1 (optioneel)
De in-/uitcheck werkt direct (schrijft naar Airtable). Wil je ook een logboek:
```powershell
npx wrangler d1 create ff-logs
# plak de database_id in wrangler.toml ([[d1_databases]]) en haal de # weg
npx wrangler d1 execute ff-logs --remote --file=./migrations/0001_events.sql
npm run deploy
```
Zonder D1 logt de app gewoon naar de console (geen fouten).

---

## Beveiliging samengevat
- Portaal en intern zijn gescheiden: aparte login, sessiecookie alleen op `/portaal`,
  geen interne rechten voor klanten.
- Magic-link tokens en sessies zijn HMAC-ondertekend (PORTAL_SECRET), 15 min resp. 30 dagen geldig.
- Geen e-mail-enumeratie: het inlogscherm verklapt niet of een adres bestaat.
- AVG: zet `AVG_CLEANUP_ENABLED="true"` zodra je de bewaartermijn bevestigt.
