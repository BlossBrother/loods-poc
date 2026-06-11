// Notificatiecentrum (Stroom-plan 4.2): historie (read/unread) + voorkeuren per module.
import { html } from "hono/html";
import { emptyState, pageTitle } from "./templates";
import { lds, eyebrow } from "./loods";
import type { NotifRij } from "../notify";
import { NOTIF_MODULES } from "../notify";

function relTijd(ms: number): string {
  const d = new Date(ms);
  const nu = new Date();
  const tijd = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", hour: "2-digit", minute: "2-digit" }).format(d);
  const dagMs = 24 * 60 * 60 * 1000;
  if (nu.getTime() - ms < dagMs && nu.getDate() === d.getDate()) return `vandaag ${tijd}`;
  if (nu.getTime() - ms < 2 * dagMs) return `gisteren ${tijd}`;
  return new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", day: "numeric", month: "short" }).format(d) + ` ${tijd}`;
}

const MODULE_LABEL: Record<string, string> = { agenda: "Agenda", nieuws: "Nieuws", prikbord: "Prikbord", meldingen: "Meldingen" };

export function notificatiesPage(rijen: NotifRij[], prefs: Record<string, boolean>, unread: number) {
  return lds(html`
    ${pageTitle("bell", "Notificaties")}
    ${unread > 0
      ? html`<form method="post" action="/notificaties/gelezen" style="margin:0 0 12px" data-no-queue>
          <input type="hidden" name="alles" value="1" />
          <button class="btn-soft btn" style="margin:0;padding:8px 14px;font-size:.85rem">Alles als gelezen markeren (${unread})</button>
        </form>`
      : ""}
    ${rijen.length === 0
      ? emptyState({ icon: "alert", title: "Nog geen notificaties", text: "Nieuwe events, nieuws en meldingen verschijnen hier." })
      : html`<article class="card listcard"><ul class="clean">${rijen.map((r) => html`<li style="padding:0">
          <a href="/notificaties/open/${r.id}" style="display:block;text-decoration:none;color:inherit;padding:12px 2px;${r.read_at ? "opacity:.72" : ""}">
            <span style="display:flex;align-items:center;gap:8px">
              ${r.read_at ? "" : html`<span style="width:8px;height:8px;border-radius:50%;background:var(--t-ink);flex:none"></span>`}
              <strong style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.titel}</strong>
              <span class="chip" style="flex:none">${MODULE_LABEL[r.module] ?? r.module}</span>
            </span>
            ${r.body ? html`<span class="muted" style="display:block;margin-top:2px;font-size:.86rem">${r.body}</span>` : ""}
            <span class="muted" style="display:block;margin-top:2px;font-size:.76rem">${relTijd(r.created_at)}</span>
          </a>
        </li>`)}</ul></article>`}

    ${eyebrow("Voorkeuren")}
    <form method="post" action="/notificaties/prefs" class="card" data-no-queue>
      <p class="muted" style="margin-top:0;font-size:.85rem">Kies per onderwerp of je pushmeldingen wilt ontvangen. Dit staat los van het aanmelden van dit apparaat (zie Mijn account).</p>
      ${NOTIF_MODULES.map((m) => html`<label class="row" style="gap:10px;font-weight:600;margin:10px 0">
        <input type="checkbox" name="mod_${m.key}" ${prefs[m.key] ? "checked" : ""} /> ${m.label}
      </label>`)}
      <button type="submit">Voorkeuren opslaan</button>
    </form>
  `);
}
