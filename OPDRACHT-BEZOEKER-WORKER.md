# Opdracht voor de bezoeker-Worker: push naar de collega bij een aanmelding

**Doel:** wanneer een bezoeker zich aanmeldt en aangeeft **voor wie** hij komt, stuurt
deze Worker een pushbericht naar die collega via het intranet.

## BELANGRIJK — gebruik een Service Binding, geen publieke fetch
De bezoeker-Worker en het intranet staan op **hetzelfde Cloudflare-account**. Een Worker
mag een andere Worker op hetzelfde account **niet** via z'n publieke `*.workers.dev`-URL
aanroepen → dat geeft **Cloudflare-fout 1042 / 404**. Dat is precies wat er nu gebeurt.

**Oplossing:** roep het intranet aan via een **Service Binding** (interne Worker→Worker
call). Dan vervalt 1042, en het gaat meteen langs Cloudflare Access heen.

### 1) Service binding in `wrangler.toml` van de bezoeker-Worker
```toml
[[services]]
binding = "INTRANET"
service = "fresh-forward-intranet"
```
(`service` = de exacte Worker-naam van het intranet.)

### 2) Code: gebruik `env.INTRANET.fetch(...)` i.p.v. `fetch(URL)`
```js
async function meldBezoekAanCollega(env, voorWie, bezoeker, bedrijf) {
  if (!voorWie) return;
  try {
    const res = await env.INTRANET.fetch("https://intranet/api/push", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.INTRANET_PUSH_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: voorWie,
        title: "Je hebt bezoek",
        body: `${bezoeker}${bedrijf ? ` van ${bedrijf}` : ""} is bij de receptie.`,
        url: "/",
      }),
    });
    // optioneel: const j = await res.json(); // { ok, sent, matched }
  } catch (e) {
    console.error("push naar intranet faalde:", e); // mag de aanmelding nooit laten falen
  }
}
```
- Bij een service binding **maakt de hostnaam in de URL niet uit** — alleen het pad
  (`/api/push`) telt. `https://intranet/api/push` is prima.
- `INTRANET_PUSH_URL` is met een binding niet meer nodig (het pad staat in de code).
  `INTRANET_PUSH_SECRET` blijft wel nodig (de bearer-sleutel).

Roep dit aan op het moment dat de aanmelding wordt opgeslagen, met:
- `voorWie`  = de "Bezoek aan"-waarde (naam of e-mail van de collega)
- `bezoeker` = naam van de bezoeker
- `bedrijf`  = bedrijf (optioneel)

Gebruik `ctx.waitUntil(meldBezoekAanCollega(...))` zodat de aanmelding niet hoeft te
wachten op de push.

## Endpoint-spec (al live en getest)
```
POST  (via env.INTRANET.fetch)  /api/push
Header: Authorization: Bearer <INTRANET_PUSH_SECRET>
Body:   { "to": "<naam of e-mail>", "title": "Je hebt bezoek", "body": "...", "url": "/" }
Antwoord: { "ok": true, "sent": 1, "matched": "teunis.sikma@fresh-forward.nl" }
```
- `to` mag een naam zijn (tolerant gematcht) of een e-mailadres (zekerst).
- Geen abonnement / niet gevonden → geen fout, er gebeurt niets.

## Secrets in de bezoeker-Worker
- `INTRANET_PUSH_SECRET` = `ff_v1_<NIEUWE-SLEUTEL — vraag de actuele waarde aan PJ; nooit in dit document zetten>`
- `INTRANET_PUSH_URL` mag weg (vervangen door de service binding).
- Oude `TEAMS_WEBHOOK_URL` mag weg.

## Alternatief (als een binding echt niet kan)
Zet het intranet-`/api` op een **eigen domein** (andere zone dan workers.dev); dan is een
publieke fetch wél toegestaan. Maar de service binding is de schone, eenvoudige route.
