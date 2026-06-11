import { html } from "hono/html";
import type { HtmlEscapedString } from "hono/utils/html";
import type {
  AirtableRecord,
  RasFields,
  TeeltadviesFields,
  SnoeiPlukFields,
  KlantdocumentFields,
} from "../airtable";
import type { Strings } from "../portal/i18n";
import { BRAND_LOGO_B64 } from "../brand";

type Body = HtmlEscapedString | Promise<HtmlEscapedString>;

// Eigen layout voor het klantenportaal — volledig los van het interne deel.
// Alle interface-teksten komen uit `t` (meertalig).
export function portalLayout(
  t: Strings,
  active: string,
  pageTitle: string,
  body: Body,
  opts: { ingelogd?: boolean } = {},
) {
  const nav = (href: string, label: string) =>
    html`<a href="${href}" class="${active === href ? "on" : ""}">${label}</a>`;
  return html`<!DOCTYPE html>
<html lang="${t.lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${pageTitle} — Fresh Forward</title>
    <meta name="theme-color" content="#2f8b54" />
    <meta name="robots" content="noindex, nofollow" />
    <style>
      :root{
        color-scheme: light dark;
        --bg:#f6f8f4; --bg-2:#edf3ec; --surface:#fff; --surface-2:#eef3ea; --ink:#1b2620; --muted:#6b776e;
        --line:rgba(27,38,32,.09); --green:#2f8b54; --green-2:#379a5f; --green-3:#46ab6e; --green-deep:#236b41;
        --accent:#379a5f; --link:#2a7d4c; --berry:#c0566e; --berry-2:#d06a82; --berry-soft:#f8edf0;
        --btn:#2f8b54; --btn-press:#236b41; --field:#fff; --field-bd:rgba(27,38,32,.17);
        --ok-bg:#e8f4ec; --ok-bd:#bbdfc6; --ok-tx:#21663d;
        --warn-bg:#fbf1de; --warn-bd:#ecd3a0; --warn-tx:#8a5b16;
        --radius:18px; --radius-sm:13px; --radius-lg:24px;
        --shadow:0 1px 2px rgba(20,40,28,.05), 0 10px 28px rgba(20,40,28,.06);
        --shadow-lg:0 2px 6px rgba(20,40,28,.06), 0 18px 42px rgba(20,40,28,.11);
      }
      @media (prefers-color-scheme: dark){
        :root{ --bg:#0e1310; --bg-2:#131a15; --surface:#161d18; --surface-2:#1d2722; --ink:#e7ede8; --muted:#93a098;
          --line:rgba(255,255,255,.09); --green:#5fc886; --green-2:#54c178; --green-3:#62cf86; --green-deep:#8fdca8;
          --accent:#5fc886; --link:#74d597; --berry:#e98aa0; --berry-2:#f09cb0; --berry-soft:rgba(192,86,110,.16);
          --btn:#2f9d59; --btn-press:#37a962; --field:#1d2722; --field-bd:rgba(255,255,255,.16);
          --ok-bg:rgba(46,150,88,.16); --ok-bd:rgba(110,200,150,.30); --ok-tx:#a3e0b6;
          --warn-bg:rgba(190,140,40,.16); --warn-bd:rgba(225,185,90,.28); --warn-tx:#eecd8c;
          --shadow:0 1px 2px rgba(0,0,0,.4), 0 12px 32px rgba(0,0,0,.34);
          --shadow-lg:0 2px 8px rgba(0,0,0,.45), 0 22px 50px rgba(0,0,0,.48); }
      }
      @media (prefers-reduced-motion: reduce){ *{ animation:none !important; transition:none !important; } }
      *{ box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
      html,body{ margin:0; }
      body{ font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,system-ui,sans-serif;
        color:var(--ink);
        background:radial-gradient(1100px 360px at 100% -10%, var(--bg-2), transparent 70%), var(--bg);
        -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; }
      header.app{ position:sticky; top:0; z-index:20; background:var(--surface);
        border-bottom:1px solid var(--line); box-shadow:0 6px 20px rgba(20,40,28,.05);
        padding:calc(env(safe-area-inset-top) + 11px) 18px 11px;
        display:flex; align-items:center; justify-content:space-between; gap:12px; }
      header.app .brand{ display:inline-flex; align-items:center; text-decoration:none; }
      header.app .brand img{ height:32px; width:auto; display:block; }
      header.app .pagetag{ color:var(--muted); font-size:.78rem; font-weight:650; white-space:nowrap;
        padding:5px 11px; border:1px solid var(--line); border-radius:999px; background:var(--surface-2); }
      nav.top{ display:flex; gap:5px; overflow-x:auto; background:var(--surface); border-bottom:1px solid var(--line);
        padding:9px 12px; position:sticky; top:0; z-index:10; }
      nav.top a{ white-space:nowrap; padding:8px 14px; border-radius:999px; text-decoration:none;
        color:var(--muted); font-weight:640; font-size:.86rem; transition:.15s; }
      nav.top a.on{ background:linear-gradient(180deg,var(--green-2),var(--green)); color:#fff; box-shadow:0 3px 10px rgba(35,107,65,.22); }
      main{ max-width:760px; margin:0 auto; padding:20px 16px 40px; }
      h1{ font-size:1.6rem; font-weight:780; margin:4px 0 14px; letter-spacing:-.025em; }
      h2{ font-size:1.05rem; font-weight:700; margin:24px 0 10px; }
      p{ line-height:1.58; }
      a{ color:var(--link); }
      .muted{ color:var(--muted); font-size:.86rem; }
      .card{ background:var(--surface); border:1px solid var(--line); border-radius:var(--radius);
        padding:17px 19px; margin:13px 0; box-shadow:var(--shadow); transition:transform .16s, box-shadow .16s; }
      article.card:hover{ transform:translateY(-2px); box-shadow:var(--shadow-lg); }
      .card h3{ margin:0 0 6px; font-size:1.07rem; font-weight:700; }
      .tag{ display:inline-block; background:var(--surface-2); color:var(--green); font-size:.73rem;
        font-weight:680; padding:2px 9px; border-radius:999px; margin:0 4px 4px 0; }
      .body{ white-space:pre-wrap; word-break:break-word; line-height:1.58; }
      .hero{ position:relative; overflow:hidden; border-radius:var(--radius-lg); color:#fff; margin:2px 0 16px;
        padding:22px 22px 24px;
        background:radial-gradient(120% 130% at 92% -25%, rgba(255,255,255,.18), transparent 55%),
          linear-gradient(135deg,#236b41,#2f8b54 68%,#3fa468);
        box-shadow:0 14px 36px rgba(20,70,40,.22); }
      .hero .kicker{ font-size:.76rem; font-weight:680; letter-spacing:.05em; text-transform:uppercase; opacity:.85; }
      .hero h1{ color:#fff; font-size:1.55rem; margin:6px 0 5px; letter-spacing:-.03em; }
      .hero p{ margin:0; opacity:.92; font-size:.92rem; max-width:40ch; }
      .grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:8px 0; }
      .tile{ display:flex; flex-direction:column; gap:3px; padding:18px; border-radius:var(--radius);
        background:var(--surface); border:1px solid var(--line); box-shadow:var(--shadow);
        text-decoration:none; color:var(--ink); transition:transform .14s, box-shadow .16s; }
      .tile:hover{ transform:translateY(-2px); box-shadow:var(--shadow-lg); }
      .tile b{ color:var(--green); font-size:1.04rem; font-weight:700; }
      .tile span{ font-size:.82rem; color:var(--muted); }
      .ok{ background:var(--ok-bg); border:1px solid var(--ok-bd); color:var(--ok-tx); padding:12px 15px; border-radius:var(--radius-sm); margin:11px 0; }
      .warn{ background:var(--warn-bg); border:1px solid var(--warn-bd); color:var(--warn-tx); padding:12px 15px; border-radius:var(--radius-sm); margin:11px 0; }
      label{ display:block; margin:12px 0; font-weight:640; font-size:.9rem; }
      input{ display:block; width:100%; margin-top:6px; padding:12px 13px; border:1px solid var(--field-bd);
        border-radius:var(--radius-sm); font:inherit; background:var(--field); color:var(--ink); }
      input:focus{ outline:none; border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb, var(--accent) 24%, transparent); }
      button{ display:inline-flex; align-items:center; justify-content:center;
        background:linear-gradient(180deg,var(--green-2),var(--green)); color:#fff; border:0; border-radius:var(--radius-sm);
        padding:12px 19px; font:inherit; font-weight:650; cursor:pointer; margin-top:6px; box-shadow:0 3px 11px rgba(35,107,65,.20);
        transition:transform .08s, filter .16s; }
      button:hover{ filter:brightness(1.03); }
      button:active{ background:var(--btn-press); transform:translateY(1px) scale(.99); }
      .ras-img{ width:100%; max-height:220px; object-fit:cover; border-radius:var(--radius-sm); margin:0 0 12px; }
      footer{ color:var(--muted); font-size:.74rem; text-align:center; padding:18px 16px; }
      @keyframes fadeUp{ from{ opacity:0; transform:translateY(10px); } to{ opacity:1; transform:none; } }
      main > *{ animation:fadeUp .42s both; }
      main > *:nth-child(2){ animation-delay:.05s; } main > *:nth-child(3){ animation-delay:.1s; }
      main > *:nth-child(4){ animation-delay:.15s; }
    </style>
  </head>
  <body>
    <header class="app">
      <a href="/portaal" class="brand" aria-label="Fresh Forward"><img src="data:image/png;base64,${BRAND_LOGO_B64}" alt="Fresh Forward" /></a>
      <span class="pagetag">${t.brand}${pageTitle ? ` · ${pageTitle}` : ""}</span>
    </header>
    ${opts.ingelogd
      ? html`<nav class="top">
          ${nav("/portaal", t.nav.home)} ${nav("/portaal/rassen", t.nav.rassen)}
          ${nav("/portaal/teeltadvies", t.nav.teelt)} ${nav("/portaal/snoei-pluk", t.nav.snoei)}
          ${nav("/portaal/documenten", t.nav.docs)}
          <a href="/portaal/logout" style="margin-left:auto;color:var(--muted)">${t.nav.logout}</a>
        </nav>`
      : ""}
    <main>${body}</main>
    <footer>${t.footer}</footer>
  </body>
</html>`;
}

