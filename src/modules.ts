// Platform-modules: centrale registry + aan/uit-config (tenant-scoped van opzet).
// Config staat in D1 `app_settings` (key='modules', value=JSON-array van aan-staande module-ids).
// Eén tenant nu ('default'); klaar voor multi-tenant (tenant_id-kolom bestaat al).
import type { Env } from "./airtable";

export interface ModuleDef {
  id: string; // stabiele sleutel, ook gebruikt als rol-token "mod:<id>"
  label: string;
  desc: string;
  icon: string; // Lucide-stijl path (zie views/layout ICONS)
}

// De aan/uit-zetbare modules. Home, Mijn account en Beheer staan altijd aan.
export const MODULES: ModuleDef[] = [
  { id: "nieuws", label: "Nieuws", desc: "Nieuwsberichten met reacties", icon: "news" },
  { id: "documenten", label: "Documenten", desc: "Documenten en handige links", icon: "book" },
  { id: "agenda", label: "Agenda", desc: "Dag-, week- en maandagenda", icon: "agenda" },
  { id: "competitie", label: "Competitie", desc: "ELO, dartteller, toernooien", icon: "trophy" },
  { id: "kantine", label: "Kantine", desc: "Bestellen, saldo, beheer", icon: "fries" },
  { id: "prikbord", label: "Prikbord", desc: "Interne berichten van collega's", icon: "board" },
  { id: "team", label: "Team", desc: "Smoelenboek / collega-overzicht", icon: "team" },
  { id: "meldingen", label: "Meldingen", desc: "Voorraad- en defectmeldingen", icon: "alert" },
  { id: "trainingen", label: "Trainingen", desc: "Cursussen en uitleg", icon: "book" },
  { id: "crm", label: "CRM", desc: "Klanten, contactmomenten, taken en pipeline (team Concepts)", icon: "briefcase" },
];

export const ALL_MODULE_IDS = MODULES.map((m) => m.id);
const TENANT = "default"; // multi-tenant: later uit de tenant-resolver

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1-database (DB) niet geconfigureerd.");
  return env.DB;
}

// Aan-staande modules ophalen. Bij ontbrekende/corrupte config: alles aan (veilige default).
// Modules die nog niet bestonden toen de config werd opgeslagen ('modules_known')
// staan automatisch AAN tot een beheerder ze bewust uitzet — anders verdwijnen
// nieuwe modules (zoals nieuws/documenten in v167) stilletjes achter de guard.
export async function getEnabledModules(env: Env): Promise<string[]> {
  try {
    const rows = await db(env)
      .prepare("SELECT key, value FROM app_settings WHERE tenant_id=? AND key IN ('modules','modules_known')")
      .bind(TENANT)
      .all<{ key: string; value: string }>();
    const byKey = new Map((rows.results ?? []).map((r) => [r.key, r.value]));
    const rawModules = byKey.get("modules");
    if (!rawModules) return [...ALL_MODULE_IDS];
    const parsed = JSON.parse(rawModules);
    if (!Array.isArray(parsed)) return [...ALL_MODULE_IDS];
    let known: string[] = parsed;
    try {
      const rawKnown = byKey.get("modules_known");
      if (rawKnown) { const k = JSON.parse(rawKnown); if (Array.isArray(k)) known = k.map(String); }
    } catch { /* val terug op parsed */ }
    const knownSet = new Set(known);
    return ALL_MODULE_IDS.filter((id) => parsed.includes(id) || !knownSet.has(id));
  } catch {
    return [...ALL_MODULE_IDS];
  }
}

export async function setEnabledModules(env: Env, ids: string[]): Promise<void> {
  const clean = ALL_MODULE_IDS.filter((id) => ids.includes(id));
  const d = db(env);
  const upsert = `INSERT INTO app_settings (tenant_id, key, value, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(tenant_id, key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`;
  await d.batch([
    d.prepare(upsert).bind(TENANT, "modules", JSON.stringify(clean), Date.now()),
    // Vanaf nu weten we welke modules bestonden bij het opslaan (zie getEnabledModules).
    d.prepare(upsert).bind(TENANT, "modules_known", JSON.stringify(ALL_MODULE_IDS), Date.now()),
  ]);
}

