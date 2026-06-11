// Meldingen-module: voorraad-tekorten & defecten. Tenant-scoped van opzet.
// Ontvangers per categorie (wie de wekelijkse samenvatting krijgt) staan in
// app_settings, key 'melding_ontvangers_<type>' = JSON-array van player-ids.
import type { Env } from "./airtable";

export type MeldingType = "voorraad" | "defect";
export const MELDING_TYPES: { type: MeldingType; label: string }[] = [
  { type: "voorraad", label: "Voorraad" },
  { type: "defect", label: "Defect" },
];

export interface Melding {
  id: string;
  type: MeldingType;
  titel: string;
  omschrijving?: string;
  locatie?: string;
  gemeld_door?: string;
  gemeld_naam?: string;
  status: "open" | "afgehandeld" | "gearchiveerd";
  created_at: number;
  resolved_at?: number | null;
}

const TENANT = "default";

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1-database (DB) niet geconfigureerd.");
  return env.DB;
}

export async function createMelding(
  env: Env,
  m: { type: MeldingType; titel: string; omschrijving?: string; locatie?: string; gemeldDoor?: string; gemeldNaam?: string },
): Promise<void> {
  await db(env)
    .prepare(
      `INSERT INTO meldingen (id, tenant_id, type, titel, omschrijving, locatie, gemeld_door, gemeld_naam, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`,
    )
    .bind(
      "ml" + crypto.randomUUID().replace(/-/g, ""),
      TENANT,
      m.type,
      m.titel,
      m.omschrijving || null,
      m.locatie || null,
      m.gemeldDoor || null,
      m.gemeldNaam || null,
      Date.now(),
    )
    .run();
}

export async function listMeldingen(
  env: Env,
  status?: "open" | "afgehandeld",
  type?: MeldingType,
): Promise<Melding[]> {
  let sql = "SELECT * FROM meldingen WHERE tenant_id=?";
  const binds: unknown[] = [TENANT];
  if (status) { sql += " AND status=?"; binds.push(status); }
  if (type) { sql += " AND type=?"; binds.push(type); }
  sql += " ORDER BY created_at DESC";
  const r = await db(env).prepare(sql).bind(...binds).all<Melding>();
  return r.results ?? [];
}

export async function opschoonMeldingen(env: Env, dagen: number): Promise<number> {
  const grens = Date.now() - dagen * 24 * 60 * 60 * 1000;
  const r = await db(env)
    .prepare("DELETE FROM meldingen WHERE tenant_id=? AND status IN ('afgehandeld','gearchiveerd') AND resolved_at IS NOT NULL AND resolved_at < ?")
    .bind(TENANT, grens)
    .run();
  return r.meta?.changes ?? 0;
}

export async function deleteMelding(env: Env, id: string): Promise<void> {
  await db(env).prepare("DELETE FROM meldingen WHERE tenant_id=? AND id=?").bind(TENANT, id).run();
}

// AVG: niet hard verwijderen maar archiveren. De melding verdwijnt uit de open-lijst,
// maar blijft (met resolved_at) bewaard tot de retentie-cron 'm na RETENTIE_DAGEN opruimt.
export async function archiveMelding(env: Env, id: string): Promise<void> {
  await db(env)
    .prepare("UPDATE meldingen SET status='gearchiveerd', resolved_at=COALESCE(resolved_at, ?) WHERE tenant_id=? AND id=?")
    .bind(Date.now(), TENANT, id)
    .run();
}

export async function getMelding(env: Env, id: string): Promise<Melding | undefined> {
  const r = await db(env).prepare("SELECT * FROM meldingen WHERE tenant_id=? AND id=?").bind(TENANT, id).first<Melding>();
  return r ?? undefined;
}

export async function setMeldingStatus(
  env: Env,
  id: string,
  status: "open" | "afgehandeld",
): Promise<void> {
  await db(env)
    .prepare("UPDATE meldingen SET status=?, resolved_at=? WHERE tenant_id=? AND id=?")
    .bind(status, status === "afgehandeld" ? Date.now() : null, TENANT, id)
    .run();
}

// ---- Ontvangers per categorie (app_settings) ----
function key(type: MeldingType): string {
  return "melding_ontvangers_" + type;
}

export async function getOntvangers(env: Env, type: MeldingType): Promise<string[]> {
  try {
    const row = await db(env)
      .prepare("SELECT value FROM app_settings WHERE tenant_id=? AND key=?")
      .bind(TENANT, key(type))
      .first<{ value: string }>();
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function setOntvangers(env: Env, type: MeldingType, ids: string[]): Promise<void> {
  await db(env)
    .prepare(
      `INSERT INTO app_settings (tenant_id, key, value, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(tenant_id, key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`,
    )
    .bind(TENANT, key(type), JSON.stringify(ids), Date.now())
    .run();
}