/* ---- Login ---- */

export function portalLogin(t: Strings, opts: { fout?: string } = {}) {
  return html`
    <h1>${t.login.title}</h1>
    <p class="muted">${t.login.intro}</p>
    ${opts.fout ? html`<p class="warn flash" data-toast>${opts.fout}</p>` : ""}
    <form method="post" action="/portaal/login" class="card">
      <label>${t.login.emailLabel}
        <input name="email" type="email" required autocomplete="email" placeholder="jij@bedrijf.nl" />
      </label>
      <button type="submit">${t.login.button}</button>
    </form>
  `;
}

export function portalLoginSent(t: Strings, devLink?: string) {
  return html`
    <h1>${t.sent.title}</h1>
    <p>${t.sent.body}</p>
    ${devLink
      ? html`<div class="warn">
          <strong>${t.sent.testPrefix}</strong><br />
          <a href="${devLink}">${devLink}</a>
        </div>`
      : ""}
    <p class="muted"><a href="/portaal/login">${t.sent.retry}</a></p>
  `;
}

/* ---- Dashboard ---- */

export function portalDashboard(t: Strings, naam: string) {
  return html`
    <div class="hero">
      <div class="kicker">Fresh Forward</div>
      <h1>${t.dash.welcome}${naam ? `, ${naam}` : ""}</h1>
      <p>${t.dash.intro}</p>
    </div>
    <form id="vbform" class="card" style="margin:0 0 16px"
          data-busy="${t.dash.askBusy}" data-sources="${t.dash.askSources}" data-error="${t.dash.askError}">
      <label style="font-weight:700">${t.dash.askT}</label>
      <div style="display:flex;gap:9px;margin-top:6px">
        <input id="vbinput" type="text" placeholder="${t.dash.askPlaceholder}" autocomplete="off" style="flex:1;margin:0" />
        <button id="vbbtn" type="submit" style="margin:0">${t.dash.askBtn}</button>
      </div>
      <div id="vbantwoord" hidden style="margin-top:12px"></div>
    </form>
    <div class="grid">
      <a class="tile" href="/portaal/rassen"><b>${t.dash.rassenT}</b><span>${t.dash.rassenD}</span></a>
      <a class="tile" href="/portaal/teeltadvies"><b>${t.dash.teeltT}</b><span>${t.dash.teeltD}</span></a>
      <a class="tile" href="/portaal/snoei-pluk"><b>${t.dash.snoeiT}</b><span>${t.dash.snoeiD}</span></a>
      <a class="tile" href="/portaal/documenten"><b>${t.dash.docsT}</b><span>${t.dash.docsD}</span></a>
    </div>
    <script>
      (function () {
        var f = document.getElementById("vbform"), inp = document.getElementById("vbinput"),
            out = document.getElementById("vbantwoord"), btn = document.getElementById("vbbtn");
        if (!f) return;
        var D = f.dataset;
        function esc(s){ return String(s).replace(/[&<>]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c]; }); }
        function escA(s){ return String(s).replace(/"/g, "&quot;"); }
        f.addEventListener("submit", async function (e) {
          e.preventDefault();
          var q = inp.value.trim(); if (!q) return;
          btn.disabled = true; var prev = btn.textContent; btn.textContent = "…";
          out.hidden = false; out.innerHTML = '<p class="muted">' + esc(D.busy || "") + "</p>";
          try {
            var r = await fetch("/portaal/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: q }) });
            var j = await r.json();
            var h = '<div class="card" style="background:rgba(0,0,0,.03)"><div style="white-space:pre-wrap;line-height:1.55">' + esc(j.answer || "") + "</div>";
            if (j.sources && j.sources.length) {
              h += '<div class="muted" style="margin-top:10px;font-size:.82rem">' + esc(D.sources || "") + "</div><ul>";
              j.sources.forEach(function (s) { var ti = esc(s.title || "bron"); h += "<li>" + (s.url ? '<a href="' + escA(s.url) + '">' + ti + "</a>" : ti) + "</li>"; });
              h += "</ul>";
            }
            h += "</div>";
            out.innerHTML = h;
          } catch (err) { out.innerHTML = "<p>" + esc(D.error || "") + "</p>"; }
          btn.disabled = false; btn.textContent = prev;
        });
      })();
    </script>
  `;
}

