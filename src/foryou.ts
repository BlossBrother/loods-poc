// "Voor jou" — aggregeert wat er nieuw is sinds je laatste bezoek, per ingeschakelde module.
// Bron: de bestaande tabellen (nieuws/posts/polls/agenda/meldingen). Geen tracking van
// individueel gedrag; alleen een 'laatst gezien'-tijdstip per module per gebruiker.
import type { Env } from "./airtable";

export interface ForYouItem { id: string; title: string; subtitle: string; route: string; createdAt: number; }
export interface ForYouGroup { moduleKey: string; label: string; count: number; items: ForYouItem[]; }
export interface ForYou { totalNew: number; groups: ForYouGroup[]; }

const TENANT = "default";
const DEFAULT_WINDOW = 14 * 24 * 60 * 60 * 1000; // nieuwe gebruiker: kijk 14 dagen terug

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1 (DB) ontbreekt");
  return env.DB;
}

// created_at staat in deze codebase deels als ISO-string, deels als ms-getal. Normaliseer.
function toMs(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
  const p = Date.parse(String(v));
  return Number.isNaN(p) ? Number(v) || 0 : p;
}

export async function getSeen(env: Env, userId: string): Promise<Map<string, number>> {
  const m = new Map<string, number>();
  try {
    const r = await db(env).prepare("SELECT module_key, last_seen_at FROM user_module_seen WHERE user_id=?").bind(userId).all<{ module_key: string; last_seen_at: number }>();
    for (const row of r.results ?? []) m.set(String(row.module_key), Number(row.last_seen_at) || 0);
  } catch { /* tabel mist -> leeg */ }
  return m;
}

export async function touchSeen(env: Env, userId: string | undefined, moduleKey: string): Promise<void> {
  if (!userId) return;
  try {
    await db(env)
      .prepare("INSERT INTO user_module_seen (user_id, module_key, last_seen_at) VALUES (?, ?, ?) ON CONFLICT(user_id, module_key) DO UPDATE SET last_seen_at=excluded.last_seen_at")
      .bind(userId, moduleKey, Date.now())
      .run();
  } catch { /* negeer */ }
}

export async function buildForYou(env: Env, userId: string | undefined, enabled: Set<string>): Promise<ForYou> {
  const seen = userId ? await getSeen(env, userId) : new Map<string, number>();
  const since = (k: string) => seen.get(k) ?? Date.now() - DEFAULT_WINDOW;
  const groups: ForYouGroup[] = [];

  // Nieuws (hoort bij home, altijd meegeteld)
  try {
    const s = since("nieuws");
    const r = await db(env).prepare("SELECT id, titel, created_at FROM nieuws ORDER BY created_at DESC LIMIT 30").all<Record<string, unknown>>();
    const items = (r.results ?? [])
      .filter((x) => toMs(x.created_at) > s)
      .map((x) => ({ id: String(x.id), title: String(x.titel || "Nieuwsbericht"), subtitle: "Nieuw bericht", route: "/#nieuws-" + x.id, createdAt: toMs(x.created_at) }));
    if (items.length) groups.push({ moduleKey: "nieuws", label: "Nieuws", count: items.length, items: items.slice(0, 6) });
  } catch { /* skip */ }

  // Prikbord: berichten + peilingen
  if (enabled.has("prikbord")) {
    try {
      const s = since("prikbord");
      // v188: soft-deleted items niet meer meetellen (bleven anders op home staan).
      const rp = await db(env).prepare("SELECT id, bericht, created_at FROM posts WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 30").all<Record<string, unknown>>();
      const rq = await db(env).prepare("SELECT id, vraag, created_at FROM polls WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 30").all<Record<string, unknown>>();
      const items = [
        ...(rp.results ?? []).filter((x) => toMs(x.created_at) > s).map((x) => ({ id: String(x.id), title: (String(x.bericht || "Bericht").slice(0, 70) || "Bericht"), subtitle: "Nieuw bericht", route: "/social", createdAt: toMs(x.created_at) })),
        ...(rq.results ?? []).filter((x) => toMs(x.created_at) > s).map((x) => ({ id: String(x.id), title: String(x.vraag || "Peiling"), subtitle: "Peiling", route: "/social", createdAt: toMs(x.created_at) })),
      ].sort((a, b) => b.createdAt - a.createdAt);
      if (items.length) groups.push({ moduleKey: "prikbord", label: "Prikbord", count: items.length, items: items.slice(0, 6) });
    } catch { /* skip */ }
  }

  // Agenda: nieuw toegevoegde, nog komende events
  if (enabled.has("agenda")) {
    try {
      const s = since("agenda");
      const now = Date.now();
      // v188: verwijderde (soft-deleted) events horen niet in "Voor jou"/home.
      const r = await db(env).prepare("SELECT id, title, start_at, created_at FROM agenda_events WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 40").all<Record<string, unknown>>();
      const items = (r.results ?? [])
        .filter((x) => toMs(x.created_at) > s && toMs(x.start_at) >= now)
        .map((x) => ({ id: String(x.id), title: String(x.title || "Agendapunt"), subtitle: "Nieuw in agenda", route: "/agenda/event/" + x.id, createdAt: toMs(x.created_at) }));
      if (items.length) groups.push({ moduleKey: "agenda", label: "Agenda", count: items.length, items: items.slice(0, 6) });
    } catch { /* skip */ }
  }

  // Meldingen: nieuwe open meldingen
  if (enabled.has("meldingen")) {
    try {
      const s = since("meldingen");
      const r = await db(env).prepare("SELECT id, titel, created_at FROM meldingen WHERE tenant_id=? AND status='open' ORDER BY created_at DESC LIMIT 30").bind(TENANT).all<Record<string, unknown>>();
      const items = (r.results ?? [])
        .filter((x) => toMs(x.created_at) > s)
        .map((x) => ({ id: String(x.id), title: String(x.titel || "Melding"), subtitle: "Open melding", route: "/meldingen", createdAt: toMs(x.created_at) }));
      if (items.length) groups.push({ moduleKey: "meldingen", label: "Meldingen", count: items.length, items: items.slice(0, 6) });
    } catch { /* skip */ }
  }

  const totalNew = groups.reduce((a, g) => a + g.count, 0);
  return { totalNew, groups };
}

export function groet(): string {
  const hour = Number(new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", hour: "2-digit", hour12: false }).format(new Date()));
  return hour < 6 ? "Goedenacht" : hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";
}
