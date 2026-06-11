# Test-omgeving (staging) — Fresh Forward

Aparte Worker om te proefdraaien vóór productie. **Eén codebase**, gescheiden via
wrangler-environments (`[env.test]` in `wrangler.toml`). Productie blijft `npm run deploy`;
de testomgeving deploy je met `npm run deploy:test`.

- **Test-Worker (na deploy):** `https://fresh-forward-intranet-test.peterjan-vaningen.workers.dev`
- **Test-D1:** `fresh-forward-db-test` (id `5e730e65-b869-424b-8070-21d3acf268c9`, EU) — schema al toegepast.
- **Test-R2:** `ff-documenten-test` — nog aanmaken (zie stap 1).
- **Test-Vectorize:** `ff-kb-test` — optioneel, nog aanmaken (stap 3).

> ⚠️ De test-Worker staat **niet** achter Cloudflare Access en draait in **DEV_MODE**
> (iedereen die de URL opent is "beheerder"). **Zet er geen echte persoonsgegevens op** —
> gebruik dummy-data. Wil je realistisch met login testen? Zet de test-URL dan achter een
> eigen Access-applicatie en haal `DEV_MODE` uit `[env.test.vars]`.

## Eenmalige setup (in cmd)

1. **R2-bucket** (lukte niet via de connector — even zelf):
   ```
   npx wrangler r2 bucket create ff-documenten-test
   ```
2. **Schema** staat al in de test-D1. Opnieuw nodig (of na nieuwe migraties)?
   ```
   npx wrangler d1 execute fresh-forward-db-test --remote --file=migratie/schema-test.sql
   ```
3. **Vectorize (optioneel, voor de vraagbaak in test):**
   ```
   npx wrangler vectorize create ff-kb-test --dimensions=768 --metric=cosine
   npx wrangler vectorize create-metadata-index ff-kb-test --property-name=audience --type=string
   ```
   Haal daarna in `wrangler.toml` het `[[env.test.vectorize]]`-blok uit commentaar.
4. **Secrets voor de test-omgeving** (apart van productie):
   ```
   npx wrangler secret put PORTAL_SECRET --env test
   npx wrangler secret put VAPID_PRIVATE_KEY --env test   (alleen als je push test)
   npx wrangler secret put PUSH_API_KEY --env test        (alleen als je push test)
   ```
   (ACCESS_AUD/ACCESS_TEAM_DOMAIN niet nodig zolang DEV_MODE aanstaat.)

## Deployen naar test
```
npm run deploy:test
```
Open daarna de test-URL en seed wat dummy-data via Beheer (je bent automatisch beheerder).

## Werkwijze
1. Wijziging bouwen → `npm run deploy:test` → testen op de test-URL.
2. Akkoord? → `npm run deploy` (productie).
3. Nieuwe D1-migratie? Draai 'm op **beide** databases (`fresh-forward-db` én
   `fresh-forward-db-test`) zodat ze gelijk blijven.

## Wat NIET gedeeld is tussen test en productie
Aparte Worker, D1, R2, Vectorize en secrets. Workers AI (`[ai]`) is hetzelfde account maar
stateless. Test-acties raken productie dus niet.
