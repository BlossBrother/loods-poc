# Blok F — Verkenning: aanwezigheid (wifi/BHV) & externe login

> Advies-/verkenningsnotitie, geen code. Conform de roadmap: deze twee onderdelen
> bewust eerst onderzoeken (AVG + techniek + auth-impact) vóór er gebouwd wordt.
> Stack-context: Cloudflare Workers + D1 (EU) + R2, intern achter Cloudflare Access /
> Entra (M365-SSO), klantenportaal via magic-link (Resend).

---

## DEEL 1 — Aanwezigheid ("wie is er nu op locatie") — ook voor BHV

### Waarom (de echte behoefte)
Het doel dat ertoe doet is een **betrouwbare actuele aanwezigheidslijst** — vooral
voor **BHV bij een ontruiming/noodgeval** ("wie moeten we nog buiten zien te
krijgen?"). Aanwezigheid voor gemak (wie is er vandaag) is mooi meegenomen, maar
de BHV-use-case is veiligheid en stelt andere eisen: het moet **kloppen** op het
moment dat het telt, en het mag mensen niet in vals vertrouwen wiegen.

### De technische opties (van onbetrouwbaar → betrouwbaar)

**A. MAC-adres van wifi-clients uitlezen (het oorspronkelijke idee) — afgeraden**
- Idee: vraag de wifi-controller (UniFi/Aruba/Meraki/Cisco) welke apparaten
  verbonden zijn, koppel MAC-adres → persoon.
- **Showstopper:** moderne telefoons gebruiken **MAC-randomisatie** (iOS 14+,
  Android 10+). Het MAC-adres verandert per netwerk en periodiek, dus de koppeling
  MAC→persoon is fragiel en valt steeds uit. Je krijgt een lijst die "soms" klopt —
  precies wat je voor BHV níét wilt.
- Vereist bovendien API-toegang tot de wifi-controller + een koppellaag.
- **AVG:** MAC + aanwezigheid = persoonsgegeven (volgsysteem). Zwaar verhaal voor
  een onbetrouwbaar resultaat. Niet doen.

**B. Wifi-login met identiteit (RADIUS/802.1X of captive portal)**
- Medewerkers loggen op wifi in met hun account → je weet zeker wie er op zit.
- Betrouwbaarder identiteit, maar: zwaardere netwerk-infra, en nog steeds een
  volsysteem-discussie. Veel werk voor dit doel.

**C. Aanwezigheid via het bedrijfs-IP + bestaande login (pragmatisch, aanrader-licht)**
- De PWA/het intranet draait al achter login. Als iemand de app op kantoor opent,
  ziet de Worker het **publieke IP** van het bedrijfsnetwerk (`CF-Connecting-IP`).
  Match dat tegen het/de bekende kantoor-IP('s) → markeer die ingelogde persoon als
  "op kantoor aanwezig" (met een korte vervaltijd, bv. 15–30 min).
- **Voordeel:** geen MAC, geen nieuwe identifier — het hangt aan de identiteit die
  er al is. Privacy-vriendelijker en simpel te bouwen.
- **Beperkingen:** werkt alleen zolang iemand de app/site die dag opent; mobiel
  internet/VPN telt niet als "op kantoor"; meerdere locaties = meerdere IP's
  bijhouden; iemand die de app niet opent is "onzichtbaar". Dus: indicatief, niet
  100% sluitend.

**D. Zelf in-/afmelden (opt-in check-in) — meest eerlijk, BHV-proof als fallback**
- Eenvoudige "Ik ben aanwezig / Ik vertrek"-knop (eventueel auto-geholpen door
  optie C: bij openen op kantoor-IP automatisch op "aanwezig"). 
- **Voordeel:** transparant, opt-in, geen heimelijke monitoring; AVG-licht.
- **Nadeel:** hangt op discipline (mensen vergeten af te melden).

### Aanbeveling voor aanwezigheid
1. **Niet** MAC-sniffen (optie A). 
2. Bouw een lichte **aanwezigheidsmodule**: combinatie van **C (auto op kantoor-IP)
   + D (handmatig aan/afmelden)**. Toon een actuele lijst "op kantoor / op afstand /
   afwezig", met korte vervaltijd zodat de lijst zichzelf opschoont.
3. **Koppel het aan BHV:** in het Noodmelding/BHV-scherm een **roll-call-overzicht**
   ("vermoedelijk aanwezig") tonen. Cruciaal: erbij vermelden dat dit een
   **hulpmiddel** is en **geen vervanging** van de fysieke verzamelplaats-telling —
   net als de 112-disclaimer. Voor BHV blijft een handmatige presentielijst de
   harde bron.

### AVG-aandachtspunten (aanwezigheidsregistratie van personeel, NL)
- Aanwezigheids-/locatiegegevens van werknemers zijn **persoonsgegevens**; dit raakt
  aan **personeelsvolgsystemen**.
- **Grondslag:** gerechtvaardigd belang (veiligheid/BHV) is verdedigbaar *mits* het
  doel strikt beperkt blijft tot veiligheid — niet voor "wie is te laat" of
  productiviteitscontrole (**doelbinding**).
- **Dataminimalisatie:** liefst geen permanente identifiers (dus geen MAC); bewaar
  alleen de **actuele status**, geen bewegingshistorie. Korte retentie.
- **Transparantie:** medewerkers vooraf informeren (doel, wat, hoe lang).
- **Ondernemingsraad:** een aanwezigheids-/volgsysteem valt vermoedelijk onder het
  **instemmingsrecht van de OR** (art. 27 WOR) — vooraf afstemmen.
- **DPIA:** overweeg een (lichte) DPIA bij structurele aanwezigheidsregistratie.
- Conclusie: optie C+D met opt-in karakter, strikt BHV/veiligheidsdoel, geen
  historie en OR-afstemming is het beste verdedigbaar.

---

## DEEL 2 — Externe login (externen / uitzendkrachten) — opties

> Status: nog niet definitief. Hieronder 4 routes met voor/nadelen, zodat je kunt
> kiezen. Geldt voor mensen zonder M365-account die tóch (een deel van) het intranet
> nodig hebben.

Huidige situatie: intern draait achter **Cloudflare Access + Entra (M365-SSO)**.
Externen hebben geen M365-account, dus vallen nu buiten de boot.

### Optie 1 — Entra **B2B gast-uitnodiging**
- Nodig externen uit als **gastgebruiker** in de FF Entra-tenant; ze loggen in met
  hun eigen e-mail (Microsoft-account of e-mailcode).
- **Voor:** blijft binnen één auth-systeem (Entra/Access), centrale rechten/MFA,
  **geen nieuwe auth-code** in de app.
- **Tegen:** IT/beheer nodigt elke gast uit; lichte Entra/Access-configuratie.
- Beste als je alles onder Microsoft/Access wilt houden.

### Optie 2 — Cloudflare Access **e-mail OTP (one-time pin)** — vaak het simpelst
- Cloudflare Access kan naast Entra ook een **e-mailcode-login** aanbieden. Je staat
  specifieke externe e-mailadressen (of een domein) toe; zij krijgen een code per
  mail en zijn binnen.
- **Voor:** **geen app-code-wijziging** (Access regelt de login); de app vertrouwt de
  Access-identiteit die er al is. Externen hoeven geen Microsoft.
- **Tegen:** je beheert de allowlist van externe e-mails in Access; de app moet die
  gebruikers herkennen en een **beperkte "extern"-rol** geven.
- Meestal de **laagste drempel** gegeven dat de app al op Access-identiteit leunt.

### Optie 3 — App-eigen **magic link** (zoals het klantenportaal al heeft)
- Bouw een tweede login-pad in de Worker zelf: extern vult e-mail in → magic link →
  sessie-cookie. Hergebruikt de bestaande portaal-sessie/token-code + Resend.
- **Voor:** volledige controle, externen los van Microsoft/Access, selfservice.
- **Tegen:** je **bouwt/onderhoudt zelf auth** (veiligheidsgevoelig); draait **buiten**
  de Access-bescherming, dus je moet scherp afbakenen wat externen mogen zien; een
  apart sessiesysteem naast Access. Dit is het "tweede login-pad" uit het businessplan.

### Optie 4 — Gedeeld/rol-account ("uitzendkracht") — afgeraden
- Eén generiek login voor externen. Simpel, maar **geen individuele identiteit**,
  slecht voor audit/security. Niet doen behalve als noodgreep.

### Koppeling met "intern/extern/uitzend"-label
Welke optie ook: externen krijgen een **beperkte rol** (bv. alleen agenda,
meldingen, bestellijst — geen beheer/competitie/saldo). Dat is precies het
intern/extern/uitzend-onderscheid uit Blok F: één rolveld dat zowel de **zichtbaarheid
in lijsten** (bestellijst, team) als de **module-toegang** stuurt.

### Aanbeveling externe login
- Wil je **minimaal bouwen + maximaal veilig** en het mag via Microsoft-infra:
  **Optie 2 (Access e-mail OTP)** of **Optie 1 (Entra B2B-gast)**. Beide: geen eigen
  auth-code, identiteit blijft aan de rand geregeld; in de app alleen een
  **"extern"-rol** met beperkte toegang toevoegen.
- Wil je externen **volledig los van Microsoft** en selfservice (en accepteer je het
  onderhoud van eigen auth): **Optie 3 (magic link)**, hergebruik de portaal-infra.
- Aanrader om mee te starten: **Optie 2**, met een nieuw **"extern"-rol/label** in
  Medewerkers dat de modules en lijst-weergave beperkt. Klein in de app, geen eigen
  auth-risico, en het sluit naadloos aan op het platform-rollenmodel.

---

## Voorgestelde vervolgstappen (als je groen licht geeft)
1. Aanwezigheid: lichte module (kantoor-IP-detectie + handmatig aan/afmelden) +
   BHV-roll-call-overzicht met disclaimer. Vooraf: kantoor-IP('s) inventariseren +
   OR-afstemming + medewerkers informeren.
2. Externe login: kies een optie (advies: Access e-mail OTP) + voeg een
   **"extern"-rol** toe die module-toegang en lijst-labels stuurt.
