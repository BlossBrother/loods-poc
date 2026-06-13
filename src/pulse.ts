// Pulse-surveys (anoniem by design). Eén vraag tegelijk actief; verschijnt als kaart
// in de home-feed. Antwoorden staan in pulse_antwoorden ZONDER persoonskoppeling;
// dubbel-stemmen wordt voorkomen via pulse_stemmers met een onomkeerbare HMAC-hash
// van het e-mailadres (niet gekoppeld aan het antwoord). Resultaten pas tonen vanaf
// PULSE_DREMPEL respondenten (anonimiteit bij kleine groepen).
import type { Env } from "./airtable";

export const PULSE_DREMPEL = 5;

export interface PulseVraag {
  id: string;
  vraag: string;
  type: "schaal" | "keuze";
  opties: string[];
  actief: boolean;
  createdAt: number;
  closedAt?: number;
}

export interface PulseResultaat {
  vraag: PulseVraag;
  totaal: number;
  voldoende: boolean;
  verdeling: { label: string; aantal: number }[];
  gemiddelde?: number;
}

const TENANT = "default";

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1 (DB) ontbreekt");
  return env.DB;
}

function rowToVraag(r: Record<string, unknown>): PulseVraag {
  let opties: string[] = [];
  try {
    const a = JSON.parse(String(r.opties ?? "[]"));
    if (Array.isArray(a)) opties = a.map((x) => String(x));
  } catch {
    /* geen opties */
  }
  return {
    id: String(r.id),
    vraag: String(r.vraag),
    type: r.type === "keuze" ? "keuze" : "schaal",
    opties,
    actief: !!r.actief,
    createdAt: Number(r.created_at),
    closedAt: r.closed_at == null ? undefined : Number(r.closed_at),
  };
}

// Onomkeerbare, anonieme stem-marker (HMAC met PORTAL_SECRET als sleutel).
async function stemmerHash(env: Env, email: string): Promise<string> {
  const secret = env.PORTAL_SECRET || "ff-pulse-fallback-salt";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("pulse:" + email.toLowerCase().trim()));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getActievePulse(env: Env): Promise<PulseVraag | null> {
  try {
    const r = await db(env)
      .prepare("SELECT * FROM pulse_vragen WHERE tenant_id=? AND actief=1 ORDER BY created_at DESC LIMIT 1")
      .bind(TENANT)
      .first<Record<string, unknown>>();
    return r ? rowToVraag(r) : null;
  } catch {
    return null;
  }
}

export async function heeftGestemd(env: Env, vraagId: string, email: string | undefined): Promise<boolean> {
  if (!email) return false;
  try {
    const h = await stemmerHash(env, email);
    const r = await db(env)
      .prepare("SELECT 1 AS x FROM pulse_stemmers WHERE tenant_id=? AND vraag_id=? AND stemmer_hash=?")
      .bind(TENANT, vraagId, h)
      .first();
    return !!r;
  } catch {
    return false;
  }
}

// Stem anoniem. Zet eerst de (onomkeerbare) marker; alleen als die nieuw is, wordt
// het antwoord weggeschreven. Retourneert false als er al gestemd was.
export async function stem(env: Env, vraagId: string, email: string, waarde: string): Promise<boolean> {
  const h = await stemmerHash(env, email);
  const ins = await db(env)
    .prepare("INSERT OR IGNORE INTO pulse_stemmers (tenant_id, vraag_id, stemmer_hash, created_at) VALUES (?,?,?,?)")
    .bind(TENANT, vraagId, h, Date.now())
    .run();
  if (!(ins.meta?.changes ?? 0)) return false;
  await db(env)
    .prepare("INSERT INTO pulse_antwoorden (id, tenant_id, vraag_id, waarde, created_at) VALUES (?,?,?,?,?)")
    .bind("pa" + crypto.randomUUID().replace(/-/g, ""), TENANT, vraagId, waarde, Date.now())
    .run();
  return true;
}

export async function pulseResultaat(env: Env, vraag: PulseVraag): Promise<PulseResultaat> {
  const rs = await db(env)
    .prepare("SELECT waarde, COUNT(*) AS n FROM pulse_antwoorden WHERE tenant_id=? AND vraag_id=? GROUP BY waarde")
    .bind(TENANT, vraag.id)
    .all<{ waarde: string; n: number }>();
  const tel = new Map<string, number>();
  let totaal = 0;
  for (const r of rs.results ?? []) {
    tel.set(String(r.waarde), Number(r.n));
    totaal += Number(r.n);
  }
  const labels = vraag.type === "schaal" ? ["1", "2", "3", "4", "5"] : vraag.opties;
  const verdeling = labels.map((l) => ({ label: l, aantal: tel.get(l) ?? 0 }));
  let gemiddelde: number | undefined;
  if (vraag.type === "schaal" && totaal > 0) {
    let som = 0;
    for (const l of ["1", "2", "3", "4", "5"]) som += Number(l) * (tel.get(l) ?? 0);
    gemiddelde = som / totaal;
  }
  return { vraag, totaal, voldoende: totaal >= PULSE_DREMPEL, verdeling, gemiddelde };
}

export async function listPulse(env: Env): Promise<PulseVraag[]> {
  try {
    const rs = await db(env).prepare("SELECT * FROM pulse_vragen WHERE tenant_id=? ORDER BY created_at DESC").bind(TENANT).all<Record<string, unknown>>();
    return (rs.results ?? []).map(rowToVraag);
  } catch {
    return [];
  }
}

export async function createPulse(env: Env, vraag: string, type: "schaal" | "keuze", opties: string[]): Promise<void> {
  // Eén actieve vraag tegelijk: bestaande actieve vragen eerst sluiten.
  await db(env).prepare("UPDATE pulse_vragen SET actief=0, closed_at=? WHERE tenant_id=? AND actief=1").bind(Date.now(), TENANT).run();
  await db(env)
    .prepare("INSERT INTO pulse_vragen (id, tenant_id, vraag, type, opties, actief, created_at) VALUES (?,?,?,?,?,1,?)")
    .bind("pv" + crypto.randomUUID().replace(/-/g, ""), TENANT, vraag, type, JSON.stringify(opties), Date.now())
    .run();
}

export async function sluitPulse(env: Env, id: string): Promise<void> {
  await db(env).prepare("UPDATE pulse_vragen SET actief=0, closed_at=? WHERE tenant_id=? AND id=?").bind(Date.now(), TENANT, id).run();
}
