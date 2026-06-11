import { html } from "hono/html";
import { eyebrow, actionCard, railCard } from "./loods";
import { pageTitle, skeletonList } from "./templates";

// Levende stijlgids (Laag 0/1 + Loods §3): toont de designsysteem-tokens + kern-
// componenten met motion. Beheerder-only preview om het fundament te valideren.
// v184: Loods-componenten toegevoegd (eyebrow, module-kop, actionCard, lijstkaart,
// stroomrail, skeleton) — de bibliotheek zoals die sinds v170 app-breed draait.
export function stijlgidsPage() {
  const swatch = (naam: string, varNaam: string) =>
    html`<div style="display:flex;flex-direction:column;gap:4px">
      <div style="height:46px;border-radius:var(--radius-sm);background:var(${varNaam});border:1px solid var(--line)"></div>
      <span style="font-size:var(--fs-caption);color:var(--muted)">${naam}</span>
    </div>`;

  const sect = (titel: string, inhoud: ReturnType<typeof html>) =>
    html`<section class="card" style="margin:0">
      <h2 style="margin:0 0 12px;font-size:var(--fs-h3)">${titel}</h2>
      ${inhoud}
    </section>`;

  return html`
  <div class="stijlgids" style="display:flex;flex-direction:column;gap:var(--sp-4);max-width:760px">
    <div>
      <h1 style="margin:0;font-size:var(--fs-h1)">Stijlgids</h1>
      <p class="muted" style="margin:4px 0 0">Designsysteem-fundament (UX-sets). Eén bron van tokens; elk scherm dat hierop bouwt is automatisch consistent.</p>
    </div>

    ${sect("Kleur", html`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:10px">
      ${swatch("surface", "--surface")} ${swatch("surface-2", "--surface-2")} ${swatch("groen", "--green")}
      ${swatch("groen-deep", "--green-deep")} ${swatch("berry", "--berry")} ${swatch("goud", "--gold")}
      ${swatch("ok", "--ok-bg")} ${swatch("warn", "--warn-bg")} ${swatch("lijn", "--line-strong")}
    </div>`)}

    ${sect("Typografie-schaal", html`<div style="display:flex;flex-direction:column;gap:6px">
      <span style="font-size:var(--fs-h1);font-weight:760;line-height:var(--lh-tight)">H1 — Titel</span>
      <span style="font-size:var(--fs-h2);font-weight:720;line-height:var(--lh-tight)">H2 — Sectiekop</span>
      <span style="font-size:var(--fs-h3);font-weight:680">H3 — Subkop</span>
      <span style="font-size:var(--fs-body);line-height:var(--lh-body)">Body — de standaard leestekst voor inhoud en uitleg.</span>
      <span style="font-size:var(--fs-sm);color:var(--muted)">Small — secundaire info</span>
      <span style="font-size:var(--fs-caption);color:var(--muted)">Caption — labels en hints</span>
    </div>`)}

    ${sect("Witruimte & radius", html`<div style="display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;align-items:flex-end;gap:8px">
        ${["--sp-1","--sp-2","--sp-3","--sp-4","--sp-5","--sp-6"].map((v) => html`<div style="text-align:center"><div style="width:var(${v});height:var(${v});background:var(--green);border-radius:3px;margin:0 auto"></div><span style="font-size:var(--fs-caption);color:var(--muted)">${v.replace("--sp-","")}</span></div>`)}
      </div>
      <div style="display:flex;gap:12px;align-items:center">
        ${["--radius-xs","--radius-sm","--radius","--radius-lg"].map((v) => html`<div style="text-align:center"><div style="width:52px;height:40px;background:var(--surface-2);border:1px solid var(--line);border-radius:var(${v})"></div><span style="font-size:var(--fs-caption);color:var(--muted)">${v.replace("--radius","base").replace("base-","")}</span></div>`)}
      </div>
    </div>`)}

    ${sect("Elevatie / z-lagen", html`<div style="display:flex;gap:14px;flex-wrap:wrap">
      ${["--elev-1","--elev-2","--elev-3"].map((v, i) => html`<div style="flex:1;min-width:120px;height:70px;background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(${v});display:flex;align-items:center;justify-content:center;font-size:var(--fs-sm);color:var(--muted)">elev ${i + 1}</div>`)}
    </div>`)}

    ${sect("Motion", html`<div style="display:flex;flex-direction:column;gap:14px">
      <p class="muted" style="margin:0;font-size:var(--fs-sm)">Timing-tokens: fast ${"→"} 140ms · base ${"→"} 240ms · screen ${"→"} 300ms. Easing: ease-out voor binnenkomend. Respecteert <code>prefers-reduced-motion</code>.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button type="button" class="btn" onclick="window.showToast&&window.showToast('Voorbeeld-toast (base 240ms)')">Toon toast</button>
        <button type="button" class="btn btn-soft" id="sg-replay">Replay entrance</button>
        <button type="button" class="btn btn-soft" id="sg-skel">Skeleton ${"→"} content</button>
      </div>
      <div id="sg-stagger" style="display:grid;gap:8px">
        ${[1, 2, 3].map((n) => html`<div class="sg-row" style="background:var(--surface-2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:12px 14px;font-size:var(--fs-sm)">Gelaagde entrance — rij ${n}</div>`)}
      </div>
      <div id="sg-skelbox"></div>
    </div>`)}

    ${sect("Componenten", html`<div style="display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <button type="button" class="btn">Primair</button>
        <button type="button" class="btn btn-soft">Secundair</button>
        <button type="button" class="btn btn-berry">Gevaar</button>
      </div>
      <label style="display:block">Veld met label
        <input placeholder="Typ iets..." />
      </label>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <span class="pill on">Tab actief</span><span class="pill">Tab</span><span class="pill">Tab</span>
      </div>
      <div class="emojibar" data-type="post" data-id="demo" data-actief="0">
        ${["👍", "❤️", "😄", "🎉", "👏"].map((e, i) => html`<button type="button" class="emojibtn${i === 0 ? " on" : ""}" data-emoji="${e}" disabled><span class="e">${e}</span><span class="n"${i === 0 ? "" : " hidden"}>${i === 0 ? "3" : ""}</span></button>`)}
      </div>
      <div class="card" style="margin:0;text-align:center;padding:28px 18px">
        <p style="font-weight:680;margin:0 0 4px">Lege staat</p>
        <p class="muted" style="margin:0;font-size:var(--fs-sm)">Hier verschijnt content zodra er iets is. Met een duidelijke vervolgactie.</p>
        <button type="button" class="btn" style="margin-top:12px">Eerste item toevoegen</button>
      </div>
    </div>`)}

    <section style="margin:0">
      <h2 style="margin:0 0 4px;font-size:var(--fs-h3)">Loods-componenten (designsysteem §3)</h2>
      <p class="muted" style="margin:0 0 8px;font-size:var(--fs-sm)">De componentbibliotheek (views/loods.ts + templates.ts) zoals app-breed in gebruik: tokens FF-groen, structuur platform-vast.</p>

      ${pageTitle("agenda", "Module-kop (pageTitle)")}

      ${eyebrow("Eyebrow-sectielabel", { href: "#", label: "Alles" })}
      ${actionCard({ href: "#", icon: "cal", title: "ActionCard", sub: "Icoon-tegel + titel + subregel, hele kaart tapbaar", cta: "Bekijk" })}

      ${eyebrow("Lijstkaart")}
      <article class="card listcard"><ul class="clean">
        <li><strong>Lijstregel</strong> <span class="muted">ul.clean strak in een Loods-kaart</span></li>
        <li><strong>Tweede regel</strong> <span class="muted">scheidingslijn komt van ul.clean li</span></li>
      </ul></article>

      ${eyebrow("Vandaag — stroomrail (signature)")}
      ${railCard(html`
        <a class="titem" href="#"><time>09:00</time><span class="tx"><h4>Stroomrail-item</h4><p>De vallende druppel = "live" (alleen als de dag vandaag is)</p></span></a>
        <a class="titem" href="#"><time>13:30</time><span class="tx"><h4>Tweede item</h4><p>Tijden in tabular-nums</p></span></a>
      `, true)}

      ${eyebrow("Knoppen in .lds-context")}
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <button type="button" class="btn">Primair (gradient-pill)</button>
        <button type="button" class="btn btn-soft">Soft</button>
        <span class="ghost">Ghost-CTA</span>
        <button type="button" class="btn btn-berry">Gevaar</button>
      </div>

      ${eyebrow("Skeleton-laadstaat (§3.15)")}
      ${skeletonList(2)}
      <p class="muted" style="margin:4px 0 0;font-size:var(--fs-caption)">Verschijnt automatisch bij koude SPA-navigatie die langer dan 300ms duurt (v184).</p>
    </section>
  </div>

  <script>
    (function () {
      function entrance(container) {
        var rows = container.querySelectorAll(".sg-row");
        for (var i = 0; i < rows.length; i++) {
          (function (el, idx) {
            el.style.animation = "none"; void el.offsetWidth;
            el.style.animation = "fadeUp var(--dur-base) var(--ease-out) both";
            el.style.animationDelay = (idx * 45) + "ms";
          })(rows[i], i);
        }
      }
      var box = document.getElementById("sg-stagger");
      if (box) entrance(box);
      var rp = document.getElementById("sg-replay");
      if (rp) rp.addEventListener("click", function () { entrance(box); });
      var sk = document.getElementById("sg-skel"), sb = document.getElementById("sg-skelbox");
      if (sk && sb) sk.addEventListener("click", function () {
        sb.innerHTML = '<div style="height:54px;border-radius:13px;background:linear-gradient(90deg,var(--surface-2),var(--surface),var(--surface-2));background-size:200% 100%;animation:sgshimmer 1.1s linear infinite"></div>';
        setTimeout(function () {
          var c = document.createElement("div");
          c.style.cssText = "opacity:0;transition:opacity var(--dur-base) var(--ease-out);background:var(--surface-2);border:1px solid var(--line);border-radius:13px;padding:14px;font-size:var(--fs-sm)";
          c.textContent = "Content geladen (cross-fade ~240ms).";
          sb.innerHTML = ""; sb.appendChild(c); void c.offsetWidth; c.style.opacity = "1";
        }, 900);
      });
    })();
  </script>
  <style>@keyframes sgshimmer{from{background-position:200% 0}to{background-position:-200% 0}}</style>`;
}
