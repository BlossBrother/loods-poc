// CRM-datalaag (ADR-001). Platform-klaar: elke functie krijgt een CrmDb-handle
// (db + tenant) in plaats van rauwe env.DB — bij het porten naar het multi-tenant
// platform wordt deze handle 1-op-1 vervangen door tenantDb. Alle CRM-queries
// staan in DIT bestand; handlers/views bevatten geen SQL.
import type { Env } from "../airtable";

export interface CrmDb { db: D1Database; tenant: string }

export function crmDb(env: Env): CrmDb {
  if (!env.DB) throw new Error("D1-database (DB) niet geconfigureerd.");
  return { db: env.DB, tenant: "default" };
}

function uid(prefix: string): string {
  return prefix + crypto.randomUUID().replace(/-/g, "");
}

/* ===================== Types ===================== */

export interface CrmKlant {
  id: string;
  naam: string;
  bedrijf?: string;
  email?: string;
  actief: boolean;
  laatste_login?: string;
  notitie?: string;
  taal?: string;
}

export interface KlantStat extends CrmKlant {
  contacten: number;
  taken_open: number;
  deals_open: number;
  laatste_moment?: number | null;
}

export interface Contactpersoon {
  id: string;
  klant_id: string;
  naam: string;
  functie?: string;
  email?: string;
  telefoon?: string;
  notitie?: string;
  created_by?: string;
  created_at: number;
}

export type MomentType = "bezoek" | "telefoon" | "email" | "overig";
export const MOMENT_TYPES: { type: MomentType; label: string }[] = [
  { type: "bezoek", label: "Bezoek" },
  { type: "telefoon", label: "Telefoon" },
  { type: "email", label: "E-mail" },
  { type: "overig", label: "Overig" },
];

export interface Contactmoment {
  id: string;
  klant_id: string;
  contact_id?: string | null;
  type: MomentType;
  notitie: string;
  datum: number;
  created_by?: string;
  created_naam?: string;
  created_at: number;
}

export interface Taak {
  id: string;
  klant_id?: string | null;
  titel: string;
  omschrijving?: string;
  deadline?: number | null;
  eigenaar_id?: string;
  eigenaar_naam?: string;
  status: "open" | "klaar";
  created_by?: string;
  created_at: number;
  done_at?: number | null;
}

export type DealFase = "lead" | "contact" | "offerte" | "gewonnen" | "verloren";
export const DEAL_FASES: { fase: DealFase; label: string }[] = [
  { fase: "lead", label: "Lead" },
  { fase: "contact", label: "In gesprek" },
  { fase: "offerte", label: "Offerte" },
  { fase: "gewonnen", label: "Gewonnen" },
  { fase: "verloren", label: "Verloren" },
];
export function faseLabel(fase: string): string {
  return DEAL_FASES.find((f) => f.fase === fase)?.label ?? fase;
}

export interface Deal {
  id: string;
  klant_id: string;
  titel: string;
  waarde_cents?: number | null;
  fase: DealFase;
  notitie?: string;
  eigenaar_id?: string;
  eigenaar_naam?: string;
  created_by?: string;
  created_at: number;
  updated_at: number;
}

/* ===================== Klanten (gedeeld met portaal) ===================== */

function toKlant(r: Record<string, unknown>): CrmKlant {
  return {
    id: String(r.id),
    naam: String(r.naam ?? ""),
    bedrijf: r.bedrijf ? String(r.bedrijf) : undefined,
    email: r.email ? String(r.email) : undefined,
    actief: r.actief == null ? true : !!Number(r.actief),
    laatste_login: r.laatste_login ? String(r.laatste_login) : undefined,
    notitie: r.notitie ? String(r.notitie) : undefined,
    taal: r.taal ? String(r.taal) : undefined,
  };
}

export async function getCrmKlant(h: CrmDb, id: string): Promise<CrmKlant | undefined> {
  const r = await h.db.prepare("SELECT * FROM klanten WHERE id=? LIMIT 1").bind(id).first<Record<string, unknown>>();
  return r ? toKlant(r) : undefined;
}

// Naam-lookup voor taken-/pipeline-schermen (één query i.p.v. N).
export async function klantNamen(h: CrmDb): Promise<Map<string, string>> {
  const r = await h.db.prepare("SELECT id, naam, bedrijf FROM klanten").all<Record<string, unknown>>();
  return new Map(
    (r.results ?? []).map((k) => [String(k.id), String(k.naam ?? "") + (k.bedrijf ? ` (${String(k.bedrijf)})` : "")]),
  );
}

