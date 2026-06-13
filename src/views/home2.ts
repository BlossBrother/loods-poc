// Loods-home (restyle ronde 1, zie loods-design/): standalone server-rendered
// home in de mockup-stijl — frosted header, teller-chips, BHV-banner (alleen bij
// actief alarm), Vandaag met stroomlijn+druppel, Voor jou-actiekaarten, Nieuws
// (cover + rijen), Jarig en de donkere capsule-tabbar. Tenant-tokens = FF-groen;
// structuur/spacing/motion zijn platform-vast (designsysteem §1).
import { html, raw } from "hono/html";
import { BUILD } from "../pwa";

export interface HomeChip { label: string; count?: number; route: string; icon: string }
export interface HomeVandaagItem { tijd: string; titel: string; sub: string; route: string }
export interface HomeActie { titel: string; sub: string; route: string; icon: string; cta: string }
export interface HomeNieuws { id: string; titel: string; meta: string; categorie?: string; cover?: string; nieuw: boolean }

export interface LoodsHomeData {
  groet: string;
  voornaam: string;
  initialen: string;
  profielFoto?: string;
  datumregel: string; // "woensdag 11 juni · Fresh Forward"
  chips: HomeChip[];
  alarm?: { titel: string; sub: string; route: string } | null;
  mustread?: { titel: string; sub: string; route: string } | null; // v192: leesbevestiging-banner
  vandaag: HomeVandaagItem[];
  kantine?: { titel: string; sub: string; route: string } | null;
  voorJou: HomeActie[];
  nieuws: HomeNieuws[];
  jarige?: { naam: string; datum: string; vandaag: boolean } | null;
  snelNaar: { label: string; route: string; icon: string }[];
  menu: { titel: string; items: { label: string; route: string; icon: string }[] }[];
  // v196: dynamische capsule — Home + eerste 3 ingeschakelde modules (beheer-volgorde) + Meer.
  tabs: { label: string; route: string; icon: string; count: number }[];
  pushKey: string;
}

