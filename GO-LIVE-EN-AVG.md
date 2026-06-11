# Go-live & AVG — Fresh Forward intern platform

## A. Go-live (deploy)

Alles staat klaar; je hoeft alleen onderstaande stappen te doen.

### 1. Eénmalig: code naar GitHub
In de projectmap:
```powershell
git init
git add -A
git commit -m "Fresh Forward intern platform"
git branch -M main
git remote add origin <jouw-repo-url>
git push -u origin main
```

### 2. Cloudflare-token met Workers-rechten
Het eerdere token miste de Workers-scope (de 403). Maak/gebruik een token met
"Edit Cloudflare Workers". Daarna in de projectmap:
```powershell
npx wrangler login
npx wrangler secret put AIRTABLE_TOKEN     # plak hetzelfde Airtable-token
npm run deploy
```
Na deploy krijg je een URL: `https://fresh-forward-intranet.<subdomein>.workers.dev`.

### 3. Automatische deploy via GitHub (optioneel maar aangeraden)
`.github/workflows/deploy.yml` staat klaar. Zet in GitHub (Settings → Secrets →
Actions) deze secrets:
- `CLOUDFLARE_API_TOKEN`  — token met Edit Workers
- `CLOUDFLARE_ACCOUNT_ID` — je Cloudflare account-ID

Vanaf dan deployt elke `git push` naar `main` automatisch.

### 4. Toegang voor collega's: Cloudflare Access + M365
1. Cloudflare dashboard → **Zero Trust** → **Access** → **Applications** → *Add an application* → **Self-hosted**.
2. Application domain: de Worker-URL (of een eigen subdomein, bijv. `intranet.freshforward.nl`).
3. **Identity provider**: voeg **Microsoft Entra ID (M365)** toe.
4. **Policy**: *Allow* → e-mails eindigend op jullie bedrijfsdomein (bijv. `@freshforward.nl`).

Pas hierna is het platform afgeschermd. **Doe dit vóór je echte data invoert.**

---

## B. AVG / privacy

### Wat is al ingebouwd
- **Security-headers** op alle pagina's (CSP, no-sniff, geen iframes, strict referrer, beperkte permissions).
- **Toegang** volledig via Cloudflare Access + M365 — geen eigen wachtwoorden, geen open endpoints.
- **Bewaartermijn-opschoning** voor bezoekmeldingen: een dagelijkse cron verwijdert
  meldingen ouder dan `RETENTIE_DAGEN` (standaard 90). **Staat UIT** tot je 'm bewust
  aanzet: in `wrangler.toml` `AVG_CLEANUP_ENABLED = "true"` en opnieuw deployen.
- **Dataminimalisatie in code**: alleen de velden die nodig zijn worden uitgelezen.

### Persoonsgegevens-inventaris
| Bevat persoonsgegevens | Waar |
|---|---|
| Ja | Medewerkers (naam, e-mail), Bezoekmeldingen (naam/e-mail bezoeker), iPad-Bezoekers (naam, kenteken, handtekening) |
| Nee | Nieuws, Documenten, Wedstrijden/competitie |

### Aandachtspunten (jouw kant, niet-technisch)
- **Airtable = VS-leverancier.** Houd persoonsgegevens minimaal; controleer de
  verwerkersovereenkomst (DPA) met Airtable en Microsoft.
- **Bewaartermijn iPad-Bezoekers**: die base beheren we niet vanuit dit platform —
  spreek daar apart een opschoonbeleid af (handtekeningen/kentekens zijn gevoelig).
- **Grondslag** per categorie vastleggen (gerechtvaardigd belang/overeenkomst).
- **Competitie** is met namen van collega's — informeer het team dat scores intern
  zichtbaar zijn (transparantie).
- Zet `AVG_CLEANUP_ENABLED` pas op `"true"` als je zeker weet dat 90 dagen klopt;
  verwijderen is definitief.

### Aanrader vóór livegang
Korte AVG-check: welke velden zijn écht nodig, wie mag wat zien, en is de
bewaartermijn passend. Daarna cleanup aanzetten.
