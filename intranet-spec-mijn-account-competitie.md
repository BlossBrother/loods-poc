# Build-spec: Mijn Account + Competitie-uitbreiding + Friet/Vis saldo

> Build-brief voor volgende Cowork-sessie. Stack: Cloudflare Workers + D1 + R2, Node.js + Wrangler.
> Volgorde: (1) Mijn Account fundament → (2) competitie-features per speler → (3) Dammen → (4) voice → (5) Friet/Vis.

---

## 0. Uitgangspunten / keuzes

- **Voice**: Web Speech API (`SpeechSynthesisUtterance`, lang `en-GB`) als basislaag — gratis, offline, geen dependency. Optionele R2-laag met opgenomen samples voor iconische calls (`180`, `game shot`, `checkout`), uitgebreidbaar zonder schema-wijziging.
- **Rankings (ELO / Nemesis / laatste 5)**: **per spel apart**. Darts en Dammen hebben elk een eigen ELO, eigen nemesis, eigen historie. Eén `game_type` kolom regelt dit.
- **Friet/Vis saldo**: **beide** afrekenmethoden mogelijk — handmatige bijboeking door Wendelien (kas/contant) én oplopend saldo dat periodiek verrekend wordt. Elke mutatie is een aparte transactie-regel (ledger-model).
- **Auth**: Cloudflare Access + M365 levert al de identiteit. We koppelen de Access-email aan een `players`-record; geen eigen wachtwoorden.

---

## 1. Datamodel (D1)

```sql
-- Spelers / medewerkers (1 record per medewerker, gekoppeld aan Access-email)
CREATE TABLE players (
  id            TEXT PRIMARY KEY,          -- uuid
  access_email  TEXT UNIQUE NOT NULL,      -- uit Cloudflare Access
  display_name  TEXT NOT NULL,             -- echte naam
  nickname      TEXT,                      -- zelf instelbaar
  intro_tune    TEXT,                      -- spotify track/embed URI
  created_at    INTEGER NOT NULL,
  roles         TEXT NOT NULL DEFAULT ''   -- comma-list: 'admin','pv' (leeg = gewone medewerker)
);
-- Voorbeeld: Wendelien roles='admin'; PV-leden roles='pv'; iemand kan beide: 'admin,pv'.
-- PV-leden bij start: Rian, Imke, Barry, Peter-Jan, Carina.
-- Helper in Worker: hasRole(player,'pv') = player.roles.split(',').includes('pv').

-- Per-speler instellingen per spel (voice aan/uit, etc.)
CREATE TABLE player_game_prefs (
  player_id   TEXT NOT NULL,
  game_type   TEXT NOT NULL,              -- 'darts' | 'draughts'
  voice_calls INTEGER NOT NULL DEFAULT 1, -- 1 = engelse calling aan
  PRIMARY KEY (player_id, game_type)
);

-- Wedstrijden (één rij per gespeelde pot)
CREATE TABLE matches (
  id          TEXT PRIMARY KEY,
  game_type   TEXT NOT NULL,             -- 'darts' | 'draughts'
  player_a    TEXT NOT NULL,
  player_b    TEXT NOT NULL,
  winner      TEXT NOT NULL,             -- player_a of player_b id
  score_a     INTEGER,
  score_b     INTEGER,
  elo_a_before INTEGER, elo_a_after INTEGER,
  elo_b_before INTEGER, elo_b_after INTEGER,
  tournament_id TEXT,                    -- nullable; gevuld bij toernooi
  played_at   INTEGER NOT NULL
);

-- ELO per speler per spel
CREATE TABLE ratings (
  player_id  TEXT NOT NULL,
  game_type  TEXT NOT NULL,
  elo        INTEGER NOT NULL DEFAULT 1000,
  wins       INTEGER NOT NULL DEFAULT 0,
  losses     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, game_type)
);

-- Toernooien (vrijmibo)
CREATE TABLE tournaments (
  id         TEXT PRIMARY KEY,
  game_type  TEXT NOT NULL,
  name       TEXT NOT NULL,             -- bv "Vrijmibo Darts 6 jun"
  format     TEXT NOT NULL,             -- 'round_robin' | 'single_elim'
  status     TEXT NOT NULL,            -- 'open' | 'running' | 'done'
  created_at INTEGER NOT NULL
);

CREATE TABLE tournament_players (
  tournament_id TEXT NOT NULL,
  player_id     TEXT NOT NULL,
  PRIMARY KEY (tournament_id, player_id)
);

-- Friet/Vis ledger: elke regel is een mutatie (+ opwaardering / - bestelling)
CREATE TABLE snack_ledger (
  id          TEXT PRIMARY KEY,
  player_id   TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,        -- positief = bijboeken, negatief = bestelling
  kind        TEXT NOT NULL,           -- 'topup_cash' | 'order' | 'settlement' | 'correction'
  description TEXT,
  created_by  TEXT NOT NULL,           -- player_id van wie de mutatie deed
  created_at  INTEGER NOT NULL
);

-- Menu voor het bestelformulier
CREATE TABLE snack_menu (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,           -- "Patat", "Kibbeling", "Frikandel"
  price_cents INTEGER NOT NULL,
  active      INTEGER NOT NULL DEFAULT 1
);
```

