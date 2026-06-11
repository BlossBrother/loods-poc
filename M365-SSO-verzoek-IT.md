# Verzoek aan IT: Microsoft Entra ID (M365) koppelen aan Cloudflare Access

Hoi,

We hebben een nieuw intern platform (Fresh Forward intranet) dat afgeschermd is met
**Cloudflare Access**. Nu loggen collega's in met een e-mailcode; we willen overstappen
op **inloggen met hun Microsoft 365-account (SSO)**. Daarvoor is een **App registration**
in Microsoft Entra ID nodig. Zou je het volgende willen aanmaken en de drie waarden
onderaan aan mij doorgeven?

## Wat aanmaken in Microsoft Entra ID (Azure AD)
1. **Microsoft Entra ID → App registrations → New registration**
   - **Name:** `Cloudflare Access - Fresh Forward`
   - **Supported account types:** *Accounts in this organizational directory only* (single tenant)
   - **Redirect URI:** type **Web**, waarde:
     ```
     https://<TEAM-NAAM>.cloudflareaccess.com/cdn-cgi/access/callback
     ```
     *(De `<TEAM-NAAM>` lever ik aan — staat in Cloudflare Zero Trust → Settings → Custom Pages / team domain. Ik geef het exacte adres door.)*
2. **Certificates & secrets → New client secret**
   - Omschrijving bijv. `Cloudflare Access`, geldigheid 24 maanden.
   - **Noteer de secret value direct** (is daarna niet meer zichtbaar).
3. **API permissions → Add a permission → Microsoft Graph → Delegated permissions**, voeg toe:
   - `openid`, `email`, `profile`, `offline_access`, `User.Read`
   - Klik daarna **Grant admin consent**.
4. *(Optioneel, fijn voor groepsregels)* Onder **Token configuration** een **groups claim**
   toevoegen, zodat we toegang op M365-groepen kunnen baseren.

## Wat ik van je nodig heb (3 waarden)
- **Application (client) ID:** `…`
- **Directory (tenant) ID:** `…`
- **Client secret (value):** `…`

Met die drie waarden koppel ik Entra ID als identity provider in Cloudflare Access en
zetten we de login om naar M365. Wijzigt verder niets aan jullie tenant.

Alvast bedankt!
Groet, Peter-Jan
