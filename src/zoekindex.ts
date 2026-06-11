// Globale zoekfunctie (Stroom-plan 4.1): FTS5-index over de modules heen.
// De bestaande rijke zoekkaarten (mensen/nieuws/documenten) blijven; deze index
// voegt de overige modules toe (prikbord, peilingen, agenda, trainingen) met
// deep links, en is de basis om later alles op FTS te laten draaien.
// Vullen: dagelijkse cron + de herindexeer-knop op /zoek (zelfde knop als de
// kennisbank). Bewuste afwijking van "triggers bij elke mutatie": een index die
// maximaal een dag achterloopt is hier ruim voldoende en veel eenvoudiger.
import type { Env } from "./airtable";

export interface ZoekTreffer { titel: string; frag: string; route: string }
export interface ZoekGroep { key: string; label: string; items: ZoekTreffer[] }

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1 (DB) ontbreekt");
  return env.DB;
}

function kort(s: unknown, n = 80): string {
  const t = String(s ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n).trimEnd() + "…" : t;
}

// Herindexeert de hele zoekindex (idempotent). Per entiteit met try/catch zodat
// een ontbrekende tabel nooit de hele index blokkeert.
export async function reindexZoek(env: Env): Promise<number> {
  const d = db(env);
  await d.prepare("DELETE FROM zoek_fts").run();
  type Rij = { titel: string; tekst: string; entity: string; ref: string; route: string };
  const rijen: Rij[] = [];
  const veilig = async (fn: () => Promise<void>) => { try { await fn(); } catch { /* tabel mist -> skip */ } };

  await veilig(async () => {
    const r = await d.prepare("SELECT id, bericht FROM posts WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 400").all<{ id: string; bericht: string }>();
    for (const p of r.results ?? []) rijen.push({ titel: kort(p.bericht, 70) || "Prikbord-bericht", tekst: String(p.bericht ?? ""), entity: "prikbord", ref: p.id, route: `/social#post-${p.id}` });
  });
  await veilig(async () => {
    const r = await d.prepare("SELECT id, vraag FROM polls WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 200").all<{ id: string; vraag: string }>();
    for (const p of r.results ?? []) rijen.push({ titel: kort(p.vraag, 70) || "Peiling", tekst: String(p.vraag ?? ""), entity: "poll", ref: p.id, route: `/social#poll-${p.id}` });
  });
  await veilig(async () => {
    const grens = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const r = await d.prepare("SELECT id, title, description, location FROM agenda_events WHERE deleted_at IS NULL AND start_at > ? ORDER BY start_at DESC LIMIT 400").bind(grens).all<{ id: string; title: string; description: string | null; location: string | null }>();
    for (const e of r.results ?? []) rijen.push({ titel: kort(e.title, 70) || "Event", tekst: [e.title, e.description, e.location].filter(Boolean).join(" "), entity: "agenda", ref: e.id, route: `/agenda/event/${e.id}` });
  });
  await veilig(async () => {
    const r = await d.prepare("SELECT id, title, description FROM courses WHERE tenant_id='default' AND published=1 LIMIT 200").all<{ id: string; title: string; description: string | null }>();
    for (const cR of r.results ?? []) rijen.push({ titel: kort(cR.title, 70) || "Training", tekst: [cR.title, cR.description].filter(Boolean).join(" "), entity: "training", ref: cR.id, route: "/trainingen" });
  });

  // In stukken van 40 statements per batch (ruim binnen de D1-limieten).
  for (let i = 0; i < rijen.length; i += 40) {
    const chunk = rijen.slice(i, i + 40).map((x) =>
      d.prepare("INSERT INTO zoek_fts (titel, tekst, entity, ref, route) VALUES (?,?,?,?,?)")
        .bind(x.titel, x.tekst, x.entity, x.ref, x.route),
    );
    await d.batch(chunk);
  }
  return rijen.length;
}

const LABELS: Record<string, string> = { prikbord: "Prikbord", poll: "Peilingen", agenda: "Agenda", training: "Trainingen" };

// FTS5-zoekopdracht, gegroepeerd per module, max `perGroep` per groep.
export async function zoekFts(env: Env, q: string, perGroep = 5): Promise<ZoekGroep[]> {
  const termen = q.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean).slice(0, 6);
  if (!termen.length) return [];
  const match = termen.map((t) => `"${t}"*`).join(" ");
  const r = await db(env)
    .prepare("SELECT entity, titel, route, snippet(zoek_fts, 1, '', '', '…', 10) AS frag FROM zoek_fts WHERE zoek_fts MATCH ? ORDER BY rank LIMIT 60")
    .bind(match)
    .all<{ entity: string; titel: string; route: string; frag: string }>();
  const groepen = new Map<string, ZoekTreffer[]>();
  for (const row of r.results ?? []) {
    const arr = groepen.get(row.entity) ?? [];
    if (arr.length < perGroep) arr.push({ titel: row.titel, frag: row.frag, route: row.route });
    groepen.set(row.entity, arr);
  }
  return Array.from(groepen.entries()).map(([key, items]) => ({ key, label: LABELS[key] ?? key, items }));
}
