import { html, raw } from "hono/html";
import type {
  AirtableRecord,
  MedewerkerFields,
  NieuwsFields,
  DocumentFields,
  AfdelingFields,
  KlantFields,
  RasFields,
  TeeltadviesFields,
  SnoeiPlukFields,
  KlantdocumentFields,
} from "../airtable";
import { PUSH_FEATURES } from "../modules";
import { TILE_ICONS, type Tile } from "../tiles";
import { PULSE_DREMPEL, type PulseVraag, type PulseResultaat } from "../pulse";
import type { NavLayout } from "../nav";
import { svg } from "./layout";
import { eyebrow } from "./loods";
import { pageTitle } from "./templates";

// Lucide/Feather-stijl lijniconen (24x24) — consistent met de zijbalk/home.
const ico = (p: string) =>
  raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`);
const BICO: Record<string, ReturnType<typeof ico>> = {
  news: ico(`<path d="M4 5h16v14H4z"/><path d="M8 9h8M8 12.5h8M8 16h5"/>`),
  doc: ico(`<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 13h5M9.5 16.5h5"/>`),
  people: ico(`<circle cx="9" cy="8" r="3"/><path d="M3 19c0-3 2.7-4.6 6-4.6"/><circle cx="17" cy="9.5" r="2.3"/><path d="M14.8 19c0-2.4 1.7-3.8 3.9-3.8"/>`),
  tag: ico(`<path d="M4 12V5h7l9 9-7 7-9-9Z"/><circle cx="8.5" cy="8.5" r="1.4"/>`),
  client: ico(`<circle cx="12" cy="8" r="3.2"/><path d="M5.5 19c0-3.6 2.9-5.5 6.5-5.5S18.5 15.4 18.5 19"/>`),
  leaf: ico(`<path d="M5 19c0-8 6-13 14-13 0 8-6 13-14 13Z"/><path d="M5 19c3-5 7-8 11-9"/>`),
  scissors: ico(`<circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><path d="M8 7.5 20 18M8 16.5 20 6"/>`),
  download: ico(`<path d="M12 4v10m0 0 4-4m-4 4-4-4"/><path d="M5 19h14"/>`),
  trophy: ico(`<path d="M7 4h10v3a5 5 0 0 1-10 0Z"/><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3"/><path d="M9.5 12.5 9 16h6l-.5-3.5M8 19h8"/>`),
  bell: ico(`<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/>`),
  toggle: ico(`<rect x="3" y="8" width="18" height="8" rx="4"/><circle cx="9" cy="12" r="2.4" fill="currentColor" stroke="none"/>`),
  alert: ico(`<path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4M12 17.5v.5"/>`),
  sos: ico(`<path d="M12 3 4 6v6c0 4.5 3.4 7.6 8 9 4.6-1.4 8-4.5 8-9V6l-8-3Z"/><path d="M12 9v5M9.5 11.5h5"/>`),
  book: ico(`<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H12v15H5.5A1.5 1.5 0 0 1 4 17.5Z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H12v15h6.5a1.5 1.5 0 0 0 1.5-1.5Z"/>`),
};

interface BeheerTegel { href: string; label: string; desc: string; icon: keyof typeof BICO }
interface BeheerGroep { title: string; tegels: BeheerTegel[] }
const BEHEER_GROEPEN: BeheerGroep[] = [
  { title: "Platform", tegels: [
    { href: "/beheer/modules", label: "Modules", desc: "Onderdelen aan/uit zetten", icon: "toggle" },
    { href: "/beheer/header", label: "Header & begroeting", desc: "Begroeting bovenaan home", icon: "news" },
    { href: "/beheer/tiles", label: "Snelkoppelingen", desc: "App-tegels op home (Buddee, TimeChimp, WK…)", icon: "toggle" },
    { href: "/beheer/pulse", label: "Pulse", desc: "Anonieme peiling als kaart in de feed", icon: "alert" },
    { href: "/beheer/push", label: "Pushmelding", desc: "Stuur een melding naar collega's", icon: "bell" },
    { href: "/beheer/meldingen", label: "Meldingen-ontvangers", desc: "Wie krijgt de wekelijkse samenvatting", icon: "alert" },
    { href: "/beheer/bhv", label: "BHV-groep", desc: "Wie krijgt de noodmelding", icon: "sos" },
    { href: "/beheer/bugmeldingen", label: "Feedback", desc: "Bugs, ideeën + status", icon: "alert" },
    { href: "/beheer/audit", label: "Audit-log", desc: "Wie deed wat en wanneer + CSV", icon: "doc" },
  ] },
  { title: "Inhoud", tegels: [
    { href: "/beheer/nieuws", label: "Nieuws", desc: "Berichten plaatsen en publiceren", icon: "news" },
    { href: "/beheer/documenten", label: "Documenten", desc: "Documenten en links", icon: "doc" },
    { href: "/beheer/medewerkers", label: "Medewerkers", desc: "Collega's, e-mail, rol, verjaardag", icon: "people" },
    { href: "/beheer/afdelingen", label: "Afdelingen", desc: "De keuzelijst voor afdelingen", icon: "tag" },
    { href: "/beheer/trainingen", label: "Trainingen", desc: "Cursussen en hoofdstukken", icon: "book" },
    { href: "/beheer/leesbevestiging", label: "Leesbevestiging", desc: "Wie heeft welk nieuws/beleid gelezen", icon: "doc" },
    { href: "/beheer/kennisdump", label: "Kennisdump", desc: "Drop documenten — AI leest, categoriseert en indexeert ze", icon: "doc" },
    { href: "/beheer/analytics", label: "Analytics", desc: "Gebruik per week/dag, assistent, prikbord — geaggregeerd", icon: "doc" },
  ] },
  { title: "Klantenportaal", tegels: [
    { href: "/beheer/klanten", label: "Klanten", desc: "Portaal-toegang & inloglinks", icon: "client" },
    { href: "/beheer/rassen", label: "Rassen", desc: "Rasseninformatie", icon: "leaf" },
    { href: "/beheer/teeltadvies", label: "Teeltadvies", desc: "Teeltadviezen", icon: "leaf" },
    { href: "/beheer/snoei", label: "Snoei & pluk", desc: "Snoei-/plukinstructies", icon: "scissors" },
    { href: "/beheer/klantdocumenten", label: "Klantdocumenten", desc: "Downloads voor klanten", icon: "download" },
  ] },
];

// v186: Redacteur = content-beheer (HR); Uitzendkracht = beperkte toegang (prikbord/agenda/nieuws).
const ROLLEN = ["Beheerder", "Redacteur", "Medewerker", "Receptie", "Uitzendkracht"];
// Rollen die alleen een volledige beheerder mag toekennen (geen escalatie door HR).
const BESCHERMDE_ROLLEN = ["Beheerder", "Redacteur"];
const NIEUWS_CAT = ["Algemeen", "HR", "IT", "Directie", "Evenement"];
const NIEUWS_STATUS = ["Concept", "Gepubliceerd", "Gearchiveerd"];
const ZICHTBAAR = ["Iedereen", "Specifieke afdeling"];
const DOC_CAT = ["Beleid", "Formulieren", "Handleidingen", "Notulen"];
const TALEN = ["Nederlands", "English", "Deutsch", "Español"];

function sel(name: string, opties: string[], waarde?: string) {
  return html`<select name="${name}">
    <option value="">—</option>
    ${opties.map((o) => html`<option ${o === waarde ? "selected" : ""}>${o}</option>`)}
  </select>`;
}

const check = (aan: boolean, label: string, name: string) =>
  html`<label class="row" style="gap:var(--sp-2); font-weight:600">
    <input type="checkbox" name="${name}" ${aan ? "checked" : ""} /> ${label}
  </label>`;

export function geenToegang() {
  return html`
    <h1>Geen toegang</h1>
    <p class="muted">Deze pagina is alleen voor beheerders. Vraag een beheerder om je
      rol op "Beheerder" te zetten, of je e-mail toe te voegen aan de beheerderslijst.</p>
    <p><a href="/">← terug naar intranet</a></p>
  `;
}

