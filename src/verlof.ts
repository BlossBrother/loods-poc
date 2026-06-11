// Verlofoverzicht (bron: Buddee HR). Aparte tabel `verlof`; de gewone agenda blijft schoon.
import type { Env } from "./airtable";

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1-database (DB) niet geconfigureerd.");
  return env.DB;
}

export interface VerlofRow {
  id: string;
  external_id: string | null;
  employee_email: string | null;
  employee_name: string;
  type: string | null;
  start_at: number;
  end_at: number;
  status: string | null;
  source: string;
  synced_at: number | null;
}

export type VerlofInput = Omit<VerlofRow, "id" | "source" | "synced_at">;

export async function getVerlofInRange(env: Env, from: number, to: number): Promise<VerlofRow[]> {
  const r = await db(env)
    .prepare("SELECT * FROM verlof WHERE start_at < ? AND end_at > ? ORDER BY employee_name ASC, start_at ASC")
    .bind(to, from)
    .all<VerlofRow>();
  return r.results ?? [];
}

// Idempotente sync: vervang alle Buddee-rijen door de verse set. Demo-rijen blijven ongemoeid.
export async function replaceBuddeeVerlof(env: Env, rows: VerlofInput[]): Promise<number> {
  const d = db(env);
  const now = Date.now();
  await d.prepare("DELETE FROM verlof WHERE source='buddee'").run();
  let n = 0;
  for (const v of rows) {
    await d
      .prepare(
        `INSERT INTO verlof (id,external_id,employee_email,employee_name,type,start_at,end_at,status,source,synced_at)
         VALUES (?,?,?,?,?,?,?,?, 'buddee', ?)`,
      )
      .bind("v" + crypto.randomUUID().replace(/-/g, ""), v.external_id, v.employee_email, v.employee_name, v.type, v.start_at, v.end_at, v.status, now)
      .run();
    n++;
  }
  return n;
}


export interface MedewerkerLite { naam: string; email: string; afdeling: string }

export async function getActiveMedewerkers(env: Env): Promise<MedewerkerLite[]> {
  const r = await db(env)
    .prepare("SELECT naam, email, afdeling FROM medewerkers WHERE actief=1 ORDER BY afdeling COLLATE NOCASE ASC, naam COLLATE NOCASE ASC")
    .all<{ naam: string; email: string; afdeling: string }>();
  return (r.results ?? []).map((x) => ({ naam: String(x.naam ?? ""), email: String(x.email ?? ""), afdeling: String(x.afdeling ?? "Overig") }));
}
