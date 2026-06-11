// Noodmelding / BHV: alarmknop die direct een push naar de aangewezen BHV'ers stuurt.
// GEEN vervanging van 112. Ontvangers staan in app_settings (key 'bhv_ontvangers').
import type { Env } from "./airtable";

export interface Noodmelding {
  id: string;
  melder_id?: string;
  melder_naam?: string;
  locatie?: string;
  created_at: number;
}

const TENANT = "default";

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1-database (DB) niet geconfigureerd.");
  return env.DB;
}

export async function createNoodmelding(
  env: Env,
  m: { melderId?: string; melderNaam?: string; locatie?: string },
): Promise<void> {
  await db(env)
    .prepare(
      "INSERT INTO noodmeldingen (id, tenant_id, melder_id, melder_naam, locatie, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(
      "nm" + crypto.randomUUID().replace(/-/g, ""),
      TENANT,
      m.melderId || null,
      m.melderNaam || null,
      m.locatie || null,
      Date.now(),
    )
    .run();
}

export async function listNoodmeldingen(env: Env, limit = 25): Promise<Noodmelding[]> {
  const r = await db(env)
    .prepare("SELECT * FROM noodmeldingen WHERE tenant_id=? ORDER BY created_at DESC LIMIT ?")
    .bind(TENANT, limit)
    .all<Noodmelding>();
  return r.results ?? [];
}

export async function deleteNoodmelding(env: Env, id: string): Promise<void> {
  await db(env).prepare("DELETE FROM noodmeldingen WHERE tenant_id=? AND id=?").bind(TENANT, id).run();
}

export async function clearNoodmeldingen(env: Env): Promise<void> {
  await db(env).prepare("DELETE FROM noodmeldingen WHERE tenant_id=?").bind(TENANT).run();
}

export async function getBhvOntvangers(env: Env): Promise<string[]> {
  try {
    const row = await db(env)
      .prepare("SELECT value FROM app_settings WHERE tenant_id=? AND key='bhv_ontvangers'")
      .bind(TENANT)
      .first<{ value: string }>();
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function setBhvOntvangers(env: Env, ids: string[]): Promise<void> {
  await db(env)
    .prepare(
      `INSERT INTO app_settings (tenant_id, key, value, updated_at) VALUES (?, 'bhv_ontvangers', ?, ?)
       ON CONFLICT(tenant_id, key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`,
    )
    .bind(TENANT, JSON.stringify(ids), Date.now())
    .run();
}
