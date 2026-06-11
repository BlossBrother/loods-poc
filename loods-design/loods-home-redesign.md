# Stroom — Home-redesign (drop-in voor Cowork)

Eén bestand: onderbouwing, de zes lagen van de home, het `homeWidget`-contract in de module-registry, D1-schema’s + API’s voor de twee nieuwe modules (Nieuws & Documenten), vier bouwfases met klaar-wanneer-criteria, en de bekende valkuilen.

-----

## 1. Onderbouwing (kort)

- **De home is geen nieuwspagina maar een persoonlijk vertrekpunt** (NN/g). Taakgericht — wat wacht er op mij, wat is er vandaag — boven generieke aankondigingen. Gemiddelde intranetten blijven op ±60% wekelijks gebruik steken; de best ontworpen halen 80–85%, en het verschil zit in deze homepage-keuze.
- **Deskless gebruiksmoment**: gecheckt bij dienststart, pauze en einde dienst. Ontwerp daaromheen: in 10 seconden glanceable, primaire info zonder scrollen.
- **Clutter is de hoofdoorzaak van intranet-falen** (NN/g): alleen sleutelcontent op de home, de rest vindbaar via modules en (later) global search.
- **Gepersonaliseerd nieuws altijd met een uitweg**: een Voor mij/Alles-schakelaar zodat niet-getargete berichten bereikbaar blijven.

-----

## 2. De zes lagen van de home-stack (van boven naar beneden)

|#|Laag                   |Inhoud                                                                                                                                                    |Renderregel                                            |
|-|-----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
|1|**Persoonlijke header**|Begroeting + datum + teller “N dingen voor je” (som van `countNew` over ingeschakelde modules). Tik → Voor jou.                                           |Altijd. Bestaat al (COWORK-PLAN-home-header).          |
|2|**Urgentie**           |BHV/noodmelding-banner.                                                                                                                                   |Alléén bij actieve melding. Nooit een lege placeholder.|
|3|**Vandaag**            |Agenda-items van vandaag + kantine-deadline (“Bestellen kan nog tot 10:00”). Stroomlijn met druppel op het “nu”-punt als signature.                       |Alleen als er items zijn.                              |
|4|**Voor jou**           |Actiekaarten: alles wat op de gebruiker wácht (openstaande melding, sluitende toernooi-inschrijving, ongelezen prikbord-reactie). Acties boven informatie.|Alleen modules met openstaande items.                  |
|5|**Nieuws**             |Max 2–3 kaarten + Voor mij/Alles-schakelaar + link “Alle berichten”.                                                                                      |Alleen indien nieuwsmodule aan.                        |
|6|**Documenten**         |**Niet op de home.** Pull-module: bereikbaar via de module en straks global search.                                                                       |Levert géén home-widget (`homeWidget: null`).          |

-----

## 3. `homeWidget`-contract in de module-registry

De registry blijft de single source of truth (zoals bij de header/Voor jou). De home bouwt zichzelf per tenant op uit wat ingeschakelde modules aanbieden — **niets hardcoded in het home-scherm**.

```ts
// src/modules/registry.ts
type Ctx = { tenantId: string; userId: string; teamIds: string[]; db: D1Database };

type HomeWidget =
  | { kind: 'urgent'; fetch: (c: Ctx) => Promise<UrgentItem | null> }   // laag 2
  | { kind: 'today';  fetch: (c: Ctx) => Promise<TodayItem[]> }         // laag 3
  | { kind: 'foryou'; fetch: (c: Ctx) => Promise<ForYouItem[]> }        // laag 4
  | { kind: 'feed';   fetch: (c: Ctx) => Promise<FeedCard[]> };         // laag 5

interface ModuleDef {
  id: ModuleId;                 // 'agenda' | 'prikbord' | 'meldingen' | ...
  label: string;
  icon: string;
  tab?: { order: number };
  homeWidget: HomeWidget | null;            // null = niets op de home
  countNew?: (c: Ctx) => Promise<number>;   // voedt headerteller + Voor jou
}
```

Registraties (richting):

