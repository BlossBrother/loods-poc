// Agenda-views in Loods-stijl (restyle ronde 2): componentbibliotheek uit
// ./loods (tokens, kaarten, StroomRail, maandgrid). Gedrag (sheet, undo,
// view-transitions) blijft van de shell komen — markup-attributen onveranderd.
import { html, raw } from "hono/html";
import type { HtmlEscapedString } from "hono/utils/html";
import type { AgendaEvent } from "../agenda";
import type { VerlofRow, MedewerkerLite } from "../verlof";
import { emptyState, pageTitle } from "./templates";
import { lds, navBtn, railCard } from "./loods";

const TZ = "Europe/Amsterdam";
const CATS: Record<string, { label: string; color: string }> = {
  company: { label: "Bedrijf", color: "var(--green)" },
  pv: { label: "PV", color: "var(--berry)" },
  leave: { label: "Verlof", color: "var(--gold)" },
};
function catColor(c: string): string { return CATS[c]?.color ?? "var(--muted)"; }
function amsDay(ms: number): string { return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms)); }
function amsTime(ms: number): string { return new Intl.DateTimeFormat("nl-NL", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(ms)); }
function cellOf(d: Date): string { return d.toISOString().slice(0, 10); }
function onDay(ev: AgendaEvent, cell: string): boolean {
  const s = amsDay(ev.start_at);
  const e = amsDay(ev.end_at - 1 > ev.start_at ? ev.end_at - 1 : ev.start_at);
  return s <= cell && cell <= e;
}
function addDays(base: Date, n: number): Date { const d = new Date(base); d.setUTCDate(d.getUTCDate() + n); return d; }
function nlDate(cell: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("nl-NL", { timeZone: "UTC", ...opts }).format(new Date(cell + "T12:00:00Z"));
}

function catChip(key: string, label: string) {
  return html`<span class="pill"><span class="catdot" style="background:${catColor(key)}"></span>${label}</span>`;
}

function header(view: string, anchor: string, prev: string, next: string, today: string, title: string, _canEdit: boolean) {
  const pill = (v: string, lbl: string) => html`<a class="pill ${v === view ? "on" : ""}" href="/agenda?view=${v}&date=${anchor}">${lbl}</a>`;
  return html`
    <div class="toolbar">
      ${navBtn(`/agenda?view=${view}&date=${prev}`, "l", "Vorige")}
      <a class="btn btn-soft" style="margin:0;padding:9px 15px" href="/agenda?view=${view}&date=${today}">Vandaag</a>
      ${navBtn(`/agenda?view=${view}&date=${next}`, "r", "Volgende")}
      <strong>${title}</strong>
      ${/* v195 (review #5a): "+ Event"-knop verwijderd — de FAB doet dezelfde actie (consistent met prikbord/meldingen). */ ""}
    </div>
    <div class="pills">${pill("maand", "Maand")} ${pill("week", "Week")} ${pill("dag", "Dag")} <a class="pill" href="/agenda?view=verlof">Verlof</a></div>`;
}

function eventForm(anchor: string, view: string, bewerk?: AgendaEvent, sheet = false) {
  const toLocal = (ms: number) => {
    const p = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(ms));
    return p.replace(" ", "T");
  };
  const b = bewerk;
  // Nieuw event: standaard op de bekeken dag (anchor), 09:00-10:00 — niet leeg
  // (lege datetime-local laat de browser terugvallen op vandaag).
  const defStart = `${anchor}T09:00`;
  const defEnd = `${anchor}T10:00`;
  return html`<form method="post" action="${b ? `/agenda/${b.id}/update` : "/agenda"}" class="card${sheet ? " sheet-m" : ""}"${sheet ? raw(' id="ff-agenda-new"') : ""}>
    ${sheet ? html`<span class="sheet-handle" data-sheet-close role="button" tabindex="0" aria-label="Sluiten"></span>` : ""}
    <h2 style="margin-top:0">${b ? "Event bewerken" : "Nieuw event"}</h2>
    <input type="hidden" name="view" value="${view}" /><input type="hidden" name="date" value="${anchor}" />
    <label>Titel <input name="title" required value="${b?.title ?? ""}" /></label>
    <label>Omschrijving <textarea name="description" rows="2">${b?.description ?? ""}</textarea></label>
    <div class="row2">
      <label>Categorie <select name="category">
        ${Object.entries(CATS).map(([k, v]) => html`<option value="${k}" ${b?.category === k ? "selected" : ""}>${v.label}</option>`)}
      </select></label>
      <label>Locatie <input name="location" value="${b?.location ?? ""}" /></label>
    </div>
    <div class="row2">
      <label>Start <input name="start" type="datetime-local" required value="${b ? toLocal(b.start_at) : defStart}" /></label>
      <label>Eind <input name="end" type="datetime-local" required value="${b ? toLocal(b.end_at) : defEnd}" /></label>
    </div>
    <label class="row" style="gap:var(--sp-2); font-weight:600"><input type="checkbox" name="all_day" ${b?.all_day ? "checked" : ""} /> Hele dag</label>
    <button type="submit">${b ? "Opslaan" : "Toevoegen"}</button>
    ${b ? html`<a href="/agenda?view=${view}&date=${anchor}" class="muted" style="margin-left:var(--sp-2)">annuleren</a>` : ""}
  </form>
  ${b ? html`<form method="post" action="/agenda/${b.id}/delete" data-undo="Event verwijderd" data-herstel-type="agenda" data-undo-then="/agenda?view=${view}&date=${anchor}"><input type="hidden" name="id" value="${b.id}" /><input type="hidden" name="view" value="${view}" /><input type="hidden" name="date" value="${anchor}" /><button class="btn-berry btn">Verwijderen</button></form>` : ""}`;
}