Saldo van een speler = `SUM(amount_cents)` over `snack_ledger`. Geen losse balanskolom (single source of truth, geen sync-bugs).

---

## 2. Mijn Account (fundament — bouw dit eerst)

Route: `/mijn-account`. Speler wordt herkend via Access-email → `players`-record (auto-aangemaakt bij eerste login).

Velden die de medewerker zelf beheert:
- **Nickname** — vrij tekstveld, max ~24 tekens, uniek-check optioneel.
- **Intro tune** — Spotify embed. UX: speler plakt een Spotify track-link; backend pakt de track-ID en slaat `spotify:track:<id>` op. In de UI renderen via de Spotify iFrame embed (`https://open.spotify.com/embed/track/<id>`).
- **Voice calls aan/uit** — per spel een toggle (`player_game_prefs`).

Worker-endpoints:
- `GET /api/me` → eigen profiel + prefs
- `PATCH /api/me` → nickname / intro_tune bijwerken
- `PATCH /api/me/prefs` → voice toggle per game_type

---

## 3. Competitie per speler

### 3.1 ELO (per spel)
Standaard ELO, K-factor 32, startwaarde 1000. Bij afronden van een pot:
```
verwacht_a = 1 / (1 + 10^((elo_b - elo_a)/400))
elo_a_new  = elo_a + K * (uitslag_a - verwacht_a)   // uitslag 1 win / 0 verlies
```
Bereken in de Worker bij `POST /api/matches`, schrijf before/after weg in `matches` én update `ratings`.

### 3.2 Nemesis (per spel)
Tegenstander tegen wie deze speler de **meeste potten verloren** heeft, binnen `game_type`:
```sql
SELECT winner AS nemesis, COUNT(*) AS losses
FROM matches
WHERE game_type = ?1
  AND (player_a = ?2 OR player_b = ?2)
  AND winner <> ?2
GROUP BY winner ORDER BY losses DESC LIMIT 1;
```
Toon "Je nemesis: <nickname> (n verloren)".

### 3.3 Laatste 5 potten (per spel)
Laatste 5 matches van de speler, weergegeven als W/L-rijtje (bv 🟢🟢🔴🟢🔴). Query op `played_at DESC LIMIT 5`, W bepalen via `winner == player_id`.

### 3.4 In-match score-teller met spelerprofiel
Tijdens een lopende pot toon je per speler: nickname, ELO, laatste-5, en speel desgewenst de intro tune af bij de start (Spotify embed autoplay is beperkt door browser — zet als "tap to play" knop bij de naam).

### 3.5 Toernooi (vrijmibo)
- Beheerder/initiator maakt toernooi (`POST /api/tournaments`), kiest game_type + format.
- Spelers schrijven zich in (`tournament_players`).
- Bij start: genereer schema (round robin = alle paren; single elim = bracket).
- Elke toernooipot is een gewone `matches`-rij met `tournament_id` gezet → telt mee voor ELO.
- Eindstand: meeste wins (round robin) of bracket-winnaar.

---

