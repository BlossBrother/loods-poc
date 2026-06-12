// Configureerbare begroetingsheader. Config + varianten staan als JSON in app_settings
// (zelfde patroon als modules/nav). Standaarden = exact het bestaande groene hero-uiterlijk,
// zodat zonder config niets verandert (geen breaking change).
import type { Env } from "./airtable";

export interface HeaderConfig {
  enabled: boolean;
  useTimeBased: boolean;
  randomize: boolean;
  subtitleTemplate: string;
  gradientFrom: string;
  gradientTo: string;
  textColor: string;
  fallbackGreeting: string;
}
export interface GreetingVariant { text: string; slot: "morning" | "afternoon" | "evening" | "any"; weight: number; active: boolean; }

export const DEFAULT_CONFIG: HeaderConfig = {
  enabled: true,
  useTimeBased: true,
  randomize: true,
  subtitleTemplate: "Er {werkw} {aantal} nieuw{meerv} voor je",
  gradientFrom: "#236b41",
  gradientTo: "#3fa468",
  textColor: "#ffffff",
  fallbackGreeting: "Hallo",
};

export const DEFAULT_VARIANTS: GreetingVariant[] = [
  { text: "Goedemorgen", slot: "morning", weight: 2, active: true },
  { text: "Goeiemorgen", slot: "morning", weight: 1, active: true },
  { text: "Goedemiddag", slot: "afternoon", weight: 2, active: true },
  { text: "Goedenavond", slot: "evening", weight: 2, active: true },
  { text: "Fijne avond", slot: "evening", weight: 1, active: true },
  { text: "Hoi", slot: "any", weight: 1, active: true },
  { text: "Hé", slot: "any", weight: 1, active: true },
  { text: "Fijne dag", slot: "any", weight: 1, active: true },
];

const TENANT = "default";
function db(env: Env): D1Database { if (!env.DB) throw new Error("D1 (DB) ontbreekt"); return env.DB; }

async function readJson<T>(env: Env, key: string): Promise<T | undefined> {
  try {
    const row = await db(env).prepare("SELECT value FROM app_settings WHERE tenant_id=? AND key=?").bind(TENANT, key).first<{ value: string }>();
    if (!row?.value) return undefined;
    return JSON.parse(row.value) as T;
  } catch { return undefined; }
}
async function writeJson(env: Env, key: string, value: unknown): Promise<void> {
  await db(env).prepare("INSERT INTO app_settings (tenant_id, key, value, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(tenant_id, key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at")
    .bind(TENANT, key, JSON.stringify(value), Date.now()).run();
}

export async function getHeaderConfig(env: Env): Promise<HeaderConfig> {
  const stored = await readJson<Partial<HeaderConfig>>(env, "header_config");
  return { ...DEFAULT_CONFIG, ...(stored ?? {}) };
}
export async function getVariants(env: Env): Promise<GreetingVariant[]> {
  const stored = await readJson<GreetingVariant[]>(env, "greeting_variants");
  if (Array.isArray(stored) && stored.length) {
    return stored.filter((v) => v && typeof v.text === "string").map((v) => ({
      text: String(v.text), slot: (["morning", "afternoon", "evening", "any"].includes(v.slot) ? v.slot : "any") as GreetingVariant["slot"],
      weight: Math.max(1, Number(v.weight) || 1), active: v.active !== false,
    }));
  }
  return DEFAULT_VARIANTS;
}
export async function saveHeaderConfig(env: Env, cfg: HeaderConfig): Promise<void> { await writeJson(env, "header_config", cfg); }
export async function saveVariants(env: Env, variants: GreetingVariant[]): Promise<void> { await writeJson(env, "greeting_variants", variants); }
export async function resetHeader(env: Env): Promise<void> {
  await saveHeaderConfig(env, DEFAULT_CONFIG);
  await saveVariants(env, DEFAULT_VARIANTS);
}

export function amsterdamHour(): number {
  return Number(new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", hour: "2-digit", hour12: false }).format(new Date()));
}

// v195: stabiele FNV-1a-hash voor een deterministische "willekeurige" keuze.
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

// v195: optionele seed — zelfde seed = zelfde begroeting. Home geeft
// "email|datum|dagdeel" mee zodat de groet niet bij elke render her-randomiseert
// (review 12/6 bevinding 1); zonder seed blijft het gedrag als vanouds (preview beheer).
export function pickGreeting(cfg: HeaderConfig, variants: GreetingVariant[], hour: number, seed?: string): string {
  const slot = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const pool = variants.filter((v) => v.active && (cfg.useTimeBased ? v.slot === slot || v.slot === "any" : v.slot === "any"));
  if (!pool.length) return cfg.fallbackGreeting || "Hallo";
  if (!cfg.randomize) return pool[0].text;
  const total = pool.reduce((a, v) => a + Math.max(1, v.weight || 1), 0);
  const frac = seed != null ? (fnv1a(seed) % 100000) / 100000 : Math.random();
  let r = frac * total;
  for (const v of pool) { r -= Math.max(1, v.weight || 1); if (r <= 0) return v.text; }
  return pool[pool.length - 1].text;
}

// Vul de subtitle-template. Variabelen: {aantal}, {voornaam}, {werkw} (is/zijn), {meurv}/{meerv} (e ding/e dingen-suffix).
export function fillSubtitle(tpl: string, aantal: number, voornaam: string): string {
  const werkw = aantal === 1 ? "is" : "zijn";
  const meerv = aantal === 1 ? " ding" : "e dingen";
  return tpl
    .replace(/\{aantal\}/g, String(aantal))
    .replace(/\{voornaam\}/g, voornaam || "")
    .replace(/\{werkw\}/g, werkw)
    .replace(/\{meerv\}/g, meerv)
    .trim();
}