// Beheer → Pulse: anonieme peilingen. Eén actieve vraag; resultaten pas vanaf de drempel.
function pulseResultaatKaart(r: PulseResultaat) {
  return html`<article class="card" style="margin-top:14px">
    <h2 style="margin-top:0">Resultaat — actieve vraag</h2>
    <p style="font-weight:600">${r.vraag.vraag}</p>
    ${!r.voldoende
      ? html`<p class="muted">${r.totaal} ${r.totaal === 1 ? "reactie" : "reacties"} — resultaten verschijnen vanaf ${PULSE_DREMPEL} reacties (anonimiteit bij kleine groepen).</p>`
      : html`
        <p class="muted">${r.totaal} reacties${r.gemiddelde != null ? html` · gemiddelde ${r.gemiddelde.toFixed(1)}` : ""}</p>
        <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">
          ${r.verdeling.map((b) => {
            const pct = r.totaal ? Math.round((b.aantal / r.totaal) * 100) : 0;
            return html`<div class="row" style="gap:8px;align-items:center">
              <span style="width:120px;flex:none;font-size:.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.label}</span>
              <span style="flex:1;background:var(--line);border-radius:6px;height:14px;overflow:hidden"><span style="display:block;height:100%;width:${pct}%;background:var(--accent)"></span></span>
              <span style="width:64px;flex:none;text-align:right;font-size:.8rem">${b.aantal} (${pct}%)</span>
            </div>`;
          })}
        </div>`}
  </article>`;
}

export function beheerPulse(vragen: PulseVraag[], actief: PulseResultaat | null, opts: { melding?: string } = {}) {
  return html`
    <h1>Pulse</h1>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    <p class="muted">Anonieme peilingen. Eén vraag tegelijk actief; die verschijnt als kaart op home.
      Antwoorden zijn anoniem (niet te herleiden); resultaten worden pas getoond vanaf
      ${PULSE_DREMPEL} reacties en niet per afdeling uitgesplitst (privacy bij kleine groepen).</p>

    <form method="post" action="/beheer/pulse" class="card">
      <h2 style="margin-top:0">Nieuwe vraag</h2>
      <label>Vraag <input name="vraag" maxlength="160" required placeholder="Hoe is je werkweek?" /></label>
      <fieldset style="border:0;padding:0;margin:12px 0 0">
        <label class="row" style="gap:6px;font-weight:600"><input type="radio" name="type" value="schaal" checked /> Schaal 1–5 (oneens → eens)</label>
        <label class="row" style="gap:6px;font-weight:600;margin-top:6px"><input type="radio" name="type" value="keuze" /> Meerkeuze</label>
      </fieldset>
      <label>Opties <span class="muted" style="font-size:.78rem">(alleen bij meerkeuze, één per regel)</span>
        <textarea name="opties" rows="3" placeholder="Ja&#10;Nee&#10;Soms"></textarea>
      </label>
      <p class="muted" style="font-size:.8rem">Een nieuwe vraag activeren sluit de vorige automatisch.</p>
      <button type="submit">Activeren</button>
    </form>

    ${actief ? pulseResultaatKaart(actief) : ""}

    ${eyebrow("Eerdere vragen")}
    <article class="card listcard">
      ${vragen.length === 0
        ? html`<p class="muted" style="margin:0">Nog geen pulse-vragen.</p>`
        : html`<ul class="clean">
            ${vragen.map((v) => html`<li class="row" style="gap:10px;align-items:center;justify-content:space-between">
              <span style="min-width:0"><strong>${v.vraag}</strong>
                <span class="muted" style="font-size:.8rem"> · ${v.type}${v.actief ? html` · <span class="tag">actief</span>` : " · gesloten"}</span></span>
              ${v.actief
                ? html`<form method="post" action="/beheer/pulse" style="margin:0;flex:none"><input type="hidden" name="sluit" value="${v.id}" /><button class="btn btn-soft" style="margin:0">Sluiten</button></form>`
                : ""}
            </li>`)}
          </ul>`}
    </article>
    <p class="muted"><a href="/beheer">&larr; beheer</a></p>
  `;
}

// Beheer → Snelkoppelingen: de app-tegels (chips) op home beheren zonder code/deploy.
export function beheerTiles(tiles: Tile[], opts: { melding?: string } = {}) {
  const data = JSON.stringify({ tiles, icons: TILE_ICONS }).replace(/</g, "\\u003c");
  return html`
    <h1>Snelkoppelingen</h1>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    <p class="muted">De app-tegels in de chip-rij bovenaan home (Buddee, TimeChimp,
      WK-poule en eigen links). Sleep-volgorde = volgorde van tonen. Links moeten met
      <code>https://</code> beginnen, of een intern pad (<code>/agenda</code>). Uitgevinkt = verborgen
      (handig om bijv. de WK-poule na het toernooi weg te halen).</p>
    <form method="post" action="/beheer/tiles" class="card" id="tform">
      <div id="trows"></div>
      <button type="button" id="tadd" class="btn btn-soft" style="margin-top:6px">+ Snelkoppeling toevoegen</button>
      <input type="hidden" name="tiles" id="tjson" />
      <div style="margin-top:16px">
        <button type="submit">Opslaan</button>
        <button type="submit" name="reset" value="1" class="btn btn-soft" style="margin-left:8px">Reset naar standaard</button>
      </div>
    </form>
    <p class="muted"><a href="/beheer">&larr; beheer</a></p>

    <script type="application/json" id="tdata">${raw(data)}</script>
    <script>
      (function () {
        var init = { tiles: [], icons: [] };
        try { init = JSON.parse(document.getElementById("tdata").textContent); } catch (e) {}
        var rows = document.getElementById("trows");
        var form = document.getElementById("tform");
        function rowEl(t) {
          var d = document.createElement("div");
          d.className = "trow row"; d.style.cssText = "gap:8px;margin:6px 0;flex-wrap:wrap;align-items:center";
          var optn = (init.icons || []).map(function (ic) {
            return '<option value="' + ic + '"' + (t.icon === ic ? " selected" : "") + ">" + ic + "</option>";
          }).join("");
          d.innerHTML =
            '<input class="t-label" type="text" maxlength="40" placeholder="Naam" style="flex:1 1 110px;margin:0" />' +
            '<input class="t-url" type="text" maxlength="400" placeholder="https://… of /pad" style="flex:2 1 200px;margin:0" />' +
            '<select class="t-icon" style="flex:0 0 auto;margin:0">' + optn + "</select>" +
            '<label class="row" style="gap:5px;font-size:.82rem;margin:0"><input class="t-on" type="checkbox" /> aan</label>' +
            '<button type="button" class="btn btn-soft t-up" title="Omhoog" style="margin:0;padding:6px 9px">↑</button>' +
            '<button type="button" class="btn btn-soft t-del" title="Verwijderen" style="margin:0;padding:6px 10px">×</button>';
          d.querySelector(".t-label").value = t.label || "";
          d.querySelector(".t-url").value = t.url || "";
          d.querySelector(".t-on").checked = t.enabled !== false;
          d.querySelector(".t-del").addEventListener("click", function () { d.remove(); serialize(); });
          d.querySelector(".t-up").addEventListener("click", function () {
            if (d.previousElementSibling) rows.insertBefore(d, d.previousElementSibling);
            serialize();
          });
          d.addEventListener("input", serialize);
          d.addEventListener("change", serialize);
          return d;
        }
        function collect() {
          return Array.prototype.slice.call(rows.querySelectorAll(".trow")).map(function (d) {
            return {
              label: d.querySelector(".t-label").value.trim(),
              url: d.querySelector(".t-url").value.trim(),
              icon: d.querySelector(".t-icon").value,
              enabled: d.querySelector(".t-on").checked,
            };
          }).filter(function (t) { return t.label && t.url; });
        }
        function serialize() { document.getElementById("tjson").value = JSON.stringify(collect()); }
        (init.tiles || []).forEach(function (t) { rows.appendChild(rowEl(t)); });
        if (!(init.tiles || []).length) rows.appendChild(rowEl({ icon: "link", enabled: true }));
        serialize();
        document.getElementById("tadd").addEventListener("click", function () { rows.appendChild(rowEl({ icon: "link", enabled: true })); serialize(); });
        form.addEventListener("submit", serialize);
      })();
    </script>
  `;
}

