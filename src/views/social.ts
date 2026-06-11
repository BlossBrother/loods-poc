// Prikbord-views in Loods-stijl (restyle ronde 2): componentbibliotheek uit
// ./loods. Alle gedrag (sheet/FAB, undo, swipe, emoji, polls, vertaal) blijft
// van de shell komen — functionele klassen en data-attributen onveranderd.
import { html } from "hono/html";
import { emojiBar } from "./emoji";
import { page, emptyState } from "./templates";
import { lds, lico } from "./loods";
import type { AirtableRecord, PostFields, ReactieFields } from "../airtable";
import { formatDatumTijd } from "../tz";

// Weergavemodel voor een peiling (telling vooraf berekend in de route).
export interface PollView {
  id: string;
  vraag: string;
  opties: string[];
  multi: boolean;
  makerId?: string;
  makerNaam?: string;
  status: "open" | "gesloten";
  createdTime: string;
  closesAt?: number | null;
  counts: number[];
  total: number;
  mine: number[];
}

function initials(naam: string): string {
  const p = naam.trim().split(/\s+/);
  const s = (p[0]?.[0] ?? "") + (p.length > 1 ? (p[p.length - 1][0] ?? "") : "");
  return s.toUpperCase() || "?";
}

// Keuzelijst alleen voor lokale dev (zonder Access-identiteit).
function authorSelect(auteurs: { id: string; naam: string }[], huidigeId?: string) {
  return html`<select name="auteur" required>
    <option value="">— wie ben je? —</option>
    ${auteurs.map(
      (a) =>
        html`<option value="${a.id}" ${a.id === huidigeId ? "selected" : ""}>${a.naam}</option>`,
    )}
  </select>`;
}

