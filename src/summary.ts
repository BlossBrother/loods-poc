// Home-dashboard (Stroom-plan 3.2): status per ingeschakelde module in ÉÉN
// D1-roundtrip (db.batch): counts, deadlines en highlights. Dezelfde data wordt
// servergerenderd op home (tegels met ondertitel) en is als JSON beschikbaar op
// GET /api/home/summary — één bron, dus altijd consistent met de header-tellers.
import type { Env } from "./airtable";

// `leeg` = niets actueels te melden; home verbergt zulke tegels (opruimslag).
export interface ModuleStatus { key: string; label: string; href: string; icon: string; status: string; leeg?: boolean }

const DAG = 24 * 60 * 60 * 1000;
const TENANT = "default";

function fmtDag(ms: number): string {
  const d = new Date(ms);
  const dagen = ["zo", "ma", "di", "wo", "do", "vr", "za"];
  return `${dagen[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function homeSummary(env: Env, enabled: string[]): Promise<ModuleStatus[]> {
  if (!env.DB) return [];
  const nu = Date.now();
  const isoDag = new Date(nu - DAG).toISOString();
  const week = nu + 7 * DAG;
  const w7 = nu - 7 * DAG;
  // Elke statement is goedkoop (COUNT/LIMIT 1); samen één roundtrip.
  const stmts = [
    env.DB.prepare("SELECT COUNT(*) AS n FROM agenda_events WHERE deleted_at IS NULL AND start_at>=? AND start_at<?").bind(nu, week),
    env.DB.prepare("SELECT id, title, start_at FROM agenda_events WHERE deleted_at IS NULL AND start_at>=? ORDER BY start_at ASC LIMIT 1").bind(nu),
    env.DB.prepare("SELECT COUNT(*) AS n FROM posts WHERE deleted_at IS NULL AND created_at>=?").bind(isoDag),
    env.DB.prepare("SELECT COUNT(*) AS n FROM polls WHERE tenant_id=? AND deleted_at IS NULL AND status='open'").bind(TENANT),
    env.DB.prepare("SELECT COUNT(*) AS n FROM matches WHERE deleted_at IS NULL AND played_at>=?").bind(w7),
    env.DB.prepare("SELECT COUNT(*) AS n FROM meldingen WHERE tenant_id=? AND status='open'").bind(TENANT),
    env.DB.prepare("SELECT value FROM app_settings WHERE tenant_id=? AND key='bestellijst_open'").bind(TENANT),
    env.DB.prepare("SELECT COUNT(*) AS n FROM courses WHERE tenant_id=? AND published=1").bind(TENANT),
  ];
  let r: { results?: Record<string, unknown>[] }[] = [];
  try { r = await env.DB.batch(stmts); } catch { return []; }
  const n = (i: number) => Number((r[i]?.results?.[0] as { n?: number } | undefined)?.n ?? 0);

  const agendaWeek = n(0);
  const volgend = (r[1]?.results?.[0] ?? null) as { id?: string; title?: string; start_at?: number } | null;
  const postsDag = n(2), pollsOpen = n(3), potten7 = n(4), meldOpen = n(5);
  const lijstWaarde = (r[6]?.results?.[0] as { value?: string } | undefined)?.value;
  const bestellijstOpen = lijstWaarde === undefined ? true : String(lijstWaarde) !== "0";
  const cursussen = n(7);

  const alles: ModuleStatus[] = [
    {
      // Met een eerstvolgend event deeplinkt de tegel naar dat event (anders naar de agenda).
      key: "agenda", label: "Agenda", href: volgend?.id ? `/agenda/event/${volgend.id}` : "/agenda", icon: "agenda",
      status: volgend?.title
        ? `Eerstvolgend: ${String(volgend.title)} (${fmtDag(Number(volgend.start_at))})`
        : agendaWeek > 0 ? `${agendaWeek} events deze week` : "Geen events gepland",
      leeg: !volgend?.title && agendaWeek === 0,
    },
    {
      key: "prikbord", label: "Prikbord", href: "/social", icon: "board",
      status: (postsDag === 0 ? "Niets nieuws vandaag" : postsDag === 1 ? "1 nieuw bericht vandaag" : `${postsDag} nieuwe berichten vandaag`)
        + (pollsOpen > 0 ? ` · ${pollsOpen} open ${pollsOpen === 1 ? "peiling" : "peilingen"}` : ""),
      leeg: postsDag === 0 && pollsOpen === 0,
    },
    {
      key: "competitie", label: "Competitie", href: "/competitie", icon: "trophy",
      status: potten7 === 0 ? "Nog geen potten deze week" : potten7 === 1 ? "1 pot deze week" : `${potten7} potten deze week`,
      leeg: potten7 === 0,
    },
    {
      key: "kantine", label: "Kantine", href: "/friet", icon: "fries",
      status: bestellijstOpen ? "Bestellijst is open" : "Bestellijst is gesloten",
      leeg: !bestellijstOpen,
    },
    {
      key: "meldingen", label: "Meldingen", href: "/meldingen", icon: "alert",
      status: meldOpen === 0 ? "Geen open meldingen" : meldOpen === 1 ? "1 open melding" : `${meldOpen} open meldingen`,
      leeg: meldOpen === 0,
    },
    {
      key: "trainingen", label: "Trainingen", href: "/trainingen", icon: "book",
      status: cursussen === 0 ? "Nog geen trainingen" : cursussen === 1 ? "1 training beschikbaar" : `${cursussen} trainingen beschikbaar`,
      leeg: cursussen === 0,
    },
  ];

  // CRM (ADR-001): eigen batch + try/catch, zodat een nog niet uitgevoerde
  // migratie 0018 de overige home-tegels niet meesleept.
  if (enabled.includes("crm")) {
    try {
      const cr = await env.DB.batch([
        env.DB.prepare("SELECT COUNT(*) AS n FROM crm_taken WHERE tenant_id=? AND status='open' AND deleted_at IS NULL").bind(TENANT),
        env.DB.prepare("SELECT COUNT(*) AS n FROM crm_deals WHERE tenant_id=? AND fase NOT IN ('gewonnen','verloren') AND deleted_at IS NULL").bind(TENANT),
      ]);
      const cn = (i: number) => Number((cr[i]?.results?.[0] as { n?: number } | undefined)?.n ?? 0);
      const takenOpen = cn(0), dealsOpen = cn(1);
      alles.push({
        key: "crm", label: "CRM", href: "/crm", icon: "briefcase",
        status: `${takenOpen} open ta${takenOpen === 1 ? "ak" : "ken"} · ${dealsOpen} open deal${dealsOpen === 1 ? "" : "s"}`,
        leeg: takenOpen === 0 && dealsOpen === 0,
      });
    } catch { /* migratie 0018 nog niet gedraaid — tegel weglaten */ }
  }
  return alles.filter((m) => enabled.includes(m.key));
}

/* ---- Activity feed (Stroom-plan 4.3): "laatste activiteit" gemengd over modules. ----
   Bewuste afwijking van een aparte events-tabel: de bronmodules bevatten de data al;
   één db.batch met recente posts/peilingen/potten/events voorkomt duplicatie. */
export interface FeedItem { icon: string; tekst: string; route: string; t: number }

function isoMs(v: unknown): number {
  if (typeof v === "number") return v;
  const p = Date.parse(String(v ?? ""));
  return Number.isNaN(p) ? 0 : p;
}

export async function activityFeed(env: Env, limit = 10): Promise<FeedItem[]> {
  if (!env.DB) return [];
  const stmts = [
    env.DB.prepare("SELECT p.id, p.created_at, m.naam FROM posts p LEFT JOIN medewerkers m ON m.id=p.auteur_id WHERE p.deleted_at IS NULL ORDER BY p.created_at DESC LIMIT 6"),
    env.DB.prepare("SELECT id, vraag, maker_naam, created_at FROM polls WHERE tenant_id='default' AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 4"),
    env.DB.prepare("SELECT x.id, x.game_type, x.played_at, x.winner, x.player_a, a.naam AS naam_a, b.naam AS naam_b FROM matches x JOIN medewerkers a ON a.id=x.player_a JOIN medewerkers b ON b.id=x.player_b WHERE x.deleted_at IS NULL ORDER BY x.played_at DESC LIMIT 6"),
    env.DB.prepare("SELECT id, title, created_at FROM agenda_events WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 4"),
  ];
  let r: { results?: Record<string, unknown>[] }[] = [];
  try { r = await env.DB.batch(stmts); } catch { return []; }
  const items: FeedItem[] = [];
  for (const p of r[0]?.results ?? []) {
    items.push({ icon: "board", tekst: `${String(p.naam ?? "Iemand")} plaatste een bericht`, route: `/social#post-${p.id}`, t: isoMs(p.created_at) });
  }
  for (const q of r[1]?.results ?? []) {
    items.push({ icon: "board", tekst: `Peiling: ${String(q.vraag ?? "")}`.slice(0, 70), route: `/social#poll-${q.id}`, t: Number(q.created_at) || 0 });
  }
  for (const m of r[2]?.results ?? []) {
    const winNaam = String(m.winner) === String(m.player_a) ? String(m.naam_a) : String(m.naam_b);
    const verlNaam = String(m.winner) === String(m.player_a) ? String(m.naam_b) : String(m.naam_a);
    items.push({ icon: "trophy", tekst: `${winNaam} won van ${verlNaam} (${String(m.game_type)})`, route: "/competitie?game=" + String(m.game_type), t: Number(m.played_at) || 0 });
  }
  for (const e of r[3]?.results ?? []) {
    items.push({ icon: "agenda", tekst: `Nieuw event: ${String(e.title ?? "")}`.slice(0, 70), route: `/agenda/event/${e.id}`, t: Number(e.created_at) || 0 });
  }
  return items.filter((x) => x.t > 0).sort((a, b) => b.t - a.t).slice(0, limit);
}
