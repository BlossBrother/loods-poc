// Gedeelde bedrijfsagenda. Events met epoch-ms. Buddee-verlof later via source/external_id.
import type { Env } from "./airtable";

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1-database (DB) niet geconfigureerd.");
  return env.DB;
}
function uid(): string {
  return "e" + crypto.randomUUID().replace(/-/g, "");
}

export interface AgendaEvent {
  id: string; title: string; description: string | null; location: string | null;
  category: string; start_at: number; end_at: number; all_day: number;
  source: string; external_id: string | null; created_by: string; created_at: number;
}

export async function getEventsInRange(env: Env, from: number, to: number): Promise<AgendaEvent[]> {
  const r = await db(env)
    .prepare("SELECT * FROM agenda_events WHERE start_at < ? AND end_at > ? AND deleted_at IS NULL ORDER BY start_at ASC")
    .bind(to, from)
    .all<AgendaEvent>();
  return r.results ?? [];
}
export async function getEvent(env: Env, id: string): Promise<AgendaEvent | undefined> {
  const r = await db(env).prepare("SELECT * FROM agenda_events WHERE id=? AND deleted_at IS NULL").bind(id).first<AgendaEvent>();
  return r ?? undefined;
}
// Idempotent (1.1): optioneel client-id; geeft terug of er écht een rij geschreven is
// (false = replay/duplicate -> caller slaat side-effects zoals push over).
export async function createEvent(
  env: Env,
  e: { title: string; description?: string; location?: string; category: string; start_at: number; end_at: number; all_day: boolean; created_by: string },
  id?: string | null,
): Promise<boolean> {
  const res = await db(env)
    .prepare(
      `INSERT INTO agenda_events (id,title,description,location,category,start_at,end_at,all_day,source,external_id,created_by,created_at)
       VALUES (?,?,?,?,?,?,?,?,'manual',NULL,?,?) ON CONFLICT(id) DO NOTHING`,
    )
    .bind(id ?? uid(), e.title, e.description || null, e.location || null, e.category, e.start_at, e.end_at, e.all_day ? 1 : 0, e.created_by, Date.now())
    .run();
  return ((res.meta as { changes?: number } | undefined)?.changes ?? 1) > 0;
}
export async function updateEvent(
  env: Env,
  id: string,
  e: { title: string; description?: string; location?: string; category: string; start_at: number; end_at: number; all_day: boolean },
): Promise<void> {
  await db(env)
    .prepare("UPDATE agenda_events SET title=?, description=?, location=?, category=?, start_at=?, end_at=?, all_day=? WHERE id=?")
    .bind(e.title, e.description || null, e.location || null, e.category, e.start_at, e.end_at, e.all_day ? 1 : 0, id)
    .run();
}
// Soft delete (Stroom-plan 1.4) + herstel voor "Ongedaan maken".
export async function deleteEvent(env: Env, id: string): Promise<void> {
  await db(env).prepare("UPDATE agenda_events SET deleted_at=? WHERE id=?").bind(Date.now(), id).run();
}
export async function restoreEvent(env: Env, id: string): Promise<void> {
  await db(env).prepare("UPDATE agenda_events SET deleted_at=NULL WHERE id=?").bind(id).run();
}
