import { html, raw } from "hono/html";
import { emptyState } from "./templates";
import { lds } from "./loods";
import type { Noodmelding } from "../noodmelding";
import type { Player } from "../account";
import { formatDatumTijd } from "../tz";

const SHIELD = `<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 4.5 3.4 7.6 8 9 4.6-1.4 8-4.5 8-9V6l-8-3Z"/><path d="M12 9v5M9.5 11.5h5"/></svg>`;

export function noodmeldingPagina(
  aantalBhv: number,
  opts: { verzonden?: boolean; bereikt?: number; actief?: Noodmelding; kanSluiten?: boolean; afgehandeld?: boolean } = {},
) {
  return lds(html`
    <h1 class="row" style="gap:10px"><span style="display:inline-grid;place-items:center;width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,#FF7A4D,#F23B2F);color:#fff">${raw(SHIELD)}</span> Noodmelding / BHV</h1>

    <div class="warn" style="font-weight:600">Levensbedreigend? Bel altijd eerst <a href="tel:112">112</a>. Deze knop is een interne waarschuwing aan de BHV'ers en <strong>vervangt 112 niet</strong>.</div>

    ${opts.afgehandeld ? html`<p class="ok flash" data-toast>Noodmelding afgehandeld — de banner is weg.</p>` : ""}
    ${opts.verzonden
      ? html`<div class="ok" style="font-weight:600">BHV is gewaarschuwd${typeof opts.bereikt === "number" ? ` — melding afgeleverd op ${opts.bereikt} apparaat${opts.bereikt === 1 ? "" : "en"}.` : "."} Blijf bij de persoon/situatie tot er hulp is.</div>`
      : ""}
    ${opts.actief
      ? html`<div class="card" style="border-color:#F23B2F;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <span class="grow" style="min-width:0"><strong>Noodmelding actief</strong>
            <span class="muted" style="display:block;font-size:.85rem">${opts.actief.melder_naam ?? "Onbekend"}${opts.actief.locatie ? ` · ${opts.actief.locatie}` : ""} · ${formatDatumTijd(new Date(opts.actief.created_at).toISOString())} — de banner verdwijnt vanzelf na 30 minuten.</span></span>
          ${opts.kanSluiten
            ? html`<form method="post" action="/noodmelding/afgehandeld" style="margin:0" onsubmit="return confirm('Noodmelding afhandelen? De alarm-banner verdwijnt dan direct voor iedereen.')">
                <input type="hidden" name="id" value="${opts.actief.id}" />
                <button type="submit" class="btn btn-soft" style="margin:0">Afgehandeld</button>
              </form>`
            : ""}
        </div>`
      : ""}

    <form method="post" action="/noodmelding" class="card" onsubmit="return confirm('Noodmelding versturen naar de BHV-groep?');">
      <p class="muted" style="margin-top:0">Er zijn <strong>${aantalBhv}</strong> BHV'er(s) ingesteld. Zij krijgen direct een pushmelding (mits ze meldingen aan hebben staan op hun apparaat).</p>
      <label>Locatie (optioneel) <input name="locatie" maxlength="100" placeholder="bv. Loods 2 / Kantine / Kantoor 1e etage" /></label>
      <button type="submit" style="width:100%;margin-top:10px;background:linear-gradient(135deg,#FF7A4D,#F23B2F);box-shadow:0 10px 28px rgba(242,59,47,.30);font-size:1.15rem;padding:var(--sp-4)">🚨 Verstuur noodmelding naar BHV</button>
    </form>

    <p class="muted">Tip: zet als BHV'er meldingen aan via Home → “Meldingen aanzetten”, anders komt de push niet binnen.</p>
  `);
}

export function beheerBhv(
  players: Player[],
  ontvangers: Set<string>,
  recente: Noodmelding[],
  opts: { melding?: string } = {},
) {
  return html`
    <h1>BHV-groep</h1>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    <p class="muted">Kies wie er een pushmelding krijgt als iemand op de noodknop drukt.
      Push komt alleen aan bij BHV'ers die meldingen hebben aangezet op hun apparaat —
      test dit periodiek. De noodknop is <strong>geen</strong> vervanging van 112.</p>
    <form method="post" action="/beheer/bhv" class="card">
      <h2 style="margin-top:0">BHV'ers</h2>
      <div style="max-height:300px;overflow-y:auto;border:1px solid var(--line);border-radius:12px;padding:var(--sp-2)">
        ${players.map(
          (p) => html`<label class="row" style="gap:var(--sp-2); font-weight:500; margin:4px 0">
            <input type="checkbox" name="bhv" value="${p.id}" ${ontvangers.has(p.id) ? "checked" : ""} /> ${p.naam}${p.email ? html` <span class="muted" style="font-size:.78rem">${p.email}</span>` : ""}
          </label>`,
        )}
      </div>
      <button type="submit" style="margin-top:14px">Opslaan</button>
    </form>

    <h2 class="row" style="gap:10px">Recente noodmeldingen
      ${recente.length > 0 ? html`<form method="post" action="/beheer/bhv/verwijder" style="margin:0" onsubmit="return confirm('Alle noodmeldingen wissen?')"><input type="hidden" name="all" value="1" /><button class="btn-soft btn" style="margin:0;padding:5px 11px;font-size:.78rem">Alles wissen</button></form>` : ""}
    </h2>
    ${recente.length === 0
      ? emptyState({ icon: "sos", title: "Nog geen noodmeldingen" })
      : html`<ul class="clean">${recente.map(
          (m) => html`<li class="row wrap" style="gap:10px">
            <span class="grow"><strong>${m.melder_naam ?? "Onbekend"}</strong>
              ${m.locatie ? html`<span class="chip" style="margin-left:6px">${m.locatie}</span>` : ""}
              <span class="muted"> · ${formatDatumTijd(new Date(m.created_at).toISOString())}</span></span>
            <form method="post" action="/beheer/bhv/verwijder" style="margin:0" onsubmit="return confirm('Wissen?')"><input type="hidden" name="id" value="${m.id}" /><button class="btn-soft btn" style="margin:0;padding:5px 10px;font-size:.74rem">wissen</button></form>
          </li>`,
        )}</ul>`}
    <p class="muted"><a href="/beheer">← beheer</a></p>
  `;
}
