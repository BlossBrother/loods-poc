# Fresh Forward platform — beheer-spiekbriefje

Korte naslag voor het dagelijks beheer. Bewaar dit bij het project.

## Waar woont wat
- **Live app:** https://fresh-forward-intranet.peterjan-vaningen.workers.dev (afgeschermd met Cloudflare Access)
- **Content + data:** Airtable, base **Fresh Forward Platform** (`appfamE6fOFcwcONn`)
- **Bezoekers-iPad (bestaand):** Airtable base **Bezoekersregistratie** (`appXsofo09R8Qax8q`) — read-only ingelezen
- **Code:** `C:\Users\FreshFPeterJanvanIng\fresh-forward-intranet`
- **Hosting:** Cloudflare Worker `fresh-forward-intranet` + dagelijkse cron (03:00 UTC)

---

## Dagelijks beheer = gewoon in Airtable
Alles wat je in Airtable wijzigt, staat **direct** live (geen deploy nodig).

| Wil je… | Doe dit in Airtable |
|---|---|
| Nieuwsbericht plaatsen | Tabel **Nieuws** → record toevoegen → **Status = Gepubliceerd**. (Concept = niet zichtbaar.) Zet **Uitgelicht** aan voor een ster. |
| Document/handleiding delen | Tabel **Documenten** → titel + bestand of **Externe link** + categorie |
| Collega toevoegen | Tabel **Medewerkers** → Naam, **E-mail** (belangrijk, zie prikbord), Rol, Afdeling, **Actief** aan |
| Verjaardag tonen | Bij de medewerker het veld **Verjaardag** invullen (jaar mag echt of fictief) |
| Wedstrijd toevoegen | Kan in de app (/competitie) of in tabel **Wedstrijden** |
| Bezoeker vooraf aanmelden | In de app op **/bezoek** |

**Tip prikbord-naamherkenning:** vul bij elke medewerker het **E-mail**-veld in met hun werkmail. Dan weet het prikbord automatisch wie post; anders kiezen ze hun naam in een lijstje.

---

## Een code-update uitrollen
Alleen nodig als je de *app zelf* wijzigt (niet voor content). In de projectmap:

```powershell
cd C:\Users\FreshFPeterJanvanIng\fresh-forward-intranet
npm run deploy
```

Lokaal eerst testen: `npm run dev` → http://localhost:8787

---

## Toegang beheren (wie mag erin)
Cloudflare → **Zero Trust → Access → Applications → Fresh Forward intranet → policy "e-mail login"**.
- Iedereen met een e-mail op jullie domein komt erin (na code op de mail).
- Specifieke persoon toevoegen/blokkeren: pas de policy-regel aan (Include / Exclude → Emails).

---

## App op je telefoon
Open de live-URL in de browser → menu → **"Toevoegen aan beginscherm"**. Hij gedraagt zich dan als een echte app (eigen icoon, schermvullend).

---

## AVG: oude bezoekmeldingen automatisch opschonen
Staat **uit**. Aanzetten als je de bewaartermijn (90 dagen) bevestigt:
1. In `wrangler.toml`: `AVG_CLEANUP_ENABLED = "true"` (en eventueel `RETENTIE_DAGEN` aanpassen).
2. `npm run deploy`.
De cron verwijdert dan dagelijks bezoekmeldingen ouder dan die termijn. (Raakt de iPad-base niet.)

---

## Buddee / TimeChimp-knoppen aanpassen
In `wrangler.toml` de waarden `BUDDEE_URL` / `TIMECHIMP_URL` naar jullie eigen adres zetten → `npm run deploy`.

---

## Iets kapot? Snelle diagnose
1. **`/health`** openen (`…workers.dev/health`) — toont `{"ok":true}` = de app draait.
2. Pagina geeft "Internal Server Error" = bijna altijd het **Airtable-token**. Opnieuw zetten:
   ```powershell
   npx wrangler secret put AIRTABLE_TOKEN
   ```
   (token uit `.dev.vars`, exact plakken).
3. Live meekijken met fouten:
   ```powershell
   npx wrangler tail
   ```
   Ververs de pagina en lees de rode `Airtable 4xx`-regel: **401** = token fout, **403** = token mist toegang tot de base.

---

## Veelgebruikte commando's
| Commando | Doet |
|---|---|
| `npm run dev` | Lokaal draaien (http://localhost:8787) |
| `npm run deploy` | Live zetten |
| `npm run typecheck` | Code controleren zonder te draaien |
| `npx wrangler tail` | Live logs/fouten bekijken |
| `npx wrangler secret put AIRTABLE_TOKEN` | Airtable-token (her)zetten |

---

## Nog op de rol (wanneer je wilt)
- M365-SSO als inlog i.p.v. e-mailcode
- Eigen domein (`intranet.<jullie-domein>`) i.p.v. de workers.dev-URL
- Klantenportaal (rassen, teeltadvies) — fase 4
- Mailchimp-koppeling — fase 5
