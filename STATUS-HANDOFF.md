# Status & handoff — Fresh Forward platform

_Laatst bijgewerkt: 4 juni 2026 (ronde 5)._

## Waar we staan
1. **Intern deel** — intranet, bezoekmelding (+ in-/uitcheck), competitie, prikbord,
   beheer. Live achter Cloudflare Access (M365).
2. **Datamodel in Airtable** — base "Fresh Forward Platform" (`appfamE6fOFcwcONn`).
   Nieuw deze ronde: `Klanten`, `Rassen`, `Teeltadvies`, `Snoei en pluk`,
   `Klantdocumenten` (met demodata). `Bezoekmeldingen` had al in-/uitcheck-velden.
3. **NIEUW in deze ronde (klaar om te testen/deployen):**
   - **Klantenportaal** (`/portaal`) — volledig gescheiden; magic-link login per
     e-mail; rassen / teeltadvies / snoei & pluk / documenten.
   - **In-/uitcheck** op `/bezoek` — knoppen + tijdstip in Airtable; optioneel D1-log.
   - **Auth-hardening** — niet meer fail-open; optionele Access-JWT-verificatie;
     R2-downloads als attachment.

## Wat jij thuis doet
1. Pak de zip uit over je projectmap (overschrijven). `.dev.vars`/`node_modules` blijven.
2. `npm install` (geen nieuwe dependencies; veilig).
3. Volg **RONDE-5-KLANTENPORTAAL.md** stap A–E (lokaal testen → deployen → mail →
   auth-hardening → optioneel D1).

## Routes
- Intern: `/` · `/bezoek` · `/competitie` · `/competitie/darten` · `/social` · `/beheer*`
- Portaal: `/portaal` · `/portaal/login` · `/portaal/verify` · `/portaal/rassen` ·
  `/portaal/teeltadvies` · `/portaal/snoei-pluk` · `/portaal/documenten`
- `/health` · PWA-assets

## Nog op de planning
- Mailchimp-koppeling (fase 5/laatste)
- Eigen domein + M365-SSO i.p.v. e-mailcode (optioneel)

## Verifieerd (deze ronde)
- TypeScript typecheck: groen.
- Bundel (esbuild): groen, 98 KB.
- Token-/sessielogica portaal: 9/9 unit-checks groen (HMAC, tamper, kind-scheiding,
  veilige cookie-attributen).