export function beheerHome(volledig = true) {
  // Redacteur (HR): alleen de Inhoud-groep; volledige beheerders zien alles.
  const groepen = volledig ? BEHEER_GROEPEN : BEHEER_GROEPEN.filter((g) => g.title === "Inhoud");
  return html`
    ${pageTitle("cog", "Beheer")}
    <p class="muted">Beheer de inhoud${volledig ? " en onderdelen" : ""} van het platform. Wijzigingen zijn direct live.</p>
    ${groepen.map(
      (g) => html`${eyebrow(g.title)}
        <div class="appgrid beheergrid">
          ${g.tegels.map(
            (t) => html`<a class="apptile" href="${t.href}">
              <div class="ico ico-green">${BICO[t.icon]}</div>
              <div class="txt"><span class="appname">${t.label}</span><span class="appdesc">${t.desc}</span></div>
            </a>`,
          )}
        </div>`,
    )}
    <p class="muted" style="margin-top:18px"><a href="/">← terug naar intranet</a></p>
  `;
}

const CHEV_UP = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14l6-6 6 6"/></svg>`;
const CHEV_DOWN = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 10l6 6 6-6"/></svg>`;

const DRAG_DOTS = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>`;
const X_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>`;

// Client-script voor het menu-indeling-beheer: drag&drop (desktop), verplaats-naar +
// omhoog/omlaag (mobiel), groep toevoegen/hernoemen/verwijderen/herordenen, en alles
// serialiseren naar het verborgen layout-veld bij elke wijziging + submit.
const NAV_ADMIN_JS = `(function(){
  var form=document.getElementById('navform'); if(!form) return;
  var wrap=document.getElementById('ng-groups'); var addBtn=document.getElementById('ng-add'); var out=document.getElementById('ng-json');
  function groups(){ return Array.prototype.slice.call(wrap.querySelectorAll('.navgroup')); }
  function refresh(){
    var gs=groups().map(function(s){ return { id:s.getAttribute('data-gid'), naam:(s.querySelector('.ng-name')||{}).value||'' }; });
    wrap.querySelectorAll('.moveto').forEach(function(sel){
      var own=sel.closest('.navgroup').getAttribute('data-gid');
      sel.innerHTML='<option value="">verplaats…</option>'+gs.filter(function(g){return g.id!==own;}).map(function(g){return '<option value="'+g.id+'">'+((g.naam||'(groep)').replace(/</g,'&lt;'))+'</option>';}).join('');
      sel.value='';
    });
  }
  function serialize(){
    var res={ groups:[], modules:{} };
    groups().forEach(function(sec){
      var gid=sec.getAttribute('data-gid'); var naam=(sec.querySelector('.ng-name')||{}).value||'Groep';
      res.groups.push({ id:gid, naam:naam });
      var us=sec.querySelectorAll('.units .unit');
      for(var i=0;i<us.length;i++){ res.modules[us[i].getAttribute('data-key')]={ group:gid, order:i }; }
    });
    out.value=JSON.stringify(res);
  }
  var drag=null;
  wrap.addEventListener('dragstart', function(e){ var u=e.target.closest('.unit'); if(!u) return; drag=u; u.classList.add('dragging'); try{e.dataTransfer.effectAllowed='move';}catch(x){} });
  wrap.addEventListener('dragend', function(){ if(drag) drag.classList.remove('dragging'); drag=null; wrap.querySelectorAll('.dragover').forEach(function(x){x.classList.remove('dragover');}); serialize(); });
  wrap.addEventListener('dragover', function(e){
    if(!drag) return; e.preventDefault();
    var cont=e.target.closest('.units'); if(!cont) return;
    wrap.querySelectorAll('.dragover').forEach(function(x){x.classList.remove('dragover');});
    var sec=cont.closest('.navgroup'); if(sec) sec.classList.add('dragover');
    var items=Array.prototype.slice.call(cont.querySelectorAll('.unit:not(.dragging)')); var after=null;
    for(var i=0;i<items.length;i++){ var r=items[i].getBoundingClientRect(); if(e.clientY<r.top+r.height/2){ after=items[i]; break; } }
    if(after) cont.insertBefore(drag, after); else cont.appendChild(drag);
  });
  wrap.addEventListener('change', function(e){
    var sel=e.target.closest('.moveto'); if(!sel) return; var gid=sel.value; if(!gid) return;
    var u=sel.closest('.unit'); var t=wrap.querySelector('.navgroup[data-gid="'+gid+'"] .units');
    if(t&&u) t.appendChild(u); refresh(); serialize();
  });
  wrap.addEventListener('click', function(e){
    var b=e.target.closest('button'); if(!b) return;
    if(b.classList.contains('uup')||b.classList.contains('udown')){ var u=b.closest('.unit'); var s=b.classList.contains('uup')?u.previousElementSibling:u.nextElementSibling; if(s){ if(b.classList.contains('uup')) u.parentNode.insertBefore(u,s); else u.parentNode.insertBefore(s,u); } serialize(); return; }
    if(b.classList.contains('gup')||b.classList.contains('gdown')){ var sec=b.closest('.navgroup'); var g=b.classList.contains('gup')?sec.previousElementSibling:sec.nextElementSibling; if(g&&g.classList.contains('navgroup')){ if(b.classList.contains('gup')) wrap.insertBefore(sec,g); else wrap.insertBefore(g,sec); } serialize(); return; }
    if(b.classList.contains('gdel')){ var sec2=b.closest('.navgroup'); var rest=groups().filter(function(x){return x!==sec2;}); if(!rest.length){ alert('Er moet minstens één groep blijven.'); return; } var t2=rest[0].querySelector('.units'); sec2.querySelectorAll('.units .unit').forEach(function(u){ t2.appendChild(u); }); sec2.remove(); refresh(); serialize(); return; }
  });
  addBtn.addEventListener('click', function(){
    var tpl=wrap.querySelector('.navgroup'); if(!tpl) return;
    var gid='g'+Date.now().toString(36);
    var sec=tpl.cloneNode(true); sec.classList.remove('dragover'); sec.setAttribute('data-gid',gid);
    var un=sec.querySelector('.units'); un.setAttribute('data-gid',gid); un.innerHTML='';
    var nm=sec.querySelector('.ng-name'); if(nm) nm.value='Nieuwe groep';
    wrap.appendChild(sec); refresh(); serialize(); if(nm) nm.focus();
  });
  form.addEventListener('submit', function(){ serialize(); });
  refresh(); serialize();
})();`;

