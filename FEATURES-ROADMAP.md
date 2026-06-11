# Features-roadmap — "fraaie updates" Fresh Forward intranet

> Gereconstrueerd uit `HANDOFF-VOLGENDE-CHAT.md` (markttrends + volgende ronde) en `ROADMAP.md` (fase 9/10), 8 juni 2026.
> Moeite: **S** = uur(en) · **M** = ~dag · **L** = meerdere dagen. Impact: ★–★★★.

## De tien

1. **★★★ Inline / auto-vertaling · M–L** — Berichten/nieuws/documenten op aanvraag vertalen ("Vertaal dit"), of automatisch naar de taalvoorkeur. Sterk i.c.m. het meertalige klantenportaal en internationale collega's. Kan via een vertaal-API (bijv. DeepL/Azure Translator) of de Workers AI-vertaalmodellen.
2. **★★★ Offline-PWA · L** — Echt offline kunnen lezen (en acties in de wachtrij zetten die later syncen). Bouwt voort op de bestaande service-worker/SWR-cache. Zie ook de premium-checklist (offline-indicator + Background Sync).
3. **★★ AI-zoeken (Copilot/Workers AI) · M–L** — Natuurlijke-taal-zoeken over nieuws, documenten en mensen ("waar staat het verlofbeleid?") met een kort AI-antwoord + bronlinks, bovenop de bestaande `/zoek`.
4. **★★ Analytics-dashboard · M** — Beheerders-inzicht: actieve gebruikers, populaire modules, posts/reacties, push-bereik. Privacy-vriendelijk (geaggregeerd, geen tracking van individuen).
5. **★★ Polls / surveys op het prikbord · M** — Snelle peilingen ("welke datum voor het uitje?") met live uitslag. Mooie betrokkenheids-booster, sluit aan op het prikbord.
6. **★★ Kennisbank / FAQ · M** — How-to's en veelgestelde vragen als doorzoekbare artikelen naast de losse documenten (bijv. onboarding, IT, faciliteiten).
7. **★★ Reserveren · M–L** — Vergaderruimte, poolauto en apparatuur boeken (met agenda-weergave en conflict-check). Hoge praktische waarde.
8. **★ Fotoalbums · M** — Albums voor events/competitie/teelt (bouwt op de nieuwe lightbox + R2-opslag). Leuk en visueel.
9. **★ Leesbevestiging (compliance) · S–M** — "Gelezen"-knop op belangrijk beleid, met overzicht voor beheer wie het bevestigd heeft. Nuttig voor BHV/AVG/beleid.
10. **★ Ideeënbus / facilitaire meldingen · S–M** — Laagdrempelig ideeën of facilitaire zaken doorgeven (uitbreiding op meldingen), eventueel met stemmen.

## Net buiten de top tien (kandidaten)
- **SharePoint/M365-documenten** tonen in het intranet (nu Azure AD er is) · L
- **Fun-onderdelen**: weddenschappen-poule, challenges & teamdoelen, lief-en-leed/"het potje" (let op AVG) · M elk
- **Vacatures / refereer-een-collega** · M
- **BHV & noodnummers / plattegrond** (fase 8) · S–M

## Aanrader om eerst te doen (impact ÷ moeite)
1. **Polls** (5) — snelle, zichtbare betrokkenheids-winst, los te bouwen.
2. **Kennisbank/FAQ** (6) — veel waarde, bouwt op bestaande documenten.
3. **Inline vertaling** (1) — de "wow" die jij specifiek wilde; klein te starten (knop "Vertaal dit" op één veld) en daarna uitbreiden.
4. **Leesbevestiging** (9) — kleine moeite, direct compliance-nut.

> Volgorde is een voorstel. Buddee-verlof + de security/AVG-poortwachters gaan eerst (zie `AUDIT-security-AVG-premium.md`); daarna pakken we hieruit per ronde wat de meeste waarde geeft.
