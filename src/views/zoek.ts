import { html, raw } from "hono/html";
import { lds } from "./loods";
import { pageTitle } from "./templates";
import type {
  AirtableRecord,
  NieuwsFields,
  DocumentFields,
  MedewerkerFields,
} from "../airtable";

function initials(naam: string): string {
  const p = naam.trim().split(/\s+/);
  const s = (p[0]?.[0] ?? "") + (p.length > 1 ? (p[p.length - 1][0] ?? "") : "");
  return s.toUpperCase() || "?";
}

// Platte tekst-snippet uit (rich) inhoud: tags/markdown strippen, inkorten.
function snippet(txt?: string, len = 150): string {
  if (!txt) return "";
  const plain = txt
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_>`~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > len ? plain.slice(0, len).trimEnd() + "…" : plain;
}

const ICO_DOC = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 16.5h4"/></svg>`;
const ICO_LINK = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.5 1.5"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1.5-1.5"/></svg>`;
const ICO_NEWS = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-4 4Z"/><path d="M8 9h8M8 12.5h5"/></svg>`;
const ICO_PHONE = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"/></svg>`;
const ICO_MAIL = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/></svg>`;

function sectie(titel: string, count: number, rijen: unknown) {
  return html`<div class="eyebrow"><span>${titel} · ${count}</span></div>
    ${rijen}`;
}

function persoonKaart(m: AirtableRecord<MedewerkerFields>) {
  const f = m.fields;
  const foto = f.Foto?.[0]?.thumbnails?.large?.url ?? f.Foto?.[0]?.url;
  const sub = [f.Functie, f.Afdeling].filter(Boolean).join(" · ");
  return html`<div class="card" style="display:flex;align-items:center;gap:13px;padding:13px 15px">
    ${foto
      ? html`<img src="${foto}" alt="" style="width:46px;height:46px;border-radius:50%;object-fit:cover;flex:none" />`
      : html`<span style="width:46px;height:46px;border-radius:50%;flex:none;display:grid;place-items:center;background:var(--surface-2);color:var(--t-ink);font-weight:700">${initials(f.Naam ?? "?")}</span>`}
    <div style="flex:1;min-width:0">
      <div class="who" style="font-weight:700">${f.Naam ?? "(geen naam)"}</div>
      ${sub ? html`<div class="muted" style="font-size:.82rem">${sub}</div>` : ""}
      <div style="display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:5px;font-size:.82rem">
        ${f.Telefoon ? html`<a href="tel:${f.Telefoon}" style="display:inline-flex;align-items:center;gap:5px;color:var(--t-ink)">${raw(ICO_PHONE)}${f.Telefoon}</a>` : ""}
        ${f["E-mail"] ? html`<a href="mailto:${f["E-mail"]}" style="display:inline-flex;align-items:center;gap:5px;color:var(--t-ink)">${raw(ICO_MAIL)}${f["E-mail"]}</a>` : ""}
      </div>
    </div>
  </div>`;
}

function nieuwsRij(n: AirtableRecord<NieuwsFields>) {
  const s = snippet(n.fields.Inhoud);
  return html`<a class="card" href="/#nieuws-${n.id}" style="display:flex;gap:var(--sp-3);align-items:flex-start;padding:13px 15px;text-decoration:none;color:inherit">
    <span style="color:var(--t-ink);flex:none;margin-top:1px">${raw(ICO_NEWS)}</span>
    <span style="flex:1;min-width:0">
      <span class="who" style="font-weight:700;display:block">${n.fields.Titel ?? "(zonder titel)"}</span>
      <span class="muted" style="font-size:.8rem">${n.fields.Categorie ? n.fields.Categorie + " · " : ""}${n.fields.Publicatiedatum ?? ""}</span>
      ${s ? html`<span class="muted" style="display:block;margin-top:3px;font-size:.85rem">${s}</span>` : ""}
    </span>
  </a>`;
}

function documentRij(d: AirtableRecord<DocumentFields>) {
  // Hardening (audit v178): alleen http(s)-links als href accepteren (geen javascript:).
  const ext = /^https?:\/\//i.test(String(d.fields["Externe link"] ?? "").trim()) ? String(d.fields["Externe link"]).trim() : undefined;
  const href = d.fields.Bestandssleutel
    ? `/bestand?k=${encodeURIComponent(d.fields.Bestandssleutel)}`
    : ext ?? "#";
  const extern = !d.fields.Bestandssleutel && !!ext;
  return html`<a class="card" href="${href}"${extern ? raw(' target="_blank" rel="noopener"') : ""} style="display:flex;gap:var(--sp-3);align-items:flex-start;padding:13px 15px;text-decoration:none;color:inherit">
    <span style="color:var(--t-ink);flex:none;margin-top:1px">${raw(extern ? ICO_LINK : ICO_DOC)}</span>
    <span style="flex:1;min-width:0">
      <span class="who" style="font-weight:700;display:block">${d.fields.Titel ?? "(zonder titel)"}</span>
      ${d.fields.Categorie ? html`<span class="muted" style="font-size:.8rem">${d.fields.Categorie}</span>` : ""}
      ${d.fields.Omschrijving ? html`<span class="muted" style="display:block;margin-top:3px;font-size:.85rem">${snippet(d.fields.Omschrijving)}</span>` : ""}
    </span>
  </a>`;
}

// 4.1: FTS-treffer (prikbord/peiling/agenda/training) als compacte linkrij met deep link.
function ftsRij(t: { titel: string; frag: string; route: string }) {
  return html`<a class="card" href="${t.route}" style="display:block;padding:12px 15px;text-decoration:none;color:inherit">
    <span class="who" style="font-weight:700;display:block">${t.titel}</span>
    ${t.frag && t.frag !== t.titel ? html`<span class="muted" style="display:block;margin-top:3px;font-size:.85rem">${t.frag}</span>` : ""}
  </a>`;
}

export function zoekResultaten(
  q: string,
  mensen: AirtableRecord<MedewerkerFields>[],
  nieuws: AirtableRecord<NieuwsFields>[],
  documenten: AirtableRecord<DocumentFields>[],
  fts: { key: string; label: string; items: { titel: string; frag: string; route: string }[] }[] = [],
) {
  const ftsTotaal = fts.reduce((s, g) => s + g.items.length, 0);
  const totaal = mensen.length + nieuws.length + documenten.length + ftsTotaal;
  if (q.length === 0)
    return html`<p class="muted">Typ een zoekterm om te zoeken in nieuws, documenten, collega's, prikbord, agenda en meer.</p>`;
  if (totaal === 0)
    return html`<div class="card" style="text-align:center;padding:26px 18px">
      <p style="font-weight:700;margin:0 0 4px">Geen resultaten</p>
      <p class="muted" style="margin:0">Niets gevonden voor “${q}”. Probeer een andere zoekterm.</p>
    </div>`;
  return html`
    ${mensen.length ? sectie("Mensen", mensen.length, mensen.map(persoonKaart)) : ""}
    ${nieuws.length ? sectie("Nieuws", nieuws.length, nieuws.map(nieuwsRij)) : ""}
    ${documenten.length ? sectie("Documenten", documenten.length, documenten.map(documentRij)) : ""}
    ${fts.map((g) => (g.items.length ? sectie(g.label, g.items.length, g.items.map(ftsRij)) : ""))}
  `;
}

