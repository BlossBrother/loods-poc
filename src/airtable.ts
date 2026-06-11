// Datalaag. LET OP: deze module heet historisch "airtable" maar draait nu volledig
// op Cloudflare D1 (EU-jurisdictie). De Airtable-koppeling is vervangen; de oude
// implementatie staat als airtable.legacy.ts (voor rollback).
//
// De export-namen, signatures en return-vormen zijn identiek gebleven aan de
// Airtable-versie, zodat alle routes/views ongewijzigd blijven. Records houden de
// vorm { id, createdTime, fields }, met dezelfde Nederlandse veldnamen.
//
// Afbeeldingen: in D1 staat alleen een R2-sleutel (*_key). Bij het lezen mappen we
// die zowel naar het bijbehorende "...sleutel"-tekstveld als naar een synthetische
// attachment-URL (/bestand?k=...), zodat views die de attachment-URL lezen óók
// blijven werken zonder aanpassing.

export interface Env {
  // ---- Airtable: alleen nog historisch/optioneel (niet meer gebruikt door de app) ----

  // Cloudflare Access-groep-sync (v187): uitzendkracht-login volgt Beheer → Medewerkers.
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
  CF_ACCESS_GROUP_ID?: string;
  // AVG: automatische opschoning van bezoekmeldingen (opt-in).
  AVG_CLEANUP_ENABLED?: string;
  RETENTIE_DAGEN?: string;
  // Externe app-snelkoppelingen (intranet).
  BUDDEE_URL?: string;
  BUDDEE_EMAIL?: string;
  BUDDEE_PASSWORD?: string;
  TIMECHIMP_URL?: string;
  WK_POULE_URL?: string;
  BEZOEK_ENABLED?: string;
  BEHEERDER_EMAILS?: string;
  // R2-bucket voor geuploade documenten én gemigreerde afbeeldingen.
  DOCS?: R2Bucket;
  // D1 = de hoofddatabase (platform-tabellen + events-log).
  DB?: D1Database;
  // Workers AI-binding voor inline vertaling (m2m100).
  AI?: { run(model: string, inputs: Record<string, unknown>): Promise<any> };
  // Vectorize-index voor de kennisbank/vraagbaak (RAG). Optioneel: pas actief als de
  // index is aangemaakt en de binding in wrangler.toml staat.
  VECTORIZE?: {
    query(vector: number[], opts?: Record<string, unknown>): Promise<{ matches?: { id: string; score: number; metadata?: any }[] }>;
    upsert(rows: { id: string; values: number[]; metadata?: Record<string, unknown> }[]): Promise<unknown>;
    deleteByIds(ids: string[]): Promise<unknown>;
  };

  // ---- Auth-hardening (intern deel) ----
  DEV_MODE?: string;
  // Lokaal (dev): forceer een concrete identiteit; standaard de eerste BEHEERDER_EMAILS.
  DEV_EMAIL?: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;

  // ---- Klantenportaal ----
  PORTAL_SECRET?: string;
  PORTAL_BASE_URL?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;

  // ---- Web Push ----
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
  PUSH_API_KEY?: string;
}

export interface AirtableRecord<T> {
  id: string;
  createdTime: string;
  fields: T;
}

/* ===================== D1-helpers ===================== */

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1-database (binding DB) is niet geconfigureerd.");
  return env.DB;
}

async function rows<T = Record<string, unknown>>(
  env: Env,
  sql: string,
  ...binds: unknown[]
): Promise<T[]> {
  const r = await db(env).prepare(sql).bind(...binds).all<T>();
  return (r.results ?? []) as T[];
}

async function one<T = Record<string, unknown>>(
  env: Env,
  sql: string,
  ...binds: unknown[]
): Promise<T | undefined> {
  const r = await db(env).prepare(sql).bind(...binds).first<T>();
  return (r ?? undefined) as T | undefined;
}

async function run(env: Env, sql: string, ...binds: unknown[]): Promise<number> {
  const r = await db(env).prepare(sql).bind(...binds).run();
  return r.meta?.changes ?? 0;
}

function nieuwId(): string {
  return "r" + crypto.randomUUID().replace(/-/g, "");
}

// R2-sleutel -> synthetische attachment (zodat views met .url/.thumbnails werken).
function bijlage(
  key: unknown,
): { url?: string; thumbnails?: { large?: { url?: string } } }[] | undefined {
  if (!key || typeof key !== "string") return undefined;
  const url = /^https?:\/\//.test(key) ? key : `/bestand?k=${encodeURIComponent(key)}`;
  return [{ url, thumbnails: { large: { url } } }];
}

const s = (v: unknown): string | undefined => (v == null ? undefined : String(v));
const linkArr = (v: unknown): string[] | undefined => (v ? [String(v)] : undefined);

/* ===================== Medewerkers ===================== */

export interface MedewerkerFields {
  Naam?: string;
  Afdeling?: string;
  Rol?: string;
  Actief?: boolean;
  Verjaardag?: string;
  "E-mail"?: string;
  Telefoon?: string;
  Functie?: string;
  Foto?: { url?: string; thumbnails?: { large?: { url?: string } } }[];
  "Nieuws gezien"?: string;
  VerjaardagZichtbaar?: boolean;
}

