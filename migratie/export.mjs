#!/usr/bin/env node
/* =====================================================================
 * Airtable -> D1 export. Leest de platform-base en schrijft:
 *   migratie/seed.sql            -> INSERTs voor alle 14 tabellen
 *   migratie/afbeeldingen.json   -> manifest van Airtable-attachments
 *                                   (voor de R2-kopieerstap in Ronde 2)
 *
 * Gebruik (vanuit de projectmap):
 *   AIRTABLE_TOKEN=pat... node migratie/export.mjs
 * of, als je token in .dev.vars staat, leest het script die automatisch.
 *
 * PK = Airtable-record-id (recXXXX), zodat alle relaties 1-op-1 meekomen.
 * Booleans -> 0/1, datums -> TEXT, links -> eerste gekoppelde id.
 * Attachment-kolommen (*_key) blijven NULL; die worden in Ronde 2 gevuld.
 * ===================================================================== */

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const BASE = process.env.AIRTABLE_BASE_ID || "appfamE6fOFcwcONn";

function token() {
  if (process.env.AIRTABLE_TOKEN) return process.env.AIRTABLE_TOKEN;
  // val terug op .dev.vars (KEY=value per regel)
  for (const f of [".dev.vars", "./.dev.vars"]) {
    if (existsSync(f)) {
      const m = readFileSync(f, "utf8").match(/^\s*AIRTABLE_TOKEN\s*=\s*"?([^"\n]+)"?/m);
      if (m) return m[1].trim();
    }
  }
  console.error("Geen AIRTABLE_TOKEN gevonden (env of .dev.vars).");
  process.exit(1);
}
const TOKEN = token();

// type: text | int | bool | date | link | attach
// 'attach' -> doelkolom blijft NULL in seed; wordt opgenomen in het manifest.
const TABELLEN = [
  { at: "Medewerkers", d1: "medewerkers", velden: {
      Naam:"naam", "E-mail":"email", Rol:"rol", Afdeling:"afdeling", Actief:["actief","bool"],
      Foto:["foto_key","attach"], Telefoon:"telefoon", Verjaardag:["verjaardag","date"],
      "Nieuws gezien":["nieuws_gezien","date"], Functie:"functie" } },
  { at: "Nieuws", d1: "nieuws", velden: {
      Titel:"titel", Inhoud:"inhoud", Categorie:"categorie", Publicatiedatum:["publicatiedatum","date"],
      Status:"status", Zichtbaarheid:"zichtbaarheid", Uitgelicht:["uitgelicht","bool"],
      Afbeelding:["afbeelding_key","attach"], Afbeeldingssleutel:["afbeelding_key","text"],
      Auteur:["auteur_id","link"] } },
  { at: "Documenten", d1: "documenten", velden: {
      Titel:"titel", Omschrijving:"omschrijving", "Externe link":"externe_link", Categorie:"categorie",
      Bestand:["bestandssleutel","attach"], Bestandssleutel:["bestandssleutel","text"],
      Bestandsnaam:"bestandsnaam", Afbeelding:["afbeelding_key","attach"], Eigenaar:["eigenaar_id","link"] } },
  { at: "Bezoekmeldingen", d1: "bezoekmeldingen", velden: {
      Bezoeker:"bezoeker", Bedrijf:"bedrijf", "E-mail":"email", "Verwacht op":["verwacht_op","date"],
      Reden:"reden", Status:"status", "Ingecheckt om":["ingecheckt_om","date"],
      "Vertrokken om":["vertrokken_om","date"], Opmerkingen:"opmerkingen",
      Host:["host_id","link"], "Aangemeld door":["aangemeld_door_id","link"] } },
  { at: "Wedstrijden", d1: "wedstrijden", velden: {
      Wedstrijd:"wedstrijd", Sport:"sport", "Speler 1":["speler1_id","link"], "Speler 2":["speler2_id","link"],
      "Score 1":["score1","int"], "Score 2":["score2","int"], Winnaar:["winnaar_id","link"],
      "Gespeeld op":["gespeeld_op","date"], Opmerking:"opmerking" } },
  { at: "Posts", d1: "posts", velden: { Bericht:"bericht", Auteur:["auteur_id","link"] } },
  { at: "Reacties", d1: "reacties", velden: {
      Reactie:"reactie", Post:["post_id","link"], Auteur:["auteur_id","link"] } },
  { at: "Afdelingen", d1: "afdelingen", velden: { Naam:"naam" } },
  { at: "Klanten", d1: "klanten", velden: {
      Naam:"naam", "E-mail":"email", Bedrijf:"bedrijf", Actief:["actief","bool"],
      "Laatste login":["laatste_login","date"], Notitie:"notitie", Taal:"taal" } },
  { at: "Rassen", d1: "rassen", velden: {
      Naam:"naam", Gewas:"gewas", Omschrijving:"omschrijving", Smaak:"smaak", Kleur:"kleur",
      Seizoen:"seizoen", Afbeelding:["afbeelding_key","attach"], Volgorde:["volgorde","int"],
      Gepubliceerd:["gepubliceerd","bool"] } },
  { at: "Teeltadvies", d1: "teeltadvies", velden: {
      Titel:"titel", Inhoud:"inhoud", Ras:["ras_id","link"], Categorie:"categorie",
      Volgorde:["volgorde","int"], Gepubliceerd:["gepubliceerd","bool"], Afbeelding:["afbeelding_key","attach"] } },
  { at: "Snoei en pluk", d1: "snoei_pluk", velden: {
      Titel:"titel", Type:"type", Inhoud:"inhoud", Ras:["ras_id","link"], Periode:"periode",
      Volgorde:["volgorde","int"], Gepubliceerd:["gepubliceerd","bool"], Afbeelding:["afbeelding_key","attach"] } },
  { at: "Klantdocumenten", d1: "klantdocumenten", velden: {
      Titel:"titel", Omschrijving:"omschrijving", "Externe link":"externe_link",
      Bestandssleutel:"bestandssleutel", Bestandsnaam:"bestandsnaam", Categorie:"categorie",
      Gepubliceerd:["gepubliceerd","bool"], Afbeelding:["afbeelding_key","attach"] } },
  { at: "Pushabonnementen", d1: "pushabonnementen", velden: {
      Endpoint:"endpoint", "E-mail":"email", P256dh:"p256dh", Auth:"auth",
      "Laatst gebruikt":["laatst_gebruikt","date"] } },
];