// Overzicht: klanten + CRM-kerncijfers in één query (subselects zijn goedkoop op deze omvang).
export async function listKlantStats(h: CrmDb, zoek?: string): Promise<KlantStat[]> {
  // ?1 = tenant (meermaals hergebruikt), ?2 = zoekterm (alleen bij zoeken).
  const sql = `SELECT k.*,
    (SELECT COUNT(*) FROM crm_contactpersonen cp WHERE cp.tenant_id=?1 AND cp.klant_id=k.id AND cp.deleted_at IS NULL) AS contacten,
    (SELECT COUNT(*) FROM crm_taken t WHERE t.tenant_id=?1 AND t.klant_id=k.id AND t.status='open' AND t.deleted_at IS NULL) AS taken_open,
    (SELECT COUNT(*) FROM crm_deals d WHERE d.tenant_id=?1 AND d.klant_id=k.id AND d.fase NOT IN ('gewonnen','verloren') AND d.deleted_at IS NULL) AS deals_open,
    (SELECT MAX(m.datum) FROM crm_contactmomenten m WHERE m.tenant_id=?1 AND m.klant_id=k.id AND m.deleted_at IS NULL) AS laatste_moment
    FROM klanten k ${zoek ? "WHERE (k.naam LIKE ?2 OR k.bedrijf LIKE ?2 OR k.email LIKE ?2)" : ""}
    ORDER BY k.naam COLLATE NOCASE ASC`;
  const stmt = zoek ? h.db.prepare(sql).bind(h.tenant, `%${zoek}%`) : h.db.prepare(sql).bind(h.tenant);
  const r = await stmt.all<Record<string, unknown>>();
  return (r.results ?? []).map((row) => ({
    ...toKlant(row),
    contacten: Number(row.contacten ?? 0),
    taken_open: Number(row.taken_open ?? 0),
    deals_open: Number(row.deals_open ?? 0),
    laatste_moment: row.laatste_moment == null ? null : Number(row.laatste_moment),
  }));
}

/* ===================== Contactpersonen ===================== */

function toContact(r: Record<string, unknown>): Contactpersoon {
  return {
    id: String(r.id),
    klant_id: String(r.klant_id),
    naam: String(r.naam ?? ""),
    functie: r.functie ? String(r.functie) : undefined,
    email: r.email ? String(r.email) : undefined,
    telefoon: r.telefoon ? String(r.telefoon) : undefined,
    notitie: r.notitie ? String(r.notitie) : undefined,
    created_by: r.created_by ? String(r.created_by) : undefined,
    created_at: Number(r.created_at ?? 0),
  };
}

export async function listContacten(h: CrmDb, klantId: string): Promise<Contactpersoon[]> {
  const r = await h.db
    .prepare("SELECT * FROM crm_contactpersonen WHERE tenant_id=? AND klant_id=? AND deleted_at IS NULL ORDER BY naam COLLATE NOCASE ASC")
    .bind(h.tenant, klantId)
    .all<Record<string, unknown>>();
  return (r.results ?? []).map(toContact);
}

export async function getContact(h: CrmDb, id: string): Promise<Contactpersoon | undefined> {
  const r = await h.db
    .prepare("SELECT * FROM crm_contactpersonen WHERE tenant_id=? AND id=? AND deleted_at IS NULL LIMIT 1")
    .bind(h.tenant, id)
    .first<Record<string, unknown>>();
  return r ? toContact(r) : undefined;
}

