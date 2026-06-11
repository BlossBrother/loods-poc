// Notificatiecentrum (Stroom-plan 4.2). Eén centrale notify-flow:
//   notifyAlle() -> historie-rij per medewerker (notificaties-tabel) + web push per
//   gebruiker (met badge_count = diens unread-stand, zodat het app-icoon meteen klopt),
//   met respect voor per-module voorkeuren (push_prefs; standaard AAN).
// Het scherm /notificaties toont de historie (read/unread) en de voorkeuren.
import type { Env } from "./airtable";

export interface NotifInput { module: string; titel: string; body?: string; url?: string }
export interface NotifRij { id: string; module: string; titel: string; body: string | null; url: string | null; created_at: number; read_at: number | null }

const TENANT = "default";

// Modules waarvoor meldingen bestaan (toggles in het centrum).
export const NOTIF_MODULES: { key: string; label: string }[] = [
  { key: "agenda", label: "Agenda (nieuwe events)" },
  { key: "nieuws", label: "Nieuws" },
  { key: "prikbord", label: "Prikbord" },
  { key: "meldingen", label: "Meldingen (weekoverzicht)" },
];

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1 (DB) ontbreekt");
  return env.DB;
}
const nid = () => "nt" + crypto.randomUUID().replace(/-/g, "");

export async function getPrefs(env: Env, email: string): Promise<Record<string, boolean>> {
  const uit: Record<string, boolean> = {};
  for (const m of NOTIF_MODULES) uit[m.key] = true; // standaard aan
  try {
    const r = await db(env).prepare("SELECT module, enabled FROM push_prefs WHERE user_email=?").bind(email.toLowerCase()).all<{ module: string; enabled: number }>();
    for (const row of r.results ?? []) uit[row.module] = Number(row.enabled) !== 0;
  } catch { /* tabel mist -> defaults */ }
  return uit;
}

export async function setPref(env: Env, email: string, module: string, enabled: boolean): Promise<void> {
  await db(env)
    .prepare("INSERT INTO push_prefs (user_email, module, enabled) VALUES (?, ?, ?) ON CONFLICT(user_email, module) DO UPDATE SET enabled=excluded.enabled")
    .bind(email.toLowerCase(), module, enabled ? 1 : 0)
    .run();
}

export async function unreadCount(env: Env, email: string): Promise<number> {
  try {
    const r = await db(env).prepare("SELECT COUNT(*) AS n FROM notificaties WHERE tenant_id=? AND user_email=? AND read_at IS NULL").bind(TENANT, email.toLowerCase()).first<{ n: number }>();
    return Number(r?.n ?? 0);
  } catch { return 0; }
}

export async function listNotificaties(env: Env, email: string, limit = 50): Promise<NotifRij[]> {
  const r = await db(env)
    .prepare("SELECT id, module, titel, body, url, created_at, read_at FROM notificaties WHERE tenant_id=? AND user_email=? ORDER BY created_at DESC LIMIT ?")
    .bind(TENANT, email.toLowerCase(), limit)
    .all<NotifRij>();
  return r.results ?? [];
}

export async function getNotificatie(env: Env, email: string, id: string): Promise<NotifRij | undefined> {
  const r = await db(env)
    .prepare("SELECT id, module, titel, body, url, created_at, read_at FROM notificaties WHERE tenant_id=? AND user_email=? AND id=?")
    .bind(TENANT, email.toLowerCase(), id)
    .first<NotifRij>();
  return r ?? undefined;
}

export async function markRead(env: Env, email: string, id?: string | null): Promise<void> {
  if (id) {
    await db(env).prepare("UPDATE notificaties SET read_at=? WHERE tenant_id=? AND user_email=? AND id=?").bind(Date.now(), TENANT, email.toLowerCase(), id).run();
  } else {
    await db(env).prepare("UPDATE notificaties SET read_at=? WHERE tenant_id=? AND user_email=? AND read_at IS NULL").bind(Date.now(), TENANT, email.toLowerCase()).run();
  }
}

// Centrale flow: historie + push voor alle actieve medewerkers met deze module aan.
// pushEmail: levert per gebruiker af (krijgt badge_count mee); pushAnoniem: optioneel
// voor apparaten die zich zonder e-mail abonneerden (krijgen geen historie/badge).
export async function notifyAlle(
  env: Env,
  n: NotifInput,
  ontvangers: string[],
  pushEmail: (email: string, payload: { title: string; body: string; url: string; badge_count?: number }) => Promise<number>,
  pushAnoniem?: (payload: { title: string; body: string; url: string }) => Promise<void>,
): Promise<void> {
  const nu = Date.now();
  const payloadBasis = { title: n.titel, body: n.body ?? "", url: n.url ?? "/" };
  const d = db(env);
  // Voorkeuren in één query voor alle ontvangers.
  const uit = new Set<string>();
  try {
    const r = await d.prepare("SELECT user_email FROM push_prefs WHERE module=? AND enabled=0").bind(n.module).all<{ user_email: string }>();
    for (const row of r.results ?? []) uit.add(row.user_email.toLowerCase());
  } catch { /* defaults: alles aan */ }
  const doel = ontvangers.map((e) => e.toLowerCase()).filter((e) => e && !uit.has(e));
  // Historie-rijen in batches.
  for (let i = 0; i < doel.length; i += 40) {
    const chunk = doel.slice(i, i + 40).map((email) =>
      d.prepare("INSERT INTO notificaties (id, tenant_id, user_email, module, titel, body, url, created_at) VALUES (?,?,?,?,?,?,?,?)")
        .bind(nid(), TENANT, email, n.module, n.titel, n.body ?? null, n.url ?? null, nu),
    );
    try { await d.batch(chunk); } catch { /* tabel mist -> alleen pushen */ }
  }
  // Push per gebruiker met diens actuele unread-stand als badge.
  await Promise.all(doel.map(async (email) => {
    try {
      const badge = await unreadCount(env, email);
      await pushEmail(email, { ...payloadBasis, badge_count: badge });
    } catch (e) { console.error("notify-push faalde:", e); }
  }));
  if (pushAnoniem) { try { await pushAnoniem(payloadBasis); } catch { /* best effort */ } }
}

// AVG: notificatie-historie ouder dan 90 dagen opruimen (cron).
export async function purgeNotificaties(env: Env): Promise<void> {
  await db(env).prepare("DELETE FROM notificaties WHERE created_at < ?").bind(Date.now() - 90 * 24 * 60 * 60 * 1000).run();
}
