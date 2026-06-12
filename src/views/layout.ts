import { html, raw } from "hono/html";
import type { HtmlEscapedString } from "hono/utils/html";
import { BUILD } from "../pwa";
import { LOODS_CSS } from "./loods";
import { HOME_SHELL_CSS } from "./home2"; // v198: home-in-de-shell (gescoped .hm)

type Body = HtmlEscapedString | Promise<HtmlEscapedString>;

// Lijniconen (24x24, stroke 1.8) — v179: exact dezelfde vormen als de home-sprite
// (home2.ts), zodat zijbalk, ballon-menu, tabbar en alle schermen uniform zijn.
const ICONS: Record<string, string> = {
  home: `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
  agenda: `<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`,
  trophy: `<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>`,
  bracket: `<path d="M5 5h5v14H5M14 9h5M14 5v14"/>`,
  fries: `<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>`,
  wallet: `<rect x="3.5" y="6" width="17" height="13" rx="2"/><path d="M16 12.5h2.5"/><path d="M3.5 9h13a1.5 1.5 0 0 1 0 0"/>`,
  user: `<circle cx="12" cy="8" r="3.2"/><path d="M5.5 19c0-3.6 2.9-5.5 6.5-5.5S18.5 15.4 18.5 19"/>`,
  team: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
  board: `<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>`,
  news: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>`,
  cog: `<path d="M4 6h9M19 6h1M4 12h1M11 12h9M4 18h6M16 18h4"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="18" r="2"/>`,
  menu: `<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>`,
  plus: `<path d="M12 5v14M5 12h14"/>`,
  refresh: `<path d="M20 11a8 8 0 1 0-2.1 5.4"/><path d="M20 4v7h-7"/>`,
  close: `<path d="M6 6l12 12M18 6 6 18"/>`,
  alert: `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`,
  sos: `<path d="M12 3 4 6v6c0 4.5 3.4 7.6 8 9 4.6-1.4 8-4.5 8-9V6l-8-3Z"/><path d="M12 9v5M9.5 11.5h5"/>`,
  book: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`,
  bug: `<path d="M9 7.5v-1a3 3 0 0 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6Z"/><path d="M12 11v9M6 13H3M6 9.5 3.5 7M6 17l-2.5 2.5M18 13h3M18 9.5 20.5 7M18 17l2.5 2.5"/>`,
  search: `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
  bell: `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`,
  briefcase: `<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>`,
  // Tabbar-iconen: exact dezelfde vormen als de home-sprite (home2.ts) — uniform.
  tbhome: `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
  tbcal: `<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`,
  tbmsg: `<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>`,
  tbbell: `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`,
};

// `module`: koppelt een nav-item aan een aan/uit-zetbare platform-module. Items
// zonder `module` staan altijd in de nav (mits rol klopt).
interface NavItem { href: string; label: string; icon: string; roles?: string[]; module?: string }
interface ModBlock { module: string; title?: string; items: NavItem[] }

// Vaste items (niet herordenbaar): Home bovenaan, Mijn account + Beheer onderaan.
const HOME: NavItem = { href: "/", label: "Home", icon: "home" };
const ZOEK: NavItem = { href: "/zoek", label: "Zoeken", icon: "search" };
const ACCOUNT: NavItem = { href: "/mijn-account", label: "Mijn account", icon: "user" };
const NOTIF_ITEM: NavItem = { href: "/notificaties", label: "Notificaties", icon: "bell" };
const TRAININGEN_ITEM: NavItem = { href: "/trainingen", label: "Trainingen", icon: "book" };
const TEAM_ITEM: NavItem = { href: "/smoelenboek", label: "Team", icon: "team" };
const BUG_ITEM: NavItem = { href: "/bug", label: "Feedback", icon: "bug" };
// v186: ook zichtbaar voor rol Redacteur (HR) — de pad-bewuste gate beperkt wat ze er kunnen.
const BEHEER_ITEM: NavItem = { href: "/beheer", label: "Inhoud-beheer", icon: "cog", roles: ["beheerder", "redacteur"] };

// Herordenbare module-blokken. De volgorde komt uit de module-volgorde (Beheer →
// Modules); de zijbalk leidt 'm af uit de volgorde van de "mod:<id>"-tokens in roles.
const MOD_BLOCKS: ModBlock[] = [
  { module: "nieuws", items: [{ href: "/nieuws", label: "Nieuws", icon: "news" }] },
  { module: "documenten", items: [{ href: "/documenten", label: "Documenten", icon: "book" }] },
  { module: "agenda", items: [{ href: "/agenda", label: "Agenda", icon: "agenda" }] },
  { module: "prikbord", items: [{ href: "/social", label: "Prikbord", icon: "board" }] },
  { module: "competitie", title: "Fun", items: [
    { href: "/competitie", label: "Competitie", icon: "trophy" },
    { href: "/competitie/ranglijst", label: "Ranglijst", icon: "bracket" },
    { href: "/competitie/toernooien", label: "Toernooien", icon: "trophy" },
  ] },
  { module: "kantine", title: "Kantine", items: [
    { href: "/friet", label: "Bestellen", icon: "fries" },
    { href: "/friet/saldo", label: "Mijn saldo", icon: "wallet" },
    { href: "/friet/beheer", label: "Kantine-beheer", icon: "cog", roles: ["admin", "kantine", "beheerder"] },
  ] },
  { module: "meldingen", items: [{ href: "/meldingen", label: "Meldingen", icon: "alert" }] },
];

export function svg(icon: string) {
  return raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[icon] ?? ""}</svg>`);
}

function mayShowRole(item: NavItem, roles: string[]): boolean {
  return !item.roles || item.roles.some((r) => roles.includes(r));
}

function navLink(i: NavItem, active: string, module?: string, off = false) {
  const on = active === i.href;
  return html`<a href="${i.href}" class="navitem ${on ? "on" : ""}" aria-current="${on ? "page" : "false"}"${module ? raw(` data-mod="${module}"`) : ""}${off ? raw(' style="display:none"') : ""}>
    <span class="ni-ico">${svg(i.icon)}</span><span>${i.label}</span>
  </a>`;
}

// Groep met vaste titel (home-stijl v178: geen inklap-chevron meer — uniform met het home-menu).
function navGroup(title: string, items: (HtmlEscapedString | Promise<HtmlEscapedString>)[], off = false) {
  return html`<div class="navsec" data-navsec data-section="${title}" ${off ? raw('style="display:none"') : ""}>
    <div class="navtitle">${title}</div>
    <div class="navsec-items">${items}</div>
  </div>`;
}

// Zijbalk: Home vast bovenaan, daarna de module-blokken in ingestelde volgorde
// (titelloze blokken worden compact gegroepeerd), dan Mijn account en Beheer.
// Module-blokken worden altijd gerenderd (verborgen indien uit) zodat een uit cache
// geserveerde zijbalk client-side te corrigeren is via /api/modules.
function sidebar(active: string, roles: string[]) {
  type Frag = HtmlEscapedString | Promise<HtmlEscapedString>;
  const sections: Frag[] = [];
  let buf: Frag[] = [navLink(HOME, active), navLink(ZOEK, active)];
  const flush = () => { if (buf.length) { sections.push(html`<div class="navsec" data-navsec>${buf}</div>`); buf = []; } };

  // Config-gedreven uit het nav:-rol-token (zelfde bron als het beheerscherm, src/nav.ts).
  const navTok = roles.find((r) => r.indexOf("nav:") === 0);
  let payload: { g: [string, string][]; m: [string, string, number][] } | undefined;
  if (navTok) { try { payload = JSON.parse(navTok.slice(4)); } catch { payload = undefined; } }

  if (payload && Array.isArray(payload.g) && Array.isArray(payload.m)) {
    flush();
    for (const [gid, gnaam] of payload.g) {
      const mods = payload.m.filter((x) => x[1] === gid);
      const items: Frag[] = [];
      for (const entry of mods) {
        const key = entry[0]; const off = !entry[2];
        const headActive = headModuleForPath(active) === key;
        for (const it of moduleNavItems(key).filter((i) => mayShowRole(i, roles))) {
          items.push(navLink(it, headActive ? it.href : active, key, off));
        }
      }
      // Home-pariteit (v181): groep met alleen uit-staande modules krijgt ook een
      // verborgen titel (de /api/modules-sync zet de sectie weer aan zodra nodig).
      const groupOff = mods.length > 0 && mods.every((x) => !x[2]);
      if (items.length) sections.push(navGroup(gnaam, items, groupOff));
    }
    sections.push(navGroup("Account", [navLink(ACCOUNT, active), navLink(NOTIF_ITEM, active), navLink(BUG_ITEM, active)]));
    if (mayShowRole(BEHEER_ITEM, roles)) sections.push(navGroup("Beheer", [navLink(BEHEER_ITEM, active)]));
    // Versie-footer ín de nav (v181): scrolt mee als laatste regel, exact zoals het home-menu.
    return html`<aside class="side" id="side"><nav>${sections}<div class="side-build">Fresh Forward · ${BUILD}</div></nav></aside>`;
  }

  // Fallback (token afwezig): oorspronkelijke MOD_BLOCKS-logica.
  const order = roles.filter((r) => r.indexOf("mod:") === 0).map((r) => r.slice(4));
  const pos = (m: string) => { const k = order.indexOf(m); return k < 0 ? 999 : k; };
  const blocks = MOD_BLOCKS.slice().sort((a, b) => pos(a.module) - pos(b.module));
  for (const b of blocks) {
    const items = b.items.filter((i) => mayShowRole(i, roles));
    if (items.length === 0) continue;
    const off = !roles.includes("mod:" + b.module);
    if (b.title) { flush(); sections.push(navGroup(b.title, items.map((i) => navLink(i, active, b.module, off)), off)); }
    else { for (const i of items) buf.push(navLink(i, active, b.module, off)); }
  }
  flush();
  const persItems = [
    navLink(TRAININGEN_ITEM, active, "trainingen", !roles.includes("mod:trainingen")),
    navLink(TEAM_ITEM, active, "team", !roles.includes("mod:team")),
    navLink(NOTIF_ITEM, active),
    navLink(ACCOUNT, active),
    navLink(BUG_ITEM, active),
  ];
  sections.push(navGroup("Persoonlijk", persItems));
  if (mayShowRole(BEHEER_ITEM, roles)) sections.push(navGroup("Beheer", [navLink(BEHEER_ITEM, active)]));
  return html`<aside class="side" id="side"><nav>${sections}<div class="side-build">Fresh Forward · ${BUILD}</div></nav></aside>`;
}

// ---- Navigatiemodel: head-modules (zijbalk/drawer) + submodules (bottom-bar/sub-tabs) ----
// Submodules per head-module. Op mobiel verschijnen ze in de bottom-bar (duim-zone),
// op desktop als sub-tabs bovenin de content. Afgeleid van de bestaande routes.
const SUBMODULES: Record<string, NavItem[]> = {
  competitie: [
    { href: "/competitie", label: "Competitie", icon: "trophy" },
    { href: "/competitie/ranglijst", label: "Ranglijst", icon: "bracket" },
    { href: "/competitie/toernooien", label: "Toernooien", icon: "trophy" },
  ],
  kantine: [
    { href: "/friet", label: "Bestellen", icon: "fries" },
    { href: "/friet/saldo", label: "Saldo", icon: "wallet" },
    { href: "/friet/beheer", label: "Beheer", icon: "cog", roles: ["admin", "kantine", "beheerder"] },
  ],
  // CRM (ADR-001): alleen zichtbaar voor team Concepts + beheerders (rol-token "crm").
  crm: [
    { href: "/crm", label: "Klanten", icon: "briefcase", roles: ["crm"] },
    { href: "/crm/pipeline", label: "Pipeline", icon: "bracket", roles: ["crm"] },
    { href: "/crm/taken", label: "Taken", icon: "agenda", roles: ["crm"] },
  ],
};

// Primaire actie per head-module (de + rechts in de bottom-bar). Linkt naar de
// aanmaak-plek op de modulepagina (anker #ff-nieuw; valt zonder anker terug op de pagina-top).
const PRIMARY: Record<string, { href?: string; sheet?: string; label: string }> = {
  prikbord: { sheet: "ff-compose", label: "Nieuw bericht" },
  agenda: { sheet: "ff-agenda-new", label: "Nieuw event" },
  meldingen: { sheet: "ff-meld-new", label: "Nieuwe melding" },
  crm: { href: "/crm/moment/nieuw", label: "Nieuw contactmoment" },
};

// Pad -> head-module-id (voor het bepalen van de actieve module in de bottom-bar/sub-tabs).
const PATH_HEAD: [string, string][] = [
  ["/agenda", "agenda"], ["/social", "prikbord"], ["/competitie", "competitie"],
  ["/friet", "kantine"], ["/meldingen", "meldingen"], ["/noodmelding", "noodmelding"],
  ["/trainingen", "trainingen"], ["/smoelenboek", "team"], ["/crm", "crm"],
  ["/nieuws", "nieuws"], ["/documenten", "documenten"],
];
function headModuleForPath(active: string): string | undefined {
  for (const [prefix, id] of PATH_HEAD) {
    if (active === prefix || active.indexOf(prefix + "/") === 0) return id;
  }
  return undefined;
}

// Head-link per module zonder submodules (modules mét submodules tonen die submodules).
const HEAD_LINKS: Record<string, NavItem> = {
  crm: { href: "/crm", label: "CRM", icon: "briefcase", roles: ["crm"] },
  nieuws: { href: "/nieuws", label: "Nieuws", icon: "news" },
  documenten: { href: "/documenten", label: "Documenten", icon: "book" },
  competitie: { href: "/competitie", label: "Competitie", icon: "trophy" },
  kantine: { href: "/friet", label: "Kantine", icon: "fries" },
  agenda: { href: "/agenda", label: "Agenda", icon: "agenda" },
  prikbord: { href: "/social", label: "Prikbord", icon: "board" },
  meldingen: { href: "/meldingen", label: "Meldingen", icon: "alert" },
  noodmelding: { href: "/noodmelding", label: "Noodmelding", icon: "sos" },
  team: { href: "/smoelenboek", label: "Team", icon: "team" },
  trainingen: { href: "/trainingen", label: "Trainingen", icon: "book" },
};
function moduleNavItems(key: string): NavItem[] {
  return HEAD_LINKS[key] ? [HEAD_LINKS[key]] : (SUBMODULES[key] ? [SUBMODULES[key][0]] : []);
}

// Sub-tabs (desktop): submodules van de actieve module bovenin de content.
// Op mobiel staan deze in de bottom-bar (zie bottomBar), dus daar verborgen via CSS.
function subTabs(active: string, roles: string[]) {
  const head = headModuleForPath(active);
  const subs = head ? (SUBMODULES[head] ?? []).filter((i) => mayShowRole(i, roles)) : [];
  if (subs.length < 2) return html``;
  return html`<nav class="subtabs" aria-label="Subnavigatie">
    ${subs.map((i) => html`<a href="${i.href}" class="subtab ${active === i.href ? "on" : ""}" aria-current="${active === i.href ? "page" : "false"}">${i.label}</a>`)}
  </nav>`;
}

// Mobiele bottom-bar in de duim-zone: links de drawer-toggle (head-modules),
// midden de submodules van de actieve module, rechts de primaire actie.
// Bottom-nav (Set 4 #3): kern-bestemmingen vast in de duim-zone (Home + de eerste paar
// ingeschakelde modules) + "Meer" (opent de volledige drawer). Actieve is gemarkeerd.
function bottomNav(active: string, roles: string[]) {
  // v196 (reviewfeature 6): de capsule volgt de module-config — Home + de eerste
  // drie INGESCHAKELDE modules in beheer-volgorde (nav-token, zelfde bron als
  // zijbalk/ballon) + Meer. Client-side is cosmetisch; de bestaande URL-guard
  // en module-middleware blijven de server-side waarheid (uit = redirect/403).
  const head = headModuleForPath(active);
  const navTok = roles.find((r) => r.indexOf("nav:") === 0);
  let order: string[] = [];
  if (navTok) {
    try {
      const p = JSON.parse(navTok.slice(4)) as { m?: [string, string, number][] };
      order = (p.m ?? []).filter((x) => !!x[2]).map((x) => x[0]);
    } catch { /* val terug op mod:-tokens */ }
  }
  if (!order.length) order = roles.filter((r) => r.indexOf("mod:") === 0).map((r) => r.slice(4));
  // Vertrouwde tab-iconen voor de klassieke drie; overige modules = zijbalk-icoon.
  const TB_ICON: Record<string, string> = { agenda: "tbcal", prikbord: "tbmsg", meldingen: "tbbell" };
  type Dest = { href: string; label: string; icon: string; on: boolean };
  const dests: Dest[] = [{ href: "/", label: "Home", icon: "tbhome", on: active === "/" }];
  for (const key of order) {
    if (dests.length >= 4) break; // Home + 3 modules; Meer komt er vast achteraan
    const it = moduleNavItems(key).filter((i) => mayShowRole(i, roles))[0];
    if (!it) continue;
    dests.push({ href: it.href, label: it.label, icon: TB_ICON[key] ?? it.icon, on: head === key });
  }
  return html`<nav class="botnav" aria-label="Hoofdnavigatie">
    <div class="botnav-inner">
      <span class="botnav-blob" aria-hidden="true"></span>
      ${dests.map((d) => html`<a href="${d.href}" class="botnav-item ${d.on ? "on" : ""}" aria-current="${d.on ? "page" : "false"}" aria-label="${d.label}" data-tab="${d.href}"><span class="bn-ico">${svg(d.icon)}</span><span class="bn-lbl">${d.label}</span><span class="tbadge" hidden></span></a>`)}
      <label for="navtoggle" class="botnav-item botnav-more" role="button" tabindex="0" aria-label="Meer menu"><span class="bn-ico">${svg("menu")}</span><span class="bn-lbl">Meer</span></label>
    </div>
  </nav>`;
}

// Profiel-avatar in de header (duim-UI v175): initialen of teamfoto uit het
// "me:"-rol-token (gezet in de identiteits-middleware); fallback = user-icoon.
function headerAvatar(roles: string[]) {
  let me: { i?: string; f?: string } | undefined;
  const tok = roles.find((r) => r.indexOf("me:") === 0);
  if (tok) { try { me = JSON.parse(tok.slice(3)); } catch { me = undefined; } }
  const inner = me?.f
    ? html`<img src="${me.f}" alt="" width="36" height="36" loading="lazy" />`
    : me?.i
      ? html`${me.i}`
      : svg("user");
  return html`<a href="/mijn-account" class="hava" aria-label="Mijn profiel">${inner}</a>`;
}

// Zwevende primaire actie (FAB) voor de actieve module (opent de sheet of linkt).
function fab(active: string) {
  const head = headModuleForPath(active);
  const primary = head ? PRIMARY[head] : undefined;
  if (!primary) return html``;
  return primary.sheet
    ? html`<button type="button" class="fab" data-sheet="${primary.sheet}" aria-label="${primary.label}">${svg("plus")}</button>`
    : html`<a href="${primary.href}" class="fab" aria-label="${primary.label}">${svg("plus")}</a>`;
}