export function agendaPage(
  view: "maand" | "week" | "dag",
  anchor: string,
  events: AgendaEvent[],
  canEdit: boolean,
  opts: { showForm?: boolean; bewerk?: AgendaEvent } = {},
) {
  const base = new Date(anchor + "T12:00:00Z");
  let prev: Date, next: Date, title: string;
  let grid: HtmlEscapedString | Promise<HtmlEscapedString>;
  const today = cellOf(new Date(new Date().toISOString().slice(0, 10) + "T12:00:00Z"));

  if (view === "maand") {
    prev = addDays(base, -28); next = addDays(base, 28);
    const first = new Date(base); first.setUTCDate(1);
    const dow = (first.getUTCDay() + 6) % 7; // ma=0
    const start = addDays(first, -dow);
    title = nlDate(cellOf(first), { month: "long", year: "numeric" });
    prev = (() => { const d = new Date(first); d.setUTCMonth(d.getUTCMonth() - 1); return d; })();
    next = (() => { const d = new Date(first); d.setUTCMonth(d.getUTCMonth() + 1); return d; })();
    const cells = Array.from({ length: 42 }, (_, i) => cellOf(addDays(start, i)));
    const curMonth = cellOf(first).slice(0, 7);
    grid = html`<div class="mgrid">
      ${["ma", "di", "wo", "do", "vr", "za", "zo"].map((d) => html`<div class="mhead">${d}</div>`)}
      ${cells.map((cell) => {
        const evs = events.filter((e) => onDay(e, cell));
        const dim = cell.slice(0, 7) !== curMonth;
        return html`<a href="/agenda?view=dag&date=${cell}" class="mcell${dim ? " dim" : ""}${cell === today ? " today" : ""}">
          <div class="d">${Number(cell.slice(8, 10))}</div>
          ${evs.slice(0, 3).map((e) => html`<div class="mev" style="background:${catColor(e.category)}">${e.title}</div>`)}
          ${evs.length > 3 ? html`<div class="mmore">+${evs.length - 3}</div>` : ""}
        </a>`;
      })}
    </div>`;
  } else if (view === "week") {
    const dow = (base.getUTCDay() + 6) % 7;
    const start = addDays(base, -dow);
    prev = addDays(base, -7); next = addDays(base, 7);
    title = "Week van " + nlDate(cellOf(start), { day: "numeric", month: "long" });
    const days = Array.from({ length: 7 }, (_, i) => cellOf(addDays(start, i)));
    grid = html`${days.map((cell) => {
      const evs = events.filter((e) => onDay(e, cell));
      return html`<article class="card" style="margin:10px 0;padding:15px 16px">
        <strong${cell === today ? raw(' style="color:var(--t-ink)"') : ""}>${nlDate(cell, { weekday: "long", day: "numeric", month: "short" })}</strong>
        ${evs.length === 0 ? html`<div class="muted" style="margin-top:var(--sp-1)">—</div>` : evs.map((e) => evLine(e, canEdit, cell))}
      </article>`;
    })}`;
  } else {
    prev = addDays(base, -1); next = addDays(base, 1);
    title = nlDate(anchor, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const evs = events.filter((e) => onDay(e, anchor));
    grid = evs.length === 0
      ? html`<article class="card">${emptyState({ icon: "agenda", title: "Geen events op deze dag", text: "Kies een andere dag of voeg een event toe." })}</article>`
      : railCard(html`${evs.map((e) => evLine(e, canEdit, anchor, true))}`, anchor === today);
  }

  return lds(html`
    ${pageTitle("agenda", "Agenda")}
    ${header(view, anchor, cellOf(prev), cellOf(next), today, title, canEdit)}
    ${grid}
    <div class="pills" style="margin-top:var(--sp-3)">${Object.entries(CATS).map(([k, v]) => catChip(k, v.label))}</div>
    ${canEdit && opts.bewerk ? eventForm(anchor, view, opts.bewerk) : ""}
    ${canEdit && !opts.bewerk ? eventForm(anchor, view, undefined, true) : ""}
  `);
}

export function eventDetail(e: AgendaEvent, canEdit: boolean, rsvp?: { ja: number; nee: number; namenJa: string[]; mijn: 1 | 0 | null } | null) {
  const tijd = e.all_day ? "Hele dag" : `${amsTime(e.start_at)}–${amsTime(e.end_at)}`;
  const dag = nlDate(amsDay(e.start_at), { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const cat = CATS[e.category];
  return lds(html`
    <a class="detail-back" href="/agenda?view=dag&date=${amsDay(e.start_at)}">${raw('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>')}Agenda</a>
    <h1 style="view-transition-name:evt-${e.id}">${e.title}</h1>
    <article class="card">
      <p style="margin-top:0">${catChip(e.category, cat?.label ?? e.category)}</p>
      <div class="titem"><time>${e.all_day ? "—" : amsTime(e.start_at)}</time><span class="tx"><h4>${dag}</h4><p>${tijd}</p></span></div>
      ${e.location ? html`<div class="titem"><time>&nbsp;</time><span class="tx"><h4>${e.location}</h4><p>Locatie</p></span></div>` : ""}
      ${e.description ? html`<div style="white-space:pre-wrap;line-height:1.55;margin-top:var(--sp-2)">${e.description}</div>` : html`<p class="muted">Geen verdere omschrijving.</p>`}
    </article>
    ${rsvp
      ? html`<article class="card" style="margin-top:var(--sp-3)">
          <h3 style="margin:0 0 6px">Ben je erbij?</h3>
          ${rsvp.ja > 0
            ? html`<p class="muted" style="margin:0 0 10px;font-size:.88rem">${rsvp.ja} collega${rsvp.ja === 1 ? "" : "'s"} ${rsvp.ja === 1 ? "komt" : "komen"}${rsvp.namenJa.length ? html` — ${rsvp.namenJa.slice(0, 8).join(", ")}${rsvp.namenJa.length > 8 ? ` +${rsvp.namenJa.length - 8}` : ""}` : ""}</p>`
            : html`<p class="muted" style="margin:0 0 10px;font-size:.88rem">Nog geen aanmeldingen — wees de eerste!</p>`}
          <form method="post" action="/agenda/event/${e.id}/rsvp" class="row" style="gap:8px;margin:0" data-no-queue>
            <button name="gaat" value="ja" class="btn" style="margin:0">${rsvp.mijn === 1 ? "✓ Ik kom" : "Ja, ik kom"}</button>
            <button name="gaat" value="nee" class="btn btn-soft" style="margin:0">${rsvp.mijn === 0 ? "✓ Niet erbij" : "Nee"}</button>
          </form>
        </article>`
      : ""}
    ${canEdit ? html`<a class="ghost" href="/agenda?view=dag&date=${amsDay(e.start_at)}&edit=${e.id}">Bewerken</a>` : ""}
  `);
}

function evLine(e: AgendaEvent, canEdit: boolean, anchor: string, vt = false) {
  const tijd = e.all_day ? "hele dag" : `${amsTime(e.start_at)}–${amsTime(e.end_at)}`;
  return html`<div class="titem">
    <time>${e.all_day ? "—" : amsTime(e.start_at)}</time>
    <span class="tx"><h4${vt ? raw(` style="view-transition-name:evt-${e.id}"`) : ""}><a href="/agenda/event/${e.id}"><span class="catdot" style="background:${catColor(e.category)}"></span>${e.title}</a></h4>
    <p>${tijd}${e.location ? ` · ${e.location}` : ""}</p></span>
    ${canEdit ? html`<a href="/agenda?view=dag&date=${anchor}&edit=${e.id}" class="tlink">bewerk</a>` : ""}
  </div>`;
}

// Verlofoverzicht (afwezigheidsplanner): ALLE actieve medewerkers, gegroepeerd per afdeling,
// met gekleurde cellen waar iemand verlof heeft. Bron: D1-tabel `verlof` (Buddee + demo).
export function verlofPage(anchor: string, employees: MedewerkerLite[], rows: VerlofRow[], canEdit: boolean) {
  const base = new Date(anchor + "T12:00:00Z");
  const dow = (base.getUTCDay() + 6) % 7;
  const monday = addDays(base, -dow);
  const days = Array.from({ length: 5 }, (_, i) => cellOf(addDays(monday, i)));
  const prevW = cellOf(addDays(monday, -7)), nextW = cellOf(addDays(monday, 7));
  const todayCell = cellOf(new Date(new Date().toISOString().slice(0, 10) + "T12:00:00Z"));
  const titel = "Week van " + nlDate(days[0], { day: "numeric", month: "long" });

  const byEmail = new Map<string, VerlofRow[]>();
  for (const r of rows) {
    const k = (r.employee_email || "").toLowerCase();
    if (!k) continue;
    if (!byEmail.has(k)) byEmail.set(k, []);
    byEmail.get(k)!.push(r);
  }
  const onDay = (rs: VerlofRow[] | undefined, cell: string): "v" | "b" | null => {
    if (!rs) return null;
    for (const r of rs) { const s = amsDay(r.start_at), e = amsDay(r.end_at); if (s <= cell && cell <= e) return (r.type || "").includes("bijz") ? "b" : "v"; }
    return null;
  };
  const initials = (n: string) => n.trim().split(/\s+/).map((x) => x[0] ?? "").slice(0, 2).join("").toUpperCase() || "?";

  const groups = new Map<string, MedewerkerLite[]>();
  for (const m of employees) { const a = m.afdeling || "Overig"; if (!groups.has(a)) groups.set(a, []); groups.get(a)!.push(m); }
  const afdelingen = Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);

  const off = (m: MedewerkerLite) => days.some((c) => onDay(byEmail.get((m.email || "").toLowerCase()), c));
  const totalOff = employees.filter(off).length;

  const dayHead = html`<div></div>${days.map((c) => html`<div style="text-align:center;font-size:.7rem;font-weight:700;color:${c === todayCell ? "var(--t-ink)" : "var(--muted)"}">${nlDate(c, { weekday: "short" })}<br /><span>${Number(c.slice(8, 10))}</span></div>`)}`;

  return lds(html`
    ${pageTitle("agenda", "Verlof")}
    <div class="toolbar">
      ${navBtn(`/agenda?view=verlof&date=${prevW}`, "l", "Vorige week")}
      <a class="btn btn-soft" style="margin:0;padding:9px 15px" href="/agenda?view=verlof&date=${todayCell}">Deze week</a>
      ${navBtn(`/agenda?view=verlof&date=${nextW}`, "r", "Volgende week")}
      <a class="btn btn-soft" style="margin:0;padding:9px 15px" href="/vandaag">Vandaag</a>
      <strong>${titel}</strong>
      ${canEdit ? html`<form method="post" action="/agenda/verlof/sync" style="margin:0 0 0 auto"><button class="btn btn-soft" style="margin:0;padding:9px 15px">Ververs uit Buddee</button></form>` : ""}
    </div>
    <div class="pills">
      <a class="pill" href="/agenda?view=maand">Maand</a>
      <a class="pill" href="/agenda?view=week">Week</a>
      <a class="pill" href="/agenda?view=dag">Dag</a>
      <a class="pill on" href="/agenda?view=verlof">Verlof</a>
    </div>
    <p class="muted" style="margin:12px 0 0">${totalOff} van ${employees.length} collega’s deze week (deels) weg.</p>
    ${afdelingen.map(([afd, leden]) => {
      const offCount = leden.filter(off).length;
      return html`<article class="card" style="margin-top:14px;padding:15px 16px">
        <h2 style="margin:0 0 10px;font-size:1.02rem">${afd} <span class="muted" style="font-weight:600;font-size:.82rem">· ${leden.length} · ${offCount} weg</span></h2>
        <div style="overflow-x:auto">
          <div style="display:grid;grid-template-columns:150px repeat(5,minmax(50px,1fr));gap:var(--sp-1);min-width:480px">
            ${dayHead}
            ${leden.map((m) => {
              const rs = byEmail.get((m.email || "").toLowerCase());
              return html`
                <div class="row" style="gap:var(--sp-2); min-width:0; padding:3px 0">
                  <span class="avatar" style="width:24px;height:24px;font-size:.68rem;flex:none">${initials(m.naam)}</span>
                  <span style="font-size:.84rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.naam}</span>
                </div>
                ${days.map((c) => { const t = onDay(rs, c); return html`<div title="${m.naam}" style="height:24px;border-radius:7px;background:${t === "v" ? "var(--green)" : t === "b" ? "var(--gold)" : "var(--surface-2)"};border:${t ? "0" : "1px solid var(--line)"};opacity:${t ? "1" : ".45"}"></div>`; })}
              `;
            })}
          </div>
        </div>
      </article>`;
    })}
    <div class="pills" style="margin-top:14px">
      <span class="pill"><span class="catdot" style="background:var(--green)"></span>Vakantie</span>
      <span class="pill"><span class="catdot" style="background:var(--gold)"></span>Bijzonder verlof</span>
    </div>
    <p class="muted" style="margin-top:14px;font-size:.8rem">Bron: Buddee · dagelijks gesynchroniseerd.</p>
  `);
}
