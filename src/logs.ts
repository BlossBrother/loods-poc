// Lichte logging naar Cloudflare D1 (optioneel). Zonder DB-binding logt de app
// alleen naar de console, zodat de app ook werkt vóórdat D1 is aangemaakt.
//
// Aanmaken (eenmalig):
//   npx wrangler d1 create ff-logs
//   -> database_id invullen in wrangler.toml ([[d1_databases]]) en de binding activeren
//   npx wrangler d1 execute ff-logs --remote --file=./migrations/0001_events.sql

import type { Env } from "./airtable";

export interface LogEvent {
  type: string; // bijv. "bezoek_incheck", "bezoek_uitcheck", "portaal_login"
  ref?: string; // record-id of e-mail waar het over gaat
  detail?: string; // vrije omschrijving
  actor?: string; // wie de actie deed (e-mail), indien bekend
}

export async function logEvent(env: Env, e: LogEvent): Promise<void> {
  if (!env.DB) {
    console.log(`[log] ${e.type} ref=${e.ref ?? ""} actor=${e.actor ?? ""} ${e.detail ?? ""}`);
    return;
  }
  try {
    await env.DB.prepare(
      "INSERT INTO events (ts, type, ref, detail, actor) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(new Date().toISOString(), e.type, e.ref ?? null, e.detail ?? null, e.actor ?? null)
      .run();
  } catch (err) {
    // Logging mag de gebruikersactie nooit laten falen.
    console.error("[log] D1 schrijven faalde:", err);
  }
}