export function layout(title: string, active: string, body: Body, roles: string[] = []) {
  return html`<!DOCTYPE html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
    <title>${title} — Fresh Forward</title>
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#F4F7FB" />
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0A0E14" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Fresh Forward" />
    <link rel="apple-touch-icon" href="/icon-192.png?v=ff4" />
    <link rel="icon" href="/icon-192.png?v=ff4" />
    <style>
      :root{
        color-scheme: light dark;
        /* Neutralen = designsysteem (Mist), gelijk aan de home — ronde 4-gelijktrekking. */
        --bg:#F4F7FB; --bg-2:#E9EFF6; --surface:#ffffff; --surface-2:#EDF1F7; --ink:#0A0E14; --muted:#5E6B7A;
        --line:rgba(10,14,20,.07); --line-strong:rgba(10,14,20,.15);
        --green:#2a7d4c; --green-2:#379a5f; --green-3:#46ab6e; --green-deep:#236b41; --accent:#379a5f; --link:#2a7d4c;
        --berry:#c0566e; --berry-2:#d06a82; --berry-soft:#f8edf0;
        --gold:#cf9b34;
        --ok-bg:#e8f4ec; --ok-bd:#bbdfc6; --ok-tx:#21663d;
        --warn-bg:#fbf1de; --warn-bd:#ecd3a0; --warn-tx:#8a5b16;
        --btn:#2a7d4c; --btn-press:#236b41;
        --field:#ffffff; --field-bd:rgba(10,14,20,.17);
        --nav:rgba(255,255,255,.84);
        --radius:18px; --radius-sm:13px; --radius-lg:24px;
        /* v189 (overhaul, lit.: Material/Fluent): elke schaduw = scherpe key-laag (contact)
           + zachte ambient-laag (afstand), getint met de ink-kleur van de ondergrond. */
        --shadow:0 1px 2px rgba(10,14,20,.05), 0 6px 16px rgba(10,14,20,.06);
        --shadow-lg:0 2px 4px rgba(10,14,20,.06), 0 14px 32px rgba(10,14,20,.10);
        /* Overlay-laag (ballon/menu's): in light gelijk aan surface — diepte komt van elev-3;
           in dark één tree líchter (elevation = lichter oppervlak, niet zwaardere schaduw). */
        --surface-3:#ffffff;
        /* Capsule-tabbar (v189): adaptief — licht glas in light mode, donker glas in dark. */
        --cap-bg:rgba(255,255,255,.78); --cap-bd:rgba(10,14,20,.08); --cap-ink:rgba(10,14,20,.66);
        --cap-ink-on:#0A0E14; --cap-blob:rgba(10,14,20,.07); --cap-shadow:0 12px 36px rgba(10,14,20,.16);
        --cap-ring:rgba(255,255,255,.92);
        --side-w:236px; --head-h:48px; /* compacter: header-items net onder de statusbalk */
        /* ---- Designsysteem-tokens (UX-sets, Laag 0). Eén bron, overal hergebruikt. ---- */
        /* Motion (Set 1): micro-feedback / standaard / schermovergang + easing. */
        --dur-fast:140ms; --dur-base:240ms; --dur-screen:300ms;
        --ease-out:cubic-bezier(.2,.7,.3,1); --ease-in:cubic-bezier(.4,0,1,1); --ease-standard:cubic-bezier(.4,0,.2,1);
        /* v191 (HONK §9.1): aliassen op de bestaande motion-laag — zelfde waarden, HONK-namen. */
        --dur-press:var(--dur-fast); --dur-enter:420ms; --stagger:40ms; --ease-spring:var(--ease-out);
        /* Typografie-schaal (Set 3). */
        --fs-caption:clamp(.78rem, .76rem + .08vw, .82rem); --fs-sm:clamp(.86rem, .83rem + .12vw, .92rem); --fs-body:clamp(1rem, .96rem + .2vw, 1.06rem); --fs-h3:clamp(1.08rem, 1rem + .35vw, 1.18rem); --fs-h2:clamp(1.2rem, 1.05rem + .65vw, 1.4rem); --fs-h1:clamp(1.62rem, 1.35rem + 1.2vw, 2rem);
        --lh-tight:1.25; --lh-body:1.65;
        /* Witruimte-schaal. */
        --sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-5:24px; --sp-6:32px;
        /* Radius (xs nieuw, naast sm/base/lg). */
        --radius-xs:9px;
        /* Elevatie / z-lagen (Set 3): diepte als functioneel signaal. */
        --elev-1:var(--shadow); --elev-2:var(--shadow-lg);
        --elev-3:0 4px 10px rgba(10,14,20,.08), 0 28px 60px rgba(10,14,20,.16); /* v189: ink-getint i.p.v. groenzweem */
        --z-scrim:50; --z-nav:55; --z-drawer:60; --z-overlay:200; --z-toast:300;
        /* Zwevende capsule: zelfde afstand tot de onderrand als de home-tabbar (safe-area + 12px). */
        --pill-gap: max(12px, calc(env(safe-area-inset-bottom) + 12px));
        /* Menu-icoonkleur, gedeeld met home (licht: accent / donker: accent2). */
        --menu-ink:#236b41;
      }
      @media (prefers-color-scheme: dark){
        :root:not([data-theme]){
          --bg:#0A0E14; --bg-2:#0D141D; --surface:#121925; --surface-2:#1A2331; --ink:#F4F7FB; --muted:#9AA6B4;
          --line:rgba(244,247,251,.08); --line-strong:rgba(244,247,251,.16);
          /* v189: dark-accenten één stap ontzadigd (lit.: verzadigd 'gloeit' op donker). */
          --green:#66c28b; --green-2:#5bbb80; --green-3:#71ca94; --green-deep:#94d9ae; --accent:#66c28b; --link:#84d1a1;
          --berry:#e98aa0; --berry-2:#f09cb0; --berry-soft:rgba(192,86,110,.16);
          --gold:#e0bd6a;
          --ok-bg:rgba(46,150,88,.16); --ok-bd:rgba(110,200,150,.30); --ok-tx:#a3e0b6;
          --warn-bg:rgba(190,140,40,.16); --warn-bd:rgba(225,185,90,.28); --warn-tx:#eecd8c;
          --btn:#2f9d59; --btn-press:#37a962;
          --field:#1A2331; --field-bd:rgba(244,247,251,.16);
          --nav:rgba(10,14,20,.86);
          --menu-ink:#5fbe85; /* v189: ontzadigd accent als tekst/stroke in dark */
          /* v189: dark-schaduwen gehalveerd — diepte komt van de surface-ladder + randen. */
          --shadow:0 1px 2px rgba(0,0,0,.32), 0 6px 18px rgba(0,0,0,.28);
          --shadow-lg:0 2px 4px rgba(0,0,0,.36), 0 12px 28px rgba(0,0,0,.34);
          --elev-3:0 4px 10px rgba(0,0,0,.45), 0 24px 56px rgba(0,0,0,.50);
          --surface-3:#232F40;
          --cap-bg:rgba(13,18,26,.82); --cap-bd:rgba(255,255,255,.08); --cap-ink:rgba(255,255,255,.7);
          --cap-ink-on:#ffffff; --cap-blob:rgba(255,255,255,.14); --cap-shadow:0 12px 36px rgba(0,0,0,.4);
          --cap-ring:rgba(13,18,26,.9);
        }
      }
      :root[data-theme="dark"]{
          --bg:#0A0E14; --bg-2:#0D141D; --surface:#121925; --surface-2:#1A2331; --ink:#F4F7FB; --muted:#9AA6B4;
          --line:rgba(244,247,251,.08); --line-strong:rgba(244,247,251,.16);
          /* v189: dark-accenten één stap ontzadigd (lit.: verzadigd 'gloeit' op donker). */
          --green:#66c28b; --green-2:#5bbb80; --green-3:#71ca94; --green-deep:#94d9ae; --accent:#66c28b; --link:#84d1a1;
          --berry:#e98aa0; --berry-2:#f09cb0; --berry-soft:rgba(192,86,110,.16);
          --gold:#e0bd6a;
          --ok-bg:rgba(46,150,88,.16); --ok-bd:rgba(110,200,150,.30); --ok-tx:#a3e0b6;
          --warn-bg:rgba(190,140,40,.16); --warn-bd:rgba(225,185,90,.28); --warn-tx:#eecd8c;
          --btn:#2f9d59; --btn-press:#37a962;
          --field:#1A2331; --field-bd:rgba(244,247,251,.16);
          --nav:rgba(10,14,20,.86);
          --menu-ink:#5fbe85; /* v189: ontzadigd accent als tekst/stroke in dark */
          /* v189: dark-schaduwen gehalveerd — diepte komt van de surface-ladder + randen. */
          --shadow:0 1px 2px rgba(0,0,0,.32), 0 6px 18px rgba(0,0,0,.28);
          --shadow-lg:0 2px 4px rgba(0,0,0,.36), 0 12px 28px rgba(0,0,0,.34);
          --elev-3:0 4px 10px rgba(0,0,0,.45), 0 24px 56px rgba(0,0,0,.50);
          --surface-3:#232F40;
          --cap-bg:rgba(13,18,26,.82); --cap-bd:rgba(255,255,255,.08); --cap-ink:rgba(255,255,255,.7);
          --cap-ink-on:#ffffff; --cap-blob:rgba(255,255,255,.14); --cap-shadow:0 12px 36px rgba(0,0,0,.4);
          --cap-ring:rgba(13,18,26,.9);
        }
      /* v189: groen-ramp + muted in OKLCH — perceptueel gelijke stappen (L ±0.07, C vast).
         Alleen waar ondersteund; de hex-waarden hierboven blijven de fallback (iOS < 15.4).
         Neutrale vlakken blijven bewust hex: identiek aan de home-tokens (home is leidend). */
      @supports (color: oklch(0.5 0.1 150)){
        :root{
          --green:oklch(0.53 0.10 153); --green-2:oklch(0.60 0.10 153); --green-3:oklch(0.67 0.10 153);
          --green-deep:oklch(0.46 0.10 153); --accent:oklch(0.60 0.10 153); --link:oklch(0.53 0.10 153);
          --muted:oklch(0.52 0.02 250);
        }
        @media (prefers-color-scheme: dark){
          :root:not([data-theme]){
            --green:oklch(0.75 0.09 153); --green-2:oklch(0.72 0.09 153); --green-3:oklch(0.78 0.09 153);
            --green-deep:oklch(0.85 0.07 153); --accent:oklch(0.75 0.09 153); --link:oklch(0.80 0.08 153);
            --muted:oklch(0.72 0.02 250);
          }
        }
        :root[data-theme="dark"]{
          --green:oklch(0.75 0.09 153); --green-2:oklch(0.72 0.09 153); --green-3:oklch(0.78 0.09 153);
          --green-deep:oklch(0.85 0.07 153); --accent:oklch(0.75 0.09 153); --link:oklch(0.80 0.08 153);
          --muted:oklch(0.72 0.02 250);
        }
      }
      @media (prefers-reduced-motion: reduce){ *{ animation:none !important; transition:none !important; } }
      /* High-contrast / Windows-contrastmodus: zorg dat randen, focus en knoppen zichtbaar blijven. */
      @media (forced-colors: active){
        .btn, button, .card, .teamcard, .navitem, .botnav-item, .pill, .subtab, .emojibtn,
        input, textarea, select{ border:1px solid CanvasText; }
        .botnav-item.on, .navitem.on, .pill.on, .subtab.on{ outline:2px solid Highlight; outline-offset:-2px; }
        .ff-scrim, .ff-lightbox{ forced-color-adjust:none; }
      }
      *{ box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
      img{ -webkit-user-drag:none; }
      a, button, .botnav-item, .navitem, .subtab, .pill, .emojibtn{ touch-action:manipulation; }
      /* v191 (HONK C2): UI-chroom niet selecteerbaar/geen long-press-menu — content (posts,
         meldingen, besteldetails) blijft WEL selecteerbaar; inputs expliciet selecteerbaar. */
      header.app, .botnav, .fab, .pill, .subtab, .navitem, .skeleton{ -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; }
      input, textarea, [contenteditable]{ -webkit-user-select:text; user-select:text; }
      [hidden]{ display:none !important; }
      /* Lijst-item glijdt weg bij verwijderen (undo-snackbar), en weer terug bij ongedaan maken. */
      .ff-leaving{ opacity:0; transform:translateX(-26px); transition:opacity var(--dur-base) var(--ease-in), transform var(--dur-base) var(--ease-in); }
      html,body{ margin:0; }
      html, body{ min-height:100dvh; }
      html{ background:var(--bg); background-color:var(--bg); }
      /* DE fix (masteropdracht stap 1): in standalone met black-translucent schuift WebKit de
         view ~59px omhoog; 100%/100dvh/100svh groeien niet mee -> dode strook onderin (chin gap).
         Alleen 100vh overspant daar het volledige scherm. In standalone is er geen URL-balk,
         dus 100vh heeft er geen nadelen; de browser houdt 100dvh. */
      @media (display-mode: standalone){
        html, body{ min-height:100vh; }
      }
      body{ font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,system-ui,sans-serif;
        color:var(--ink); font-size:var(--fs-body); line-height:var(--lh-body);
        background:radial-gradient(1100px 360px at 100% -10%, var(--bg-2), transparent 70%), var(--bg);
        -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; }
      a{ color:var(--link); }

      /* ---- Header (masteropdracht stap 4, WebKit-proof) ----
         Blur permanent op het element zelf (geen ::before met opacity-animatie: dat rendert
         in WebKit alleen de tint). Alleen de tint animeert via background-color. In rust zit
         onder de header vlakke achtergrond/gradient, dus de permanente blur is daar onzichtbaar.
         Fixed vanaf top:0 -> het glas dekt ook de safe-area-top; er scrolt niets bovenlangs. */
      header.app{ position:fixed; top:0; left:0; right:0; z-index:40; height:calc(env(safe-area-inset-top) + var(--head-h));
        padding:env(safe-area-inset-top) max(16px, env(safe-area-inset-right)) 0 max(16px, env(safe-area-inset-left));
        display:flex; align-items:center; gap:12px; border:0; box-shadow:none; background:transparent;
        view-transition-name:ff-header; }
      /* Gradient-blur (progressive) — WebKit-proof: LOS fixed element direct onder <body>,
         nét onder de header gestapeld (z-index 39 vs 40). NIET in header.app nesten:
         de view-transition-name op de header maakt 'm backdrop-root voor z'n kinderen,
         waardoor elke geneste backdrop-filter een lege achtergrond sampelt (= onzichtbaar;
         empirisch bewezen in v149/v150). Ook geen mask of negatieve z-index (zelfde
         effect op iOS). Drie gestapelde blur-laagjes: vol bovenin, aflopend onderin ->
         content lost zacht op achter de statusbalk, zonder kleur-overlay of harde rand. */
      .hglass{ position:fixed; left:0; right:0; top:0; z-index:39; pointer-events:none;
        height:calc(env(safe-area-inset-top) + var(--head-h) + 30px); }
      /* Zes lagen die elk via een gradient-mask vloeiend uitfaden binnen hun eigen hoogte:
         geen laag heeft nog een harde rand -> continu verloop (WhatsApp-stijl variable
         blur). De gestaffelde hoogtes blijven als vangnet: zouden masks op een oudere
         iOS niet werken, dan val je terug op de getrapte versie i.p.v. niets. */
      .hglass i{ position:absolute; left:0; right:0; top:0; display:block; pointer-events:none;
        -webkit-mask-image:linear-gradient(to bottom, black 0%, black 28%, transparent 96%);
        mask-image:linear-gradient(to bottom, black 0%, black 28%, transparent 96%); }
      .hglass i:nth-child(1){ height:100%; -webkit-backdrop-filter:blur(1.5px); backdrop-filter:blur(1.5px); }
      .hglass i:nth-child(2){ height:89%; -webkit-backdrop-filter:blur(2px); backdrop-filter:blur(2px); }
      .hglass i:nth-child(3){ height:78%; -webkit-backdrop-filter:blur(3px); backdrop-filter:blur(3px); }
      .hglass i:nth-child(4){ height:67%; -webkit-backdrop-filter:blur(4.5px); backdrop-filter:blur(4.5px); }
      .hglass i:nth-child(5){ height:56%; -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px); }
      .hglass i:nth-child(6){ height:45%; -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); }
      /* Header-items boven de .hglass-blurlaag (die is positioned met z-index:0). */
      /* v185: merk-chip (logo) weg uit de header — home-pariteit; de pagetag in het
         midden + zoek/avatar rechts blijven. Zoek-chip in glas-stijl: */
      header.app .hsearch{ display:inline-flex; align-items:center; justify-content:center; color:var(--ink); margin-left:auto; position:relative; z-index:1;
        padding:6px 12px; border-radius:999px;
        background:var(--nav); background:color-mix(in srgb, var(--surface) 45%, transparent);
        border:1px solid color-mix(in srgb, var(--line) 55%, transparent);
        box-shadow:inset 0 1px 0 rgb(255 255 255 / .07); }
      header.app .hsearch svg{ width:22px; height:22px; }
      /* Sync-status (Stroom-plan 1.3): subtiel mini-icoon in de header zolang er
         onbevestigde mutaties openstaan (html.ff-syncing via ffMutate). Geen tekst.
         Onder prefers-reduced-motion staat animatie globaal uit -> statisch icoontje. */
      /* v200: AI-assistent-knop linksboven (sparkle) — opent de assistent-sheet. */
      header.app .hai{ display:inline-flex; align-items:center; justify-content:center; min-width:44px; min-height:44px;
        margin:0; padding:0; background:none; border:0; cursor:pointer; color:var(--green); position:relative; z-index:1; }
      header.app .hai svg{ width:22px; height:22px; }
      header.app .hai:active{ transform:scale(.92); }
      /* Assistent-sheet: schuift over elke pagina heen; gesprek blijft staan bij navigeren. */
      .ai-scrim{ position:fixed; inset:0; z-index:calc(var(--z-overlay) + 4); background:rgba(0,0,0,.38); opacity:0; pointer-events:none; transition:opacity var(--dur-fast) var(--ease-in); }
      .ai-scrim.show{ opacity:1; pointer-events:auto; }
      .ai-sheet{ position:fixed; left:12px; right:12px; bottom:calc(env(safe-area-inset-bottom) + 12px);
        margin:0 auto; max-width:560px; z-index:calc(var(--z-overlay) + 5); background:var(--card-hi, var(--surface));
        border:1px solid var(--line); border-radius:22px; box-shadow:var(--elev-3); overflow:hidden;
        transform:translateY(calc(100% + 24px)); transition:transform var(--dur-screen) var(--ease-out); }
      .ai-sheet.open{ transform:none; }
      .ai-head{ display:flex; align-items:center; gap:9px; padding:13px 16px 11px; border-bottom:1px solid var(--line); }
      .ai-head svg{ width:18px; height:18px; color:var(--green); flex:none; }
      .ai-head strong{ flex:1; font-size:.95rem; }
      .ai-x{ background:none; border:0; color:var(--muted); font-size:1rem; cursor:pointer; padding:6px 8px; margin:-6px -8px -6px 0; }
      .ai-body{ max-height:46vh; min-height:120px; overflow-y:auto; padding:14px 16px; display:flex; flex-direction:column; gap:10px; overscroll-behavior:contain; }
      .ai-hint{ color:var(--muted); font-size:.85rem; margin:0; }
      .ai-msg{ max-width:88%; border-radius:16px; padding:10px 13px; font-size:.92rem; line-height:1.5; overflow-wrap:anywhere; }
      .ai-msg.me{ align-self:flex-end; background:linear-gradient(135deg,#3fa468,#236b41); color:#fff; border-bottom-right-radius:6px; }
      .ai-msg.bot{ align-self:flex-start; background:var(--surface-2, var(--surface)); border:1px solid var(--line); border-bottom-left-radius:6px; }
      .ai-tag{ display:block; font-size:.68rem; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); margin-bottom:5px; }
      .ai-src{ display:flex; flex-wrap:wrap; gap:6px; margin-top:9px; }
      .ai-src a, .ai-src span{ font-size:.74rem; font-weight:600; color:var(--green); border:1px solid var(--line); border-radius:999px; padding:3px 10px; text-decoration:none; }
      .ai-dots{ display:inline-flex; gap:4px; align-items:center; }
      .ai-dots i{ width:6px; height:6px; border-radius:50%; background:var(--muted); animation:aidot 1s ease-in-out infinite; }
      .ai-dots i:nth-child(2){ animation-delay:.15s } .ai-dots i:nth-child(3){ animation-delay:.3s }
      @keyframes aidot{ 0%,100%{ opacity:.3; transform:translateY(0) } 50%{ opacity:1; transform:translateY(-3px) } }
      .ai-form{ display:flex; gap:8px; padding:10px 12px calc(10px + 2px); border-top:1px solid var(--line); }
      /* v201: font-size 16px — onder de 16px zoomt iOS de hele pagina in bij focus
         (PJ's "toetsenbordzoom op de AI-laag"); 16px voorkomt die auto-zoom. */
      .ai-form input{ flex:1; min-width:0; border:1px solid var(--line); background:var(--surface); color:var(--ink);
        border-radius:999px; padding:10px 16px; font:inherit; font-size:16px; }
      .ai-form input:focus-visible{ outline:2px solid var(--accent); outline-offset:1px; }
      .ai-send{ flex:none; width:42px; height:42px; border-radius:50%; border:0; cursor:pointer; color:#fff;
        background:linear-gradient(135deg,#3fa468,#236b41); display:grid; place-items:center; font-size:1.05rem; font-weight:700; }
      .ai-send:active{ transform:scale(.92); }
      header.app .hsync{ display:none; align-items:center; justify-content:center; color:var(--muted); flex:0 0 auto;
        position:absolute; z-index:1; right:54px; top:calc(env(safe-area-inset-top) + var(--head-h)/2); transform:translateY(-50%); }
      header.app .hsync svg{ width:16px; height:16px; animation:ptrspin .9s linear infinite; }
      html.ff-syncing header.app .hsync{ display:inline-flex; }
      /* Locatie-denominatie exact in het midden (logo links, zoeken rechts). */
      header.app .pagetag{ position:absolute; z-index:1; left:50%; top:calc(env(safe-area-inset-top) + var(--head-h)/2); transform:translate(-50%,-50%);
        color:var(--muted); font-size:.8rem; font-weight:650; letter-spacing:-.01em;
        padding:5px 11px; border:1px solid var(--line); border-radius:999px; background:var(--surface-2); white-space:nowrap; max-width:min(46vw,360px); overflow:hidden; text-overflow:ellipsis; }
      .burger{ display:none; width:38px; height:38px; border-radius:11px; align-items:center; justify-content:center; cursor:pointer; color:var(--ink); border:1px solid var(--line); background:var(--surface); }
      .burger svg{ width:20px; height:20px; }
      .burger:active{ transform:scale(.94); }

      /* ---- Shell: sidebar + main ---- */
      /* Header is fixed (uit de flow): de shell reserveert die ruimte zelf via padding-top. */
      .shell{ display:grid; grid-template-columns:var(--side-w) 1fr; align-items:start; max-width:1500px; margin:0 auto;
        padding-top:calc(env(safe-area-inset-top) + var(--head-h)); }
      /* v184: desktop-maatvoering exact de home-zijbalk (.hside/.hs-t/.hs-v):
         18px aside-padding, groeptitels .66rem met 14px toppadding (= groepsafstand,
         geen aparte navsec-marge meer) en footer 14px 12px 6px. */
      aside.side{ position:sticky; top:calc(env(safe-area-inset-top) + var(--head-h)); align-self:start;
        height:calc(100dvh - var(--head-h) - env(safe-area-inset-top)); overflow-y:auto;
        padding:18px 12px; border-right:1px solid var(--line);
        scrollbar-width:none; } /* scrollbalk verbergen (home-pariteit); scrollen blijft werken */
      aside.side::-webkit-scrollbar{ display:none; }
      .navsec{ margin-bottom:0; }
      .side-build{ margin-top:auto; padding:14px 12px 6px; font-size:.68rem; color:var(--muted); opacity:.75; letter-spacing:.02em; line-height:1.4; }
      .buildtag{ color:var(--muted); }
      .navtitle{ font-size:.66rem; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); font-weight:700; padding:14px 12px 6px; line-height:1.3; }
      /* v182: line-height strak (home-pariteit) — de body-lh van 1.65 maakte elke menurij ~7px hoger dan home. */
      a.navitem{ display:flex; align-items:center; gap:11px; padding:9px 12px; border-radius:12px; text-decoration:none; color:var(--ink);
        font-weight:620; font-size:.92rem; line-height:1.25; transition:background .14s, transform .12s; }
      /* v184: hover-tint = home (.hs-item:hover -> --tile, accent 10% — vast, niet theme-afhankelijk). */
      a.navitem:hover{ background:color-mix(in srgb, #236b41 10%, transparent); }
      a.navitem:active{ transform:scale(.97); }
      /* Actieve rij = gradient-pill, exact zoals het home-menu (v180) — vast, niet theme-afhankelijk. */
      a.navitem.on{ background:linear-gradient(135deg,#3fa468,#236b41); color:#fff; box-shadow:0 2px 8px rgba(35,107,65,.20); }
      a.navitem.has-dot::after{ content:""; width:8px; height:8px; border-radius:50%; background:var(--berry); margin-left:auto; flex:0 0 auto; }
      .ni-ico{ display:grid; place-items:center; width:24px; height:24px; flex:0 0 auto; }
      .ni-ico svg{ width:21px; height:21px; }
      /* Menu-iconen in accent (uniform met het home-menu, zelfde token); actieve rij blijft wit. */
      a.navitem:not(.on) .ni-ico{ color:var(--menu-ink, var(--green-deep)); }

      main{ min-width:0; padding:18px 28px 40px; max-width:none; }
      h1{ font-size:var(--fs-h1); line-height:var(--lh-tight); font-weight:780; margin:6px 0 18px; letter-spacing:-.025em; }
      h2{ font-size:var(--fs-h2); line-height:var(--lh-tight); font-weight:720; margin:30px 0 13px; letter-spacing:-.012em; display:flex; align-items:center; gap:9px; }
      h2::before{ content:""; width:4px; height:1.02em; border-radius:3px; background:linear-gradient(var(--green-3),var(--green)); flex:0 0 auto; }
      h3{ font-size:var(--fs-h3); line-height:var(--lh-tight); font-weight:700; margin:18px 0 10px; letter-spacing:-.008em; }
      /* Sprint B (Set 1 #110): tabulaire cijfers -> saldo/ELO/tellers/datums lijnen uit en
         'springen' niet bij doortellen. Koppen hebben al tracking (h1/h2/h3 hierboven). */
      body{ font-variant-numeric: tabular-nums; font-feature-settings:"tnum" 1; }
      .tnum{ font-variant-numeric: tabular-nums; }
      p{ line-height:var(--lh-body); }
      /* Set 3: leesbare tekstbreedte voor langere inhoud (editorial). */
      .post .body, .reactie .body, .richtext{ max-width:70ch; }

      /* ---- Mobile drawer ---- */
      .navtoggle{ position:absolute; opacity:0; pointer-events:none; }
      .scrim{ display:none; }
      @media (max-width:880px){
        .burger{ display:none; }
        .shell{ grid-template-columns:1fr; }
        /* Drawer als ballon vanuit de Meer-knop (rechtsonder): popt boven de pill uit,
           bijna dekkende achtergrond (blur is genest onbetrouwbaar op iOS en een
           doorschijnende kaart gaf zichtbare naden tussen kop en inhoud). */
        /* Ballon opent vanuit de Meer-tab (duim-UI v175): rechtsonder, boven de capsule.
           Maatvoering exact gelijk aan het home-menu (v180). */
        aside.side{ position:fixed; left:auto; top:auto; right:12px; bottom:calc(env(safe-area-inset-bottom) + 86px); z-index:61;
          width:min(74vw,272px); max-height:min(60vh,520px); display:flex; flex-direction:column; overflow:hidden;
          background:var(--surface-3, var(--surface)); /* v189: overlay-laag — in dark één tree lichter (elevation-ladder) */
          border:1px solid var(--line); border-radius:18px; box-shadow:var(--elev-3); padding:0;
          transform-origin:bottom right; transform:translateY(16px) scale(.68); opacity:0; pointer-events:none;
          transition:transform var(--dur-fast) var(--ease-in), opacity var(--dur-fast) var(--ease-in); }
        aside.side nav{ flex:1 1 auto; min-height:0; overflow-y:auto; padding:8px; }
        /* Home-stijl menu (v177/v179): geen kopbalk; sluiten via scrim/Escape — zoals op home. */
        /* v182/v183: rijhoogte en ritme exact het home-menu — metriek expliciet in px
           gepind (rij 20px, titel 14px, footer 16px), zodat font-'normal' nooit afwijkt. */
        aside.side a.navitem{ padding:11px 12px; font-size:.95rem; line-height:20px; border-radius:12px; font-weight:600; }
        aside.side .navtitle{ font-size:.64rem; font-weight:800; letter-spacing:1.2px; padding:10px 12px 4px; line-height:14px; }
        aside.side .ni-ico svg{ width:20px; height:20px; }
        /* Home/Zoeken-rijen niet in de mobiele ballon (zitten al in tabbar/header) — home-pariteit. */
        aside.side .navsec:not([data-section]){ display:none; }
        aside.side .navsec{ margin-bottom:0; }
        /* v181: 20px iconen + footer-maat exact zoals het home-menu (.wm-v). */
        aside.side .side-build{ padding:10px 12px 6px; line-height:16px; }
        .navtoggle:checked ~ .shell aside.side{ transform:none; opacity:1; pointer-events:auto;
          transition:transform var(--dur-base) cubic-bezier(.34,1.26,.64,1), opacity var(--dur-fast) var(--ease-out); }
        /* Inhoud zet zich gestaffeld neer bij openen, en sluit snel mee (asymmetrisch). */
        aside.side .navsec{ opacity:0; transform:translateY(7px); transition:opacity var(--dur-fast) var(--ease-in), transform var(--dur-fast) var(--ease-in); }
        .navtoggle:checked ~ .shell aside.side .navsec{ opacity:1; transform:none; transition:opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out); }
        .navtoggle:checked ~ .shell aside.side .navsec:nth-child(1){ transition-delay:.05s }
        .navtoggle:checked ~ .shell aside.side .navsec:nth-child(2){ transition-delay:.09s }
        .navtoggle:checked ~ .shell aside.side .navsec:nth-child(3){ transition-delay:.13s }
        .navtoggle:checked ~ .shell aside.side .navsec:nth-child(n+4){ transition-delay:.16s }
        /* Scrim óók over de pill (z 57 > 55): alle focus naar de ballon. */
        .navtoggle:checked ~ .shell .scrim{ display:block; position:fixed; inset:0; z-index:57; background:rgba(0,0,0,.38); }
        main{ padding:16px 16px 40px; max-width:none; }
      }
      /* Standalone (geïnstalleerde app): 100vh i.p.v. dvh/100% — zie masteropdracht stap 1. */
      @media (max-width:880px) and (display-mode: standalone){
        html, body{ height:100vh; }
      }

      /* ===== Componenten (gedeeld) ===== */
      .card{ background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); padding:17px 19px; margin:var(--sp-3) 0; box-shadow:0 1px 2px rgba(20,40,28,.04), 0 6px 16px rgba(20,40,28,.045); }
      article.card{ transition:transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast); }
      article.card:hover{ transform:translateY(-2px); box-shadow:var(--shadow-lg); }
      article.card h3{ margin:0 0 5px; font-size:1.06rem; font-weight:700; letter-spacing:-.01em; }
      .card.featured{ border-color:transparent; background:linear-gradient(180deg, var(--berry-soft), var(--surface) 58%); box-shadow:0 1px 2px rgba(20,40,28,.05), 0 14px 34px rgba(192,86,110,.12); }
      .meta,.muted{ color:var(--muted); font-size:.83rem; }
      .ok{ background:var(--ok-bg); border:1px solid var(--ok-bd); color:var(--ok-tx); padding:12px 15px; border-radius:var(--radius-sm); margin:11px 0; }
      .warn{ background:var(--warn-bg); border:1px solid var(--warn-bd); color:var(--warn-tx); padding:12px 15px; border-radius:var(--radius-sm); margin:11px 0; }
      ul.clean{ list-style:none; padding:0; margin:8px 0; }
      ul.clean li{ padding:12px 2px; border-bottom:1px solid var(--line); }
      ul.clean li:last-child{ border-bottom:0; }
      form.card label{ display:block; margin:12px 0; font-weight:640; font-size:.9rem; }
      input,select,textarea{ display:block; width:100%; max-width:100%; min-width:0; margin-top:6px; padding:12px 13px;
        border:1px solid var(--field-bd); border-radius:var(--radius-sm); font:inherit; font-weight:400; background:var(--field); color:var(--ink); transition:border-color .15s, box-shadow .15s; }
      input::placeholder,textarea::placeholder{ color:var(--muted); }
      input[type=date],input[type=datetime-local],input[type=search]{ -webkit-appearance:none; appearance:none; }
      input[type=checkbox],input[type=radio]{ width:18px; height:18px; min-width:18px; padding:0; margin:0; border:0; border-radius:4px; background:none; box-shadow:none; accent-color:var(--green-2); flex:0 0 auto; vertical-align:middle; }
      input:focus,select:focus,textarea:focus{ outline:none; border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb, var(--accent) 24%, transparent); }
      button,.btn{ display:inline-flex; align-items:center; justify-content:center; gap:8px; background:var(--btn); color:#fff; border:0; border-radius:var(--radius-sm); padding:12px 19px;
        font:inherit; font-weight:650; cursor:pointer; margin-top:6px; box-shadow:0 2px 8px rgba(35,107,65,.18); transition:transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast), filter var(--dur-fast); text-decoration:none; }
      button:hover,.btn:hover{ box-shadow:0 5px 16px rgba(35,107,65,.24); filter:brightness(1.04); }
      button:active,.btn:active{ transform:translateY(1px) scale(.96); }
      .btn-soft{ background:var(--surface-2); color:var(--ink); box-shadow:none; border:1px solid var(--line); }
      .btn-berry{ background:var(--berry); box-shadow:0 2px 8px rgba(192,86,110,.20); }
      .row2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
      .pills{ display:flex; gap:8px; margin:6px 0 14px; flex-wrap:wrap; }
      .pill{ flex:0 1 auto; text-align:center; padding:9px 16px; border-radius:999px; border:1px solid var(--line); background:var(--surface); color:var(--ink); text-decoration:none; font-weight:640; font-size:.9rem; transition:.15s; }
      .pill.on{ background:var(--green); color:#fff; border-color:transparent; box-shadow:0 2px 8px rgba(35,107,65,.20); }
      .pill:active{ transform:scale(.96); }
      table{ width:100%; border-collapse:collapse; font-size:.9rem; background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); overflow:hidden; box-shadow:var(--shadow); }
      th,td{ padding:11px 8px; text-align:center; border-bottom:1px solid var(--line); }
      th:nth-child(2),td:nth-child(2){ text-align:left; }
      th{ background:var(--surface-2); font-size:.72rem; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); font-weight:680; }
      tr:last-child td{ border-bottom:0; }
      td.pos{ color:var(--muted); width:26px; }
      td.pts{ font-weight:800; color:var(--green); }
      .hero.herolink{ display:block; text-decoration:none; cursor:pointer; transition:transform var(--dur-fast) var(--ease-out); }
      .hero.herolink:active{ transform:scale(.99); }
      .hero .herobadge{ position:absolute; top:16px; right:18px; min-width:30px; height:30px; padding:0 9px; border-radius:999px; background:rgba(255,255,255,.22); color:#fff; font-weight:800; display:inline-flex; align-items:center; justify-content:center; font-size:.95rem; }
      .hero{ position:relative; overflow:hidden; border-radius:var(--radius-lg); color:#fff; margin:2px 0 18px; padding:22px 22px 24px;
        background:radial-gradient(120% 130% at 92% -25%, rgba(255,255,255,.18), transparent 55%), linear-gradient(135deg,#236b41,#2f8b54 68%,#3fa468); box-shadow:0 14px 36px rgba(20,70,40,.22); }
      .hero .kicker{ font-size:.76rem; font-weight:680; letter-spacing:.05em; text-transform:uppercase; opacity:.85; }
      .hero h1{ color:#fff; font-size:1.62rem; margin:6px 0 5px; letter-spacing:-.03em; }
      .hero p{ margin:0; opacity:.92; font-size:.92rem; max-width:36ch; }
      /* v208: min-kolombreedte 10rem -> 13.5rem — op desktop kromp een tegel tot
         160px en braken titels mid-woord ("Pushmeldin g"); auto-fill houdt de
         tegelbreedte consistent (geen uitgerekte laatste rij). */
      .appgrid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 13.5rem), 1fr)); gap:12px; margin:4px 0 6px; }
      @media (max-width:430px){ .beheergrid{ grid-template-columns:1fr; } }
      .apptile{ display:flex; align-items:center; gap:13px; padding:15px 16px; border-radius:var(--radius); background:var(--surface); border:1px solid var(--line); box-shadow:var(--shadow); text-decoration:none; color:var(--ink); transition:transform .14s cubic-bezier(.2,.7,.3,1), box-shadow .16s; min-width:0; }
      .apptile:hover{ transform:translateY(-2px); box-shadow:var(--shadow-lg); }
      .apptile:active{ transform:translateY(0) scale(.97); }
      .apptile .ico{ width:40px; height:40px; border-radius:12px; flex:0 0 auto; display:grid; place-items:center; color:#fff; }
      .apptile .ico svg{ width:21px; height:21px; }
      .apptile .txt{ display:flex; flex-direction:column; gap:1px; min-width:0; }
      .apptile .appname{ font-weight:700; overflow-wrap:break-word; }
      .apptile .appdesc{ font-size:.78rem; color:var(--muted); overflow-wrap:break-word; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .beheergrid .apptile{ align-items:flex-start; }
      .beheergrid .apptile .ico{ margin-top:1px; }
      .beheergrid .apptile .txt{ gap:2px; }
      .ico-green{ background:linear-gradient(135deg,var(--green-3),var(--green)); }
      .ico-berry{ background:linear-gradient(135deg,var(--berry-2),var(--berry)); }
      .apptile.wide{ grid-column:1 / -1; color:#fff; border:0; background:radial-gradient(120% 180% at 92% -40%, rgba(255,255,255,.16), transparent 55%), linear-gradient(135deg,#236b41,#2f8b54 70%,#3fa468); }
      .apptile.wide .appdesc{ color:rgba(255,255,255,.9); }
      .apptile.wide .ico{ background:rgba(255,255,255,.2); box-shadow:inset 0 0 0 1px rgba(255,255,255,.28); }
      .bdaylist{ list-style:none; padding:0; margin:4px 0 0; display:flex; flex-direction:column; gap:2px; }
      .bdaylist li{ display:flex; align-items:center; gap:12px; padding:9px 2px; }
      .bdaylist .ava{ width:38px; height:38px; border-radius:50%; flex:0 0 auto; display:grid; place-items:center; font-weight:750; font-size:.82rem; color:#fff; background:linear-gradient(135deg,var(--berry-2),var(--berry)); }
      .bdaylist .who{ font-weight:650; }
      .badge{ display:inline-block; background:linear-gradient(135deg,var(--berry-2),var(--berry)); color:#fff; font-size:.7rem; font-weight:700; padding:2px 9px; border-radius:999px; margin-left:2px; vertical-align:middle; }
      .chip{ display:inline-block; font-size:.7rem; font-weight:680; padding:2px 9px; border-radius:999px; background:var(--surface-2); color:var(--green); }
      .doclist{ list-style:none; padding:0; margin:8px 0; }
      .doclist li{ display:flex; align-items:center; gap:11px; padding:11px 2px; border-bottom:1px solid var(--line); }
      .doclist li:last-child{ border-bottom:0; }
      .doclist .fico{ width:32px; height:32px; border-radius:9px; flex:0 0 auto; display:grid; place-items:center; background:var(--surface-2); color:var(--green); }
      .doclist .fico svg{ width:17px; height:17px; }
      .doclist .dname{ font-weight:620; }
      .empty{ text-align:center; color:var(--muted); padding:20px 12px; font-size:.9rem; }
      .post{ background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); padding:16px 18px; margin:13px 0; box-shadow:var(--shadow); }
      .post .head{ display:flex; align-items:center; gap:10px; margin-bottom:8px; }
      .avatar{ width:36px; height:36px; border-radius:50%; background:var(--surface-2); color:var(--green); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.78rem; flex:0 0 auto; }
      .post .who{ font-weight:650; font-size:.92rem; }
      .post .body{ white-space:pre-wrap; word-break:break-word; line-height:1.5; }
      .reactie{ border-top:1px solid var(--line); margin-top:10px; padding-top:10px; font-size:.9rem; }
      /* In een swipe-rij geen top-marge: anders piept de "Verwijderen"-achtergrond (berry) erboven door. */
      .reactie.swipe-fg{ margin-top:0; }
      .reactie .who{ font-weight:650; }
      .cmtform{ display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
      .cmtform select{ flex:1 1 100%; }
      .cmtform input[type=text]{ flex:1 1 auto; margin-top:0; }
      .cmtform button{ margin-top:0; }
      @media (max-width:880px){ .cmtform input[type=text]{ flex:1 1 100%; } .cmtform button{ flex:1 1 100%; } }
      .teamgrid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:6px 0 4px; }
      .teamcard{ background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); padding:14px 14px 12px; box-shadow:var(--shadow); text-align:center; transition:transform .14s, box-shadow .16s; }
      .teamcard:hover{ transform:translateY(-2px); box-shadow:var(--shadow-lg); }
      .teamfoto{ width:84px; height:84px; border-radius:50%; object-fit:cover; margin:2px auto 9px; display:block; background:var(--surface-2); transition:opacity .25s var(--ease-out); }
      .teamfoto.ff-fade{ opacity:0; } .teamfoto.ff-fade.loaded{ opacity:1; }
      @media (prefers-reduced-motion: reduce){ .teamfoto.ff-fade{ opacity:1; transition:none; } }
      #ffZoek{ position:sticky; top:0; z-index:3; }
      .teamava{ width:84px; height:84px; border-radius:50%; margin:2px auto 9px; display:flex; align-items:center; justify-content:center; font-weight:750; font-size:1.5rem; color:#fff; background:linear-gradient(135deg,var(--green-3),var(--green)); }
      .teamnaam{ font-weight:700; font-size:.95rem; letter-spacing:-.01em; }
      .teamfunctie{ font-size:.8rem; color:var(--green); font-weight:600; margin-top:1px; }
      .teammeta{ font-size:.76rem; color:var(--muted); margin-top:2px; }
      .teamlinks{ display:flex; gap:10px; justify-content:center; margin-top:9px; }
      .teamlinks a{ width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--green); background:var(--surface-2); }
      .teamlinks a:active{ transform:scale(.92); }
      footer{ color:var(--muted); font-size:.74rem; text-align:center; padding:16px 16px 24px; }
      /* Keyframes met alléén een from-blok (masteropdracht stap 2): geen to-blok dat via
         fill-mode een blijvende transform vasthoudt en wrappers tot containing block maakt. */
      @keyframes fadeUp{ from{ opacity:0; transform:translateY(10px); } }
      @keyframes ffArrive{ from{ opacity:0; transform:translateY(-10px); } }
      /* Tijdens een paginaovergang (navigatie) speelt alleen de view-transition; geen dubbele
         kaart-entrance -> voorkomt de "stotter" bij het openen van schermen (OPDRACHT 6). */
      html.vt-nav main .card{ animation:none; }
      /* Stille SWR-revalidate (v198): géén herhaalde entree-animaties bij de tweede,
         onzichtbare DOM-swap — dat was de "stotter" na elke navigatie. */
      main.ff-noanim > *, main.ff-noanim .card{ animation:none !important; }
      main > *{ animation:fadeUp var(--dur-screen) both; }
      main > *:nth-child(2){ animation-delay:.04s; }
      main > *:nth-child(3){ animation-delay:.08s; }
      main > *:nth-child(4){ animation-delay:.12s; }
      main > *:nth-child(5){ animation-delay:.16s; }
      main > *:nth-child(6){ animation-delay:.2s; }
      .toastwrap{ position:fixed; left:50%; transform:translateX(-50%); top:calc(env(safe-area-inset-top) + 12px); z-index:300; display:flex; flex-direction:column; gap:8px; width:min(92vw,420px); pointer-events:none; }
      .toast{ pointer-events:auto; background:var(--surface); color:var(--ink); border:1px solid var(--line); border-left:4px solid var(--green); border-radius:12px; padding:11px 14px; box-shadow:0 8px 28px rgba(0,0,0,.18); font-weight:600; font-size:.9rem; opacity:0; transform:translateY(-8px); transition:opacity var(--dur-fast) var(--ease-in), transform var(--dur-fast) var(--ease-in); cursor:pointer; }
      .toast.show{ opacity:1; transform:translateY(0); transition:opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out); }
      .toast.err{ border-left-color:var(--berry); }
      /* H4: ruimere touch-targets op touch-apparaten (werkvloer, duimen/handschoenen). */
      @media (pointer: coarse) {
        button, .btn, .btn-soft, .btn-berry, input[type="submit"] { min-height: 42px; }
        .navitem { min-height: 44px; }
        select, input[type="text"], input[type="search"], input[type="email"], input[type="url"], input[type="number"], input[type="date"], input[type="datetime-local"] { min-height: 42px; }
      }
      /* Pending mutaties (Stroom-plan 1.3): item gedimd + klein roterend sync-icoontje
         (refresh-stroke-icoon, currentColor, via mask). prefers-reduced-motion zet de
         rotatie globaal uit; het statische icoontje blijft dan staan. */
      .ff-pending{ opacity:.6; transition:opacity var(--dur-fast) var(--ease-out); }
      .ff-pending::after{ content:""; width:12px; height:12px; flex:0 0 auto; margin-left:6px; background:currentColor;
        -webkit-mask:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.1 5.4"/><path d="M20 4v7h-7"/></svg>') center/contain no-repeat;
        mask:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.1 5.4"/><path d="M20 4v7h-7"/></svg>') center/contain no-repeat;
        animation:ptrspin .8s linear infinite; }
      /* Install-hint (Stroom 2.1): subtiel dismissbaar bannertje boven de pill — geen popup. */
      .ff-install{ display:none; }
      @media (max-width:880px){
        .ff-install{ position:fixed; left:12px; right:12px; bottom:calc(var(--pill-gap) + 84px); z-index:54;
          display:flex; align-items:center; gap:10px; margin:0 auto; max-width:480px;
          background:var(--surface); border:1px solid var(--line); border-radius:var(--radius);
          box-shadow:var(--elev-2); padding:10px 12px; font-size:.86rem; }
        .ff-install .fi-txt{ flex:1 1 auto; }
        .ff-install .fi-btn{ flex:0 0 auto; margin:0; padding:8px 14px; font-size:.85rem; }
        .ff-install .fi-x{ flex:0 0 auto; background:none; border:0; box-shadow:none; color:var(--muted); font-size:18px; line-height:1; padding:4px 8px; margin:0; cursor:pointer; }
      }
      /* Offline-wachtrij (Stroom 2.2): indicator in de header zolang er acties wachten
         op verbinding — zelfde mini-icoon als sync, maar statisch en gedimd. */
      html.ff-queued header.app .hsync{ display:inline-flex; }
      html.ff-queued:not(.ff-syncing) header.app .hsync svg{ animation:none; opacity:.75; }
      .emojibar{ display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
      .emojibtn{ display:inline-flex; align-items:center; gap:5px; background:var(--surface-2); border:1px solid var(--line); border-radius:999px; padding:3px 10px; font-size:.92rem; line-height:1.4; cursor:pointer; color:var(--ink); transition:transform .08s ease, border-color .12s ease; }
      .emojibtn:active{ transform:scale(.93); }
      .emojibtn .n{ font-weight:700; font-size:.76rem; color:var(--muted); }
      .emojibtn.on{ border-color:var(--green); box-shadow:inset 0 0 0 1px var(--green); }
      .emojibtn.on .n{ color:var(--green); }
      .emojibtn[disabled]{ cursor:default; opacity:.75; }
      /* Mobiele bottom-bar (duim-zone): head-modules via de drawer, submodules + primaire actie hier. */
      .botnav, .fab{ display:none; }
      /* Profiel-avatar rechtsboven (duim-UI v175): initialen of teamfoto, linkt naar Mijn account. */
      /* v204: margin-left AUTO — sinds het vergrootglas weg is (v202) duwt niets de
         avatar meer naar rechts; deze latere regel won met 10px van de v202-fix. */
      header.app .hava{ display:inline-flex; align-items:center; justify-content:center; flex:none; position:relative; z-index:1;
        width:36px; height:36px; border-radius:50%; overflow:hidden; margin-left:auto; text-decoration:none;
        background:linear-gradient(135deg,#3fa468,#236b41); color:#fff; font-weight:800; font-size:.74rem; letter-spacing:.02em;
        border:1px solid color-mix(in srgb, var(--line) 55%, transparent); box-shadow:inset 0 1px 0 rgb(255 255 255 / .07); }
      header.app .hava img{ width:100%; height:100%; object-fit:cover; display:block; }
      header.app .hava svg{ width:18px; height:18px; stroke:#fff; }
      header.app .hava:active{ transform:scale(.94); }
      @media (max-width:880px){
        /* App-shell: body scrollt niet (voorkomt dat fixed chrome meebeweegt bij iOS-overscroll);
           alleen .shell scrollt, de bottom-nav staat vast onderaan de kolom. */
        /* Rotsvast fullscreen: body = exacte viewport-box, .shell scrollt edge-to-edge,
           header is een frosted overlay waar content onder de notch achterlangs scrollt.
           Hoogte-eenheden per masteropdracht stap 1: 100dvh in de browser; de
           display-mode:standalone-override verderop zet dit naar 100vh (WebKit-bug). */
        html, body{ height:100dvh; }
        body{ position:fixed; inset:0; height:100dvh; overflow:hidden; background-color:var(--bg); }
        /* Rotsvaste achtergrond: schildert heel het scherm incl. safe-areas met --bg,
           ongeacht hoe iOS de fixed body-box berekent. Lost de zwarte home-indicator-strook op. */
        body::after{ content:""; position:fixed; left:0; right:0; top:-80px; bottom:-80px;
          background:var(--bg); z-index:-1; pointer-events:none; }
        .shell{ position:absolute; inset:0; overflow-y:auto;
          padding-top:calc(env(safe-area-inset-top) + var(--head-h)); }
        footer{ display:none; }
        /* Zwevende pill-tabbar (v139, premium shell): los van de onderrand (~12px boven de
           home-indicator), verlichte glasrand via inset-highlight i.p.v. dikkere border,
           krimpt bij omlaag scrollen (.mini) en komt terug bij omhoog. Fullwidth fixed
           container blijft het betrouwbare iOS-anker; de pill centreert zichzelf. */
        .botnav{ position:fixed; left:0; right:0; bottom:0; z-index:var(--z-nav); display:flex; justify-content:center;
          padding:0 12px var(--pill-gap); pointer-events:none; }
        /* Capsule-tabbar — v189: adaptief glas via --cap-tokens (licht glas in light,
           donker glas in dark; was §3.13 "altijd donker"). */
        .botnav-inner{ position:relative; display:flex; align-items:stretch; justify-content:center; gap:0; isolation:isolate;
          width:100%; max-width:440px; padding:7px; pointer-events:auto;
          background:var(--cap-bg);
          -webkit-backdrop-filter:saturate(150%) blur(22px); backdrop-filter:saturate(150%) blur(22px);
          border:1px solid var(--cap-bd); border-radius:40px;
          box-shadow:var(--cap-shadow);
          transform-origin:50% 100%; transform:translateZ(0); view-transition-name:ff-botnav;
          transition:transform .35s cubic-bezier(.2,.7,.3,1); }
        .botnav-inner.mini{ transform:translateY(6px) scale(.9); }
        /* Glijdende blob achter de actieve tab (wit-alpha; verbergbaar via --blob-o). */
        .botnav-blob{ position:absolute; top:7px; left:0; height:var(--blob-h,46px); width:var(--blob-w,56px);
          transform:translateX(var(--blob-x,0)); border-radius:28px; z-index:0; pointer-events:none; will-change:transform;
          background:var(--cap-blob); transition:none; opacity:var(--blob-o,1); }
        /* Animatie pas ná de eerste plaatsing aan (voorkomt slide-in bij elke paginalaad). */
        .botnav.anim .botnav-blob{ transition:transform .4s cubic-bezier(.22,.72,.24,1), width .4s cubic-bezier(.22,.72,.24,1), opacity .2s; }
        /* Dynamic Type (masteropdracht stap 5): chrome schaalt niet mee; tabs krimpen
           (flex 1 1 0 + min-width:0) en vallen zo nodig terug op alleen iconen (.compact). */
        header.app, .botnav{ -webkit-text-size-adjust:100%; text-size-adjust:100%; }
        .botnav-item{ position:relative; z-index:1; flex:1 1 0; min-width:46px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px;
          min-height:44px; padding:8px 0 7px; border-radius:28px; color:var(--cap-ink); text-decoration:none; cursor:pointer;
          background:none; border:0; margin:0; box-shadow:none; font:inherit; transition:color .25s, transform .12s; }
        .botnav-inner.compact .bn-lbl{ display:none; }
        .botnav-inner.compact .botnav-item{ min-width:44px; }
        .botnav-item .bn-ico{ display:inline-flex; }
        .botnav-item .bn-ico svg{ width:25px; height:25px; transition:transform .16s, color .25s; color:var(--cap-ink); }
        .botnav-item .bn-lbl{ font-size:10px; font-weight:600; letter-spacing:.01em; color:var(--cap-ink); transition:color .25s; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .botnav-item.on{ color:var(--cap-ink-on); }
        .botnav-item.on .bn-lbl{ color:var(--cap-ink-on); }
        .botnav-item.on .bn-ico svg{ color:var(--cap-ink-on); transform:translateY(-1px) scale(1.04); }
        .botnav-item:active{ transform:scale(.94); }
        @media (prefers-reduced-motion: reduce){ .botnav.anim .botnav-blob{ transition:none; } }
        /* Unread-dot op de Meer-tab (donkere capsule-variant). */
        .botnav-more .bn-ico{ position:relative; }
        .botnav-more.has-dot .bn-ico::after{ content:""; position:absolute; top:-2px; right:-4px; width:8px; height:8px;
          border-radius:50%; background:var(--berry); box-shadow:0 0 0 2px var(--cap-ring); }
        /* Badge-teller op tabs (pariteit met home): gradient-bolletje met capsule-rand. */
        .botnav-item .tbadge{ position:absolute; top:4px; left:calc(50% + 6px); min-width:17px; height:17px; border-radius:9px;
          background:linear-gradient(135deg,#3fa468,#236b41); color:#fff; font-size:10px; font-weight:800;
          display:grid; place-items:center; padding:0 4px; border:2px solid var(--cap-ring); }
        .fab{ display:inline-flex; align-items:center; justify-content:center; position:fixed; right:16px; z-index:calc(var(--z-nav) + 1); view-transition-name:ff-fab;
          bottom:calc(var(--pill-gap) + 84px); width:54px; height:54px; border-radius:50%; border:0; padding:0; margin:0;
          background:var(--btn); color:#fff; box-shadow:var(--elev-3); cursor:pointer; }
        .fab svg{ width:26px; height:26px; }
        .fab:active{ transform:scale(.93); }
        /* Menu open -> FAB weg (v178): de + knop kan dan nooit vóór de ballon vallen. */
        .navtoggle:checked ~ .fab{ visibility:hidden; }
        /* v195 (review #5b/c): clearance voor tabbar + FAB — content nooit half verstopt. */
        main{ padding-bottom:calc(var(--pill-gap) + 148px); }
      }
      /* ---- Motion-laag (Set 1): beweging als feedback/oriëntatie, token-gedreven. ---- */
      @view-transition { navigation: auto; }
      /* Paginaovergang (premium shell): alleen de content animeert (zachte fade + 4-6px
         verticaal); header en pill blijven stilstaan -> native gevoel. */
      main{ view-transition-name:page; }
      ::view-transition-old(root), ::view-transition-new(root){ animation:none; }
      /* v195 (review 12/6 #3): sequentieel i.p.v. crossfade — oud is vrijwel weg
         vóór nieuw verschijnt -> geen tekst-op-tekst/dubbele belichting. */
      ::view-transition-group(page){ animation:none; }
      ::view-transition-old(page){ animation:vt-out .11s ease-out both; }
      ::view-transition-new(page){ animation:vt-in .16s ease-out .09s both; }
      @keyframes vt-out{ to{ opacity:0; } }
      @keyframes vt-in{ from{ opacity:0; transform:translateY(8px); } }
      ::view-transition-group(ff-header), ::view-transition-group(ff-botnav){ animation:none; }
      /* v197: NIEUWE header/capsule direct tonen, oude verbergen. Met alleen
         animation:none bleef de OUDE snapshot op opacity 1 staan zolang de
         transitie liep — binnen de shell onzichtbaar (headers identiek), maar
         home<->module "hing" de oude header zichtbaar over de nieuwe pagina
         (video 14:22). */
      ::view-transition-old(ff-header), ::view-transition-old(ff-botnav){ animation:none; opacity:0; mix-blend-mode:normal; }
      ::view-transition-new(ff-header), ::view-transition-new(ff-botnav){ animation:none; opacity:1; mix-blend-mode:normal; }
      /* v195 (review #2): FAB geïsoleerd met eigen naam — kan nooit met een ander
         element (avatar) gepaard worden; fadet sequentieel mee met de page. */
      ::view-transition-group(ff-fab){ animation:none; }
      ::view-transition-old(ff-fab){ animation:vt-out .11s ease-out both; }
      ::view-transition-new(ff-fab){ animation:vt-in .16s ease-out .09s both; }
      @keyframes ffShimmer{ from{ background-position:200% 0 } to{ background-position:-200% 0 } }
      @keyframes emojiPop{ 0%{ transform:scale(1) } 40%{ transform:scale(1.32) } 100%{ transform:scale(1) } }
      .skeleton{ background:linear-gradient(90deg,var(--surface-2),var(--surface),var(--surface-2)); background-size:200% 100%;
        animation:ffShimmer 1.1s linear infinite; border-radius:var(--radius-sm); }
      .emojibtn.pop{ animation:emojiPop var(--dur-base) var(--ease-out); }
      @keyframes countTick{ 0%{ transform:translateY(-5px); opacity:.35; } 100%{ transform:none; opacity:1; } }
      .emojibtn .n.tick{ display:inline-block; animation:countTick var(--dur-fast) var(--ease-out); }
      @media (prefers-reduced-motion: no-preference){
        /* Gelaagde entrance: content "valt netjes op zijn plek" (fade + slide-up, gestaggerd). */
        main .card{ animation:fadeUp var(--dur-base) var(--ease-out) both; }
        main .card:nth-child(2){ animation-delay:40ms } main .card:nth-child(3){ animation-delay:80ms }
        main .card:nth-child(4){ animation-delay:120ms } main .card:nth-child(5){ animation-delay:160ms }
        main .card:nth-child(n+6){ animation-delay:200ms }
      }
      @media (prefers-reduced-motion: reduce){
        ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*){ animation:none !important; }
      }
      /* ---- Bottom-sheet (Set 1/2): primaire actie schuift omhoog vanuit de duim-zone. ---- */
      .ff-scrim{ position:fixed; inset:0; z-index:var(--z-overlay); background:rgba(0,0,0,.42); opacity:0;
        transition:opacity var(--dur-fast) var(--ease-in); }
      .ff-scrim.show{ opacity:1; transition:opacity var(--dur-base) var(--ease-out); }
      /* Foto-lightbox (Set: media): tik op een content-afbeelding -> full-screen + pinch-zoom. */
      .zoomable{ cursor:zoom-in; }
      .ff-lightbox{ position:fixed; inset:0; z-index:calc(var(--z-overlay) + 5); background:rgba(0,0,0,.93);
        display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity var(--dur-fast) var(--ease-in); touch-action:none; }
      .ff-lightbox.show{ opacity:1; transition:opacity var(--dur-base) var(--ease-out); }
      .ff-lightbox img{ max-width:100%; max-height:100%; object-fit:contain; touch-action:none; will-change:transform;
        transform-origin:center center; transition:transform var(--dur-base) var(--ease-out), opacity var(--dur-fast); user-select:none; -webkit-user-drag:none; border-radius:6px; }
      .ff-lightbox img.dragging{ transition:none; }
      .ff-lightbox .lb-close{ position:fixed; top:calc(env(safe-area-inset-top) + 12px); right:16px; width:42px; height:42px;
        border-radius:50%; background:rgba(255,255,255,.16); color:#fff; display:flex; align-items:center; justify-content:center;
        font-size:20px; line-height:1; cursor:pointer; border:0; -webkit-tap-highlight-color:transparent; }
      /* Undo-snackbar: directe actie + "Ongedaan maken" i.p.v. een bevestigingspopup. */
      .ff-snackbar{ position:fixed; left:50%; bottom:calc(var(--pill-gap) + 84px); z-index:var(--z-toast); transform:translate(-50%, 12px);
        z-index:calc(var(--z-overlay) + 3); display:flex; align-items:center; gap:10px; width:max-content; max-width:92vw;
        padding:11px 12px 11px 18px; border-radius:14px; background:var(--surface); color:var(--ink); border:1px solid var(--line); box-shadow:var(--elev-3);
        opacity:0; transition:opacity var(--dur-fast) var(--ease-in), transform var(--dur-fast) var(--ease-in); }
      .ff-snackbar.show{ opacity:1; transform:translate(-50%, 0); transition:opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out); }
      .ff-snackbar .sb-msg{ flex:0 1 auto; font-weight:600; font-size:.92rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .ff-snackbar .sb-undo{ flex:0 0 auto; background:none; border:0; color:var(--green); font-weight:750; font-size:.92rem;
        padding:6px 10px; margin:0; cursor:pointer; box-shadow:none; -webkit-tap-highlight-color:transparent; }
      .sheet-handle{ display:none; }
      @media (max-width:880px){
        /* Premium bottom-sheet: een PARTIËLE kaart die van onderaf opschuift (GEEN volledig
           scherm). Eigen scroll + toetsenbord-bewuste bottom (--ff-kb) houdt het actieve veld
           boven het toetsenbord. Sluiten via de sleep-handle (tik/veeg-omlaag) of tik naast de
           sheet. De sheet wordt bij openen naar <body> geportald (buiten de scrollende .shell),
           anders gedraagt position:fixed zich op iOS fout (niet-interactief / sluit bij tik). */
        .sheet-m{ position:fixed; left:0; right:0; bottom:var(--ff-kb, 0px); z-index:calc(var(--z-overlay) + 1); margin:0;
          max-height:min(88dvh, calc(var(--ff-vh, 100dvh) - 12px));
          overflow-y:auto; border-radius:22px 22px 0 0; box-shadow:var(--elev-3); background:var(--surface);
          transform:translateY(100%); transition:transform var(--dur-fast) var(--ease-in); animation:none !important;
          padding:8px 18px calc(env(safe-area-inset-bottom) + 24px); }
        .sheet-m.open{ transform:none; transition:transform var(--dur-screen) var(--ease-out); }
        /* Vangnet (v172): een GESLOTEN sheet mag nooit zichtbaar zijn of touches vangen,
           ook niet als een ancestor tijdelijk containing block wordt (zie loods.ts).
           visibility flipt pas ná de slide-out (delay = dur-fast). */
        .sheet-m:not(.open){ visibility:hidden; pointer-events:none;
          transition:transform var(--dur-fast) var(--ease-in), visibility 0s linear var(--dur-fast); }
        .sheet-m button[type="submit"]{ width:100%; margin-top:16px; }
        /* iOS zoomt in op velden met font-size < 16px; forceer 16px in de sheet. */
        .sheet-m input, .sheet-m textarea, .sheet-m select{ font-size:16px; }
        .sheet-m .sheet-handle{ display:block; width:44px; height:5px; border-radius:999px; background:var(--line-strong);
          margin:0 auto 14px; cursor:pointer; }
        body.sheet-open .fab, body.sheet-open .botnav{ display:none; }
      }
      /* Sub-tabs (desktop): subnavigatie van de actieve module bovenin de content. */
      .subtabs{ display:flex; gap:8px; flex-wrap:wrap; margin:0 0 16px; padding-bottom:12px; border-bottom:1px solid var(--line); }
      .subtab{ padding:8px 15px; border-radius:999px; border:1px solid var(--line); background:var(--surface); color:var(--muted);
        text-decoration:none; font-weight:640; font-size:.9rem; transition:color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out), border-color var(--dur-fast); }
      .subtab:hover{ color:var(--ink); }
      .subtab.on{ color:#fff; background:var(--green); border-color:var(--green); }
      .subtab:active{ transform:scale(.96); }
      @media (max-width:880px){ .subtabs{ flex-wrap:nowrap; overflow-x:auto; margin:0 -2px 14px; padding-bottom:10px; }
        .subtabs::-webkit-scrollbar{ display:none; } }
      /* Pull-to-refresh (Set 2): omlaagtrekken bovenaan om te verversen (mobiel). */
      .ptr{ position:fixed; top:0; left:50%; z-index:var(--z-overlay); width:38px; height:38px; border-radius:50%;
        background:var(--surface); box-shadow:var(--elev-2); color:var(--green); align-items:center; justify-content:center;
        display:none; transform:translate(-50%,-52px); }
      .ptr.active{ display:flex; }
      .ptr svg{ width:20px; height:20px; }
      .ptr.spin svg{ animation:ptrspin .7s linear infinite; }
      @keyframes ptrspin{ to{ transform:rotate(360deg); } }
      /* Knop-laadstaat: spinner + dubbel-submit-guard op navigerende formulieren. */
      button.is-loading, .btn.is-loading{ pointer-events:none; position:relative; padding-right:34px; }
      button.is-loading::after, .btn.is-loading::after{ content:""; position:absolute; right:13px; top:50%; width:15px; height:15px;
        margin-top:-8px; border-radius:50%; border:2px solid rgba(255,255,255,.5); border-top-color:#fff; animation:ptrspin .7s linear infinite; }
      .ptr{ transition:transform var(--dur-base) var(--ease-out), opacity var(--dur-fast) var(--ease-out); }
      .ptr.dragging{ transition:none; }
      html, body{ overscroll-behavior-y:none; }
      /* Swipe-acties op lijstitems (Set 2 #113): veeg naar links = actie; knop blijft zichtbaar alternatief. */
      .swipe{ position:relative; overflow:hidden; }
      .swipe-bg{ position:absolute; inset:0; display:flex; align-items:center; justify-content:flex-end; gap:8px;
        padding:0 20px; margin:0; border:0; border-radius:0; background:var(--berry); color:#fff; font:inherit; font-weight:680;
        cursor:pointer; box-shadow:none; }
      .swipe-fg{ position:relative; background:var(--surface); transition:transform var(--dur-base) var(--ease-out); will-change:transform; }
      .swipe-fg.dragging{ transition:none; }
      /* ---- Scherm-templates (Set 4): vaste anatomie per schermtype. ---- */
      .page-head{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
      .page-head h1{ margin:6px 0 0; flex:1 1 auto; }
      .page-actions{ margin-left:auto; display:flex; gap:8px; align-items:center; }
      .page-intro{ color:var(--muted); margin:8px 0 18px; max-width:70ch; }
      .detail-back{ display:inline-flex; align-items:center; gap:4px; color:var(--muted); text-decoration:none; font-weight:640; font-size:var(--fs-sm); margin:2px 0 4px; }
      .detail-back:hover{ color:var(--ink); }
      .detail-back svg{ width:18px; height:18px; }
      .emptystate{ text-align:center; padding:34px 20px; }
      .emptystate .es-ico{ display:inline-grid; place-items:center; width:52px; height:52px; border-radius:16px; background:var(--surface-2); color:var(--green); margin-bottom:12px; }
      .emptystate .es-ico svg{ width:26px; height:26px; }
      .emptystate .es-title{ font-weight:680; margin:0 0 4px; }
      .emptystate .es-text{ color:var(--muted); font-size:var(--fs-sm); margin:0 auto 14px; max-width:42ch; }
      .skeletonlist{ margin:6px 0; }
      /* Layout-utilities (consolidatie-ronde): vervangen de meest herhaalde inline flex-combo's. */
      .row{ display:flex; align-items:center; }
      .row-top{ display:flex; align-items:flex-start; }
      .wrap{ flex-wrap:wrap; }
      .between{ justify-content:space-between; }
      .grow{ flex:1 1 auto; min-width:0; }
      /* Inline vertaling ("Vertaal dit"). */
      .ff-tr-btn{ display:inline-block; background:none; border:0; color:var(--link); font:inherit; font-size:var(--fs-sm); font-weight:640; cursor:pointer; padding:6px 0; margin:2px 0 0; }
      .ff-tr-btn:hover{ text-decoration:underline; }
      :root.ff-tr-off .ff-tr-btn{ display:none !important; }
      .row > .emojibar{ margin-top:0; }
      /* Polls / peilingen op het prikbord. */
      .poll .pollq{ margin-top:4px; }
      .polloptions{ display:flex; flex-direction:column; gap:var(--sp-2); margin-top:var(--sp-2); }
      .pollopt{ position:relative; display:flex; align-items:center; gap:var(--sp-2); width:100%; text-align:left; border:1px solid var(--line); background:var(--surface-2); border-radius:var(--radius-sm); padding:10px 12px; font:inherit; color:var(--ink); cursor:pointer; overflow:hidden; }
      .pollopt.static{ cursor:default; }
      button.pollopt:active{ transform:scale(.99); }
      .pollopt .pollbar{ position:absolute; left:0; top:0; bottom:0; width:0; background:rgba(46,150,88,.18); transition:width var(--dur-base) var(--ease-out); z-index:0; }
      .pollopt .polllabel{ position:relative; z-index:1; flex:1 1 auto; font-weight:600; }
      .pollopt .pollpct{ position:relative; z-index:1; color:var(--muted); font-size:.8rem; font-weight:640; white-space:nowrap; }
      .pollopt.on{ border-color:var(--green); box-shadow:inset 0 0 0 1px var(--green); }
      .pollopt.on .pollpct{ color:var(--green); }
      .ff-tr-btn[disabled]{ opacity:.6; cursor:default; text-decoration:none; }
      .ff-tr-langs{ display:flex; flex-wrap:wrap; gap:var(--sp-2); margin:var(--sp-2) 0 0; }
      .ff-tr-langs button{ background:var(--surface-2); border:1px solid var(--line); border-radius:999px; padding:4px 12px; font:inherit; font-size:var(--fs-sm); color:var(--ink); cursor:pointer; }
      .ff-tr-langs button:hover{ border-color:var(--accent); }
      /* Toegankelijkheid (Set 3 #129): duidelijke focusring voor toetsenbord-/schermlezergebruik. */
      a:focus-visible, button:focus-visible, summary:focus-visible, .navitem:focus-visible,
      .botnav-item:focus-visible, .subtab:focus-visible, .pill:focus-visible, .emojibtn:focus-visible,
      [tabindex]:focus-visible, label[for="navtoggle"]:focus-visible{
        outline:2px solid var(--accent); outline-offset:2px; }
      ${raw(LOODS_CSS)}
      ${raw(HOME_SHELL_CSS)}
    </style>
  </head>
  <body>
    <script>(function(){try{var _t=localStorage.getItem("ff_theme");if(_t==="dark"||_t==="light"){document.documentElement.setAttribute("data-theme",_t);}}catch(e){}try{if(sessionStorage.getItem("ff_seen")){document.documentElement.classList.add("vt-nav");}else{sessionStorage.setItem("ff_seen","1");}}catch(e){}try{if(localStorage.getItem("ff_hide_fun")==="1"){var st=document.createElement("style");st.id="ff-hide-fun-style";st.textContent='[data-section="Fun"]{display:none!important}';(document.head||document.documentElement).appendChild(st);}}catch(e){}try{if(localStorage.getItem("ff_lang")==="nl"){document.documentElement.classList.add("ff-tr-off");}}catch(e){}})();</script>
    <input type="checkbox" id="navtoggle" class="navtoggle" aria-hidden="true" />
    <div class="hglass" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <header class="app">
      <label for="navtoggle" class="burger" aria-label="Menu openen">${svg("menu")}</label>
      ${raw('<button type="button" class="hai" id="ff-ai-open" aria-label="AI-assistent" title="Vraag het de assistent"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 13.8 8.7 19 10.5 13.8 12.3 12 17.5 10.2 12.3 5 10.5 10.2 8.7Z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/></svg></button>')}
      <span class="pagetag">${title}</span>
      <span class="hsync" aria-hidden="true">${svg("refresh")}</span>
      ${/* v202: vergrootglas weg — de assistent (sparkle, linksboven) is dé zoek-ingang;
           /zoek blijft bestaan als pagina (zijbalk-link + deep links). */ ""}
      ${headerAvatar(roles)}
    </header>
    <div id="toastwrap" class="toastwrap" aria-live="polite" aria-atomic="false"></div>
    <div class="shell">
      ${sidebar(active, roles)}
      <label for="navtoggle" class="scrim" aria-hidden="true"></label>
      <main>${subTabs(active, roles)}<div class="lds">${body}</div></main>
    </div>
    <input type="checkbox" switch id="ff-haptic-switch" aria-hidden="true" tabindex="-1" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0" />
    <div id="ptr" class="ptr" aria-hidden="true">${svg("refresh")}</div>
    <div id="ff-scrim" class="ff-scrim" hidden></div>
    <div id="ff-lightbox" class="ff-lightbox" hidden aria-hidden="true"><button class="lb-close" type="button" aria-label="Sluiten">✕</button><img alt="" /></div>
    <div id="ff-snackbar" class="ff-snackbar" role="status" hidden><span class="sb-msg"></span><button class="sb-undo" type="button">Ongedaan maken</button></div>
    ${raw(`<div id="ff-ai-scrim" class="ai-scrim" aria-hidden="true"></div>
    <section id="ff-ai" class="ai-sheet" role="dialog" aria-modal="true" aria-label="Assistent" hidden>
      <div class="ai-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 13.8 8.7 19 10.5 13.8 12.3 12 17.5 10.2 12.3 5 10.5 10.2 8.7Z"/></svg><strong>Assistent</strong><button type="button" id="ff-ai-close" class="ai-x" aria-label="Sluiten">&#10005;</button></div>
      <div class="ai-body" id="ff-ai-body">
        <p class="ai-hint">Zoek iets of stel een vraag. Ik zoek intern (nieuws, documenten, agenda, collega's) en beantwoord vragen — uit onze kennisbank als het kan, met bronnen erbij.</p>
      </div>
      <form id="ff-ai-form" class="ai-form" autocomplete="off">
        <input id="ff-ai-q" type="text" maxlength="500" placeholder="Zoek of vraag iets&hellip;" aria-label="Zoek of vraag iets" />
        <button type="submit" class="ai-send" aria-label="Versturen"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg></button>
      </form>
    </section>`)}
    ${bottomNav(active, roles)}${fab(active)}
    <footer>Intern platform · ingelogd via Cloudflare Access · <a href="/bug">Bug melden</a> · <span class="buildtag">${BUILD}</span></footer>
    ${/* v209: welkomsttour vernieuwd voor de interne livegang — scrollbaar (was
         op kleine schermen afgekapt, melding PJ), inhoud bijgewerkt (assistent,
         ochtendvraag, RSVP) en key v1->v2 zodat iedereen 'm één keer opnieuw ziet. */ ""}
    <div id="ff-tour" role="dialog" aria-modal="true" aria-labelledby="ff-tour-title" style="display:none;position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.45);align-items:center;justify-content:center;padding:max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))">
      <div style="background:var(--surface);color:var(--ink);max-width:430px;width:100%;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.32);display:flex;flex-direction:column;max-height:calc(100dvh - 40px);overflow:hidden">
        <div style="overflow-y:auto;overscroll-behavior:contain;padding:22px 22px 6px">
          <h2 id="ff-tour-title" style="margin:0 0 4px">Welkom op ons nieuwe intranet</h2>
          <p class="muted" style="margin:0 0 14px">In één minuut op weg:</p>
          <ul class="clean" style="display:grid;gap:11px;margin:0 0 16px">
            <li class="row-top" style="gap:11px"><span style="color:var(--green);flex:none">${svg("menu")}</span><span><strong>Navigatie</strong> — je vaste onderdelen staan in de balk onderin; tik op <strong>Meer</strong> voor de rest.</span></li>
            <li class="row-top" style="gap:11px"><span style="color:var(--green);flex:none">${raw('<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 13.8 8.7 19 10.5 13.8 12.3 12 17.5 10.2 12.3 5 10.5 10.2 8.7Z"/></svg>')}</span><span><strong>Assistent</strong> — de ster linksboven. Zoek iets ("verlofbeleid") of stel een vraag; je krijgt antwoord uit onze eigen kennisbank of van het web, mét bronnen.</span></li>
            <li class="row-top" style="gap:11px"><span style="color:var(--green);flex:none">${svg("users")}</span><span><strong>Waar werk je vandaag?</strong> — beantwoord 's ochtends de vraag op home met één tik (kantoor/thuis/op pad). Zo weet iedereen wie waar is; via de <strong>Vandaag</strong>-chip zie je wie er afwezig is.</span></li>
            <li class="row-top" style="gap:11px"><span style="color:var(--green);flex:none">${svg("refresh")}</span><span><strong>Gebaren</strong> — veeg vanaf de linkerrand terug, veeg items naar links voor acties, trek omlaag om te verversen.</span></li>
            <li class="row-top" style="gap:11px"><span style="color:var(--green);flex:none">${svg("home")}</span><span><strong>Meldingen & beginscherm</strong> — zet meldingen aan via het kaartje op home en voeg de app toe aan je beginscherm. Voorkeuren per onderwerp regel je onder Notificaties.</span></li>
            <li class="row-top" style="gap:11px"><span style="color:var(--green);flex:none">${svg("bug")}</span><span><strong>Zie je iets geks?</strong> — we zijn net live: meld bugs of ideeën via <strong>Meer → Feedback</strong>. Alles is welkom!</span></li>
          </ul>
        </div>
        <div style="padding:10px 22px calc(16px + env(safe-area-inset-bottom));flex:none;border-top:1px solid var(--line)">
          <button id="ff-tour-ok" class="btn" style="width:100%;margin:0">Aan de slag</button>
        </div>
      </div>
    </div>
    <script>
      (function () {
        try {
          if (localStorage.getItem("ff_tour_v2")) return;
          var el = document.getElementById("ff-tour");
          if (!el) return;
          el.style.display = "flex";
          function done() { try { localStorage.setItem("ff_tour_v2", "1"); } catch (e) {} el.style.display = "none"; }
          var ok = document.getElementById("ff-tour-ok");
          if (ok) ok.addEventListener("click", done);
          el.addEventListener("click", function (e) { if (e.target === el) done(); });
        } catch (e) {}
      })();
    </script>
    <script>
      // v200: AI-assistent-sheet — gecombineerd intern zoeken + AI-antwoord (/api/assist).
      // Leeft in het shell-chroom: het gesprek blijft staan terwijl je navigeert.
      (function () {
        var open = document.getElementById("ff-ai-open"), sheet = document.getElementById("ff-ai"),
            scrim = document.getElementById("ff-ai-scrim"), form = document.getElementById("ff-ai-form"),
            q = document.getElementById("ff-ai-q"), body = document.getElementById("ff-ai-body"),
            close = document.getElementById("ff-ai-close");
        if (!open || !sheet || !form || !q || !body) return;
        // v201: uitlijning — de sheet volgt het toetsenbord via visualViewport
        // (de --ff-kb-variabele wordt niet op elke pagina bijgehouden; daardoor
        // zweefde de sheet los boven de onderkant, screenshot PJ 15:00).
        var vv = window.visualViewport;
        function kbFix() {
          if (sheet.hidden || !vv) return;
          var off = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
          sheet.style.bottom = "calc(" + Math.round(off + 12) + "px + env(safe-area-inset-bottom))";
        }
        if (vv) { vv.addEventListener("resize", kbFix); vv.addEventListener("scroll", kbFix); }
        function setOpen(on) {
          if (on) {
            sheet.hidden = false;
            kbFix();
            requestAnimationFrame(function () { requestAnimationFrame(function () { sheet.classList.add("open"); }); });
            if (scrim) scrim.classList.add("show");
            setTimeout(function () { try { q.focus({ preventScroll: true }); } catch (e) {} kbFix(); }, 250);
          } else {
            sheet.classList.remove("open");
            if (scrim) scrim.classList.remove("show");
            setTimeout(function () { if (!sheet.classList.contains("open")) { sheet.hidden = true; sheet.style.bottom = ""; } }, 320);
            try { q.blur(); } catch (e) {}
          }
        }
        open.addEventListener("click", function () { setOpen(!sheet.classList.contains("open")); });
        if (close) close.addEventListener("click", function () { setOpen(false); });
        if (scrim) scrim.addEventListener("click", function () { setOpen(false); });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
        // Interne treffer aangetikt -> sheet dicht, SPA-router neemt de navigatie over.
        body.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("a[href]")) setOpen(false); });
        function esc(s) { var d = document.createElement("div"); d.textContent = String(s == null ? "" : s); return d.innerHTML; }
        function add(htmlStr, cls) { var d = document.createElement("div"); d.className = "ai-msg " + cls; d.innerHTML = htmlStr; body.appendChild(d); body.scrollTop = body.scrollHeight; return d; }
        var busy = false;
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var v = (q.value || "").trim();
          if (!v || busy) return;
          busy = true; q.value = "";
          add(esc(v), "me");
          var wait = add('<span class="ai-dots"><i></i><i></i><i></i></span>', "bot");
          fetch("/api/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: v }) })
            .then(function (r) { return r.json(); })
            .then(function (d) {
              var out = "";
              if (d.answer) {
                if (d.mode === "algemeen") out += '<span class="ai-tag">Algemene kennis (AI)</span>';
                if (d.mode === "web") out += '<span class="ai-tag">Van het web (AI)</span>'; // v206
                out += esc(d.answer).replace(/\\n/g, "<br>");
                if (d.sources && d.sources.length) out += '<div class="ai-src">' + d.sources.map(function (s) { return s.url ? '<a href="' + esc(s.url) + '"' + (String(s.url).indexOf("http") === 0 ? ' target="_blank" rel="noopener"' : "") + '>' + esc(s.title) + "</a>" : "<span>" + esc(s.title) + "</span>"; }).join("") + "</div>";
              }
              var tr = (d.treffers || []).reduce(function (a, g) { return a.concat(g.items.map(function (it) { return { g: g.label, t: it.titel, r: it.route }; })); }, []).slice(0, 6);
              if (tr.length) {
                out += '<div class="ai-tag" style="margin-top:' + (d.answer ? "10px" : "0") + '">Gevonden op het intranet</div><div class="ai-src">' + tr.map(function (x) { return '<a href="' + esc(x.r) + '">' + esc(x.t) + "</a>"; }).join("") + "</div>";
              }
              if (!out) out = esc("Niets gevonden — probeer andere woorden, of stel het als vraag.");
              wait.innerHTML = out;
              body.scrollTop = body.scrollHeight;
            })
            .catch(function () { wait.textContent = "Er ging iets mis — probeer het nog eens."; })
            .then(function () { busy = false; });
        });
      })();
    </script>
    <script>
      if ("serviceWorker" in navigator) {
        window.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
      }
      // Mobiel: zijbalk openen/sluiten met een veeg (van linkerrand open, naar links dicht).
      (function () {
        var t = document.getElementById("navtoggle"); if (!t) return;
        var sx = null, sy = null;
        function mobile() { return window.matchMedia("(max-width:880px)").matches; }
        document.addEventListener("touchstart", function (e) {
          if (!mobile()) { sx = null; return; }
          // Niet actief tijdens een open modaal/sheet of bij het aanraken van bedien-/invoer-elementen
          // (anders kan tikken in een veld bij de schermrand per ongeluk "terug" triggeren).
          if (document.body.classList.contains("sheet-open") || document.querySelector(".sheet-m.open, .sheet-m:target")) { sx = null; return; }
          if (e.target.closest && e.target.closest("input, textarea, select, button, a, label, .sheet-m")) { sx = null; return; }
          var x = e.touches[0].clientX, y = e.touches[0].clientY;
          if (!t.checked && x > 28) { sx = null; return; }
          sx = x; sy = y;
        }, { passive: true });
        document.addEventListener("touchmove", function (e) {
          if (sx === null) return;
          var dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
          if (Math.abs(dy) > Math.abs(dx)) { sx = null; return; }
          if (!t.checked && dx > 55) {
            // Linkerrand naar rechts = terug (swipe-to-go-back). Het "Meer"-menu opent als
            // popover via de Meer-knop en sluit via het scrim / de sluitknop.
            var ref = document.referrer, sameOrigin = false;
            try { sameOrigin = !!ref && new URL(ref).origin === window.location.origin; } catch (e) {}
            sx = null;
            if (sameOrigin && window.history.length > 1) { window.history.back(); }
          }
        }, { passive: true });
      })();
      // Snappy + actueel: pagina komt direct uit cache; de zijbalk-modulestand
      // wordt daarna licht bijgewerkt vanaf de server (klein, altijd-vers).
      (function () {
        fetch("/api/modules", { credentials: "include" })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) {
            if (!d || !d.modules) return;
            var on = {}; for (var k = 0; k < d.modules.length; k++) on[d.modules[k]] = 1;
            var items = document.querySelectorAll(".navitem[data-mod]");
            for (var i = 0; i < items.length; i++) { var m = items[i].getAttribute("data-mod"); items[i].style.display = on[m] ? "" : "none"; }
            var secs = document.querySelectorAll("[data-navsec]");
            for (var x = 0; x < secs.length; x++) {
              var any = false, as = secs[x].querySelectorAll(".navitem");
              for (var j = 0; j < as.length; j++) { if (as[j].style.display !== "none") { any = true; break; } }
              secs[x].style.display = any ? "" : "none";
            }
          }).catch(function () {});
      })();
      // (v179) Inklapbare menu-groepen vervallen — groepen staan altijd open (home-stijl).
    </script>
    <script>
      (function () {
        window.showToast = function (msg, type) {
          var wrap = document.getElementById("toastwrap");
          if (!wrap || !msg) return;
          var t = document.createElement("div");
          t.className = "toast" + (type === "error" ? " err" : "");
          t.setAttribute("role", "status");
          t.textContent = msg;
          wrap.appendChild(t);
          requestAnimationFrame(function () { t.classList.add("show"); });
          var rm = function () { t.classList.remove("show"); setTimeout(function () { t.remove(); }, 240); };
          t.addEventListener("click", rm);
          setTimeout(rm, 3800);
        };
        function scanToasts() {
          document.querySelectorAll("[data-toast]").forEach(function (el) {
            if (el.getAttribute("data-toast-done")) return;
            el.setAttribute("data-toast-done", "1");
            var msg = (el.textContent || "").trim();
            if (!msg) return;
            el.style.display = "none";
            window.showToast(msg, el.classList.contains("warn") ? "error" : "success");
          });
        }
        scanToasts();
        document.addEventListener("ff:page", scanToasts);
      })();
    </script>
    <script>
      // Leesbevestiging (v185): gedelegeerde handler voor .lees-btn (nieuws/beleid).
      // Optimistic: knop -> "✓ Gelezen"; bij een fout komt de knop terug + toast.
      (function () {
        document.addEventListener("click", function (e) {
          var b = e.target.closest ? e.target.closest(".lees-btn") : null;
          if (!b || b.disabled) return;
          b.disabled = true;
          fetch("/api/gelezen", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ type: b.getAttribute("data-lees-type"), id: b.getAttribute("data-lees-id") }),
          }).then(function (r) {
            if (!r.ok) throw new Error("status " + r.status);
            var s = document.createElement("span");
            s.className = "muted";
            s.style.cssText = "flex:none;font-size:.8rem;font-weight:600";
            s.textContent = "✓ Gelezen";
            b.replaceWith(s);
            if (window.ffInvalidate) { try { window.ffInvalidate(); } catch (x) {} }
          }).catch(function () {
            b.disabled = false;
            if (window.showToast) window.showToast("Bevestigen niet gelukt — probeer het opnieuw.", "error");
          });
        });
      })();
    </script>
    <script>
      // Optimistic UI (Stroom-plan 1.2): centrale mutatie-helper. apply() past de UI
      // direct toe, request() praat op de achtergrond met de Worker, rollback() draait
      // de apply terug bij een fout, confirm() reconcilieert stil met het serverantwoord.
      // Geen blokkerende spinners of disabled schermen; <html> krijgt .ff-syncing zolang
      // er mutaties onderweg zijn (de zichtbare indicator volgt in taak 1.3).
      (function () {
        var open = 0;
        function sync(d) {
          open = Math.max(0, open + d);
          document.documentElement.classList.toggle("ff-syncing", open > 0);
        }
        window.ffMutate = function (opts) {
          opts = opts || {};
          var ctx;
          try { ctx = opts.apply ? opts.apply() : undefined; } catch (e) {}
          sync(1);
          // Pending-status (1.3): gemarkeerde elementen dimmen + sync-icoontje tot bevestigd.
          var pend = [];
          if (opts.pending) { pend = opts.pending.tagName ? [opts.pending] : Array.prototype.slice.call(opts.pending); }
          for (var i = 0; i < pend.length; i++) { try { pend[i].classList.add("ff-pending"); } catch (e) {} }
          function settle() { for (var j = 0; j < pend.length; j++) { try { pend[j].classList.remove("ff-pending"); } catch (e) {} } }
          return Promise.resolve()
            .then(function () { return opts.request ? opts.request(ctx) : null; })
            .then(function (res) {
              sync(-1); settle();
              if (opts.confirm) { try { opts.confirm(res, ctx); } catch (e) {} }
              // SWR (1.5): na een eigen mutatie is de gecachte versie van dit scherm stale.
              if (window.ffInvalidate) { try { window.ffInvalidate(); } catch (e) {} }
              return { ok: true, res: res };
            })
            .catch(function (err) {
              sync(-1); settle();
              // Offline (2.2): niet terugdraaien maar in de wachtrij — de optimistic
              // staat blijft staan en wordt na verbinding alsnog werkelijkheid.
              if (!navigator.onLine && opts.offline && window.ffQueue) {
                try { window.ffQueue.add({ url: opts.offline.url, kind: "json", body: JSON.stringify(opts.offline.body), createdAt: Date.now() }); } catch (e) {}
                if (window.showToast) window.showToast("Geen verbinding — actie wordt automatisch verstuurd.");
                return { ok: false, queued: true };
              }
              try { if (opts.rollback) opts.rollback(ctx); } catch (e) {}
              if (opts.onError) { try { opts.onError(err); } catch (e) {} }
              else if (window.showToast) window.showToast("Niet gelukt — probeer het opnieuw.", "error");
              return { ok: false, err: err };
            });
        };
      })();
    </script>
    <script>
      (function () {
        document.addEventListener("click", function (e) {
          var btn = e.target && e.target.closest ? e.target.closest(".emojibtn") : null;
          if (!btn) return;
          var bar = btn.closest(".emojibar");
          if (!bar || bar.getAttribute("data-actief") !== "1") return;
          var type = bar.getAttribute("data-type"), id = bar.getAttribute("data-id"), emoji = btn.getAttribute("data-emoji");
          var ns = btn.querySelector(".n");
          // Optimistic (1.2): toggle + teller direct, fetch op de achtergrond, server
          // reconcilieert stil; bij een fout: rollback + "Opnieuw proberen" (1.4).
          var run = function () { window.ffMutate({
            pending: btn,
            offline: { url: "/api/reactie", body: { type: type, id: id, emoji: emoji } },
            apply: function () {
              var was = { on: btn.classList.contains("on"), n: ns ? Number(ns.textContent || "0") || 0 : 0 };
              var on = !was.on, n = Math.max(0, was.n + (on ? 1 : -1));
              btn.classList.toggle("on", on);
              btn.setAttribute("aria-pressed", on ? "true" : "false");
              if (ns) { ns.textContent = n; if (n > 0) ns.removeAttribute("hidden"); else ns.setAttribute("hidden", ""); ns.classList.remove("tick"); void ns.offsetWidth; ns.classList.add("tick"); }
              btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop");
              try { if (navigator.vibrate) navigator.vibrate(12); } catch (x) {}
              return was;
            },
            request: function () {
              return fetch("/api/reactie", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify({ type: type, id: id, emoji: emoji }) })
                .then(function (r) {
                  var ct = r.headers.get("content-type") || "";
                  if (!r.ok || ct.indexOf("application/json") === -1) {
                    // 403 (sessie/identiteit), 5xx, of een Access-loginpagina i.p.v. JSON.
                    throw new Error(r.status === 403 ? "geen-toegang" : "mislukt");
                  }
                  return r.json();
                })
                .then(function (d) { if (!d || d.error) throw new Error(d && d.error ? d.error : "mislukt"); return d; });
            },
            confirm: function (d) {
              var counts = d.counts || {}, mine = d.mine || [];
              bar.querySelectorAll(".emojibtn").forEach(function (b) {
                var em = b.getAttribute("data-emoji"), n = counts[em] || 0, s = b.querySelector(".n");
                if (s) {
                  if (String(n) !== s.textContent) s.textContent = n;
                  if (n > 0) s.removeAttribute("hidden"); else s.setAttribute("hidden", "");
                }
                var on = mine.indexOf(em) >= 0;
                b.classList.toggle("on", on);
                b.setAttribute("aria-pressed", on ? "true" : "false");
              });
            },
            rollback: function (was) {
              if (!was) return;
              btn.classList.toggle("on", was.on);
              btn.setAttribute("aria-pressed", was.on ? "true" : "false");
              if (ns) { ns.textContent = was.n; if (was.n > 0) ns.removeAttribute("hidden"); else ns.setAttribute("hidden", ""); }
            },
            onError: function (err) {
              if (err && err.message === "geen-toegang") { if (window.showToast) window.showToast("Reactie niet opgeslagen — log opnieuw in.", "error"); return; }
              if (window.ffSnack) window.ffSnack("Niet gelukt", "Opnieuw proberen", run);
              else if (window.showToast) window.showToast("Reactie kon niet worden opgeslagen.", "error");
            }
          }); };
          run();
        });
      })();
    </script>
    <script>
      // Reconcilieer de reactiebalken met de serverstand bij paginalaad. De pagina kan
      // uit de cache komen (stale-while-revalidate); /api/reacties is altijd vers, zodat
      // een reactie ook na herladen meteen correct geteld + gemarkeerd staat.
      (function () {
        function reconcile() {
        var bars = document.querySelectorAll(".emojibar");
        if (!bars.length) return;
        fetch("/api/reacties", { credentials: "include", headers: { "Accept": "application/json" } })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) {
            if (!d) return;
            bars.forEach(function (bar) {
              var key = bar.getAttribute("data-type") + ":" + bar.getAttribute("data-id");
              var st = d[key]; var counts = (st && st.counts) || {}, mine = (st && st.mine) || [];
              bar.querySelectorAll(".emojibtn").forEach(function (b) {
                var em = b.getAttribute("data-emoji"), n = counts[em] || 0, ns = b.querySelector(".n");
                if (ns) { ns.textContent = n; if (n > 0) ns.removeAttribute("hidden"); else ns.setAttribute("hidden", ""); }
                var on = mine.indexOf(em) >= 0;
                b.classList.toggle("on", on);
                b.setAttribute("aria-pressed", on ? "true" : "false");
              });
            });
          }).catch(function () {});
        }
        reconcile();
        document.addEventListener("ff:page", reconcile);
        // Na het legen van de offline-wachtrij (2.2): tellers gelijktrekken met de server.
        document.addEventListener("ff:flushed", reconcile);
      })();
    </script>
    <script>
      // Bottom-sheet: open via een [data-sheet]-trigger (bv. de + in de bottom-bar),
      // sluit via scrim-tap, Escape, omlaag-vegen of een [data-sheet-close]-element.
      (function () {
        var scrim = document.getElementById("ff-scrim");
        var vv = window.visualViewport;
        var lastFocus = 0; // tijdstip laatste veld-focus in een sheet (iOS ghost-click-guard)
        var lastTrigger = null; // element dat de sheet opende (focus keert daar terug)
        // Houd de sheet boven het toetsenbord (iOS/Android): laat 'm meebewegen met de
        // zichtbare viewport i.p.v. een vaste bottom:0 (voorkomt de iOS fixed-flyaway).
        function syncVV() {
          if (!vv) return;
          if (!document.querySelector(".sheet-m.open")) {
            document.documentElement.style.removeProperty("--ff-kb");
            document.documentElement.style.removeProperty("--ff-vh");
            return;
          }
          var kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
          document.documentElement.style.setProperty("--ff-kb", kb + "px");
          document.documentElement.style.setProperty("--ff-vh", vv.height + "px");
        }
        if (vv) { vv.addEventListener("resize", syncVV); vv.addEventListener("scroll", syncVV); }
        function open(id) {
          var el = document.getElementById(id); if (!el) return;
          lastTrigger = document.activeElement;
          // iOS-fix: een position:fixed-sheet binnen de scrollende .shell gedraagt zich op iOS
          // Safari fout (niet-interactief / verkeerd geplaatst / sluit bij tik). Hang 'm op mobiel
          // bij het openen direct onder <body>, buiten de scroll-container.
          if (window.matchMedia("(max-width:880px)").matches && el.parentNode !== document.body) {
            document.body.appendChild(el);
            void el.offsetWidth; // reflow: slide-animatie start netjes vanaf translateY(100%)
          }
          el.classList.add("open");
          document.body.classList.add("sheet-open");
          syncVV();
          if (scrim) { scrim.hidden = false; requestAnimationFrame(function () { scrim.classList.add("show"); }); }
          document.body.style.overflow = "hidden";
          if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) {} }
          el.setAttribute("tabindex", "-1"); try { el.focus({ preventScroll: true }); } catch (e) {}
        }
        function closeAll(force) {
          // iOS: na het tikken in een veld komt het toetsenbord op en verschuift de layout;
          // de ~300ms vertraagde synthetische click landt dan soms op scrim/handle -> ongewenste close.
          // Negeer een niet-bewuste close binnen 600ms na zo'n focus.
          if (!force && Date.now() - lastFocus < 600) return;
          var any = false;
          document.querySelectorAll(".sheet-m.open").forEach(function (el) { el.classList.remove("open"); any = true; });
          if (scrim) { scrim.classList.remove("show"); setTimeout(function () { scrim.hidden = true; }, 240); }
          document.body.classList.remove("sheet-open");
          document.body.style.overflow = "";
          syncVV();
          if (lastTrigger && lastTrigger.focus) { try { lastTrigger.focus({ preventScroll: true }); } catch (e) {} } lastTrigger = null;
          if (any && location.hash) history.replaceState(null, "", location.pathname + location.search);
        }
        document.addEventListener("focusin", function (e) {
          var sh = e.target.closest ? e.target.closest(".sheet-m.open") : null;
          if (!sh) return;
          lastFocus = Date.now();
          if (e.target.scrollIntoView) setTimeout(function () { try { e.target.scrollIntoView({ block: "center" }); } catch (x) {} }, 260);
        });
        document.addEventListener("click", function (e) {
          var t = e.target.closest ? e.target.closest("[data-sheet]") : null;
          if (t) { e.preventDefault(); open(t.getAttribute("data-sheet")); return; }
          var c = e.target.closest ? e.target.closest("[data-sheet-close]") : null;
          if (c) { e.preventDefault(); closeAll(true); }
        });
        // Tik naast de sheet (scrim) sluit — met focus-guard tegen iOS ghost-clicks vlak na focus.
        if (scrim) scrim.addEventListener("click", function () { closeAll(false); });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAll(true); });
        // Focus-trap: Tab/Shift+Tab blijven binnen de open sheet.
        document.addEventListener("keydown", function (e) {
          if (e.key !== "Tab") return;
          var sheet = document.querySelector(".sheet-m.open"); if (!sheet) return;
          var f = sheet.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
          if (!f.length) return;
          var first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        });
        // Sleepbaar sluiten: vanaf de handle, of vanaf bovenin de sheet (niet op een veld) terwijl
        // die bovenaan staat. De sheet volgt de vinger en sluit voorbij de drempel (premium).
        var sy = null, dragSheet = null, curDy = 0;
        document.addEventListener("touchstart", function (e) {
          var sheet = e.target.closest ? e.target.closest(".sheet-m.open") : null;
          if (!sheet) { sy = null; dragSheet = null; return; }
          var onHandle = !!(e.target.closest && e.target.closest(".sheet-handle"));
          var onControl = !!(e.target.closest && e.target.closest("input, textarea, select, button, a, label"));
          var nearTop = (e.touches[0].clientY - sheet.getBoundingClientRect().top) < 64;
          if (onHandle || (nearTop && sheet.scrollTop <= 0 && !onControl)) { sy = e.touches[0].clientY; dragSheet = sheet; curDy = 0; }
          else { sy = null; dragSheet = null; }
        }, { passive: true });
        document.addEventListener("touchmove", function (e) {
          if (sy === null || !dragSheet) return;
          curDy = e.touches[0].clientY - sy;
          if (curDy <= 0) { dragSheet.style.transform = ""; return; }
          dragSheet.style.transition = "none";
          dragSheet.style.transform = "translateY(" + curDy + "px)";
        }, { passive: true });
        function endDrag() {
          if (!dragSheet) { sy = null; return; }
          var sheet = dragSheet; dragSheet = null; sy = null;
          sheet.style.transition = "";
          if (curDy > 70) { closeAll(true); }
          sheet.style.transform = "";
          curDy = 0;
        }
        document.addEventListener("touchend", endDrag, { passive: true });
        document.addEventListener("touchcancel", endDrag, { passive: true });
      })();
    </script>
    <script>
      // Foto-lightbox: tik op een .zoomable-afbeelding -> full-screen met pinch-zoom (2 vingers),
      // pan (sleep bij ingezoomd), dubbeltik-zoom, en sluiten via veeg-omlaag / tik / Esc / sluitknop.
      (function () {
        var lb = document.getElementById("ff-lightbox"); if (!lb) return;
        var img = lb.querySelector("img");
        var scale = 1, tx = 0, ty = 0, startDist = 0, startScale = 1, panning = false, lastX = 0, lastY = 0, lastTap = 0, dragY = 0;
        var pointers = new Map();
        function apply() { img.style.transform = "translate(" + tx + "px," + ty + "px) scale(" + scale + ")"; }
        function reset() { scale = 1; tx = 0; ty = 0; dragY = 0; img.style.opacity = ""; apply(); }
        function openLb(src, alt) {
          img.src = src; img.alt = alt || ""; reset();
          lb.hidden = false; requestAnimationFrame(function () { lb.classList.add("show"); });
          document.body.style.overflow = "hidden";
        }
        function closeLb() {
          lb.classList.remove("show"); document.body.style.overflow = "";
          setTimeout(function () { lb.hidden = true; img.src = ""; reset(); }, 240);
        }
        document.addEventListener("click", function (e) {
          var z = e.target.closest ? e.target.closest("img.zoomable") : null;
          if (z) { e.preventDefault(); openLb(z.currentSrc || z.src, z.alt); }
        });
        lb.querySelector(".lb-close").addEventListener("click", function (e) { e.stopPropagation(); closeLb(); });
        document.addEventListener("keydown", function (e) { if (!lb.hidden && e.key === "Escape") closeLb(); });
        function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
        function vals() { var r = []; pointers.forEach(function (v) { r.push(v); }); return r; }
        img.addEventListener("pointerdown", function (e) {
          try { img.setPointerCapture(e.pointerId); } catch (x) {}
          pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.size === 2) { var p = vals(); startDist = dist(p[0], p[1]); startScale = scale; }
          else {
            panning = true; lastX = e.clientX; lastY = e.clientY; dragY = 0; img.classList.add("dragging");
            var now = Date.now();
            if (now - lastTap < 300) { scale = scale > 1 ? 1 : 2.5; if (scale === 1) { tx = 0; ty = 0; } img.classList.remove("dragging"); apply(); }
            lastTap = now;
          }
        });
        img.addEventListener("pointermove", function (e) {
          if (!pointers.has(e.pointerId)) return;
          pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.size === 2) { var p = vals(); if (startDist) { scale = Math.min(4, Math.max(1, startScale * (dist(p[0], p[1]) / startDist))); apply(); } }
          else if (panning && scale > 1) { tx += e.clientX - lastX; ty += e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; apply(); }
          else if (panning && scale === 1) { dragY = Math.max(0, e.clientY - lastY); img.style.transform = "translateY(" + dragY + "px)"; img.style.opacity = String(1 - Math.min(dragY / 320, 0.7)); }
        });
        function up(e) {
          try { img.releasePointerCapture(e.pointerId); } catch (x) {}
          pointers.delete(e.pointerId);
          if (pointers.size < 2) startDist = 0;
          if (pointers.size === 0) {
            img.classList.remove("dragging");
            if (scale === 1) { if (dragY > 90) { closeLb(); } else { img.style.opacity = ""; reset(); } }
            panning = false;
          }
        }
        img.addEventListener("pointerup", up);
        img.addEventListener("pointercancel", up);
      })();
    </script>
    <script>
      // Undo-/actie-snackbar (Stroom-plan 1.4). Verwijderen gebeurt METEEN op de server
      // (soft delete); "Ongedaan maken" (±5s) herstelt via /api/herstel — robuuster dan
      // de oude uitgestelde delete (overleeft weg-navigeren/crashen). window.ffSnack
      // (msg, label, onAction, opts) is los herbruikbaar, bv. voor "Opnieuw proberen".
      (function () {
        var bar = document.getElementById("ff-snackbar"); if (!bar) return;
        var msgEl = bar.querySelector(".sb-msg"), actBtn = bar.querySelector(".sb-undo");
        var current = null; // { timer, onAction, item, then }
        function hideBar() { bar.classList.remove("show"); setTimeout(function () { bar.hidden = true; }, 240); }
        function expire() {
          if (!current) return;
          var cur = current; current = null; clearTimeout(cur.timer); hideBar();
          if (cur.then) window.location.href = cur.then; // bv. terug naar /agenda na event-delete
        }
        window.ffSnack = function (msg, label, onAction, o) {
          if (current) { clearTimeout(current.timer); current = null; }
          msgEl.textContent = msg;
          actBtn.textContent = label || "Ongedaan maken";
          actBtn.style.display = onAction ? "" : "none";
          bar.hidden = false;
          requestAnimationFrame(function () { bar.classList.add("show"); });
          current = { onAction: onAction || null, item: (o && o.item) || null, then: (o && o.then) || null, timer: setTimeout(expire, (o && o.ms) || 5000) };
        };
        actBtn.addEventListener("click", function () {
          if (!current) { hideBar(); return; }
          var cur = current; current = null; clearTimeout(cur.timer); hideBar();
          if (cur.onAction) { try { cur.onAction(cur); } catch (e) {} }
        });
        function itemOf(f) { return f.closest(".swipe") || f.closest(".reactie") || f.closest(".post") || f.closest("li") || f.closest("article") || f.closest(".card"); }
        document.addEventListener("submit", function (e) {
          var f = e.target;
          if (!f || !f.matches || !f.matches("form[data-undo]")) return;
          e.preventDefault();
          var item = itemOf(f);
          if (item) { item.classList.add("ff-leaving"); (function (it) { setTimeout(function () { if (it.classList.contains("ff-leaving")) it.style.display = "none"; }, 260); })(item); }
          // Direct uitvoeren: soft delete op de server; undo herstelt server-side.
          try { fetch(f.action, { method: "POST", body: new FormData(f), credentials: "include" }).catch(function () {}); } catch (x) {}
          if (window.ffInvalidate) { try { window.ffInvalidate(); } catch (x) {} }
          var ht = f.getAttribute("data-herstel-type");
          var idEl = f.querySelector('input[name="id"]');
          var undo = (ht && idEl && idEl.value) ? { type: ht, id: idEl.value } : null;
          window.ffSnack(
            f.getAttribute("data-undo") || "Verwijderd",
            undo ? "Ongedaan maken" : null,
            undo ? function (cur) {
              fetch("/api/herstel", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(undo) })
                .then(function (r) {
                  if (!r.ok) throw 0;
                  if (cur.item) { cur.item.style.display = ""; void cur.item.offsetWidth; cur.item.classList.remove("ff-leaving"); }
                  if (window.ffInvalidate) { try { window.ffInvalidate(); } catch (x) {} }
                  if (window.ffHaptic) window.ffHaptic(8);
                })
                .catch(function () { if (window.showToast) window.showToast("Herstellen niet gelukt.", "error"); });
            } : null,
            { item: item, then: f.getAttribute("data-undo-then") || null }
          );
          if (window.ffHaptic) window.ffHaptic(10);
        });
      })();
    </script>
    <script>
      // Knop-laadstaat + dubbel-submit-guard: bij submit van een navigerend formulier krijgt de
      // submit-knop een spinner en wordt herhaald verzenden geblokkeerd. [data-undo]-forms (undo-
      // snackbar, geen echte navigatie) en GET-forms blijven ongemoeid.
      (function () {
        document.addEventListener("submit", function (e) {
          var f = e.target;
          if (!f || !f.tagName || (f.method && f.method.toLowerCase() === "get")) return;
          if (f.matches && f.matches("[data-undo]")) return;
          if (f.dataset && f.dataset.ffSubmitting) { e.preventDefault(); return; }
          if (f.dataset) f.dataset.ffSubmitting = "1";
          var btn = f.querySelector('button[type="submit"], input[type="submit"], button:not([type])');
          if (btn) { btn.classList.add("is-loading"); setTimeout(function () { try { btn.disabled = true; } catch (x) {} }, 0); }
        });
      })();
    </script>
    <script>
      // Lijst->detail-richting voor de view-transition (Chromium). 'traverse' = terug.
      (function () {
        if (!("navigation" in window)) return;
        window.addEventListener("pagereveal", function (e) {
          if (!e.viewTransition) return;
          document.documentElement.classList.add("vt-nav");
        });
      })();
    </script>
    <script>
      // Pull-to-refresh: alleen mobiel, alleen bovenaan de pagina, en niet wanneer een
      // sheet of het menu open is. Rubber-band indicator + haptische tik; loslaten = verversen.
      (function () {
        if (!("ontouchstart" in window)) return;
        var ind = document.getElementById("ptr"); if (!ind) return;
        var sy = null, pulling = false, dist = 0; var THRESH = 70, MAX = 110;
        function blocked() {
          var t = document.getElementById("navtoggle");
          return document.body.classList.contains("sheet-open") || !!document.querySelector(".sheet-m.open, .sheet-m:target") || (t && t.checked);
        }
        function reset() { ind.classList.remove("active", "spin", "dragging"); ind.style.transform = "translate(-50%,-52px)"; ind.style.opacity = ""; dist = 0; pulling = false; }
        window.addEventListener("touchstart", function (e) {
          // App-shell: op mobiel (<=880px) scrollt .shell, niet window. window.scrollY is dan
          // altijd 0, dus lees de echte scroller, anders armt pull-to-refresh midden in de pagina.
          var ptrSc = document.querySelector(".shell");
          var ptrTop = (ptrSc && window.matchMedia("(max-width:880px)").matches) ? ptrSc.scrollTop : window.scrollY;
          if (blocked() || ptrTop > 0) { sy = null; return; }
          sy = e.touches[0].clientY; pulling = false;
        }, { passive: true });
        window.addEventListener("touchmove", function (e) {
          if (sy === null) return;
          var dy = e.touches[0].clientY - sy;
          if (dy <= 0) { sy = null; reset(); return; }
          pulling = true; dist = Math.min(dy * 0.5, MAX);
          ind.classList.add("active", "dragging");
          ind.style.transform = "translate(-50%," + (dist - 52) + "px) rotate(" + (dist * 3) + "deg)";
          ind.style.opacity = String(Math.min(dist / THRESH, 1));
        }, { passive: true });
        window.addEventListener("touchend", function () {
          if (sy === null) return;
          ind.classList.remove("dragging");
          if (pulling && dist >= THRESH) {
            if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) {} }
            ind.classList.add("spin"); ind.style.transform = "translate(-50%,12px)";
            location.reload();
          } else { reset(); }
          sy = null;
        });
      })();
    </script>
    <script>
      // Nieuw item soepel laten binnenkomen na een actie-redirect (?ok=), zodat plaatsen niet
      // "springt" (OPDRACHT 7). Eén keer, op de nieuwste content-kaart. Respecteert reduced-motion.
      (function () {
        if (!/[?&]ok=/.test(window.location.search)) return;
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        var el = document.querySelector("main article, main .post, main .card:not(.sheet-m)");
        if (!el) return;
        el.style.animation = "none"; void el.offsetWidth;
        el.style.animation = "ffArrive var(--dur-screen) var(--ease-out) both";
      })();
    </script>
    <script>
      // Inline vertaling: "Vertaal dit" op nieuws/prikbord via Workers AI (m2m100).
      // Doeltaal wordt onthouden (localStorage ff_lang); knop toggelt terug naar origineel.
      (function () {
        var LANGS = [["en","English"],["pl","Polski"],["ro","Rom\u00e2n\u0103"],["bg","\u0411\u044a\u043b\u0433\u0430\u0440\u0441\u043a\u0438"],["uk","\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430"],["de","Deutsch"],["es","Espa\u00f1ol"],["pt","Portugu\u00eas"],["fr","Fran\u00e7ais"],["tr","T\u00fcrk\u00e7e"],["ar","\u0627\u0644\u0639\u0631\u0628\u064a\u0629"]];
        function getLang(){ try { return localStorage.getItem("ff_lang") || ""; } catch (e) { return ""; } }
        function setLang(v){ try { localStorage.setItem("ff_lang", v); } catch (e) {} }
        function closePickers(){ var ps = document.querySelectorAll(".ff-tr-langs"); for (var i=0;i<ps.length;i++) ps[i].remove(); }
        function bodyOf(btn){ var c = btn.closest("article, .post"); return c ? c.querySelector(".ff-tr") : null; }
        async function doTr(btn, body, lang){
          if (btn._busy) return; btn._busy = true;
          var prev = btn.textContent; btn.disabled = true; btn.textContent = "Vertalen\u2026";
          try {
            var text = (body.innerText || body.textContent || "").trim();
            var res = await fetch("/api/vertaal", { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({ text: text, lang: lang }) });
            var j = await res.json().catch(function(){ return null; });
            if (res.ok && j && j.text) {
              if (btn._orig == null) btn._orig = body.innerHTML;
              body.textContent = j.text; body.classList.add("translated");
              btn.dataset.shown = "1"; btn.textContent = "Toon origineel";
            } else { btn.textContent = "Vertaling mislukt"; setTimeout(function(){ btn.textContent = prev; }, 1600); }
          } catch (e) { btn.textContent = "Vertaling mislukt"; setTimeout(function(){ btn.textContent = prev; }, 1600); }
          btn.disabled = false; btn._busy = false;
        }
        function showPicker(btn){
          closePickers();
          var box = document.createElement("div"); box.className = "ff-tr-langs";
          LANGS.forEach(function (pair) {
            var b = document.createElement("button"); b.type = "button"; b.textContent = pair[1];
            b.addEventListener("click", function (ev) { ev.stopPropagation(); setLang(pair[0]); box.remove(); doTr(btn, bodyOf(btn), pair[0]); });
            box.appendChild(b);
          });
          btn.insertAdjacentElement("afterend", box);
        }
        document.addEventListener("click", function (e) {
          var btn = e.target.closest ? e.target.closest(".ff-tr-btn") : null;
          if (!btn) { if (!(e.target.closest && e.target.closest(".ff-tr-langs"))) closePickers(); return; }
          e.preventDefault();
          var body = bodyOf(btn);
          if (!body) return;
          if (btn.dataset.shown === "1") { if (btn._orig != null) body.innerHTML = btn._orig; body.classList.remove("translated"); btn.dataset.shown = ""; btn.textContent = "Vertaal dit"; closePickers(); return; }
          var lang = getLang();
          if (!lang || lang === "nl") { showPicker(btn); return; }
          doTr(btn, body, lang);
        });
        function autoRun(){
          var lang = getLang(); var on = false; try { on = localStorage.getItem("ff_auto") === "1"; } catch (e) {}
          if (!on || !lang || lang === "nl") return;
          var btns = Array.prototype.slice.call(document.querySelectorAll(".ff-tr-btn"));
          (function next(i){
            if (i >= btns.length) return;
            var btn = btns[i], body = bodyOf(btn);
            if (body && body.classList.contains("ff-tr") && btn.dataset.shown !== "1") { doTr(btn, body, lang).then(function(){ next(i + 1); }); }
            else { next(i + 1); }
          })(0);
        }
        if (document.readyState !== "loading") autoRun(); else document.addEventListener("DOMContentLoaded", autoRun);
        document.addEventListener("ff:page", autoRun);
      })();
    </script>
    <script>
      // Live stemmen op peilingen (prikbord). Optimistic via ffMutate (Stroom-plan 1.2):
      // balken/percentages bewegen direct bij de tik; de server reconcilieert stil en
      // bij een fout zet de snapshot-rollback de kaart exact terug.
      (function () {
        function pct(n, t) { return t ? Math.round((n / t) * 100) : 0; }
        function render(card, counts, total, mine, multi) {
          var opts = card.querySelectorAll(".polloptions .pollopt");
          for (var i = 0; i < opts.length; i++) {
            var n = counts[i] || 0, p = pct(n, total || 0);
            var bar = opts[i].querySelector(".pollbar"); if (bar) bar.style.width = p + "%";
            var pc = opts[i].querySelector(".pollpct"); if (pc) pc.textContent = p + "% \u00b7 " + n;
            if (mine && mine.indexOf(i) >= 0) opts[i].classList.add("on"); else opts[i].classList.remove("on");
          }
          var foot = card.querySelector(".pollfoot");
          if (foot) foot.textContent = (total || 0) + ((total || 0) === 1 ? " stem" : " stemmen") + (multi ? " \u00b7 meerkeuze" : "");
        }
        document.addEventListener("click", function (e) {
          var opt = e.target.closest ? e.target.closest("button.pollopt") : null;
          if (!opt) return;
          var card = opt.closest(".poll"); if (!card) return;
          var pollId = card.getAttribute("data-poll");
          var optie = Number(opt.getAttribute("data-optie"));
          // Idempotency-id vóór de call (1.4): een retry stuurt exact hetzelfde id,
          // dus de server kan de replay herkennen en nooit dubbel registreren.
          var idem = window.ffMid ? window.ffMid() : void 0;
          var run = function () { window.ffMutate({
            pending: opt,
            offline: { url: "/api/poll-stem", body: { poll: pollId, optie: optie, idem: idem } },
            apply: function () {
              // Snapshot van de huidige kaart (strings) voor exacte rollback.
              var opts = card.querySelectorAll(".polloptions .pollopt");
              var foot = card.querySelector(".pollfoot");
              var snap = { rows: [], foot: foot ? foot.textContent : null };
              var counts = [], mine = [];
              for (var i = 0; i < opts.length; i++) {
                var bar = opts[i].querySelector(".pollbar"), pc = opts[i].querySelector(".pollpct");
                snap.rows.push({ w: bar ? bar.style.width : "", t: pc ? pc.textContent : "", on: opts[i].classList.contains("on") });
                var m = /\u00b7\s*(\d+)/.exec(pc ? pc.textContent : "");
                counts.push(m ? Number(m[1]) : 0);
                if (opts[i].classList.contains("on")) mine.push(i);
              }
              var multi = !!(snap.foot && snap.foot.indexOf("meerkeuze") >= 0);
              var wasVoter = mine.length > 0;
              var foothNum = /^(\d+)/.exec(snap.foot || ""); var total = foothNum ? Number(foothNum[1]) : 0;
              // Zelfde toggle-logica als de server (polls.vote).
              var on = mine.indexOf(optie) >= 0;
              if (multi) {
                if (on) { counts[optie] = Math.max(0, counts[optie] - 1); mine = mine.filter(function (x) { return x !== optie; }); }
                else { counts[optie]++; mine.push(optie); }
              } else {
                if (on) { counts[optie] = Math.max(0, counts[optie] - 1); mine = []; }
                else { if (mine.length) counts[mine[0]] = Math.max(0, counts[mine[0]] - 1); counts[optie]++; mine = [optie]; }
              }
              var isVoter = mine.length > 0;
              total = Math.max(0, total + (isVoter ? 1 : 0) - (wasVoter ? 1 : 0));
              render(card, counts, total, mine, multi);
              if (window.ffHaptic) window.ffHaptic(6);
              return snap;
            },
            request: function () {
              return fetch("/api/poll-stem", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ poll: pollId, optie: optie, idem: idem }) })
                .then(function (res) {
                  return res.json().catch(function () { return null; }).then(function (j) {
                    if (!res.ok || !j || !j.counts) throw new Error((j && j.error) || "mislukt");
                    return j;
                  });
                });
            },
            confirm: function (j) { render(card, j.counts, j.total || 0, j.mine || [], !!j.multi); },
            rollback: function (snap) {
              if (!snap) return;
              var opts = card.querySelectorAll(".polloptions .pollopt");
              for (var i = 0; i < opts.length; i++) {
                var r = snap.rows[i]; if (!r) continue;
                var bar = opts[i].querySelector(".pollbar"); if (bar) bar.style.width = r.w;
                var pc = opts[i].querySelector(".pollpct"); if (pc) pc.textContent = r.t;
                opts[i].classList.toggle("on", r.on);
              }
              var foot = card.querySelector(".pollfoot");
              if (foot && snap.foot != null) foot.textContent = snap.foot;
            },
            onError: function (err) {
              if (err && err.message === "gesloten") { if (window.showToast) window.showToast("Deze peiling is gesloten.", "error"); return; }
              if (window.ffSnack) window.ffSnack("Stem niet opgeslagen", "Opnieuw proberen", run);
              else if (window.showToast) window.showToast("Stem niet opgeslagen \u2014 probeer het opnieuw.", "error");
            }
          }); };
          run();
        });
      })();
    </script>
    <script>
      // WhatsApp-stijl: glijdende highlight achter de actieve bottom-nav-tab. Puur optisch;
      // routing/active-state komen van de server. Meet via offsetLeft (balk is offsetParent).
      (function () {
        var bar = document.querySelector(".botnav"); if (!bar) return;
        var blob = bar.querySelector(".botnav-blob"); if (!blob) return;
        var inner = bar.querySelector(".botnav-inner");
        function move(el) { if (!el) return; blob.style.setProperty("--blob-x", el.offsetLeft + "px"); blob.style.setProperty("--blob-w", el.offsetWidth + "px"); blob.style.setProperty("--blob-h", el.offsetHeight + "px"); blob.style.top = el.offsetTop + "px"; }
        // Geen actieve bestemming in de capsule (bv. kantine via "Meer")? Dan hoort
        // de blob op de Meer-tab (duim-UI v175) — niet verbergen, niet op het eerste item.
        function current() { return bar.querySelector(".botnav-item.on") || bar.querySelector(".botnav-more"); }
        // fitBar (masteropdracht stap 5): bij Dynamic Type/overflow valt de pill terug op
        // alleen iconen (.compact) en wordt de glow daarna opnieuw strak om de actieve tab gelegd.
        function fitBar() {
          if (inner) {
            inner.classList.remove("compact");
            if (inner.scrollWidth > inner.clientWidth + 1) inner.classList.add("compact");
          }
          var c = current();
          if (c) { blob.style.setProperty("--blob-o", "1"); move(c); }
          else { blob.style.setProperty("--blob-o", "0"); }
        }
        function placeInstant() { bar.classList.remove("anim"); fitBar(); requestAnimationFrame(function () { bar.classList.add("anim"); }); }
        bar.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest("a.botnav-item") : null; if (t) move(t); });
        // Blob volgt ook "Meer": drawer open -> highlight op de Meer-knop; dicht -> terug
        // naar de actieve bestemming. Werkt via de navtoggle-checkbox (ook scrim/sluit-knop).
        var more = bar.querySelector(".botnav-more");
        var navToggle = document.getElementById("navtoggle");
        if (navToggle) navToggle.addEventListener("change", function () { if (navToggle.checked && more) move(more); else fitBar(); });
        requestAnimationFrame(placeInstant);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeInstant);
        window.addEventListener("load", placeInstant);
        window.addEventListener("resize", fitBar);
        window.addEventListener("orientationchange", function () { setTimeout(placeInstant, 120); });
        if (window.ResizeObserver && inner) new ResizeObserver(function () { fitBar(); }).observe(inner);
        // SPA-navigatie: active-state is dan al door de router gezet; fitBar herijkt + blob volgt.
        document.addEventListener("ff:page", function () { requestAnimationFrame(fitBar); });
      })();
    </script>
    <script>
      // Haptiek-laag (Set 2): korte, subtiele tik bij navigatie-/actie-taps. Respecteert
      // de systeeminstelling (navigator.vibrate is een no-op als haptiek uitstaat / niet kan).
      (function () {
        var haps = document.getElementById("ff-haptic-switch");
        window.ffHaptic = function (p) {
          try { if (navigator.vibrate && navigator.vibrate(p || 6)) return; } catch (e) {}
          // iOS-fallback: een 'switch'-checkbox togglen triggert de Taptic Engine (iOS 17.4+).
          try { if (haps) { haps.checked = !haps.checked; } } catch (e) {}
        };
        document.addEventListener("click", function (e) {
          var t = e.target.closest ? e.target.closest(".botnav-item, .fab, .subtab, .navitem, .pill, .emojibtn, .hai, .ai-send") : null;
          if (t && !t.disabled) window.ffHaptic(6);
          var sb = e.target.closest ? e.target.closest('button[type="submit"], input[type="submit"]') : null;
          if (sb && !sb.disabled) window.ffHaptic(12); // succes/verzonden-tik
        }, true);
        document.addEventListener("change", function (e) {
          var el = e.target;
          if (el && (el.type === "checkbox" || el.type === "radio")) window.ffHaptic(5); // toggle = lichte puls
        }, true);
      })();
    </script>
    <script>
      // Premium shell (v139): één scroll-listener per bron (mobiel = .shell, desktop = window).
      // Header krijgt glas zodra er gescrold is (y > 8); de pill krimpt bij omlaag scrollen
      // (y stijgt én y > 80) en komt terug bij omhoog. Na een SPA-wissel wordt de stand herijkt.
      (function () {
        var header = document.querySelector("header.app");
        if (!header) return;
        var pill = document.querySelector(".botnav-inner");
        var sh = document.querySelector(".shell");
        var lastY = 0;
        function cur() { return (sh && sh.scrollTop) || window.scrollY || 0; }
        function apply(y) {
          header.classList.toggle("scrolled", y > 8);
          if (pill) pill.classList.toggle("mini", y > lastY && y > 80);
          lastY = y;
        }
        function onScroll() { apply(cur()); }
        if (sh) sh.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("scroll", onScroll, { passive: true });
        apply(cur());
        document.addEventListener("ff:page", function () { lastY = 0; apply(cur()); });
      })();
    </script>
    <script>
      // SPA-router (v138): zelfde-origin navigatie zonder volledige paginaherlaad ("app-gevoel").
      // Werkwijze: fetch -> DOMParser -> <main>, titel, header-pagetag, FAB en active-states
      // swappen -> scripts in de nieuwe content opnieuw uitvoeren -> "ff:page"-event zodat
      // toasts/emoji-reconcile/vertaling/tabblob zich her-initialiseren. Bij twijfel (geen
      // app-layout in het antwoord, Access-login, fetch-fout) = gewone volledige navigatie.
      (function () {
        if (!window.history || !history.pushState || !window.DOMParser || !window.fetch) return;
        var busy = false;
        function qs(s, r) { return (r || document).querySelector(s); }
        // ---- SWR-cache (Stroom-plan 1.5): eerder bezochte schermen renderen direct uit
        // de Cache API (instant, geen netwerk-wachttijd); het netwerk ververst op de
        // achtergrond en werkt de pagina stil bij als er écht iets veranderd is.
        // Per toestel/gebruikersprofiel (Cache API is per browser-profiel); pagina's met
        // ?ok= (actie-bevestigingen) worden bewust niet gecachet (anders her-toast je).
        // Gekoppeld aan de build (v173-fix): elke deploy = verse SPA-cache, dus geen
        // flits van oude tabbar-markup/styling meer uit eerder bezochte pagina's.
        var SPA_CACHE = "ff-spa-${BUILD}";
        if (window.caches) { caches.keys().then(function (ks) { ks.forEach(function (k) { if (k.indexOf("ff-spa") === 0 && k !== SPA_CACHE) caches.delete(k); }); }).catch(function () {}); }
        function cacheKey(url) { var u = new URL(url, location.href); return u.pathname + u.search; }
        function putCache(url, txt) {
          if (!window.caches) return;
          var key = cacheKey(url);
          if (/[?&]ok=/.test(key)) return;
          caches.open(SPA_CACHE).then(function (c) {
            return c.put(new Request(key), new Response(txt, { headers: { "Content-Type": "text/html" } }));
          }).catch(function () {});
        }
        function getCache(url) {
          if (!window.caches) return Promise.resolve(null);
          return caches.open(SPA_CACHE)
            .then(function (c) { return c.match(cacheKey(url)); })
            .then(function (r) { return r ? r.text() : null; })
            .catch(function () { return null; });
        }
        // Invalidatie na eigen mutaties (ffMutate/undo roept dit aan).
        window.ffInvalidate = function (url) {
          if (!window.caches) return;
          caches.open(SPA_CACHE).then(function (c) { c.delete(cacheKey(url || location.href)); }).catch(function () {});
        };
        function saveScroll() {
          var sc = qs(".shell");
          var st = history.state || {};
          st.ffScroll = sc && sc.scrollTop ? sc.scrollTop : (window.scrollY || 0);
          try { history.replaceState(st, "", location.href); } catch (e) {}
        }
        function setScroll(y) {
          var sc = qs(".shell");
          if (sc) sc.scrollTop = y || 0;
          window.scrollTo(0, y || 0);
        }
        function eligible(a, e) {
          if (!a || busy) return false;
          if (e && (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return false;
          if (a.target && a.target !== "_self") return false;
          if (a.hasAttribute("download") || a.hasAttribute("data-nospa")) return false;
          var href = a.getAttribute("href") || "";
          if (!href || href.charAt(0) === "#") return false;
          var u; try { u = new URL(a.href, location.href); } catch (x) { return false; }
          if (u.origin !== location.origin) return false;
          var p = u.pathname;
          // v198: home is nu een shell-pagina — de router handelt "/" weer gewoon af
          // (de v192-uitzondering is daarmee vervallen; terug naar home = content-swap).
          if (p.indexOf("/api/") === 0 || p.indexOf("/portaal") === 0 || p.indexOf("/cdn-cgi/") === 0) return false;
          if (/\.(png|jpe?g|webp|gif|svg|ico|pdf|ics|csv|xlsx|docx|zip|js|json|webmanifest)$/i.test(p)) return false;
          return true;
        }
        function execScripts(root) {
          var list = root.querySelectorAll("script");
          for (var i = 0; i < list.length; i++) {
            var o = list[i], n = document.createElement("script");
            for (var j = 0; j < o.attributes.length; j++) n.setAttribute(o.attributes[j].name, o.attributes[j].value);
            n.textContent = o.textContent;
            try { o.parentNode.replaceChild(n, o); } catch (e) {}
          }
        }
        function syncOn(sel, doc) {
          var cur = document.querySelectorAll(sel), nxt = doc.querySelectorAll(sel);
          if (cur.length !== nxt.length) return false;
          for (var i = 0; i < cur.length; i++) {
            cur[i].classList.toggle("on", nxt[i].classList.contains("on"));
            if (nxt[i].hasAttribute("aria-current")) cur[i].setAttribute("aria-current", nxt[i].getAttribute("aria-current") || "page");
            else cur[i].removeAttribute("aria-current");
          }
          return true;
        }
        function swap(doc) {
          // Stale naar <body> geportalde sheets/overlays van de vorige pagina opruimen.
          document.querySelectorAll("body > .sheet-m").forEach(function (el) { el.remove(); });
          document.body.classList.remove("sheet-open");
          var scrim = qs("#ff-scrim"); if (scrim) { scrim.classList.remove("show"); scrim.hidden = true; }
          var t = qs("#navtoggle"); if (t) t.checked = false;
          // Main-inhoud + titel + header-pagetag.
          var m = qs(".shell main"), nm = qs(".shell main", doc) || qs("main", doc);
          m.innerHTML = nm.innerHTML;
          document.title = doc.title || document.title;
          var pt = qs("header.app .pagetag"), npt = qs("header.app .pagetag", doc);
          if (pt && npt) pt.textContent = npt.textContent;
          // Active-states (zijbalk + tabbalk). Bij structuurverschil: tabbalk-inhoud overnemen.
          syncOn("a.navitem", doc);
          if (!syncOn(".botnav-item", doc)) {
            var bi = qs(".botnav-inner"), nbi = qs(".botnav-inner", doc);
            if (bi && nbi) bi.innerHTML = nbi.innerHTML;
          }
          // FAB (staat buiten <main>, verschilt per pagina).
          var f = qs(".fab"), nf = qs(".fab", doc);
          if (f && !nf) { f.remove(); }
          else if (nf) {
            var imp = document.importNode(nf, true);
            if (f) { f.replaceWith(imp); }
            else { var bn = qs(".botnav"); if (bn) bn.insertAdjacentElement("afterend", imp); else document.body.appendChild(imp); }
          }
          execScripts(m);
        }
        function parseDoc(txt) { return new DOMParser().parseFromString(txt, "text/html"); }
        function validDoc(doc) { return !!(qs(".shell main", doc) && qs("header.app", doc)); }
        function go(url, mode, scrollY) {
          if (busy) return; busy = true;
          saveScroll();
          var served = false;   // cache-versie al getoond
          var netDone = false;  // netwerk-pad heeft al afgerond
          var servedTxt = null;
          var pendingDoc = null, pendingTxt = null; // cache-hit die in het race-venster wacht (v198)
          // Skeleton-laadstaat (v184, designsysteem §3.15): alleen bij een koude navigatie
          // (geen SWR-cache-hit) die >300ms duurt — sneller dan dat zou de shimmer flitsen.
          var skelTimer = setTimeout(function () {
            if (served || netDone) return;
            var m = qs(".shell main");
            if (!m) return;
            var s = '<div class="lds"><div class="skeletonlist" aria-hidden="true">'
              + '<div class="skeleton" style="height:34px;width:46%;margin:8px 0 18px"></div>';
            for (var i = 0; i < 5; i++) s += '<div class="skeleton" style="height:56px;margin-bottom:10px"></div>';
            m.innerHTML = s + "</div></div>";
            setScroll(0);
          }, 300);
          // 1) Instant-pad (SWR) met race-venster (v198): geef het netwerk eerst ~120ms
          // de kans. Wint het netwerk, dan is er maar ÉÉN render (geen dubbele swap =
          // geen stotter). Pas daarna valt hij terug op de cache-versie.
          getCache(url).then(function (txt) {
            if (!txt || netDone || served) return;
            var doc = parseDoc(txt);
            if (!validDoc(doc)) return;
            pendingDoc = doc; pendingTxt = txt;
            setTimeout(function () {
              if (netDone || served) return; // netwerk was sneller -> niets te doen
              served = true; servedTxt = txt;
              clearTimeout(skelTimer);
              var run = function () {
                var m0 = qs(".shell main"); if (m0) m0.classList.remove("ff-noanim");
                swap(doc);
                if (mode === "push" && url !== location.href) { try { history.pushState({}, "", url); } catch (e) {} }
                setScroll(scrollY || 0);
                document.dispatchEvent(new CustomEvent("ff:page"));
              };
              busy = false; // direct weer interactief; netwerk-update volgt stil
              // v201: try/catch — snelle opeenvolgende wissels gooiden een onschuldige
              // maar onafgevangen InvalidStateError (audit 12/6 §0).
              if (document.startViewTransition) { try { document.startViewTransition(run); } catch (e) { run(); } } else { run(); }
            }, 120);
          });
          // 2) Netwerk-pad: vers ophalen, cache bijwerken, en stil verversen bij verschil.
          fetch(url, { credentials: "include", headers: { "Accept": "text/html" }, redirect: "follow" })
            .then(function (r) {
              if (!r.ok) throw new Error("status " + r.status);
              var fin = r.url || url;
              return r.text().then(function (txt) { return { txt: txt, fin: fin }; });
            })
            .then(function (res) {
              netDone = true;
              clearTimeout(skelTimer);
              var doc = parseDoc(res.txt);
              if (!validDoc(doc)) { location.assign(url); return; }
              putCache(res.fin, res.txt);
              if (served) {
                // Stille revalidate: alleen bij echt verschil; scrollpositie blijft staan,
                // geen view-transition en geen scroll-reset -> nul zichtbare sprong.
                // v198: entree-animaties uit tijdens deze tweede swap (ff-noanim) —
                // het opnieuw afspelen van fadeUp wás de zichtbare stotter.
                busy = false;
                if (servedTxt === res.txt) return;
                var sc = qs(".shell");
                var keep = sc && sc.scrollTop ? sc.scrollTop : (window.scrollY || 0);
                var mS = qs(".shell main"); if (mS) mS.classList.add("ff-noanim");
                swap(doc);
                if (sc) sc.scrollTop = keep; else window.scrollTo(0, keep);
                if (res.fin !== location.href) { try { history.replaceState(history.state || {}, "", res.fin); } catch (e) {} }
                document.dispatchEvent(new CustomEvent("ff:page"));
                return;
              }
              var run = function () {
                var mN = qs(".shell main"); if (mN) mN.classList.remove("ff-noanim");
                swap(doc);
                if (mode === "push" && res.fin !== location.href) { try { history.pushState({}, "", res.fin); } catch (e) {} }
                setScroll(scrollY || 0);
                document.dispatchEvent(new CustomEvent("ff:page"));
              };
              busy = false;
              // v201: try/catch — snelle opeenvolgende wissels gooiden een onschuldige
              // maar onafgevangen InvalidStateError (audit 12/6 §0).
              if (document.startViewTransition) { try { document.startViewTransition(run); } catch (e) { run(); } } else { run(); }
            })
            .catch(function () {
              netDone = true;
              clearTimeout(skelTimer);
              busy = false;
              // Offline/fout met cache-weergave op het scherm: stil laten staan (werkt!).
              // v198: faalt het netwerk binnen het race-venster, render dan alsnog de
              // wachtende cache-versie via het normale SPA-pad (offline blijft soepel).
              if (!served && pendingDoc) {
                served = true; servedTxt = pendingTxt;
                var runC = function () {
                  var mC = qs(".shell main"); if (mC) mC.classList.remove("ff-noanim");
                  swap(pendingDoc);
                  if (mode === "push" && url !== location.href) { try { history.pushState({}, "", url); } catch (e) {} }
                  setScroll(scrollY || 0);
                  document.dispatchEvent(new CustomEvent("ff:page"));
                };
                if (document.startViewTransition) { try { document.startViewTransition(runC); } catch (e) { runC(); } } else { runC(); }
                return;
              }
              // Zonder cache: volledige navigatie (de service worker serveert dan zijn cache).
              if (!served) location.assign(url);
            });
        }
        document.addEventListener("click", function (e) {
          var a = e.target.closest ? e.target.closest("a[href]") : null;
          if (!eligible(a, e)) return;
          e.preventDefault();
          go(a.href, "push", 0);
        });
        window.addEventListener("popstate", function (e) {
          var y = e.state && e.state.ffScroll ? e.state.ffScroll : 0;
          go(location.href, "pop", y);
        });
        try { history.replaceState(history.state || {}, "", location.href); } catch (e) {}
      })();
    </script>
    <script>
      // Swipe-acties op lijstitems (Set 2 #113) + long-press (Set 2 #115). Sleep .swipe-fg
      // naar links voorbij de drempel = actie (klikt .swipe-bg) met haptische "thump".
      // Lang indrukken onthult diezelfde actie (haptiek + ontdekbaarheid). Tik elders = sluiten.
      (function () {
        if (!("ontouchstart" in window)) return;
        var THRESH = 88, MAX = 124, REVEAL = 116, cur = null, sx = 0, sy = 0, dir = null, lpTimer = null;
        function resetRevealed(except) {
          document.querySelectorAll(".swipe-fg.revealed").forEach(function (el) {
            if (el !== except) { el.classList.remove("revealed"); el.style.transform = ""; }
          });
        }
        function clearLp() { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } }
        document.addEventListener("touchstart", function (e) {
          var fg = e.target.closest ? e.target.closest(".swipe-fg") : null;
          resetRevealed(fg);
          if (!fg || (e.target.closest && e.target.closest("button, a, input, select, textarea, label, .uswitch"))) { cur = null; clearLp(); return; }
          cur = fg; sx = e.touches[0].clientX; sy = e.touches[0].clientY; dir = null;
          clearLp();
          lpTimer = setTimeout(function () {
            // Long-press: onthul de actie i.p.v. te slepen.
            dir = "lp"; cur = null;
            fg.classList.add("dragging"); fg.style.transform = "translateX(-" + REVEAL + "px)";
            requestAnimationFrame(function () { fg.classList.remove("dragging"); });
            fg.classList.add("revealed");
            try { if (navigator.vibrate) navigator.vibrate(12); } catch (x) {}
          }, 450);
        }, { passive: true });
        document.addEventListener("touchmove", function (e) {
          if (!cur) return;
          var dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
          if (dir === null) { if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return; dir = Math.abs(dx) > Math.abs(dy) ? "h" : "v"; if (dir) clearLp(); }
          if (dir !== "h") { cur = null; return; }
          if (dx > 0) dx = 0;
          cur.classList.add("dragging");
          cur.style.transform = "translateX(" + Math.max(dx, -MAX) + "px)";
        }, { passive: true });
        document.addEventListener("touchend", function () {
          clearLp();
          if (!cur) return;
          var fg = cur; cur = null; fg.classList.remove("dragging");
          var m = /translateX\((-?\d+(?:\.\d+)?)px\)/.exec(fg.style.transform || "");
          var d = m ? parseFloat(m[1]) : 0;
          if (d <= -THRESH) {
            try { if (navigator.vibrate) navigator.vibrate([6, 30, 6]); } catch (e) {}
            fg.style.transform = "translateX(-100%)";
            var li = fg.closest(".swipe"); var act = li ? li.querySelector(".swipe-bg") : null;
            setTimeout(function () { if (act) act.click(); }, 170);
          } else { fg.style.transform = ""; }
        });
        // Tik buiten een onthulde rij sluit 'm weer.
        document.addEventListener("click", function (e) {
          if (!(e.target.closest && e.target.closest(".swipe-fg.revealed"))) resetRevealed(null);
        });
      })();
    </script>
    <script>
      // Idempotente mutaties (Stroom-plan 1.1): elk POST-formulier krijgt bij het renderen
      // één mutatie-id. Dubbel tikken of een retry verstuurt hetzelfde id; de server
      // gebruikt het als record-id (INSERT ... ON CONFLICT DO NOTHING) -> nooit een
      // dubbel record. Na de redirect rendert de pagina verse id's.
      (function () {
        function mid() {
          if (crypto.randomUUID) return crypto.randomUUID().replace(/-/g, "");
          var s = Date.now().toString(16) + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
          s = s.replace(/[^0-9a-f]/g, "");
          while (s.length < 32) s += "0";
          return s.slice(0, 32);
        }
        function tagForm(f) {
          if (!f || !f.querySelector) return;
          if ((f.getAttribute("method") || "").toLowerCase() !== "post") return;
          if (f.hasAttribute("data-no-idem") || f.querySelector('input[name="idem"]')) return;
          var inp = document.createElement("input");
          inp.type = "hidden"; inp.name = "idem"; inp.value = mid();
          f.appendChild(inp);
        }
        function tagAll() {
          var forms = document.querySelectorAll("form");
          for (var i = 0; i < forms.length; i++) tagForm(forms[i]);
        }
        tagAll();
        document.addEventListener("ff:page", tagAll);
        // Vangnet voor later toegevoegde formulieren (sheets/portals): tag vlak vóór submit.
        document.addEventListener("submit", function (e) { tagForm(e.target); }, true);
        window.ffMid = mid; // ook voor fetch-mutaties (poll-stem e.d.)
      })();
    </script>
    <script>
      // App-icoon badge (PWA): spiegel de "nieuw"-teller van de header op het app-icoon.
      // Geïnstalleerde apps: Android/Chrome direct; iOS 16.4+ (vereist dat meldingen
      // voor de app aanstaan). In een gewone browsertab doet dit stilletjes niets.
      (function () {
        // Dots werken overal; het app-icoon alleen waar de Badging API bestaat.
        var kanBadge = ("setAppBadge" in navigator);
        var last = -1;
        function update() {
          fetch("/api/badge", { credentials: "include", headers: { "Accept": "application/json" } })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (d) {
              if (!d || typeof d.count !== "number") return;
              // Unread-dot (premium-audit): zichtbaar op de Meer-knop + het Notificaties-item.
              var dot = typeof d.unread === "number" && d.unread > 0;
              var meer = document.querySelector(".botnav-more");
              if (meer) meer.classList.toggle("has-dot", dot);
              // Badge-tellers op de tabs (pariteit met home), uit dezelfde bron (foryou).
              var tabs = d.tabs || {};
              [["/social", tabs.prikbord], ["/meldingen", tabs.meldingen]].forEach(function (t) {
                var el = document.querySelector('.botnav-item[data-tab="' + t[0] + '"] .tbadge');
                if (!el) return;
                var n = Number(t[1] || 0);
                if (n > 0) { el.textContent = n > 99 ? "99+" : String(n); el.removeAttribute("hidden"); }
                else el.setAttribute("hidden", "");
              });
              var ni = document.querySelector('a.navitem[href="/notificaties"]');
              if (ni) ni.classList.toggle("has-dot", dot);
              if (d.count === last) return;
              last = d.count;
              if (!kanBadge) return;
              if (d.count > 0) navigator.setAppBadge(d.count).catch(function () {});
              else navigator.clearAppBadge().catch(function () {});
            })
            .catch(function () {});
        }
        update();
        document.addEventListener("ff:page", update);
        document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") update(); });
      })();
    </script>
    <script>
      // Cmd/Ctrl+K (4.1): overal direct naar zoeken. Escape: drawer dicht (premium-audit).
      (function () {
        document.addEventListener("keydown", function (e) {
          if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); window.location.assign("/zoek"); }
          if (e.key === "Escape") {
            var t = document.getElementById("navtoggle");
            if (t && t.checked) { t.checked = false; t.dispatchEvent(new Event("change")); }
          }
        });
      })();
    </script>
    <script>
      // Offline mutation queue (Stroom-plan 2.2): mutaties zonder verbinding gaan in een
      // IndexedDB-wachtrij (volgorde behouden, mét idempotency-id uit 1.1 — dubbel
      // versturen kan dus nooit dubbele records opleveren). Flush bij online +
      // visibilitychange; Background Sync bewust niet als afhankelijkheid (iOS).
      (function () {
        if (!window.indexedDB) return;
        var DBNAME = "ff-queue", STORE = "mutaties", flushing = false;
        function openDb() {
          return new Promise(function (res, rej) {
            var r = indexedDB.open(DBNAME, 1);
            r.onupgradeneeded = function () { r.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true }); };
            r.onsuccess = function () { res(r.result); };
            r.onerror = function () { rej(r.error); };
          });
        }
        function add(item) {
          return openDb().then(function (db) {
            return new Promise(function (res, rej) {
              var tx = db.transaction(STORE, "readwrite");
              tx.objectStore(STORE).add(item);
              tx.oncomplete = function () { res(); };
              tx.onerror = function () { rej(tx.error); };
            });
          });
        }
        function all() {
          return openDb().then(function (db) {
            return new Promise(function (res, rej) {
              var q = db.transaction(STORE).objectStore(STORE).getAll();
              q.onsuccess = function () { res(q.result || []); };
              q.onerror = function () { rej(q.error); };
            });
          });
        }
        function del(id) {
          return openDb().then(function (db) {
            return new Promise(function (res, rej) {
              var tx = db.transaction(STORE, "readwrite");
              tx.objectStore(STORE).delete(id);
              tx.oncomplete = function () { res(); };
              tx.onerror = function () { rej(tx.error); };
            });
          });
        }
        function refreshBadge() {
          all().then(function (xs) { document.documentElement.classList.toggle("ff-queued", xs.length > 0); }).catch(function () {});
        }
        function bodyFrom(item) {
          if (item.kind === "json") return { body: item.body, headers: { "content-type": "application/json" } };
          var fd = new FormData();
          for (var i = 0; i < item.form.length; i++) {
            var en = item.form[i];
            if (en.file) fd.append(en.name, en.file, en.filename || "bestand");
            else fd.append(en.name, en.value);
          }
          return { body: fd, headers: undefined };
        }
        function flush() {
          if (flushing || !navigator.onLine) return;
          flushing = true;
          all().then(function (items) {
            items.sort(function (a, b) { return a.id - b.id; }); // FIFO: volgorde bewaren
            var i = 0;
            function done(verstuurd) {
              flushing = false; refreshBadge();
              if (verstuurd > 0) {
                if (window.ffInvalidate) { try { window.ffInvalidate(); } catch (e) {} }
                document.dispatchEvent(new CustomEvent("ff:flushed"));
                if (window.showToast) window.showToast(verstuurd === 1 ? "1 wachtende actie verstuurd." : verstuurd + " wachtende acties verstuurd.");
              }
            }
            function next(verstuurd) {
              if (i >= items.length) { done(verstuurd); return; }
              var it = items[i]; var b = bodyFrom(it);
              fetch(it.url, { method: "POST", credentials: "include", headers: b.headers, body: b.body, redirect: "follow" })
                .then(function (r) {
                  // 2xx/3xx = gelukt; 4xx = geweigerd (conflict/validatie) -> verwijderen,
                  // server heeft het gelogd; 5xx = later opnieuw proberen.
                  if (r.ok || (r.status >= 400 && r.status < 500)) {
                    del(it.id).then(function () { i++; next(verstuurd + (r.ok ? 1 : 0)); });
                  } else { done(verstuurd); }
                })
                .catch(function () { done(verstuurd); }); // nog steeds offline
            }
            next(0);
          }).catch(function () { flushing = false; });
        }
        window.ffQueue = { add: function (item) { return add(item).then(refreshBadge); }, flush: flush };
        window.addEventListener("online", flush);
        document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") flush(); });
        refreshBadge();
        flush();
      })();
    </script>
    <script>
      // Offline form-capture (2.2): POST-formulieren zonder verbinding gaan de wachtrij
      // in (incl. hun idem-veld — al gezet door de idem-tagger hiervóór). Bijlagen
      // (foto's) worden bewust niet gequeued. Capture-fase: vóór snackbar/spinner.
      (function () {
        document.addEventListener("submit", function (e) {
          if (navigator.onLine || !window.ffQueue) return;
          var f = e.target;
          if (!f || !f.matches || (f.getAttribute("method") || "").toLowerCase() !== "post") return;
          if (f.hasAttribute("data-no-queue")) return;
          var fd; try { fd = new FormData(f); } catch (x) { return; }
          var entries = [], hasFile = false;
          fd.forEach(function (v, k) {
            if (v && typeof v === "object" && v.size !== undefined) {
              if (v.size > 0) { hasFile = true; entries.push({ name: k, file: v, filename: v.name }); }
              // lege file-inputs overslaan
            } else entries.push({ name: k, value: String(v) });
          });
          e.preventDefault(); e.stopPropagation();
          if (hasFile) {
            if (window.showToast) window.showToast("Geen verbinding — een bijlage kan nu niet mee. Probeer het straks opnieuw.", "error");
            return;
          }
          window.ffQueue.add({ url: f.getAttribute("action") || location.href, kind: "form", form: entries, createdAt: Date.now() });
          // Verwijder-forms: item alvast verbergen (zelfde optimistic gevoel, zonder undo offline).
          if (f.matches("[data-undo]")) {
            var item = f.closest(".swipe") || f.closest(".reactie") || f.closest(".post") || f.closest("li") || f.closest("article") || f.closest(".card");
            if (item) item.style.display = "none";
          }
          if (window.showToast) window.showToast("Geen verbinding — actie staat klaar en wordt automatisch verstuurd.");
          if (window.ffHaptic) window.ffHaptic(8);
        }, true);
      })();
    </script>
    <script>
      // Install-hint (Stroom-plan 2.1): subtiele, dismissbare hint — geen popup.
      // Android/Chromium: echte install-knop via beforeinstallprompt. iOS: korte uitleg
      // (Deel -> Zet op beginscherm). In de geïnstalleerde app verschijnt dit nooit.
      (function () {
        try {
          if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true) return;
          if (document.getElementById("ffInstallBtn")) return; // home heeft al een eigen install-kaart
          var ts = 0; try { ts = Number(localStorage.getItem("ff_install_hint") || "0"); } catch (e) {}
          if (ts && Date.now() - ts < 30 * 24 * 60 * 60 * 1000) return; // max 1x per 30 dagen
          var deferred = null;
          var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
          function dismiss() {
            try { localStorage.setItem("ff_install_hint", String(Date.now())); } catch (e) {}
            var el = document.getElementById("ff-install"); if (el) el.remove();
          }
          function render() {
            if (document.getElementById("ff-install")) return;
            var bar = document.createElement("div");
            bar.id = "ff-install"; bar.className = "ff-install";
            var txt = document.createElement("span"); txt.className = "fi-txt";
            txt.textContent = isIOS
              ? "Zet Fresh Forward op je beginscherm: Deel-knop → 'Zet op beginscherm'."
              : "Zet Fresh Forward op je beginscherm voor de volledige app-ervaring.";
            bar.appendChild(txt);
            if (deferred) {
              var btn = document.createElement("button"); btn.type = "button"; btn.className = "btn fi-btn"; btn.textContent = "Installeren";
              btn.addEventListener("click", function () { try { deferred.prompt(); } catch (e) {} dismiss(); });
              bar.appendChild(btn);
            }
            var x = document.createElement("button"); x.type = "button"; x.className = "fi-x"; x.setAttribute("aria-label", "Sluiten"); x.textContent = "×";
            x.addEventListener("click", dismiss);
            bar.appendChild(x);
            document.body.appendChild(bar);
          }
          window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; render(); });
          if (isIOS) setTimeout(render, 2500); // subtiel: pas na even rondkijken
        } catch (e) {}
      })();
    </script>
  </body>
</html>`;
}

// Generieke, vriendelijke fout-/lege-staat-kaart (B1/B2).
export function errorPage(titel: string, uitleg: string, opts: { actie?: { href: string; label: string } } = {}) {
  const a = opts.actie ?? { href: "/", label: "Naar home" };
  return html`<div class="card" style="text-align:center;padding:34px 20px;max-width:460px;margin:8vh auto 0">
    <div style="display:inline-grid;place-items:center;width:56px;height:56px;border-radius:16px;background:var(--surface-2);color:var(--berry);margin-bottom:14px">
      ${raw('<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16v.5"/></svg>')}
    </div>
    <h1 style="margin:0 0 6px">${titel}</h1>
    <p class="muted" style="margin:0 0 18px">${uitleg}</p>
    <a class="btn" href="${a.href}" style="display:inline-block">${a.label}</a>
  </div>`;
}
