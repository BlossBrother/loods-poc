// Kennisdump (v202): drop Word/PDF/foto's in Beheer -> Workers AI toMarkdown leest
// het bestand -> LLM categoriseert (titel/categorie/samenvatting + doelgroep-
// SUGGESTIE) -> kb_docs -> indexDoc (Vectorize) -> direct vindbaar in de
// assistent. Veiligheidsregel: alles landt als 'internal'; zichtbaar voor het
// klantenportaal wordt het pas als de beheerder dat expliciet aanzet
// (zetDumpAudience) — de AI mag alleen suggereren.
import type { Env } from "./airtable";
import { indexDoc, removeDoc } from "./rag";

const TENANT = "default";
function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1-database (DB) niet geconfigureerd.");
  return env.DB;
}

export interface DumpItem {
  id: string;
  bestand: string;
  r2_key: string | null;
  titel: string;
  categorie: string;
  samenvatting: string | null;
  audience: string;
  suggestie_klant: number;
  status: string;
  door: string | null;
  created_at: number;
}

export async function listDump(env: Env): Promise<DumpItem[]> {
  try {
    const r = await db(env)
      .prepare("SELECT * FROM kennisdump_log WHERE tenant_id=? ORDER BY created_at DESC LIMIT 200")
      .bind(TENANT)
      .all<DumpItem>();
    return r.results ?? [];
  } catch {
    return []; // tabel ontbreekt (migratie 0005 nog niet gedraaid) -> lege lijst
  }
}

const CATS = ["ras", "teelt", "nieuwsbrief", "beleid", "handleiding", "overig"];

export async function verwerkDump(env: Env, naam: string, bytes: ArrayBuffer, door: string): Promise<{ ok: boolean; titel?: string; fout?: string }> {
  if (!env.AI || !env.DB) return { ok: false, fout: "AI/DB niet geconfigureerd" };
  const id = "kd" + crypto.randomUUID().replace(/-/g, "");
  // 1. Origineel bewaren in R2 (zelfde bucket als documenten) — best effort.
  const r2key = `kennisdump/${id}/${naam.replace(/[^\w.\-]+/g, "_")}`;
  try { await env.DOCS?.put(r2key, bytes); } catch { /* origineel-bewaren mag falen */ }
  // 2. Converteren naar markdown (PDF/Word/afbeelding/HTML/tekst — Workers AI).
  let md = "";
  try {
    const conv = await (env.AI as unknown as {
      toMarkdown(files: { name: string; blob: Blob }[]): Promise<{ data?: string }[]>;
    }).toMarkdown([{ name: naam, blob: new Blob([bytes], { type: "application/octet-stream" }) }]);
    md = String(conv?.[0]?.data ?? "").trim();
  } catch (e) {
    return { ok: false, fout: "conversie mislukt (" + String(e).slice(0, 120) + ")" };
  }
  if (!md) return { ok: false, fout: "geen tekst in het bestand gevonden" };
  if (md.length > 200_000) md = md.slice(0, 200_000); // hou D1/embedding-werk begrensd
  // 3. AI-categorisatie: titel, categorie, samenvatting + klant-SUGGESTIE.
  let meta = { titel: naam.replace(/\.[a-z0-9]+$/i, ""), categorie: "overig", samenvatting: "", klant: false };
  try {
    const res = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: `Je krijgt een document van kwekerij Fresh Forward (aardbeien-/zachtfruitrassen). Antwoord ALLEEN met geldige JSON: {"titel":"korte nette titel","categorie":"een van: ${CATS.join("|")}","samenvatting":"één zin Nederlands","klant":true of false}. "klant" is true alléén als het document duidelijk voor klanten/telers bedoeld is (rasinformatie, teeltadvies, nieuwsbrief).` },
        { role: "user", content: md.slice(0, 6000) },
      ],
    });
    const txt = String((res as { response?: string }).response ?? "");
    const j = JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1)) as { titel?: string; categorie?: string; samenvatting?: string; klant?: boolean };
    meta = {
      titel: String(j.titel || meta.titel).slice(0, 140),
      categorie: CATS.includes(String(j.categorie)) ? String(j.categorie) : "overig",
      samenvatting: String(j.samenvatting || "").slice(0, 300),
      klant: j.klant === true,
    };
  } catch { /* categorisatie is best effort; defaults blijven staan */ }
  // 4. In de kennisbank — ALTIJD intern (klant-zichtbaar = expliciete beheeractie).
  await db(env)
    .prepare("INSERT OR REPLACE INTO kb_docs (id, category, variety, title, body, url, audience, updated_at) VALUES (?, ?, NULL, ?, ?, ?, 'internal', unixepoch())")
    .bind(id, meta.categorie, meta.titel, md, "")
    .run();
  await db(env)
    .prepare("INSERT INTO kennisdump_log (id, tenant_id, bestand, r2_key, titel, categorie, samenvatting, audience, suggestie_klant, status, door, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
    .bind(id, TENANT, naam, r2key, meta.titel, meta.categorie, meta.samenvatting, "internal", meta.klant ? 1 : 0, "verwerkt", door, Date.now())
    .run();
  // 5. Direct indexeren (chunks + embeddings + Vectorize).
  const n = await indexDoc(env, id).catch(() => 0);
  if (n > 0) {
    await db(env).prepare("UPDATE kennisdump_log SET status='geïndexeerd' WHERE id=?").bind(id).run().catch(() => { /* status is cosmetisch */ });
  }
  return { ok: true, titel: meta.titel };
}

// Klant-zichtbaarheid wisselen: kb_docs.audience + her-index (metadata gaat mee).
export async function zetDumpAudience(env: Env, id: string, klant: boolean): Promise<void> {
  const aud = klant ? "public" : "internal";
  await db(env).prepare("UPDATE kb_docs SET audience=?, updated_at=unixepoch() WHERE id=?").bind(aud, id).run();
  await db(env).prepare("UPDATE kennisdump_log SET audience=? WHERE id=? AND tenant_id=?").bind(aud, id, TENANT).run();
  await indexDoc(env, id);
}

export async function verwijderDump(env: Env, id: string): Promise<void> {
  await removeDoc(env, id); // vectoren + chunks + kb_docs (gedeeld met cascade-opruimen, v203)
  await db(env).prepare("DELETE FROM kennisdump_log WHERE id=? AND tenant_id=?").bind(id, TENANT).run();
}
