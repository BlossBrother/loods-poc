# Security-samenvatting — Fresh Forward intranet & klantenportaal

**Doel:** deelbaar overzicht van de beveiligings- en privacystatus, voor intern gebruik en voor onze IT-serviceprovider.
**Datum:** 8 juni 2026 · **Status:** intern in gebruik; HR-koppeling (verlof) in voorbereiding.

---

## 1. Samenvatting (management)

Het intranet draait op een moderne, serverless infrastructuur (Cloudflare) met de bedrijfsdata in de EU. De toegang is afgeschermd met **single sign-on via Azure AD (Entra ID)** achter **Cloudflare Access**, en sinds vandaag verifieert de applicatie het inlogtoken **ook nog een tweede keer in de software zelf** — twee onafhankelijke lagen. Een onafhankelijke code-review vond **geen SQL-injectie en geen cross-site-scripting**; gebruikersinvoer wordt overal veilig verwerkt. De belangrijkste eerder geconstateerde kwetsbaarheid (de identiteitscontrole) is **opgelost en geverifieerd**. Er resteert een korte lijst met aanbevolen hardening-maatregelen (geen blokkers voor intern gebruik) en een aantal AVG-acties die vóór de HR-verlofkoppeling moeten worden afgerond.

**Oordeel:** gezonde basis, identiteit nu dubbel beveiligd. Geschikt voor intern gebruik; voor de HR-koppeling eerst de AVG-acties in §6 afronden.

---

## 2. Architectuur & hosting

- **Platform:** Cloudflare Workers (serverless edge-applicatie), `hono`-framework, server-side gerenderd.
- **Database:** Cloudflare D1 (SQLite), data **opgeslagen in de EU** (regio EEUR).
- **Bestanden:** Cloudflare R2 (object-opslag) voor documenten, foto's en uploads.
- **App-type:** Progressive Web App (installeerbaar op telefoon/desktop), web-push-meldingen.
- **Hostname:** één Cloudflare-hostname, volledig achter Cloudflare Access.

## 3. Authenticatie & autorisatie

- **Single sign-on:** Cloudflare Access met **Azure AD (Entra ID)** als identiteitsprovider. Elke gebruiker logt in met het bedrijfsaccount; niet-geauthenticeerde verzoeken komen niet binnen (geverifieerd: een vers incognito-venster gaat direct naar de Microsoft-login).
- **Token-verificatie in de applicatie (2e laag, sinds 8 juni live):** de applicatie controleert nu zelf de handtekening en geldigheid van het Access-token (JWT) tegen het Cloudflare-teamdomein, plus de juiste doelgroep (AUD). Hierdoor wordt een verzoek zonder geldig token ook door de software zelf geweigerd — bescherming tegen een eventuele toekomstige configuratiefout of een route die buiten Access om zou ontstaan.
- **Rolgebaseerde toegang:** rollen (beheerder/PV) en per-module aan/uit worden **server-side** afgedwongen; een uitgeschakelde of niet-toegestane module is ook via de URL geblokkeerd, niet alleen verborgen.
- **Eigenaarschap & moderatie:** verwijderen/bewerken van content gebeurt met een eigenaars-/beheerderscheck, en verwijder-acties worden vastgelegd in een **audit-log**.

## 4. Gegevensbescherming & privacy (AVG)

- **Locatie:** alle persoonsgegevens in de EU (D1 EEUR + R2).
- **Minimale gegevens:** medewerkers (naam/e-mail/afdeling/functie), reacties, kantinesaldo. Verjaardag-zichtbaarheid is per persoon instelbaar (opt-out). Client-side opslag bevat **geen** persoonsgegevens (alleen UI-voorkeuren) — geen cookie-consent nodig (functioneel).
- **Geen hard delete waar gevoelig:** meldingen worden gearchiveerd (status), niet hard verwijderd.
- **HR-verlofkoppeling (Buddee, in voorbereiding):** haalt **uitsluitend goedgekeurd verlof** op voor een intern afwezigheidsoverzicht. Dataminimalisatie: alleen naam, afdeling, datum, type en status — **geen reden, geen saldo, geen contractgegevens**. Verbinding via HTTPS; inloggegevens als versleutelde secret (niet in de broncode).

## 5. Toegepaste beveiligingsmaatregelen

| Maatregel | Status |
|----------|--------|
| Single sign-on (Azure AD via Cloudflare Access) | ✅ actief |
| Token-verificatie in de applicatie (2e laag) | ✅ actief sinds 8 juni |
| SQL-injectie voorkomen (geparametriseerde queries) | ✅ geen bevindingen |
| Cross-site-scripting voorkomen (automatische escaping) | ✅ geen bevindingen |
| Beveiligingsheaders + Content-Security-Policy | ✅ aanwezig |
| Uploads: `nosniff` + geforceerde download voor niet-afbeeldingen | ✅ aanwezig (voorkomt uitvoeren van geüploade bestanden) |
| Klantenportaal: ondertekende magic-link-tokens (HMAC, constant-time) | ✅ aanwezig |
| Audit-log op verwijder-acties | ✅ aanwezig |
| Geen hardcoded secrets in de code; `.dev.vars` buiten versiebeheer | ✅ bevestigd |
| Data-opslag in de EU | ✅ bevestigd |

