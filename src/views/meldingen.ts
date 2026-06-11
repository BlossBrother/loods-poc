import { html, raw } from "hono/html";
import type { Melding } from "../meldingen";
import { formatDatumTijd } from "../tz";
import type { Player } from "../account";
import { page } from "./templates";
import { lds, eyebrow } from "./loods";

// v180: bel (zelfde vorm als menu/tabbar) voor de paginakop; de noodkaart houdt de driehoek (alarm).
const ALERT_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
const SOS_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4M12 17.5v.5"/></svg>`;

function meldingItem(m: Melding, kanAfhandelen: boolean) {
  const inner = html`<div class="row-top wrap" style="gap:10px">
      <div class="grow">
        <strong>${m.titel}</strong>
        ${m.locatie ? html`<span class="chip" style="margin-left:6px">${m.locatie}</span>` : ""}
        ${m.omschrijving ? html`<div class="muted" style="margin-top:2px">${m.omschrijving}</div>` : ""}
        <div class="muted" style="font-size:.76rem;margin-top:3px">${m.gemeld_naam ?? "onbekend"} · ${formatDatumTijd(new Date(m.created_at).toISOString())}</div>
      </div>
      ${kanAfhandelen
        ? html`<div style="display:flex;flex-direction:column;gap:6px">
            <form method="post" action="/meldingen/afgehandeld" style="margin:0">
              <input type="hidden" name="id" value="${m.id}" />
              <button class="btn-soft btn" style="margin:0;padding:7px 12px">Afgehandeld</button>
            </form>
            <form method="post" action="/meldingen/verwijder" style="margin:0" data-undo="Melding gearchiveerd">
              <input type="hidden" name="id" value="${m.id}" />
              <button class="btn-soft btn" style="margin:0;padding:7px 12px">Archiveren</button>
            </form>
          </div>`
        : ""}
    </div>`;
  // Padding/rand komen al van `ul.clean li`; geen inline-stijl meer nodig.
  if (!kanAfhandelen) return html`<li>${inner}</li>`;
  // Swipe-naar-links = archiveren (versneller); de knoppen in de rij blijven het zichtbare alternatief.
  return html`<li class="swipe">
    <button type="submit" form="meldarch-${m.id}" class="swipe-bg" tabindex="-1" aria-hidden="true">Archiveren</button>
    <div class="swipe-fg" style="padding:var(--sp-3);border-bottom:1px solid var(--line)">${inner}</div>
    <form id="meldarch-${m.id}" method="post" action="/meldingen/verwijder" hidden data-undo="Melding gearchiveerd"><input type="hidden" name="id" value="${m.id}" /></form>
  </li>`;
}

function sectie(titel: string, items: Melding[], kanAfhandelen: boolean) {
  return html`${eyebrow(`${titel} · ${items.length} open`)}
    ${items.length === 0
      ? html`<article class="card"><p class="empty" style="margin:0">Geen openstaande meldingen.</p></article>`
      : html`<article class="card listcard"><ul class="clean">${items.map((m) => meldingItem(m, kanAfhandelen))}</ul></article>`}`;
}

export function meldingenPagina(
  voorraad: Melding[],
  defecten: Melding[],
  kan: { voorraad: boolean; defect: boolean },
  opts: { melding?: string } = {},
) {
  return lds(html`
    <h1 class="row" style="gap:10px"><span class="tile">${raw(ALERT_SVG)}</span> Meldingen</h1>
    <p class="muted">Meld een voorraad-tekort of een defect. De verantwoordelijke collega's krijgen wekelijks een samenvatting.</p>

    ${eyebrow("Snel melden")}
    <a class="bhvcard" href="/noodmelding">
      <span class="btile">${raw(SOS_SVG)}</span>
      <span class="tx" style="display:block"><h3>Noodmelding / BHV</h3><p>E\u00e9n tik \u2014 direct naar de juiste persoon</p></span>
    </a>
    <button type="button" class="btn btn-soft" data-sheet="ff-meld-new" style="width:100%;margin:0 0 6px">+ Melding maken</button>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}

    <form method="post" action="/meldingen" class="card sheet-m" id="ff-meld-new">
      <span class="sheet-handle" data-sheet-close role="button" tabindex="0" aria-label="Sluiten"></span>
      <h2 style="margin-top:0">Nieuwe melding</h2>
      <label>Soort
        <select name="type" required>
          <option value="voorraad">Voorraad-tekort</option>
          <option value="defect">Defect</option>
        </select>
      </label>
      <label>Onderwerp <input name="titel" required maxlength="120" placeholder="bv. Koffiebonen bijna op / Heftruck lekt olie" /></label>
      <label>Omschrijving <textarea name="omschrijving" rows="3" placeholder="Optioneel: meer details"></textarea></label>
      <label>Locatie <input name="locatie" maxlength="80" placeholder="Optioneel: bv. Kantine / Loods 2" /></label>
      <button type="submit">Melding plaatsen</button>
    </form>

    ${sectie("Voorraad", voorraad, kan.voorraad)}
    ${sectie("Defecten", defecten, kan.defect)}
  `);
}

export function beheerMeldingen(
  players: Player[],
  ontvangers: { voorraad: Set<string>; defect: Set<string> },
  opts: { melding?: string } = {},
) {
  const lijst = (naam: string, set: Set<string>) =>
    html`<div style="max-height:240px;overflow-y:auto;border:1px solid var(--line);border-radius:12px;padding:var(--sp-2)">
      ${players.map(
        (p) => html`<label class="row" style="gap:var(--sp-2);font-weight:500;margin:var(--sp-1) 0">
          <input type="checkbox" name="${naam}" value="${p.id}" ${set.has(p.id) ? "checked" : ""} /> ${p.naam}${p.email ? html` <span class="muted" style="font-size:.78rem">${p.email}</span>` : ""}
        </label>`,
      )}
    </div>`;
  return html`
    ${page({
      title: "Meldingen-ontvangers",
      intro:
        "Kies wie de wekelijkse samenvatting (maandagochtend) krijgt, per categorie. Push komt alleen aan bij collega's die meldingen hebben aangezet op hun apparaat.",
      children: html`
        ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
        <form method="post" action="/beheer/meldingen" class="card">
          <h2 style="margin-top:0">Voorraad</h2>
          ${lijst("voorraad", ontvangers.voorraad)}
          <h2>Defecten</h2>
          ${lijst("defect", ontvangers.defect)}
          <button type="submit" style="margin-top:14px">Opslaan</button>
        </form>
        <p class="muted"><a href="/beheer">← beheer</a></p>
      `,
    })}
  `;
}
