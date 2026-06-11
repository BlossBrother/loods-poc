// Cloudflare Access-groep-sync (v187): de Access-groep "Uitzendkrachten" volgt
// automatisch de medewerkers met rol Uitzendkracht (actief + e-mail). Eén bron van
// waarheid: Beheer → Medewerkers — Cloudflare hoeft nooit meer handmatig bijgewerkt.
//
// Eenmalige setup (PJ) — dashboard-routes per juni 2026 (Cloudflare One):
//   1. one.dash.cloudflare.com → Access controls → Policies → tab "Rule groups" →
//      groep "Uitzendkrachten" aanmaken (inhoud maakt niet uit; wordt overschreven).
//      Het groeps-ID staat in de URL/API.
//   2. Integrations → Identity providers → "Add new" → One-time PIN aanzetten, en
//      de Allow-policy op de intranet-app (Access controls → Applications) laten
//      verwijzen naar de groep (Include → Rule groups → Uitzendkrachten).
//   3. dash.cloudflare.com → My Profile → API Tokens → Create Token, met permissie
//      Account → "Access: Organizations, Identity Providers, and Groups" → Edit,
//      beperkt tot het Fresh Forward-account. Daarna:
//        npx wrangler secret put CF_API_TOKEN
//      en CF_ACCOUNT_ID + CF_ACCESS_GROUP_ID invullen in wrangler.toml [vars].
//
// Zonder die drie waarden doet de sync stil niets (beheer blijft gewoon werken).
import type { Env } from "./airtable";
import { getMedewerkers } from "./airtable";

export function accessSyncGeconfigureerd(env: Env): boolean {
  return !!(env.CF_API_TOKEN && env.CF_ACCOUNT_ID && env.CF_ACCESS_GROUP_ID);
}

// Synct de groep met de actuele lijst. Idempotent: de hele include-lijst wordt
// vervangen, dus een gemiste sync wordt bij de volgende (of de dagelijkse cron)
// vanzelf gerepareerd. Deactiveren of rol wijzigen = adres verdwijnt uit de groep.
export async function syncAccessUitzendkrachten(env: Env): Promise<{ ok: boolean; aantal: number; error?: string }> {
  if (!accessSyncGeconfigureerd(env)) return { ok: true, aantal: 0 };
  try {
    const medewerkers = await getMedewerkers(env);
    const emails = medewerkers
      .filter((m) => m.fields.Actief !== false && m.fields.Rol === "Uitzendkracht" && m.fields["E-mail"])
      .map((m) => String(m.fields["E-mail"]).trim().toLowerCase())
      .filter((e, i, a) => !!e && a.indexOf(e) === i);
    const base = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/access/groups/${env.CF_ACCESS_GROUP_ID}`;
    const headers = { Authorization: `Bearer ${env.CF_API_TOKEN}`, "Content-Type": "application/json" };
    // Groepsnaam behouden: eerst lezen, dan alleen de include-lijst vervangen.
    const cur = await fetch(base, { headers });
    if (!cur.ok) return { ok: false, aantal: emails.length, error: `groep lezen faalde (${cur.status})` };
    const curJson = (await cur.json()) as { result?: { name?: string } };
    const name = curJson.result?.name ?? "Uitzendkrachten";
    // Een lege include-lijst is niet toegestaan: gebruik dan één onbestaanbaar adres
    // (.invalid-TLD bestaat per definitie niet) zodat de groep niemand matcht.
    const include = emails.length
      ? emails.map((e) => ({ email: { email: e } }))
      : [{ email: { email: "niemand@ongeldig.invalid" } }];
    const put = await fetch(base, { method: "PUT", headers, body: JSON.stringify({ name, include }) });
    if (!put.ok) return { ok: false, aantal: emails.length, error: `groep bijwerken faalde (${put.status})` };
    return { ok: true, aantal: emails.length };
  } catch (e) {
    return { ok: false, aantal: 0, error: String(e) };
  }
}
