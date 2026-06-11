// Leesbevestiging (spoor B1, v185): wie heeft welk nieuwsbericht of beleidsdocument
// gelezen. D1-tabel `leesbevestigingen` (migratie 0019). Bevestigen is idempotent
// per (doel, email); de beheerder ziet per doel het aantal + de namen.
import type { Env } from "./airtable";

const TENANT = "default";

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1-database (DB) niet geconfigureerd.");
  return env.DB;
}

export type LeesDoelType = "nieuws" | "document";

export async function bevestigGelezen(
  env: Env,
  doelType: LeesDoelType,
  doelId: string,
  email: string,
  naam: string | null,
): Promise<void> {
  await db(env)
    .prepare(
      `INSERT INTO leesbevestigingen (id, tenant_id, doel_type, doel_id, email, naam, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(tenant_id, doel_type, doel_id, email) DO NOTHING`,
    )
    .bind("lb" + crypto.randomUUID().replace(/-/g, ""), TENANT, doelType, doelId, email.toLowerCase(), naam, Date.now())
    .run();
}

// Welke doelen heeft déze gebruiker al bevestigd — voor de knop-staat ("✓ Gelezen").
// Keys in de set: "<doel_type>:<doel_id>".
export async function gelezenDoor(env: Env, email: string): Promise<Set<string>> {
  const r = await db(env)
    .prepare("SELECT doel_type, doel_id FROM leesbevestigingen WHERE tenant_id=? AND email=?")
    .bind(TENANT, email.toLowerCase())
    .all<{ doel_type: string; doel_id: string }>();
  return new Set((r.results ?? []).map((x) => `${x.doel_type}:${x.doel_id}`));
}

export interface LeesStat { aantal: number; namen: string[] }

// Beheeroverzicht: per doel ("type:id") het aantal bevestigingen + de namen
// (nieuwste eerst). Eén query; aggregatie in de Worker.
export async function leesOverzicht(env: Env): Promise<Map<string, LeesStat>> {
  const r = await db(env)
    .prepare("SELECT doel_type, doel_id, naam, email FROM leesbevestigingen WHERE tenant_id=? ORDER BY created_at DESC")
    .bind(TENANT)
    .all<{ doel_type: string; doel_id: string; naam: string | null; email: string }>();
  const out = new Map<string, LeesStat>();
  for (const x of r.results ?? []) {
    const k = `${x.doel_type}:${x.doel_id}`;
    const s = out.get(k) ?? { aantal: 0, namen: [] };
    s.aantal++;
    s.namen.push(x.naam || x.email);
    out.set(k, s);
  }
  return out;
}
