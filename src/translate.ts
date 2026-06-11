import type { Env } from "./airtable";

// Inline vertaling via Workers AI (Meta m2m100). Draait in de eigen Worker:
// geen externe verwerker, geen extra AVG-afspraak. Bron standaard Nederlands.
const MODEL = "@cf/meta/m2m100-1.2b";

// Doeltalen die we in de UI aanbieden (m2m100 ondersteunt deze codes).
export const TRANSLATE_LANGS: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "pl", label: "Polski" },
  { code: "ro", label: "Română" },
  { code: "bg", label: "Български" },
  { code: "uk", label: "Українська" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
  { code: "tr", label: "Türkçe" },
  { code: "ar", label: "العربية" },
  { code: "nl", label: "Nederlands" },
];
const ALLOWED = new Set(TRANSLATE_LANGS.map((l) => l.code));

export function isLang(code: string): boolean {
  return ALLOWED.has(code);
}

export async function translateText(env: Env, text: string, target: string, source = "nl"): Promise<string> {
  if (!env.AI) throw new Error("ai-uit");
  const out = await env.AI.run(MODEL, { text, source_lang: source, target_lang: target });
  return String(out?.translated_text ?? "");
}

async function sha256hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Vertaling met D1-cache: eerst opzoeken, anders vertalen en opslaan. Cache-fouten
// (bv. tabel bestaat nog niet) worden genegeerd zodat vertalen altijd blijft werken.
export async function cachedTranslate(env: Env, text: string, target: string, source = "nl"): Promise<string> {
  const key = await sha256hex(target + "\n" + source + "\n" + text);
  if (env.DB) {
    try {
      const row = await env.DB.prepare("SELECT vertaald FROM vertaal_cache WHERE id = ?").bind(key).first<{ vertaald: string }>();
      if (row?.vertaald) return row.vertaald;
    } catch (e) { /* cache mist/onbereikbaar -> negeer */ }
  }
  const vert = await translateText(env, text, target, source);
  if (env.DB && vert) {
    try {
      await env.DB.prepare("INSERT OR REPLACE INTO vertaal_cache (id, lang, vertaald, created_at) VALUES (?, ?, ?, ?)")
        .bind(key, target, vert, Date.now()).run();
    } catch (e) { /* negeer */ }
  }
  return vert;
}