/* ---- Content-pagina's (UI vertaald; inhoud uit Airtable as-is) ---- */

export function portalRassen(t: Strings, rassen: AirtableRecord<RasFields>[]) {
  return html`
    <h1>${t.rassen.title}</h1>
    ${rassen.length === 0
      ? html`<p class="muted">${t.rassen.empty}</p>`
      : rassen.map((r) => {
          const img =
            r.fields.Afbeelding?.[0]?.thumbnails?.large?.url ??
            r.fields.Afbeelding?.[0]?.url;
          return html`<article class="card">
            ${img ? html`<img class="ras-img" src="${img}" alt="${r.fields.Naam ?? ""}" />` : ""}
            ${r.fields.Bestandssleutel ? html`<p class="muted">Bijlage: <a href="/portaal/bestand?k=${encodeURIComponent(r.fields.Bestandssleutel)}">${r.fields.Bestandsnaam ?? "download"}</a></p>` : ""}
            <h3>${r.fields.Naam ?? "—"}</h3>
            <div>
              ${r.fields.Gewas ? html`<span class="tag">${r.fields.Gewas}</span>` : ""}
              ${r.fields.Seizoen ? html`<span class="tag">${r.fields.Seizoen}</span>` : ""}
            </div>
            ${r.fields.Omschrijving ? html`<p class="body">${r.fields.Omschrijving}</p>` : ""}
            <p class="muted">
              ${r.fields.Smaak ? html`${t.rassen.smaak}: ${r.fields.Smaak}` : ""}
              ${r.fields.Kleur ? html` · ${t.rassen.kleur}: ${r.fields.Kleur}` : ""}
            </p>
          </article>`;
        })}
  `;
}