## 6. Bevindingen uit de review & status

Een onafhankelijke code-review (8 juni) leverde de onderstaande punten op. De kritieke is opgelost; de rest is hardening/AVG zonder dat het intern gebruik blokkeert.

| Prio | Bevinding | Status / actie |
|------|-----------|----------------|
| **Kritiek** | Identiteitscontrole leunde op een niet-geverifieerd token (risico bij blootstelling buiten Access om). | **✅ Opgelost** — token-verificatie in de applicatie aangezet en geverifieerd; Azure AD/Access dekt de enige hostname. |
| Belangrijk | Demo-verlofgegevens (echte namen, fictieve data) zichtbaar voor iedereen. | ➡️ **Wissen vóór HR-go-live.** |
| Belangrijk | **Ziekteverlof = gezondheidsgegeven (bijzondere categorie).** Mag niet bedrijfsbreed zichtbaar zijn. | ➡️ **Bij de Buddee-mapping ziekteverlof expliciet uitsluiten** (alleen vakantie/bijzonder). |
| Belangrijk | Agenda-items: rolcheck aanwezig, maar geen eigenaarscheck (een PV-gebruiker kan elk event bewerken). | ➡️ Eigenaars-/beheerderscheck toevoegen of rol bewust documenteren. |
| Belangrijk | Geen rate-limiting op de magic-link-login en reactie-endpoints. | ➡️ **Rate-limiting aan de rand instellen** (zie §7). |
| Belangrijk | Bestand-download serveert elk object op key. | ➡️ Toegang per namespace beperken. |
| Hardening | Upload-validatie: geen type-/groottecontrole (uitvoeren al voorkomen via `nosniff`). | ➡️ Bestandstype-allowlist + maximumgrootte. |
| Hardening | Defensieve check op verkeerd geconfigureerd teamdomein. | ✅ Opgelost — schema wordt nu automatisch aangevuld. |

## 7. Aanbevelingen voor de IT-serviceprovider

Concrete punten waar jullie expertise/configuratie helpt:

1. **Cloudflare Access — dekking bevestigen.** Verifieer dat de Access-applicatie (Azure AD) **alle paden van de hostname** afdekt en dat er geen alternatieve route (bijv. een directe Worker-route) buiten Access om bestaat.
2. **Rate Limiting Rules (Cloudflare, edge).** Stel rate-limiting in op de inlog-/magic-link- en reactie-endpoints om misbruik (mail-bombing, write-amplificatie) te voorkomen. Dit is aan de rand het eenvoudigst en dekt alles in één keer.
3. **Verwerkersovereenkomsten (DPA).** Leg DPA's vast met **Cloudflare** (hosting/D1/R2) en **Buddee** (HR-bron) vóór de verlofkoppeling live gaat.
4. **Buddee service-account (least privilege).** Vraag een **apart, read-only API-/service-account** aan met toegang tot enkel de verlof- en medewerkers-endpoints (geen persoonlijke login).
5. **Secret-/sleutelbeheer.** Bevestig dat productie-secrets (portaal-sleutel, push-sleutels, Buddee-credentials) niet gedeeld zijn buiten de beveiligde omgeving; roteer bij twijfel.
6. **Bewaartermijnen.** Stel retentie in voor verlofdata en de audit-log (nu onbeperkt), passend bij het AVG-bewaarbeleid.
7. **Optioneel — pen-test vóór externe/betalende gebruikers** (relevant zodra het klantenportaal breder uitgerold wordt).

## 8. Conclusie

De applicatie heeft een solide beveiligingsbasis: EU-hosting, SSO via Azure AD achter Cloudflare Access, een tweede token-verificatielaag in de software, en schone resultaten op de meest voorkomende kwetsbaarheden (SQL-injectie, XSS). De eerder kritieke identiteitskwestie is opgelost en geverifieerd. Voor de HR-verlofkoppeling moeten eerst de AVG-punten in §6 worden afgerond (ziekteverlof uitsluiten, demo-data wissen, DPA's, least-privilege service-account). De overige punten in §6–§7 zijn aanbevolen hardening en vormen geen belemmering voor het huidige interne gebruik.

*Opgesteld als interne samenvatting; technische details en bestandsverwijzingen zijn beschikbaar in het uitgebreide auditrapport (`AUDIT-security-AVG-premium.md`).*
