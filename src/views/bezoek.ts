import { html } from "hono/html";
import type {
  AirtableRecord,
  BezoekFields,
  ReceptieFields,
} from "../airtable";
import { formatTijd } from "../tz";

const REDENEN = ["Vergadering", "Levering", "Sollicitatie", "Onderhoud", "Anders"];

export function bezoekPage(
  vandaag: AirtableRecord<BezoekFields>[],
  receptie: AirtableRecord<ReceptieFields>[],
  opts: { melding?: string; receptieFout?: string } = {},
) {
  return html`
    <h1>Bezoekmelding</h1>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}

    <form method="post" action="/bezoek" class="card">
      <label>Bezoeker <input name="bezoeker" required /></label>
      <label>Bedrijf <input name="bedrijf" /></label>
      <label>E-mail <input name="email" type="email" /></label>
      <label>Verwacht op <input name="verwacht_op" type="datetime-local" required /></label>
      <label>Reden
        <select name="reden">
          ${REDENEN.map((r) => html`<option>${r}</option>`)}
        </select>
      </label>
      <label>Opmerkingen <textarea name="opmerkingen" rows="2"></textarea></label>
      <button type="submit">Aanmelden</button>
    </form>

    <h2>Verwacht vandaag</h2>
    ${vandaag.length === 0
      ? html`<p class="muted">Nog geen bezoekers vooraf aangemeld voor vandaag.</p>`
      : html`<ul class="clean">
          ${vandaag.map((b) => {
            const status = b.fields.Status ?? "Verwacht";
            return html`<li class="row wrap" style="gap:10px">
              <span class="grow">
                <strong>${b.fields.Bezoeker ?? "(onbekend)"}</strong>
                ${b.fields.Bedrijf ? html`(${b.fields.Bedrijf})` : ""}<br />
                <span class="muted">${formatTijd(b.fields["Verwacht op"])} uur · ${status}</span>
              </span>
              ${status === "Verwacht"
                ? html`<form method="post" action="/bezoek/incheck" style="margin:0">
                    <input type="hidden" name="id" value="${b.id}" />
                    <button type="submit" style="margin:0;padding:8px 14px">Inchecken</button>
                  </form>`
                : status === "Ingecheckt"
                  ? html`<form method="post" action="/bezoek/uitcheck" style="margin:0">
                      <input type="hidden" name="id" value="${b.id}" />
                      <button type="submit" style="margin:0;padding:8px 14px;background:var(--muted)">Uitchecken</button>
                    </form>`
                  : ""}
            </li>`;
          })}
        </ul>`}

    <h2>Vandaag binnengekomen <span class="muted">(receptie-iPad)</span></h2>
    ${opts.receptieFout
      ? html`<p class="muted">Receptie-registraties konden niet geladen worden.
          Controleer of het Airtable-token ook toegang heeft tot de
          Bezoekersregistratie-base.</p>`
      : receptie.length === 0
        ? html`<p class="muted">Nog niemand ingecheckt bij de receptie vandaag.</p>`
        : html`<ul>
            ${receptie.map(
              (r) => html`<li>
                <strong>${r.fields.Naam ?? "(onbekend)"}</strong>
                ${r.fields.Bedrijf ? html`(${r.fields.Bedrijf})` : ""} —
                <span class="muted">
                  ${formatTijd(r.fields.Tijdstip)} uur
                  ${r.fields["Bezoek aan"] ? html`· bij ${r.fields["Bezoek aan"]}` : ""}
                  ${r.fields.Locatie ? html`· ${r.fields.Locatie}` : ""}
                </span>
              </li>`,
            )}
          </ul>`}
  `;
}