export async function createContact(
  h: CrmDb,
  c: { klantId: string; naam: string; functie?: string; email?: string; telefoon?: string; notitie?: string; createdBy?: string },
): Promise<string> {
  const id = uid("cp");
  await h.db
    .prepare(
      `INSERT INTO crm_contactpersonen (id, tenant_id, klant_id, naam, functie, email, telefoon, notitie, created_by, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    )
    .bind(id, h.tenant, c.klantId, c.naam, c.functie || null, c.email || null, c.telefoon || null, c.notitie || null, c.createdBy || null, Date.now())
    .run();
  return id;
}

export async function updateContact(
  h: CrmDb,
  id: string,
  c: { naam: string; functie?: string; email?: string; telefoon?: string; notitie?: string },
): Promise<void> {
  await h.db
    .prepare("UPDATE crm_contactpersonen SET naam=?, functie=?, email=?, telefoon=?, notitie=? WHERE tenant_id=? AND id=?")
    .bind(c.naam, c.functie || null, c.email || null, c.telefoon || null, c.notitie || null, h.tenant, id)
    .run();
}

export async function deleteContact(h: CrmDb, id: string): Promise<void> {
  await h.db.prepare("UPDATE crm_contactpersonen SET deleted_at=? WHERE tenant_id=? AND id=?").bind(Date.now(), h.tenant, id).run();
}

/* ===================== Contactmomenten ===================== */

function toMoment(r: Record<string, unknown>): Contactmoment {
  const type = String(r.type ?? "overig");
  return {
    id: String(r.id),
    klant_id: String(r.klant_id),
    contact_id: r.contact_id ? String(r.contact_id) : null,
    type: (MOMENT_TYPES.some((t) => t.type === type) ? type : "overig") as MomentType,
    notitie: String(r.notitie ?? ""),
    datum: Number(r.datum ?? 0),
    created_by: r.created_by ? String(r.created_by) : undefined,
    created_naam: r.created_naam ? String(r.created_naam) : undefined,
    created_at: Number(r.created_at ?? 0),
  };
}

export async function listMomenten(h: CrmDb, klantId: string, limit = 25): Promise<Contactmoment[]> {
  const r = await h.db
    .prepare("SELECT * FROM crm_contactmomenten WHERE tenant_id=? AND klant_id=? AND deleted_at IS NULL ORDER BY datum DESC, created_at DESC LIMIT ?")
    .bind(h.tenant, klantId, limit)
    .all<Record<string, unknown>>();
  return (r.results ?? []).map(toMoment);
}

export async function getMoment(h: CrmDb, id: string): Promise<Contactmoment | undefined> {
  const r = await h.db
    .prepare("SELECT * FROM crm_contactmomenten WHERE tenant_id=? AND id=? AND deleted_at IS NULL LIMIT 1")
    .bind(h.tenant, id)
    .first<Record<string, unknown>>();
  return r ? toMoment(r) : undefined;
}

export async function createMoment(
  h: CrmDb,
  m: { klantId: string; contactId?: string; type: MomentType; notitie: string; datum: number; createdBy?: string; createdNaam?: string },
): Promise<string> {
  const id = uid("cm");
  await h.db
    .prepare(
      `INSERT INTO crm_contactmomenten (id, tenant_id, klant_id, contact_id, type, notitie, datum, created_by, created_naam, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    )
    .bind(id, h.tenant, m.klantId, m.contactId || null, m.type, m.notitie, m.datum, m.createdBy || null, m.createdNaam || null, Date.now())
    .run();
  return id;
}

export async function deleteMoment(h: CrmDb, id: string): Promise<void> {
  await h.db.prepare("UPDATE crm_contactmomenten SET deleted_at=? WHERE tenant_id=? AND id=?").bind(Date.now(), h.tenant, id).run();
}

/* ===================== Taken ===================== */

function toTaak(r: Record<string, unknown>): Taak {
  return {
    id: String(r.id),
    klant_id: r.klant_id ? String(r.klant_id) : null,
    titel: String(r.titel ?? ""),
    omschrijving: r.omschrijving ? String(r.omschrijving) : undefined,
    deadline: r.deadline == null ? null : Number(r.deadline),
    eigenaar_id: r.eigenaar_id ? String(r.eigenaar_id) : undefined,
    eigenaar_naam: r.eigenaar_naam ? String(r.eigenaar_naam) : undefined,
    status: String(r.status) === "klaar" ? "klaar" : "open",
    created_by: r.created_by ? String(r.created_by) : undefined,
    created_at: Number(r.created_at ?? 0),
    done_at: r.done_at == null ? null : Number(r.done_at),
  };
}

export async function listTaken(
  h: CrmDb,
  opts: { status?: "open" | "klaar"; klantId?: string; limit?: number } = {},
): Promise<Taak[]> {
  let sql = "SELECT * FROM crm_taken WHERE tenant_id=? AND deleted_at IS NULL";
  const binds: unknown[] = [h.tenant];
  if (opts.status) { sql += " AND status=?"; binds.push(opts.status); }
  if (opts.klantId) { sql += " AND klant_id=?"; binds.push(opts.klantId); }
  sql += " ORDER BY (deadline IS NULL) ASC, deadline ASC, created_at DESC";
  if (opts.limit) { sql += " LIMIT ?"; binds.push(opts.limit); }
  const r = await h.db.prepare(sql).bind(...binds).all<Record<string, unknown>>();
  return (r.results ?? []).map(toTaak);
}

export async function getTaak(h: CrmDb, id: string): Promise<Taak | undefined> {
  const r = await h.db
    .prepare("SELECT * FROM crm_taken WHERE tenant_id=? AND id=? AND deleted_at IS NULL LIMIT 1")
    .bind(h.tenant, id)
    .first<Record<string, unknown>>();
  return r ? toTaak(r) : undefined;
}

export async function createTaak(
  h: CrmDb,
  t: { klantId?: string; titel: string; omschrijving?: string; deadline?: number | null; eigenaarId?: string; eigenaarNaam?: string; createdBy?: string },
): Promise<string> {
  const id = uid("ct");
  await h.db
    .prepare(
      `INSERT INTO crm_taken (id, tenant_id, klant_id, titel, omschrijving, deadline, eigenaar_id, eigenaar_naam, status, created_by, created_at)
       VALUES (?,?,?,?,?,?,?,?,'open',?,?)`,
    )
    .bind(id, h.tenant, t.klantId || null, t.titel, t.omschrijving || null, t.deadline ?? null, t.eigenaarId || null, t.eigenaarNaam || null, t.createdBy || null, Date.now())
    .run();
  return id;
}

export async function setTaakStatus(h: CrmDb, id: string, status: "open" | "klaar"): Promise<void> {
  await h.db
    .prepare("UPDATE crm_taken SET status=?, done_at=? WHERE tenant_id=? AND id=?")
    .bind(status, status === "klaar" ? Date.now() : null, h.tenant, id)
    .run();
}

export async function deleteTaak(h: CrmDb, id: string): Promise<void> {
  await h.db.prepare("UPDATE crm_taken SET deleted_at=? WHERE tenant_id=? AND id=?").bind(Date.now(), h.tenant, id).run();
}

/* ===================== Deals (pipeline) ===================== */

function toDeal(r: Record<string, unknown>): Deal {
  const fase = String(r.fase ?? "lead");
  return {
    id: String(r.id),
    klant_id: String(r.klant_id),
    titel: String(r.titel ?? ""),
    waarde_cents: r.waarde_cents == null ? null : Number(r.waarde_cents),
    fase: (DEAL_FASES.some((f) => f.fase === fase) ? fase : "lead") as DealFase,
    notitie: r.notitie ? String(r.notitie) : undefined,
    eigenaar_id: r.eigenaar_id ? String(r.eigenaar_id) : undefined,
    eigenaar_naam: r.eigenaar_naam ? String(r.eigenaar_naam) : undefined,
    created_by: r.created_by ? String(r.created_by) : undefined,
    created_at: Number(r.created_at ?? 0),
    updated_at: Number(r.updated_at ?? 0),
  };
}

export async function listDeals(h: CrmDb, klantId?: string): Promise<Deal[]> {
  const sql = klantId
    ? "SELECT * FROM crm_deals WHERE tenant_id=? AND klant_id=? AND deleted_at IS NULL ORDER BY updated_at DESC"
    : "SELECT * FROM crm_deals WHERE tenant_id=? AND deleted_at IS NULL ORDER BY updated_at DESC";
  const stmt = klantId ? h.db.prepare(sql).bind(h.tenant, klantId) : h.db.prepare(sql).bind(h.tenant);
  const r = await stmt.all<Record<string, unknown>>();
  return (r.results ?? []).map(toDeal);
}

export async function getDeal(h: CrmDb, id: string): Promise<Deal | undefined> {
  const r = await h.db
    .prepare("SELECT * FROM crm_deals WHERE tenant_id=? AND id=? AND deleted_at IS NULL LIMIT 1")
    .bind(h.tenant, id)
    .first<Record<string, unknown>>();
  return r ? toDeal(r) : undefined;
}

export async function createDeal(
  h: CrmDb,
  d: { klantId: string; titel: string; waardeCents?: number | null; fase: DealFase; notitie?: string; eigenaarId?: string; eigenaarNaam?: string; createdBy?: string },
): Promise<string> {
  const id = uid("cd");
  const nu = Date.now();
  await h.db
    .prepare(
      `INSERT INTO crm_deals (id, tenant_id, klant_id, titel, waarde_cents, fase, notitie, eigenaar_id, eigenaar_naam, created_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .bind(id, h.tenant, d.klantId, d.titel, d.waardeCents ?? null, d.fase, d.notitie || null, d.eigenaarId || null, d.eigenaarNaam || null, d.createdBy || null, nu, nu)
    .run();
  return id;
}

export async function updateDeal(
  h: CrmDb,
  id: string,
  d: { titel: string; waardeCents?: number | null; fase: DealFase; notitie?: string; eigenaarId?: string; eigenaarNaam?: string },
): Promise<void> {
  await h.db
    .prepare("UPDATE crm_deals SET titel=?, waarde_cents=?, fase=?, notitie=?, eigenaar_id=?, eigenaar_naam=?, updated_at=? WHERE tenant_id=? AND id=?")
    .bind(d.titel, d.waardeCents ?? null, d.fase, d.notitie || null, d.eigenaarId || null, d.eigenaarNaam || null, Date.now(), h.tenant, id)
    .run();
}

export async function deleteDeal(h: CrmDb, id: string): Promise<void> {
  await h.db.prepare("UPDATE crm_deals SET deleted_at=? WHERE tenant_id=? AND id=?").bind(Date.now(), h.tenant, id).run();
}