const CSS = `
  :root{
    --t-accent:#236b41; --t-accent2:#3fa468; --t-onaccent:#ffffff;
    --accent:var(--t-accent); --accent2:var(--t-accent2);
    --grad:linear-gradient(135deg,var(--t-accent2),var(--t-accent));
    --tile:color-mix(in srgb, var(--t-accent) 10%, transparent);
    --glow:color-mix(in srgb, var(--t-accent) 24%, transparent); /* v189: glow gedempt (35→24%) */
    --menu-ink:var(--t-accent);
    --bg:#F4F7FB; --card:#FFFFFF; --card-hi:#FFFFFF; --ink:#0A0E14; --sub:#5E6B7A; --faint:#8A95A3;
    --line:rgba(10,14,20,.07);
    --alarm-grad:linear-gradient(135deg,#FF7A4D,#F23B2F);
    /* v189 (lit.: Material/Fluent): key-laag (contact) + ambient-laag (afstand), ink-getint. */
    --sh:0 1px 2px rgba(10,14,20,.05),0 6px 16px rgba(10,14,20,.06);
    --sh-soft:0 1px 2px rgba(10,14,20,.04),0 4px 12px rgba(10,14,20,.05);
    --hdr-bg:rgba(244,247,251,0); --hdr-bg-on:rgba(244,247,251,.78);
    /* Capsule-tabbar (v189): adaptief glas — licht in light, donker in dark. */
    --cap-bg:rgba(255,255,255,.78); --cap-bd:rgba(10,14,20,.08); --cap-ink:rgba(10,14,20,.66);
    --cap-ink-on:#0A0E14; --cap-blob:rgba(10,14,20,.07); --cap-shadow:0 12px 36px rgba(10,14,20,.16);
    --cap-ring:rgba(255,255,255,.92);
    /* v191 (HONK §9.1): motion-tokens, sync met shell-Laag-0 + HONK-aliassen. */
    --dur-fast:140ms; --dur-base:240ms; --ease-out:cubic-bezier(.2,.7,.3,1);
    --dur-press:var(--dur-fast); --dur-enter:420ms; --stagger:40ms; --ease-spring:var(--ease-out);
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --menu-ink:#5fbe85; /* v189: ontzadigd accent in dark */
      --bg:#0A0E14; --card:#121925; --card-hi:#232F40; --ink:#F4F7FB; --sub:#9AA6B4; --faint:#6E7A88;
      --line:rgba(244,247,251,.08);
      /* v189: dark-schaduwen gehalveerd — diepte komt van de surface-ladder (card-hi). */
      --sh:0 1px 2px rgba(0,0,0,.32),0 6px 18px rgba(0,0,0,.28);
      --sh-soft:0 1px 2px rgba(0,0,0,.25),0 4px 14px rgba(0,0,0,.25);
      --hdr-bg:rgba(10,14,20,0); --hdr-bg-on:rgba(10,14,20,.72);
      --cap-bg:rgba(13,18,26,.82); --cap-bd:rgba(255,255,255,.08); --cap-ink:rgba(255,255,255,.7);
      --cap-ink-on:#ffffff; --cap-blob:rgba(255,255,255,.14); --cap-shadow:0 12px 36px rgba(0,0,0,.4);
      --cap-ring:rgba(13,18,26,.9);
    }
  }
  :root[data-theme="dark"]{
    --menu-ink:#5fbe85; /* v189: ontzadigd accent in dark */
    --bg:#0A0E14; --card:#121925; --card-hi:#232F40; --ink:#F4F7FB; --sub:#9AA6B4; --faint:#6E7A88;
    --line:rgba(244,247,251,.08);
    /* v189: dark-schaduwen gehalveerd — diepte komt van de surface-ladder (card-hi). */
    --sh:0 1px 2px rgba(0,0,0,.32),0 6px 18px rgba(0,0,0,.28);
    --sh-soft:0 1px 2px rgba(0,0,0,.25),0 4px 14px rgba(0,0,0,.25);
    --hdr-bg:rgba(10,14,20,0); --hdr-bg-on:rgba(10,14,20,.72);
    --cap-bg:rgba(13,18,26,.82); --cap-bd:rgba(255,255,255,.08); --cap-ink:rgba(255,255,255,.7);
    --cap-ink-on:#ffffff; --cap-blob:rgba(255,255,255,.14); --cap-shadow:0 12px 36px rgba(0,0,0,.4);
    --cap-ring:rgba(13,18,26,.9);
  }
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  html,body{height:100%}
  html{height:-webkit-fill-available}
  body{background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
  a{color:inherit;text-decoration:none}
  .app{max-width:480px;margin:0 auto;min-height:100dvh;position:relative}
  .hdr{position:sticky;top:0;z-index:40;padding:calc(env(safe-area-inset-top) + 14px) 18px 12px;backdrop-filter:saturate(160%) blur(18px);-webkit-backdrop-filter:saturate(160%) blur(18px);background:var(--hdr-bg);transition:background-color .25s ease;view-transition-name:ff-header}
  .hdr.scrolled{background:var(--hdr-bg-on)}
  .hdr-row{display:flex;align-items:center;gap:13px}
  /* v185: merk-chip (logo) weg uit de header — gaf ruimte-ophoping bovenin; de
     begroeting krijgt de volle breedte. Branding blijft in icoon/menu-footer. */
  /* v179: absolute fill — sluit grid-quirks uit, exact dezelfde uitsnede als de shell-avatar. */
  .iconbtn.ava{position:relative;overflow:hidden;background:var(--grad);border:none;color:var(--t-onaccent);font-weight:800;font-size:.74rem;letter-spacing:.02em;text-decoration:none}
  .iconbtn.ava img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;display:block}
  .greet{flex:1;min-width:0}
  .greet h1{font-size:21px;font-weight:800;letter-spacing:-.4px;line-height:1.15}
  .greet p{font-size:13px;color:var(--sub);margin-top:2px}
  .iconbtn{width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:var(--card);display:grid;place-items:center;flex:none;box-shadow:var(--sh-soft);cursor:pointer}
  .iconbtn svg{width:20px;height:20px;stroke:var(--ink)}
  .chips{display:flex;gap:8px;margin-top:13px;overflow-x:auto;scrollbar-width:none}
  .chips::-webkit-scrollbar{display:none}
  .chip{display:flex;align-items:center;gap:7px;flex:none;padding:7px 13px 7px 10px;border-radius:999px;background:var(--card);border:1px solid var(--line);box-shadow:var(--sh-soft);font-size:12.5px;font-weight:600;color:var(--ink);cursor:pointer;position:relative}
  /* v191 (HONK §3.4): hit-area naar >=44px zonder visuele wijziging (chip is ~32px hoog). */
  .chip::after{content:"";position:absolute;inset:-6px -2px;border-radius:999px}
  .chip svg{width:15px;height:15px;stroke:var(--accent)}
  .chip b{min-width:18px;height:18px;border-radius:9px;background:var(--grad);color:#fff;font-size:11px;font-weight:800;display:grid;place-items:center;padding:0 5px}
  main{padding:6px 18px calc(env(safe-area-inset-bottom) + 148px)} /* v195: ruimer vrij van de capsule */
  .eyebrow{display:flex;align-items:baseline;justify-content:space-between;margin:24px 4px 10px}
  .eyebrow span{font-size:11.5px;font-weight:800;letter-spacing:1.6px;color:var(--faint)}
  .eyebrow a{font-size:13px;font-weight:600;color:var(--accent)}
  .card{background:var(--card);border:1px solid var(--line);border-radius:22px;box-shadow:var(--sh)}
  .press{transition:transform var(--dur-press,.15s) var(--ease-out,ease)}
  .press:active{transform:scale(.975)}
  @media (hover:hover){.lift{transition:transform .2s ease,box-shadow .2s ease}.lift:hover{transform:translateY(-2px)}}
  .bhv{margin-top:14px;border-radius:22px;padding:15px 16px;color:#fff;background:var(--alarm-grad);box-shadow:0 10px 28px rgba(242,59,47,.35);display:flex;align-items:center;gap:13px;position:relative}
  .bhv .tile{width:42px;height:42px;border-radius:13px;background:rgba(255,255,255,.2);display:grid;place-items:center;flex:none;animation:ring 1.7s ease-out infinite}
  @keyframes ring{0%{box-shadow:0 0 0 0 rgba(255,255,255,.45)}100%{box-shadow:0 0 0 12px rgba(255,255,255,0)}}
  .bhv .tile svg{width:22px;height:22px;stroke:#fff}
  .bhv .tx{flex:1;min-width:0}
  .bhv .tx h3{font-size:15px;font-weight:800}
  .bhv .tx p{font-size:12.5px;opacity:.92;margin-top:2px}
  .bhv .cta{flex:none;background:#fff;color:#E0382C;font-weight:700;font-size:13px;border:none;border-radius:999px;padding:9px 14px;cursor:pointer}
  .today{padding:16px 16px 14px;position:relative}
  .trow{display:flex;gap:14px;position:relative;padding:9px 0}
  .rail-wrap{width:14px;flex:none;display:flex;justify-content:center;position:relative}
  .rail{width:3px;border-radius:3px;background:var(--grad);position:absolute;top:14px;bottom:14px}
  .rail::after{content:"";position:absolute;left:50%;transform:translateX(-50%);width:9px;height:9px;border-radius:50%;background:var(--t-accent2);box-shadow:0 0 10px var(--t-accent2);animation:drop 3.4s ease-in-out infinite}
  @keyframes drop{0%{top:0;opacity:0}12%{opacity:1}82%{opacity:1}100%{top:calc(100% - 9px);opacity:0}}
  .titem{flex:1;display:flex;gap:12px;align-items:baseline;padding:9px 0;border-bottom:1px solid var(--line)}
  .titem:last-child{border-bottom:none}
  .titem time{font-size:13px;font-weight:800;color:var(--accent);font-variant-numeric:tabular-nums;flex:none;width:44px}
  .titem h4{font-size:14.5px;font-weight:700}
  .titem p{font-size:12.5px;color:var(--sub);margin-top:2px}
  .kantine{display:flex;align-items:center;gap:12px;margin-top:10px;background:var(--tile);border-radius:16px;padding:11px 12px}
  .kantine .tile{width:38px;height:38px;border-radius:12px;background:var(--card);display:grid;place-items:center;flex:none;box-shadow:var(--sh-soft)}
  .kantine .tile svg{width:19px;height:19px;stroke:var(--accent)}
  .kantine .tx{flex:1;min-width:0}
  .kantine h4{font-size:13.5px;font-weight:700}
  .kantine p{font-size:12px;color:var(--sub)}
  .pill{flex:none;border:none;border-radius:999px;padding:9px 15px;cursor:pointer;background:var(--grad);color:#fff;font-weight:700;font-size:13px;box-shadow:0 5px 14px var(--glow)}
  .acard{display:flex;align-items:center;gap:13px;padding:14px 15px;margin-bottom:10px;cursor:pointer}
  /* v192: must-read-banner — accent-tile maakt 'm zwaarder dan een gewone actiekaart. */
  .mread .tile{background:var(--grad)}
  .mread .tile svg{stroke:#fff}
  /* v193: directe tik-feedback bij verlaten van home — content dimt licht zolang de
     volgende pagina laadt (de view transition bevroor het beeld zonder enige respons). */
  html.navving main{opacity:.55;transition:opacity .2s ease}
  .acard .tile{width:42px;height:42px;border-radius:13px;background:var(--tile);display:grid;place-items:center;flex:none}
  .acard .tile svg{width:20px;height:20px;stroke:var(--accent)}
  .acard .tx{flex:1;min-width:0}
  .acard h4{font-size:14px;font-weight:700;line-height:1.3}
  .acard p{font-size:12.5px;color:var(--sub);margin-top:2px}
  .ghost{flex:none;border:1.5px solid var(--accent);background:none;color:var(--accent);font-weight:700;font-size:12.5px;border-radius:999px;padding:7px 13px;cursor:pointer}
  .qgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .qcard{display:flex;align-items:center;gap:11px;padding:13px 14px}
  .qcard .tile{width:38px;height:38px;border-radius:12px;background:var(--tile);display:grid;place-items:center;flex:none}
  .qcard .tile svg{width:18px;height:18px;stroke:var(--accent)}
  .qcard h4{font-size:13.5px;font-weight:700}
  .ncover{overflow:hidden;margin-bottom:10px;cursor:pointer;display:block}
  .cover{height:128px;background:var(--grad);position:relative;background-size:cover;background-position:center}
  .cover svg.mark{position:absolute;right:-18px;bottom:-26px;width:150px;height:150px;stroke:rgba(255,255,255,.25);fill:rgba(255,255,255,.12);transform:rotate(-8deg)}
  .cover .cat{position:absolute;left:13px;top:13px;font-size:11px;font-weight:800;letter-spacing:.6px;color:#fff;background:rgba(10,14,20,.3);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:5px 11px;border-radius:999px}
  .ncover .body{padding:13px 16px 15px}
  .ncover h4{font-size:15.5px;font-weight:800;letter-spacing:-.2px;line-height:1.3}
  .ncover p{font-size:12.5px;color:var(--sub);margin-top:4px}
  .nrow{display:flex;align-items:center;gap:12px;padding:13px 15px;margin-bottom:10px;cursor:pointer}
  .nrow .tx{flex:1;min-width:0}
  .nrow h4{font-size:14px;font-weight:700;line-height:1.3}
  .nrow p{font-size:12px;color:var(--sub);margin-top:2px}
  .nrow svg{width:17px;height:17px;stroke:var(--faint);flex:none}
  .unread{width:8px;height:8px;border-radius:50%;background:var(--grad);flex:none}
  /* v189: capsule adaptief via --cap-tokens (licht glas in light, donker in dark). */
  .wabar{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom) + 12px);z-index:50;width:calc(100% - 24px);max-width:440px;background:var(--cap-bg);backdrop-filter:saturate(150%) blur(22px);-webkit-backdrop-filter:saturate(150%) blur(22px);border:1px solid var(--cap-bd);border-radius:40px;padding:7px;display:flex;box-shadow:var(--cap-shadow);view-transition-name:ff-botnav;transform-origin:50% 100%;transition:transform .35s var(--ease-out,cubic-bezier(.2,.7,.3,1))}
  /* v191: capsule krimpt bij omlaag scrollen (pariteit met shell .botnav-inner.mini). */
  .wabar.mini{transform:translateX(-50%) translateY(6px) scale(.9)}
  /* v193: blob start op de Home-positie (eerste tab, 5 tabs) en animeert pas ná de
     eerste JS-plaatsing (.anim, zelfde patroon als shell .botnav.anim) — geen
     stotter/inschuiver meer bij de (nu instant) home-laad. */
  .blob{position:absolute;top:7px;left:0;height:calc(100% - 14px);border-radius:28px;background:var(--cap-blob);transform:translateX(var(--bx,7px));width:var(--bw,calc((100% - 14px)/var(--tabs,5)));transition:none;pointer-events:none}
  .wabar.anim .blob{transition:transform .4s cubic-bezier(.22,.72,.24,1),width .4s cubic-bezier(.22,.72,.24,1)}
  .wtab{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 0 7px;border:none;background:none;cursor:pointer;position:relative;transition:transform .15s ease}
  .wtab:active{transform:scale(.94)}
  .wtab svg{width:25px;height:25px;stroke:var(--cap-ink);transition:stroke .25s}
  .wtab span{font-size:10px;font-weight:600;color:var(--cap-ink);transition:color .25s}
  .wtab.on svg{stroke:var(--cap-ink-on)}
  .wtab.on span{color:var(--cap-ink-on)}
  .tbadge{position:absolute;top:4px;left:calc(50% + 6px);min-width:17px;height:17px;border-radius:9px;background:var(--grad);color:#fff;font-size:10px;font-weight:800;display:grid;place-items:center;padding:0 4px;border:2px solid var(--cap-ring)}
  /* Meer-menu (duim-UI): popover rechtsonder boven de capsule + scrim. */
  .wmenu{position:fixed;right:12px;bottom:calc(env(safe-area-inset-bottom) + 86px);z-index:60;width:min(74vw,272px);max-height:min(60vh,520px);overflow-y:auto;background:var(--card-hi);border:1px solid var(--line);border-radius:18px;box-shadow:var(--sh);padding:8px;transform-origin:bottom right;transform:translateY(14px) scale(.7);opacity:0;pointer-events:none;transition:transform .22s cubic-bezier(.34,1.26,.64,1),opacity .15s}
  .wmenu.open{transform:none;opacity:1;pointer-events:auto}
  .wmenu a{display:flex;align-items:center;gap:11px;padding:11px 12px;border-radius:12px;font-weight:600;font-size:.95rem;line-height:20px;color:var(--ink)}
  .wmenu a svg{width:20px;height:20px;stroke:var(--menu-ink);flex:none}
  .wmenu a:active{background:var(--tile)}
  .wmenu .wm-t{font-size:.64rem;font-weight:800;letter-spacing:1.2px;color:var(--faint);text-transform:uppercase;padding:10px 12px 4px;line-height:14px}
  .wmenu .wm-v{padding:10px 12px 6px;font-size:.68rem;color:var(--faint);letter-spacing:.02em;line-height:16px}
  .wscrim{position:fixed;inset:0;z-index:55;background:rgba(0,0,0,.38);opacity:0;pointer-events:none;transition:opacity .15s}
  .wscrim.show{opacity:1;pointer-events:auto}
  /* Vandaag met precies één item: rail en regel netjes gecentreerd. */
  .trow:has(.titem:only-child) .rail{top:10px;bottom:10px}
  .titem:only-child{padding:13px 0}
  .up{opacity:0;transform:translateY(14px);animation:rise var(--dur-enter,.42s) var(--ease-spring,cubic-bezier(.2,.7,.2,1)) forwards;animation-delay:var(--d,0s)}
  @keyframes rise{to{opacity:1;transform:none}}
  /* v195 (review #4): entrance-stagger alleen bij het éérste home-bezoek van de sessie —
     bij terugkeer staat alles er direct (geen "pop-in" bij elke tab-switch). */
  :root.ff-revisit .up{animation:none;opacity:1;transform:none}
  /* v191 (HONK C2): UI-chroom niet selecteerbaar, geen long-press-menu; content wel. */
  .iconbtn,.chip,.wabar,.wmenu,.pill,.ghost,.cta{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
  /* v191: cross-document View Transitions — pariteit met de shell (layout.ts §motion).
     Beide documenten hebben de at-rule nodig; content fadet, header/capsule blijven staan. */
  @view-transition { navigation: auto; }
  main{view-transition-name:page}
  ::view-transition-old(root),::view-transition-new(root){animation:none}
  /* v195: sequentieel (sync met shell) — geen dubbele belichting; FAB geïsoleerd. */
  ::view-transition-group(page){animation:none}
  ::view-transition-old(page){animation:vt-out .11s ease-out both}
  ::view-transition-new(page){animation:vt-in .16s ease-out .09s both}
  @keyframes vt-out{to{opacity:0}}
  @keyframes vt-in{from{opacity:0;transform:translateY(8px)}}
  ::view-transition-group(ff-fab){animation:none}
  ::view-transition-old(ff-fab){animation:vt-out .11s ease-out both}
  ::view-transition-new(ff-fab){animation:vt-in .16s ease-out .09s both}
  /* v197: nieuwe header/capsule direct, oude verborgen (zie layout.ts — sync!). */
  ::view-transition-group(ff-header),::view-transition-group(ff-botnav){animation:none}
  ::view-transition-old(ff-header),::view-transition-old(ff-botnav){animation:none;opacity:0;mix-blend-mode:normal}
  ::view-transition-new(ff-header),::view-transition-new(ff-botnav){animation:none;opacity:1;mix-blend-mode:normal}
  @media (prefers-reduced-motion: reduce){
    .up{animation:none;opacity:1;transform:none}
    .rail::after,.bhv .tile{animation:none}
    .blob,.press,.wtab,.wabar{transition:none}
    ::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none !important}
  }
  /* Desktop-pariteit met de shell: zijbalk links (zelfde menu-data), content rechts. */
  .hside{display:none}
  @media (min-width:881px){
    /* Zelfde maximale breedte als de shell (1500px); content vult de ruimte. */
    .shellx{display:grid;grid-template-columns:236px minmax(0,1fr);max-width:1500px;margin:0 auto;align-items:start}
    .hside{display:block;position:sticky;top:0;height:100dvh;overflow-y:auto;padding:18px 12px;border-right:1px solid var(--line);scrollbar-width:none}
    .hside::-webkit-scrollbar{display:none}
    .hs-t{font-size:.66rem;text-transform:uppercase;letter-spacing:.06em;color:var(--sub);font-weight:700;padding:14px 12px 6px}
    .hs-item{display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:12px;text-decoration:none;color:var(--ink);font-weight:620;font-size:.92rem}
    .hs-item:hover{background:var(--tile)}
    .hs-item svg{width:21px;height:21px;stroke:var(--menu-ink);flex:none}
    .hs-v{padding:14px 12px 6px;font-size:.68rem;color:var(--faint);letter-spacing:.02em}
    .hs-item.on{background:var(--grad);color:#fff}
    .hs-item.on svg{stroke:#fff}
    .app{max-width:none;margin:0;min-height:100dvh}
    .hdr{padding-left:28px;padding-right:28px}
    .wabar,.wmenu,.wscrim{display:none}
    main{padding:6px 28px 48px}
    .qgrid{grid-template-columns:repeat(4,1fr)}
  }
`;

