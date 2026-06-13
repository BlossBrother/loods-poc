// Kennisbank-vraagbaak (RAG): vraag -> embed -> Vectorize top-k -> context -> LLM -> antwoord.
// Het model put UITSLUITEND uit de opgehaalde context; geen match = eerlijk "niet gevonden".
// Alles draait in de eigen Worker (Workers AI + Vectorize). Defensief: zonder Vectorize-index
// blijft de rest van de app gewoon werken.
import type { Env } from "./airtable";

// Centrale modelconfig (taak 1) — één plek, geïmporteerd door kennisdump.ts e.a.
// Op 30-05-2026 zijn de kále llama-3.1-modellen (incl. 8b en 70b) uitgefaseerd;
// alleen de -fp8-fast-variant overleeft. Gebruik exact deze string.
export const EMBED_MODEL = "@cf/baai/bge-base-en-v1.5"; // 768 dims — moet matchen met de index
export const GEN_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"; // leestekst (kennisbank/web/algemeen)
export const CLASS_MODEL = "@cf/meta/llama-3.2-3b-instruct"; // classificatie/scheidsrechter: snel, kwaliteit minder kritiek
const TOP_K = 5;

// Taak 2: lees zowel het oude Workers-AI-formaat ({response}) als het nieuwe
// OpenAI-chat-formaat ({choices:[{message:{content}}]}). Leeg = leeg (= fout).
export function leesAntwoord(res: unknown): string {
  const r = res as { response?: unknown; choices?: { message?: { content?: unknown } }[] };
  const viaResponse = typeof r?.response === "string" ? r.response : "";
  const c = r?.choices?.[0]?.message?.content;
  const viaChoices = typeof c === "string" ? c : "";
  return String(viaResponse || viaChoices || "").trim();
}

// Eén delta uit een streaming-chunk (beide formaten): {response} of {choices:[{delta:{content}}]}.
export function leesDelta(obj: unknown): string {
  const o = obj as { response?: unknown; choices?: { delta?: { content?: unknown } }[] };
  const a = typeof o?.response === "string" ? o.response : "";
  const d = o?.choices?.[0]?.delta?.content;
  const b = typeof d === "string" ? d : "";
  return a || b || "";
}

// Taak 5: een kennisbank-antwoord telt als weigering bij leeg/heel kort, of bij een
// expliciete "niet gevonden". Conservatief: een lang of normaal antwoord blijft staan
// (voorkomt dat een góéd antwoord onnodig een extra generatie triggert).
export function isWeigering(s: string): boolean {
  const t = (s || "").trim();
  if (t.length < 20) return true;
  if (t.length >= 280) return false;
  return /(kan|kon)[^.]{0,60}(geen|niet)[^.]{0,50}(vinden|terugvinden|beantwoorden)|geen informatie (gevonden|beschikbaar|over)|niet (terug te vinden|beschikbaar) in|(meegeleverde|gegeven|beschikbare) context|niet in de (context|kennisbank)/i.test(t);
}

const SYSTEM = `Je bent de interne assistent van Fresh Forward. Beantwoord de vraag
UITSLUITEND op basis van de meegeleverde context. Verzin niets. Als de context geen
antwoord bevat, zeg dan eerlijk dat je het niet in de kennisbank kunt vinden en verwijs
naar de betreffende collega of IT. Antwoord in het Nederlands, bondig en praktisch.
Noem geen bron-ids in de tekst; bronnen worden los getoond.`;

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1 (DB) ontbreekt");
  return env.DB;
}

