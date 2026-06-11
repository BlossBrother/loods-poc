// Licht audit-spoor: wie deed wat (binnen de tenant). Onderdeel van de
// compliance-laag; faalt nooit hard (best-effort logging).
import type { Env } from "./airtable";
const TENANT = "default";
export async function logAudit(
  env: Env, actor: string | undefined, action: string, entity: string, entityId: string,
): Promise<void> {
  try {
    if (!env.DB) return;
    await env.DB
      .prepare("INSERT INTO audit_log (id, tenant_id, actor, action, entity, entity_id, created_at) VALUES (?,?,?,?,?,?,?)")
      .bind("au" + crypto.randomUUID().replace(/-/g, ""), TENANT, actor ?? null, action, entity, entityId, Date.now())
      .run();
  } catch { /* best-effort */ }
}