## 4. Dammen toevoegen
Hergebruik volledig hetzelfde model: `game_type = 'draughts'` overal. Geen apart datamodel. Eigen ELO/nemesis/historie volgt automatisch uit de `game_type`-filter. Voeg 'draughts' toe aan de competitie-tab als tweede spel naast darten.

---

## 5. Voice: Engelse score-calling

Basislaag (Web Speech API, in de score-teller UI):
```js
function call(text) {
  if (!playerPrefs.voice_calls) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB';
  u.rate = 0.95;
  speechSynthesis.speak(u);
}
```
Darts-calls die je triggert:
- Bij worp-invoer: het getal ("sixty", "one hundred and forty", "one hundred and eighty!").
- Bij checkout: "game shot, and the leg!".
- Bij bust: "no score".

Dammen-calls: simpeler — bij zet of winst ("king me", "you win"). Houd een mapping-tabel in code (`callMap`) per game_type.

**Optionele upgrade (later, géén schema-wijziging):** leg `.mp3` samples in R2 onder `voice/darts/180.mp3` etc. Probeer eerst sample af te spelen, val terug op TTS als die ontbreekt. Zo krijg je het echte caller-geluid voor de iconische calls.

---

## 6. Friet/Vis saldo

### 6.1 Bestelformulier (alle medewerkers)
Route `/friet`. Toon `snack_menu` (active=1), laat aantallen kiezen, toon totaal. Bij bevestigen:
- `POST /api/snacks/order` → schrijf één `snack_ledger`-regel met `kind='order'`, `amount_cents = -totaal`, omschrijving = items.
- Saldo wordt automatisch aangepast (want saldo = SUM).

### 6.2 Mijn Account → saldo
Toon huidig saldo (`SUM`) + recente mutaties. Rood bij negatief.

### 6.3 Beheerder-overzicht (Wendelien, `roles` bevat `admin`)
Route `/friet/beheer`:
- Overzicht alle spelers met saldo (gesorteerd, negatieve bovenaan).
- **Handmatig bijboeken** (kas/contant): `POST /api/snacks/topup` → `kind='topup_cash'`, positief bedrag.
- **Periodiek verrekenen**: knop "Verrekenen" per speler → `kind='settlement'`, boekt saldo terug naar 0 en logt het bedrag (zodat de historie blijft kloppen).
- Menu beheren (item toevoegen/prijs wijzigen/deactiveren).

Beide afrekenmethoden draaien dus door hetzelfde ledger — niets dubbel.

---

## 7. Algemene agenda

Route `/agenda`. Eén gedeelde bedrijfsagenda met drie weergaven: **dag / week / maand** (alle drie verplicht, schakelaar bovenin).

### 7.1 Rollen & rechten
- **Lezen**: iedereen.
- **Aanmaken/bewerken/verwijderen van events**: rol `admin` óf `pv`.
- PV-leden bij start: Rian, Imke, Barry, Peter-Jan, Carina (zet `roles='pv'`).
- Worker-guard op alle schrijf-endpoints: `if (!hasRole(p,'admin') && !hasRole(p,'pv')) return 403`.

### 7.2 Datamodel
```sql
CREATE TABLE events (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  location    TEXT,
  category    TEXT NOT NULL,          -- 'pv' | 'company' | 'leave' (leave = later via Buddee)
  start_at    INTEGER NOT NULL,       -- epoch
  end_at      INTEGER NOT NULL,
  all_day     INTEGER NOT NULL DEFAULT 0,
  source      TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'buddee'
  external_id TEXT,                   -- id uit Buddee, voor sync/idempotency
  created_by  TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX idx_events_range ON events (start_at, end_at);
```

### 7.3 Weergaven (frontend)
- **Maand**: klassiek raster (6 weken), events als gekleurde balkjes per dag, kleur op `category`.
- **Week**: 7 kolommen, uren-as links, multi-day events als balk bovenaan.
- **Dag**: één kolom met uur-slots + losse all-day-strip.
- Tip: bouw één `EventGrid`-component dat een datumrange + events krijgt; de drie views verschillen alleen in range + render-dichtheid. Scheelt veel dubbele code. Lichte lib-optie: FullCalendar (heeft dag/week/maand out-of-the-box), maar custom houdt de bundle klein en past in de bestaande stijl — keuze bij de build.

