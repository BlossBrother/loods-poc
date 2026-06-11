# Een andere Worker een push laten sturen naar één gebruiker

Het intranet biedt een afgeschermd endpoint. De andere Worker stuurt alleen een
**doel-e-mail + bericht**; het intranet zoekt de apparaten van die persoon op en
verstuurt de versleutelde push (de VAPID-sleutels blijven dus op één plek).

## Endpoint
```
POST /api/push
Authorization: Bearer <PUSH_API_KEY>
Content-Type: application/json

{ "email": "teunis.sikma@fresh-forward.nl", "title": "Titel", "body": "Bericht", "url": "/" }
```
Antwoord: `{ "ok": true, "sent": 2 }` (aantal apparaten dat een melding kreeg).

## Eenmalig instellen
Zet de bearer-sleutel als secret op het intranet:
```
npx wrangler secret put PUSH_API_KEY
```
Plak: `ff_v1_<NIEUWE-SLEUTEL — staat alléén in de secret-store, nooit in dit document>`
(Lokaal staat deze al in `.dev.vars`.)

## Hoe de andere Worker erbij komt — twee opties

### Optie A (aanrader, zelfde Cloudflare-account): Service Binding
Een service binding laat Worker B het intranet **direct** aanroepen, zonder over
het publieke internet of Cloudflare Access te gaan.

In de `wrangler.toml` van de ANDERE Worker:
```toml
[[services]]
binding = "INTRANET"
service = "fresh-forward-intranet"
```
In de code van de andere Worker:
```js
await env.INTRANET.fetch("https://intranet/api/push", {
  method: "POST",
  headers: { "Authorization": `Bearer ${env.PUSH_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ email: "naam@fresh-forward.nl", title: "Hoi", body: "Bericht", url: "/" }),
});
```
(De hostnaam in de URL maakt niet uit bij een binding; het pad telt.)

### Optie B: gewoon over HTTPS
Werkt alleen als het endpoint langs Cloudflare Access komt. Twee manieren:
- **Access-bypass** voor pad `/api/*` toevoegen (zoals bij `/portaal*`), zodat
  alleen de bearer-sleutel beschermt. Simpel, maar het pad is dan publiek bereikbaar
  (de bearer-sleutel blijft de poortwachter).
- **Access service token**: maak in Zero Trust een service token en stuur de headers
  `CF-Access-Client-Id` + `CF-Access-Client-Secret` mee naast de bearer-sleutel.

Voorbeeld (met bypass):
```bash
curl -X POST https://<jouw-intranet-host>/api/push \
  -H "Authorization: Bearer ff_v1_<NIEUWE-SLEUTEL — staat alléén in de secret-store, nooit in dit document>" \
  -H "Content-Type: application/json" \
  -d '{"email":"naam@fresh-forward.nl","title":"Hoi","body":"Bericht"}'
```

## Beveiliging
- Zonder geldige bearer-sleutel: `401`. Bewaar de sleutel als secret, deel 'm niet.
- Stuurt alleen naar apparaten die bij dat e-mailadres horen (de persoon zelf).
- Verlopen abonnementen worden automatisch opgeruimd.

---

## Kant-en-klaar: bezoeker meldt zich aan → collega krijgt een push

Speciaal voor de bezoeker-aanmelding is er een endpoint dat de collega zelf opzoekt
en de melding netjes opmaakt. De bezoeker-Worker hoeft alleen door te geven **voor
wie** het bezoek is + **wie** er is.

```
POST /api/bezoek-melding
Authorization: Bearer <PUSH_API_KEY>
Content-Type: application/json

{ "voor": "Teunis Sikma", "bezoeker": "Jan Jansen", "bedrijf": "ABC Fruit" }
```
- `voor` mag een **naam** zijn (zoals de bezoeker die kiest) of een e-mailadres; het
  intranet zoekt de juiste collega erbij.
- De collega krijgt: titel **"Je hebt bezoek"**, tekst **"Jan Jansen van ABC Fruit is
  bij de receptie."** — mits hij meldingen heeft aangezet.
- Antwoord: `{ "ok": true, "sent": 1, "matched": "teunis.sikma@fresh-forward.nl" }`.
  Vindt-ie de collega niet, dan `404` met `"matched": null`.

Voorbeeld in de bezoeker-Worker (service binding):
```js
await env.INTRANET.fetch("https://intranet/api/bezoek-melding", {
  method: "POST",
  headers: { "Authorization": `Bearer ${env.PUSH_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ voor: bezoekAan, bezoeker: naamBezoeker, bedrijf: bedrijf }),
});
```
Eén regel op het moment dat de bezoeker zich aanmeldt — that's it.

---

## Afgestemd met de bezoeker-Worker (INTRANET_PUSH_URL / INTRANET_PUSH_SECRET)

De bezoeker-Worker stuurt een melding met een `to`-veld en het gedeelde geheim.
Het intranet is hierop afgestemd:

- **Geheim:** `PUSH_API_KEY` op het intranet = `INTRANET_PUSH_SECRET` van de Worker
  (`ff_v1_<NIEUWE-SLEUTEL — staat alléén in de secret-store, nooit in dit document>`).
  Meesturen mag als `Authorization: Bearer <secret>` óf als header `X-Intranet-Secret: <secret>`.
- **URL (`INTRANET_PUSH_URL`):**
  `https://fresh-forward-intranet.peterjan-vaningen.workers.dev/api/push`
- **Payload die /api/push accepteert** (velden zijn flexibel):
  ```json
  { "to": "<naam of e-mail van de collega>", "title": "Je hebt bezoek", "body": "Jan van ABC is er", "url": "/" }
  ```
  - ontvanger: `to` (of `email` / `naam` / `voor`) — naam óf e-mail, intranet zoekt 'm op
  - tekst: `body` (of `message`); titel: `title` (default "Melding")
- **Antwoord:** `{ "ok": true, "sent": 1, "matched": "teunis.sikma@fresh-forward.nl" }`

> Belangrijk (Cloudflare Access): omdat `/api/*` anders door de M365-login wordt
> geblokkeerd, moet er een **Access Bypass-policy voor `/api*`** komen (net als bij
> `/portaal*`). De bearer-/geheim-sleutel blijft de poortwachter.
