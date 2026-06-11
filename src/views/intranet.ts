import { html, raw } from "hono/html";
import { emojiBar } from "./emoji";
import { emptyState, page } from "./templates";
import { lds, eyebrow } from "./loods";
import type { AirtableRecord, NieuwsFields, DocumentFields } from "../airtable";
import type { Jarig } from "../birthdays";
import { renderRich } from "../richtext";

// Kleine inline-iconen (stroke = currentColor).
const svg = (p: string) =>
  raw(
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`,
  );
const ICO = {
  people: svg(
    `<circle cx="9" cy="8" r="3"/><path d="M3 19c0-3 2.7-4.6 6-4.6"/><circle cx="17" cy="9.5" r="2.3"/><path d="M14.8 19c0-2.4 1.7-3.8 3.9-3.8"/>`,
  ),
  clock: svg(`<circle cx="12" cy="12" r="8.2"/><path d="M12 7.5V12l3 1.7"/>`),
  ball: svg(
    `<circle cx="12" cy="12" r="8.4"/><path d="m12 7.4 3 2.2-1.1 3.5h-3.8L9 9.6l3-2.2Z"/><path d="M12 7.4V4.2M14.9 9.6l2.7-1M13.9 13.1l1.7 2.4M10.1 13.1l-1.7 2.4M9.1 9.6l-2.7-1"/>`,
  ),
  doc: svg(`<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 13h5M9.5 16.5h5"/>`),
  link: svg(`<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v5H5V6h5"/>`),
  gear: svg(
    `<circle cx="12" cy="12" r="3"/><path d="M12 3.6v2.2M12 18.2v2.2M5 7.2l1.9 1.1M17.1 15.7 19 16.8M5 16.8l1.9-1.1M17.1 8.3 19 7.2"/>`,
  ),
  bell: svg(`<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/>`),
};

const PUSH_SCRIPT = `<script>
(function(){
  var KEY=window.FF_VAPID, card=document.getElementById("ffPush");
  if(!card||!KEY) return;
  if(!("serviceWorker" in navigator)||!("PushManager" in window)||!("Notification" in window)) return;
  var btn=document.getElementById("ffPushBtn");
  function b64(s){ s=s.replace(/-/g,"+").replace(/_/g,"/"); var pad="=".repeat((4-s.length%4)%4); var raw=atob(s+pad); var o=new Uint8Array(raw.length); for(var i=0;i<raw.length;i++)o[i]=raw.charCodeAt(i); return o; }
  navigator.serviceWorker.ready.then(function(reg){ return reg.pushManager.getSubscription(); }).then(function(sub){ if(!sub && Notification.permission!=="denied") card.style.display="flex"; });
  btn.addEventListener("click", function(){
    btn.disabled=true;
    Notification.requestPermission().then(function(p){
      if(p!=="granted"){ btn.disabled=false; return; }
      navigator.serviceWorker.ready.then(function(reg){ return reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:b64(KEY)}); })
        .then(function(sub){ var j=sub.toJSON(); return fetch("/push/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({endpoint:sub.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth})}); })
        .then(function(){ card.style.display="none"; })
        .catch(function(){ btn.disabled=false; });
    });
  });
})();
</script>`;

function initialen(naam: string): string {
  const d = naam.trim().split(/\s+/);
  return ((d[0]?.[0] ?? "") + (d.length > 1 ? d[d.length - 1][0] : "")).toUpperCase() || "?";
}

// Alleen de voornaam (compacte weergave in "Team vandaag").
function voornaamVan(naam: string): string {
  return naam.trim().split(/\s+/)[0] || naam;
}

