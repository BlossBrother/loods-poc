import { html, raw } from "hono/html";
import type { AirtableRecord, MedewerkerFields } from "../airtable";
import { lds } from "./loods";
import { pageTitle } from "./templates";

function initialen(naam: string): string {
  const d = naam.trim().split(/\s+/);
  return ((d[0]?.[0] ?? "") + (d.length > 1 ? d[d.length - 1][0] : "")).toUpperCase() || "?";
}

const MAIL = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`;
const PHONE = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L16 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>`;

const FILTER_SCRIPT = `<script>
function ffFilterTeam(q){
  q=(q||"").trim().toLowerCase();
  var cards=document.querySelectorAll("#ffTeam .teamcard"), n=0;
  cards.forEach(function(c){ var hit=!q||c.getAttribute("data-zoek").indexOf(q)!==-1; c.style.display=hit?"":"none"; if(hit)n++; });
  var g=document.getElementById("ffGeen"); if(g) g.style.display=n?"none":"block";
}
(function(){
  var imgs=document.querySelectorAll(".teamfoto");
  for(var i=0;i<imgs.length;i++){(function(img){
    if(img.complete && img.naturalWidth>0) return;       // al geladen -> geen fade nodig
    img.classList.add("ff-fade");                          // nog laden -> fade-in straks
    img.addEventListener("load", function(){ img.classList.add("loaded"); });
    img.addEventListener("error", function(){ img.classList.add("loaded"); }); // geen foto -> toon bg-cirkel
  })(imgs[i]);}
})();
</script>`;

export function smoelenboekPage(medewerkers: AirtableRecord<MedewerkerFields>[]) {
  const lijst = medewerkers.filter((m) => m.fields.Actief !== false);
  return lds(html`
    ${pageTitle("team", "Team")}
    <p class="muted">${lijst.length} collega's bij Fresh Forward. <a href="/vandaag">Wie is er vandaag &rarr;</a></p>
    <input id="ffZoek" type="search" placeholder="Zoek op naam, functie of afdeling…"
      oninput="ffFilterTeam(this.value)" autocomplete="off" />

    <div class="teamgrid" id="ffTeam">
      ${lijst.map((m) => {
        const f = m.fields;
        const foto = f.Foto?.[0]?.thumbnails?.large?.url ?? f.Foto?.[0]?.url;
        const zoek = [f.Naam, f.Functie, f.Afdeling].filter(Boolean).join(" ").toLowerCase();
        return html`<div class="teamcard" data-zoek="${zoek}">
          ${foto
            ? html`<img class="teamfoto" src="${foto}" alt="${f.Naam ?? ""}" width="84" height="84" loading="lazy" decoding="async" />`
            : html`<div class="teamava">${initialen(f.Naam ?? "?")}</div>`}
          <div class="teamnaam">${f.Naam ?? "(onbekend)"}</div>
          ${f.Functie ? html`<div class="teamfunctie">${f.Functie}</div>` : ""}
          ${f.Afdeling ? html`<div class="teammeta">${f.Afdeling}</div>` : ""}
          <div class="teamlinks">
            ${f["E-mail"]
              ? html`<a href="mailto:${f["E-mail"]}" aria-label="Mail ${f.Naam ?? ""}">${raw(MAIL)}</a>`
              : ""}
            ${f.Telefoon
              ? html`<a href="tel:${f.Telefoon}" aria-label="Bel ${f.Naam ?? ""}">${raw(PHONE)}</a>`
              : ""}
          </div>
        </div>`;
      })}
    </div>
    <p id="ffGeen" class="muted" style="display:none;text-align:center;padding:20px">Niemand gevonden.</p>
    ${raw(FILTER_SCRIPT)}
  `);
}
