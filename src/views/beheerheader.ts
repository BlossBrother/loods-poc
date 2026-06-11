import { html, raw } from "hono/html";
import type { HeaderConfig, GreetingVariant } from "../headercfg";

const SLOTS: [GreetingVariant["slot"], string][] = [
  ["morning", "Ochtend"], ["afternoon", "Middag"], ["evening", "Avond"], ["any", "Altijd"],
];

export function beheerHeader(cfg: HeaderConfig, variants: GreetingVariant[], opts: { melding?: string } = {}) {
  const data = JSON.stringify({ cfg, variants }).replace(/</g, "\\u003c");
  return html`
    <h1>Header &amp; begroeting</h1>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    <p class="muted">Stel de begroeting bovenaan de home in. De varianten rouleren per bezoek; uitgeschakelde modules tellen niet mee in de teller.</p>
    <form method="post" action="/beheer/header" class="card" id="hform">
      <h2 style="margin-top:0">Instellingen</h2>
      <label class="row" style="gap:var(--sp-2);font-weight:600"><input type="checkbox" name="enabled" ${cfg.enabled ? "checked" : ""} /> Header tonen</label>
      <label class="row" style="gap:var(--sp-2);font-weight:600;margin-top:8px"><input type="checkbox" name="use_time_based" ${cfg.useTimeBased ? "checked" : ""} /> Varianten op dagdeel filteren</label>
      <label class="row" style="gap:var(--sp-2);font-weight:600;margin-top:8px"><input type="checkbox" name="randomize" ${cfg.randomize ? "checked" : ""} /> Willekeurig kiezen (gewogen)</label>
      <label style="display:block;margin-top:12px;font-weight:600">Ondertitel-sjabloon
        <input name="subtitle_template" value="${cfg.subtitleTemplate}" maxlength="160" style="margin-top:6px" />
      </label>
      <p class="muted" style="font-size:.8rem">Variabelen: <code>{aantal}</code>, <code>{voornaam}</code>, <code>{werkw}</code> (is/zijn), <code>{meerv}</code> ( ding/e dingen)</p>
      <p class="muted" style="font-size:.8rem">De nieuwe home gebruikt de vaste huisstijl-kleuren; de oude gradient-instellingen zijn vervallen.</p>
      <input type="hidden" name="gradient_from" value="${cfg.gradientFrom}" /><input type="hidden" name="gradient_to" value="${cfg.gradientTo}" /><input type="hidden" name="text_color" value="${cfg.textColor}" />

      <h2>Begroetingen</h2>
      <div id="vrows"></div>
      <button type="button" id="vadd" class="btn btn-soft" style="margin-top:6px">+ Begroeting toevoegen</button>
      <input type="hidden" name="variants" id="vjson" />

      <h2>Voorbeeld</h2>
      <div id="hpreview" style="border:1px solid var(--line);border-radius:22px;padding:14px 16px;background:var(--bg);display:flex;align-items:center;gap:13px">
        <span style="min-width:0"><span id="pgreet" style="display:block;font-weight:800;font-size:1.15rem;letter-spacing:-.02em"></span><span id="psub" class="muted" style="display:block;font-size:.85rem;margin-top:2px"></span></span>
      </div>
      <button type="button" id="vrefresh" class="btn btn-soft" style="margin-top:8px">Ververs voorbeeld</button>

      <div style="margin-top:16px">
        <button type="submit">Opslaan</button>
        <button type="submit" name="reset" value="1" class="btn btn-soft" style="margin-left:8px">Reset naar standaard</button>
      </div>
    </form>
    <p class="muted"><a href="/beheer">&larr; beheer</a></p>

    <script type="application/json" id="hdata">${raw(data)}</script>
    <script>
      (function () {
        var init = {}; try { init = JSON.parse(document.getElementById("hdata").textContent); } catch (e) { init = { cfg: {}, variants: [] }; }
        var SLOTS = ${raw(JSON.stringify(SLOTS))};
        var rows = document.getElementById("vrows");
        var form = document.getElementById("hform");
        function rowEl(v) {
          var d = document.createElement("div");
          d.className = "hvrow row"; d.style.cssText = "gap:8px;margin:6px 0;flex-wrap:wrap";
          var opts = SLOTS.map(function (s) { return '<option value="' + s[0] + '"' + (v.slot === s[0] ? " selected" : "") + ">" + s[1] + "</option>"; }).join("");
          d.innerHTML =
            '<input class="hv-text" type="text" maxlength="40" placeholder="Begroeting" style="flex:2 1 140px;margin:0" />' +
            '<select class="hv-slot" style="flex:0 0 auto;margin:0">' + opts + "</select>" +
            '<input class="hv-weight" type="number" min="1" max="9" title="Gewicht" style="width:64px;margin:0" />' +
            '<label class="row" style="gap:5px;font-size:.82rem;margin:0"><input class="hv-active" type="checkbox" /> aan</label>' +
            '<button type="button" class="btn btn-soft hv-del" style="margin:0;padding:6px 10px">×</button>';
          d.querySelector(".hv-text").value = v.text || "";
          d.querySelector(".hv-weight").value = v.weight || 1;
          d.querySelector(".hv-active").checked = v.active !== false;
          d.querySelector(".hv-del").addEventListener("click", function () { d.remove(); serialize(); });
          d.addEventListener("input", serialize);
          d.addEventListener("change", serialize);
          return d;
        }
        function collect() {
          return Array.prototype.slice.call(rows.querySelectorAll(".hvrow")).map(function (d) {
            return { text: d.querySelector(".hv-text").value.trim(), slot: d.querySelector(".hv-slot").value, weight: Math.max(1, Number(d.querySelector(".hv-weight").value) || 1), active: d.querySelector(".hv-active").checked };
          }).filter(function (v) { return v.text; });
        }
        function serialize() { document.getElementById("vjson").value = JSON.stringify(collect()); }
        (init.variants || []).forEach(function (v) { rows.appendChild(rowEl(v)); });
        if (!(init.variants || []).length) rows.appendChild(rowEl({ slot: "any", weight: 1, active: true }));
        serialize();
        document.getElementById("vadd").addEventListener("click", function () { rows.appendChild(rowEl({ slot: "any", weight: 1, active: true })); serialize(); });
        form.addEventListener("submit", serialize);

        // ---- Live preview (zelfde logica als server) ----
        function pick(cfg, vars, hour) {
          var slot = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
          var pool = vars.filter(function (v) { return v.active && (cfg.useTimeBased ? (v.slot === slot || v.slot === "any") : v.slot === "any"); });
          if (!pool.length) return cfg.fallbackGreeting || "Hallo";
          if (!cfg.randomize) return pool[0].text;
          var total = pool.reduce(function (a, v) { return a + Math.max(1, v.weight || 1); }, 0);
          var r = Math.random() * total;
          for (var i = 0; i < pool.length; i++) { r -= Math.max(1, pool[i].weight || 1); if (r <= 0) return pool[i].text; }
          return pool[pool.length - 1].text;
        }
        function fillSub(tpl, aantal, naam) {
          return String(tpl || "").replace(/\{aantal\}/g, aantal).replace(/\{voornaam\}/g, naam).replace(/\{werkw\}/g, aantal === 1 ? "is" : "zijn").replace(/\{meerv\}/g, aantal === 1 ? " ding" : "e dingen").trim();
        }
        function curCfg() {
          return {
            enabled: form.enabled.checked, useTimeBased: form.use_time_based.checked, randomize: form.randomize.checked,
            subtitleTemplate: form.subtitle_template.value, fallbackGreeting: "Hallo",
          };
        }
        // Voorbeeld in de nieuwe home-stijl: vaste huisstijl, alleen tekst varieert.
        function preview() {
          var cfg = curCfg(); var vars = collect();
          var hour = new Date().getHours();
          var greet = pick(cfg, vars, hour);
          document.getElementById("pgreet").textContent = greet + ", Peter-Jan";
          document.getElementById("psub").textContent = fillSub(cfg.subtitleTemplate, 3, "Peter-Jan");
        }
        document.getElementById("vrefresh").addEventListener("click", preview);
        form.addEventListener("input", preview);
        preview();
      })();
    </script>
  `;
}
