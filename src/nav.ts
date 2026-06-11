// Navigatie-config (tenant-scoped): groepen + per module {group, order}. Eén bron die
// zowel het beheerscherm als de zijbalk voedt. Opgeslagen in D1 app_settings:
//   key 'nav_groups'        -> JSON NavGroup[]
//   key 'nav_module_groups' -> JSON Record<moduleKey, { group: string; order: number }>
// De aan/uit-stand blijft in 'modules' (zie modules.ts). Onbekende/lege config -> defaults.
import type { Env } from "./airtable";
import { MODULES, ALL_MODULE_IDS, getEnabledModules } from "./modules";

const TENANT = "default";

export interface NavGroup { id: string; naam: string; order: number }
export interface NavModule { key: string; label: string; icon: string; group: string; order: number; enabled: boolean }
export interface NavLayout { groups: NavGroup[]; modules: NavModule[] }

export const DEFAULT_GROUPS: NavGroup[] = [
  { id: "werk", naam: "Werk", order: 0 },
  { id: "fun", naam: "Fun", order: 1 },
  { id: "persoonlijk", naam: "Persoonlijk", order: 2 },
];

const DEFAULT_MODULE_GROUP: Record<string, string> = {
  nieuws: "werk", documenten: "werk",
  agenda: "werk", prikbord: "werk", meldingen: "werk", kantine: "werk", crm: "werk",
  competitie: "fun",
  team: "persoonlijk", trainingen: "persoonlijk",
};

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1-database (DB) niet geconfigureerd.");
  return env.DB;
}

async function readJson<T>(env: Env, key: string): Promise<T | undefined> {
  try {
    const row = await db(env).prepare("SELECT value FROM app_settings WHERE tenant_id=? AND key=?").bind(TENANT, key).first<{ value: string }>();
    if (!row?.value) return undefined;
    return JSON.parse(row.value) as T;
  } catch { return undefined; }
}

async function writeJson(env: Env, key: string, value: unknown): Promise<void> {
  await db(env).prepare(
    `INSERT INTO app_settings (tenant_id, key, value, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(tenant_id, key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`,
  ).bind(TENANT, key, JSON.stringify(value), Date.now()).run();
}

export async function getNavGroups(env: Env): Promise<NavGroup[]> {
  const saved = await readJson<NavGroup[]>(env, "nav_groups");
  const groups = Array.isArray(saved) && saved.length
    ? saved.filter((g) => g && typeof g.id === "string" && typeof g.naam === "string").map((g, i) => ({ id: g.id, naam: g.naam, order: typeof g.order === "number" ? g.order : i }))
    : DEFAULT_GROUPS.slice();
  return groups.sort((a, b) => a.order - b.order);
}

// Volledig opgeloste indeling: groepen + alle modules met group/order/enabled.
export async function getNavLayout(env: Env): Promise<NavLayout> {
  const [groups, map, enabledList] = await Promise.all([
    getNavGroups(env),
    readJson<Record<string, { group: string; order: number }>>(env, "nav_module_groups"),
    getEnabledModules(env),
  ]);
  const enabled = new Set(enabledList);
  const groupIds = new Set(groups.map((g) => g.id));
  const fallbackGroup = groups[0]?.id ?? "werk";
  const m = map ?? {};
  const modules: NavModule[] = MODULES.map((def, i) => {
    const cfg = m[def.id];
    let group = cfg?.group ?? DEFAULT_MODULE_GROUP[def.id] ?? fallbackGroup;
    if (!groupIds.has(group)) group = fallbackGroup;
    const order = typeof cfg?.order === "number" ? cfg.order : i;
    return { key: def.id, label: def.label, icon: def.icon, group, order, enabled: enabled.has(def.id) };
  });
  modules.sort((a, b) => (a.order - b.order) || a.label.localeCompare(b.label));
  return { groups, modules };
}

// Aan-staande module-keys in zichtbare volgorde (groep-volgorde, dan order binnen groep).
export async function getNavOrderedEnabled(env: Env): Promise<string[]> {
  const { groups, modules } = await getNavLayout(env);
  const gpos = new Map(groups.map((g, i) => [g.id, i]));
  return modules
    .filter((mod) => mod.enabled)
    .sort((a, b) => ((gpos.get(a.group) ?? 99) - (gpos.get(b.group) ?? 99)) || (a.order - b.order))
    .map((mod) => mod.key);
}

// Opslaan vanuit het beheerscherm.
export async function saveNavGroups(env: Env, groups: NavGroup[]): Promise<void> {
  const clean = groups
    .filter((g) => g && typeof g.id === "string" && g.id && typeof g.naam === "string")
    .map((g, i) => ({ id: g.id, naam: g.naam.slice(0, 40), order: i }));
  await writeJson(env, "nav_groups", clean.length ? clean : DEFAULT_GROUPS);
}

export async function saveModuleGroups(env: Env, map: Record<string, { group: string; order: number }>): Promise<void> {
  const clean: Record<string, { group: string; order: number }> = {};
  for (const id of ALL_MODULE_IDS) {
    const v = map[id];
    if (v && typeof v.group === "string") clean[id] = { group: v.group, order: typeof v.order === "number" ? v.order : 0 };
  }
  await writeJson(env, "nav_module_groups", clean);
}

// Compact payload voor de zijbalk (als één rol-token gecodeerd, zie index.ts middleware).
// m = [key, groupId, enabled(1/0)] voor ALLE modules in weergavevolgorde (groep, dan order),
// zodat de zijbalk alles rendert (uit-modules verborgen) en de /api/modules-sync kan bijwerken.
export interface NavPayload { g: [string, string][]; m: [string, string, number][] }
export function navSidebarPayload(layout: NavLayout): NavPayload {
  const gpos = new Map(layout.groups.map((grp, i) => [grp.id, i]));
  const mods = layout.modules.slice().sort((a, b) => ((gpos.get(a.group) ?? 99) - (gpos.get(b.group) ?? 99)) || (a.order - b.order));
  return {
    g: layout.groups.map((grp) => [grp.id, grp.naam] as [string, string]),
    m: mods.map((mod) => [mod.key, mod.group, mod.enabled ? 1 : 0] as [string, string, number]),
  };
}
