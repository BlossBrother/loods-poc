// Loods-componentbibliotheek (restyle ronde 2) — designsysteem §3 (loods-design/).
// Fragment-componenten + gedeelde CSS voor module-schermen BINNEN de bestaande
// shell (layout.ts): alle gedrag (sheets, undo, polls, emoji, offline) blijft
// van de shell komen. De capsule-tabbar app-breed volgt in een latere ronde.
// Regels: componenten consumeren tokens — de enige hex-waarden staan in het
// tokensblok bovenaan LOODS_CSS (tenant-tokens FF-groen, designsysteem §1).
// Gebruik: wikkel de module-body in <div class="lds">…</div> (of via lds()).
import { html, raw } from "hono/html";
import type { HtmlEscapedString } from "hono/utils/html";

type Frag = HtmlEscapedString | Promise<HtmlEscapedString> | string;

// Lucide/Feather-stijl stroke-iconen (stroke 1.8, round) — aanvullend op layout-ICONS.
const LICONS: Record<string, string> = {
  chevl: `<polyline points="15 18 9 12 15 6"/>`,
  chevr: `<polyline points="9 18 15 12 9 6"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>`,
  pin: `<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>`,
  cal: `<rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M3.5 9h17M8 3v3M16 3v3"/>`,
  text: `<line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>`,
  award: `<circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/>`,
  poll: `<path d="M4 20V10M10 20V4M16 20v-6M22 20H2"/>`,
  check: `<polyline points="20 6 9 17 4 12"/>`,
  tag: `<path d="M20.6 13.4 12 22l-8-8 8.6-8.6a2 2 0 0 1 1.4-.6H19a2 2 0 0 1 2 2v5.2a2 2 0 0 1-.4 1.4Z"/><circle cx="16" cy="8" r="1.5"/>`,
};