export function socialPage(
  posts: AirtableRecord<PostFields>[],
  reactiesByPost: Map<string, AirtableRecord<ReactieFields>[]>,
  auteurs: { id: string; naam: string }[],
  naamById: Map<string, string>,
  fotoById: Map<string, string>,
  huidigeId: string | undefined,
  huidigeNaam: string | undefined,
  dev: boolean,
  kanVerwijderen: boolean,
  emojiByPost: Map<string, { counts: Record<string, number>; mine: string[] }>,
  polls: PollView[],
  opts: { melding?: string } = {},
) {
  const naam = (ids?: string[]) =>
    ids && ids[0] ? (naamById.get(ids[0]) ?? "(onbekend)") : "(onbekend)";

  // Identiteit komt van Cloudflare Access: niemand kan zich als een ander voordoen.
  // Alleen lokaal (dev, zonder identiteit) mag je je naam nog kiezen.
  const kies = dev && !huidigeId;
  const kanPlaatsen = !!huidigeId || kies;
  const auteurVeld = kies
    ? html`<label style="margin-top:10px">Jouw naam ${authorSelect(auteurs, huidigeId)}</label>`
    : huidigeId
      ? html`<p class="muted" style="margin:8px 0 0">Je plaatst als
          <strong>${huidigeNaam ?? "jij"}</strong></p>`
      : "";

  function renderPost(p: AirtableRecord<PostFields>) {
    const reacties = reactiesByPost.get(p.id) ?? [];
    const an = naam(p.fields.Auteur);
    const aFoto = p.fields.Auteur?.[0] ? fotoById.get(p.fields.Auteur[0]) : undefined;
    const ontvId = p.fields.Ontvanger?.[0];
    const ontvNaam = ontvId ? naam(p.fields.Ontvanger) : "";
    return html`<div class="post${ontvId ? " so" : ""}" id="post-${p.id}">
      ${ontvId
        ? html`<div class="so-head">${lico("award", 1.9)}<span>Shout-out voor ${ontvNaam}</span></div>`
        : ""}
      <div class="head">
        ${aFoto
          ? html`<img class="avatar" src="${aFoto}" alt="${an}" width="36" height="36" loading="lazy" style="object-fit:cover" />`
          : html`<div class="avatar">${initials(an)}</div>`}
        <div>
          <div class="who">${an}</div>
          <div class="muted">${formatDatumTijd(p.createdTime)}</div>
        </div>
        ${kanVerwijderen || p.fields.Auteur?.[0] === huidigeId
          ? html`<form method="post" action="/social/verwijder" style="margin:0 0 0 auto" data-undo="Bericht verwijderd" data-herstel-type="post"><input type="hidden" name="id" value="${p.id}" /><button class="btn-soft btn" style="margin:0;padding:6px 11px;font-size:.76rem">verwijder</button></form>`
          : ""}
      </div>
      ${p.fields.Bericht ? html`<div class="body ff-tr">${p.fields.Bericht}</div>` : ""}
      ${p.fields.Afbeelding?.[0]?.url ? html`<img class="zoomable" src="${p.fields.Afbeelding[0].url}" alt="" loading="lazy" decoding="async" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:13px;margin:8px 0 0" />` : ""}
      <div class="row between wrap" style="gap:var(--sp-2);margin-top:var(--sp-2)">
        ${emojiBar("post", p.id, emojiByPost.get(p.id) ?? { counts: {}, mine: [] }, kanPlaatsen)}
        ${p.fields.Bericht ? html`<button type="button" class="ff-tr-btn" data-tr>Vertaal dit</button>` : ""}
      </div>
      ${reacties.map((r) => {
        const magWeg = kanVerwijderen || r.fields.Auteur?.[0] === huidigeId;
        const inner = html`<span class="who">${naam(r.fields.Auteur)}</span>
          <span class="muted">· ${formatDatumTijd(r.createdTime)}</span>
          ${magWeg
            ? html`<form method="post" action="/social/reactie/verwijder" style="display:inline-block;margin:0 0 0 6px;vertical-align:middle" data-undo="Reactie verwijderd" data-herstel-type="reactie"><input type="hidden" name="id" value="${r.id}" /><button class="btn-soft btn" style="margin:0;padding:1px 8px;font-size:.7rem">verwijder</button></form>`
            : ""}
          <div class="body">${r.fields.Reactie ?? ""}</div>`;
        return magWeg
          ? html`<div class="swipe"><button type="submit" form="srdel-${r.id}" class="swipe-bg" tabindex="-1" aria-hidden="true">Verwijderen</button><div class="reactie swipe-fg">${inner}</div><form id="srdel-${r.id}" method="post" action="/social/reactie/verwijder" hidden data-undo="Reactie verwijderd" data-herstel-type="reactie"><input type="hidden" name="id" value="${r.id}" /></form></div>`
          : html`<div class="reactie">${inner}</div>`;
      })}
      ${kanPlaatsen
        ? html`<form method="post" action="/social/reactie" class="cmtform">
            <input type="hidden" name="post" value="${p.id}" />
            ${kies ? authorSelect(auteurs, huidigeId) : ""}
            <input type="text" name="reactie" placeholder="Reageer…" required />
            <button type="submit">Versturen</button>
          </form>`
        : ""}
    </div>`;
  }

  function pollCard(q: PollView) {
    const open = q.status === "open";
    const owner = kanVerwijderen || (!!q.makerId && q.makerId === huidigeId);
    return html`<div class="post poll" id="poll-${q.id}" data-poll="${q.id}">
      <div class="head">
        <div class="avatar">${lico("poll", 1.9)}</div>
        <div>
          <div class="who">${q.makerNaam ?? "Peiling"}</div>
          <div class="muted">${formatDatumTijd(q.createdTime)}${open ? "" : " · gesloten"}</div>
        </div>
        ${owner
          ? html`<div class="row" style="gap:6px;margin-left:auto">
              ${open ? html`<form method="post" action="/social/poll/sluit" style="margin:0"><input type="hidden" name="id" value="${q.id}" /><button class="btn-soft btn" style="margin:0;padding:6px 11px;font-size:.76rem">sluiten</button></form>` : ""}
              <form method="post" action="/social/poll/verwijder" style="margin:0" data-undo="Peiling verwijderd" data-herstel-type="poll"><input type="hidden" name="id" value="${q.id}" /><button class="btn-soft btn" style="margin:0;padding:6px 11px;font-size:.76rem">verwijder</button></form>
            </div>`
          : ""}
      </div>
      <div class="pollq"><strong>${q.vraag}</strong></div>
      <div class="polloptions">
        ${q.opties.map((label, i) => {
          const n = q.counts[i] ?? 0;
          const pct = q.total ? Math.round((n / q.total) * 100) : 0;
          const chosen = q.mine.includes(i);
          const inner = html`<span class="pollbar" style="width:${pct}%"></span><span class="polllabel">${label}</span><span class="pollpct">${pct}% · ${n}</span>`;
          return open && kanPlaatsen
            ? html`<button type="button" class="pollopt${chosen ? " on" : ""}" data-optie="${i}">${inner}</button>`
            : html`<div class="pollopt static${chosen ? " on" : ""}">${inner}</div>`;
        })}
      </div>
      <div class="muted pollfoot" style="margin-top:6px;font-size:.78rem">${q.total} ${q.total === 1 ? "stem" : "stemmen"}${q.multi ? " · meerkeuze" : ""}${open ? "" : " · gesloten"}</div>
    </div>`;
  }

  const feed = [
    ...posts.map((p) => ({ ts: p.createdTime, node: renderPost(p) })),
    ...polls.map((q) => ({ ts: q.createdTime, node: pollCard(q) })),
  ].sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));

  return lds(page({ title: "Prikbord", icon: "board", children: html`
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}

    ${kanPlaatsen
      ? html`<form method="post" action="/social" enctype="multipart/form-data" class="card sheet-m" id="ff-compose">
          <span class="sheet-handle" data-sheet-close role="button" tabindex="0" aria-label="Sluiten"></span>
          <label>Plaats een bericht</label>
          <textarea name="bericht" rows="3" placeholder="Deel iets met collega's…"></textarea>
          <label>Afbeelding (optioneel) <input name="afbeelding" type="file" accept="image/*" /></label>
          <label style="margin-top:10px">Shout-out voor (optioneel)
            <select name="ontvanger">
              <option value="">— geen, gewoon een bericht —</option>
              ${auteurs.map((a) => html`<option value="${a.id}">${a.naam}</option>`)}
            </select>
          </label>
          <label class="row" style="gap:var(--sp-2);font-weight:600;margin-top:10px"><input type="checkbox" name="is_poll" id="ff-poll-toggle" /> Maak hier een peiling van</label>
          <div id="ff-poll-fields" hidden style="margin-top:6px">
            <label>Vraag <input name="poll_vraag" maxlength="160" placeholder="bv. Welke datum voor het zomeruitje?" /></label>
            <label>Opties (één per regel, 2–6) <textarea name="poll_opties" rows="4" placeholder="Vrijdag 4 juli&#10;Zaterdag 5 juli&#10;Vrijdag 11 juli"></textarea></label>
            <label class="row" style="gap:var(--sp-2);font-weight:600"><input type="checkbox" name="poll_multi" /> Meerdere keuzes toestaan</label>
          </div>
          <script>(function(){var t=document.getElementById("ff-poll-toggle"),f=document.getElementById("ff-poll-fields");if(t&&f)t.addEventListener("change",function(){f.hidden=!t.checked;});})();</script>
          ${auteurVeld}
          <button type="submit">Plaatsen</button>
        </form>`
      : html`<p class="warn">Je staat nog niet in de medewerkerslijst, dus je kunt nog
          niet posten. Vraag een beheerder om je toe te voegen (met je e-mailadres).</p>`}

    ${posts.length === 0 && polls.length === 0
      ? emptyState({ icon: "board", title: "Nog geen berichten", text: kanPlaatsen ? "Wees de eerste die iets deelt met collega's." : "Zodra collega's iets plaatsen, verschijnt het hier." })
      : feed.map((f) => f.node)}
  ` }));
}
