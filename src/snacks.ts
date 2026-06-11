// Friet/Vis kantine. Ledger-model: saldo = SUM(amount_cents). Geen balanskolom.
import type { Env } from "./airtable";

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1-database (DB) niet geconfigureerd.");
  return env.DB;
}
function uid(p: string): string {
  return p + crypto.randomUUID().replace(/-/g, "");
}
export function euro(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const v = Math.abs(cents);
  return `${sign}€ ${(v / 100).toFixed(2).replace(".", ",")}`;
}

export interface MenuItem { id: string; name: string; price_cents: number; active: number; }

export async function getActiveMenu(env: Env): Promise<MenuItem[]> {
  const r = await db(env).prepare("SELECT * FROM snack_menu WHERE active=1 ORDER BY name").all<MenuItem>();
  return r.results ?? [];
}
export async function getAllMenu(env: Env): Promise<MenuItem[]> {
  const r = await db(env).prepare("SELECT * FROM snack_menu ORDER BY active DESC, name").all<MenuItem>();
  return r.results ?? [];
}
export async function addMenuItem(env: Env, name: string, priceCents: number): Promise<void> {
  await db(env).prepare("INSERT INTO snack_menu (id,name,price_cents,active) VALUES (?,?,?,1)").bind(uid("sm"), name, priceCents).run();
}
export async function updateMenuItem(env: Env, id: string, priceCents: number, active: boolean): Promise<void> {
  await db(env).prepare("UPDATE snack_menu SET price_cents=?, active=? WHERE id=?").bind(priceCents, active ? 1 : 0, id).run();
}

export async function getBalance(env: Env, playerId: string): Promise<number> {
  const r = await db(env).prepare("SELECT COALESCE(SUM(amount_cents),0) AS bal FROM snack_ledger WHERE player_id=?").bind(playerId).first<{ bal: number }>();
  return r?.bal ?? 0;
}

export interface LedgerRow { id: string; amount_cents: number; kind: string; description: string | null; created_at: number; }
export async function getLedger(env: Env, playerId: string, limit = 20): Promise<LedgerRow[]> {
  const r = await db(env).prepare("SELECT id, amount_cents, kind, description, created_at FROM snack_ledger WHERE player_id=? ORDER BY created_at DESC LIMIT ?").bind(playerId, limit).all<LedgerRow>();
  return r.results ?? [];
}

// Idempotent (1.1): optioneel client-id; zelfde id nogmaals -> ON CONFLICT no-op.
async function addLedger(env: Env, playerId: string, amount: number, kind: string, description: string, createdBy: string, id?: string | null): Promise<void> {
  await db(env).prepare("INSERT INTO snack_ledger (id, player_id, amount_cents, kind, description, created_by, created_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING").bind(id ?? uid("sl"), playerId, amount, kind, description, createdBy, Date.now()).run();
}

export async function addOrder(env: Env, playerId: string, items: { name: string; qty: number; price: number }[], createdBy: string, id?: string | null): Promise<number> {
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const desc = items.map((i) => `${i.qty}× ${i.name}`).join(", ");
  if (total > 0) await addLedger(env, playerId, -total, "order", desc, createdBy, id);
  return total;
}
export async function addTopup(env: Env, playerId: string, amountCents: number, createdBy: string, description = "Bijgeboekt (kas)"): Promise<void> {
  await addLedger(env, playerId, Math.abs(amountCents), "topup_cash", description, createdBy);
}
// Verrekenen: zet saldo terug naar 0 en logt het bedrag (historie blijft kloppen).
export async function settle(env: Env, playerId: string, createdBy: string): Promise<number> {
  const bal = await getBalance(env, playerId);
  if (bal !== 0) await addLedger(env, playerId, -bal, "settlement", `Verrekend (${euro(bal)})`, createdBy);
  return bal;
}

// Zet het saldo direct op een bedrag (ook negatief): boekt het verschil als correctie.
export async function setBalance(env: Env, playerId: string, targetCents: number, createdBy: string): Promise<void> {
  const cur = await getBalance(env, playerId);
  const delta = targetCents - cur;
  if (delta !== 0) await addLedger(env, playerId, delta, "correction", `Saldo gezet op ${euro(targetCents)}`, createdBy);
}

export interface OrderRow { naam: string; description: string | null; amount_cents: number; created_at: number; }
export async function ordersSince(env: Env, since: number): Promise<OrderRow[]> {
  const r = await db(env)
    .prepare(
      `SELECT m.naam AS naam, l.description, l.amount_cents, l.created_at
       FROM snack_ledger l JOIN medewerkers m ON m.id = l.player_id
       WHERE l.kind=\'order\' AND l.created_at >= ? ORDER BY l.created_at DESC`,
    )
    .bind(since)
    .all<OrderRow>();
  return r.results ?? [];
}

export interface Balance { player_id: string; naam: string; balance: number; }
export async function allBalances(env: Env): Promise<Balance[]> {
  const r = await db(env)
    .prepare(
      `SELECT m.id AS player_id, m.naam AS naam, COALESCE(SUM(l.amount_cents),0) AS balance
       FROM medewerkers m LEFT JOIN snack_ledger l ON l.player_id = m.id
       WHERE m.actief=1 GROUP BY m.id ORDER BY balance ASC, m.naam COLLATE NOCASE ASC`,
    )
    .all<Balance>();
  return r.results ?? [];
}