// ---- Push-functies aan/uit (app_settings, "1"/"0") ----
export interface PushFeature { key: string; label: string; desc: string }
export const PUSH_FEATURES: PushFeature[] = [
  { key: "push_nieuws", label: "Nieuwsmeldingen", desc: "Push wanneer een nieuwsbericht wordt gepubliceerd (en de afzender 'push' aanvinkt)." },
  { key: "push_meldingen", label: "Wekelijkse meldingen-samenvatting", desc: "Maandagochtend een push naar de getagde collega's met openstaande voorraad-/defectmeldingen." },
  { key: "push_agenda", label: "Agenda-updates", desc: "Push wanneer een agenda-item wordt toegevoegd of gewijzigd." },
];

export async function getFlag(env: Env, key: string, def = true): Promise<boolean> {
  try {
    const row = await db(env)
      .prepare("SELECT value FROM app_settings WHERE tenant_id=? AND key=?")
      .bind(TENANT, key)
      .first<{ value: string }>();
    if (!row || row.value == null) return def;
    return row.value === "1" || row.value === "true";
  } catch {
    return def;
  }
}

export async function setFlag(env: Env, key: string, on: boolean): Promise<void> {
  await db(env)
    .prepare(
      `INSERT INTO app_settings (tenant_id, key, value, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(tenant_id, key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`,
    )
    .bind(TENANT, key, on ? "1" : "0", Date.now())
    .run();
}

export async function getFlags(env: Env, keys: string[]): Promise<Record<string, boolean>> {
  const out: Record<string, boolean> = {};
  for (const k of keys) out[k] = await getFlag(env, k, true);
  return out;
}

// ---- Volgorde van de modules in de zijbalk (app_settings 'module_order') ----
export async function getModuleOrder(env: Env): Promise<string[]> {
  let saved: string[] = [];
  try {
    const row = await db(env)
      .prepare("SELECT value FROM app_settings WHERE tenant_id=? AND key='module_order'")
      .bind(TENANT)
      .first<{ value: string }>();
    if (row?.value) { const p = JSON.parse(row.value); if (Array.isArray(p)) saved = p.map(String); }
  } catch { /* val terug op default */ }
  const known = saved.filter((id) => ALL_MODULE_IDS.includes(id));
  const rest = ALL_MODULE_IDS.filter((id) => !known.includes(id));
  return [...known, ...rest];
}

export async function setModuleOrder(env: Env, ids: string[]): Promise<void> {
  const clean = ids.filter((id) => ALL_MODULE_IDS.includes(id));
  const full = [...clean, ...ALL_MODULE_IDS.filter((id) => !clean.includes(id))];
  await db(env)
    .prepare(
      `INSERT INTO app_settings (tenant_id, key, value, updated_at) VALUES (?, 'module_order', ?, ?)
       ON CONFLICT(tenant_id, key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`,
    )
    .bind(TENANT, JSON.stringify(full), Date.now())
    .run();
}

// Verplaats één module omhoog/omlaag in de volgorde.
export async function moveModule(env: Env, id: string, dir: "up" | "down"): Promise<void> {
  const order = await getModuleOrder(env);
  const i = order.indexOf(id);
  if (i < 0) return;
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= order.length) return;
  [order[i], order[j]] = [order[j], order[i]];
  await setModuleOrder(env, order);
}

// Aan-staande modules in de ingestelde volgorde (voor nav-tokens + /api/modules).
export async function getEnabledOrdered(env: Env): Promise<string[]> {
  const [order, enabled] = await Promise.all([getModuleOrder(env), getEnabledModules(env)]);
  const set = new Set(enabled);
  return order.filter((id) => set.has(id));
}

// Alle modules in volgorde (voor het beheerscherm).
export async function getModulesOrdered(env: Env): Promise<ModuleDef[]> {
  const order = await getModuleOrder(env);
  return order.map((id) => MODULES.find((m) => m.id === id)).filter((m): m is ModuleDef => !!m);
}

// Rol-tokens voor de nav-filtering: een aan-staande module wordt "mod:<id>".
export function moduleRoleTokens(enabled: string[]): string[] {
  return enabled.map((id) => "mod:" + id);
}

export function isModuleOn(roles: string[], id: string): boolean {
  return roles.includes("mod:" + id);
}
