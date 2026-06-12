// Analytics-dashboard (v206): privacyvriendelijke, GEAGGREGEERDE cijfers voor
// Beheer — geen individuele tracking, alleen tellingen. Bronnen die al bestaan:
// user_module_seen (actief + module-populariteit), ask_log (assistent),
// posts/polls (prikbord), aanwezigheid_status (ochtendvraag), leesbevestigingen.
// Elke query defensief (try/catch): een missende tabel maakt het dashboard niet stuk.
import type { Env } from "./airtable";

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1-database (DB) niet geconfigureerd.");
  return env.DB;
}

export interface AnalyticsData {
  totaalActief: number;        // actieve medewerkers (noemer)
  dagActief: number;           // unieke gebruikers vandaag (user_module_seen)
  weekActief: number;          // unieke gebruikers 7 dagen
  vragen7d: number;            // assistent/vraagbaak-vragen
  vragenIntern7d: number;      // waarvan uit de kennisbank beantwoord
  posts7d: number;             // prikbord-posts (excl. verwijderd)
  polls7d: number;
  statusVandaag: number;       // "waar werk je vandaag"-antwoorden vandaag
  gezienTotaal: number;        // stille leesregistraties (v194)
  bevestigdTotaal: number;     // expliciete leesbevestigingen
  perModule: { module: string; users: number }[]; // unieke gebruikers per module, 7d
  perDag: { dag: string; label: string; n: number }[]; // activiteit per dag, 14d (vragen+posts)
}

const DAG_MS = 24 * 60 * 60 * 1000;

function amsDagVan(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date(ms));
}

export async function haalAnalytics(env: Env): Promise<AnalyticsData> {
  const d = db(env);
  const nu = Date.now();
  const week = nu - 7 * DAG_MS;
  const veertien = nu - 14 * DAG_MS;
  const vandaag = amsDagVan(nu);
  const dagStart = Date.parse(`${vandaag}T00:00:00+02:00`); // ruime benadering, zelfde aanpak als aanwezigheid

  const out: AnalyticsData = {
    totaalActief: 0, dagActief: 0, weekActief: 0,
    vragen7d: 0, vragenIntern7d: 0, posts7d: 0, polls7d: 0,
    statusVandaag: 0, gezienTotaal: 0, bevestigdTotaal: 0,
    perModule: [], perDag: [],
  };

  try {
    const r = await d.prepare("SELECT COUNT(*) AS n FROM medewerkers WHERE (actief IS NULL OR actief=1) AND email IS NOT NULL AND email != ''").first<{ n: number }>();
    out.totaalActief = r?.n ?? 0;
  } catch { /* kolomnamen anders -> 0, dashboard blijft werken */ }
  try {
    const r = await d.prepare("SELECT COUNT(DISTINCT user_id) AS n FROM user_module_seen WHERE last_seen_at >= ?").bind(week).first<{ n: number }>();
    out.weekActief = r?.n ?? 0;
  } catch { /* skip */ }
  try {
    const r = await d.prepare("SELECT COUNT(DISTINCT user_id) AS n FROM user_module_seen WHERE last_seen_at >= ?").bind(dagStart).first<{ n: number }>();
    out.dagActief = r?.n ?? 0;
  } catch { /* skip */ }
  try {
    const r = await d.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(answered),0) AS i FROM ask_log WHERE created_at >= ?").bind(week).first<{ n: number; i: number }>();
    out.vragen7d = r?.n ?? 0; out.vragenIntern7d = r?.i ?? 0;
  } catch { /* skip */ }
  try {
    const r = await d.prepare("SELECT COUNT(*) AS n FROM posts WHERE created_at >= ? AND deleted_at IS NULL").bind(week).first<{ n: number }>();
    out.posts7d = r?.n ?? 0;
  } catch { /* skip */ }
  try {
    const r = await d.prepare("SELECT COUNT(*) AS n FROM polls WHERE created_at >= ? AND deleted_at IS NULL").bind(week).first<{ n: number }>();
    out.polls7d = r?.n ?? 0;
  } catch { /* skip */ }
  try {
    const r = await d.prepare("SELECT COUNT(*) AS n FROM aanwezigheid_status WHERE dag = ?").bind(vandaag).first<{ n: number }>();
    out.statusVandaag = r?.n ?? 0;
  } catch { /* skip */ }
  try {
    const r = await d.prepare("SELECT SUM(CASE WHEN doel_type LIKE '%_gezien' THEN 1 ELSE 0 END) AS g, SUM(CASE WHEN doel_type NOT LIKE '%_gezien' THEN 1 ELSE 0 END) AS b FROM leesbevestigingen").first<{ g: number; b: number }>();
    out.gezienTotaal = r?.g ?? 0; out.bevestigdTotaal = r?.b ?? 0;
  } catch { /* skip */ }
  try {
    const r = await d.prepare("SELECT module_key, COUNT(DISTINCT user_id) AS n FROM user_module_seen WHERE last_seen_at >= ? GROUP BY module_key ORDER BY n DESC LIMIT 8").bind(week).all<{ module_key: string; n: number }>();
    out.perModule = (r.results ?? []).map((x) => ({ module: x.module_key, users: x.n }));
  } catch { /* skip */ }
  // Activiteit per dag (14d): assistent-vragen + prikbord-posts, in JS gebucketed
  // per Amsterdam-dag (D1 kent onze tijdzone niet).
  try {
    const [vr, po] = await Promise.all([
      d.prepare("SELECT created_at FROM ask_log WHERE created_at >= ?").bind(veertien).all<{ created_at: number }>(),
      d.prepare("SELECT created_at FROM posts WHERE created_at >= ? AND deleted_at IS NULL").bind(veertien).all<{ created_at: number }>(),
    ]);
    const teller = new Map<string, number>();
    for (const row of [...(vr.results ?? []), ...(po.results ?? [])]) {
      const k = amsDagVan(Number(row.created_at));
      teller.set(k, (teller.get(k) ?? 0) + 1);
    }
    const dagen: { dag: string; label: string; n: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const ms = nu - i * DAG_MS;
      const k = amsDagVan(ms);
      dagen.push({ dag: k, label: new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", day: "numeric", month: "numeric" }).format(new Date(ms)), n: teller.get(k) ?? 0 });
    }
    out.perDag = dagen;
  } catch { /* skip */ }

  return out;
}