export function lico(id: string, sw = 1.8) {
  return raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LICONS[id] ?? ""}</svg>`);
}

// Wrapper: activeert de Loods-tokens + componentstijlen voor de module-body.
export function lds(children: Frag) {
  return html`<div class="lds">${children}</div>`;
}

// Eyebrow: sectielabel met optionele accent-link rechts ("Alles →").
export function eyebrow(label: string, link?: { href: string; label: string }) {
  return html`<div class="eyebrow"><span>${label}</span>${link ? html`<a href="${link.href}">${link.label} &rarr;</a>` : ""}</div>`;
}

// Icoon-tegel (13px radius, --tile-vlak, accent-icoon).
export function tile(icon: string, sw = 1.8) {
  return html`<span class="tile">${lico(icon, sw)}</span>`;
}

// ActionCard: tegel + titel + subregel (+ optionele ghost-CTA), hele kaart tapbaar.
export function actionCard(o: { href: string; icon: string; title: Frag; sub?: Frag; cta?: string }) {
  return html`<a class="card acard" href="${o.href}">${tile(o.icon)}<span class="tx"><h4>${o.title}</h4>${o.sub ? html`<p>${o.sub}</p>` : ""}</span>${o.cta ? html`<span class="ghost">${o.cta}</span>` : ""}</a>`;
}

// Ronde navigatieknop (‹ / ›) in sh-soft-kaartstijl.
export function navBtn(href: string, dir: "l" | "r", label: string) {
  return html`<a class="navbtn" href="${href}" aria-label="${label}">${lico(dir === "l" ? "chevl" : "chevr", 2)}</a>`;
}

// TodayCard-romp: stroomlijn-rail naast tijdregels. `live` = vallende druppel
// (signature-element; alleen aanzetten als de getoonde dag vandaag is).
export function railCard(items: Frag, live: boolean) {
  return html`<article class="card tdcard"><div class="trow">
    <div class="rail-wrap"><div class="rail${live ? " live" : ""}"></div></div>
    <div class="trows">${items}</div>
  </div></article>`;
}

// Gedeelde CSS. Wordt door layout.ts in het <style>-blok geïnjecteerd; alles is
// gescoped onder .lds zodat niet-gerestylede schermen onaangeroerd blijven.
// --t-ink: accent als tekst/stroke-kleur; in dark de lichtere accent2 zodat de
// WCAG-guardrail (accent ↔ card ≥ 3:1, designsysteem §4) ook daar haalt.
// Gradients en tegels blijven in beide modi gelijk (tenant-tokens vast, §2).
export const LOODS_CSS = `
      /* ===== Loods-componentbibliotheek (ronde 2) — tokens ===== */
      .lds{
        --t-accent:#236b41; --t-accent2:#3fa468; --t-onaccent:#ffffff;
        --grad:linear-gradient(135deg,var(--t-accent2),var(--t-accent));
        --tile:color-mix(in srgb, var(--t-accent) 10%, transparent);
        --glow:color-mix(in srgb, var(--t-accent) 24%, transparent); /* v189: glow gedempt */
        --t-ink:var(--t-accent);
      }
      /* v189: ontzadigd accent als tekst/stroke in dark (lit.: verzadigd 'gloeit' op donker);
         de gradients/tegels houden de vaste tenant-kleuren. */
      @media (prefers-color-scheme: dark){ :root:not([data-theme]) .lds{ --t-ink:#5fbe85; } }
      :root[data-theme="dark"] .lds{ --t-ink:#5fbe85; }
      /* KRITIEK (v172-fix): de .lds-wrapper mag GEEN transform-animatie krijgen — een
         ancestor met transform wordt containing block voor position:fixed, waardoor de
         bottom-sheets (.sheet-m) midden in de pagina "landen" en alles blokkeren op iOS.
         Daarom: opacity-only entrance (geen translateY zoals fadeUp). */
      @keyframes ldsfade{ from{ opacity:0 } }
      main > .lds{ animation:ldsfade var(--dur-screen) both; }
      html.vt-nav main > .lds{ animation:none; }
      /* ===== Kaarten & secties ===== */
      .lds .card{ border-radius:22px; }
      .lds .post{ border-radius:22px; margin:10px 0; }
      .lds .eyebrow{ display:flex; align-items:baseline; justify-content:space-between; margin:22px 4px 10px; }
      .lds .eyebrow span{ font-size:.72rem; font-weight:800; letter-spacing:1.6px; color:var(--muted); text-transform:uppercase; }
      .lds .eyebrow a{ font-size:.84rem; font-weight:600; color:var(--t-ink); text-decoration:none; }
      /* ===== Knoppen: primair = gradient-pill met glow; soft = sh-soft-pill; ghost = accent-rand ===== */
      .lds .btn, .lds button[type=submit]{ background:var(--grad); border-radius:999px; box-shadow:0 5px 14px var(--glow); font-weight:700; }
      .lds .btn-soft{ background:var(--surface); color:var(--ink); border:1px solid var(--line); border-radius:999px; box-shadow:var(--shadow); }
      .lds .btn-berry{ background:var(--berry); border-radius:999px; box-shadow:0 2px 8px rgba(192,86,110,.20); }
      .lds .ghost{ flex:none; display:inline-flex; align-items:center; border:1.5px solid var(--t-ink); background:none; color:var(--t-ink); font-weight:700; font-size:.8rem; border-radius:999px; padding:7px 13px; cursor:pointer; }
      .lds .navbtn{ width:40px; height:40px; border-radius:50%; border:1px solid var(--line); background:var(--surface); display:inline-grid; place-items:center; box-shadow:var(--shadow); color:var(--ink); text-decoration:none; flex:none; }
      .lds .navbtn svg{ width:18px; height:18px; }
      .lds .pill{ box-shadow:var(--shadow); }
      .lds .pill.on{ background:var(--grad); border-color:transparent; box-shadow:0 5px 14px var(--glow); }
      /* ===== Icoon-tegels & ActionCards ===== */
      .lds .tile{ width:42px; height:42px; border-radius:13px; background:var(--tile); display:grid; place-items:center; flex:none; color:var(--t-ink); }
      .lds .tile svg{ width:20px; height:20px; }
      .lds .acard{ display:flex; align-items:center; gap:13px; padding:14px 15px; margin:10px 0; text-decoration:none; color:var(--ink); }
      .lds .acard .tx{ flex:1; min-width:0; }
      .lds .acard h4{ margin:0; font-size:.94rem; font-weight:700; line-height:1.3; letter-spacing:-.01em; }
      .lds .acard p{ margin:2px 0 0; font-size:.8rem; color:var(--muted); }
      /* ===== TodayCard + StroomRail (signature) ===== */
      .lds .tdcard{ padding:15px 16px; }
      .lds .trow{ display:flex; gap:14px; position:relative; }
      .lds .trows{ flex:1; min-width:0; }
      .lds .rail-wrap{ width:14px; flex:none; display:flex; justify-content:center; position:relative; }
      .lds .rail{ width:3px; border-radius:3px; background:var(--grad); position:absolute; top:14px; bottom:14px; }
      .lds .rail.live::after{ content:""; position:absolute; left:50%; transform:translateX(-50%); width:9px; height:9px; border-radius:50%; background:var(--t-accent2); box-shadow:0 0 10px var(--t-accent2); animation:ldsdrop 3.4s ease-in-out infinite; }
      @keyframes ldsdrop{ 0%{ top:0; opacity:0 } 12%{ opacity:1 } 82%{ opacity:1 } 100%{ top:calc(100% - 9px); opacity:0 } }
      .lds .titem{ display:flex; gap:12px; align-items:baseline; padding:10px 0; border-bottom:1px solid var(--line); }
      .lds .titem:last-child{ border-bottom:none; }
      /* Eén item naast de rail: regel en rail netjes gecentreerd. */
      .lds .trow:has(.titem:only-child) .rail{ top:10px; bottom:10px; }
      .lds .trows .titem:only-child{ padding:13px 0; }
      .lds .titem time{ font-size:.82rem; font-weight:800; color:var(--t-ink); font-variant-numeric:tabular-nums; flex:none; min-width:44px; }
      .lds .titem .tx{ flex:1; min-width:0; }
      .lds .titem h4{ margin:0; font-size:.94rem; font-weight:700; display:inline; letter-spacing:-.01em; }
      .lds .titem h4 a{ color:inherit; text-decoration:none; }
      .lds .titem p{ margin:2px 0 0; font-size:.8rem; color:var(--muted); }
      .lds .titem .tlink{ flex:none; font-size:.8rem; font-weight:600; color:var(--t-ink); text-decoration:none; }
      .lds .catdot{ display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:6px; vertical-align:baseline; flex:none; }
      /* ===== Maandgrid ===== */
      .lds .mgrid{ display:grid; grid-template-columns:repeat(7,1fr); gap:5px; }
      .lds .mhead{ text-align:center; font-size:.66rem; font-weight:800; letter-spacing:.6px; color:var(--muted); text-transform:uppercase; padding:2px 0; }
      .lds .mcell{ min-height:64px; border:1px solid var(--line); border-radius:13px; padding:5px 6px; text-decoration:none; color:var(--ink); background:var(--surface); display:block; overflow:hidden; }
      .lds .mcell:active{ transform:scale(.97); }
      .lds .mcell.dim{ opacity:.45; }
      .lds .mcell.today{ background:var(--tile); border-color:var(--t-ink); }
      .lds .mcell .d{ font-size:.7rem; font-weight:800; text-align:right; color:var(--muted); }
      .lds .mcell.today .d{ color:var(--t-ink); }
      .lds .mev{ font-size:.62rem; font-weight:600; color:#fff; border-radius:5px; padding:1px 5px; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .lds .mmore{ font-size:.6rem; color:var(--muted); }
      /* ===== Prikbord ===== */
      .lds .post .avatar{ background:var(--tile); color:var(--t-ink); font-weight:800; }
      .lds .post.so{ border:1.5px solid var(--t-ink); background:color-mix(in srgb, var(--t-accent) 6%, var(--surface)); }
      .lds .so-head{ display:flex; align-items:center; gap:7px; color:var(--t-ink); font-weight:700; margin-bottom:8px; font-size:.9rem; }
      .lds .so-head svg{ width:17px; height:17px; flex:none; }
      .lds .pollopt{ border-radius:14px; background:color-mix(in srgb, var(--t-accent) 4%, var(--surface)); }
      .lds .pollopt .pollbar{ background:var(--tile); }
      .lds .pollopt.on{ border-color:var(--t-ink); box-shadow:inset 0 0 0 1px var(--t-ink); }
      .lds .pollopt.on .pollpct{ color:var(--t-ink); }
      .lds .cmtform input[type=text]{ border-radius:999px; padding:11px 16px; }
      /* ===== Alarm-/BHV-kaart: semantisch vast rood-oranje (designsysteem §1), nooit tenant-kleur ===== */
      .lds .bhvcard{ display:flex; align-items:center; gap:13px; border-radius:22px; padding:15px 16px; color:#fff; background:linear-gradient(135deg,#FF7A4D,#F23B2F); box-shadow:0 10px 28px rgba(242,59,47,.30); text-decoration:none; margin:0 0 10px; }
      .lds .bhvcard:active{ transform:scale(.985); }
      .lds .bhvcard .btile{ width:42px; height:42px; border-radius:13px; background:rgba(255,255,255,.2); display:grid; place-items:center; flex:none; color:#fff; }
      .lds .bhvcard .btile svg{ width:22px; height:22px; }
      .lds .bhvcard .tx{ flex:1; min-width:0; }
      .lds .bhvcard h3{ margin:0; font-size:1rem; font-weight:800; letter-spacing:-.01em; }
      .lds .bhvcard p{ margin:2px 0 0; font-size:.8rem; opacity:.92; }
      /* ===== Lijstkaart: ul.clean strak in een Loods-kaart ===== */
      .lds .listcard{ padding:6px 16px; }
      .lds .listcard ul.clean{ margin:0; }
      /* ===== Lege staat & toolbar ===== */
      .lds .emptystate .es-ico{ background:var(--tile); color:var(--t-ink); border-radius:13px; }
      .lds .toolbar{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:10px; }
      .lds .toolbar strong{ margin-left:4px; font-size:.98rem; letter-spacing:-.01em; }
`;