export function beheerModules(navLayout: NavLayout, shoutoutsHome = false, opts: { melding?: string; leesKnop?: boolean } = {}) {
  const byGroup = (gid: string) => navLayout.modules.filter((m) => m.group === gid).sort((a, b) => a.order - b.order);
  const unit = (m: { key: string; label: string; enabled: boolean; icon: string }) => html`<div class="unit" draggable="true" data-key="${m.key}">
    <span class="uhandle umod" title="Versleep">${svg(m.icon)}</span>
    <label class="uswitch" title="Aan/uit"><input type="checkbox" name="module" value="${m.key}" ${m.enabled ? "checked" : ""} /><span></span></label>
    <span class="ulabel">${m.label}</span>
    <span class="uctrl">
      <button type="button" class="btn btn-soft uup" title="Omhoog" aria-label="Omhoog">${raw(CHEV_UP)}</button>
      <button type="button" class="btn btn-soft udown" title="Omlaag" aria-label="Omlaag">${raw(CHEV_DOWN)}</button>
      <select class="moveto" aria-label="Verplaats naar groep"><option value="">verplaats…</option></select>
    </span>
  </div>`;
  const groupSection = (g: { id: string; naam: string }) => html`<section class="navgroup" data-gid="${g.id}">
    <div class="ng-head">
      <span class="ghandle" title="Versleep groep" aria-hidden="true">${raw(DRAG_DOTS)}</span>
      <input class="ng-name" value="${g.naam}" maxlength="40" aria-label="Groepsnaam" />
      <button type="button" class="btn btn-soft gup" title="Groep omhoog" aria-label="Groep omhoog">${raw(CHEV_UP)}</button>
      <button type="button" class="btn btn-soft gdown" title="Groep omlaag" aria-label="Groep omlaag">${raw(CHEV_DOWN)}</button>
      <button type="button" class="btn btn-soft gdel" title="Groep verwijderen" aria-label="Groep verwijderen">${raw(X_ICON)}</button>
    </div>
    <div class="units" data-gid="${g.id}">${byGroup(g.id).map(unit)}</div>
  </section>`;
  return html`
    <h1>Menu-indeling</h1>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    <p class="muted">Sleep modules tussen de groepen, of gebruik op mobiel <em>“verplaats…”</em> en de pijltjes. Zet ze aan/uit met de schakelaar. Groepen kun je hernoemen, toevoegen, verplaatsen en verwijderen. Home, Account en Beheer staan altijd vast.</p>
    <form method="post" action="/beheer/modules" id="navform" class="card">
      <div id="ng-groups">${navLayout.groups.map(groupSection)}</div>
      <button type="button" class="btn btn-soft" id="ng-add" style="margin-top:var(--sp-3)">+ Groep toevoegen</button>
      <label class="row" style="gap:11px; padding:12px 2px; margin-top:10px; border-top:1px solid var(--line)">
        <input type="checkbox" name="shoutouts_home" ${shoutoutsHome ? "checked" : ""} />
        <span style="flex:1;min-width:0">Recente shout-outs op de homepagina<span class="appdesc" style="display:block;font-weight:400">Toon de laatste shout-outs van het prikbord als blok op home.</span></span>
      </label>
      <label class="row" style="gap:11px; padding:12px 2px; border-top:1px solid var(--line)">
        <input type="checkbox" name="lees_knop" ${opts.leesKnop ? "checked" : ""} />
        <span style="flex:1;min-width:0">"Gelezen"-knop voor medewerkers<span class="appdesc" style="display:block;font-weight:400">Uit = stille registratie: het openen van nieuws/beleid telt als gezien. Beheer → Leesbevestiging toont altijd wie wat gezien (en evt. bevestigd) heeft.</span></span>
      </label>
      <input type="hidden" name="layout" id="ng-json" />
      <button type="submit" style="margin-top:14px">Opslaan</button>
    </form>
    <p class="muted">De indeling en volgorde gelden voor alle gebruikers.</p>
    <p class="muted"><a href="/beheer">← beheer</a></p>
    <style>
      .navgroup{ background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); padding:10px 12px; margin:0 0 12px; box-shadow:var(--shadow); }
      .navgroup.dragover{ border-color:var(--green); box-shadow:inset 0 0 0 2px var(--green); }
      .ng-head{ display:flex; align-items:center; gap:6px; margin-bottom:8px; }
      .ng-name{ flex:1; min-width:0; font-weight:680; font-size:1rem; padding:8px 10px; border:1px solid var(--field-bd); border-radius:var(--radius-sm); background:var(--field); color:var(--ink); }
      .ng-head .btn{ margin:0; padding:7px 9px; min-height:40px; }
      .units{ display:flex; flex-direction:column; gap:8px; min-height:44px; }
      .unit{ display:flex; align-items:center; gap:9px; padding:9px 10px; background:var(--surface-2); border:1px solid var(--line); border-radius:var(--radius-sm); }
      .unit.dragging{ opacity:.5; }
      .uhandle,.ghandle{ cursor:grab; color:var(--muted); touch-action:none; display:inline-flex; }
      .umod{ color:var(--ink); }
      .umod svg{ width:21px; height:21px; }
      .ulabel{ flex:1; min-width:0; font-weight:620; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .uctrl{ display:flex; align-items:center; gap:5px; flex:0 0 auto; }
      .uctrl .btn{ margin:0; padding:6px 8px; min-height:38px; }
      .moveto{ font:inherit; font-size:.82rem; padding:6px 8px; border:1px solid var(--field-bd); border-radius:var(--radius-sm); background:var(--field); color:var(--ink); max-width:120px; }
      .uswitch{ position:relative; display:inline-flex; align-items:center; cursor:pointer; flex:0 0 auto; }
      .uswitch input{ position:absolute; opacity:0; width:100%; height:100%; margin:0; cursor:pointer; }
      .uswitch span{ width:40px; height:24px; border-radius:999px; background:var(--line-strong); transition:background var(--dur-fast) var(--ease-out); position:relative; display:inline-block; }
      .uswitch span::after{ content:""; position:absolute; top:2px; left:2px; width:20px; height:20px; border-radius:50%; background:#fff; transition:transform var(--dur-fast) var(--ease-out); box-shadow:0 1px 3px rgba(0,0,0,.25); }
      .uswitch input:checked + span{ background:var(--green); }
      .uswitch input:checked + span::after{ transform:translateX(16px); }
      @media (max-width:560px){ .uhandle,.ghandle{ display:none; } .moveto{ max-width:104px; } .uctrl{ gap:4px; } .uctrl .btn{ padding:6px 7px; } }
    </style>
    <script>${raw(NAV_ADMIN_JS)}</script>
  `;
}