// Chunking op alinea's met overlap; te grote alinea's op zinsniveau opgehakt.
function chunkText(text: string, maxChars = 1200, overlap = 150): string[] {
  const blocks: string[] = [];
  for (const p of text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)) {
    if (p.length <= maxChars) { blocks.push(p); continue; }
    let s = "";
    for (const sent of p.split(/(?<=[.!?])\s+/)) {
      if ((s + " " + sent).length > maxChars && s) { blocks.push(s); s = sent; }
      else { s = s ? s + " " + sent : sent; }
    }
    if (s) blocks.push(s);
  }
  const chunks: string[] = [];
  let buf = "";
  for (const b of blocks) {
    if ((buf + "\n\n" + b).length > maxChars && buf) {
      chunks.push(buf);
      buf = buf.slice(Math.max(0, buf.length - overlap)) + "\n\n" + b;
    } else {
      buf = buf ? buf + "\n\n" + b : b;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

async function embed(env: Env, texts: string[]): Promise<number[][]> {
  const res = await env.AI!.run(EMBED_MODEL, { text: texts });
  return (res as { data: number[][] }).data;
}

export function ragActief(env: Env): boolean {
  return !!env.AI && !!env.VECTORIZE && !!env.DB;
}

export async function indexDoc(env: Env, docId: string): Promise<number> {
  if (!ragActief(env)) return 0;
  const doc = await db(env).prepare("SELECT id, category, variety, title, body, url, audience FROM kb_docs WHERE id = ?").bind(docId).first<any>();
  if (!doc) return 0;
  const old = await db(env).prepare("SELECT id FROM kb_chunks WHERE doc_id = ?").bind(docId).all<{ id: string }>();
  const oldIds = (old.results ?? []).map((r) => r.id);
  if (oldIds.length) {
    await env.VECTORIZE!.deleteByIds(oldIds);
    await db(env).prepare("DELETE FROM kb_chunks WHERE doc_id = ?").bind(docId).run();
  }
  const parts = chunkText(`${doc.title}\n\n${doc.body}`);
  if (!parts.length) return 0;
  const vectors = await embed(env, parts);
  await env.VECTORIZE!.upsert(parts.map((_t, i) => ({
    id: `${docId}::${i}`,
    values: vectors[i],
    metadata: { doc_id: doc.id, chunk_ix: i, category: doc.category, variety: doc.variety ?? "", audience: doc.audience, title: doc.title, url: doc.url ?? "" },
  })));
  const stmt = db(env).prepare("INSERT OR REPLACE INTO kb_chunks (id, doc_id, chunk_ix, text) VALUES (?, ?, ?, ?)");
  await db(env).batch(parts.map((text, i) => stmt.bind(`${docId}::${i}`, docId, i, text)));
  return parts.length;
}

// Synchroniseer bestaande portaal-teeltinhoud (rassen/teelt/snoei) naar kb_docs zodat de
// klant-vraagbaak uit echte content put. Idempotent (INSERT OR REPLACE op stabiele id's).
export async function syncPortalContent(env: Env): Promise<void> {
  if (!env.DB) return;
  const ins = async (id: string, category: string, title: string, body: string, url: string, audience: string) => {
    if (!title || !body) return;
    await db(env).prepare("INSERT OR REPLACE INTO kb_docs (id, category, variety, title, body, url, audience, updated_at) VALUES (?, ?, NULL, ?, ?, ?, ?, unixepoch())").bind(id, category, title, body, url, audience).run();
  };
  try {
    const r = await db(env).prepare("SELECT id, naam, gewas, omschrijving, smaak, kleur, seizoen FROM rassen WHERE gepubliceerd=1").all<any>();
    for (const x of r.results ?? []) {
      const body = [x.gewas, x.omschrijving, x.smaak ? "Smaak: " + x.smaak : "", x.kleur ? "Kleur: " + x.kleur : "", x.seizoen ? "Seizoen: " + x.seizoen : ""].filter(Boolean).join(". ");
      await ins("kbras_" + x.id, "variety", String(x.naam || "Ras"), body, "/portaal/rassen", "public");
    }
  } catch { /* tabel ontbreekt? sla over */ }
  try {
    const r = await db(env).prepare("SELECT id, titel, inhoud, categorie FROM teeltadvies WHERE gepubliceerd=1").all<any>();
    for (const x of r.results ?? []) await ins("kbta_" + x.id, String(x.categorie || "teelt"), String(x.titel || "Teeltadvies"), String(x.inhoud || ""), "/portaal/teeltadvies", "grower");
  } catch { /* skip */ }
  try {
    const r = await db(env).prepare("SELECT id, titel, inhoud, type, periode FROM snoei_pluk WHERE gepubliceerd=1").all<any>();
    for (const x of r.results ?? []) await ins("kbsp_" + x.id, String(x.type || "snoei"), String(x.titel || "Snoei/pluk"), [x.inhoud, x.periode ? "Periode: " + x.periode : ""].filter(Boolean).join(". "), "/portaal/snoei-pluk", "grower");
  } catch { /* skip */ }
}

// Indexeer ook interne content: gepubliceerd nieuws + agenda-events, zodat de vraagbaak
// vragen als "wanneer is de Fresh BBQ" kan beantwoorden. Audience 'internal'.
export async function syncIntranetContent(env: Env): Promise<void> {
  if (!env.DB) return;
  const ins = async (id: string, category: string, title: string, body: string, url: string) => {
    if (!title || !body) return;
    await db(env).prepare("INSERT OR REPLACE INTO kb_docs (id, category, variety, title, body, url, audience, updated_at) VALUES (?, ?, NULL, ?, ?, ?, 'internal', unixepoch())").bind(id, category, title, body, url).run();
  };
  try {
    const r = await db(env).prepare("SELECT id, titel, inhoud FROM nieuws WHERE status='Gepubliceerd'").all<any>();
    for (const x of r.results ?? []) await ins("kbnws_" + x.id, "nieuws", String(x.titel || "Nieuws"), String(x.inhoud || ""), "/#nieuws-" + x.id);
  } catch { /* geen nieuws-tabel? skip */ }
  try {
    // v203: verwijderde (soft-deleted) events NIET her-indexeren — anders kwam een
    // verwijderd agendapunt bij de eerstvolgende reindex terug in de assistent.
    const r = await db(env).prepare("SELECT id, title, description, location, start_at FROM agenda_events WHERE deleted_at IS NULL ORDER BY start_at DESC LIMIT 100").all<any>();
    const fmt = (v: unknown) => { const n = typeof v === "number" ? v : Date.parse(String(v)); return Number.isNaN(n) ? "" : new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", dateStyle: "full", timeStyle: "short" }).format(new Date(n)); };
    for (const x of r.results ?? []) {
      const body = [x.description, "Wanneer: " + fmt(x.start_at), x.location ? "Locatie: " + x.location : ""].filter(Boolean).join(". ");
      await ins("kbev_" + x.id, "agenda", String(x.title || "Agendapunt"), body, "/agenda/event/" + x.id);
    }
  } catch { /* geen agenda-tabel? skip */ }
}

export async function reindexAll(env: Env): Promise<number> {
  if (!ragActief(env)) return 0;
  try { await syncPortalContent(env); } catch { /* best-effort */ }
  try { await syncIntranetContent(env); } catch { /* best-effort */ }
  const docs = await db(env).prepare("SELECT id FROM kb_docs").all<{ id: string }>();
  let total = 0;
  for (const row of docs.results ?? []) total += await indexDoc(env, row.id);
  return total;
}

export interface AskResult { answer: string; sources: { title: string; url?: string; category?: string }[]; answered: boolean; }

// v203: kennisbank-doc volledig verwijderen (vectoren + chunks + doc). Gebruikt
// bij Kennisdump-verwijderen en bij cascade-opruimen (bv. verwijderd agenda-event
// "kbev_<id>" dat anders in de assistent bleef opduiken — melding PJ 12/6).
export async function removeDoc(env: Env, docId: string): Promise<void> {
  try {
    const old = await db(env).prepare("SELECT id FROM kb_chunks WHERE doc_id=?").bind(docId).all<{ id: string }>();
    const ids = (old.results ?? []).map((r) => r.id);
    if (ids.length && env.VECTORIZE) await env.VECTORIZE.deleteByIds(ids);
    await db(env).prepare("DELETE FROM kb_chunks WHERE doc_id=?").bind(docId).run();
  } catch { /* best effort */ }
  await db(env).prepare("DELETE FROM kb_docs WHERE id=?").bind(docId).run().catch(() => {});
}

// v206: live webzoek (Tavily) — stap 3 in de assistent-keten, vóór de kale
// algemene kennis. Levert een NL-samenvatting via het eigen LLM + bronlinks.
// Zonder TAVILY_API_KEY (secret) geeft dit null en valt de keten gewoon terug.
const WEB_SYS = "Beantwoord de vraag kort en feitelijk in het Nederlands (max ±150 woorden), uitsluitend op basis van de meegegeven webfragmenten. Staat het antwoord er niet in, zeg dat dan. Geen bronnummers in de lopende tekst.";

// Retrieval-only: Tavily-fragmenten + bronnen (géén generatie). Gedeeld door webZoek
// (non-streaming) en beslisBron (streaming), zodat de Tavily-call op één plek staat.
export async function webContext(env: Env, vraag: string): Promise<{ ctx: string; sources: { title: string; url?: string }[] } | null> {
  if (!env.TAVILY_API_KEY) return null;
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.TAVILY_API_KEY}` },
      body: JSON.stringify({ query: vraag, search_depth: "basic", max_results: 5, include_answer: false }),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { results?: { title: string; url: string; content: string }[] };
    const hits = (j.results ?? []).filter((h) => h && h.title && h.content).slice(0, 5);
    if (!hits.length) return null;
    const ctx = hits.map((h, i) => `[${i + 1}] ${h.title}\n${h.content}`).join("\n\n").slice(0, 6000);
    return { ctx, sources: hits.map((h) => ({ title: h.title.slice(0, 80), url: h.url })) };
  } catch (e) {
    console.error("ai:webContext", e);
    return null; // webzoek is een verrijking, nooit een breekpunt
  }
}

export async function webZoek(env: Env, vraag: string): Promise<{ answer: string; sources: { title: string; url?: string }[] } | null> {
  if (!env.AI) return null;
  const web = await webContext(env, vraag);
  if (!web) return null;
  try {
    const r = await env.AI.run(GEN_MODEL, {
      messages: [
        { role: "system", content: WEB_SYS },
        { role: "user", content: `Webfragmenten:\n${web.ctx}\n\nVraag: ${vraag}` },
      ],
      max_tokens: 300,
    });
    const answer = leesAntwoord(r);
    if (!answer) return null;
    return { answer, sources: web.sources };
  } catch (e) {
    console.error("ai:webZoek", e);
    return null;
  }
}

// v200: algemene-kennis-antwoord voor de assistent — alléén als de kennisbank niets
// weet én de invoer een echte vraag is (PJ 12/6: "hoeveel kassen staan er in
// Nederland?" moet ook antwoord krijgen). Het antwoord wordt in de UI gelabeld als
// algemene kennis, zodat niemand het voor intern beleid aanziet.
const ALG_SYS = "Je bent de assistent van het Fresh Forward-intranet (Nederlandse kwekerij/agro-sector). Beantwoord de vraag kort en feitelijk in het Nederlands (max ±150 woorden). Weet je iets niet zeker, zeg dat eerlijk. Verzin nooit interne bedrijfsinformatie; je antwoordt uit algemene kennis.";

export async function algemeenAntwoord(env: Env, vraag: string): Promise<string> {
  if (!env.AI) return "AI is hier nog niet geactiveerd.";
  try {
    const res = await env.AI.run(GEN_MODEL, {
      messages: [
        { role: "system", content: ALG_SYS },
        { role: "user", content: vraag },
      ],
      max_tokens: 300,
    });
    return leesAntwoord(res) || "Daar heb ik zo geen antwoord op.";
  } catch (e) {
    console.error("ai:algemeen", e);
    return "Daar kan ik nu even niet bij — probeer het straks opnieuw.";
  }
}

export async function ask(env: Env, question: string, opts: { audiences?: string[]; lang?: string } = {}): Promise<AskResult> {
  if (!ragActief(env)) {
    return { answer: "De kennisbank is nog niet geactiveerd. Vraag een beheerder om de vraagbaak in te richten.", sources: [], answered: false };
  }
  const emb = await env.AI!.run(EMBED_MODEL, { text: [question] });
  const qvec = (emb as { data: number[][] }).data[0];
  const allowed = opts.audiences ?? ["public", "internal"];
  const matches = await env.VECTORIZE!.query(qvec, { topK: TOP_K, returnMetadata: "all", filter: { audience: { $in: allowed } } });
  // Harde backstop in code: laat ALLEEN toegestane audiences door, ongeacht of het
  // Vectorize-metadatafilter werkt. Zo lekt interne content nooit naar het portaal.
  const hits = (matches.matches ?? []).filter((m) => m.score >= 0.3 && allowed.includes(String((m.metadata as any)?.audience ?? "")));
  if (!hits.length) {
    return { answer: "Ik kan dit niet terugvinden in de kennisbank. Vraag het je leidinggevende of IT.", sources: [], answered: false };
  }
  const ids = hits.map((m) => m.id);
  const ph = ids.map((_, i) => `?${i + 1}`).join(",");
  const rows = await db(env).prepare(`SELECT id, text FROM kb_chunks WHERE id IN (${ph})`).bind(...ids).all<{ id: string; text: string }>();
  const textById = new Map((rows.results ?? []).map((r) => [r.id, r.text]));
  const context = hits.map((m, i) => `[${i + 1}] ${textById.get(m.id) ?? ""}`).join("\n\n");
  const seen = new Set<string>();
  const sources = hits.map((m) => m.metadata).filter((md) => md && !seen.has(md.doc_id) && seen.add(md.doc_id))
    .map((md) => ({ title: String(md.title ?? "bron"), url: md.url || undefined, category: md.category || undefined }));
  const sys = opts.lang && !/nederlands|^nl$/i.test(opts.lang)
    ? SYSTEM.replace("Antwoord in het Nederlands, bondig en praktisch.", `Antwoord in het ${opts.lang}, bondig en praktisch.`)
    : SYSTEM;
  let answer = "";
  try {
    const res = await env.AI!.run(GEN_MODEL, { messages: [{ role: "system", content: sys }, { role: "user", content: `Context:\n${context}\n\nVraag: ${question}` }], max_tokens: 300 });
    answer = leesAntwoord(res);
  } catch (e) {
    console.error("ai:ask", e);
  }
  // Taak 2/5: leeg of weigering -> answered:false, zodat de keten doorvalt naar web/
  // algemeen (een leeg "Geen antwoord beschikbaar." mag NOOIT meer answered:true zijn).
  if (!answer || isWeigering(answer)) {
    return { answer: answer || "Ik kan dit niet terugvinden in de kennisbank.", sources, answered: false };
  }
  return { answer, sources, answered: true };
}

// Streaming-ondersteuning (taak 6): bepaal de bron (kennisbank -> web -> algemeen)
// uit retrieval-signalen ZONDER te genereren, en geef de messages terug die de
// route vervolgens streamend aan het model voert. Zo vuurt normaliter één generatie
// (taak 5/10) en zijn label + bronnen al bekend vóór het eerste token.
export interface BronBesluit {
  mode: "kennisbank" | "web" | "algemeen";
  sources: AskResult["sources"];
  messages: { role: "system" | "user"; content: string }[];
}

export async function beslisBron(env: Env, question: string, opts: { audiences?: string[]; lang?: string } = {}): Promise<BronBesluit> {
  // 1. Kennisbank (RAG-retrieval).
  if (ragActief(env)) {
    try {
      const emb = await env.AI!.run(EMBED_MODEL, { text: [question] });
      const qvec = (emb as { data: number[][] }).data[0];
      const allowed = opts.audiences ?? ["public", "internal"];
      const matches = await env.VECTORIZE!.query(qvec, { topK: TOP_K, returnMetadata: "all", filter: { audience: { $in: allowed } } });
      const hits = (matches.matches ?? []).filter((m) => m.score >= 0.3 && allowed.includes(String((m.metadata as any)?.audience ?? "")));
      if (hits.length) {
        const ids = hits.map((m) => m.id);
        const ph = ids.map((_, i) => `?${i + 1}`).join(",");
        const rows = await db(env).prepare(`SELECT id, text FROM kb_chunks WHERE id IN (${ph})`).bind(...ids).all<{ id: string; text: string }>();
        const textById = new Map((rows.results ?? []).map((r) => [r.id, r.text]));
        const context = hits.map((m, i) => `[${i + 1}] ${textById.get(m.id) ?? ""}`).join("\n\n");
        const seen = new Set<string>();
        const sources = hits.map((m) => m.metadata).filter((md) => md && !seen.has(md.doc_id) && seen.add(md.doc_id))
          .map((md) => ({ title: String(md.title ?? "bron"), url: md.url || undefined, category: md.category || undefined }));
        const sys = opts.lang && !/nederlands|^nl$/i.test(opts.lang)
          ? SYSTEM.replace("Antwoord in het Nederlands, bondig en praktisch.", `Antwoord in het ${opts.lang}, bondig en praktisch.`)
          : SYSTEM;
        return { mode: "kennisbank", sources, messages: [{ role: "system", content: sys }, { role: "user", content: `Context:\n${context}\n\nVraag: ${question}` }] };
      }
    } catch (e) {
      console.error("ai:beslisBron:kb", e);
    }
  }
  // 2. Web (Tavily) — retrieval-only, daarna streamend samengevat.
  const web = await webContext(env, question);
  if (web) {
    return { mode: "web", sources: web.sources, messages: [{ role: "system", content: WEB_SYS }, { role: "user", content: `Webfragmenten:\n${web.ctx}\n\nVraag: ${question}` }] };
  }
  // 3. Algemene kennis.
  return { mode: "algemeen", sources: [], messages: [{ role: "system", content: ALG_SYS }, { role: "user", content: question }] };
}
