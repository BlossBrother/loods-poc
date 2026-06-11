// Audit-log (Stroom-plan 4.5): gefilterde tabel voor beheerders + CSV-export.
// De logging zelf (logAudit) en de 12-maanden-retentie bestonden al.
import { html } from "hono/html";
import { emptyState } from "./templates";
import { formatDatumTijd } from "../tz";

export interface AuditRij { id: string; actor: string | null; action: string; entity: string; entity_id: string; created_at: number }

export const AUDIT_ACTIES = ["", "delete", "restore", "close", "create", "update"] as const;
const ACTIE_LABEL: Record<string, string> = { "": "Alle acties", delete: "Verwijderd", restore: "Hersteld", close: "Gesloten", create: "Aangemaakt", update: "Gewijzigd" };

export function auditPage(rijen: AuditRij[], f: { q: string; actie: string; dagen: number }) {
  const qs = (extra: string) => `/beheer/audit.csv?q=${encodeURIComponent(f.q)}&actie=${encodeURIComponent(f.actie)}&dagen=${f.dagen}${extra}`;
  return html`
    <h1>Audit-log</h1>
    <p class="page-intro">Wie deed wat en wanneer. Bewaartermijn: 12 maanden (daarna automatisch gewist).</p>
    <form method="get" action="/beheer/audit" class="card" style="display:flex;gap:9px;flex-wrap:wrap;align-items:flex-end">
      <label style="flex:1 1 180px;margin:0">Zoek <input name="q" value="${f.q}" placeholder="persoon, entiteit of id" style="margin-top:4px" /></label>
      <label style="margin:0">Actie
        <select name="actie" style="margin-top:4px;width:auto">
          ${AUDIT_ACTIES.map((a) => html`<option value="${a}" ${a === f.actie ? "selected" : ""}>${ACTIE_LABEL[a] ?? a}</option>`)}
        </select>
      </label>
      <label style="margin:0">Periode
        <select name="dagen" style="margin-top:4px;width:auto">
          <option value="7" ${f.dagen === 7 ? "selected" : ""}>7 dagen</option>
          <option value="30" ${f.dagen === 30 ? "selected" : ""}>30 dagen</option>
          <option value="365" ${f.dagen === 365 ? "selected" : ""}>12 maanden</option>
        </select>
      </label>
      <button type="submit" style="margin:0">Filter</button>
      <a class="btn btn-soft" href="${qs("")}" style="margin:0">Export CSV</a>
    </form>
    ${rijen.length === 0
      ? emptyState({ icon: "cog", title: "Geen audit-regels", text: "Binnen dit filter is niets gelogd." })
      : html`<table>
          <tr><th>Wanneer</th><th>Wie</th><th>Actie</th><th>Entiteit</th><th>Id</th></tr>
          ${rijen.map((r) => html`<tr>
            <td style="white-space:nowrap">${formatDatumTijd(new Date(r.created_at).toISOString())}</td>
            <td style="text-align:left">${r.actor ?? "—"}</td>
            <td>${ACTIE_LABEL[r.action] ?? r.action}</td>
            <td>${r.entity}</td>
            <td class="muted" style="font-size:.74rem;max-width:130px;overflow:hidden;text-overflow:ellipsis">${r.entity_id}</td>
          </tr>`)}
        </table>`}
    <p class="muted" style="margin-top:14px"><a href="/beheer">← beheer</a></p>
  `;
}
