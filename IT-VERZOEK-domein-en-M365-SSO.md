# Verzoek aan IT: eigen webadres + M365-login voor het Fresh Forward intranet

Hoi,

We hebben een nieuw intern platform (**Fresh Forward intranet**), gebouwd als een
Cloudflare Worker en afgeschermd met **Cloudflare Access**. Het draait nu op een
lange standaard-URL en collega's loggen in met een e-mailcode. Ik wil twee dingen
verbeteren, en daar heb ik jullie even bij nodig. De twee onderdelen staan los van
elkaar en kunnen tegelijk.

Huidige situatie:
- **Live URL:** https://fresh-forward-intranet.peterjan-vaningen.workers.dev
- **Beheer:** Cloudflare Zero Trust (Access) + Workers, in ons Cloudflare-account.

---

## Onderdeel A — Eigen webadres (custom domain)

**Wens:** het intranet bereikbaar maken op bijvoorbeeld
`intranet.fresh-forward.nl` in plaats van de lange workers.dev-URL.

**Hoe dit technisch werkt:** een Cloudflare Worker krijgt een eigen webadres door
in het Cloudflare-dashboard een **Custom Domain** aan de Worker te koppelen. Daarvoor
moet het (sub)domein in **ons Cloudflare-account** beheerd worden. Twee opties:

1. **Als `fresh-forward.nl` al op Cloudflare staat** (DNS bij Cloudflare):
   dan is het één handeling — Cloudflare maakt het DNS-record automatisch aan.
   Ik heb dan alleen toegang/akkoord nodig om de Custom Domain toe te voegen.

2. **Als de DNS elders staat:** dan graag óf het subdomein
   `intranet.fresh-forward.nl` naar Cloudflare delegeren (NS-record), óf
   `fresh-forward.nl` als zone in ons Cloudflare-account zetten. Een gewone
   CNAME bij de huidige provider is helaas niet genoeg (Cloudflare regelt dan
   geen TLS/SSL en routing voor de Worker).

**Wat ik van jullie nodig heb voor onderdeel A:**
- Bevestiging of `fresh-forward.nl` (of een subdomein ervan) bij Cloudflare beheerd
  mag/kan worden, en in welk Cloudflare-account.
- Het gewenste adres bevestigen (voorstel: `intranet.fresh-forward.nl`).

Daarna koppel ik de Custom Domain aan de Worker en zet ik de Access-instellingen
en de interne links om naar het nieuwe adres.

---

## Onderdeel B — Inloggen met Microsoft 365 (SSO via Entra ID)

**Wens:** collega's laten inloggen met hun **Microsoft 365-account** in plaats van
een e-mailcode. Daarvoor koppelen we **Microsoft Entra ID** als identity provider
aan Cloudflare Access (OIDC). Hiervoor is een **App registration** in Entra ID nodig.

**Wat aanmaken in Microsoft Entra ID (Azure AD):**
1. **Entra ID → App registrations → New registration**
   - **Name:** `Cloudflare Access - Fresh Forward`
   - **Supported account types:** *Accounts in this organizational directory only* (single tenant)
   - **Redirect URI:** type **Web**, waarde:
     ```
     https://<TEAM-NAAM>.cloudflareaccess.com/cdn-cgi/access/callback
     ```
     *(De exacte `<TEAM-NAAM>` lever ik aan — staat in Cloudflare Zero Trust → Settings.)*
2. **Certificates & secrets → New client secret**
   - Omschrijving bijv. `Cloudflare Access`, geldigheid 24 maanden.
   - **Noteer de secret value direct** (daarna niet meer zichtbaar).
3. **API permissions → Add a permission → Microsoft Graph → Delegated permissions**:
   - `openid`, `email`, `profile`, `offline_access`, `User.Read` → daarna **Grant admin consent**.
4. *(Optioneel, handig voor groepsregels)* Onder **Token configuration** een
   **groups claim** toevoegen, zodat we toegang op M365-groepen kunnen baseren.

**Wat ik van jullie nodig heb voor onderdeel B (3 waarden):**
- **Application (client) ID:** `…`
- **Directory (tenant) ID:** `…`
- **Client secret (value):** `…`

Met die drie waarden koppel ik Entra ID in Cloudflare Access en zet ik de login om
naar M365. Dit wijzigt verder niets aan de tenant.

---

## Samengevat: wat ik van jullie vraag
- **A (webadres):** mag `intranet.fresh-forward.nl` via Cloudflare lopen, en in welk account?
- **B (M365-login):** bovenstaande App registration aanmaken en de 3 waarden doorgeven.

De rest (Access-policies, het portaal voor klanten, het omzetten van de links)
regel ik zelf. Alvast bedankt!

Groet,
Peter-Jan
