// "Wie is er vandaag" (spoor B2, v185): afwezigheid uit Buddee-verlof + zelfgekozen
// dagstatus (kantoor/thuis/op pad/afwezig). Loods-compositie: tegelkop, eyebrows,
// lijstkaarten. AVG: alleen vandaag, geen historie (zie src/aanwezigheid.ts).
import { html } from "hono/html";
import { lds, eyebrow } from "./loods";
import { pageTitle } from "./templates";
import type { VandaagRij, AanwStatus } from "../aanwezigheid";
import { AANW_STATUSSEN } from "../aanwezigheid";

const LABEL: Record<string, string> = { kantoor: "Op kantoor", thuis: "Thuis", onderweg: "Op pad", afwezig: "Afwezig" };

export function vandaagPage(
  datumLabel: string,
  rijen: VandaagRij[],
  mijn: { status: AanwStatus | null },
  opts: { melding?: string } = {},
) {
  const afwezig = rijen.filter((r) => r.verlof || r.status === "afwezig");
  const metStatus = rijen.filter((r) => !r.verlof && r.status && r.status !== "afwezig");
  const geen = rijen.filter((r) => !r.verlof && !r.status);

  const rij = (r: VandaagRij, badge: string) =>
    html`<li class="row" style="gap:10px">
      <span class="grow"><strong>${r.naam}</strong> <span class="muted">· ${r.afdeling}</span></span>
      <span class="muted" style="flex:none;font-size:.82rem">${badge}</span>
    </li>`;

  return lds(html`
    ${pageTitle("team", "Wie is er vandaag")}
    <p class="muted">${datumLabel}. Afwezigheid komt uit het verlofoverzicht (Buddee). Je eigen status geldt
      alleen voor vandaag en wordt daarna automatisch gewist — er wordt geen historie bewaard.</p>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}

    ${eyebrow("Mijn status vandaag")}
    <form method="post" action="/vandaag" class="card" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      ${AANW_STATUSSEN.map(
        (s) => html`<button type="submit" name="status" value="${s.key}" class="btn ${mijn.status === s.key ? "" : "btn-soft"}" style="margin:0">${s.label}</button>`,
      )}
      ${mijn.status ? html`<button type="submit" name="status" value="" class="btn btn-soft" style="margin:0;color:var(--muted)">Wis status</button>` : ""}
    </form>

    ${eyebrow(`Afwezig vandaag · ${afwezig.length}`, { href: "/agenda?view=verlof", label: "Verlofoverzicht" })}
    ${afwezig.length === 0
      ? html`<article class="card"><p class="muted" style="margin:0">Niemand afwezig gemeld vandaag.</p></article>`
      : html`<article class="card listcard"><ul class="clean">
          ${afwezig.map((r) => rij(r, r.verlof ?? "afgemeld"))}
        </ul></article>`}

    ${eyebrow(`Doorgegeven status · ${metStatus.length}`)}
    ${metStatus.length === 0
      ? html`<article class="card"><p class="muted" style="margin:0">Nog niemand heeft vandaag een status doorgegeven.</p></article>`
      : html`<article class="card listcard"><ul class="clean">
          ${metStatus.map((r) => rij(r, LABEL[r.status ?? ""] ?? ""))}
        </ul></article>`}

    ${geen.length > 0
      ? html`<details style="margin-top:10px">
          <summary class="muted" style="cursor:pointer">Geen status doorgegeven · ${geen.length} collega's</summary>
          <article class="card listcard" style="margin-top:8px"><ul class="clean">${geen.map((r) => rij(r, "—"))}</ul></article>
        </details>`
      : ""}
  `);
}