```ts
bhv:        { homeWidget: { kind: 'urgent', fetch: activeBhvAlert } }
agenda:     { homeWidget: { kind: 'today',  fetch: todaysAgendaItems } }
kantine:    { homeWidget: { kind: 'today',  fetch: orderDeadlineItem } }
meldingen:  { homeWidget: { kind: 'foryou', fetch: openMeldingenForUser }, countNew }
toernooien: { homeWidget: { kind: 'foryou', fetch: closingSignups },       countNew }
prikbord:   { homeWidget: { kind: 'foryou', fetch: unreadReplies },        countNew }
nieuws:     { homeWidget: { kind: 'feed',   fetch: latestNewsCards },      countNew }
documenten: { homeWidget: null }   // bewuste keuze, zie laag 6
```

**Aggregatie-endpoint** `GET /api/home`:

1. Lees ingeschakelde modules voor de tenant uit de registry/instellingen.
1. Voer alle `fetch`- en `countNew`-queries uit in **één `db.batch`** (één round-trip naar D1).
1. Respons:

```json
{
  "greeting": { "name": "Peet" },
  "counts": { "total": 4, "perModule": { "meldingen": 1, "toernooien": 1, "prikbord": 2 } },
  "urgent": { ... } | null,
  "today":  [ { "time": "09:30", "title": "...", "moduleId": "agenda", "deeplink": "..." } ],
  "forYou": [ { "title": "...", "moduleId": "meldingen", "count": 1, "deeplink": "..." } ],
  "feed":   [ { "title": "...", "excerpt": "...", "category": "Marketing", "publishedAt": "..." } ]
}
```

Een module uitschakelen in de registry laat hem dus automatisch overal verdwijnen: teller, Voor jou, home-stack én tabbar.

-----

## 4. Nieuwsmodule — D1 + API

```sql
CREATE TABLE news_posts (
  id          TEXT PRIMARY KEY,              -- client-UUID (idempotente retries)
  tenant_id   TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,                 -- markdown
  category    TEXT,                          -- 'Marketing', 'Facilitair', ...
  author_id   TEXT NOT NULL,
  audience    TEXT NOT NULL DEFAULT 'all',   -- 'all' | 'targeted'
  published_at TEXT,                         -- NULL = concept
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at  TEXT                           -- soft delete
);
CREATE INDEX idx_news_tenant_pub ON news_posts(tenant_id, published_at DESC);

CREATE TABLE news_targets (                  -- alleen bij audience='targeted'
  post_id  TEXT NOT NULL REFERENCES news_posts(id) ON DELETE CASCADE,
  team_id  TEXT,                             -- team óf user gevuld
  user_id  TEXT,
  PRIMARY KEY (post_id, team_id, user_id)
);

CREATE TABLE news_reads (
  tenant_id TEXT NOT NULL,
  post_id   TEXT NOT NULL,
  user_id   TEXT NOT NULL,
  read_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (post_id, user_id)
);
```

API (Hono):

|Route                              |Doel                                                                                                                     |
|-----------------------------------|-------------------------------------------------------------------------------------------------------------------------|
|`GET /api/news?feed=me|all&cursor=`|Lijst. **me** = `audience='all'` ∪ getarget op user/teams. **alles** = alles gepubliceerd binnen tenant (de NN/g-uitweg).|
|`GET /api/news/:id`                |Detail; schrijft meteen `news_reads` (teller daalt).                                                                     |
|`POST /api/news`                   |Aanmaken (rol: admin/redacteur). `ON CONFLICT(id) DO NOTHING` voor idempotentie.                                         |
|`PATCH /api/news/:id` / `DELETE`   |Bewerken / soft delete.                                                                                                  |

`countNew(nieuws)` = gepubliceerde posts in scope van de user zonder rij in `news_reads`. Home-feed-widget: nieuwste 3 in “Voor mij”-scope.

-----

## 5. Documentenmodule — D1 + R2

```sql
CREATE TABLE documents (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  title       TEXT NOT NULL,
  category    TEXT,                          -- 'HR', 'Veiligheid', 'Handleidingen'
  r2_key      TEXT NOT NULL,                 -- tenants/{tenant_id}/docs/{id}/{filename}
  filename    TEXT NOT NULL,
  mime        TEXT NOT NULL,
  size_bytes  INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at  TEXT                           -- soft delete
);
CREATE INDEX idx_docs_tenant_cat ON documents(tenant_id, category, created_at DESC);
```

API:

|Route                            |Doel                                                                                                 |
|---------------------------------|-----------------------------------------------------------------------------------------------------|
|`GET /api/documents?category=&q=`|Lijst + zoeken op titel (later FTS5 voor global search).                                             |
|`GET /api/documents/:id/file`    |Download gestreamd via de Worker (auth + tenant-check op `r2_key`-prefix, nooit een publieke R2-URL).|
|`POST /api/documents`            |Multipart-upload → R2; metadata → D1. Server bepaalt de `r2_key`, nooit de client.                   |
|`DELETE /api/documents/:id`      |Soft delete (R2-object opruimen via nachtelijke Cron).                                               |

**Bewust:** `homeWidget: null`. Documenten zijn pull-content; ze vervuilen de glanceable home niet. Vindbaar via de module en straks global search. (Twijfelgeval voor later: “recent geopend” als mini-widget — alleen toevoegen als gebruikers er aantoonbaar om vragen.)

-----

## 6. Bouwfases

**Fase 1 — Registry & aggregatie**
`homeWidget` + `countNew` toevoegen aan de registry; `GET /api/home` met `db.batch`; bestaande headerteller hierop aansluiten.
*Klaar wanneer:* een module uitzetten in de registry laat hem zonder verdere codewijziging verdwijnen uit teller, Voor jou én home.

**Fase 2 — Home-stack UI**
Lagen 2–4 bouwen op bestáánde modules: BHV → urgent, Agenda + Kantine → Vandaag (incl. stroomlijn + druppel op “nu”), Meldingen/Toernooien/Prikbord → Voor jou.
*Klaar wanneer:* lege lagen renderen niet (geen placeholders); de druppel staat chronologisch juist tussen de items; elke kaart deeplinkt naar het juiste scherm en markeert als gezien.

**Fase 3 — Nieuwsmodule**
Schema + API + modulescherm + feed-widget + Voor mij/Alles.
*Klaar wanneer:* een getarget bericht is voor een niet-doelgroep-user onzichtbaar in “Voor mij” maar wél vindbaar via “Alles”; ongelezen telt mee in de headerteller en daalt na openen; home toont max 3 kaarten + doorklik.

**Fase 4 — Documentenmodule**
Schema + R2-upload/-download via Worker + modulescherm met categorieën en zoeken.
*Klaar wanneer:* up-/download werkt met afgedwongen tenant-isolatie (prefix-check server-side); een document verschijnt nérgens op de home; verwijderen = soft delete + Cron-opruiming.

Afhankelijkheid: Fase 1 → 2; Fase 3 en 4 kunnen daarna parallel.

-----

## 7. Bekende valkuilen (niet opnieuw ontdekken)

1. **`100vh` op iOS** → gebruik `100dvh` (+ `html{height:-webkit-fill-available}` als fallback). Voorkomt de zwarte kin/viewport-sprong in PWA/standalone.
1. **`backdrop-filter`** → altijd mét `-webkit-`prefix; niet combineren met `overflow`/`transform` op hetzélfde element (Safari dropt dan de blur). Frosted laag = eigen element.
1. **`offsetLeft` (tabbar-blob)** → meten ná layout en herberekenen bij `resize`/rotatie én na `document.fonts.ready`; container `position:relative`, anders meet je t.o.v. de verkeerde `offsetParent`.
1. Eerder gedocumenteerd in BUGFIX-BRIEFING: stabiele keys + vaste aspect-ratio voor avatars; `scrollTop`-reset synchroon vóór paint.

-----

## 8. Plak-prompt voor de volgende Cowork-sessie

> We gaan verder met Stroom. Volg `home-redesign.md`. Bouw eerst Fase 1: voeg het `homeWidget`-contract en `countNew` toe aan de module-registry en maak `GET /api/home` dat alle widget-fetches in één `db.batch` uitvoert; sluit de bestaande headerteller hierop aan. Daarna Fase 2: de home-stack (urgentie → vandaag → voor jou) opbouwen uit de registry, conditioneel renderen, met de stroomlijn-met-druppel in het Vandaag-blok zoals in `home-mockup.html`. Let op de valkuilen in §7 (100dvh, -webkit-backdrop-filter, offsetLeft-meting). Eerste actie: terminalcheck en branch `feature/home-redesign`.