// Analytics (v206): geaggregeerd beheerdashboard — KPI-kaarten + CSS-staafjes,
// geen chart-library, geen individuele data.
export interface AnalyticsView {
  totaalActief: number; dagActief: number; weekActief: number;
  vragen7d: number; vragenIntern7d: number; posts7d: number; polls7d: number;
  statusVandaag: number; gezienTotaal: number; bevestigdTotaal: number;
  perModule: { module: string; users: number }[];
  perDag: { dag: string; label: string; n: number }[];
}
export function beheerAnalytics(a: AnalyticsView) {
  const pct = (n: number, van: number) => (van > 0 ? Math.round((n / van) * 100) : 0);
  const maxDag = Math.max(1, ...a.perDag.map((x) => x.n));
  const maxMod = Math.max(1, ...a.perModule.map((x) => x.users));
  const kpi = (titel: string, waarde: string, sub: string) => html`
    <article class="card" style="flex:1 1 150px;min-width:150px">
      <p class="muted" style="margin:0;font-size:.74rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase">${titel}</p>
      <p style="margin:4px 0 0;font-size:1.7rem;font-weight:800;line-height:1.1">${waarde}</p>
      <p class="muted" style="margin:2px 0 0;font-size:.8rem">${sub}</p>
    </article>`;
  return html`
    ${pageTitle("doc", "Analytics")}
    <p class="muted">Geaggregeerd en privacyvriendelijk — tellingen, geen individuele tracking.</p>
    <div class="row wrap" style="gap:10px;align-items:stretch">
      ${kpi("Actief deze week", `${a.weekActief}/${a.totaalActief}`, `${pct(a.weekActief, a.totaalActief)}% van de actieve collega's`)}
      ${kpi("Actief vandaag", String(a.dagActief), `${pct(a.dagActief, a.totaalActief)}% van het team`)}
      ${kpi("Assistent-vragen (7d)", String(a.vragen7d), `${a.vragen7d > 0 ? pct(a.vragenIntern7d, a.vragen7d) + "% intern beantwoord" : "nog geen vragen"}`)}
      ${kpi("Ochtendvraag vandaag", `${a.statusVandaag}/${a.totaalActief}`, "heeft de dagstatus ingevuld")}
      ${kpi("Prikbord (7d)", String(a.posts7d + a.polls7d), `${a.posts7d} post${a.posts7d === 1 ? "" : "s"} · ${a.polls7d} poll${a.polls7d === 1 ? "" : "s"}`)}
      ${kpi("Leesregistraties", String(a.gezienTotaal + a.bevestigdTotaal), `${a.gezienTotaal} gezien · ${a.bevestigdTotaal} bevestigd`)}
    </div>
    ${eyebrow("Activiteit per dag (14 dagen — vragen + posts)")}
    <article class="card">
      <div style="display:flex;align-items:flex-end;gap:4px;height:110px">
        ${a.perDag.map((x) => html`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0">
          <div title="${x.dag}: ${x.n}" style="width:100%;max-width:26px;height:${Math.max(3, Math.round((x.n / maxDag) * 86))}px;border-radius:6px 6px 2px 2px;background:linear-gradient(180deg,#3fa468,#236b41);opacity:${x.n === 0 ? ".25" : "1"}"></div>
          <span class="muted" style="font-size:.62rem;white-space:nowrap">${x.label}</span>
        </div>`)}
      </div>
    </article>
    ${eyebrow("Module-bereik (unieke gebruikers, 7 dagen)")}
    ${a.perModule.length === 0
      ? html`<article class="card"><p class="muted" style="margin:0">Nog geen module-data.</p></article>`
      : html`<article class="card">
          ${a.perModule.map((m) => html`<div class="row" style="gap:10px;margin:7px 0;align-items:center">
            <span style="flex:0 0 92px;font-size:.84rem;font-weight:600;text-transform:capitalize">${m.module}</span>
            <span style="flex:1;height:10px;border-radius:999px;background:var(--surface-2);overflow:hidden"><span style="display:block;height:100%;width:${Math.max(4, Math.round((m.users / maxMod) * 100))}%;border-radius:999px;background:linear-gradient(90deg,#3fa468,#236b41)"></span></span>
            <span class="muted" style="flex:0 0 28px;text-align:right;font-size:.82rem;font-weight:700">${m.users}</span>
          </div>`)}
        </article>`}
    <p class="muted"><a href="/beheer">&larr; beheer</a></p>
  `;
}

// Kennisdump (v202): drop-zone + overzicht van AI-verwerkte documenten.
export interface DumpRow { id: string; bestand: string; titel: string; categorie: string; samenvatting: string | null; audience: string; suggestie_klant: number; status: string }
export function beheerKennisdump(items: DumpRow[], opts: { melding?: string } = {}) {
  return html`
    ${pageTitle("doc", "Kennisdump")}
    ${opts.melding ? html`<p class="ok-melding">${opts.melding}</p>` : ""}
    <form method="post" action="/beheer/kennisdump" enctype="multipart/form-data" class="card">
      <h3 style="margin-top:0">Dump hier je documenten</h3>
      <p class="muted" style="margin-top:4px">PDF, Word, tekst, foto's — de AI leest ze, bedenkt titel/categorie en
        indexeert ze direct voor de assistent en het zoeken. Alles is eerst <strong>alleen intern</strong>;
        zichtbaar voor klanten (portaal-vraagbaak) maak je het hieronder per document, met één knop.
        Max 8 bestanden per keer, 15&nbsp;MB per stuk.</p>
      <input type="file" name="bestand" multiple required accept=".pdf,.doc,.docx,.txt,.md,.csv,.html,.jpg,.jpeg,.png,.webp" style="display:block;margin:12px 0" />
      <button class="btn" style="margin:0">Verwerken met AI</button>
    </form>
    ${eyebrow(`In de kennisbank · ${items.length}`)}
    ${items.length === 0
      ? html`<article class="card"><p class="muted" style="margin:0">Nog niets gedumpt — sleep hierboven je eerste bestanden erin.</p></article>`
      : html`<article class="card listcard"><ul class="clean">
          ${items.map((it) => html`<li style="padding:var(--sp-3) 0;border-bottom:1px solid var(--line)">
            <div class="row wrap" style="gap:10px">
              <span class="grow"><strong>${it.titel}</strong> <span class="chip">${it.categorie}</span>${it.audience === "public" ? html` <span class="chip" style="color:var(--green)">klant-zichtbaar</span>` : ""}
                <br /><span class="muted" style="font-size:.82rem">${it.bestand} · ${it.status}${it.samenvatting ? html` — ${it.samenvatting}` : ""}</span></span>
              <form method="post" action="/beheer/kennisdump/audience" style="margin:0;flex:none">
                <input type="hidden" name="id" value="${it.id}" />
                <input type="hidden" name="klant" value="${it.audience === "public" ? "0" : "1"}" />
                <button class="btn btn-soft" style="margin:0;padding:6px 12px;font-size:.8rem">${it.audience === "public" ? "Klant-zichtbaar uitzetten" : it.suggestie_klant ? "Klant-zichtbaar maken ✦ AI-suggestie" : "Klant-zichtbaar maken"}</button>
              </form>
              <form method="post" action="/beheer/kennisdump/verwijder" style="margin:0;flex:none">
                <input type="hidden" name="id" value="${it.id}" />
                <button class="btn btn-soft" style="margin:0;padding:6px 12px;font-size:.8rem">Verwijder</button>
              </form>
            </div>
          </li>`)}
        </ul></article>`}
    <p class="muted"><a href="/beheer">&larr; beheer</a></p>
  `;
}

// Leesbevestiging-overzicht (v185): per nieuwsbericht/beleidsdocument hoeveel
// collega's "Gelezen" hebben bevestigd + wie (uitklapbaar).
export interface LeesItem { type: "nieuws" | "document"; titel: string; meta: string; aantal: number; namen: string[]; gezien: number; gezienNamen: string[] }
export function beheerLeesbevestiging(items: LeesItem[], totaal: number) {
  const lijst = (xs: LeesItem[]) =>
    xs.length === 0
      ? html`<article class="card"><p class="muted" style="margin:0">Nog niets om te tonen.</p></article>`
      : html`<article class="card listcard"><ul class="clean">
          ${xs.map(
            (it) => html`<li>
              <div class="row wrap" style="gap:10px">
                <span class="grow"><strong>${it.titel}</strong> <span class="muted">${it.meta}</span></span>
                <span style="flex:none;font-size:.82rem;color:var(--muted)">${it.gezien} gezien</span>
                <span style="flex:none;font-weight:700;color:${it.aantal >= totaal ? "var(--ok-tx)" : "var(--muted)"}">${it.aantal}/${totaal}</span>
              </div>
              ${it.aantal > 0 || it.gezien > 0
                ? html`<details style="margin-top:4px"><summary class="muted" style="cursor:pointer;font-size:.8rem">Wie</summary>
                    ${it.aantal > 0 ? html`<p class="muted" style="margin:4px 0 0;font-size:.82rem"><strong>Bevestigd:</strong> ${it.namen.join(", ")}</p>` : ""}
                    ${it.gezien > 0 ? html`<p class="muted" style="margin:4px 0 0;font-size:.82rem"><strong>Gezien:</strong> ${it.gezienNamen.join(", ")}</p>` : ""}
                  </details>`
                : ""}
            </li>`,
          )}
        </ul></article>`;
  return html`
    ${pageTitle("news", "Leesbevestiging")}
    <p class="muted">Per item: hoeveel collega's het <strong>gezien</strong> hebben (pagina geopend,
      stille registratie sinds v194) en hoeveel er expliciet "Gelezen" bevestigden (x/${totaal} actieve
      medewerkers). De "Gelezen"-knop staat aan/uit via Beheer → Menu-indeling; geldt voor
      nieuwsberichten en documenten in de categorie <strong>Beleid</strong>.</p>
    ${eyebrow("Nieuws")}
    ${lijst(items.filter((i) => i.type === "nieuws"))}
    ${eyebrow("Beleid (documenten)")}
    ${lijst(items.filter((i) => i.type === "document"))}
    <p class="muted"><a href="/beheer">← beheer</a></p>
  `;
}

export function beheerMedewerkers(
  medewerkers: AirtableRecord<MedewerkerFields>[],
  afdelingen: string[],
  bewerk?: AirtableRecord<MedewerkerFields>,
  opts: { melding?: string; magRollen?: boolean; kantine?: boolean } = {},
) {
  const b = bewerk?.fields;
  // v186: een Redacteur (HR) kan Beheerder/Redacteur niet kiezen (server-side ook geblokkeerd).
  const magRollen = opts.magRollen !== false;
  const rolOpties = magRollen ? ROLLEN : ROLLEN.filter((r) => !BESCHERMDE_ROLLEN.includes(r));
  return html`
    <h1>Medewerkers</h1>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    <form method="post" action="/beheer/medewerkers" enctype="multipart/form-data" class="card">
      <h2 style="margin-top:0">${bewerk ? "Bewerken" : "Nieuwe medewerker"}</h2>
      ${bewerk ? html`<input type="hidden" name="id" value="${bewerk.id}" />` : ""}
      <label>Naam <input name="naam" required value="${b?.Naam ?? ""}" /></label>
      <label>E-mail <input name="email" type="email" value="${b?.["E-mail"] ?? ""}" /></label>
      <label>Rol ${b?.Rol && !magRollen && BESCHERMDE_ROLLEN.includes(String(b.Rol))
        ? html`<input value="${b.Rol}" disabled style="margin-top:6px" /><span class="muted" style="font-size:.78rem">Alleen een beheerder kan deze rol wijzigen.</span>`
        : sel("rol", rolOpties, b?.Rol)}</label>
      <label>Afdeling ${sel("afdeling", afdelingen, b?.Afdeling)}</label>
      <label>Verjaardag <input name="verjaardag" type="date" value="${b?.Verjaardag ?? ""}" /></label>
      <label>Telefoon <input name="telefoon" value="${b?.Telefoon ?? ""}" /></label>
      <label>Functie <input name="functie" value="${b?.Functie ?? ""}" /></label>
      ${b?.Foto?.[0]?.url ? html`<p class="muted">Huidige foto: <img src="${b.Foto[0].url}" alt="" style="height:40px;width:40px;object-fit:cover;border-radius:50%;vertical-align:middle" /> — upload of plak een URL om te vervangen.</p>` : ""}
      <label>Foto uploaden <input name="foto" type="file" accept="image/*" /></label>
      <label>of Foto-URL <input name="foto_url" type="url" placeholder="https://..." /></label>
      ${check(b?.Actief !== false, "Actief", "actief")}
      ${check(opts.kantine === true, "Kantine-beheer (bestellijst, saldo's en menu — geen overige beheerrechten)", "kantine_beheer")}
      <button type="submit">${bewerk ? "Opslaan" : "Toevoegen"}</button>
      ${bewerk ? html` <a href="/beheer/medewerkers" class="muted">annuleren</a>` : ""}
    </form>
    ${eyebrow("Alle medewerkers")}
    <article class="card listcard"><ul class="clean">
      ${medewerkers.map(
        (m) => html`<li>
          <strong>${m.fields.Naam ?? "(geen naam)"}</strong>
          <span class="muted">${m.fields.Rol ?? ""}${m.fields["E-mail"] ? ` · ${m.fields["E-mail"]}` : ""}${m.fields.Actief === false ? " · inactief" : ""}</span>
          <a href="/beheer/medewerkers?id=${m.id}">bewerk</a>
        </li>`,
      )}
    </ul></article>
    <p class="muted"><a href="/beheer">← beheer</a></p>
  `;
}

export function beheerNieuws(
  nieuws: AirtableRecord<NieuwsFields>[],
  bewerk?: AirtableRecord<NieuwsFields>,
  opts: { melding?: string } = {},
) {
  const b = bewerk?.fields;
  return html`
    <h1>Nieuws</h1>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    <form method="post" action="/beheer/nieuws" enctype="multipart/form-data" class="card">
      <h2 style="margin-top:0">${bewerk ? "Bericht bewerken" : "Nieuw bericht"}</h2>
      ${bewerk ? html`<input type="hidden" name="id" value="${bewerk.id}" />` : ""}
      <label>Titel <input name="titel" required value="${b?.Titel ?? ""}" /></label>
      <label>Inhoud <textarea name="inhoud" rows="4">${b?.Inhoud ?? ""}</textarea></label>
      <label>Afbeelding <input name="afbeelding" type="file" accept="image/*" /></label>
      ${b?.Afbeeldingssleutel ? html`<p class="muted">Er staat al een afbeelding bij dit bericht — kies een nieuwe om te vervangen.</p>` : ""}
      <label>Categorie ${sel("categorie", NIEUWS_CAT, b?.Categorie)}</label>
      <label>Publicatiedatum <input name="publicatiedatum" type="date" value="${b?.Publicatiedatum ?? ""}" /></label>
      <label>Status ${sel("status", NIEUWS_STATUS, b?.Status ?? "Concept")}</label>
      <label>Zichtbaarheid ${sel("zichtbaarheid", ZICHTBAAR, b?.Zichtbaarheid ?? "Iedereen")}</label>
      ${check(b?.Uitgelicht === true, "Uitgelicht", "uitgelicht")}
      ${check(false, "Stuur pushmelding naar collega’s", "push")}
      <button type="submit">${bewerk ? "Opslaan" : "Plaatsen"}</button>
      ${bewerk ? html` <a href="/beheer/nieuws" class="muted">annuleren</a>` : ""}
    </form>
    ${eyebrow("Alle berichten")}
    <article class="card listcard"><ul class="clean">
      ${nieuws.map(
        (n) => html`<li class="row wrap" style="gap:10px">
          <span class="grow"><strong>${n.fields.Titel ?? "(geen titel)"}</strong>
            <span class="muted">${n.fields.Status ?? ""}${n.fields.Publicatiedatum ? ` · ${n.fields.Publicatiedatum}` : ""}</span></span>
          <a href="/beheer/nieuws?id=${n.id}">bewerk</a>
          ${delForm("/beheer/nieuws/verwijder", n.id)}
        </li>`,
      )}
    </ul></article>
    <p class="muted"><a href="/beheer">← beheer</a></p>
  `;
}

export function beheerDocumenten(
  documenten: AirtableRecord<DocumentFields>[],
  bewerk?: AirtableRecord<DocumentFields>,
  opts: { melding?: string } = {},
) {
  const b = bewerk?.fields;
  return html`
    <h1>Documenten</h1>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    <form method="post" action="/beheer/documenten" enctype="multipart/form-data" class="card">
      <h2 style="margin-top:0">${bewerk ? "Document bewerken" : "Nieuw document"}</h2>
      ${bewerk ? html`<input type="hidden" name="id" value="${bewerk.id}" />` : ""}
      <label>Titel <input name="titel" required value="${b?.Titel ?? ""}" /></label>
      <label>Omschrijving <textarea name="omschrijving" rows="2">${b?.Omschrijving ?? ""}</textarea></label>
      <label>Bestand uploaden <input name="bestand" type="file" /></label>
      ${b?.Bestandssleutel ? html`<p class="muted">Huidig bestand: ${b?.Bestandsnaam ?? "bestand"} — kies een nieuw bestand om te vervangen.</p>` : ""}
      <label>Of externe link <input name="link" type="url" value="${b?.["Externe link"] ?? ""}" /></label>
      <label>Categorie ${sel("categorie", DOC_CAT, b?.Categorie)}</label>
      <button type="submit">${bewerk ? "Opslaan" : "Toevoegen"}</button>
      ${bewerk ? html` <a href="/beheer/documenten" class="muted">annuleren</a>` : ""}
    </form>
    ${eyebrow("Alle documenten")}
    <article class="card listcard"><ul class="clean">
      ${documenten.map(
        (d) => html`<li>
          <strong>${d.fields.Titel ?? "(geen titel)"}</strong>
          ${d.fields.Bestandssleutel ? html` <a href="/bestand?k=${encodeURIComponent(d.fields.Bestandssleutel)}">${d.fields.Bestandsnaam ?? "bestand"}</a>` : ""}
          <span class="muted">${d.fields.Categorie ?? ""}</span>
          <a href="/beheer/documenten?id=${d.id}">bewerk</a>
        </li>`,
      )}
    </ul></article>
    <p class="muted"><a href="/beheer">← beheer</a></p>
  `;
}

export function beheerAfdelingen(
  afdelingen: AirtableRecord<AfdelingFields>[],
  opts: { melding?: string } = {},
) {
  return html`
    <h1>Afdelingen</h1>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    <form method="post" action="/beheer/afdelingen" class="card">
      <label>Nieuwe afdeling <input name="naam" required /></label>
      <button type="submit">Toevoegen</button>
    </form>
    ${eyebrow("Alle afdelingen")}
    <article class="card listcard"><ul class="clean">
      ${afdelingen.length === 0
        ? html`<li class="muted">Nog geen afdelingen.</li>`
        : afdelingen.map(
            (a) => html`<li class="row between" style="gap:10px">
              <strong>${a.fields.Naam ?? "(leeg)"}</strong>
              <form method="post" action="/beheer/afdelingen/verwijder" style="margin:0" onsubmit="return confirm('Deze afdeling verwijderen?')">
                <input type="hidden" name="id" value="${a.id}" />
                <button type="submit" style="background:none;color:var(--muted);padding:0;margin:0;font-size:.8rem;font-weight:600">verwijderen</button>
              </form>
            </li>`,
          )}
    </ul></article>
    <p class="muted">Let op: bestaande medewerkers houden hun huidige afdeling; deze lijst vult alleen de keuzelijst.</p>
    <p class="muted"><a href="/beheer">← beheer</a></p>
  `;
}

export function beheerKlanten(
  klanten: AirtableRecord<KlantFields>[],
  bewerk?: AirtableRecord<KlantFields>,
  opts: { melding?: string; link?: string; linkEmail?: string; fout?: string } = {},
) {
  const b = bewerk?.fields;
  return html`
    <h1>Klanten</h1>
    <p class="muted">Portaal-toegang. Voeg een klant toe, genereer een inloglink en
      stuur die zelf (mail/WhatsApp). Na 1x klikken blijft de klant 30 dagen ingelogd.</p>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    ${opts.fout ? html`<p class="warn flash" data-toast>${opts.fout}</p>` : ""}
    ${opts.link
      ? html`<div class="card" style="border-color:var(--ok-bd);background:var(--ok-bg)">
          <strong>Inloglink voor ${opts.linkEmail}</strong>
          <p class="muted" style="margin:.4rem 0">7 dagen geldig. Kopieer en stuur naar de klant.</p>
          <input id="invite" readonly value="${opts.link}" onclick="this.select()" style="font-size:.78rem" />
          <button type="button" onclick="navigator.clipboard.writeText(document.getElementById('invite').value);this.textContent='Gekopieerd!'">Kopieer link</button>
        </div>`
      : ""}

    <form method="post" action="/beheer/klanten" class="card">
      <h2 style="margin-top:0">${bewerk ? "Klant bewerken" : "Nieuwe klant"}</h2>
      ${bewerk ? html`<input type="hidden" name="id" value="${bewerk.id}" />` : ""}
      <label>Naam <input name="naam" value="${b?.Naam ?? ""}" /></label>
      <label>E-mail <input name="email" type="email" required value="${b?.["E-mail"] ?? ""}" /></label>
      <label>Bedrijf <input name="bedrijf" value="${b?.Bedrijf ?? ""}" /></label>
      <label>Taal ${sel("taal", TALEN, b?.Taal)}</label>
      ${check(b?.Actief !== false, "Actief (toegang tot portaal)", "actief")}
      <button type="submit">${bewerk ? "Opslaan" : "Toevoegen"}</button>
      ${bewerk ? html` <a href="/beheer/klanten" class="muted">annuleren</a>` : ""}
    </form>

    ${eyebrow("Alle klanten")}
    <article class="card listcard"><ul class="clean">
      ${klanten.length === 0
        ? html`<li class="muted">Nog geen klanten. Voeg er hierboven een toe.</li>`
        : klanten.map(
            (k) => html`<li class="row wrap" style="gap:10px">
              <span class="grow">
                <strong>${k.fields.Naam ?? k.fields["E-mail"] ?? "(geen naam)"}</strong>
                <span class="muted">${k.fields["E-mail"] ?? ""}${k.fields.Bedrijf ? ` · ${k.fields.Bedrijf}` : ""}${k.fields.Taal ? ` · ${k.fields.Taal}` : ""}${k.fields.Actief === false ? " · inactief" : ""}</span>
              </span>
              ${k.fields.Actief !== false && k.fields["E-mail"]
                ? html`<form method="post" action="/beheer/klanten/link" style="margin:0">
                    <input type="hidden" name="email" value="${k.fields["E-mail"]}" />
                    <button type="submit" style="margin:0;padding:8px 14px">Inloglink</button>
                  </form>`
                : ""}
              <a href="/beheer/klanten?id=${k.id}">bewerk</a>
              ${delForm("/beheer/klanten/verwijder", k.id)}
            </li>`,
          )}
    </ul></article>
    <p class="muted"><a href="/beheer">← beheer</a></p>
  `;
}

export function beheerPush(
  aantal: number,
  flags: Record<string, boolean>,
  opts: { melding?: string; fout?: string } = {},
) {
  return html`
    <h1>Pushmelding</h1>
    <p class="muted">Stuur een melding naar alle collega's die meldingen hebben
      aangezet (${aantal} apparaat${aantal === 1 ? "" : "en"}).</p>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    ${opts.fout ? html`<p class="warn flash" data-toast>${opts.fout}</p>` : ""}
    <form method="post" action="/beheer/push" class="card">
      <h2 style="margin-top:0">Bericht maken</h2>
      <label>Titel <input name="titel" required maxlength="80" placeholder="bijv. Lunch staat klaar" /></label>
      <label>Bericht <textarea name="bericht" rows="3" required maxlength="300"></textarea></label>
      <button type="submit">Versturen</button>
    </form>

    <form method="post" action="/beheer/push/instellingen" class="card">
      <h2 style="margin-top:0">Push-functies aan/uit</h2>
      <p class="muted" style="margin-top:0">Zet automatische pushberichten aan of uit.</p>
      ${PUSH_FEATURES.map(
        (f) => html`<label class="row-top" style="gap:11px; font-weight:600; padding:11px 2px; border-bottom:1px solid var(--line)">
          <input type="checkbox" name="${f.key}" ${flags[f.key] !== false ? "checked" : ""} style="margin-top:3px" />
          <span style="flex:1">${f.label}<span class="appdesc" style="display:block;font-weight:400">${f.desc}</span></span>
        </label>`,
      )}
      <button type="submit" style="margin-top:14px">Instellingen opslaan</button>
    </form>
    <p class="muted">Tip: bij een nieuwsbericht kun je in /beheer → Nieuws het vinkje
      “Stuur pushmelding” gebruiken (werkt alleen als “Nieuwsmeldingen” hierboven aanstaat).</p>
    <p class="muted"><a href="/beheer">← beheer</a></p>
  `;
}

/* ===================== Portaal-content & competitie ===================== */

const GEWAS = ["Aardbei", "Appel"];
const KDOC_CAT = ["Teelt", "Handleiding", "Certificaat", "Overig"];

// id-gebaseerde keuzelijst (voor gekoppelde velden, bijv. ras of speler).
function selId(name: string, opties: [string, string][], waarde?: string, leeg = "—") {
  return html`<select name="${name}">
    <option value="">${leeg}</option>
    ${opties.map(([id, label]) => html`<option value="${id}" ${id === waarde ? "selected" : ""}>${label}</option>`)}
  </select>`;
}

const delForm = (action: string, id: string) =>
  html`<form method="post" action="${action}" style="margin:0" onsubmit="return confirm('Verwijderen?')">
    <input type="hidden" name="id" value="${id}" />
    <button type="submit" style="background:none;color:var(--muted);padding:0;margin:0;font-size:.8rem;font-weight:600">verwijderen</button>
  </form>`;

function rasOpts(rassen: AirtableRecord<RasFields>[]): [string, string][] {
  return rassen.map((r) => [r.id, r.fields.Naam ?? "(naamloos)"]);
}

export function beheerRassen(
  rassen: AirtableRecord<RasFields>[],
  bewerk?: AirtableRecord<RasFields>,
  opts: { melding?: string } = {},
) {
  const b = bewerk?.fields;
  return html`
    <h1>Rassen</h1>
    <p class="muted">Rasseninformatie voor het klantenportaal. Alleen <strong>gepubliceerde</strong> rassen zijn zichtbaar voor klanten.</p>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    <form method="post" action="/beheer/rassen" enctype="multipart/form-data" class="card">
      <h2 style="margin-top:0">${bewerk ? "Ras bewerken" : "Nieuw ras"}</h2>
      ${bewerk ? html`<input type="hidden" name="id" value="${bewerk.id}" />` : ""}
      <label>Naam <input name="naam" required value="${b?.Naam ?? ""}" /></label>
      <label>Gewas ${sel("gewas", GEWAS, b?.Gewas)}</label>
      <label>Omschrijving <textarea name="omschrijving" rows="3">${b?.Omschrijving ?? ""}</textarea></label>
      <div class="row2">
        <label>Smaak <input name="smaak" value="${b?.Smaak ?? ""}" /></label>
        <label>Kleur <input name="kleur" value="${b?.Kleur ?? ""}" /></label>
      </div>
      <div class="row2">
        <label>Seizoen <input name="seizoen" value="${b?.Seizoen ?? ""}" /></label>
        <label>Volgorde <input name="volgorde" type="number" value="${b?.Volgorde ?? ""}" /></label>
      </div>
      <label>Afbeelding-URL <input name="afbeelding" type="url" value="${b?.Afbeelding?.[0]?.url ?? ""}" placeholder="https://..." /></label>
      ${b?.Bestandssleutel ? html`<p class="muted">Huidig bestand: ${b?.Bestandsnaam ?? "bestand"}</p>` : ""}
      <label>Bestand uploaden (afbeelding of PDF) <input name="bestand" type="file" /></label>
      ${check(b?.Gepubliceerd === true, "Gepubliceerd (zichtbaar in portaal)", "gepubliceerd")}
      <button type="submit">${bewerk ? "Opslaan" : "Toevoegen"}</button>
      ${bewerk ? html` <a href="/beheer/rassen" class="muted">annuleren</a>` : ""}
    </form>
    ${eyebrow("Alle rassen")}
    <article class="card listcard"><ul class="clean">
      ${rassen.length === 0 ? html`<li class="muted">Nog geen rassen.</li>` : rassen.map(
        (r) => html`<li class="row wrap" style="gap:10px">
          <span class="grow"><strong>${r.fields.Naam ?? "(naamloos)"}</strong>
            <span class="muted">${r.fields.Gewas ?? ""}${r.fields.Gepubliceerd ? "" : " · concept"}</span></span>
          <a href="/beheer/rassen?id=${r.id}">bewerk</a>
          ${delForm("/beheer/rassen/verwijder", r.id)}
        </li>`,
      )}
    </ul></article>
    <p class="muted"><a href="/beheer">← beheer</a></p>
  `;
}

export function beheerTeeltadvies(
  items: AirtableRecord<TeeltadviesFields>[],
  rassen: AirtableRecord<RasFields>[],
  bewerk?: AirtableRecord<TeeltadviesFields>,
  opts: { melding?: string } = {},
) {
  const b = bewerk?.fields;
  return html`
    <h1>Teeltadvies</h1>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    <form method="post" action="/beheer/teeltadvies" enctype="multipart/form-data" class="card">
      <h2 style="margin-top:0">${bewerk ? "Advies bewerken" : "Nieuw teeltadvies"}</h2>
      ${bewerk ? html`<input type="hidden" name="id" value="${bewerk.id}" />` : ""}
      <label>Titel <input name="titel" required value="${b?.Titel ?? ""}" /></label>
      <label>Inhoud <textarea name="inhoud" rows="5">${b?.Inhoud ?? ""}</textarea></label>
      <label>Gekoppeld ras ${selId("ras", rasOpts(rassen), b?.Ras?.[0], "— geen —")}</label>
      <div class="row2">
        <label>Categorie <input name="categorie" value="${b?.Categorie ?? ""}" /></label>
        <label>Volgorde <input name="volgorde" type="number" value="${b?.Volgorde ?? ""}" /></label>
      </div>
      <label>Afbeelding-URL <input name="afbeelding" type="url" value="${b?.Afbeelding?.[0]?.url ?? ""}" placeholder="https://..." /></label>
      ${b?.Bestandssleutel ? html`<p class="muted">Huidig bestand: ${b?.Bestandsnaam ?? "bestand"}</p>` : ""}
      <label>Bestand uploaden (afbeelding of PDF) <input name="bestand" type="file" /></label>
      ${check(b?.Gepubliceerd === true, "Gepubliceerd", "gepubliceerd")}
      <button type="submit">${bewerk ? "Opslaan" : "Toevoegen"}</button>
      ${bewerk ? html` <a href="/beheer/teeltadvies" class="muted">annuleren</a>` : ""}
    </form>
    ${eyebrow("Alle teeltadviezen")}
    <article class="card listcard"><ul class="clean">
      ${items.length === 0 ? html`<li class="muted">Nog geen teeltadviezen.</li>` : items.map(
        (t) => html`<li class="row wrap" style="gap:10px">
          <span class="grow"><strong>${t.fields.Titel ?? "(geen titel)"}</strong>
            <span class="muted">${t.fields.Gepubliceerd ? "" : "concept"}</span></span>
          <a href="/beheer/teeltadvies?id=${t.id}">bewerk</a>
          ${delForm("/beheer/teeltadvies/verwijder", t.id)}
        </li>`,
      )}
    </ul></article>
    <p class="muted"><a href="/beheer">← beheer</a></p>
  `;
}

export function beheerSnoeiPluk(
  items: AirtableRecord<SnoeiPlukFields>[],
  rassen: AirtableRecord<RasFields>[],
  bewerk?: AirtableRecord<SnoeiPlukFields>,
  opts: { melding?: string } = {},
) {
  const b = bewerk?.fields;
  return html`
    <h1>Snoei & pluk</h1>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    <form method="post" action="/beheer/snoei" enctype="multipart/form-data" class="card">
      <h2 style="margin-top:0">${bewerk ? "Instructie bewerken" : "Nieuwe instructie"}</h2>
      ${bewerk ? html`<input type="hidden" name="id" value="${bewerk.id}" />` : ""}
      <label>Titel <input name="titel" required value="${b?.Titel ?? ""}" /></label>
      <label>Type <input name="type" value="${b?.Type ?? ""}" placeholder="Snoei / Pluk" /></label>
      <label>Inhoud <textarea name="inhoud" rows="5">${b?.Inhoud ?? ""}</textarea></label>
      <label>Gekoppeld ras ${selId("ras", rasOpts(rassen), b?.Ras?.[0], "— geen —")}</label>
      <div class="row2">
        <label>Periode <input name="periode" value="${b?.Periode ?? ""}" placeholder="bijv. maart–april" /></label>
        <label>Volgorde <input name="volgorde" type="number" value="${b?.Volgorde ?? ""}" /></label>
      </div>
      <label>Afbeelding-URL <input name="afbeelding" type="url" value="${b?.Afbeelding?.[0]?.url ?? ""}" placeholder="https://..." /></label>
      ${b?.Bestandssleutel ? html`<p class="muted">Huidig bestand: ${b?.Bestandsnaam ?? "bestand"}</p>` : ""}
      <label>Bestand uploaden (afbeelding of PDF) <input name="bestand" type="file" /></label>
      ${check(b?.Gepubliceerd === true, "Gepubliceerd", "gepubliceerd")}
      <button type="submit">${bewerk ? "Opslaan" : "Toevoegen"}</button>
      ${bewerk ? html` <a href="/beheer/snoei" class="muted">annuleren</a>` : ""}
    </form>
    ${eyebrow("Alle instructies")}
    <article class="card listcard"><ul class="clean">
      ${items.length === 0 ? html`<li class="muted">Nog geen instructies.</li>` : items.map(
        (t) => html`<li class="row wrap" style="gap:10px">
          <span class="grow"><strong>${t.fields.Titel ?? "(geen titel)"}</strong>
            <span class="muted">${t.fields.Type ?? ""}${t.fields.Gepubliceerd ? "" : " · concept"}</span></span>
          <a href="/beheer/snoei?id=${t.id}">bewerk</a>
          ${delForm("/beheer/snoei/verwijder", t.id)}
        </li>`,
      )}
    </ul></article>
    <p class="muted"><a href="/beheer">← beheer</a></p>
  `;
}

export function beheerKlantdocumenten(
  items: AirtableRecord<KlantdocumentFields>[],
  bewerk?: AirtableRecord<KlantdocumentFields>,
  opts: { melding?: string } = {},
) {
  const b = bewerk?.fields;
  return html`
    <h1>Klantdocumenten</h1>
    <p class="muted">Downloads voor het klantenportaal (los van de interne documenten).</p>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    <form method="post" action="/beheer/klantdocumenten" enctype="multipart/form-data" class="card">
      <h2 style="margin-top:0">${bewerk ? "Document bewerken" : "Nieuw klantdocument"}</h2>
      ${bewerk ? html`<input type="hidden" name="id" value="${bewerk.id}" />` : ""}
      <label>Titel <input name="titel" required value="${b?.Titel ?? ""}" /></label>
      <label>Omschrijving <textarea name="omschrijving" rows="2">${b?.Omschrijving ?? ""}</textarea></label>
      <label>Bestand uploaden <input name="bestand" type="file" /></label>
      ${b?.Bestandssleutel ? html`<p class="muted">Huidig bestand: ${b?.Bestandsnaam ?? "bestand"} — kies een nieuw om te vervangen.</p>` : ""}
      <label>Of externe link <input name="link" type="url" value="${b?.["Externe link"] ?? ""}" /></label>
      <label>Categorie ${sel("categorie", KDOC_CAT, b?.Categorie)}</label>
      ${check(b?.Gepubliceerd === true, "Gepubliceerd", "gepubliceerd")}
      <button type="submit">${bewerk ? "Opslaan" : "Toevoegen"}</button>
      ${bewerk ? html` <a href="/beheer/klantdocumenten" class="muted">annuleren</a>` : ""}
    </form>
    ${eyebrow("Alle klantdocumenten")}
    <article class="card listcard"><ul class="clean">
      ${items.length === 0 ? html`<li class="muted">Nog geen klantdocumenten.</li>` : items.map(
        (d) => html`<li class="row wrap" style="gap:10px">
          <span class="grow"><strong>${d.fields.Titel ?? "(geen titel)"}</strong>
            <span class="muted">${d.fields.Categorie ?? ""}${d.fields.Gepubliceerd ? "" : " · concept"}</span></span>
          <a href="/beheer/klantdocumenten?id=${d.id}">bewerk</a>
          ${delForm("/beheer/klantdocumenten/verwijder", d.id)}
        </li>`,
      )}
    </ul></article>
    <p class="muted"><a href="/beheer">← beheer</a></p>
  `;
}

