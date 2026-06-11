// Aanwezigheid "wie is er vandaag" (spoor B2, v185 — BLOK-F-light).
// AVG-dataminimalisatie: alleen de status van vandáág wordt bewaard; oudere dagen
// wist de cron (geen bewegingshistorie, geen volgsysteem). Afwezigheid komt uit het
// Buddee-verlofoverzicht (tabel `verlof`); de zelfgekozen status uit
// `aanwezigheid_status` (migratie 0019).
import type { Env } from "./airtable";
import { getActiveMedewerkers, getVerlofInRange } from "./verlof";

const TENANT = "default";

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1-database (DB) niet geconfigureerd.");
  return env.DB;
}

export const AANW_STATUSSEN = [
  { key: "kantoor", label: "Op kantoor" },
  { key: "thuis", label: "Thuis" },
  { key: "onderweg", label: "Op pad" },
  { key: "afwezig", label: "Afwezig" },
] as const;
export type AanwStatus = (typeof AANW_STATUSSEN)[number]["key"];

export function isAanwStatus(s: string): s is AanwStatus {
  return AANW_STATUSSEN.some((x) => x.key === s);
}

// Vandaag als YYYY-MM-DD in Europe/Amsterdam (zelfde aanpak als de agenda).
export function dagAms(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(d);
}

// Status zetten of (bij lege status) wissen — geldt alleen voor vandaag.
export async function zetStatus(env: Env, email: string, naam: string, status: AanwStatus | "", dag = dagAms()): Promise<void> {
  if (!status) {
    await db(env)
      .prepare("DELETE FROM aanwezigheid_status WHERE tenant_id=? AND email=? AND dag=?")
      .bind(TENANT, email.toLowerCase(), dag)
      .run();
    return;
  }
  await db(env)
    .prepare(
      `INSERT INTO aanwezigheid_status (tenant_id, email, naam, dag, status, updated_at) VALUES (?,?,?,?,?,?)
       ON CONFLICT(tenant_id, email, dag) DO UPDATE SET status=excluded.status, naam=excluded.naam, updated_at=excluded.updated_at`,
    )
    .bind(TENANT, email.toLowerCase(), naam, dag, status, Date.now())
    .run();
}

export interface VandaagRij {
  naam: string;
  email: string;
  afdeling: string;
  status: AanwStatus | null;   // zelfgekozen status (vandaag)
  verlof: string | null;       // verloftype uit Buddee, of null
}

export async function wieIsErVandaag(env: Env): Promise<{ dag: string; rijen: VandaagRij[] }> {
  const dag = dagAms();
  // Dag-overlap ruim nemen (zelfde +02:00-aanpak als de Buddee-mapping).
  const start = Date.parse(`${dag}T00:00:00+02:00`);
  const eind = Date.parse(`${dag}T23:59:59+02:00`);
  const [team, verlof, st] = await Promise.all([
    getActiveMedewerkers(env),
    getVerlofInRange(env, start, eind),
    db(env)
      .prepare("SELECT email, status FROM aanwezigheid_status WHERE tenant_id=? AND dag=?")
      .bind(TENANT, dag)
      .all<{ email: string; status: string }>(),
  ]);
  const verlofVan = new Map<string, string>();
  for (const v of verlof) if (v.employee_email) verlofVan.set(v.employee_email.toLowerCase(), v.type ?? "verlof");
  const stVan = new Map<string, string>((st.results ?? []).map((x) => [x.email, x.status]));
  const rijen: VandaagRij[] = team
    .filter((m) => m.email)
    .map((m) => {
      const e = m.email.toLowerCase();
      const s = stVan.get(e) ?? "";
      return {
        naam: m.naam,
        email: m.email,
        afdeling: m.afdeling,
        status: isAanwStatus(s) ? s : null,
        verlof: verlofVan.get(e) ?? null,
      };
    });
  return { dag, rijen };
}

// AVG: geen historie — alles vóór vandaag wissen (cron, dagelijks).
export async function opschoonAanwezigheid(env: Env): Promise<number> {
  const r = await db(env).prepare("DELETE FROM aanwezigheid_status WHERE dag < ?").bind(dagAms()).run();
  return (r.meta as { changes?: number } | undefined)?.changes ?? 0;
}
