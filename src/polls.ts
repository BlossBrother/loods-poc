// Polls/peilingen op het prikbord. Stemmen worden geaggregeerd getoond (AVG-lijn:
// geen publieke "wie stemde wat"). Eén stem per persoon, of meerkeuze.
import type { Env } from "./airtable";

export interface Poll {
  id: string;
  vraag: string;
  opties: string[];
  multi: boolean;
  maker_id?: string;
  maker_naam?: string;
  status: "open" | "gesloten";
  created_at: number;
  closes_at?: number | null;
}

export interface PollStem {
  poll_id: string;
  optie: number;
  stemmer_id: string;
}

const TENANT = "default";

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1-database (DB) niet geconfigureerd.");
  return env.DB;
}

function mapPoll(r: Record<string, unknown>): Poll {
  let opties: string[] = [];
  try { const p = JSON.parse(String(r.opties ?? "[]")); if (Array.isArray(p)) opties = p.map(String); } catch { /* leeg */ }
  return {
    id: String(r.id),
    vraag: String(r.vraag ?? ""),
    opties,
    multi: Number(r.multi ?? 0) === 1,
    maker_id: r.maker_id ? String(r.maker_id) : undefined,
    maker_naam: r.maker_naam ? String(r.maker_naam) : undefined,
    status: String(r.status ?? "open") === "gesloten" ? "gesloten" : "open",
    created_at: Number(r.created_at ?? 0),
    closes_at: r.closes_at != null ? Number(r.closes_at) : null,
  };
}

export async function createPoll(
  env: Env,
  p: { vraag: string; opties: string[]; multi: boolean; makerId?: string; makerNaam?: string; closesAt?: number | null },
  idem?: string | null,
): Promise<string> {
  const id = idem ?? "pl" + crypto.randomUUID().replace(/-/g, "");
  await db(env)
    .prepare(
      `INSERT INTO polls (id, tenant_id, vraag, opties, multi, maker_id, maker_naam, status, created_at, closes_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?) ON CONFLICT(id) DO NOTHING`,
    )
    .bind(id, TENANT, p.vraag, JSON.stringify(p.opties), p.multi ? 1 : 0, p.makerId ?? null, p.makerNaam ?? null, Date.now(), p.closesAt ?? null)
    .run();
  return id;
}

export async function listPolls(env: Env): Promise<Poll[]> {
  const r = await db(env).prepare("SELECT * FROM polls WHERE tenant_id=? AND deleted_at IS NULL ORDER BY created_at DESC").bind(TENANT).all<Record<string, unknown>>();
  return (r.results ?? []).map(mapPoll);
}

export async function getPoll(env: Env, id: string): Promise<Poll | undefined> {
  const r = await db(env).prepare("SELECT * FROM polls WHERE tenant_id=? AND id=? AND deleted_at IS NULL").bind(TENANT, id).first<Record<string, unknown>>();
  return r ? mapPoll(r) : undefined;
}

// Soft delete (Stroom-plan 1.4): poll én stemmen blijven staan tot de cron na 30 dagen
// definitief opruimt; "Ongedaan maken" zet deleted_at terug en alles is exact als ervoor.
export async function deletePoll(env: Env, id: string): Promise<void> {
  await db(env).prepare("UPDATE polls SET deleted_at=? WHERE tenant_id=? AND id=?").bind(Date.now(), TENANT, id).run();
}
export async function restorePoll(env: Env, id: string): Promise<void> {
  await db(env).prepare("UPDATE polls SET deleted_at=NULL WHERE tenant_id=? AND id=?").bind(TENANT, id).run();
}

export async function closePoll(env: Env, id: string): Promise<void> {
  await db(env).prepare("UPDATE polls SET status='gesloten' WHERE tenant_id=? AND id=?").bind(TENANT, id).run();
}

// Alle stemmen (voor de lijst, in één query) of per poll.
export async function getAlleStemmen(env: Env): Promise<PollStem[]> {
  const r = await db(env).prepare("SELECT poll_id, optie, stemmer_id FROM poll_stemmen").all<PollStem>();
  return r.results ?? [];
}

export async function getStemmen(env: Env, pollId: string): Promise<PollStem[]> {
  const r = await db(env).prepare("SELECT poll_id, optie, stemmer_id FROM poll_stemmen WHERE poll_id=?").bind(pollId).all<PollStem>();
  return r.results ?? [];
}

// Stem uitbrengen/wijzigen. Bij één-keuze vervangt de nieuwe keuze de oude; nogmaals
// op dezelfde optie = intrekken. Bij meerkeuze togglet elke optie los.
export async function vote(env: Env, poll: Poll, optie: number, stemmerId: string, idem?: string | null): Promise<void> {
  if (optie < 0 || optie >= poll.opties.length) return;
  const bestaand = await db(env)
    .prepare("SELECT id, optie FROM poll_stemmen WHERE poll_id=? AND stemmer_id=?")
    .bind(poll.id, stemmerId)
    .all<{ id: string; optie: number }>();
  const rows = bestaand.results ?? [];
  // Idempotent (1.1): een replay van precies dit verzoek (zelfde idem-id) mag de
  // toggle niet terugdraaien — de stem met dit id staat er al, dus klaar.
  if (idem && rows.some((r) => r.id === idem)) return;
  const opDezeOptie = rows.find((r) => Number(r.optie) === optie);
  if (poll.multi) {
    if (opDezeOptie) {
      await db(env).prepare("DELETE FROM poll_stemmen WHERE id=?").bind(opDezeOptie.id).run();
    } else {
      await insertStem(env, poll.id, optie, stemmerId, idem);
    }
  } else {
    // één keuze: alles van deze stemmer wissen, dan (indien nieuwe optie) toevoegen
    await db(env).prepare("DELETE FROM poll_stemmen WHERE poll_id=? AND stemmer_id=?").bind(poll.id, stemmerId).run();
    if (!opDezeOptie) await insertStem(env, poll.id, optie, stemmerId, idem);
  }
}

async function insertStem(env: Env, pollId: string, optie: number, stemmerId: string, idem?: string | null): Promise<void> {
  await db(env)
    .prepare("INSERT INTO poll_stemmen (id, poll_id, optie, stemmer_id, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING")
    .bind(idem ?? "ps" + crypto.randomUUID().replace(/-/g, ""), pollId, optie, stemmerId, Date.now())
    .run();
}

// Aggregeer stemmen -> counts per optie, totaal stemmers en de keuzes van 'meId'.
export function tally(poll: Poll, stemmen: PollStem[], meId?: string): { counts: number[]; total: number; mine: number[] } {
  const counts = new Array(poll.opties.length).fill(0) as number[];
  const voters = new Set<string>();
  const mine: number[] = [];
  for (const st of stemmen) {
    const i = Number(st.optie);
    if (i >= 0 && i < counts.length) counts[i]++;
    voters.add(st.stemmer_id);
    if (meId && st.stemmer_id === meId) mine.push(i);
  }
  return { counts, total: voters.size, mine };
}