export function zoekPage(
  q: string,
  mensen: AirtableRecord<MedewerkerFields>[],
  nieuws: AirtableRecord<NieuwsFields>[],
  documenten: AirtableRecord<DocumentFields>[],
  isBeheerder = false,
  fts: { key: string; label: string; items: { titel: string; frag: string; route: string }[] }[] = [],
) {
  return lds(html`
    ${pageTitle("search", "Zoeken")}
    <form id="zoekform" method="get" action="/zoek" role="search" class="card"
          data-busy="Bezig met zoeken in de kennisbank\u2026" data-sources="Bronnen:" data-error="Kon de kennisbank niet bereiken.">
      <div style="display:flex;gap:9px;align-items:center;flex-wrap:wrap">
        <input id="zoekinput" type="search" name="q" value="${q}" placeholder="Zoek of stel een vraag\u2026" autocomplete="off" autofocus style="flex:1 1 200px;margin:0" />
        <button type="submit" style="margin:0">Zoek</button>
        <button type="button" id="vbbtn" class="btn btn-soft" style="margin:0">Vraag kennisbank</button>
      </div>
      <p class="muted" style="margin:8px 0 0;font-size:.8rem">Typen = direct zoeken over alle modules heen. <strong>Vraag kennisbank</strong> geeft een AI-antwoord met bronnen.</p>
      <div id="zoekrecent" class="pills" style="margin:10px 0 0;display:none"></div>
      <div id="vbantwoord" hidden style="margin-top:12px"></div>
      ${isBeheerder ? html`<div style="margin-top:10px"><button type="button" id="vbreindex" class="btn btn-soft" style="margin:0;font-size:.8rem;padding:6px 11px">Kennisbank herindexeren</button> <span id="vbreindexmsg" class="muted" style="font-size:.8rem"></span></div>` : ""}
    </form>
    <div id="zoekresultaten">${zoekResultaten(q, mensen, nieuws, documenten, fts)}</div>
    <script>
      (function () {
        var inp = document.getElementById("zoekinput");
        var box = document.getElementById("zoekresultaten");
        var form = document.getElementById("zoekform");
        if (!inp || !box || !form) return;
        var timer, ctrl;
        // Recente zoekopdrachten (4.1): lokaal bewaard, max 6, klik = opnieuw zoeken.
        var rec = document.getElementById("zoekrecent");
        function loadRec() { try { return JSON.parse(localStorage.getItem("ff_zoek_recent") || "[]"); } catch (e) { return []; } }
        function saveRec(q) { try { var xs = loadRec().filter(function (x) { return x !== q; }); xs.unshift(q); localStorage.setItem("ff_zoek_recent", JSON.stringify(xs.slice(0, 6))); } catch (e) {} }
        function renderRec() {
          if (!rec) return;
          var xs = loadRec();
          rec.innerHTML = "";
          if (!xs.length || inp.value.trim()) { rec.style.display = "none"; return; }
          rec.style.display = "";
          xs.forEach(function (x) {
            var b = document.createElement("button"); b.type = "button"; b.className = "pill"; b.style.margin = "0"; b.textContent = x;
            b.addEventListener("click", function () { inp.value = x; run(); renderRec(); });
            rec.appendChild(b);
          });
        }
        function run() {
          var q = inp.value.trim();
          if (q.length >= 3) saveRec(q);
          if (ctrl) ctrl.abort();
          ctrl = new AbortController();
          fetch("/api/zoek?q=" + encodeURIComponent(q), { signal: ctrl.signal })
            .then(function (r) { return r.text(); })
            .then(function (h) { box.innerHTML = h; })
            .catch(function () {});
          try { history.replaceState(null, "", q ? "/zoek?q=" + encodeURIComponent(q) : "/zoek"); } catch (e) {}
        }
        inp.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(run, 200); renderRec(); });
        form.addEventListener("submit", function (e) { e.preventDefault(); clearTimeout(timer); run(); });
        renderRec();
        var v = inp.value; inp.value = ""; inp.value = v;
      })();
    </script>
    <script>
      (function () {
        var form = document.getElementById("zoekform"), inp = document.getElementById("zoekinput");
        var out = document.getElementById("vbantwoord"), btn = document.getElementById("vbbtn");
        if (!form || !btn) return;
        var D = form.dataset;
        function esc(s){ return String(s).replace(/[&<>]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c]; }); }
        function escA(s){ return String(s).replace(/"/g, "&quot;"); }
        btn.addEventListener("click", async function () {
          var q = inp.value.trim(); if (!q) { inp.focus(); return; }
          btn.disabled = true; var prev = btn.textContent; btn.textContent = "\u2026";
          out.hidden = false; out.innerHTML = '<p class="muted">' + esc(D.busy || "") + "</p>";
          try {
            var r = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: q }) });
            var j = await r.json();
            var h = '<div class="card" style="background:var(--surface-2)"><div style="white-space:pre-wrap;line-height:1.55">' + esc(j.answer || "") + "</div>";
            if (j.sources && j.sources.length) {
              h += '<div class="muted" style="margin-top:10px;font-size:.82rem">' + esc(D.sources || "") + "</div><ul class=\"clean\">";
              j.sources.forEach(function (s) { var t = esc(s.title || "bron"); h += '<li style="padding:4px 0">' + (s.url ? '<a href="' + escA(s.url) + '">' + t + "</a>" : t) + "</li>"; });
              h += "</ul>";
            }
            h += "</div>";
            out.innerHTML = h;
          } catch (e) { out.innerHTML = '<p class="warn">' + esc(D.error || "") + "</p>"; }
          btn.disabled = false; btn.textContent = prev;
        });
        var ri = document.getElementById("vbreindex");
        if (ri) ri.addEventListener("click", async function () {
          var msg = document.getElementById("vbreindexmsg");
          ri.disabled = true; if (msg) msg.textContent = "Bezig\u2026";
          try { var r = await fetch("/api/kennisbank/reindex", { method: "POST" }); var j = await r.json();
            if (msg) msg.textContent = j.ok ? ("Klaar \u2014 " + j.chunks + " stukken ge\u00efndexeerd.") : ("Mislukt: " + (j.error || "")); }
          catch (e) { if (msg) msg.textContent = "Mislukt."; }
          ri.disabled = false;
        });
      })();
    </script>
  `);
}
