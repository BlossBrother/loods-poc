import { html } from "hono/html";
import type { Player } from "../account";
import { speelnaam } from "../account";
import { euro } from "../snacks";
import { TRANSLATE_LANGS } from "../translate";
import { lds } from "./loods";
import { pageTitle } from "./templates";

function fotoUrl(key?: string): string | undefined {
  if (!key) return undefined;
  return /^https?:\/\//.test(key) ? key : `/bestand?k=${encodeURIComponent(key)}`;
}

export function geenSpeler() {
  return lds(html`${pageTitle("user", "Mijn account")}
    <p class="muted">We konden je niet koppelen aan een medewerker-record. Vraag een
      beheerder om je e-mailadres toe te voegen onder Beheer → Medewerkers.</p>`);
}

export function mijnAccountPage(
  p: Player,
  prefs: Record<string, boolean>,
  saldoCents: number,
  comp: { game: string; label: string; elo: number; wins: number; losses: number; nemesis?: string }[],
  mods: { competitie: boolean; kantine: boolean } = { competitie: true, kantine: true },
  opts: { melding?: string } = {},
) {
  const foto = fotoUrl(p.fotoKey);
  const embed = p.introTune ? `https://open.spotify.com/embed/track/${p.introTune}` : "";
  return lds(html`
    ${pageTitle("user", "Mijn account")}
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    <article class="card">
      <div class="row" style="gap:14px">
        ${foto
          ? html`<img src="${foto}" alt="" style="width:64px;height:64px;border-radius:50%;object-fit:cover;background:var(--surface-2)" />`
          : html`<div class="avatar" style="width:64px;height:64px;font-size:1.1rem">${(p.naam || "?").slice(0, 2).toUpperCase()}</div>`}
        <div style="min-width:0">
          <div style="font-weight:780;font-size:1.15rem">${speelnaam(p)}</div>
          <div class="muted">${p.functie ?? ""}${p.functie ? " · " : ""}${p.email}</div>
          ${p.roles.length ? html`<div style="margin-top:5px">${p.roles.map((r) => html`<span class="chip" style="margin-right:var(--sp-1)">${r}</span>`)}</div>` : ""}
        </div>
      </div>
    </article>

    <form method="post" action="/mijn-account" class="card">
      <h2 style="margin-top:0">Profiel</h2>
      <label>Bijnaam <input name="nickname" maxlength="24" value="${p.nickname ?? ""}" placeholder="zoals je heet aan de board" /></label>
      <label>Intro tune (Spotify-link)
        <input name="intro" value="${p.introTune ? `https://open.spotify.com/track/${p.introTune}` : ""}" placeholder="https://open.spotify.com/track/..." />
      </label>
      ${embed ? html`<iframe style="border-radius:12px;margin-top:var(--sp-2);border:0" src="${embed}" width="100%" height="80" allow="autoplay; encrypted-media; clipboard-write" loading="lazy"></iframe>` : ""}
      <label class="row" style="gap:var(--sp-2); font-weight:600; margin-top:10px"><input type="checkbox" name="verjaardag_zichtbaar" ${p.showBirthday !== false ? "checked" : ""} /> Mijn verjaardag tonen op het intranet</label>
      <button type="submit">Opslaan</button>
    </form>

${mods.competitie ? html`    <form method="post" action="/mijn-account/voice" class="card">
      <h2 style="margin-top:0">Voice-calling</h2>
      <p class="muted">Engelse score-calling tijdens je potjes, per spel.</p>
      <label class="row" style="gap:var(--sp-2); font-weight:600"><input type="checkbox" name="darts" ${prefs.darts !== false ? "checked" : ""} /> Darten</label>
      <label class="row" style="gap:var(--sp-2); font-weight:600"><input type="checkbox" name="draughts" ${prefs.draughts !== false ? "checked" : ""} /> Dammen</label>
      <button type="submit">Opslaan</button>
    </form>` : ""}

    <article class="card">
      <h2 style="margin-top:0">Weergave</h2>
      <p class="muted">Persoonlijke menu-voorkeur, alleen op dit apparaat.</p>
      <label class="row" style="gap:var(--sp-2); font-weight:600"><input type="checkbox" id="ff-fun-toggle" /> Fun-onderdelen in het menu tonen</label>
      <label style="display:block;margin-top:14px;font-weight:600">Thema
        <select id="ff-theme" style="margin-top:6px">
          <option value="system">Systeem (automatisch)</option>
          <option value="light">Licht</option>
          <option value="dark">Donker</option>
        </select>
      </label>
      <script>
        (function () {
          var sel = document.getElementById("ff-theme"); if (!sel) return;
          var cur = "system"; try { cur = localStorage.getItem("ff_theme") || "system"; } catch (e) {}
          sel.value = cur;
          sel.addEventListener("change", function () {
            var v = sel.value;
            try { localStorage.setItem("ff_theme", v); } catch (e) {}
            if (v === "system") document.documentElement.removeAttribute("data-theme");
            else document.documentElement.setAttribute("data-theme", v);
            if (window.showToast) window.showToast(v === "system" ? "Thema volgt het systeem" : (v === "dark" ? "Donker thema" : "Licht thema"));
          });
        })();
      </script>
      <script>
        (function () {
          var cb = document.getElementById("ff-fun-toggle");
          if (!cb) return;
          function hidden() { try { return localStorage.getItem("ff_hide_fun") === "1"; } catch (e) { return false; } }
          function apply(hide) {
            var st = document.getElementById("ff-hide-fun-style");
            if (hide) {
              if (!st) { st = document.createElement("style"); st.id = "ff-hide-fun-style"; (document.head || document.documentElement).appendChild(st); }
              st.textContent = '[data-section="Fun"]{display:none!important}';
            } else if (st) { st.remove(); }
          }
          cb.checked = !hidden();
          cb.addEventListener("change", function () {
            var hide = !cb.checked;
            try { localStorage.setItem("ff_hide_fun", hide ? "1" : "0"); } catch (e) {}
            apply(hide);
            if (window.showToast) window.showToast(hide ? "Fun-onderdelen verborgen" : "Fun-onderdelen getoond");
          });
        })();
      </script>
    </article>

    <article class="card">
      <h2 style="margin-top:0">Taal &amp; vertaling</h2>
      <p class="muted">Kies je voorkeurstaal voor nieuws- en prikbordberichten. Alleen op dit apparaat.</p>
      <label style="display:block;font-weight:600">Voorkeurstaal
        <select id="ff-tr-lang" style="margin-top:6px">
          <option value="" disabled>Kies je taal…</option>
          <option value="nl">Nederlands (geen vertaling)</option>
          ${TRANSLATE_LANGS.filter((l) => l.code !== "nl").map((l) => html`<option value="${l.code}">${l.label}</option>`)}
        </select>
      </label>
      <label class="row" style="gap:var(--sp-2);font-weight:600;margin-top:14px"><input type="checkbox" id="ff-tr-auto" /> Berichten automatisch vertalen naar mijn voorkeurstaal</label>
      <script>
        (function () {
          var sel = document.getElementById("ff-tr-lang"); var auto = document.getElementById("ff-tr-auto"); if (!sel) return;
          try { sel.value = localStorage.getItem("ff_lang") || ""; } catch (e) {}
          try { if (auto) auto.checked = localStorage.getItem("ff_auto") === "1"; } catch (e) {}
          sel.addEventListener("change", function () {
            try { localStorage.setItem("ff_lang", sel.value); } catch (e) {}
            if (window.showToast) window.showToast(sel.value === "nl" ? "Geen vertaling" : "Voorkeurstaal opgeslagen");
          });
          if (auto) auto.addEventListener("change", function () {
            try { localStorage.setItem("ff_auto", auto.checked ? "1" : "0"); } catch (e) {}
            if (window.showToast) window.showToast(auto.checked ? "Automatisch vertalen aan" : "Automatisch vertalen uit");
          });
        })();
      </script>
    </article>

${mods.competitie ? html`    <article class="card">
      <h2 style="margin-top:0">Competitie</h2>
      ${comp.map((r) => html`<div class="row-top between" style="gap:10px; padding:8px 0; border-bottom:1px solid var(--line)">
        <span style="font-weight:600">${r.label}</span>
        <span style="text-align:right">
          <strong style="color:var(--t-ink);font-size:1.15rem">${r.elo}</strong> <span class="muted">ELO · ${r.wins}W ${r.losses}V</span>
          <br /><span class="muted" style="font-size:.76rem">nemesis: ${r.nemesis ?? "nog geen"}</span>
        </span>
      </div>`)}
      <a class="btn btn-soft" href="/competitie" style="margin-top:var(--sp-2)">Naar competitie</a>
    </article>` : ""}

${mods.kantine ? html`    <article class="card">
      <h2 style="margin-top:0">Kantine-saldo</h2>
      <p style="font-size:1.7rem;font-weight:800;margin:.2rem 0;color:${saldoCents < 0 ? "var(--berry)" : "var(--t-ink)"}">${euro(saldoCents)}</p>
      <a class="btn btn-soft" href="/friet/saldo">Mutaties</a>
      <a class="btn" href="/friet" style="margin-left:6px">Bestellen</a>
    </article>` : ""}
  `);
}