// Vriendelijke "installeer als app"-hint (PWA). Android toont een echte
// Installeren-knop; iPhone krijgt korte uitleg. Onthoudt 'gesloten' in localStorage.
const INSTALL_SCRIPT = `<script>
(function(){
  var card=document.getElementById("ffInstall"); if(!card) return;
  var standalone=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
  if(standalone) return;
  try{ if(localStorage.getItem("ffInstallDismissed")==="1") return; }catch(e){}
  var btn=document.getElementById("ffInstallBtn"), txt=document.getElementById("ffInstallTxt");
  function show(){ btn.style.display="inline-flex"; card.style.display="flex"; }
  // Globale vangst (1x gebonden): overleeft SPA-swaps zonder listeners te stapelen.
  if(!window.__ffBipBound){ window.__ffBipBound=1; window.addEventListener("beforeinstallprompt", function(e){ e.preventDefault(); window.__ffDeferredInstall=e; document.dispatchEvent(new CustomEvent("ff:install-ready")); }); }
  if(window.__ffDeferredInstall) show();
  document.addEventListener("ff:install-ready", function h(){ if(!document.body.contains(card)){ document.removeEventListener("ff:install-ready", h); return; } show(); });
  if(/iphone|ipad|ipod/i.test(navigator.userAgent)){ txt.textContent="Open in Safari, tik op het deelicoon en kies 'Zet op beginscherm'."; card.style.display="flex"; }
  btn.addEventListener("click", function(){ var d=window.__ffDeferredInstall; if(!d) return; d.prompt(); d.userChoice.finally(function(){ window.__ffDeferredInstall=null; card.style.display="none"; }); });
  document.getElementById("ffInstallClose").addEventListener("click", function(){ try{ localStorage.setItem("ffInstallDismissed","1"); }catch(e){} card.style.display="none"; });
})();
</script>`;


// Eén regel platte tekst uit (rijke) nieuwsinhoud, voor de home-teasers.
function teaserTekst(s: unknown, n = 130): string {
  const t = String(s ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n).trimEnd() + "…" : t;
}