const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></symbol>
  <symbol id="i-alert" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></symbol>
  <symbol id="i-coffee" viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></symbol>
  <symbol id="i-msg" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></symbol>
  <symbol id="i-bell" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></symbol>
  <symbol id="i-award" viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></symbol>
  <symbol id="i-file" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></symbol>
  <symbol id="i-chev" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></symbol>
  <symbol id="i-home" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></symbol>
  <symbol id="i-cal" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></symbol>
  <symbol id="i-users" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></symbol>
  <symbol id="i-ball" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m12 7 3.2 2.3-1.2 3.7H10L8.8 9.3 12 7Z"/><path d="M12 7V3.5M15.2 9.3l3.3-1.1M14 13l2 3M10 13l-2 3M8.8 9.3 5.5 8.2"/></symbol>
  <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></symbol>
  <symbol id="i-brief" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></symbol>
  <symbol id="i-cake" viewBox="0 0 24 24"><path d="M4 21h16v-7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2Z"/><path d="M4 16.5c1.3 1 2.7 1 4 0s2.7-1 4 0 2.7 1 4 0 2.7-1 4 0"/><path d="M8 12V9.5M12 12V9.5M16 12V9.5"/><path d="M8 7V6M12 7V6M16 7V6"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></symbol>
  <symbol id="i-book" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></symbol>
  <symbol id="i-menu" viewBox="0 0 24 24"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></symbol>
  <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 19c0-3.6 2.9-5.5 6.5-5.5S18.5 15.4 18.5 19"/></symbol>
  <symbol id="i-bug" viewBox="0 0 24 24"><path d="M9 7.5v-1a3 3 0 0 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6Z"/><path d="M12 11v9M6 13H3M6 9.5 3.5 7M6 17l-2.5 2.5M18 13h3M18 9.5 20.5 7M18 17l2.5 2.5"/></symbol>
  <symbol id="i-cog" viewBox="0 0 24 24"><path d="M4 6h9M19 6h1M4 12h1M11 12h9M4 18h6M16 18h4"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="18" r="2"/></symbol>