export function portalTeeltadvies(
  t: Strings,
  adviezen: AirtableRecord<TeeltadviesFields>[],
  rasNaam: Map<string, string>,
) {
  return html`
    <h1>${t.teelt.title}</h1>
    ${adviezen.length === 0
      ? html`<p class="muted">${t.teelt.empty}</p>`
      : adviezen.map(
          (a) => {
            const img =
              a.fields.Afbeelding?.[0]?.thumbnails?.large?.url ?? a.fields.Afbeelding?.[0]?.url;
            return html`<article class="card">
            ${img ? html`<img class="ras-img" src="${img}" alt="${a.fields.Titel ?? ""}" />` : ""}
            ${a.fields.Bestandssleutel ? html`<p class="muted">Bijlage: <a href="/portaal/bestand?k=${encodeURIComponent(a.fields.Bestandssleutel)}">${a.fields.Bestandsnaam ?? "download"}</a></p>` : ""}
            <h3>${a.fields.Titel ?? "—"}</h3>
            <div>
              ${a.fields.Categorie ? html`<span class="tag">${a.fields.Categorie}</span>` : ""}
              ${(a.fields.Ras ?? []).map((id) =>
                rasNaam.has(id) ? html`<span class="tag">${rasNaam.get(id)}</span>` : "",
              )}
            </div>
            ${a.fields.Inhoud ? html`<p class="body">${a.fields.Inhoud}</p>` : ""}
          </article>`;
          },
        )}
  `;
}