export function intranetPage(
  nieuws: AirtableRecord<NieuwsFields>[],
  jarigen: Jarig[],
  apps: { buddee: string; timechimp: string; wkPoule: string },
  _beheer = false,
  nieuwIds: Set<string> = new Set(),
  pushKey = "",
  shoutouts: { auteur: string; ontvanger: string; bericht: string }[] = [],
  header?: { enabled: boolean; greeting: string; voornaam: string; totalNew: number; subtitle: string; gradientFrom: string; gradientTo: string; textColor: string },
  moduleStatus: { key: string; label: string; href: string; icon: string; status: string }[] = [],
  feed: { icon: string; tekst: string; route: string; t: number }[] = [],
) {
  // 4.3: relatieve tijd voor de activity feed.
  const relTijd = (ms: number) => {
    const d = Date.now() - ms;
    const min = Math.floor(d / 60000);
    if (min < 1) return "zojuist";
    if (min < 60) return `${min} min geleden`;
    const uur = Math.floor(min / 60);
    if (uur < 24) return `${uur} uur geleden`;
    const dag = Math.floor(uur / 24);
    return dag === 1 ? "gisteren" : `${dag} dagen geleden`;
  };
  // 3.2: live status-ondertitels op de module-tegels (zelfde iconen als de navigatie).
  const MODICO: Record<string, ReturnType<typeof svg>> = {
    agenda: svg(`<rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M3.5 9h17M8 3v3M16 3v3"/>`),
    board: svg(`<path d="M4 5h16v11H9l-4 4Z"/><path d="M8 9h8M8 12.5h5"/>`),
    trophy: svg(`<path d="M7 4h10v3a5 5 0 0 1-10 0Z"/><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3"/><path d="M9.5 12.5 9 16h6l-.5-3.5M8 19h8"/>`),
    fries: svg(`<path d="M6.5 8h11l-1.1 10.6a1 1 0 0 1-1 .9H8.6a1 1 0 0 1-1-.9Z"/><path d="M9 8V4.4M12 8V3.6M15 8V5.2"/><path d="M6 11.5h12"/>`),
    alert: svg(`<path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4M12 17.5v.5"/>`),
    book: svg(`<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H12v15H5.5A1.5 1.5 0 0 1 4 17.5Z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H12v15h6.5a1.5 1.5 0 0 0 1.5-1.5Z"/>`),
  };
  return html`
    ${header && header.enabled
      ? (() => {
          const bg = `radial-gradient(120% 130% at 92% -25%, rgba(255,255,255,.18), transparent 55%), linear-gradient(135deg, ${header.gradientFrom}, ${header.gradientTo})`;
          const naam = header.voornaam ? `, ${header.voornaam}` : "";
          return header.totalNew > 0
            ? html`<a class="hero herolink" href="/voor-jou" style="background:${bg};color:${header.textColor}">
                <div class="kicker">Fresh Forward · intern</div>
                <h1 style="color:${header.textColor}">${header.greeting}${naam}</h1>
                <p>${header.subtitle} &rarr;</p>
                <span class="herobadge">${header.totalNew}</span>
              </a>`
            : html`<div class="hero" style="background:${bg};color:${header.textColor}">
                <div class="kicker">Fresh Forward · intern</div>
                <h1 style="color:${header.textColor}">${header.greeting}${naam}</h1>
                <p>${header.subtitle}</p>
              </div>`;
        })()
      : html`<div class="hero">
          <div class="kicker">Fresh Forward · intern</div>
          <h1>Welkom op het intranet</h1>
          <p>Nieuws, documenten, bezoek en de onderlinge competitie — alles op &eacute;&eacute;n plek.</p>
        </div>`}

    <div class="appgrid">
      <a class="apptile wide" href="${apps.wkPoule}">
        <div class="ico">${ICO.ball}</div>
        <div class="txt"><span class="appname">WK-poule 2026</span><span class="appdesc">Doe mee met de bedrijfspoule op Scorito</span></div>
      </a>
      <a class="apptile" href="${apps.buddee}">
        <div class="ico ico-green">${ICO.people}</div>
        <div class="txt"><span class="appname">Buddee</span><span class="appdesc">HR &amp; verlof</span></div>
      </a>
      <a class="apptile" href="${apps.timechimp}">
        <div class="ico ico-berry">${ICO.clock}</div>
        <div class="txt"><span class="appname">TimeChimp</span><span class="appdesc">Uren schrijven</span></div>
      </a>
    </div>

    ${moduleStatus.length > 0
      ? html`<h2>Vandaag bij ons</h2>
          <div class="appgrid">
            ${moduleStatus.map(
              (m) => html`<a class="apptile" href="${m.href}">
                <div class="ico ico-green">${MODICO[m.icon] ?? MODICO.board}</div>
                <div class="txt"><span class="appname">${m.label}</span><span class="appdesc">${m.status}</span></div>
              </a>`,
            )}
          </div>`
      : ""}

    ${feed.length > 0
      ? html`<h2>Laatste activiteit</h2>
          <div class="card">
            <ul class="clean">
              ${feed.slice(0, 2).map(
                (f) => html`<li style="padding:0">
                  <a href="${f.route}" style="display:flex;align-items:center;gap:11px;padding:10px 2px;text-decoration:none;color:inherit">
                    <span style="width:30px;height:30px;border-radius:9px;flex:none;display:grid;place-items:center;background:var(--surface-2);color:var(--green)">${MODICO[f.icon] ?? MODICO.board}</span>
                    <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.tekst}</span>
                    <span class="muted" style="flex:none;font-size:.76rem">${relTijd(f.t)}</span>
                  </a>
                </li>`,
              )}
            </ul>
          </div>`
      : ""}

    ${jarigen.length > 0 || shoutouts.length > 0
      ? html`<h2>${jarigen.length > 0 && shoutouts.length === 0 ? "Jarig" : jarigen.length === 0 ? "Shout-outs" : "Team vandaag"}</h2>
          <div class="card">
            ${jarigen.length > 0
              ? html`<ul class="bdaylist">
                  ${jarigen.map(
                    (j) => html`<li>
                      ${j.foto ? html`<img class="ava" src="${j.foto}" alt="" width="38" height="38" style="object-fit:cover" />` : html`<span class="ava">${initialen(j.naam)}</span>`}
                      <span class="who" style="flex:1">${voornaamVan(j.naam)}</span>
                      ${j.overDagen === 0
                        ? html`<span class="badge">vandaag</span>`
                        : html`<span class="muted">${j.datum} · over ${j.overDagen} ${j.overDagen === 1 ? "dag" : "dagen"}</span>`}
                    </li>`,
                  )}
                </ul>`
              : ""}
            ${shoutouts.length > 0
              ? html`<ul class="clean" style="${jarigen.length > 0 ? "margin-top:8px;border-top:1px solid var(--line);padding-top:4px" : ""}">
                  ${shoutouts.map(
                    (so) => html`<li style="padding:9px 0;border-bottom:1px solid var(--line)">
                      <span style="color:var(--green);font-weight:700">${so.auteur}</span>
                      <span class="muted">→</span> <strong>${so.ontvanger}</strong>
                      ${so.bericht ? html`<div class="muted" style="margin-top:2px">${so.bericht}</div>` : ""}
                    </li>`,
                  )}
                </ul>`
              : ""}
          </div>`
      : ""}

    <h2>Nieuws <a href="/nieuws" class="muted" style="float:right;font-size:.85rem;font-weight:600;text-decoration:none">Alle nieuws &rarr;</a></h2>
    ${nieuws.length === 0
      ? emptyState({ icon: "board", title: "Nog geen nieuws", text: "Zodra er nieuws is, verschijnt het hier." })
      : html`<div class="card" style="padding-top:6px;padding-bottom:6px">
          <ul class="clean">
            ${nieuws.slice(0, 3).map(
              (n) => html`<li>
                <a href="/nieuws#nieuws-${n.id}" style="display:block;text-decoration:none;color:inherit">
                  <strong>${n.fields.Titel ?? "(zonder titel)"}</strong>${nieuwIds.has(n.id) ? html`<span style="display:inline-block;background:linear-gradient(135deg,var(--berry-2),var(--berry));color:#fff;font-size:.64rem;font-weight:700;letter-spacing:.02em;padding:2px 8px;border-radius:999px;margin-left:var(--sp-2);vertical-align:middle">Nieuw</span>` : ""}
                  <div class="muted" style="font-size:.78rem;margin-top:1px">
                    ${n.fields.Categorie ? html`<span class="chip">${n.fields.Categorie}</span> ` : ""}${n.fields.Publicatiedatum ?? ""}${n.fields.Uitgelicht ? html` · <span style="color:var(--berry);font-weight:700">uitgelicht</span>` : ""}
                  </div>
                  ${n.fields.Inhoud ? html`<div class="muted" style="font-size:.85rem;margin-top:2px">${teaserTekst(n.fields.Inhoud)}</div>` : ""}
                </a>
              </li>`,
            )}
          </ul>
        </div>`}

    ${pushKey
      ? html`<div id="ffPush" class="card" style="display:none;align-items:center;gap:13px">
          <span class="fico" aria-hidden="true">${ICO.bell}</span>
          <span style="flex:1;min-width:0"><strong>Meldingen</strong><span class="appdesc" style="display:block">Krijg een seintje bij nieuw nieuws.</span></span>
          <button type="button" id="ffPushBtn" style="margin:0;padding:9px 15px">Aanzetten</button>
        </div>
        ${raw(`<script>window.FF_VAPID=${JSON.stringify(pushKey)};</script>`)}
        ${raw(PUSH_SCRIPT)}`
      : ""}

    <div id="ffInstall" class="card" style="display:none;align-items:center;gap:13px">
      <span class="fico" aria-hidden="true">${ICO.doc}</span>
      <span style="flex:1;min-width:0">
        <strong>Installeer als app</strong>
        <span class="appdesc" id="ffInstallTxt" style="display:block">Zet Fresh Forward op je beginscherm voor snelle toegang.</span>
      </span>
      <button type="button" id="ffInstallBtn" style="display:none;margin:0;padding:9px 15px">Installeren</button>
      <button type="button" id="ffInstallClose" aria-label="Sluiten" style="margin:0;padding:8px 11px;background:none;color:var(--muted);box-shadow:none">${raw(`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6 18 18M18 6 6 18"/></svg>`)}</button>
    </div>
    ${raw(INSTALL_SCRIPT)}
  `;
}

// Volledige nieuwsartikelen (verhuisd van home; ADR-001-opruimslag) — /nieuws.
export function nieuwsPagina(
  nieuws: AirtableRecord<NieuwsFields>[],
  nieuwIds: Set<string> = new Set(),
  reactiesByNieuws: Map<string, { id: string; naam: string; reactie: string; datum: string; kanWeg: boolean }[]> = new Map(),
  kanReageren = false,
  emojiByNieuws: Map<string, { counts: Record<string, number>; mine: string[] }> = new Map(),
  gelezen: Set<string> = new Set(),       // keys "nieuws:<id>" (leesbevestiging v185)
  kanBevestigen = false,
) {
  return lds(page({
    title: "Nieuws",
    icon: "news",
    children: html`${nieuws.length === 0
      ? emptyState({ icon: "board", title: "Nog geen nieuws", text: "Zodra er nieuws is, verschijnt het hier." })
      : nieuws.map((n) => {
          const img = n.fields.Afbeeldingssleutel
            ? `/bestand?k=${encodeURIComponent(n.fields.Afbeeldingssleutel)}`
            : (n.fields.Afbeelding?.[0]?.thumbnails?.large?.url ??
              n.fields.Afbeelding?.[0]?.url);
          return html`
            <article id="nieuws-${n.id}" class="card ${n.fields.Uitgelicht ? "featured" : ""}" style="scroll-margin-top:80px">
              ${img
                ? html`<img class="zoomable" src="${img}" alt="${n.fields.Titel ?? ""}" style="width:100%;height:auto;border-radius:13px;margin:0 0 12px" />`
                : ""}
              <h3>${n.fields.Titel ?? "(zonder titel)"}${nieuwIds.has(n.id) ? html`<span style="display:inline-block;background:linear-gradient(135deg,var(--berry-2),var(--berry));color:#fff;font-size:.64rem;font-weight:700;letter-spacing:.02em;padding:2px 8px;border-radius:999px;margin-left:var(--sp-2);vertical-align:middle">Nieuw</span>` : ""}</h3>
              <p class="meta">
                ${n.fields.Categorie ? html`<span class="chip">${n.fields.Categorie}</span> ` : ""}
                ${n.fields.Publicatiedatum ?? ""}
                ${n.fields.Uitgelicht ? html` · <span style="color:var(--berry);font-weight:700;display:inline-flex;align-items:center;gap:var(--sp-1);vertical-align:middle">${raw(`<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" stroke="none"><path d="m12 3.6 2.5 5.1 5.6.8-4.05 3.95.95 5.55L12 16.9l-5 2.65.95-5.55L3.9 9.5l5.6-.8Z"/></svg>`)} uitgelicht</span>` : ""}
              </p>
              <div class="ff-tr" style="line-height:1.55;overflow-wrap:anywhere">${renderRich(n.fields.Inhoud)}</div>
              <div class="row between wrap" style="gap:var(--sp-2);margin-top:var(--sp-2)">
                ${emojiBar("nieuws", n.id, emojiByNieuws.get(n.id) ?? { counts: {}, mine: [] }, kanReageren)}
                ${kanBevestigen
                  ? gelezen.has(`nieuws:${n.id}`)
                    ? html`<span class="muted" style="flex:none;font-size:.8rem;font-weight:600">&check; Gelezen</span>`
                    : html`<button type="button" class="ghost lees-btn" data-lees-type="nieuws" data-lees-id="${n.id}">Gelezen</button>`
                  : ""}
                ${n.fields.Inhoud ? html`<button type="button" class="ff-tr-btn" data-tr>Vertaal dit</button>` : ""}
              </div>
              <div style="margin-top:10px;border-top:1px solid var(--line);padding-top:var(--sp-2)">
                ${(reactiesByNieuws.get(n.id) ?? []).map((r) => {
                  const inner = html`<span class="who">${r.naam}</span> <span class="muted">· ${r.datum}</span>
                    ${r.kanWeg
                      ? html`<form method="post" action="/nieuws/reactie/verwijder" style="display:inline-block;margin:0 0 0 6px;vertical-align:middle" data-undo="Reactie verwijderd"><input type="hidden" name="id" value="${r.id}" /><button class="btn-soft btn" style="margin:0;padding:1px 8px;font-size:.7rem">verwijder</button></form>`
                      : ""}
                    <div class="body">${r.reactie}</div>`;
                  return r.kanWeg
                    ? html`<div class="swipe"><button type="submit" form="nrdel-${r.id}" class="swipe-bg" tabindex="-1" aria-hidden="true">Verwijderen</button><div class="reactie swipe-fg">${inner}</div><form id="nrdel-${r.id}" method="post" action="/nieuws/reactie/verwijder" hidden data-undo="Reactie verwijderd"><input type="hidden" name="id" value="${r.id}" /></form></div>`
                    : html`<div class="reactie">${inner}</div>`;
                })}
                ${kanReageren
                  ? html`<form method="post" action="/nieuws/reactie" class="cmtform">
                      <input type="hidden" name="nieuws" value="${n.id}" />
                      <input type="text" name="reactie" placeholder="Reageer…" maxlength="500" required />
                      <button type="submit">Stuur</button>
                    </form>`
                  : ""}
              </div>
            </article>
          `;
        })}

  `,
  }));
}

// Hardening (audit v178): alleen http(s)-links als href accepteren (geen javascript:).
function veiligeLink(u?: string): string | undefined {
  const s = (u ?? "").trim();
  return /^https?:\/\//i.test(s) ? s : undefined;
}

// Documentenlijst (verhuisd van home; opruimslag) — /documenten.
export function documentenPagina(
  documenten: AirtableRecord<DocumentFields>[],
  gelezen: Set<string> = new Set(),        // keys "document:<id>" (leesbevestiging v185)
  kanBevestigen = false,
) {
  return lds(page({
    title: "Documenten",
    icon: "book",
    children: html`${documenten.length === 0
      ? emptyState({ icon: "book", title: "Nog geen documenten" })
      : html`<article class="card listcard"><ul class="doclist">
          ${documenten.map((d) => {
            const img =
              d.fields.Afbeelding?.[0]?.thumbnails?.large?.url ?? d.fields.Afbeelding?.[0]?.url;
            return html`<li>
              <span class="fico" style="overflow:hidden">${img
                ? html`<img src="${img}" alt="" style="width:100%;height:100%;object-fit:cover" />`
                : d.fields.Bestandssleutel
                  ? ICO.doc
                  : d.fields["Externe link"]
                    ? ICO.link
                    : ICO.doc}</span>
              <span style="flex:1;min-width:0">
                ${d.fields.Bestandssleutel
                  ? html`<a class="dname" href="/bestand?k=${encodeURIComponent(d.fields.Bestandssleutel)}">${d.fields.Titel ?? "(zonder titel)"}</a>`
                  : veiligeLink(d.fields["Externe link"])
                    ? html`<a class="dname" href="${veiligeLink(d.fields["Externe link"])!}">${d.fields.Titel ?? "(zonder titel)"}</a>`
                    : html`<span class="dname">${d.fields.Titel ?? "(zonder titel)"}</span>`}
                ${d.fields.Categorie ? html`<span class="muted"> · ${d.fields.Categorie}</span>` : ""}
              </span>
              ${kanBevestigen && d.fields.Categorie === "Beleid"
                ? gelezen.has(`document:${d.id}`)
                  ? html`<span class="muted" style="flex:none;font-size:.8rem;font-weight:600">&check; Gelezen</span>`
                  : html`<button type="button" class="ghost lees-btn" data-lees-type="document" data-lees-id="${d.id}">Gelezen</button>`
                : ""}
            </li>`;
          })}
        </ul></article>`}`,
  }));
}


export function voorJouPage(
  fy: { totalNew: number; groups: { moduleKey: string; label: string; count: number; items: { id: string; title: string; subtitle: string; route: string; createdAt: number }[] }[] },
  _groet: string,
  voornaam: string,
) {
  return lds(html`
    <h1>Voor jou${voornaam ? html`, ${voornaam}` : ""}</h1>
    <p class="muted">${fy.totalNew > 0 ? html`${fy.totalNew} nieuw${fy.totalNew === 1 ? " ding" : "e dingen"} sinds je laatste bezoek.` : "Niks nieuws \u2014 je bent helemaal bij."}</p>
    ${fy.groups.length === 0
      ? emptyState({ icon: "board", title: "Niks nieuws", text: "Zodra er iets nieuws is, zie je het hier." })
      : fy.groups.map((g) => html`<section>
          ${eyebrow(`${g.label} \u00b7 ${g.count}`)}
          <article class="card listcard"><ul class="clean">
            ${g.items.map((it) => html`<li><a href="${it.route}" class="row-top" style="gap:10px;color:inherit;text-decoration:none">
              <span class="grow"><strong>${it.title}</strong><span class="muted" style="display:block;font-size:.8rem">${it.subtitle}</span></span>
              <span class="muted" style="flex:none">&rsaquo;</span>
            </a></li>`)}
          </ul></article>
        </section>`)}
    <p class="muted" style="margin-top:18px"><a href="/">&larr; home</a></p>
  `);
}
