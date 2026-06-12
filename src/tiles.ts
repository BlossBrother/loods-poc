// Beheerbare app-snelkoppelingen (de "tiles"/chips op home: Buddee, TimeChimp,
// WK-poule, en zelf toe te voegen links). Opslag als JSON in app_settings, zelfde
// patroon als headercfg/modules/nav. Standaard = exact de bestaande env-tiles, zodat
// zonder config niets verandert. Hiermee kan een beheerder links wijzigen, verbergen
// of toevoegen ZONDER code-wijziging/deploy (bv. WK-poule verbergen na het WK).
import type { Env } from "./airtable";

export interface Tile {
  label: string;
  url: string;
  icon: string;
  enabled: boolean;
}

// Iconen die in de home-chips bestaan (zie CHIP_ICON/svg-set). Beperkte, veilige keuze.
export const TILE_ICONS = ["link", "ball", "users", "clock", "cal", "coffee", "book", "award", "brief", "file", "bell"] as const;

const TENANT = "default";
const KEY = "snelkoppelingen";

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1 (DB) ontbreekt");
  return env.DB;
}

// Standaard-tiles uit de env-config (ongewijzigd gedrag als er niets is opgeslagen).
export function defaultTiles(env: Env): Tile[] {
  return [
    { label: "WK-poule", url: env.WK_POULE_URL || "https://www.scorito.com", icon: "ball", enabled: true },
    { label: "Buddee", url: env.BUDDEE_URL || "https://app.buddee.nl", icon: "users", enabled: true },
    { label: "TimeChimp", url: env.TIMECHIMP_URL || "https://app.timechimp.com", icon: "clock", enabled: true },
  ];
}

// Veilige link: alleen http(s) of een intern pad. Weert javascript:/data: enz.
function veiligeUrl(u: string): string | null {
  const t = (u || "").trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("/") && !t.startsWith("//")) return t;
  return null;
}

function normaliseer(arr: unknown, env: Env): Tile[] {
  if (!Array.isArray(arr)) return defaultTiles(env);
  const out: Tile[] = [];
  for (const x of arr) {
    const t = x as Partial<Tile>;
    const label = String(t.label ?? "").trim().slice(0, 40);
    const url = veiligeUrl(String(t.url ?? ""));
    if (!label || !url) continue;
    const icon = TILE_ICONS.includes(String(t.icon) as (typeof TILE_ICONS)[number]) ? String(t.icon) : "link";
    out.push({ label, url, icon, enabled: t.enabled !== false });
  }
  return out;
}

export async function getTiles(env: Env): Promise<Tile[]> {
  try {
    const row = await db(env)
      .prepare("SELECT value FROM app_settings WHERE tenant_id=? AND key=?")
      .bind(TENANT, KEY)
      .first<{ value: string }>();
    if (row?.value) {
      const parsed = JSON.parse(row.value);
      const tiles = normaliseer(parsed, env);
      // Lege/ongeldige opslag -> terug naar default (nooit een lege rij tonen).
      if (tiles.length) return tiles;
    }
  } catch {
    /* val terug op default */
  }
  return defaultTiles(env);
}

export async function saveTiles(env: Env, tiles: unknown): Promise<void> {
  const schoon = normaliseer(tiles, env);
  await db(env)
    .prepare(
      "INSERT INTO app_settings (tenant_id, key, value, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(tenant_id, key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at",
    )
    .bind(TENANT, KEY, JSON.stringify(schoon), Date.now())
    .run();
}

export async function resetTiles(env: Env): Promise<void> {
  try {
    await db(env).prepare("DELETE FROM app_settings WHERE tenant_id=? AND key=?").bind(TENANT, KEY).run();
  } catch {
    /* niets opgeslagen */
  }
}