function medewerkerRec(r: Record<string, unknown>): AirtableRecord<MedewerkerFields> {
  return {
    id: String(r.id),
    createdTime: s(r.created_at) ?? "",
    fields: {
      Naam: s(r.naam),
      Afdeling: s(r.afdeling),
      Rol: s(r.rol),
      Actief: !!r.actief,
      Verjaardag: s(r.verjaardag),
      "E-mail": s(r.email),
      Telefoon: s(r.telefoon),
      Functie: s(r.functie),
      Foto: bijlage(r.foto_key),
      "Nieuws gezien": s(r.nieuws_gezien),
      VerjaardagZichtbaar: r.verjaardag_zichtbaar == null ? true : !!r.verjaardag_zichtbaar,
    },
  };
}

export async function getMedewerkers(env: Env): Promise<AirtableRecord<MedewerkerFields>[]> {
  const rs = await rows(env, "SELECT * FROM medewerkers ORDER BY naam COLLATE NOCASE ASC");
  return rs.map(medewerkerRec);
}

export function naamMap(medewerkers: AirtableRecord<MedewerkerFields>[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const r of medewerkers) m.set(r.id, r.fields.Naam ?? "(onbekend)");
  return m;
}

/* ===================== Nieuws ===================== */

export interface NieuwsFields {
  Titel?: string;
  Inhoud?: string;
  Categorie?: string;
  Publicatiedatum?: string;
  Status?: string;
  Zichtbaarheid?: string;
  Uitgelicht?: boolean;
  Afbeelding?: { url?: string; thumbnails?: { large?: { url?: string } } }[];
  Afbeeldingssleutel?: string;
}

function nieuwsRec(r: Record<string, unknown>): AirtableRecord<NieuwsFields> {
  return {
    id: String(r.id),
    createdTime: s(r.created_at) ?? "",
    fields: {
      Titel: s(r.titel),
      Inhoud: s(r.inhoud),
      Categorie: s(r.categorie),
      Publicatiedatum: s(r.publicatiedatum),
      Status: s(r.status),
      Zichtbaarheid: s(r.zichtbaarheid),
      Uitgelicht: !!r.uitgelicht,
      Afbeelding: bijlage(r.afbeelding_key),
      Afbeeldingssleutel: s(r.afbeelding_key),
    },
  };
}

export async function getGepubliceerdNieuws(env: Env): Promise<AirtableRecord<NieuwsFields>[]> {
  const rs = await rows(
    env,
    "SELECT * FROM nieuws WHERE status='Gepubliceerd' ORDER BY publicatiedatum DESC LIMIT 20",
  );
  return rs.map(nieuwsRec);
}

export async function getAlleNieuws(env: Env): Promise<AirtableRecord<NieuwsFields>[]> {
  const rs = await rows(env, "SELECT * FROM nieuws ORDER BY created_at DESC");
  return rs.map(nieuwsRec);
}

/* ===================== Documenten ===================== */

export interface DocumentFields {
  Titel?: string;
  Omschrijving?: string;
  "Externe link"?: string;
  Categorie?: string;
  Bestandssleutel?: string;
  Bestandsnaam?: string;
  Afbeelding?: { url?: string; thumbnails?: { large?: { url?: string } } }[];
}

function documentRec(r: Record<string, unknown>): AirtableRecord<DocumentFields> {
  return {
    id: String(r.id),
    createdTime: s(r.created_at) ?? "",
    fields: {
      Titel: s(r.titel),
      Omschrijving: s(r.omschrijving),
      "Externe link": s(r.externe_link),
      Categorie: s(r.categorie),
      Bestandssleutel: s(r.bestandssleutel),
      Bestandsnaam: s(r.bestandsnaam),
      Afbeelding: bijlage(r.afbeelding_key),
    },
  };
}

export async function getDocumenten(env: Env): Promise<AirtableRecord<DocumentFields>[]> {
  const rs = await rows(env, "SELECT * FROM documenten ORDER BY titel COLLATE NOCASE ASC");
  return rs.map(documentRec);
}

/* ===================== Bezoekmeldingen ===================== */

export interface BezoekFields {
  Bezoeker?: string;
  Bedrijf?: string;
  "E-mail"?: string;
  "Verwacht op"?: string;
  Reden?: string;
  Status?: string;
  Opmerkingen?: string;
}

function bezoekRec(r: Record<string, unknown>): AirtableRecord<BezoekFields> {
  return {
    id: String(r.id),
    createdTime: s(r.created_at) ?? "",
    fields: {
      Bezoeker: s(r.bezoeker),
      Bedrijf: s(r.bedrijf),
      "E-mail": s(r.email),
      "Verwacht op": s(r.verwacht_op),
      Reden: s(r.reden),
      Status: s(r.status),
      Opmerkingen: s(r.opmerkingen),
    },
  };
}

export async function getBezoekVandaag(env: Env): Promise<AirtableRecord<BezoekFields>[]> {
  const rs = await rows(
    env,
    "SELECT * FROM bezoekmeldingen WHERE date(verwacht_op)=date('now') ORDER BY verwacht_op ASC",
  );
  return rs.map(bezoekRec);
}

