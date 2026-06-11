# Fresh Forward platform — roadmap

Gefaseerde uitbreiding van het intranet + klantenportaal. Afgevinkt = live/klaar.

## Gereed
- [x] Intranet: nieuws (met foto's, "Nieuw"-badge), documenten, app-tegels, verjaardagen
- [x] Prikbord met reacties (auteur = ingelogde collega, geen impersonatie)
- [x] Competitie (pingpong/darten) + dart-teller
- [x] WK-poule-tegel (Scorito)
- [x] Klantenportaal: magic-link login, rassen/teelt/snoei/documenten, meertalig
- [x] Beheer: nieuws/documenten/medewerkers/afdelingen/klanten + pushmelding
- [x] Auth-hardening (Azure AD / Entra ID SSO via Cloudflare Access)
- [x] PWA: installeerbaar, snelle navigatie (stale-while-revalidate)
- [x] Pushmeldingen (web push, automatisch bij nieuws + handmatig)
- [x] **Smoelenboek / team** (foto's + functies van de website)
- [~] Bezoekers-feature — tijdelijk UIT (interne discussie); schakelaar `BEZOEK_ENABLED`
- [x] **Opschoon/AVG-ronde**: meldingen archiveren i.p.v. hard delete; legacy `wedstrijden` verwijderd

## Fase 7 — vinden & verbinden
- [x] **Globaal zoeken** (nieuws + documenten + mensen) — /zoek, header-icoon + menu-item
- [ ] **Afwezigheid / wie is er** (thuis/vrij/op pad; later koppelen met Buddee)
- [x] **Shout-outs / complimenten** (uitbreiding prikbord) — home-blok optioneel (toggle, nu uit)

## Fase 8 — organiseren
- [ ] **Evenementen / agenda** (uitjes, vergaderingen; later Outlook-sync)
- [ ] **Belangrijke info / BHV & noodnummers** (plattegrond, calamiteiten)
- [ ] **Reserveren** (vergaderruimte, poolauto, apparatuur)

## Fase 9 — betrokkenheid & kennis
- [ ] **Polls** op het prikbord
- [ ] **Ideeënbus / facilitaire meldingen**
- [ ] **Kennisbank / FAQ** (how-to's naast losse documenten)
- [ ] **Vacatures / refereer-een-collega**
- [ ] **Fotoalbums** (events, competitie)

## Fase 10 — integraties (nu Azure AD er is)
- [ ] **SharePoint/M365-documenten** tonen in het intranet
- [ ] **Leesbevestiging** voor belangrijk beleid (compliance)

> Volgorde is een voorstel; we pakken per ronde op wat de meeste waarde geeft.
