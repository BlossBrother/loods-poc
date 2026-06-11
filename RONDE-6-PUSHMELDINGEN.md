# Ronde 6 — pushmeldingen (web push)

Collega's kunnen pushmeldingen ontvangen op de geïnstalleerde webapp
(Android + iPhone met iOS 16.4+, mits op het beginscherm gezet).

## Eenmalig instellen
1. De publieke VAPID-sleutel + afzender staan al in `wrangler.toml`.
   Zet de **privésleutel** als secret:
   ```
   npx wrangler secret put VAPID_PRIVATE_KEY
   ```
   Plak: de privésleutel uit je wachtwoordmanager (NOOIT in dit document of in git zetten).
   (Lokaal hoort hij alleen in `.dev.vars`, dat buiten git blijft.)
2. `npm run deploy`.

## Hoe collega's meldingen aanzetten
- Op de homepage verschijnt een kaartje **"Meldingen — Aanzetten"** (alleen als de
  browser het ondersteunt en ze nog niet zijn aangemeld). Eén tik + toestemming geven.
- **iPhone:** werkt alleen vanuit de **geïnstalleerde** webapp (op het beginscherm),
  iOS 16.4 of nieuwer. In een gewone Safari-tab werkt push niet.
- Aanmeldingen worden per apparaat bewaard in de Airtable-tabel **Pushabonnementen**.

## Hoe je een melding stuurt
- **Automatisch bij nieuws:** vink bij een nieuwsbericht in /beheer → Nieuws het vakje
  **"Stuur pushmelding naar collega's"** aan en sla op (alleen als Status = Gepubliceerd).
- **Handmatig:** /beheer → **Pushmelding** → titel + bericht → Versturen.

## Goed om te weten
- De berichtinhoud is **versleuteld** (RFC 8291, aes128gcm) en VAPID-ondertekend; de
  encryptie is geverifieerd tegen de officiële RFC-testvector.
- Verlopen abonnementen (een afgemeld/verwijderd apparaat) ruimt de app vanzelf op.
- Geen VAPID-sleutels ingesteld? Dan gebeurt er simpelweg niets (geen fouten).
- Nieuwe VAPID-sleutels nodig (bijv. lek)? Genereer een nieuw paar en vervang beide;
  bestaande aanmeldingen moeten zich dan opnieuw aanmelden.