export async function createBezoek(
  env: Env,
  fields: BezoekFields,
): Promise<AirtableRecord<BezoekFields>> {
  const id = nieuwId();
  await run(
    env,
    `INSERT INTO bezoekmeldingen (id, bezoeker, bedrijf, email, verwacht_op, reden, status, opmerkingen, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    fields.Bezoeker ?? null,
    fields.Bedrijf ?? null,
    fields["E-mail"] ?? null,
    fields["Verwacht op"] ?? null,
    fields.Reden ?? null,
    fields.Status ?? null,
    fields.Opmerkingen ?? null,
    new Date().toISOString(),
  );
  return { id, createdTime: new Date().toISOString(), fields };
}

// Zet status + tijdstip bij in- of uitchecken van een bezoekmelding.
export async function setBezoekStatus(
  env: Env,
  recordId: string,
  status: "Ingecheckt" | "Vertrokken",
): Promise<void> {
  const kolom = status === "Ingecheckt" ? "ingecheckt_om" : "vertrokken_om";
  await run(
    env,
    `UPDATE bezoekmeldingen SET status=?, ${kolom}=? WHERE id=?`,
    status,
    new Date().toISOString(),
    recordId,
  );
}

// Verwijdert bezoekmeldingen ouder dan `dagen` (op aanmaakmoment). Retourneert het aantal.
export async function opschoonBezoekmeldingen(env: Env, dagen: number): Promise<number> {
  return run(
    env,
    "DELETE FROM bezoekmeldingen WHERE created_at < datetime('now', ?)",
    `-${Math.max(0, Math.floor(dagen))} days`,
  );
}

/* ===================== Receptie (iPad-base — buiten scope) ===================== */

export interface ReceptieFields {
  Naam?: string;
  Bedrijf?: string;
  "Bezoek aan"?: string;
  Reden?: string;
  Tijdstip?: string;
  Locatie?: string;
  "Policy akkoord"?: boolean;
}

// De iPad-Bezoekersregistratie is niet gemigreerd en wordt niet gebruikt.
// Behouden als no-op zodat bestaande aanroepen blijven compileren.
export async function getReceptieVandaag(
  _env: Env,
): Promise<AirtableRecord<ReceptieFields>[]> {
  return [];
}

/* ===================== Prikbord: Posts & Reacties ===================== */

export interface PostFields {
  Bericht?: string;
  Auteur?: string[];
  Ontvanger?: string[];
  Afbeelding?: { url?: string; thumbnails?: { large?: { url?: string } } }[];
}

export interface ReactieFields {
  Reactie?: string;
  Post?: string[];
  Auteur?: string[];
}

export async function getPosts(env: Env): Promise<AirtableRecord<PostFields>[]> {
  // Premium-audit: begrensd i.p.v. alles — houdt het prikbord snel als de tabel groeit.
  const rs = await rows(env, "SELECT * FROM posts WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 80");
  return rs.map((r) => ({
    id: String(r.id),
    createdTime: s(r.created_at) ?? "",
    fields: { Bericht: s(r.bericht), Auteur: linkArr(r.auteur_id), Ontvanger: linkArr(r.ontvanger_id), Afbeelding: bijlage(r.afbeelding_key) },
  }));
}

export async function getReacties(env: Env): Promise<AirtableRecord<ReactieFields>[]> {
  const rs = await rows(env, "SELECT * FROM reacties WHERE deleted_at IS NULL ORDER BY created_at ASC");
  return rs.map((r) => ({
    id: String(r.id),
    createdTime: s(r.created_at) ?? "",
    fields: { Reactie: s(r.reactie), Post: linkArr(r.post_id), Auteur: linkArr(r.auteur_id) },
  }));
}

export async function createPost(
  env: Env,
  bericht: string,
  auteurId: string,
  afbeeldingKey?: string,
  ontvangerId?: string,
  idem?: string | null,
): Promise<AirtableRecord<PostFields>> {
  const id = idem ?? nieuwId();
  const ts = new Date().toISOString();
  await run(env, "INSERT INTO posts (id, bericht, auteur_id, afbeelding_key, ontvanger_id, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING", id, bericht, auteurId, afbeeldingKey ?? null, ontvangerId ?? null, ts);
  return { id, createdTime: ts, fields: { Bericht: bericht, Auteur: [auteurId], Ontvanger: ontvangerId ? [ontvangerId] : undefined, Afbeelding: bijlage(afbeeldingKey) } };
}

export async function createReactie(
  env: Env,
  reactie: string,
  postId: string,
  auteurId: string,
  idem?: string | null,
): Promise<AirtableRecord<ReactieFields>> {
  const id = idem ?? nieuwId();
  const ts = new Date().toISOString();
  await run(
    env,
    "INSERT INTO reacties (id, reactie, post_id, auteur_id, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING",
    id,
    reactie,
    postId,
    auteurId,
    ts,
  );
  return { id, createdTime: ts, fields: { Reactie: reactie, Post: [postId], Auteur: [auteurId] } };
}

/* ===================== Nieuws-reacties ===================== */

export interface NieuwsReactie {
  id: string;
  nieuws_id: string;
  auteur_id?: string | null;
  reactie: string;
  created_at: string;
}

export async function getNieuwsReacties(env: Env): Promise<NieuwsReactie[]> {
  return rows<NieuwsReactie>(env, "SELECT * FROM nieuws_reacties WHERE tenant_id='default' ORDER BY created_at ASC");
}

export async function getNieuwsReactie(env: Env, id: string): Promise<NieuwsReactie | undefined> {
  return one<NieuwsReactie>(env, "SELECT * FROM nieuws_reacties WHERE tenant_id='default' AND id=?", id);
}

export async function createNieuwsReactie(env: Env, nieuwsId: string, reactie: string, auteurId?: string, idem?: string | null): Promise<void> {
  await run(
    env,
    "INSERT INTO nieuws_reacties (id, tenant_id, nieuws_id, auteur_id, reactie, created_at) VALUES (?, 'default', ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING",
    idem ?? nieuwId(), nieuwsId, auteurId ?? null, reactie, new Date().toISOString(),
  );
}

export async function deleteNieuwsReactie(env: Env, id: string): Promise<void> {
  await run(env, "DELETE FROM nieuws_reacties WHERE tenant_id='default' AND id=?", id);
}

/* ===================== Emoji-reacties ===================== */

export async function getEmojiReacties(
  env: Env,
  targetType: string,
): Promise<{ target_id: string; emoji: string; auteur_id: string }[]> {
  return rows(env, "SELECT target_id, emoji, auteur_id FROM emoji_reacties WHERE tenant_id='default' AND target_type=?", targetType);
}

export async function getEmojiVoorTarget(
  env: Env,
  targetType: string,
  targetId: string,
): Promise<{ emoji: string; auteur_id: string }[]> {
  return rows(env, "SELECT emoji, auteur_id FROM emoji_reacties WHERE tenant_id='default' AND target_type=? AND target_id=?", targetType, targetId);
}

export async function toggleEmoji(
  env: Env,
  targetType: string,
  targetId: string,
  emoji: string,
  auteurId: string,
): Promise<void> {
  const bestaat = await one(env, "SELECT id FROM emoji_reacties WHERE tenant_id='default' AND target_type=? AND target_id=? AND emoji=? AND auteur_id=?", targetType, targetId, emoji, auteurId);
  if (bestaat) {
    // Zelfde emoji nogmaals = reactie weghalen (toggle uit).
    await run(env, "DELETE FROM emoji_reacties WHERE tenant_id='default' AND target_type=? AND target_id=? AND emoji=? AND auteur_id=?", targetType, targetId, emoji, auteurId);
  } else {
    // Max één actieve emoji per gebruiker per bericht: verwijder eerst een eventuele andere
    // reactie van deze gebruiker op dit target, voeg dan de nieuwe toe (vervangt de oude).
    await run(env, "DELETE FROM emoji_reacties WHERE tenant_id='default' AND target_type=? AND target_id=? AND auteur_id=?", targetType, targetId, auteurId);
    await run(env, "INSERT INTO emoji_reacties (id, tenant_id, target_type, target_id, emoji, auteur_id, created_at) VALUES (?, 'default', ?, ?, ?, ?, ?)", nieuwId(), targetType, targetId, emoji, auteurId, new Date().toISOString());
  }
}

/* ===================== Afdelingen ===================== */

export interface AfdelingFields {
  Naam?: string;
}

export async function getAfdelingen(env: Env): Promise<AirtableRecord<AfdelingFields>[]> {
  const rs = await rows(env, "SELECT * FROM afdelingen ORDER BY naam COLLATE NOCASE ASC");
  return rs.map((r) => ({ id: String(r.id), createdTime: "", fields: { Naam: s(r.naam) } }));
}

/* ===================== Klanten (portaal) ===================== */

export interface KlantFields {
  Naam?: string;
  "E-mail"?: string;
  Bedrijf?: string;
  Actief?: boolean;
  "Laatste login"?: string;
  Taal?: string;
}

function klantRec(r: Record<string, unknown>): AirtableRecord<KlantFields> {
  return {
    id: String(r.id),
    createdTime: "",
    fields: {
      Naam: s(r.naam),
      "E-mail": s(r.email),
      Bedrijf: s(r.bedrijf),
      Actief: !!r.actief,
      "Laatste login": s(r.laatste_login),
      Taal: s(r.taal),
    },
  };
}

export async function getKlantByEmail(
  env: Env,
  email: string,
): Promise<AirtableRecord<KlantFields> | undefined> {
  const r = await one(
    env,
    "SELECT * FROM klanten WHERE actief=1 AND lower(email)=lower(?) LIMIT 1",
    email,
  );
  return r ? klantRec(r) : undefined;
}

export async function updateKlantLogin(env: Env, recordId: string): Promise<void> {
  await run(env, "UPDATE klanten SET laatste_login=? WHERE id=?", new Date().toISOString(), recordId);
}

export async function getKlanten(env: Env): Promise<AirtableRecord<KlantFields>[]> {
  const rs = await rows(env, "SELECT * FROM klanten ORDER BY naam COLLATE NOCASE ASC");
  return rs.map(klantRec);
}

/* ===================== Portaal-content ===================== */

export interface RasFields {
  Naam?: string;
  Gewas?: string;
  Omschrijving?: string;
  Smaak?: string;
  Kleur?: string;
  Seizoen?: string;
  Afbeelding?: { url?: string; thumbnails?: { large?: { url?: string } } }[];
  Bestandssleutel?: string;
  Bestandsnaam?: string;
  Volgorde?: number;
  Gepubliceerd?: boolean;
}

export interface TeeltadviesFields {
  Titel?: string;
  Inhoud?: string;
  Ras?: string[];
  Categorie?: string;
  Volgorde?: number;
  Gepubliceerd?: boolean;
  Afbeelding?: { url?: string; thumbnails?: { large?: { url?: string } } }[];
  Bestandssleutel?: string;
  Bestandsnaam?: string;
}

export interface SnoeiPlukFields {
  Titel?: string;
  Type?: string;
  Inhoud?: string;
  Ras?: string[];
  Periode?: string;
  Volgorde?: number;
  Gepubliceerd?: boolean;
  Afbeelding?: { url?: string; thumbnails?: { large?: { url?: string } } }[];
  Bestandssleutel?: string;
  Bestandsnaam?: string;
}

export interface KlantdocumentFields {
  Titel?: string;
  Omschrijving?: string;
  "Externe link"?: string;
  Bestandssleutel?: string;
  Bestandsnaam?: string;
  Categorie?: string;
  Gepubliceerd?: boolean;
  Afbeelding?: { url?: string; thumbnails?: { large?: { url?: string } } }[];
}

export async function getRassen(env: Env): Promise<AirtableRecord<RasFields>[]> {
  const rs = await rows(
    env,
    "SELECT * FROM rassen WHERE gepubliceerd=1 ORDER BY COALESCE(volgorde, 9999) ASC, naam COLLATE NOCASE ASC",
  );
  return rs.map((r) => ({
    id: String(r.id),
    createdTime: "",
    fields: {
      Naam: s(r.naam),
      Gewas: s(r.gewas),
      Omschrijving: s(r.omschrijving),
      Smaak: s(r.smaak),
      Kleur: s(r.kleur),
      Seizoen: s(r.seizoen),
      Afbeelding: bijlage(r.afbeelding_key),
      Bestandssleutel: s(r.bestandssleutel), Bestandsnaam: s(r.bestandsnaam),
      Volgorde: r.volgorde == null ? undefined : Number(r.volgorde),
      Gepubliceerd: !!r.gepubliceerd,
    },
  }));
}

export async function getTeeltadvies(env: Env): Promise<AirtableRecord<TeeltadviesFields>[]> {
  const rs = await rows(
    env,
    "SELECT * FROM teeltadvies WHERE gepubliceerd=1 ORDER BY COALESCE(volgorde, 9999) ASC, titel COLLATE NOCASE ASC",
  );
  return rs.map((r) => ({
    id: String(r.id),
    createdTime: "",
    fields: {
      Titel: s(r.titel),
      Inhoud: s(r.inhoud),
      Ras: linkArr(r.ras_id),
      Categorie: s(r.categorie),
      Volgorde: r.volgorde == null ? undefined : Number(r.volgorde),
      Gepubliceerd: !!r.gepubliceerd,
      Afbeelding: bijlage(r.afbeelding_key),
      Bestandssleutel: s(r.bestandssleutel), Bestandsnaam: s(r.bestandsnaam),
    },
  }));
}

export async function getSnoeiPluk(env: Env): Promise<AirtableRecord<SnoeiPlukFields>[]> {
  const rs = await rows(
    env,
    "SELECT * FROM snoei_pluk WHERE gepubliceerd=1 ORDER BY COALESCE(volgorde, 9999) ASC, titel COLLATE NOCASE ASC",
  );
  return rs.map((r) => ({
    id: String(r.id),
    createdTime: "",
    fields: {
      Titel: s(r.titel),
      Type: s(r.type),
      Inhoud: s(r.inhoud),
      Ras: linkArr(r.ras_id),
      Periode: s(r.periode),
      Volgorde: r.volgorde == null ? undefined : Number(r.volgorde),
      Gepubliceerd: !!r.gepubliceerd,
      Afbeelding: bijlage(r.afbeelding_key),
      Bestandssleutel: s(r.bestandssleutel), Bestandsnaam: s(r.bestandsnaam),
    },
  }));
}

export async function getKlantdocumenten(env: Env): Promise<AirtableRecord<KlantdocumentFields>[]> {
  const rs = await rows(
    env,
    "SELECT * FROM klantdocumenten WHERE gepubliceerd=1 ORDER BY titel COLLATE NOCASE ASC",
  );
  return rs.map((r) => ({
    id: String(r.id),
    createdTime: "",
    fields: {
      Titel: s(r.titel),
      Omschrijving: s(r.omschrijving),
      "Externe link": s(r.externe_link),
      Bestandssleutel: s(r.bestandssleutel),
      Bestandsnaam: s(r.bestandsnaam),
      Categorie: s(r.categorie),
      Gepubliceerd: !!r.gepubliceerd,
      Afbeelding: bijlage(r.afbeelding_key),
    },
  }));
}

/* ===================== Web-push abonnementen ===================== */

export interface PushAbonnementFields {
  Endpoint?: string;
  "E-mail"?: string;
  P256dh?: string;
  Auth?: string;
  "Laatst gebruikt"?: string;
}

export async function getPushAbonnementen(env: Env): Promise<AirtableRecord<PushAbonnementFields>[]> {
  const rs = await rows(env, "SELECT * FROM pushabonnementen");
  return rs.map((r) => ({
    id: String(r.id),
    createdTime: "",
    fields: {
      Endpoint: s(r.endpoint),
      "E-mail": s(r.email),
      P256dh: s(r.p256dh),
      Auth: s(r.auth),
      "Laatst gebruikt": s(r.laatst_gebruikt),
    },
  }));
}

export async function upsertPushAbonnement(
  env: Env,
  email: string | undefined,
  endpoint: string,
  p256dh: string,
  auth: string,
): Promise<void> {
  const ts = new Date().toISOString();
  const bestaande = await one<{ id: string }>(
    env,
    "SELECT id FROM pushabonnementen WHERE endpoint=? LIMIT 1",
    endpoint,
  );
  if (bestaande) {
    await run(
      env,
      "UPDATE pushabonnementen SET email=?, p256dh=?, auth=?, laatst_gebruikt=? WHERE id=?",
      email ?? null,
      p256dh,
      auth,
      ts,
      bestaande.id,
    );
  } else {
    await run(
      env,
      "INSERT INTO pushabonnementen (id, endpoint, email, p256dh, auth, laatst_gebruikt) VALUES (?, ?, ?, ?, ?, ?)",
      nieuwId(),
      endpoint,
      email ?? null,
      p256dh,
      auth,
      ts,
    );
  }
}

// Zonder voorEmail: interne opschoning (bv. 404/410 bij verzenden) — wist op endpoint.
// Mét voorEmail (de /push/unsubscribe-route): alleen het eigen abonnement (of een
// anoniem abonnement) — voorkomt dat een ingelogde collega andermans push uitzet.
export async function deletePushByEndpoint(env: Env, endpoint: string, voorEmail?: string | null): Promise<void> {
  if (voorEmail === undefined) {
    await run(env, "DELETE FROM pushabonnementen WHERE endpoint=?", endpoint);
    return;
  }
  await run(env, "DELETE FROM pushabonnementen WHERE endpoint=? AND (email IS NULL OR email=?)", endpoint, (voorEmail ?? "").toLowerCase());
}

/* ===================== Generiek schrijven (beheer) ===================== */

type Kol = [string, "text" | "int" | "bool" | "link" | "attach"];

const D1TABEL: Record<string, string> = {
  Medewerkers: "medewerkers",
  Nieuws: "nieuws",
  Documenten: "documenten",
  Bezoekmeldingen: "bezoekmeldingen",
  Posts: "posts",
  Reacties: "reacties",
  Afdelingen: "afdelingen",
  Klanten: "klanten",
  Rassen: "rassen",
  Teeltadvies: "teeltadvies",
  "Snoei en pluk": "snoei_pluk",
  Klantdocumenten: "klantdocumenten",
  Pushabonnementen: "pushabonnementen",
};

const VELD: Record<string, Record<string, Kol>> = {
  Medewerkers: {
    Naam: ["naam", "text"], "E-mail": ["email", "text"], Rol: ["rol", "text"],
    Afdeling: ["afdeling", "text"], Actief: ["actief", "bool"], Verjaardag: ["verjaardag", "text"],
    Telefoon: ["telefoon", "text"], Functie: ["functie", "text"],
    "Nieuws gezien": ["nieuws_gezien", "text"], Foto: ["foto_key", "text"], VerjaardagZichtbaar: ["verjaardag_zichtbaar", "bool"],
  },
  Nieuws: {
    Titel: ["titel", "text"], Inhoud: ["inhoud", "text"], Categorie: ["categorie", "text"],
    Publicatiedatum: ["publicatiedatum", "text"], Status: ["status", "text"],
    Zichtbaarheid: ["zichtbaarheid", "text"], Uitgelicht: ["uitgelicht", "bool"],
    Afbeeldingssleutel: ["afbeelding_key", "text"], Auteur: ["auteur_id", "link"],
  },
  Documenten: {
    Titel: ["titel", "text"], Omschrijving: ["omschrijving", "text"],
    "Externe link": ["externe_link", "text"], Categorie: ["categorie", "text"],
    Bestandssleutel: ["bestandssleutel", "text"], Bestandsnaam: ["bestandsnaam", "text"],
    Afbeeldingssleutel: ["afbeelding_key", "text"], Eigenaar: ["eigenaar_id", "link"],
  },
  Bezoekmeldingen: {
    Bezoeker: ["bezoeker", "text"], Bedrijf: ["bedrijf", "text"], "E-mail": ["email", "text"],
    "Verwacht op": ["verwacht_op", "text"], Reden: ["reden", "text"], Status: ["status", "text"],
    "Ingecheckt om": ["ingecheckt_om", "text"], "Vertrokken om": ["vertrokken_om", "text"],
    Opmerkingen: ["opmerkingen", "text"],
  },
  Posts: { Bericht: ["bericht", "text"], Auteur: ["auteur_id", "link"], Ontvanger: ["ontvanger_id", "link"] },
  Reacties: { Reactie: ["reactie", "text"], Post: ["post_id", "link"], Auteur: ["auteur_id", "link"] },
  Afdelingen: { Naam: ["naam", "text"] },
  Klanten: {
    Naam: ["naam", "text"], "E-mail": ["email", "text"], Bedrijf: ["bedrijf", "text"],
    Actief: ["actief", "bool"], "Laatste login": ["laatste_login", "text"],
    Notitie: ["notitie", "text"], Taal: ["taal", "text"],
  },
  Rassen: {
    Naam: ["naam", "text"], Gewas: ["gewas", "text"], Omschrijving: ["omschrijving", "text"],
    Smaak: ["smaak", "text"], Kleur: ["kleur", "text"], Seizoen: ["seizoen", "text"],
    Afbeeldingssleutel: ["afbeelding_key", "text"], Volgorde: ["volgorde", "int"], Gepubliceerd: ["gepubliceerd", "bool"],
    Bestandssleutel: ["bestandssleutel", "text"], Bestandsnaam: ["bestandsnaam", "text"],
  },
  Teeltadvies: {
    Titel: ["titel", "text"], Inhoud: ["inhoud", "text"], Ras: ["ras_id", "link"],
    Categorie: ["categorie", "text"], Volgorde: ["volgorde", "int"], Gepubliceerd: ["gepubliceerd", "bool"],
    Afbeeldingssleutel: ["afbeelding_key", "text"], Bestandssleutel: ["bestandssleutel", "text"], Bestandsnaam: ["bestandsnaam", "text"],
  },
  "Snoei en pluk": {
    Titel: ["titel", "text"], Type: ["type", "text"], Inhoud: ["inhoud", "text"], Ras: ["ras_id", "link"],
    Periode: ["periode", "text"], Volgorde: ["volgorde", "int"], Gepubliceerd: ["gepubliceerd", "bool"],
    Afbeeldingssleutel: ["afbeelding_key", "text"], Bestandssleutel: ["bestandssleutel", "text"], Bestandsnaam: ["bestandsnaam", "text"],
  },
  Klantdocumenten: {
    Titel: ["titel", "text"], Omschrijving: ["omschrijving", "text"], "Externe link": ["externe_link", "text"],
    Bestandssleutel: ["bestandssleutel", "text"], Bestandsnaam: ["bestandsnaam", "text"],
    Categorie: ["categorie", "text"], Gepubliceerd: ["gepubliceerd", "bool"], Afbeeldingssleutel: ["afbeelding_key", "text"],
  },
  Pushabonnementen: {
    Endpoint: ["endpoint", "text"], "E-mail": ["email", "text"], P256dh: ["p256dh", "text"],
    Auth: ["auth", "text"], "Laatst gebruikt": ["laatst_gebruikt", "text"],
  },
};

function bindWaarde(type: Kol[1], v: unknown): unknown {
  if (v === undefined) return undefined;
  if (v === null) return null;
  switch (type) {
    case "bool": return v ? 1 : 0;
    case "int": { const n = Number(v); return Number.isFinite(n) ? n : null; }
    case "link": { const id = Array.isArray(v) ? v[0] : v; return id ? String(id) : null; }
    default: return String(v);
  }
}

// Vertaalt een { NederlandseVeldnaam: waarde }-object naar { kolom: bindwaarde }.
function kolommen(table: string, fields: Record<string, unknown>): Record<string, unknown> {
  const map = VELD[table];
  if (!map) throw new Error(`Onbekende tabel voor schrijven: ${table}`);
  const out: Record<string, unknown> = {};
  for (const [veld, waarde] of Object.entries(fields)) {
    const kol = map[veld];
    if (!kol) continue; // onbekend veld -> overslaan
    if (kol[1] === "attach") continue; // attachments niet via generieke weg
    const bw = bindWaarde(kol[1], waarde);
    if (bw === undefined) continue; // undefined -> niet meeschrijven
    out[kol[0]] = bw;
  }
  return out;
}

export async function createInTabel<T>(
  env: Env,
  table: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord<T>> {
  const d1 = D1TABEL[table];
  if (!d1) throw new Error(`Onbekende tabel: ${table}`);
  const cols = kolommen(table, fields);
  const id = nieuwId();
  const heeftCreated = new Set([
    "medewerkers", "nieuws", "documenten", "bezoekmeldingen", "posts", "reacties",
  ]).has(d1);
  const namen = ["id", ...Object.keys(cols)];
  const binds: unknown[] = [id, ...Object.values(cols)];
  if (heeftCreated) {
    namen.push("created_at");
    binds.push(new Date().toISOString());
  }
  const ph = namen.map(() => "?").join(", ");
  await run(env, `INSERT INTO ${d1} (${namen.join(", ")}) VALUES (${ph})`, ...binds);
  return { id, createdTime: new Date().toISOString(), fields: fields as unknown as T };
}

export async function updateInTabel<T>(
  env: Env,
  table: string,
  recordId: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord<T>> {
  const d1 = D1TABEL[table];
  if (!d1) throw new Error(`Onbekende tabel: ${table}`);
  const cols = kolommen(table, fields);
  const namen = Object.keys(cols);
  if (namen.length) {
    const set = namen.map((k) => `${k}=?`).join(", ");
    await run(env, `UPDATE ${d1} SET ${set} WHERE id=?`, ...Object.values(cols), recordId);
  }
  return { id: recordId, createdTime: "", fields: fields as unknown as T };
}

export async function deleteInTabel(env: Env, table: string, recordId: string): Promise<void> {
  const d1 = D1TABEL[table];
  if (!d1) throw new Error(`Onbekende tabel: ${table}`);
  await run(env, `DELETE FROM ${d1} WHERE id=?`, recordId);
}

// Soft delete (Stroom-plan 1.4): markeren i.p.v. wissen, zodat "Ongedaan maken"
// het record (incl. positie) kan herstellen. De cron ruimt na 30 dagen definitief op.
export async function softDeleteInTabel(env: Env, table: string, recordId: string): Promise<void> {
  const d1 = D1TABEL[table];
  if (!d1) throw new Error(`Onbekende tabel: ${table}`);
  await run(env, `UPDATE ${d1} SET deleted_at=? WHERE id=?`, Date.now(), recordId);
}
export async function restoreInTabel(env: Env, table: string, recordId: string): Promise<void> {
  const d1 = D1TABEL[table];
  if (!d1) throw new Error(`Onbekende tabel: ${table}`);
  await run(env, `UPDATE ${d1} SET deleted_at=NULL WHERE id=?`, recordId);
}

/* ===================== Beheer: volledige lijsten ===================== */

export async function getAlleRassen(env: Env): Promise<AirtableRecord<RasFields>[]> {
  const rs = await rows(env, "SELECT * FROM rassen ORDER BY COALESCE(volgorde,9999) ASC, naam COLLATE NOCASE ASC");
  return rs.map((r) => ({
    id: String(r.id), createdTime: "",
    fields: {
      Naam: s(r.naam), Gewas: s(r.gewas), Omschrijving: s(r.omschrijving), Smaak: s(r.smaak),
      Kleur: s(r.kleur), Seizoen: s(r.seizoen), Afbeelding: bijlage(r.afbeelding_key),
      Bestandssleutel: s(r.bestandssleutel), Bestandsnaam: s(r.bestandsnaam),
      Volgorde: r.volgorde == null ? undefined : Number(r.volgorde), Gepubliceerd: !!r.gepubliceerd,
    },
  }));
}

export async function getAlleTeeltadvies(env: Env): Promise<AirtableRecord<TeeltadviesFields>[]> {
  const rs = await rows(env, "SELECT * FROM teeltadvies ORDER BY COALESCE(volgorde,9999) ASC, titel COLLATE NOCASE ASC");
  return rs.map((r) => ({
    id: String(r.id), createdTime: "",
    fields: {
      Titel: s(r.titel), Inhoud: s(r.inhoud), Ras: linkArr(r.ras_id), Categorie: s(r.categorie),
      Volgorde: r.volgorde == null ? undefined : Number(r.volgorde), Gepubliceerd: !!r.gepubliceerd,
      Afbeelding: bijlage(r.afbeelding_key),
      Bestandssleutel: s(r.bestandssleutel), Bestandsnaam: s(r.bestandsnaam),
    },
  }));
}

export async function getAlleSnoeiPluk(env: Env): Promise<AirtableRecord<SnoeiPlukFields>[]> {
  const rs = await rows(env, "SELECT * FROM snoei_pluk ORDER BY COALESCE(volgorde,9999) ASC, titel COLLATE NOCASE ASC");
  return rs.map((r) => ({
    id: String(r.id), createdTime: "",
    fields: {
      Titel: s(r.titel), Type: s(r.type), Inhoud: s(r.inhoud), Ras: linkArr(r.ras_id), Periode: s(r.periode),
      Volgorde: r.volgorde == null ? undefined : Number(r.volgorde), Gepubliceerd: !!r.gepubliceerd,
      Afbeelding: bijlage(r.afbeelding_key),
      Bestandssleutel: s(r.bestandssleutel), Bestandsnaam: s(r.bestandsnaam),
    },
  }));
}

export async function getAlleKlantdocumenten(env: Env): Promise<AirtableRecord<KlantdocumentFields>[]> {
  const rs = await rows(env, "SELECT * FROM klantdocumenten ORDER BY titel COLLATE NOCASE ASC");
  return rs.map((r) => ({
    id: String(r.id), createdTime: "",
    fields: {
      Titel: s(r.titel), Omschrijving: s(r.omschrijving), "Externe link": s(r.externe_link),
      Bestandssleutel: s(r.bestandssleutel), Bestandsnaam: s(r.bestandsnaam), Categorie: s(r.categorie),
      Gepubliceerd: !!r.gepubliceerd, Afbeelding: bijlage(r.afbeelding_key),
    },
  }));
}