</defs></svg>`;

const SCRIPT = `<script>
(function(){
  var hdr=document.getElementById("hdr");
  var lastY=0;
  addEventListener("scroll",function(){
    var y=scrollY||0;
    hdr.classList.toggle("scrolled",y>8);
    var wb=document.getElementById("wabar");
    if(wb)wb.classList.toggle("mini",y>lastY&&y>80); // v191: capsule krimpt bij omlaag scrollen
    lastY=y;
  },{passive:true});
  // v191: haptiek-pariteit met de shell — korte tik bij navigatie-/actie-taps.
  var haps=document.getElementById("ff-haptic-switch");
  function hap(p){try{if(navigator.vibrate&&navigator.vibrate(p||6))return}catch(e){}try{if(haps)haps.checked=!haps.checked}catch(e){}}
  document.addEventListener("click",function(e){
    var t=e.target.closest?e.target.closest(".wtab,.chip,.iconbtn,.pill,.ghost,.qcard,.acard,.titem,.kantine"):null;
    if(t)hap(6);
  },true);
  var bar=document.getElementById("wabar");
  if(bar){
    var blob=document.getElementById("blob");
    function place(el){if(!el)return;blob.style.setProperty("--bx",el.offsetLeft+"px");blob.style.setProperty("--bw",el.offsetWidth+"px")}
    function init(){place(bar.querySelector(".wtab.on"))}
    requestAnimationFrame(function(){init();requestAnimationFrame(function(){bar.classList.add("anim")})});
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(init);
    addEventListener("load",init);addEventListener("resize",init);
    // v193: geen 240ms-uitstel meer bij een tab-tik — dat was vóór de View Transitions
    // (v191) nodig voor de glide, maar is nu pure vertraging bovenop de netwerkladen.
    // De blob verspringt nog wél direct (tactiele feedback), de browser navigeert meteen;
    // header + capsule blijven staan via de cross-doc view transition.
    bar.addEventListener("click",function(e){
      var t=e.target.closest?e.target.closest("a.wtab"):null;
      if(!t)return;
      place(t);
      if(!t.classList.contains("on"))document.documentElement.classList.add("navving");
    });
    // Ballon-menu-links: zelfde laad-dim. Terug via back/bfcache: dim weer weg.
    var wm=document.getElementById("wmenu");
    if(wm)wm.addEventListener("click",function(e){
      if(e.target.closest&&e.target.closest("a[href]"))document.documentElement.classList.add("navving");
    });
    addEventListener("pageshow",function(){document.documentElement.classList.remove("navving")});
    // Meer-menu (duim-UI): popover boven de capsule; blob volgt naar Meer en terug.
    var menu=document.getElementById("wmenu"),scrim=document.getElementById("wscrim"),more=document.getElementById("wmore");
    function setMenu(open){
      if(!menu)return;
      menu.classList.toggle("open",open);
      menu.setAttribute("aria-hidden",open?"false":"true");
      if(more)more.setAttribute("aria-expanded",open?"true":"false");
      if(scrim)scrim.classList.toggle("show",open);
      if(open&&more)place(more);else init();
    }
    if(more)more.addEventListener("click",function(){setMenu(!menu.classList.contains("open"))});
    if(scrim)scrim.addEventListener("click",function(){setMenu(false)});
    addEventListener("keydown",function(e){if(e.key==="Escape")setMenu(false)});
  }
  if("serviceWorker" in navigator){try{navigator.serviceWorker.register("/sw.js")}catch(e){}}
})();
</script>`;

const PUSH_SCRIPT = `<script>
(function(){
  var KEY=window.FF_VAPID, card=document.getElementById("ffPush");
  if(!card||!KEY) return;
  if(!("serviceWorker" in navigator)||!("PushManager" in window)||!("Notification" in window)) return;
  var btn=document.getElementById("ffPushBtn");
  function b64(s){ s=s.replace(/-/g,"+").replace(/_/g,"/"); var pad="=".repeat((4-s.length%4)%4); var raw=atob(s+pad); var o=new Uint8Array(raw.length); for(var i=0;i<raw.length;i++)o[i]=raw.charCodeAt(i); return o; }
  // v190: sleutelrotatie-herstel — hoort het bestaande abonnement bij een ándere
  // (oude) VAPID-sleutel, meld het dan af en toon het aanzet-kaartje opnieuw.
  navigator.serviceWorker.ready.then(function(reg){ return reg.pushManager.getSubscription(); }).then(function(sub){
    var toon=function(){ if(Notification.permission!=="denied") card.style.display="flex"; };
    if(!sub){ toon(); return; }
    try{
      var cur=sub.options&&sub.options.applicationServerKey?new Uint8Array(sub.options.applicationServerKey):null;
      var want=b64(KEY);
      var zelfde=!!cur&&cur.length===want.length;
      if(zelfde){ for(var i=0;i<cur.length;i++){ if(cur[i]!==want[i]){ zelfde=false; break; } } }
      if(!zelfde){ sub.unsubscribe().then(toon).catch(toon); }
    }catch(e){ /* oude browser zonder sub.options: laten staan */ }
  });
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

function ico(id: string, sw = 1.8) {
  return raw('<svg fill="none" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round"><use href="#i-' + id + '"/></svg>');
}

// ===================== v198: home-in-de-shell =====================
// Home draait voortaan als gewone SPA-pagina in de shell (layout.ts) — terug naar
// home is dan een content-swap zonder paginaherlaad (de structurele fix voor het
// stotteren, video's 12/6). De home-FEEL blijft: zelfde tokens, kaarten, chips,
// vandaag-rail en stagger (via de shell-entrance). De begroeting scrolt mee als
// content-hero (Today-patroon); zoek/avatar zitten in de vaste shell-balk.
// loodsHome (hierboven) blijft bestaan als rollback-pad.

export const HOME_SHELL_CSS = `
  .hm{
    --t-accent:#236b41; --t-accent2:#3fa468; --t-onaccent:#ffffff;
    --hm-accent:var(--t-accent);
    --grad:linear-gradient(135deg,var(--t-accent2),var(--t-accent));
    --tile:color-mix(in srgb, var(--t-accent) 10%, transparent);
    --glow:color-mix(in srgb, var(--t-accent) 24%, transparent);
    --hm-card:#FFFFFF; --hm-ink:#0A0E14; --hm-sub:#5E6B7A; --hm-faint:#8A95A3;
    --hm-line:rgba(10,14,20,.07);
    --alarm-grad:linear-gradient(135deg,#FF7A4D,#F23B2F);
    --hm-sh:0 1px 2px rgba(10,14,20,.05),0 6px 16px rgba(10,14,20,.06);
    --hm-sh-soft:0 1px 2px rgba(10,14,20,.04),0 4px 12px rgba(10,14,20,.05);
    color:var(--hm-ink);
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]) .hm{
      --hm-card:#121925; --hm-ink:#F4F7FB; --hm-sub:#9AA6B4; --hm-faint:#6E7A88;
      --hm-line:rgba(244,247,251,.08);
      --hm-sh:0 1px 2px rgba(0,0,0,.32),0 6px 18px rgba(0,0,0,.28);
      --hm-sh-soft:0 1px 2px rgba(0,0,0,.25),0 4px 14px rgba(0,0,0,.25);
    }
  }
  :root[data-theme="dark"] .hm{
    --hm-card:#121925; --hm-ink:#F4F7FB; --hm-sub:#9AA6B4; --hm-faint:#6E7A88;
    --hm-line:rgba(244,247,251,.08);
    --hm-sh:0 1px 2px rgba(0,0,0,.32),0 6px 18px rgba(0,0,0,.28);
    --hm-sh-soft:0 1px 2px rgba(0,0,0,.25),0 4px 14px rgba(0,0,0,.25);
  }
  .hm a{color:inherit;text-decoration:none}
  .hm h1,.hm h3,.hm h4,.hm p{margin:0}
  .hm .greet{margin:6px 4px 0}
  .hm .greet h1{font-size:21px;font-weight:800;letter-spacing:-.4px;line-height:1.15}
  .hm .greet p{font-size:13px;color:var(--hm-sub);margin-top:2px}
  /* v207: alleen HORIZONTAAL scrollen — de 44px-hit-area (::after, -6px) stak
     boven/onder uit en maakte de rij ook verticaal sleepbaar. Verticale padding
     vangt de hit-area op; overflow-y expliciet dicht + pan-x. */
  .hm .chips{display:flex;gap:8px;margin:7px 0 -4px;padding:6px 0;overflow-x:auto;overflow-y:hidden;touch-action:pan-x;scrollbar-width:none}
  .hm .chips::-webkit-scrollbar{display:none}
  .hm .chip{display:flex;align-items:center;gap:7px;flex:none;padding:7px 13px 7px 10px;border-radius:999px;background:var(--hm-card);border:1px solid var(--hm-line);box-shadow:var(--hm-sh-soft);font-size:12.5px;font-weight:600;color:var(--hm-ink);cursor:pointer;position:relative}
  .hm .chip::after{content:"";position:absolute;inset:-6px -2px;border-radius:999px}
  .hm .chip svg{width:15px;height:15px;stroke:var(--hm-accent)}
  .hm .chip b{min-width:18px;height:18px;border-radius:9px;background:var(--grad);color:#fff;font-size:11px;font-weight:800;display:grid;place-items:center;padding:0 5px}
  .hm .eyebrow{display:flex;align-items:baseline;justify-content:space-between;margin:24px 4px 10px}
  .hm .eyebrow span{font-size:11.5px;font-weight:800;letter-spacing:1.6px;color:var(--hm-faint)}
  .hm .eyebrow a{font-size:13px;font-weight:600;color:var(--hm-accent)}
  .hm .card{padding:0;margin:0;background:var(--hm-card);border:1px solid var(--hm-line);border-radius:22px;box-shadow:var(--hm-sh);color:var(--hm-ink)}
  .hm .press{transition:transform var(--dur-press,.15s) var(--ease-out,ease)}
  .hm .press:active{transform:scale(.975)}
  @media (hover:hover){.hm .lift{transition:transform .2s ease,box-shadow .2s ease}.hm .lift:hover{transform:translateY(-2px)}}
  .hm .bhv{margin-top:14px;border-radius:22px;padding:15px 16px;color:#fff;background:var(--alarm-grad);box-shadow:0 10px 28px rgba(242,59,47,.35);display:flex;align-items:center;gap:13px;position:relative}
  .hm .bhv .tile{width:42px;height:42px;border-radius:13px;background:rgba(255,255,255,.2);display:grid;place-items:center;flex:none;animation:hmring 1.7s ease-out infinite}
  @keyframes hmring{0%{box-shadow:0 0 0 0 rgba(255,255,255,.45)}100%{box-shadow:0 0 0 12px rgba(255,255,255,0)}}
  .hm .bhv .tile svg{width:22px;height:22px;stroke:#fff}
  .hm .bhv .tx{flex:1;min-width:0}
  .hm .bhv .tx h3{font-size:15px;font-weight:800}
  .hm .bhv .tx p{font-size:12.5px;opacity:.92;margin-top:2px}
  .hm .bhv .cta{flex:none;background:#fff;color:#E0382C;font-weight:700;font-size:13px;border:none;border-radius:999px;padding:9px 14px;cursor:pointer}
  .hm .today{padding:16px 16px 14px;position:relative}
  .hm .trow{display:flex;gap:14px;position:relative;padding:9px 0}
  .hm .rail-wrap{width:14px;flex:none;display:flex;justify-content:center;position:relative}
  .hm .rail{width:3px;border-radius:3px;background:var(--grad);position:absolute;top:14px;bottom:14px}
  .hm .rail::after{content:"";position:absolute;left:50%;transform:translateX(-50%);width:9px;height:9px;border-radius:50%;background:var(--t-accent2);box-shadow:0 0 10px var(--t-accent2);animation:hmdrop 3.4s ease-in-out infinite}
  @keyframes hmdrop{0%{top:0;opacity:0}12%{opacity:1}82%{opacity:1}100%{top:calc(100% - 9px);opacity:0}}
  .hm .titem{flex:1;display:flex;gap:12px;align-items:baseline;padding:9px 0;border-bottom:1px solid var(--hm-line)}
  .hm .titem:last-child{border-bottom:none}
  .hm .titem time{font-size:13px;font-weight:800;color:var(--hm-accent);font-variant-numeric:tabular-nums;flex:none;width:44px}
  .hm .titem h4{font-size:14.5px;font-weight:700}
  .hm .titem p{font-size:12.5px;color:var(--hm-sub);margin-top:2px}
  .hm .trow:has(.titem:only-child) .rail{top:10px;bottom:10px}
  .hm .titem:only-child{padding:13px 0}
  /* v204: one-tap statusvraag ("Waar werk je vandaag?") bovenin de vandaag-kaart. */
  .hm .wwv{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:2px 0 11px;border-bottom:1px solid var(--hm-line);margin-bottom:6px}
  .hm .wwv-q{font-size:13.5px;font-weight:700}
  .hm .wwv-b{display:flex;gap:6px;margin-left:auto}
  .hm .wwv-b button{border:1.5px solid var(--hm-accent);background:none;color:var(--hm-accent);font-weight:700;font-size:12px;border-radius:999px;padding:6px 12px;cursor:pointer;font-family:inherit}
  .hm .wwv-b button:active{transform:scale(.95)}
  .hm .kantine{display:flex;align-items:center;gap:12px;margin-top:10px;background:var(--tile);border-radius:16px;padding:11px 12px}
  .hm .kantine .tile{width:38px;height:38px;border-radius:12px;background:var(--hm-card);display:grid;place-items:center;flex:none;box-shadow:var(--hm-sh-soft)}
  .hm .kantine .tile svg{width:19px;height:19px;stroke:var(--hm-accent)}
  .hm .kantine .tx{flex:1;min-width:0}
  .hm .kantine h4{font-size:13.5px;font-weight:700}
  .hm .kantine p{font-size:12px;color:var(--hm-sub)}
  .hm .hpill{flex:none;border:none;border-radius:999px;padding:9px 15px;cursor:pointer;background:var(--grad);color:#fff;font-weight:700;font-size:13px;box-shadow:0 5px 14px var(--glow)}
  .hm .acard{display:flex;align-items:center;gap:13px;padding:14px 15px;margin-bottom:10px;cursor:pointer}
  .hm .acard .tile{width:42px;height:42px;border-radius:13px;background:var(--tile);display:grid;place-items:center;flex:none}
  .hm .acard .tile svg{width:20px;height:20px;stroke:var(--hm-accent)}
  .hm .acard .tx{flex:1;min-width:0}
  .hm .acard h4{font-size:14px;font-weight:700;line-height:1.3}
  .hm .acard p{font-size:12.5px;color:var(--hm-sub);margin-top:2px}
  /* v211: pulse-kaart (anonieme peiling) in de feed. */
  .hm .pulse{margin-bottom:10px}
  .hm .pulse h4{font-size:14px;font-weight:700;line-height:1.3}
  .hm .pulse-anon{font-size:11.5px;color:var(--hm-sub);margin-top:3px}
  .hm .pulse-opts{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
  .hm .pulse-b{flex:1 1 auto;min-width:44px;min-height:44px;border:1px solid var(--hm-line);background:var(--hm-card);border-radius:13px;font-weight:700;font-size:15px;color:var(--hm-ink);cursor:pointer}
  .hm .pulse-b:active{transform:scale(.96)}
  .hm .pulse-keuze{flex:1 1 100%;min-height:42px;font-size:13.5px}
  .hm .pulse-scale{display:flex;justify-content:space-between;font-size:11px;color:var(--hm-sub);margin-top:6px;padding:0 2px}
  .hm .mread .tile{background:var(--grad)}
  .hm .mread .tile svg{stroke:#fff}
  .hm .hghost{flex:none;border:1.5px solid var(--hm-accent);background:none;color:var(--hm-accent);font-weight:700;font-size:12.5px;border-radius:999px;padding:7px 13px;cursor:pointer}
  .hm .qgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .hm .qcard{display:flex;align-items:center;gap:11px;padding:13px 14px}
  .hm .qcard .tile{width:38px;height:38px;border-radius:12px;background:var(--tile);display:grid;place-items:center;flex:none}
  .hm .qcard .tile svg{width:18px;height:18px;stroke:var(--hm-accent)}
  .hm .qcard h4{font-size:13.5px;font-weight:700}
  .hm .ncover{overflow:hidden;margin-bottom:10px;cursor:pointer;display:block}
  .hm .cover{height:128px;background:var(--grad);position:relative;background-size:cover;background-position:center}
  .hm .cover svg.mark{position:absolute;right:-18px;bottom:-26px;width:150px;height:150px;stroke:rgba(255,255,255,.25);fill:rgba(255,255,255,.12);transform:rotate(-8deg)}
  .hm .cover .cat{position:absolute;left:13px;top:13px;font-size:11px;font-weight:800;letter-spacing:.6px;color:#fff;background:rgba(10,14,20,.3);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:5px 11px;border-radius:999px}
  .hm .ncover .body{padding:13px 16px 15px}
  .hm .ncover h4{font-size:15.5px;font-weight:800;letter-spacing:-.2px;line-height:1.3}
  .hm .ncover p{font-size:12.5px;color:var(--hm-sub);margin-top:4px}
  .hm .nrow{display:flex;align-items:center;gap:12px;padding:13px 15px;margin-bottom:10px;cursor:pointer}
  .hm .nrow .tx{flex:1;min-width:0}
  .hm .nrow h4{font-size:14px;font-weight:700;line-height:1.3}
  .hm .nrow p{font-size:12px;color:var(--hm-sub);margin-top:2px}
  .hm .nrow svg{width:17px;height:17px;stroke:var(--hm-faint);flex:none}
  .hm .unread{width:8px;height:8px;border-radius:50%;background:var(--grad);flex:none}
  @media (min-width:881px){.hm .qgrid{grid-template-columns:repeat(4,1fr)}}
  @media (prefers-reduced-motion: reduce){.hm .rail::after,.hm .bhv .tile{animation:none}}
`;

export interface HomeShellData {
  groet: string;
  voornaam: string;
  datumregel: string;
  chips: HomeChip[];
  alarm?: { titel: string; sub: string; route: string } | null;
  mustread?: { titel: string; sub: string; route: string } | null;
  vandaag: HomeVandaagItem[];
  kantine?: { titel: string; sub: string; route: string } | null;
  // v205: afwezigen verhuisd naar een header-chip ("Vandaag", teller) — PJ vond de
  // rij in de kaart te dominant; de one-tap-vraag hieronder blijft de actie.
  statusVraag?: boolean; // v204: one-tap "Waar werk je vandaag?" (ma-vr, nog niet ingevuld)
  // v211: anonieme pulse-vraag als kaart in de feed (alleen tonen als nog niet beantwoord).
  pulse?: { id: string; vraag: string; type: "schaal" | "keuze"; opties: string[] } | null;
  voorJou: HomeActie[];
  nieuws: HomeNieuws[];
  jarige?: { naam: string; datum: string; vandaag: boolean } | null;
  snelNaar: { label: string; route: string; icon: string }[];
  pushKey: string;
}

export function homeShellContent(d: HomeShellData) {
  return html`${raw(SPRITE)}
<div class="hm">
  <div class="greet"><h1>${d.groet}${d.voornaam ? `, ${d.voornaam}` : ""}</h1><p>${d.datumregel}</p></div>
  <div class="chips">
    ${d.chips.map((ch) => html`<a class="chip press" href="${ch.route}">${ico(ch.icon, 2)}${ch.label}${ch.count ? html` <b>${ch.count}</b>` : ""}</a>`)}
  </div>
  ${d.alarm
    ? html`<a class="bhv" href="${d.alarm.route}">
        <span class="tile">${ico("alert", 2)}</span>
        <span class="tx"><h3>${d.alarm.titel}</h3><p>${d.alarm.sub}</p></span>
        <span class="cta">Bekijk</span>
      </a>`
    : ""}
  ${d.mustread
    ? html`<a class="card acard mread lift press" href="${d.mustread.route}" style="margin-top:14px">
        <span class="tile">${ico("check", 2)}</span>
        <span class="tx"><h4>${d.mustread.titel}</h4><p>${d.mustread.sub}</p></span>
        <span class="hghost">Lees</span>
      </a>`
    : ""}
  ${!d.alarm && !d.mustread && d.vandaag.length === 0 && !d.kantine && d.voorJou.length === 0
    ? html`<div class="card acard" style="margin-top:14px">
        <span class="tile">${ico("check", 2)}</span>
        <span class="tx"><h4>Alles is bij</h4><p>Geen acties die op je wachten vandaag.</p></span>
      </div>`
    : ""}
  ${d.vandaag.length > 0 || d.kantine || d.statusVraag
    ? html`<div class="eyebrow"><span>VANDAAG</span><a href="/agenda">Agenda &rarr;</a></div>
      <div class="card today">
        ${d.statusVraag
          ? html`<form class="wwv" method="post" action="/vandaag" data-no-queue>
              <input type="hidden" name="terug" value="/" />
              <span class="wwv-q">Waar werk je vandaag?</span>
              <span class="wwv-b">
                <button name="status" value="kantoor">Kantoor</button>
                <button name="status" value="thuis">Thuis</button>
                <button name="status" value="onderweg">Op pad</button>
              </span>
            </form>`
          : ""}
        ${d.vandaag.length > 0
          ? html`<div class="trow">
              <div class="rail-wrap"><div class="rail"></div></div>
              <div style="flex:1">
                ${d.vandaag.map((t) => html`<a class="titem" href="${t.route}"><time>${t.tijd}</time><span><h4>${t.titel}</h4>${t.sub ? html`<p>${t.sub}</p>` : ""}</span></a>`)}
              </div>
            </div>`
          : ""}
        ${d.kantine
          ? html`<a class="kantine press" href="${d.kantine.route}">
              <span class="tile">${ico("coffee")}</span>
              <span class="tx"><h4>${d.kantine.titel}</h4><p>${d.kantine.sub}</p></span>
              <span class="hpill">Bestel</span>
            </a>`
          : ""}
      </div>`
    : ""}
  ${d.pulse
    ? html`<div class="eyebrow"><span>EVEN PEILEN</span></div>
      <form class="card pulse" method="post" action="/pulse/antwoord" data-no-queue>
        <input type="hidden" name="terug" value="/" />
        <input type="hidden" name="id" value="${d.pulse.id}" />
        <h4>${d.pulse.vraag}</h4>
        <p class="pulse-anon">Anoniem · resultaten vanaf 5 reacties</p>
        <div class="pulse-opts">
          ${d.pulse.type === "schaal"
            ? [1, 2, 3, 4, 5].map((n) => html`<button name="waarde" value="${n}" class="pulse-b">${n}</button>`)
            : d.pulse.opties.map((o) => html`<button name="waarde" value="${o}" class="pulse-b pulse-keuze">${o}</button>`)}
        </div>
        ${d.pulse.type === "schaal" ? html`<div class="pulse-scale"><span>Oneens</span><span>Eens</span></div>` : ""}
      </form>`
    : ""}
  ${d.voorJou.length > 0
    ? html`<div class="eyebrow"><span>VOOR JOU</span><a href="/voor-jou">Alles &rarr;</a></div>
      ${d.voorJou.map((a) => html`<a class="card acard lift press" href="${a.route}">
        <span class="tile">${ico(a.icon)}</span>
        <span class="tx"><h4>${a.titel}</h4>${a.sub ? html`<p>${a.sub}</p>` : ""}</span>
        <span class="hghost">${a.cta}</span>
      </a>`)}`
    : ""}
  ${d.nieuws.length > 0
    ? html`<div class="eyebrow"><span>NIEUWS</span><a href="/nieuws">Alle berichten &rarr;</a></div>
      ${d.nieuws.slice(0, 1).map((n) => html`<a class="card ncover lift press" href="/nieuws#nieuws-${n.id}">
        <div class="cover"${n.cover ? raw(` style="background-image:url('${n.cover.replace(/'/g, "%27")}')"`) : ""}>
          ${n.cover ? "" : html`<svg class="mark"><use href="#i-file"/></svg>`}
          ${n.categorie ? html`<span class="cat">${n.categorie.toUpperCase()}</span>` : ""}
        </div>
        <div class="body"><h4>${n.titel}</h4><p>${n.meta}</p></div>
      </a>`)}
      ${d.nieuws.slice(1, 3).map((n) => html`<a class="card nrow lift press" href="/nieuws#nieuws-${n.id}">
        ${n.nieuw ? html`<span class="unread"></span>` : ""}
        <span class="tx"><h4>${n.titel}</h4><p>${n.meta}</p></span>
        ${ico("chev", 2)}
      </a>`)}`
    : ""}
  ${d.jarige
    ? html`<div class="eyebrow"><span>TEAM</span></div>
      <a class="card acard lift press" href="/smoelenboek">
        <span class="tile">${ico("cake")}</span>
        <span class="tx"><h4>${d.jarige.naam} is ${d.jarige.vandaag ? "vandaag" : "binnenkort"} jarig</h4><p>${d.jarige.datum}</p></span>
      </a>`
    : ""}
  ${d.snelNaar.length > 0
    ? html`<div class="eyebrow"><span>SNEL NAAR</span></div>
      <div class="qgrid">
        ${d.snelNaar.map((m) => html`<a class="card qcard press" href="${m.route}"><span class="tile">${ico(m.icon)}</span><h4>${m.label}</h4></a>`)}
      </div>`
    : ""}
  ${d.pushKey
    ? html`<div id="ffPush" class="card acard" style="display:none;margin-top:14px">
        <span class="tile">${ico("bell")}</span>
        <span class="tx"><h4>Meldingen aanzetten</h4><p>Krijg een seintje bij nieuw nieuws.</p></span>
        <button type="button" id="ffPushBtn" class="hghost">Aanzetten</button>
      </div>
      ${raw(`<script>window.FF_VAPID=${JSON.stringify(d.pushKey)};</script>`)}
      ${raw(PUSH_SCRIPT)}`
    : ""}
</div>`;
}

export function loodsHome(d: LoodsHomeData) {
  // v191 (HONK §10.1): stagger 40ms, gemaximeerd op 6 stappen — daarna geen extra vertraging.
  let delay = 0.04;
  const dly = () => { const v = delay.toFixed(2); if (delay < 0.28) delay += 0.04; return v; };
  return html`<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#F4F7FB">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0A0E14">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Fresh Forward">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icon-192.png?v=ff4">
<link rel="icon" href="/icon-192.png?v=ff4">
<title>Fresh Forward</title>
${raw('<script>(function(){try{var t=localStorage.getItem("ff_theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t);}catch(e){}try{if(sessionStorage.getItem("ff_h1"))document.documentElement.classList.add("ff-revisit");else sessionStorage.setItem("ff_h1","1");}catch(e){}})();</script>')}
<style>${raw(CSS)}</style>
</head>
<body>
${raw(SPRITE)}
<input type="checkbox" switch id="ff-haptic-switch" aria-hidden="true" tabindex="-1" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0" />
<div class="shellx">
<aside class="hside" aria-label="Hoofdnavigatie (desktop)">
  <nav>
    <a class="hs-item on" href="/" aria-current="page">${ico("home")}Home</a>
    <a class="hs-item" href="/zoek">${ico("search")}Zoeken</a>
    ${d.menu.map((g) => html`<div class="hs-t">${g.titel}</div>${g.items.map((it) => html`<a class="hs-item" href="${it.route}">${ico(it.icon)}${it.label}</a>`)}`)}
    <div class="hs-v">Fresh Forward · ${BUILD}</div>
  </nav>
</aside>
<div class="app">
  <header class="hdr" id="hdr">
    <div class="hdr-row">
      <div class="greet">
        <h1>${d.groet}${d.voornaam ? `, ${d.voornaam}` : ""}</h1>
        <p>${d.datumregel}</p>
      </div>
      <a class="iconbtn press" href="/zoek" aria-label="Zoeken">${ico("search")}</a>
      <a class="iconbtn ava press" href="/mijn-account" aria-label="Mijn profiel">${d.profielFoto ? html`<img src="${d.profielFoto}" alt="" width="44" height="44" decoding="async" fetchpriority="high" />` : d.initialen}</a>
    </div>
    <div class="chips">
      ${d.chips.map((ch) => html`<a class="chip press" href="${ch.route}">${ico(ch.icon, 2)}${ch.label}${ch.count ? html` <b>${ch.count}</b>` : ""}</a>`)}
    </div>
  </header>
  <main>
    ${d.alarm
      ? html`<a class="bhv up" href="${d.alarm.route}" style="--d:${dly()}s">
          <div class="tile">${ico("alert", 2)}</div>
          <div class="tx"><h3>${d.alarm.titel}</h3><p>${d.alarm.sub}</p></div>
          <span class="cta">Bekijk</span>
        </a>`
      : ""}
    ${d.mustread
      ? html`<a class="card acard mread lift press up" href="${d.mustread.route}" style="margin-top:14px;--d:${dly()}s">
          <span class="tile">${ico("check", 2)}</span>
          <span class="tx"><h4>${d.mustread.titel}</h4><p>${d.mustread.sub}</p></span>
          <span class="ghost">Lees</span>
        </a>`
      : ""}
    ${!d.alarm && !d.mustread && d.vandaag.length === 0 && !d.kantine && d.voorJou.length === 0
      ? html`<div class="card acard up" style="margin-top:14px;--d:${dly()}s">
          <span class="tile">${ico("check", 2)}</span>
          <span class="tx"><h4>Alles is bij</h4><p>Geen acties die op je wachten vandaag.</p></span>
        </div>`
      : ""}
    ${d.vandaag.length > 0 || d.kantine
      ? html`<div class="eyebrow up" style="--d:${dly()}s"><span>VANDAAG</span><a href="/agenda">Agenda &rarr;</a></div>
        <div class="card today up" style="--d:${dly()}s">
          ${d.vandaag.length > 0
            ? html`<div class="trow">
                <div class="rail-wrap"><div class="rail"></div></div>
                <div style="flex:1">
                  ${d.vandaag.map((t) => html`<a class="titem" href="${t.route}"><time>${t.tijd}</time><span><h4>${t.titel}</h4>${t.sub ? html`<p>${t.sub}</p>` : ""}</span></a>`)}
                </div>
              </div>`
            : ""}
          ${d.kantine
            ? html`<a class="kantine press" href="${d.kantine.route}">
                <span class="tile">${ico("coffee")}</span>
                <span class="tx"><h4>${d.kantine.titel}</h4><p>${d.kantine.sub}</p></span>
                <span class="pill">Bestel</span>
              </a>`
            : ""}
        </div>`
      : ""}
    ${d.voorJou.length > 0
      ? html`<div class="eyebrow up" style="--d:${dly()}s"><span>VOOR JOU</span><a href="/voor-jou">Alles &rarr;</a></div>
        ${d.voorJou.map((a) => html`<a class="card acard lift press up" href="${a.route}" style="--d:${dly()}s">
          <span class="tile">${ico(a.icon)}</span>
          <span class="tx"><h4>${a.titel}</h4>${a.sub ? html`<p>${a.sub}</p>` : ""}</span>
          <span class="ghost">${a.cta}</span>
        </a>`)}`
      : ""}
    ${d.nieuws.length > 0
      ? html`<div class="eyebrow up" style="--d:${dly()}s"><span>NIEUWS</span><a href="/nieuws">Alle berichten &rarr;</a></div>
        ${d.nieuws.slice(0, 1).map((n) => html`<a class="card ncover lift press up" href="/nieuws#nieuws-${n.id}" style="--d:${dly()}s">
          <div class="cover"${n.cover ? raw(` style="background-image:url('${n.cover.replace(/'/g, "%27")}')"`) : ""}>
            ${n.cover ? "" : html`<svg class="mark"><use href="#i-file"/></svg>`}
            ${n.categorie ? html`<span class="cat">${n.categorie.toUpperCase()}</span>` : ""}
          </div>
          <div class="body"><h4>${n.titel}</h4><p>${n.meta}</p></div>
        </a>`)}
        ${d.nieuws.slice(1, 3).map((n) => html`<a class="card nrow lift press up" href="/nieuws#nieuws-${n.id}" style="--d:${dly()}s">
          ${n.nieuw ? html`<span class="unread"></span>` : ""}
          <span class="tx"><h4>${n.titel}</h4><p>${n.meta}</p></span>
          ${ico("chev", 2)}
        </a>`)}`
      : ""}
    ${d.jarige
      ? html`<div class="eyebrow up" style="--d:${dly()}s"><span>TEAM</span></div>
        <a class="card acard lift press up" href="/smoelenboek" style="--d:${dly()}s">
          <span class="tile">${ico("cake")}</span>
          <span class="tx"><h4>${d.jarige.naam} is ${d.jarige.vandaag ? "vandaag" : "binnenkort"} jarig</h4><p>${d.jarige.datum}</p></span>
        </a>`
      : ""}
    ${d.snelNaar.length > 0
      ? html`<div class="eyebrow up" style="--d:${dly()}s"><span>SNEL NAAR</span></div>
        <div class="qgrid up" style="--d:${dly()}s">
          ${d.snelNaar.map((m) => html`<a class="card qcard press" href="${m.route}"><span class="tile">${ico(m.icon)}</span><h4>${m.label}</h4></a>`)}
        </div>`
      : ""}
    ${d.pushKey
      ? html`<div id="ffPush" class="card acard" style="display:none">
          <span class="tile">${ico("bell")}</span>
          <span class="tx"><h4>Meldingen aanzetten</h4><p>Krijg een seintje bij nieuw nieuws.</p></span>
          <button type="button" id="ffPushBtn" class="ghost">Aanzetten</button>
        </div>
        ${raw(`<script>window.FF_VAPID=${JSON.stringify(d.pushKey)};</script>`)}
        ${raw(PUSH_SCRIPT)}`
      : ""}
  </main>
  <nav class="wabar" id="wabar" aria-label="Hoofdnavigatie" style="--tabs:${d.tabs.length + 2}">
    <span class="blob" id="blob"></span>
    <a class="wtab on" href="/" aria-current="page">${ico("home")}<span>Home</span></a>
    ${d.tabs.map((t) => html`<a class="wtab" href="${t.route}">${ico(t.icon)}<span>${t.label}</span>${t.count > 0 ? html`<span class="tbadge">${t.count}</span>` : ""}</a>`)}
    <button type="button" class="wtab" id="wmore" aria-label="Meer menu" aria-expanded="false">${ico("menu")}<span>Meer</span></button>
  </nav>
  <div class="wscrim" id="wscrim" aria-hidden="true"></div>
  <div class="wmenu" id="wmenu" role="menu" aria-hidden="true">
    ${d.menu.map((g) => html`<div class="wm-t">${g.titel}</div>${g.items.map((it) => html`<a href="${it.route}" role="menuitem">${ico(it.icon)}${it.label}</a>`)}`)}
    <div class="wm-v">Fresh Forward · ${BUILD}</div>
  </div>
</div>
</div>
${raw(SCRIPT)}
</body>
</html>`;
}