export function portalSnoeiPluk(
  t: Strings,
  items: AirtableRecord<SnoeiPlukFields>[],
  rasNaam: Map<string, string>,
) {
  return html`
    <h1>${t.snoei.title}</h1>
    ${items.length === 0
      ? html`<p class="muted">${t.snoei.empty}</p>`
      : items.map(
          (a) => {
            const img =
              a.fields.Afbeelding?.[0]?.thumbnails?.large?.url ?? a.fields.Afbeelding?.[0]?.url;
            return html`<article class="card">
            ${img ? html`<img class="ras-img" src="${img}" alt="${a.fields.Titel ?? ""}" />` : ""}
            ${a.fields.Bestandssleutel ? html`<p class="muted">Bijlage: <a href="/portaal/bestand?k=${encodeURIComponent(a.fields.Bestandssleutel)}">${a.fields.Bestandsnaam ?? "download"}</a></p>` : ""}
            <h3>${a.fields.Titel ?? "—"}</h3>
            <div>
              ${a.fields.Type ? html`<span class="tag">${a.fields.Type}</span>` : ""}
              ${a.fields.Periode ? html`<span class="tag">${a.fields.Periode}</span>` : ""}
              ${(a.fields.Ras ?? []).map((id) =>
                rasNaam.has(id) ? html`<span class="tag">${rasNaam.get(id)}</span>` : "",
              )}
            </div>
            ${a.fields.Inhoud ? html`<p class="body">${a.fields.Inhoud}</p>` : ""}
          </article>`;
          },
        )}
  `;
}

export function portalDocumenten(t: Strings, docs: AirtableRecord<KlantdocumentFields>[]) {
  return html`
    <h1>${t.docs.title}</h1>
    ${docs.length === 0
      ? html`<p class="muted">${t.docs.empty}</p>`
      : docs.map(
          (d) => {
            const img =
              d.fields.Afbeelding?.[0]?.thumbnails?.large?.url ?? d.fields.Afbeelding?.[0]?.url;
            return html`<article class="card">
            ${img ? html`<img class="ras-img" src="${img}" alt="${d.fields.Titel ?? ""}" />` : ""}
            <h3>
              ${d.fields.Bestandssleutel
                ? html`<a href="/portaal/bestand?k=${encodeURIComponent(d.fields.Bestandssleutel)}">${d.fields.Titel ?? "—"}</a>`
                : d.fields["Externe link"]
                  ? html`<a href="${d.fields["Externe link"]}" target="_blank" rel="noopener">${d.fields.Titel ?? "—"}</a>`
                  : html`<span>${d.fields.Titel ?? "—"}</span>`}
            </h3>
            ${d.fields.Categorie ? html`<span class="tag">${d.fields.Categorie}</span>` : ""}
            ${d.fields.Omschrijving ? html`<p class="muted">${d.fields.Omschrijving}</p>` : ""}
          </article>`;
          },
        )}
  `;
}
