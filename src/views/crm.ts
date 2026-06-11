// CRM-views (ADR-001) — volgen MODULE-SJABLOON.md: page/detail/formPage + emptyState,
// max één primaire actie per scherm (FAB = nieuw contactmoment, zie layout PRIMARY).
import { html } from "hono/html";
import { page, detail, formPage, emptyState } from "./templates";
import type { KlantStat, CrmKlant, Contactpersoon, Contactmoment, Taak, Deal } from "../crm/data";
import { MOMENT_TYPES, DEAL_FASES, faseLabel } from "../crm/data";
import type { Player } from "../account";

/* ---------- kleine helpers ---------- */

function fmtDatum(ms?: number | null): string {
  if (!ms) return "—";
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

function dateInputValue(ms?: number | null): string {
  if (!ms) return "";
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function euro(cents?: number | null): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
}

function toast(melding?: string) {
  return melding ? html`<p class="ok flash" data-toast>${melding}</p>` : html``;
}

function klantSelect(klanten: { id: string; naam: string }[], naam: string, sel?: string, verplicht = true) {
  return html`<label>Klant
    <select name="${naam}" ${verplicht ? "required" : ""}>
      ${verplicht ? "" : html`<option value="">— Geen klant —</option>`}
      ${klanten.map((k) => html`<option value="${k.id}" ${sel === k.id ? "selected" : ""}>${k.naam}</option>`)}
    </select>
  </label>`;
}

function eigenaarSelect(players: Player[], sel?: string) {
  return html`<label>Eigenaar
    <select name="eigenaar">
      <option value="">— Geen eigenaar —</option>
      ${players.map((p) => html`<option value="${p.id}" ${sel === p.id ? "selected" : ""}>${p.naam}</option>`)}
    </select>
  </label>`;
}

/* ---------- Overzicht (klantenlijst) ---------- */

export function crmOverzicht(stats: KlantStat[], opts: { zoek?: string; melding?: string } = {}) {
  const lijst = stats.length === 0
    ? emptyState({
        icon: "briefcase",
        title: opts.zoek ? "Geen klanten gevonden" : "Nog geen klanten",
        text: opts.zoek ? "Probeer een andere zoekterm." : "Klanten beheer je onder Beheer → Klanten; daarna verschijnen ze hier.",
      })
    : html`<ul class="clean">
        ${stats.map(
          (k) => html`<li>
            <a href="/crm/klant/${k.id}" style="display:block;text-decoration:none;color:inherit">
              <strong>${k.naam}</strong>
              ${k.bedrijf ? html`<span class="chip" style="margin-left:6px">${k.bedrijf}</span>` : ""}
              ${k.actief ? "" : html`<span class="chip" style="margin-left:6px">inactief</span>`}
              <div class="muted" style="font-size:.8rem;margin-top:3px">
                ${k.contacten} contactperso${k.contacten === 1 ? "on" : "nen"} ·
                ${k.taken_open} open ta${k.taken_open === 1 ? "ak" : "ken"} ·
                ${k.deals_open} open deal${k.deals_open === 1 ? "" : "s"} ·
                laatste contact: ${fmtDatum(k.laatste_moment)}
              </div>
            </a>
          </li>`,
        )}
      </ul>`;
  return page({
    title: "CRM",
    icon: "briefcase",
    intro: "Klantrelaties van team Concepts: contactmomenten, taken en pipeline.",
    actions: html`<a class="btn btn-soft" style="margin:0" href="/crm/klant/nieuw">+ Klant</a>`,
    children: html`
      ${toast(opts.melding)}
      <form method="get" action="/crm" class="row" style="gap:8px;margin:0 0 10px">
        <input type="search" name="q" value="${opts.zoek ?? ""}" placeholder="Zoek op naam, bedrijf of e-mail" style="flex:1" />
        <button class="btn btn-soft" style="margin:0">Zoek</button>
      </form>
      ${lijst}
    `,
  });
}

/* ---------- Klantenkaart ---------- */

export function crmKlantkaart(
  klant: CrmKlant,
  contacten: Contactpersoon[],
  momenten: Contactmoment[],
  taken: Taak[],
  deals: Deal[],
  opts: { melding?: string } = {},
) {
  const momentLabel = (t: string) => MOMENT_TYPES.find((m) => m.type === t)?.label ?? t;
  return detail({
    backHref: "/crm",
    backLabel: "CRM",
    title: klant.naam,
    actions: html`<a class="btn btn-soft" style="margin:0" href="/crm/klant/${klant.id}/bewerk">Bewerken</a>`,
    children: html`
      ${toast(opts.melding)}
      <div class="card">
        ${klant.bedrijf ? html`<div><span class="muted">Bedrijf:</span> ${klant.bedrijf}</div>` : ""}
        ${klant.email ? html`<div><span class="muted">E-mail:</span> <a href="mailto:${klant.email}">${klant.email}</a></div>` : ""}
        <div><span class="muted">Portaal:</span> ${klant.actief ? "actief" : "inactief"}${klant.laatste_login ? html` · laatste login ${klant.laatste_login.slice(0, 10)}` : html` · nog nooit ingelogd`}</div>
        ${klant.notitie ? html`<div class="muted" style="margin-top:4px">${klant.notitie}</div>` : ""}
      </div>

      <h2>Contactpersonen <a class="btn btn-soft" style="float:right;margin:0;padding:6px 12px" href="/crm/klant/${klant.id}/contact/nieuw">+ Toevoegen</a></h2>
      ${contacten.length === 0
        ? html`<p class="empty">Nog geen contactpersonen.</p>`
        : html`<ul class="clean">
            ${contacten.map(
              (cp) => html`<li>
                <div class="row-top wrap" style="gap:10px">
                  <div class="grow">
                    <strong>${cp.naam}</strong>${cp.functie ? html` <span class="muted">· ${cp.functie}</span>` : ""}
                    <div class="muted" style="font-size:.8rem">
                      ${cp.email ? html`<a href="mailto:${cp.email}">${cp.email}</a>` : ""}${cp.email && cp.telefoon ? " · " : ""}${cp.telefoon ? html`<a href="tel:${cp.telefoon}">${cp.telefoon}</a>` : ""}
                    </div>
                    ${cp.notitie ? html`<div class="muted" style="font-size:.8rem">${cp.notitie}</div>` : ""}
                  </div>
                  <a class="btn btn-soft" style="margin:0;padding:6px 12px" href="/crm/contact/${cp.id}/bewerk">Bewerk</a>
                </div>
              </li>`,
            )}
          </ul>`}

      <h2>Contactmomenten <a class="btn btn-soft" style="float:right;margin:0;padding:6px 12px" href="/crm/moment/nieuw?klant=${klant.id}">+ Vastleggen</a></h2>
      ${momenten.length === 0
        ? html`<p class="empty">Nog geen contactmomenten vastgelegd.</p>`
        : html`<ul class="clean">
            ${momenten.map(
              (m) => html`<li>
                <span class="chip">${momentLabel(m.type)}</span>
                <span class="muted" style="font-size:.8rem;margin-left:6px">${fmtDatum(m.datum)}${m.created_naam ? ` · ${m.created_naam}` : ""}</span>
                <div style="margin-top:3px;white-space:pre-wrap">${m.notitie}</div>
              </li>`,
            )}
          </ul>`}

      <h2>Open taken <a class="btn btn-soft" style="float:right;margin:0;padding:6px 12px" href="/crm/taak/nieuw?klant=${klant.id}">+ Taak</a></h2>
      ${taken.length === 0
        ? html`<p class="empty">Geen open taken voor deze klant.</p>`
        : html`<ul class="clean">${taken.map((t) => taakRij(t, undefined, `/crm/klant/${klant.id}`))}</ul>`}

      <h2>Deals <a class="btn btn-soft" style="float:right;margin:0;padding:6px 12px" href="/crm/deal/nieuw?klant=${klant.id}">+ Deal</a></h2>
      ${deals.length === 0
        ? html`<p class="empty">Nog geen deals voor deze klant.</p>`
        : html`<ul class="clean">
            ${deals.map(
              (d) => html`<li>
                <a href="/crm/deal/${d.id}" style="display:block;text-decoration:none;color:inherit">
                  <strong>${d.titel}</strong>
                  <span class="chip" style="margin-left:6px">${faseLabel(d.fase)}</span>
                  <span class="muted" style="font-size:.8rem;margin-left:6px">${euro(d.waarde_cents)}${d.eigenaar_naam ? ` · ${d.eigenaar_naam}` : ""}</span>
                </a>
              </li>`,
            )}
          </ul>`}
    `,
  });
}

/* ---------- Taken ---------- */

function taakRij(t: Taak, klantNaam?: string, terugPad = "/crm/taken") {
  const teLaat = t.status === "open" && t.deadline != null && t.deadline < Date.now() - 24 * 60 * 60 * 1000;
  return html`<li>
    <div class="row-top wrap" style="gap:10px">
      <div class="grow">
        <strong style="${t.status === "klaar" ? "text-decoration:line-through;opacity:.6" : ""}">${t.titel}</strong>
        ${teLaat ? html`<span class="chip" style="margin-left:6px;color:var(--berry,#b3261e)">te laat</span>` : ""}
        <div class="muted" style="font-size:.8rem;margin-top:2px">
          ${t.deadline ? `deadline ${fmtDatum(t.deadline)}` : "geen deadline"}
          ${t.eigenaar_naam ? ` · ${t.eigenaar_naam}` : ""}
          ${klantNaam ? html` · <a href="/crm/klant/${t.klant_id}">${klantNaam}</a>` : ""}
        </div>
        ${t.omschrijving ? html`<div class="muted" style="font-size:.8rem">${t.omschrijving}</div>` : ""}
      </div>
      <form method="post" action="/crm/taak/${t.id}/status" style="margin:0">
        <input type="hidden" name="terug" value="${terugPad}" />
        <input type="hidden" name="status" value="${t.status === "open" ? "klaar" : "open"}" />
        <button class="btn btn-soft" style="margin:0;padding:7px 12px">${t.status === "open" ? "Klaar" : "Heropen"}</button>
      </form>
    </div>
  </li>`;
}

export function crmTakenPagina(
  open: Taak[],
  klaar: Taak[],
  klantNamen: Map<string, string>,
  opts: { melding?: string } = {},
) {
  const naam = (t: Taak) => (t.klant_id ? klantNamen.get(t.klant_id) : undefined);
  return page({
    title: "Taken",
    intro: "Opvolg-acties van team Concepts, gesorteerd op deadline.",
    actions: html`<a class="btn btn-soft" style="margin:0" href="/crm/taak/nieuw">+ Taak</a>`,
    children: html`
      ${toast(opts.melding)}
      ${open.length === 0
        ? emptyState({ icon: "agenda", title: "Geen open taken", text: "Alles is opgevolgd. Maak een taak aan via de knop hierboven." })
        : html`<ul class="clean">${open.map((t) => taakRij(t, naam(t)))}</ul>`}
      ${klaar.length > 0
        ? html`<h2>Afgerond <span class="muted" style="font-weight:600;font-size:.85rem">(laatste ${klaar.length})</span></h2>
            <ul class="clean">${klaar.map((t) => taakRij(t, naam(t)))}</ul>`
        : ""}
    `,
  });
}

/* ---------- Pipeline ---------- */

export function crmPipeline(deals: Deal[], klantNamen: Map<string, string>, opts: { melding?: string } = {}) {
  const groepen = DEAL_FASES.map((f) => ({
    ...f,
    items: deals.filter((d) => d.fase === f.fase),
  }));
  const open = deals.filter((d) => d.fase !== "gewonnen" && d.fase !== "verloren");
  const openWaarde = open.reduce((a, d) => a + (d.waarde_cents ?? 0), 0);
  return page({
    title: "Pipeline",
    intro: `${open.length} open deal${open.length === 1 ? "" : "s"} · totaal ${euro(openWaarde)}`,
    actions: html`<a class="btn btn-soft" style="margin:0" href="/crm/deal/nieuw">+ Deal</a>`,
    children: html`
      ${toast(opts.melding)}
      ${deals.length === 0
        ? emptyState({ icon: "bracket", title: "Nog geen deals", text: "Voeg een deal toe om de pipeline op te bouwen." })
        : groepen.map(
            (g) => html`<h2>${g.label} <span class="muted" style="font-weight:600;font-size:.85rem">(${g.items.length}${g.items.length ? ` · ${euro(g.items.reduce((a, d) => a + (d.waarde_cents ?? 0), 0))}` : ""})</span></h2>
              ${g.items.length === 0
                ? html`<p class="empty">—</p>`
                : html`<ul class="clean">
                    ${g.items.map(
                      (d) => html`<li>
                        <a href="/crm/deal/${d.id}" style="display:block;text-decoration:none;color:inherit">
                          <strong>${d.titel}</strong>
                          <div class="muted" style="font-size:.8rem;margin-top:2px">
                            ${d.klant_id ? klantNamen.get(d.klant_id) ?? "" : ""} · ${euro(d.waarde_cents)}${d.eigenaar_naam ? ` · ${d.eigenaar_naam}` : ""}
                          </div>
                        </a>
                      </li>`,
                    )}
                  </ul>`}`,
          )}
    `,
  });
}

/* ---------- Formulieren ---------- */

// Talen zoals het portaal ze kent (portal/i18n).
const KLANT_TALEN: { code: string; label: string }[] = [
  { code: "nl", label: "Nederlands" }, { code: "en", label: "Engels" }, { code: "de", label: "Duits" },
  { code: "pl", label: "Pools" }, { code: "fr", label: "Frans" }, { code: "es", label: "Spaans" },
];

export function crmKlantForm(klant?: CrmKlant) {
  const bewerk = !!klant;
  return detail({
    backHref: bewerk ? `/crm/klant/${klant!.id}` : "/crm",
    backLabel: bewerk ? klant!.naam : "CRM",
    title: bewerk ? "Klant bewerken" : "Klant toevoegen",
    children: formPage({
      title: bewerk ? klant!.naam : "Nieuwe klant",
      intro: "Met een e-mailadres én “Actief” aan kan de klant ook inloggen op het klantenportaal.",
      action: bewerk ? `/crm/klant/${klant!.id}/bewerk` : "/crm/klant",
      submitLabel: "Opslaan",
      children: html`
        <label>Naam <input name="naam" required maxlength="120" value="${klant?.naam ?? ""}" /></label>
        <label>Bedrijf <input name="bedrijf" maxlength="120" value="${klant?.bedrijf ?? ""}" /></label>
        <label>E-mail <input type="email" name="email" maxlength="160" value="${klant?.email ?? ""}" placeholder="Voor portaal-login (optioneel)" /></label>
        <label>Taal
          <select name="taal">
            <option value="">— Standaard (NL) —</option>
            ${KLANT_TALEN.map((t) => html`<option value="${t.code}" ${klant?.taal === t.code ? "selected" : ""}>${t.label}</option>`)}
          </select>
        </label>
        <label class="row" style="gap:8px;font-weight:500"><input type="checkbox" name="actief" ${!bewerk || klant!.actief ? "checked" : ""} /> Actief (portaal-toegang)</label>
        <label>Notitie <textarea name="notitie" rows="3" maxlength="1000">${klant?.notitie ?? ""}</textarea></label>
      `,
    }),
  });
}

export function crmContactForm(klantId: string, klantNaam: string, contact?: Contactpersoon) {
  const bewerk = !!contact;
  return detail({
    backHref: `/crm/klant/${klantId}`,
    backLabel: klantNaam,
    title: bewerk ? "Contactpersoon bewerken" : "Contactpersoon toevoegen",
    children: html`
      ${formPage({
        title: bewerk ? contact!.naam : "Nieuw contactpersoon",
        action: bewerk ? `/crm/contact/${contact!.id}` : `/crm/klant/${klantId}/contact`,
        submitLabel: "Opslaan",
        children: html`
          <label>Naam <input name="naam" required maxlength="120" value="${contact?.naam ?? ""}" /></label>
          <label>Functie <input name="functie" maxlength="120" value="${contact?.functie ?? ""}" /></label>
          <label>E-mail <input type="email" name="email" maxlength="160" value="${contact?.email ?? ""}" /></label>
          <label>Telefoon <input name="telefoon" maxlength="40" value="${contact?.telefoon ?? ""}" /></label>
          <label>Notitie <textarea name="notitie" rows="3" maxlength="1000">${contact?.notitie ?? ""}</textarea></label>
        `,
      })}
      ${bewerk
        ? html`<form method="post" action="/crm/contact/${contact!.id}/verwijder" style="margin-top:10px" data-undo="Contactpersoon verwijderd">
            <button class="btn btn-berry" style="margin:0">Contactpersoon verwijderen</button>
          </form>`
        : ""}
    `,
  });
}

export function crmMomentForm(klanten: { id: string; naam: string }[], selKlant?: string) {
  return detail({
    backHref: selKlant ? `/crm/klant/${selKlant}` : "/crm",
    backLabel: "CRM",
    title: "Contactmoment vastleggen",
    children: formPage({
      title: "Nieuw contactmoment",
      intro: "Kort verslag van een bezoek, telefoontje of mailwisseling.",
      action: "/crm/moment",
      submitLabel: "Vastleggen",
      children: html`
        ${klantSelect(klanten, "klant", selKlant)}
        <label>Soort
          <select name="type" required>
            ${MOMENT_TYPES.map((t) => html`<option value="${t.type}">${t.label}</option>`)}
          </select>
        </label>
        <label>Datum <input type="date" name="datum" required value="${dateInputValue(Date.now())}" /></label>
        <label>Notitie <textarea name="notitie" rows="4" required maxlength="2000" placeholder="Wat is er besproken of afgesproken?"></textarea></label>
      `,
    }),
  });
}

export function crmTaakForm(klanten: { id: string; naam: string }[], players: Player[], opts: { selKlant?: string; meId?: string } = {}) {
  return detail({
    backHref: opts.selKlant ? `/crm/klant/${opts.selKlant}` : "/crm/taken",
    backLabel: opts.selKlant ? "Klant" : "Taken",
    title: "Taak toevoegen",
    children: formPage({
      title: "Nieuwe taak",
      action: "/crm/taak",
      submitLabel: "Taak aanmaken",
      children: html`
        <label>Titel <input name="titel" required maxlength="160" placeholder="bv. Offerte nasturen / terugbellen over rassenkeuze" /></label>
        ${klantSelect(klanten, "klant", opts.selKlant, false)}
        <label>Deadline <input type="date" name="deadline" /></label>
        ${eigenaarSelect(players, opts.meId)}
        <label>Omschrijving <textarea name="omschrijving" rows="3" maxlength="1000"></textarea></label>
      `,
    }),
  });
}

export function crmDealForm(
  klanten: { id: string; naam: string }[],
  players: Player[],
  opts: { deal?: Deal; selKlant?: string; meId?: string } = {},
) {
  const d = opts.deal;
  const bewerk = !!d;
  return detail({
    backHref: "/crm/pipeline",
    backLabel: "Pipeline",
    title: bewerk ? "Deal bewerken" : "Deal toevoegen",
    children: html`
      ${formPage({
        title: bewerk ? d!.titel : "Nieuwe deal",
        action: bewerk ? `/crm/deal/${d!.id}` : "/crm/deal",
        submitLabel: "Opslaan",
        children: html`
          <label>Titel <input name="titel" required maxlength="160" value="${d?.titel ?? ""}" placeholder="bv. Levering aardbeiplanten seizoen 2027" /></label>
          ${klantSelect(klanten, "klant", d?.klant_id ?? opts.selKlant)}
          <label>Waarde (€) <input type="number" name="waarde" min="0" step="0.01" value="${d?.waarde_cents != null ? (d.waarde_cents / 100).toFixed(2) : ""}" /></label>
          <label>Fase
            <select name="fase" required>
              ${DEAL_FASES.map((f) => html`<option value="${f.fase}" ${d?.fase === f.fase ? "selected" : ""}>${f.label}</option>`)}
            </select>
          </label>
          ${eigenaarSelect(players, d?.eigenaar_id ?? opts.meId)}
          <label>Notitie <textarea name="notitie" rows="3" maxlength="2000">${d?.notitie ?? ""}</textarea></label>
        `,
      })}
      ${bewerk
        ? html`<form method="post" action="/crm/deal/${d!.id}/verwijder" style="margin-top:10px" data-undo="Deal verwijderd">
            <button class="btn btn-berry" style="margin:0">Deal verwijderen</button>
          </form>`
        : ""}
    `,
  });
}
