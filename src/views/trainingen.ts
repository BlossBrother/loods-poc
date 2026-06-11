import { html, raw } from "hono/html";
import { page, emptyState } from "./templates";
import { lds } from "./loods";
import type { HtmlEscapedString } from "hono/utils/html";
import type { Course, Chapter } from "../trainingen";

// --- Lichte, veilige markdown-renderer voor cursusinhoud ---
function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function inline(s: string): string {
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  s = s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  return s;
}
export function renderMd(input?: string): HtmlEscapedString {
  const lines = escHtml(input ?? "").split(/\r?\n/);
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^#{2,3} /.test(line)) { out.push("<h3 class='md-h'>" + inline(line.replace(/^#{2,3} /, "")) + "</h3>"); i++; continue; }
    if (/^- /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i])) { items.push(lines[i].slice(2)); i++; }
      out.push("<ul class='md-ul'>" + items.map((it) => {
        const p = it.split("||");
        if (p.length === 2) return "<li><details class='md-check'><summary>" + inline(p[0].trim()) + "</summary><div class='md-ans'>" + inline(p[1].trim()) + "</div></details></li>";
        return "<li>" + inline(it) + "</li>";
      }).join("") + "</ul>");
      continue;
    }
    if (line.trim() === "") { i++; continue; }
    const para: string[] = [line]; i++;
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{2,3} |- )/.test(lines[i])) { para.push(lines[i]); i++; }
    out.push("<p>" + para.map(inline).join("<br />") + "</p>");
  }
  return raw(out.join("\n"));
}

const MD_CSS = `<style>
  .md-h{ font-size:1rem; font-weight:700; margin:18px 0 8px; color:var(--ink); }
  .md-ul{ margin:8px 0; padding-left:20px; }
  .md-ul li{ margin:5px 0; line-height:1.5; }
  .md-check summary{ cursor:pointer; font-weight:600; }
  .md-check summary::marker{ color:var(--green); }
  .md-ans{ margin:6px 0 4px; padding:8px 12px; border-left:3px solid var(--green-3); background:var(--surface-2); border-radius:8px; }
  .chap{ scroll-margin-top:70px; }
</style>`;

