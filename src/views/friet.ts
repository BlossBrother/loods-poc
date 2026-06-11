import { html } from "hono/html";
import type { MenuItem, LedgerRow, Balance, OrderRow } from "../snacks";
import { euro } from "../snacks";
import { emptyState, pageTitle } from "./templates";
import { lds, eyebrow } from "./loods";

const KIND_LABEL: Record<string, string> = {
  order: "Bestelling", topup_cash: "Bijgeboekt (kas)", settlement: "Verrekend", correction: "Correctie",
};
function datum(ms: number): string {
  return new Date(ms).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function frietBestel(menu: MenuItem[], open: boolean) {
  if (!open) {
    return lds(html`
      ${pageTitle("fries", "Bestellen")}
      <div class="warn" style="font-weight:600">De bestellijst is op dit moment gesloten. Je kunt nu niet bestellen.</div>
      <p class="muted"><a href="/friet/saldo">Mijn saldo →</a></p>
    `);
  }
  return lds(html`
    ${pageTitle("fries", "Bestellen")}
    <p class="muted">Kies je bestelling; het bedrag gaat van je saldo af.</p>
    <form method="post" action="/friet/order" class="card" id="orderform">
      ${menu.length === 0 ? emptyState({ icon: "fries", title: "Nog geen menu", text: "Vraag Wendelien om menu-items toe te voegen." }) : menu.map((m) => html`<label class="row between" style="gap:var(--sp-3)">
        <span>${m.name} <span class="muted">${euro(m.price_cents)}</span></span>
        <input type="number" name="qty_${m.id}" min="0" max="20" value="0" data-price="${m.price_cents}" style="width:84px;margin:0" />
      </label>`)}
      <p style="font-weight:800;font-size:1.2rem">Totaal: <span id="total" style="color:var(--t-ink)">€ 0,00</span></p>
      <button type="submit">Bestellen</button>
    </form>
    <p class="muted"><a href="/friet/saldo">Mijn saldo →</a></p>
    <script>
      (function(){ var f=document.getElementById('orderform'); if(!f) return;
        function calc(){ var t=0; f.querySelectorAll('input[type=number]').forEach(function(i){ t+=(parseInt(i.value,10)||0)*parseInt(i.dataset.price,10); });
          document.getElementById('total').textContent='€ '+(t/100).toFixed(2).replace('.',','); }
        f.addEventListener('input',calc); calc(); })();
    </script>
  `);
}

export function mijnSaldo(saldoCents: number, ledger: LedgerRow[]) {
  return lds(html`
    ${pageTitle("wallet", "Mijn saldo")}
    <article class="card" style="text-align:center">
      <div class="muted">Huidig saldo</div>
      <div style="font-size:2.2rem;font-weight:800;color:${saldoCents < 0 ? "var(--berry)" : "var(--t-ink)"}">${euro(saldoCents)}</div>
      ${saldoCents < 0 ? html`<div class="muted">Te verrekenen met Wendelien (kas).</div>` : ""}
    </article>
    <a class="btn" href="/friet">Nieuwe bestelling</a>
    ${eyebrow("Mutaties")}
    ${ledger.length === 0 ? emptyState({ icon: "wallet", title: "Nog geen mutaties", text: "Je eerste bestelling of bijboeking verschijnt hier." }) : html`<article class="card listcard"><ul class="clean">${ledger.map((l) => html`<li style="display:flex;justify-content:space-between;gap:10px">
        <span>${KIND_LABEL[l.kind] ?? l.kind}${l.description ? html` <span class="muted">· ${l.description}</span>` : ""}<br /><span class="muted">${datum(l.created_at)}</span></span>
        <strong style="color:${l.amount_cents < 0 ? "var(--berry)" : "var(--t-ink)"}">${euro(l.amount_cents)}</strong>
      </li>`)}</ul></article>`}
    <p class="muted"><a href="/mijn-account">← mijn account</a></p>
  `);
}

export function frietBeheer(balances: Balance[], menu: MenuItem[], open: boolean, orders: OrderRow[]) {
  const totaal = orders.reduce((s, o) => s + o.amount_cents, 0);
  return lds(html`
    ${pageTitle("cog", "Kantine-beheer")}
    <p class="muted">Saldo's, handmatig bijboeken (kas) en verrekenen. Negatief = de collega moet bijbetalen.</p>

    <article class="card" style="display:flex;align-items:center;gap:var(--sp-3);flex-wrap:wrap">
      <div class="grow"><strong>Bestellijst</strong> <span class="muted">— ${open ? "geopend" : "gesloten"}</span></div>
      <form method="post" action="/friet/beheer/bestellijst" style="margin:0">
        <input type="hidden" name="open" value="${open ? "0" : "1"}" />
        <button class="btn ${open ? "btn-berry" : ""}" style="margin:0;padding:9px 16px">${open ? "Bestellijst sluiten" : "Bestellijst openen"}</button>
      </form>
    </article>

    ${eyebrow(`Bestellingen vandaag · ${orders.length}`)}
    ${orders.length === 0
      ? emptyState({ icon: "fries", title: "Nog geen bestellingen vandaag" })
      : html`<article class="card listcard"><ul class="clean">${orders.map((o) => html`<li style="display:flex;justify-content:space-between;gap:10px">
          <span><strong>${o.naam}</strong> <span class="muted">${o.description ?? ""}</span><br /><span class="muted">${datum(o.created_at)}</span></span>
          <strong>${euro(-o.amount_cents)}</strong>
        </li>`)}</ul></article>
        <p style="font-weight:800">Totaal vandaag: <span style="color:var(--t-ink)">${euro(-totaal)}</span> <span class="muted" style="font-weight:600">· ${orders.length} bestelling(en)</span></p>`}

    ${eyebrow("Saldo's")}
    ${balances.length === 0 ? html`<p class="empty">Geen collega's.</p>` : html`<article class="card listcard"><ul class="clean">${balances.map((b) => html`<li class="row wrap" style="gap:var(--sp-2)">
        <span style="flex:1 1 100%"><strong>${b.naam}</strong> <span style="color:${b.balance < 0 ? "var(--berry)" : "var(--t-ink)"};font-weight:700">${euro(b.balance)}</span></span>
        <form method="post" class="row wrap" style="margin:0; gap:6px">
          <input type="hidden" name="player_id" value="${b.player_id}" />
          <input type="number" name="euro" step="0.01" placeholder="€ (− mag)" style="width:96px;margin:0" />
          <button class="btn-soft btn" formaction="/friet/beheer/topup" style="margin:0;padding:var(--sp-2) var(--sp-3)">+ Bijboeken</button>
          <button class="btn-soft btn" formaction="/friet/beheer/setbalance" style="margin:0;padding:var(--sp-2) var(--sp-3)">Zet saldo</button>
          <button class="btn-berry btn" formaction="/friet/beheer/settle" formnovalidate style="margin:0;padding:var(--sp-2) var(--sp-3)" onclick="return confirm('Saldo van ${b.naam} naar 0?')">Verrekenen</button>
        </form>
      </li>`)}</ul></article>`}

    ${eyebrow("Menu")}
    <form method="post" action="/friet/beheer/menu" class="card">
      <div class="row2">
        <label>Nieuw item <input name="name" required /></label>
        <label>Prijs (€) <input name="euro" type="number" step="0.01" min="0" required /></label>
      </div>
      <button type="submit">Toevoegen</button>
    </form>
    ${menu.length === 0 ? "" : html`<form method="post" action="/friet/beheer/menu/bulk" class="card">
      <p class="muted" style="margin-top:0;font-size:.85rem">Pas prijzen en actief-status aan en sla alles in één keer op.</p>
      <ul class="clean" style="margin:0">${menu.map((m) => html`<li>
        <div class="row" style="gap:10px; flex-wrap:nowrap">
          <span style="font-weight:700;flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis">${m.name}</span>
          <input name="euro_${m.id}" type="number" step="0.01" min="0" value="${(m.price_cents / 100).toFixed(2)}" style="width:90px;margin:0;flex:0 0 auto" />
          <label class="row" style="gap:5px; font-weight:600; margin:0; flex:0 0 auto"><input type="checkbox" name="active_${m.id}" ${m.active ? "checked" : ""} /> actief</label>
        </div>
      </li>`)}</ul>
      <button type="submit">Alles opslaan</button>
    </form>`}
    <p class="muted"><a href="/beheer">← beheer</a></p>
  `);
}
