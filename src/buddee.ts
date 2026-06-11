// Buddee (HR) API-koppeling: haalt goedgekeurd verlof op en schrijft het naar D1 (tabel `verlof`).
// Auth (gedocumenteerd): Basic-Auth (e-mail:wachtwoord) POST /auth/token -> JWT access_token,
// daarna `Authorization: Bearer <token>` op elke request. Base-URL: https://api.buddee.nl
import type { Env } from "./airtable";
import { replaceBuddeeVerlof, type VerlofInput } from "./verlof";

const BASE = "https://api.buddee.nl";

async function accessToken(env: Env): Promise<string> {
  const email = env.BUDDEE_EMAIL, pw = env.BUDDEE_PASSWORD;
  if (!email || !pw) throw new Error("BUDDEE_EMAIL/BUDDEE_PASSWORD niet geconfigureerd (wrangler secret).");
  const basic = btoa(`${email}:${pw}`);
  const res = await fetch(`${BASE}/auth/token`, { method: "POST", headers: { Authorization: `Basic ${basic}` } });
  if (!res.ok) throw new Error(`Buddee /auth/token faalde (${res.status})`);
  const j = (await res.json()) as { access_token?: string };
  if (!j.access_token) throw new Error("Buddee /auth/token: geen access_token in response");
  return j.access_token;
}

async function apiGet(token: string, path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
  if (!res.ok) throw new Error(`Buddee GET ${path} faalde (${res.status})`);
  return res.json();
}

// Buddee-responses zijn vaak { data: [...] } of een kale array; pak beide.
function asArray(x: unknown): any[] {
  if (Array.isArray(x)) return x;
  if (x && typeof x === "object" && Array.isArray((x as any).data)) return (x as any).data;
  return [];
}

// Datum -> epoch-ms. Accepteert "2026-06-09" of ISO. Hele dag wordt dagstart/-eind.
function toMs(v: unknown, endOfDay = false): number | null {
  if (!v) return null;
  const s = String(v);
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(s);
  const iso = dateOnly ? `${s}T${endOfDay ? "23:59:59" : "00:00:00"}+02:00` : s;
  const t = Date.parse(iso);
  return isNaN(t) ? null : t;
}

// ---- VELD-MAPPING ----------------------------------------------------------
// LET OP: pas dit aan zodra we een echte /leave_registrations-response hebben.
// Nu defensief: probeert meerdere gangbare veldnamen. Verwacht per registratie:
// een medewerker-referentie (id of e-mail), start, eind, type en status.
function mapRegistration(reg: any, byId: Map<string, { email: string | null; name: string }>): VerlofInput | null {
  const empId = reg.employee_id ?? reg.employee?.id ?? reg.user_id ?? null;
  const emp = empId != null ? byId.get(String(empId)) : undefined;
  const email = reg.employee?.email ?? reg.email ?? emp?.email ?? null;
  const name = reg.employee?.full_name ?? reg.employee_name ?? emp?.name ?? email ?? "Onbekend";

  const start = toMs(reg.start_date ?? reg.from ?? reg.date_from ?? reg.start, false);
  const end = toMs(reg.end_date ?? reg.to ?? reg.date_to ?? reg.end ?? reg.start_date ?? reg.start, true);
  if (start == null || end == null) return null;

  const type = String(reg.leave_type?.name ?? reg.type?.name ?? reg.leave_type ?? reg.type ?? "verlof").toLowerCase();
  const status = String(reg.status?.name ?? reg.status ?? "").toLowerCase();

  return { external_id: reg.id != null ? String(reg.id) : null, employee_email: email, employee_name: name, type, start_at: start, end_at: end, status: status || null };
}

// Alleen goedgekeurd verlof overnemen. Pas de waarde aan op Buddee's status-benaming.
function isApproved(v: VerlofInput): boolean {
  const s = (v.status ?? "").toLowerCase();
  return s === "" || s.includes("approved") || s.includes("goedgekeurd") || s.includes("akkoord");
}

export async function syncVerlof(env: Env): Promise<{ count: number }> {
  const token = await accessToken(env);

  // medewerkers -> id -> {email, name} voor de koppeling
  const employees = asArray(await apiGet(token, "/employees?active=1"));
  const byId = new Map<string, { email: string | null; name: string }>();
  for (const e of employees) {
    const id = e.id ?? e.employee_id;
    if (id == null) continue;
    byId.set(String(id), { email: e.email ?? e.work_email ?? null, name: e.full_name ?? e.name ?? "Onbekend" });
  }

  // goedgekeurde verlofregistraties (TODO: exacte datum-/status-filter-syntax bevestigen)
  const regs = asArray(await apiGet(token, "/leave_registrations?status=approved"));
  const rows = regs.map((r) => mapRegistration(r, byId)).filter((v): v is VerlofInput => v != null && isApproved(v));

  const count = await replaceBuddeeVerlof(env, rows);
  return { count };
}