export function trainingenLijst(courses: Course[]) {
  return lds(page({ title: "Trainingen", icon: "book", intro: "Cursussen en uitleg. Klik een cursus om te starten — je kunt hoofdstuk voor hoofdstuk lezen.", children: html`
    ${courses.length === 0
      ? emptyState({ icon: "book", title: "Nog geen cursussen", text: "Zodra er cursussen zijn, verschijnen ze hier." })
      : html`
        <input id="trainZoek" type="search" placeholder="Zoek in cursussen…" autocomplete="off" style="margin:0 0 12px" />
        <div class="appgrid" id="trainGrid">${courses.map((c) => html`<a class="apptile" href="/trainingen/${c.id}" data-zoek="${(c.title + " " + (c.description ?? "")).toLowerCase()}">
          <div class="ico ico-green">${raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H12v15H5.5A1.5 1.5 0 0 1 4 17.5Z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H12v15h6.5a1.5 1.5 0 0 0 1.5-1.5Z"/></svg>`)}</div>
          <div class="txt"><span class="appname">${c.title}</span><span class="appdesc">${c.description ?? ""}</span></div>
        </a>`)}</div>
        ${raw(`<script>(function(){var i=document.getElementById('trainZoek');if(!i)return;i.addEventListener('input',function(){var q=i.value.toLowerCase();var els=document.querySelectorAll('#trainGrid .apptile');for(var k=0;k<els.length;k++){var t=els[k].getAttribute('data-zoek')||'';els[k].style.display=t.indexOf(q)>=0?'':'none';}});})();</script>`)}`}
  ` }));
}

export function trainingDetail(course: Course, chapters: Chapter[], done: Set<string>, canTrack: boolean) {
  const total = chapters.length;
  const aantalDone = chapters.filter((ch) => done.has(ch.id)).length;
  const pct = total ? Math.round((aantalDone / total) * 100) : 0;
  return lds(html`
    ${raw(MD_CSS)}
    <h1>${course.title}</h1>
    ${course.description ? html`<p class="muted">${course.description}</p>` : ""}
    ${canTrack && total > 0
      ? html`<div class="card" style="padding:var(--sp-3) var(--sp-4)">
          <div style="display:flex;justify-content:space-between;font-size:.85rem;font-weight:600"><span>Voortgang</span><span>${aantalDone}/${total}${aantalDone === total ? " · afgerond" : ""}</span></div>
          <div style="height:8px;background:var(--surface-2);border-radius:99px;margin-top:6px;overflow:hidden"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--green-3),var(--green))"></div></div>
        </div>`
      : ""}
    ${chapters.length === 0
      ? emptyState({ icon: "book", title: "Nog geen hoofdstukken" })
      : chapters.map((ch, idx) => {
          const isDone = done.has(ch.id);
          const unlocked = !canTrack || idx === 0 || done.has(chapters[idx - 1].id);
          if (!unlocked) {
            return html`<article class="card chap" style="opacity:.6" id="h-${ch.id}">
              <h2 class="row" style="margin-top:0; gap:var(--sp-2)">${raw(`<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9" rx="2"/><path d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5"/></svg>`)} ${ch.title}</h2>
              <p class="muted">Rond eerst het vorige hoofdstuk af om dit te ontgrendelen.</p>
            </article>`;
          }
          return html`<article class="card chap" id="h-${ch.id}">
            <h2 class="row" style="margin-top:0; gap:var(--sp-2)">${isDone ? raw(`<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="var(--green)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17l9-10"/></svg>`) : ""}${ch.title}</h2>
            ${renderMd(ch.body ?? "")}
            ${canTrack && !isDone
              ? html`<form method="post" action="/trainingen/${course.id}/afronden" style="margin-top:10px">
                  <input type="hidden" name="chapter" value="${ch.id}" />
                  <button type="submit">Hoofdstuk afronden →</button>
                </form>`
              : isDone
                ? html`<p class="muted" style="margin-top:var(--sp-2)">Afgerond</p>`
                : ""}
          </article>`;
        })}
    <p class="muted"><a href="/trainingen">← alle trainingen</a></p>
  `);
}

// ---- Beheer ----
export function beheerTrainingen(courses: Course[], opts: { melding?: string } = {}) {
  return html`
    <h1>Trainingen beheren</h1>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    <form method="post" action="/beheer/trainingen" class="card">
      <h2 style="margin-top:0">Nieuwe cursus</h2>
      <label>Titel <input name="title" required /></label>
      <label>Omschrijving <textarea name="description" rows="2"></textarea></label>
      <button type="submit">Cursus toevoegen</button>
    </form>
    <h2>Cursussen</h2>
    ${courses.length === 0 ? emptyState({ icon: "book", title: "Nog geen cursussen" }) : html`<ul class="clean">${courses.map((c) => html`<li class="row wrap" style="gap:10px">
        <span class="grow"><strong>${c.title}</strong> ${c.published ? "" : html`<span class="chip">concept</span>`}<span class="muted" style="display:block">${c.description ?? ""}</span></span>
        <a href="/beheer/trainingen/${c.id}">bewerken</a>
      </li>`)}</ul>`}
    <p class="muted"><a href="/beheer">← beheer</a></p>
  `;
}

export function beheerCourse(course: Course, chapters: Chapter[], opts: { melding?: string } = {}) {
  return html`
    <h1>${course.title}</h1>
    ${opts.melding ? html`<p class="ok flash" data-toast>${opts.melding}</p>` : ""}
    <form method="post" action="/beheer/trainingen/${course.id}" class="card">
      <h2 style="margin-top:0">Cursus-instellingen</h2>
      <label>Titel <input name="title" required value="${course.title}" /></label>
      <label>Omschrijving <textarea name="description" rows="2">${course.description ?? ""}</textarea></label>
      <label class="row" style="gap:var(--sp-2); font-weight:600"><input type="checkbox" name="published" ${course.published ? "checked" : ""} /> Gepubliceerd (zichtbaar voor collega's)</label>
      <button type="submit">Opslaan</button>
    </form>
    <form method="post" action="/beheer/trainingen/${course.id}/verwijder" onsubmit="return confirm('Hele cursus + hoofdstukken verwijderen?')" style="margin:0 0 18px">
      <button class="btn-berry btn">Cursus verwijderen</button>
    </form>

    <h2>Hoofdstukken</h2>
    ${chapters.map((ch) => html`<form method="post" action="/beheer/trainingen/hoofdstuk/${ch.id}" class="card">
      <label>Titel <input name="title" required value="${ch.title}" /></label>
      <label>Inhoud (markdown: ## kop, - bullet, **vet**, "Vraag || Antwoord" voor kennischeck)
        <textarea name="body" rows="10" style="font-family:ui-monospace,monospace;font-size:.85rem">${ch.body ?? ""}</textarea>
      </label>
      <button type="submit">Opslaan</button>
      <button class="btn-berry btn" formaction="/beheer/trainingen/hoofdstuk/${ch.id}/verwijder" formnovalidate style="margin-left:var(--sp-2)" onclick="return confirm('Hoofdstuk verwijderen?')">Verwijderen</button>
    </form>`)}

    <form method="post" action="/beheer/trainingen/${course.id}/hoofdstuk" class="card">
      <h2 style="margin-top:0">Nieuw hoofdstuk</h2>
      <label>Titel <input name="title" required /></label>
      <label>Inhoud <textarea name="body" rows="6" style="font-family:ui-monospace,monospace;font-size:.85rem"></textarea></label>
      <button type="submit">Hoofdstuk toevoegen</button>
    </form>
    <p class="muted"><a href="/beheer/trainingen">← trainingen</a></p>
  `;
}