const heeftCreated = new Set([
  "medewerkers","nieuws","documenten","bezoekmeldingen","wedstrijden","posts","reacties",
]);

function spec(v) { return Array.isArray(v) ? { col: v[0], type: v[1] } : { col: v, type: "text" }; }
function sqlStr(s) { return "'" + String(s).replace(/'/g, "''") + "'"; }

function sqlVal(type, raw) {
  if (raw === undefined || raw === null || raw === "") return "NULL";
  switch (type) {
    case "int": { const n = Number(raw); return Number.isFinite(n) ? String(n) : "NULL"; }
    case "bool": return raw ? "1" : "0";
    case "date": return sqlStr(raw); // Airtable levert al ISO/yyyy-mm-dd
    case "link": { const id = Array.isArray(raw) ? raw[0] : raw; return id ? sqlStr(id) : "NULL"; }
    case "attach": return "NULL"; // ingevuld in Ronde 2 vanuit het manifest
    default: return sqlStr(raw);
  }
}

async function haalAlles(tabel) {
  const out = [];
  let offset;
  do {
    const u = new URL(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(tabel)}`);
    u.searchParams.set("pageSize", "100");
    if (offset) u.searchParams.set("offset", offset);
    const res = await fetch(u, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!res.ok) throw new Error(`${tabel}: Airtable ${res.status} ${await res.text()}`);
    const data = await res.json();
    out.push(...data.records);
    offset = data.offset;
  } while (offset);
  return out;
}

const lines = ["-- Gegenereerd door migratie/export.mjs", "PRAGMA foreign_keys=OFF;", "BEGIN TRANSACTION;"];
const manifest = [];
let totaal = 0;

for (const t of TABELLEN) {
  const records = await haalAlles(t.at);
  const cols = ["id"];
  for (const v of Object.values(t.velden)) cols.push(spec(v).col);
  if (heeftCreated.has(t.d1)) cols.push("created_at");
  // dedupe kolommen (Afbeelding + Afbeeldingssleutel -> beide afbeelding_key)
  const uniekeCols = [...new Set(cols)];

  lines.push(`\n-- ${t.at} (${records.length})`);
  for (const r of records) {
    const rij = { id: sqlStr(r.id) };
    for (const [atNaam, v] of Object.entries(t.velden)) {
      const { col, type } = spec(v);
      const waarde = r.fields[atNaam];
      if (type === "attach" && Array.isArray(waarde) && waarde.length && waarde[0].url) {
        manifest.push({ d1: t.d1, id: r.id, kolom: col, url: waarde[0].url,
          bestandsnaam: waarde[0].filename || "", type: waarde[0].type || "" });
      }
      const val = sqlVal(type, waarde);
      // 'text' op een attach-kolom (bestaande R2-sleutel) wint van NULL
      if (!(col in rij) || (rij[col] === "NULL" && val !== "NULL")) rij[col] = val;
    }
    if (heeftCreated.has(t.d1)) rij.created_at = sqlStr(r.createdTime);
    const waarden = uniekeCols.map((c) => (c in rij ? rij[c] : "NULL"));
    lines.push(`INSERT INTO ${t.d1} (${uniekeCols.join(", ")}) VALUES (${waarden.join(", ")});`);
    totaal++;
  }
}

lines.push("COMMIT;", "PRAGMA foreign_keys=ON;", "");
writeFileSync("migratie/seed.sql", lines.join("\n"));
writeFileSync("migratie/afbeeldingen.json", JSON.stringify(manifest, null, 2));
console.log(`seed.sql: ${totaal} records.  afbeeldingen.json: ${manifest.length} attachments.`);
