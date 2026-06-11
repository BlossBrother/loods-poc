// Herbruikbare scherm-templates (Set 4): vaste anatomie per schermtype zodat elk scherm
// consistent is en nieuwe modules vanzelf "goed" staan. Bouwt op de tokens/componenten.
import { html, raw } from "hono/html";
import type { HtmlEscapedString } from "hono/utils/html";
import { svg } from "./layout";

type Frag = HtmlEscapedString | Promise<HtmlEscapedString> | string;

// Module-kop in home-stijl (v181, spoor A3): icoon-tegel + titel — zelfde patroon
// als Meldingen in v180. De .tile-stijl komt uit de Loods-bibliotheek (globale .lds).
export function pageTitle(icon: string, title: Frag) {
  return html`<h1 class="row" style="gap:10px"><span class="tile">${svg(icon)}</span> ${title}</h1>`;
}

// Lijst-/overzichtsscherm: titel (+ optionele acties) -> optionele intro -> inhoud.
export function page(opts: { title: string; icon?: string; intro?: string; actions?: Frag; children: Frag }) {
  return html`
    <div class="page-head">
      ${opts.icon ? pageTitle(opts.icon, opts.title) : html`<h1>${opts.title}</h1>`}
      ${opts.actions ? html`<div class="page-actions">${opts.actions}</div>` : ""}
    </div>
    ${opts.intro ? html`<p class="page-intro">${opts.intro}</p>` : ""}
    ${opts.children}`;
}

// Detailscherm: terug-context bovenaan -> titel -> inhoud.
export function detail(opts: { backHref: string; backLabel?: string; title: string; actions?: Frag; children: Frag }) {
  return html`
    <a class="detail-back" href="${opts.backHref}">${raw('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>')}${opts.backLabel ?? "Terug"}</a>
    <div class="page-head">
      <h1>${opts.title}</h1>
      ${opts.actions ? html`<div class="page-actions">${opts.actions}</div>` : ""}
    </div>
    ${opts.children}`;
}

// Formulierscherm: één duidelijke taak, primaire knop onderaan.
export function formPage(opts: { title: string; intro?: string; action: string; method?: string; enctype?: string; id?: string; submitLabel?: string; children: Frag }) {
  return html`<form class="card formpage" method="${opts.method ?? "post"}" action="${opts.action}"${opts.enctype ? raw(` enctype="${opts.enctype}"`) : raw("")}${opts.id ? raw(` id="${opts.id}"`) : raw("")}>
    <h2 style="margin-top:0">${opts.title}</h2>
    ${opts.intro ? html`<p class="muted" style="margin-top:0">${opts.intro}</p>` : ""}
    ${opts.children}
    <button type="submit">${opts.submitLabel ?? "Opslaan"}</button>
  </form>`;
}

// Lege staat: icoon + titel + uitleg + optionele actie.
export function emptyState(opts: { icon?: string; title: string; text?: string; action?: Frag }) {
  return html`<div class="card emptystate">
    ${opts.icon ? html`<div class="es-ico">${svg(opts.icon)}</div>` : ""}
    <p class="es-title">${opts.title}</p>
    ${opts.text ? html`<p class="es-text">${opts.text}</p>` : ""}
    ${opts.action ?? ""}
  </div>`;
}

// Skeleton-laadstaat (cross-fade naar content gebeurt client-side waar relevant).
export function skeletonList(rows = 3) {
  const items: Frag[] = [];
  for (let i = 0; i < rows; i++) items.push(html`<div class="skeleton" style="height:56px;margin-bottom:10px"></div>`);
  return html`<div class="skeletonlist" aria-hidden="true">${items}</div>`;
}
