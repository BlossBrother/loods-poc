// Bugmeldingen: tenant-scoped. Status open → in_behandeling → opgelost/afgewezen.
import type { Env } from "./airtable";

export interface Bugmelding {
  id: string; melder_id?: string; melder_naam?: string;
  titel: string; omschrijving?: string; screenshot_key?: string;
  categorie?: string | null;
  status: string; created_at: number; resolved_at?: number | null;
}
export const BUG_STATUS = ["open", "in_behandeling", "opgelost", "afgewezen"] as const;
// 4.4: feedback-categorieën (bug / idee / anders).
export const BUG_CATEGORIE = ["bug", "idee", "anders"] as const;
const TENANT = "default";
function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1 niet geconfigureerd."); return env.DB;
}
export async function createBug(
  env: Env, m: { melderId?: string; melderNaam?: string; titel: string; omschrijving?: string; screenshotKey?: string; categorie?: string },
): Promise<void> {
  await db(env).prepare(
    "INSERT INTO bugmeldingen (id, tenant_id, melder_id, melder_naam, titel, omschrijving, screenshot_key, categorie, status, created_at) VALUES (?,?,?,?,?,?,?,?, 'open', ?)",
  ).bind("bug" + crypto.randomUUID().replace(/-/g, ""), TENANT, m.melderId ?? null, m.melderNaam ?? null, m.titel, m.omschrijving ?? null, m.screenshotKey ?? null, m.categorie ?? "bug", Date.now()).run();
}
export async function listBugs(env: Env, limit = 100): Promise<Bugmelding[]> {
  const r = await db(env).prepare(
    "SELECT * FROM bugmeldingen WHERE tenant_id=? ORDER BY (status='open') DESC, created_at DESC LIMIT ?",
  ).bind(TENANT, limit).all<Bugmelding>();
  return r.results ?? [];
}
export async function setBugStatus(env: Env, id: string, status: string): Promise<void> {
  const done = status === "opgelost" || status === "afgewezen";
  await db(env).prepare("UPDATE bugmeldingen SET status=?, resolved_at=? WHERE tenant_id=? AND id=?")
    .bind(status, done ? Date.now() : null, TENANT, id).run();
}
export async function deleteBug(env: Env, id: string): Promise<void> {
  await db(env).prepare("DELETE FROM bugmeldingen WHERE tenant_id=? AND id=?").bind(TENANT, id).run();
}
