import { html } from "hono/html";
import { emptyState, pageTitle } from "./templates";
import { lds } from "./loods";
import type { Bugmelding } from "../bugmelding";
import { BUG_STATUS } from "../bugmelding";
import { formatDatumTijd } from "../tz";

const STATUS_LABEL: Record<string, string> = {
  open: "Open", in_behandeling: "In behandeling", opgelost: "Opgelost", afgewezen: "Afgewezen",
};

export function bugPagina(opts: { melding?: string } = {}) {
  return lds(html`
    ${pageTitle("bug", "Feedback geven")}
    <p class="muted">Bug gezien, een idee, of iets anders? Laat het hier weten — je melding komt bij de beheerders terecht.</p>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    <form method="post" action="/bug" enctype="multipart/form-data" class="card">
      <label>Soort
        <select name="categorie">
          <option value="bug">Bug / probleem</option>
          <option value="idee">Idee / verbetering</option>
          <option value="anders">Anders</option>
        </select>
      </label>
      <label>Waar gaat het over? <input name="titel" required maxlength="140" placeholder="Korte omschrijving" /></label>
      <label>Toelichting <textarea name="omschrijving" rows="4" placeholder="Wat deed je, wat verwachtte je, wat gebeurde er?"></textarea></label>
      <label>Schermafbeelding (optioneel) <input name="screenshot" type="file" accept="image/*" /></label>
      <button type="submit">Versturen</button>
    </form>
    <p class="muted"><a href="/">← terug</a></p>
  `);
}

const CAT_LABEL: Record<string, string> = { bug: "Bug", idee: "Idee", anders: "Anders" };

export function beheerBugs(bugs: Bugmelding[], opts: { melding?: string } = {}) {
  return html`
    <h1>Bugmeldingen</h1>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    ${bugs.length === 0
      ? emptyState({ icon: "bug", title: "Geen bugmeldingen" })
      : html`<ul class="clean">${bugs.map((b) => html`<li style="padding:12px 2px;border-bottom:1px solid var(--line)">
          <div class="row-top wrap" style="gap:10px">
            <div class="grow">
              <strong>${b.titel}</strong> <span class="chip">${STATUS_LABEL[b.status] ?? b.status}</span>${b.categorie ? html` <span class="chip" style="color:var(--berry)">${CAT_LABEL[b.categorie] ?? b.categorie}</span>` : ""}
              ${b.omschrijving ? html`<div class="muted" style="margin-top:2px;white-space:pre-wrap">${b.omschrijving}</div>` : ""}
              <div class="muted" style="font-size:.76rem;margin-top:3px">${b.melder_naam ?? "onbekend"} · ${formatDatumTijd(new Date(b.created_at).toISOString())}</div>
              ${b.screenshot_key ? html`<a href="/bestand?k=${encodeURIComponent(b.screenshot_key)}" target="_blank"><img src="/bestand?k=${encodeURIComponent(b.screenshot_key)}" alt="screenshot" style="max-width:220px;max-height:160px;border-radius:10px;border:1px solid var(--line);margin-top:var(--sp-2)" /></a>` : ""}
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <form method="post" action="/beheer/bugmeldingen/status" style="margin:0;display:flex;gap:6px">
                <input type="hidden" name="id" value="${b.id}" />
                <select name="status" style="margin:0;width:auto">
                  ${BUG_STATUS.map((s) => html`<option value="${s}" ${s === b.status ? "selected" : ""}>${STATUS_LABEL[s]}</option>`)}
                </select>
                <button class="btn-soft btn" style="margin:0;padding:7px 12px">Opslaan</button>
              </form>
              <form method="post" action="/beheer/bugmeldingen/verwijder" style="margin:0" onsubmit="return confirm('Bugmelding verwijderen?')">
                <input type="hidden" name="id" value="${b.id}" />
                <button class="btn-berry btn" style="margin:0;padding:7px 12px">Verwijderen</button>
              </form>
            </div>
          </div>
        </li>`)}</ul>`}
    <p class="muted"><a href="/beheer">← beheer</a></p>
  `;
}