### 7.4 Endpoints
- `GET /api/events?from=&to=` → events in range (voor de actieve view).
- `POST /api/events` (admin/pv) → event aanmaken.
- `PATCH /api/events/:id` / `DELETE /api/events/:id` (admin/pv).

### 7.5 Buddee HR-koppeling (later, nu alleen voorbereiden)
- Verlof komt binnen als events met `category='leave'`, `source='buddee'`, `external_id` = Buddee-record-id.
- Sync via een Cloudflare **Cron Trigger** (bv. elk uur): haal verlof uit Buddee API, upsert op `external_id` (idempotent), zet `all_day=1`.
- Schema is er al klaar voor → nu niets extra's nodig, alleen de cron-worker + API-credentials toevoegen wanneer Buddee live gaat. Bewaar de Buddee-token als Wrangler secret, niet in code.

---

## 8. Menustructuur — het wordt veel, dus herindelen

Met Mijn Account, Competitie (darts/dammen/toernooi), Friet/Vis en Agenda erbij worden het te veel losse top-items. Aanbeveling en alternatieven:

### Aanbevolen: zijbalk met inklapbare secties
Een linker zijbalk (op mobiel een hamburger-drawer) met events gegroepeerd in secties:

```
🏠 Home
📅 Agenda
🏆 Competitie
   • Darten
   • Dammen
   • Toernooien
   • Ranglijsten
🍟 Kantine
   • Bestellen
   • Mijn saldo
   • Beheer (alleen admin)
👤 Mijn account
⚙️ Beheer            (alleen admin/pv — agenda-beheer, menu, rollen)
```
Waarom dit het beste past hier: het aantal items blijft groeien (Buddee, later meer HR/portal-features), en een zijbalk schaalt daar moeiteloos in mee zonder dat de bovenbalk vol raakt. Secties laten zich rol-gestuurd tonen (beheer alleen voor admin/pv). Werkt prettig naast een smalle content-kolom op desktop én klapt netjes weg op mobiel.

### Alternatief A: top-tabs met dropdowns
Bovenbalk met hoofdgroepen (Agenda · Competitie ▾ · Kantine ▾ · Account). Compact en vertrouwd, maar dropdowns zijn op mobiel wat fiddly en je loopt sneller tegen breedte-grenzen aan naarmate je features toevoegt.

### Alternatief B: hub-dashboard met tegels
Home toont grote categorie-tegels (Agenda, Competitie, Kantine, Account); elke tegel leidt naar een sub-navigatie. Heel rustig en visueel, goede landingservaring, maar het kost altijd een extra klik om ergens te komen — minder fijn voor dagelijks terugkerend gebruik zoals snel een score invoeren.

> Keuze in de spec: **zijbalk met secties**. Bouw de navigatie als één config-array (`[{section, items:[{label, route, roles}]}]`) zodat rol-filtering en latere uitbreiding triviaal blijven.

---

## 9. Build-volgorde voor de sessie
1. `players` + `player_game_prefs` tabellen + rollenveld + `/api/me` + Mijn Account-scherm (nickname, intro tune, voice toggle).
2. Navigatie herinrichten naar zijbalk-met-secties (config-array, rol-filtering).
3. ELO/nemesis/laatste-5 queries + competitie-tab uitbreiden op spelerniveau (darts).
4. Score-teller met spelerprofiel + toernooi-flow.
5. Dammen aanzetten (`game_type='draughts'`).
6. Voice-laag (TTS) inbouwen in score-teller.
7. Agenda: `events`-tabel + dag/week/maand-views + PV/admin-rechten.
8. Friet/Vis: menu + bestelformulier + saldo + beheerscherm Wendelien.
9. (Later) Buddee-cron voor verlof in de agenda.

> Wrangler: nieuwe migraties als losse `.sql` in `migrations/`. Onthoud `wrangler d1 migrations apply` na elke tabel-toevoeging, check de R2-bucket-binding bij de voice-samples, en bewaar de Buddee-token als Wrangler secret wanneer die koppeling aan de beurt is.
