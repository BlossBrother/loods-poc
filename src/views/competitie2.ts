import { html, raw } from "hono/html";
import { emptyState, pageTitle } from "./templates";
import { lds } from "./loods";
import type { Rating, MatchRow, Tournament, GameType } from "../elo";
import { GAMES, gameLabel } from "../elo";
import type { Player } from "../account";

function esc(x: string): string {
  return String(x ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function gamePills(active: GameType, base: string) {
  return html`<div class="pills">
    ${GAMES.map((g) => html`<a class="pill ${g.type === active ? "on" : ""}" href="${base}?game=${g.type}">${g.label}</a>`)}
  </div>`;
}
function naamMap(players: Player[]) {
  const m = new Map(players.map((p) => [p.id, p.nickname || p.naam]));
  return (id?: string) => (id ? m.get(id) ?? "?" : "?");
}

function rankRows(game: GameType, ranking: Rating[]) {
  return html`<table>
    <thead><tr><th>#</th><th>Speler</th><th>ELO</th><th>W</th><th>V</th></tr></thead>
    <tbody>${ranking.map((r, i) => html`<tr>
      <td class="pos">${i + 1}</td>
      <td><a href="/competitie/speler/${r.player_id}?game=${game}">${r.nickname || r.naam}</a></td>
      <td class="pts">${r.elo}</td><td>${r.wins}</td><td>${r.losses}</td>
    </tr>`)}</tbody>
  </table>`;
}

export function competitieOverzicht(game: GameType, ranking: Rating[], recent: MatchRow[]) {
  return lds(html`
    ${pageTitle("trophy", "Competitie")}
    ${gamePills(game, "/competitie")}
    <div style="display:flex;gap:var(--sp-2);flex-wrap:wrap;margin-bottom:6px">
      <a class="btn" href="/competitie/teller?game=${game}">▶︎ Teller / dartbord</a>
      <a class="btn btn-soft" href="/competitie/ranglijst?game=${game}">Ranglijst</a>
      <a class="btn btn-soft" href="/competitie/toernooien?game=${game}">Toernooien</a>
    </div>
    <h2>Top — ${gameLabel(game)}</h2>
    ${ranking.length === 0
      ? emptyState({ icon: "trophy", title: "Nog geen potjes", text: "Start er een met de teller." })
      : html`${rankRows(game, ranking.slice(0, 5))}${ranking.length > 5 ? html`<p class="muted"><a href="/competitie/ranglijst?game=${game}">volledige ranglijst →</a></p>` : ""}`}
    <h2>Laatste potten</h2>
    ${recent.length === 0
      ? emptyState({ icon: "trophy", title: "Nog geen potten gespeeld", text: "Start een pot met de teller hierboven." })
      : html`<ul class="clean">${recent.map((m, i) => html`<li>
          <strong>${m.naam_a} ${m.score_a ?? ""}–${m.score_b ?? ""} ${m.naam_b}</strong>
          <span class="muted"> · winnaar ${m.winner === m.player_a ? m.naam_a : m.naam_b}</span>
          ${i === 0
            ? html`<form method="post" action="/competitie/match/verwijder-laatste" style="display:inline-block;margin:0 0 0 8px;vertical-align:middle" data-no-queue>
                <input type="hidden" name="game" value="${game}" />
                <button class="btn-soft btn" style="margin:0;padding:1px 8px;font-size:.7rem" title="Verkeerd ingevuld? Verwijdert deze pot en zet de ELO exact terug.">corrigeer</button>
              </form>`
            : ""}
        </li>`)}</ul>`}
    <p class="muted" style="font-size:.78rem">Verkeerd ingevuld? Alleen de laatste pot is te corrigeren (de ELO wordt dan exact teruggezet) — voer 'm daarna opnieuw in.</p>
  `);
}

export function ranglijstPage(game: GameType, ranking: Rating[]) {
  return lds(html`
    ${pageTitle("bracket", "Ranglijst")}
    ${gamePills(game, "/competitie/ranglijst")}
    <h2>${gameLabel(game)}</h2>
    ${ranking.length === 0 ? emptyState({ icon: "trophy", title: "Nog geen potjes gespeeld" }) : rankRows(game, ranking)}
    <p class="muted"><a href="/competitie?game=${game}">← competitie</a></p>
  `);
}

export function spelerProfiel(
  game: GameType,
  speler: { id: string; naam: string },
  rating: Rating,
  nemesis: { naam: string; losses: number } | undefined,
  last5: ("W" | "L")[],
  recent: MatchRow[],
) {
  const dot = (w: boolean) =>
    html`<span title="${w ? "winst" : "verlies"}" style="display:inline-block;width:13px;height:13px;border-radius:50%;margin-right:5px;vertical-align:middle;background:${w ? "var(--green)" : "var(--berry)"}"></span>`;
  const bal = last5.length ? html`${last5.map((x) => dot(x === "W"))}` : html`<span class="muted">—</span>`;
  return lds(html`
    <a class="detail-back" href="/competitie/ranglijst?game=${game}">${raw('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>')}Ranglijst</a>
    <h1>${speler.naam}</h1>
    ${gamePills(game, `/competitie/speler/${speler.id}`)}
    <div class="row2">
      <article class="card"><div class="muted">ELO (${gameLabel(game)})</div><div style="font-size:1.8rem;font-weight:800;color:var(--t-ink)">${rating.elo}</div><div class="muted">${rating.wins}W · ${rating.losses}V</div></article>
      <article class="card"><div class="muted">Laatste 5</div><div style="font-size:1.3rem;margin-top:6px">${bal}</div></article>
    </div>
    <article class="card">
      <div class="muted">Nemesis</div>
      ${nemesis ? html`<div style="font-size:1.1rem;font-weight:700">${nemesis.naam} <span class="muted">(${nemesis.losses}× verloren)</span></div>` : html`<div class="muted">Nog geen angstgegner</div>`}
    </article>
    <h2>Recente potten</h2>
    ${recent.length === 0
      ? emptyState({ icon: "trophy", title: "Nog geen potten", text: "De eerste uitslag verschijnt hier." })
      : html`<ul class="clean">${recent.map((m) => html`<li>
        <strong>${m.naam_a} ${m.score_a ?? ""}–${m.score_b ?? ""} ${m.naam_b}</strong>
        <span class="muted"> · ${m.winner === speler.id ? "gewonnen" : "verloren"}</span>
      </li>`)}</ul>`}
  `);
}

// Score-teller: klikbaar 501-dartbord (darts) of winst-keuze (dammen). Voice in de pagina.
export function scoreTeller(game: GameType, players: Player[], voiceOn: boolean) {
  const opts = players.map((p) => `<option value="${esc(p.id)}">${esc(p.nickname || p.naam)}</option>`).join("");
  if (game !== "darts") {
    return lds(html`
      <h1>Teller — ${gameLabel(game)}</h1>
      ${gamePills(game, "/competitie/teller")}
      <form method="post" action="/competitie/match" class="card">
        <input type="hidden" name="game" value="${game}" />
        <label>Speler 1 <select name="player_a" id="ua">${raw(opts)}</select></label>
        <label>Speler 2 <select name="player_b" id="ub">${raw(opts)}</select></label>
        <label>Winnaar <select name="winner" id="uw">${raw(opts)}</select></label>
        <button type="submit">Uitslag opslaan (ELO)</button>
      </form>
      <p class="muted">Voor dammen tellen we winst/verlies voor de ELO.</p>
      <script>
        // Winnaar-keuze volgt de twee gekozen spelers (niet de hele lijst).
        (function () {
          var a = document.getElementById("ua"), b = document.getElementById("ub"), w = document.getElementById("uw");
          if (!a || !b || !w) return;
          function naam(sel) { var o = sel.options[sel.selectedIndex]; return o ? o.textContent : ""; }
          function syncWinner() {
            var keuze = w.value;
            w.innerHTML = "";
            var oa = document.createElement("option"); oa.value = a.value; oa.textContent = naam(a); w.appendChild(oa);
            if (b.value !== a.value) { var ob = document.createElement("option"); ob.value = b.value; ob.textContent = naam(b); w.appendChild(ob); }
            if (keuze === a.value || keuze === b.value) w.value = keuze;
          }
          if (a.value === b.value && b.options.length > 1) b.selectedIndex = 1; // standaard 2 verschillende spelers
          a.addEventListener("change", syncWinner);
          b.addEventListener("change", syncWinner);
          syncWinner();
        })();
      </script>
    `);
  }
  return lds(html`
    <h1>Dartbord <span class="muted" style="font-size:.6em">501</span></h1>
    ${gamePills(game, "/competitie/teller")}
    <style>.pdash{text-align:center}.pdash .who{font-weight:600}.pdash .rem{font-size:2.4rem;font-weight:800;color:var(--t-ink);line-height:1.1}</style>
    <div id="resume" class="ok" style="display:none;align-items:center;gap:10px;justify-content:space-between">
      <span>Er liep nog een pot — hervat of begin opnieuw.</span>
      <button type="button" id="resumeDiscard" class="btn-soft" style="margin:0;padding:7px 12px">Wissen</button>
    </div>
    <div id="setup" class="card">
      <div class="row2">
        <label>Speler 1 <select id="p1"><option value="">— kies —</option>${raw(opts)}<option value="__guest__">Gast…</option></select>
          <input id="g1" type="text" placeholder="Naam gast" autocomplete="off" style="display:none;margin-top:6px" /></label>
        <label>Speler 2 <select id="p2"><option value="">— kies —</option>${raw(opts)}<option value="__guest__">Gast…</option></select>
          <input id="g2" type="text" placeholder="Naam gast" autocomplete="off" style="display:none;margin-top:6px" /></label>
      </div>
      <label>Startscore <select id="start"><option>501</option><option>301</option></select></label>
      <label class="row" style="gap:var(--sp-2); font-weight:600; margin-top:var(--sp-2)"><input type="checkbox" id="voice" ${voiceOn ? "checked" : ""} /> Engelse voice-calling</label>
      <button type="button" id="startBtn">Start</button>
      <p class="muted" style="margin:10px 0 0">Tip: kies "Gast…" om iemand zonder account mee te laten spelen. Gastpotten tellen niet mee voor de ranglijst.</p>
    </div>
    <div id="game" style="display:none">
      <div class="row2">
        <div class="card pdash" id="pan0"><div class="who" id="naam0"></div><div class="rem" id="rem0"></div></div>
        <div class="card pdash" id="pan1"><div class="who" id="naam1"></div><div class="rem" id="rem1"></div></div>
      </div>
      <p id="beurtinfo" class="muted" style="text-align:center;font-weight:600"></p>
      <div id="turn" style="text-align:center;margin:4px 0 10px"></div>
      <div id="board" style="max-width:330px;margin:0 auto"></div>
      <div style="display:flex;gap:var(--sp-2);justify-content:center;margin-top:14px">
        <button type="button" id="miss" class="btn-soft">Mis</button>
        <button type="button" id="undo" class="btn-soft">Undo</button>
        <button type="button" id="next" class="btn-soft">Volgende speler</button>
      </div>
      <p style="text-align:center;margin-top:10px"><a href="#" id="stop" class="muted">Stoppen &amp; pot wissen</a></p>
      <div id="winbox" style="display:none;margin-top:var(--sp-4)">
        <p class="ok" id="wintekst"></p>
        <form method="post" action="/competitie/match" class="card" id="winform">
          <input type="hidden" name="game" value="darts" />
          <input type="hidden" name="player_a" id="f_pa" /><input type="hidden" name="player_b" id="f_pb" />
          <input type="hidden" name="winner" id="f_win" />
          <input type="hidden" name="score_a" id="f_sa" /><input type="hidden" name="score_b" id="f_sb" />
          <button type="submit">Opslaan (ELO)</button>
          <a href="/competitie/teller?game=darts" class="muted opnieuw" style="margin-left:10px">opnieuw</a>
        </form>
        <div id="guestnote" class="card" style="display:none">
          <p class="muted" style="margin:0 0 10px">Gastpot — telt niet mee voor de ranglijst.</p>
          <a href="/competitie/teller?game=darts" class="btn opnieuw">Nieuwe pot</a>
        </div>
      </div>
    </div>
    ${raw(DART_SCRIPT)}
  `);
}

const DART_SCRIPT = `<script>
(function(){
  var NUMS=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
  var NS="http://www.w3.org/2000/svg";
  var SKEY="ff_darts_v1";
  var ONES=['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  var TENS=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  function words(n){ n=Math.round(n); if(n===180) return 'one hundred and eighty'; if(n<20) return ONES[n]||'zero';
    if(n<100){ var t=TENS[Math.floor(n/10)]; var o=n%10; return o? t+'-'+ONES[o]: t; }
    var h=Math.floor(n/100); var r=n%100; return ONES[h]+' hundred'+(r?' and '+words(r):''); }
  // Shotcaller (v179): echte caller-audio uit R2 als die bestaat (key caller/<naam>.mp3,
  // bv. caller/180.mp3 of caller/gameshot.mp3), anders terugval op de Engelse TTS.
  var AUDIO_MISS={};
  function tts(t){ try{ var u=new SpeechSynthesisUtterance(t); u.lang='en-GB'; u.rate=.95; speechSynthesis.cancel(); speechSynthesis.speak(u);}catch(e){} }
  function say(t,key){ var cb=document.getElementById('voice'); if(cb && !cb.checked) return;
    if(key && !AUDIO_MISS[key]){
      try{
        var a=new Audio('/bestand?k='+encodeURIComponent('caller/'+key+'.mp3'));
        a.onerror=function(){ AUDIO_MISS[key]=1; tts(t); };
        a.play().catch(function(){ AUDIO_MISS[key]=1; tts(t); });
        return;
      }catch(e){ AUDIO_MISS[key]=1; }
    }
    tts(t); }
  var G=null;
  function save(){ try{ if(G) localStorage.setItem(SKEY, JSON.stringify(G)); }catch(e){} }
  function clearSaved(){ try{ localStorage.removeItem(SKEY); }catch(e){} }
  function hasGuest(){ return !!(G && (G.spelers[0].guest || G.spelers[1].guest)); }
  function pol(cx,cy,r,a){ var rad=(a-90)*Math.PI/180; return [cx+r*Math.cos(rad), cy+r*Math.sin(rad)]; }
  function sector(cx,cy,r1,r2,a1,a2){ var p1=pol(cx,cy,r2,a1),p2=pol(cx,cy,r2,a2),p3=pol(cx,cy,r1,a2),p4=pol(cx,cy,r1,a1);
    return "M"+p1[0]+" "+p1[1]+" A"+r2+" "+r2+" 0 0 1 "+p2[0]+" "+p2[1]+" L"+p3[0]+" "+p3[1]+" A"+r1+" "+r1+" 0 0 0 "+p4[0]+" "+p4[1]+" Z"; }
  function clickable(el,val,label){ el.style.cursor="pointer"; el.addEventListener("click",function(){registerDart(val,label);}); }
  function buildBoard(){
    var box=document.getElementById("board"); box.innerHTML="";
    var svg=document.createElementNS(NS,"svg"); svg.setAttribute("viewBox","0 0 400 400"); svg.setAttribute("width","100%");
    var cx=200,cy=200; var rings=[{r1:24,r2:104,m:1,t:"s"},{r1:104,r2:118,m:3,t:"r"},{r1:118,r2:162,m:1,t:"s"},{r1:162,r2:182,m:2,t:"r"}];
    for(var i=0;i<20;i++){ var num=NUMS[i], aMid=i*18, a1=aMid-9, a2=aMid+9, even=(i%2===0);
      for(var r=0;r<rings.length;r++){ var rg=rings[r], path=document.createElementNS(NS,"path");
        path.setAttribute("d",sector(cx,cy,rg.r1,rg.r2,a1,a2));
        var fill = rg.t==="s" ? (even?"#f3ead2":"#2a2a28") : (even?"#c0392b":"#1e8449");
        path.setAttribute("fill",fill); path.setAttribute("stroke","#0a0a0a"); path.setAttribute("stroke-width","0.6");
        var label=(rg.m===3?"T":rg.m===2?"D":"")+num; clickable(path,num*rg.m,label); svg.appendChild(path); }
      var tp=pol(cx,cy,194,aMid), t=document.createElementNS(NS,"text");
      t.setAttribute("x",tp[0]); t.setAttribute("y",tp[1]); t.setAttribute("text-anchor","middle"); t.setAttribute("dominant-baseline","middle");
      t.setAttribute("font-size","13"); t.setAttribute("font-weight","600"); t.setAttribute("fill","#7f8c83"); t.textContent=num; svg.appendChild(t); }
    var bull=document.createElementNS(NS,"circle"); bull.setAttribute("cx",cx); bull.setAttribute("cy",cy); bull.setAttribute("r",24); bull.setAttribute("fill","#1e8449"); bull.setAttribute("stroke","#0a0a0a"); clickable(bull,25,"25"); svg.appendChild(bull);
    var eye=document.createElementNS(NS,"circle"); eye.setAttribute("cx",cx); eye.setAttribute("cy",cy); eye.setAttribute("r",11); eye.setAttribute("fill","#c0392b"); eye.setAttribute("stroke","#0a0a0a"); clickable(eye,50,"Bull"); svg.appendChild(eye);
    box.appendChild(svg);
  }
  function sumDarts(){ var s=0; for(var i=0;i<G.darts.length;i++) s+=G.darts[i].val; return s; }
  function prov(){ return G.spelers[G.beurt].rem - sumDarts(); }
  function slot(selId,gId,start){
    var sel=document.getElementById(selId);
    if(sel.value==="__guest__"){ var g=document.getElementById(gId); var nm=(g.value||"").trim();
      if(!nm){ alert("Vul de naam van de gast in."); return null; }
      return {id:"guest:"+selId,naam:nm,rem:start,guest:true}; }
    if(!sel.value) return null;
    return {id:sel.value,naam:sel.options[sel.selectedIndex].text,rem:start};
  }
  function startGame(){
    var start=parseInt(document.getElementById("start").value,10)||501;
    var s1=slot("p1","g1",start); if(s1===null) { if(!document.getElementById("p1").value) alert("Kies speler 1."); return; }
    var s2=slot("p2","g2",start); if(s2===null) { if(!document.getElementById("p2").value) alert("Kies speler 2."); return; }
    if(!s1.guest && !s2.guest && s1.id===s2.id){ alert("Kies twee verschillende spelers."); return; }
    G={start:start,beurt:0,darts:[],klaar:false,spelers:[s1,s2]};
    document.getElementById("setup").style.display="none";
    var rb=document.getElementById("resume"); if(rb) rb.style.display="none";
    document.getElementById("game").style.display="block";
    buildBoard(); render(); save();
  }
  function registerDart(val,label){
    if(!G||G.klaar||G.darts.length>=3) return;
    G.darts.push({val:val,label:label}); var p=prov();
    if(p<0){ say('no score','noscore'); render("Bust! – beurt naar de ander"); G.darts=[]; G.beurt=1-G.beurt; save(); setTimeout(function(){render();},800); return; }
    if(p===0){ say('game shot, and the leg!','gameshot'); G.spelers[G.beurt].rem=0; win(); return; }
    if(G.darts.length===3){ var sc=G.spelers[G.beurt].rem - p; say(words(sc),String(sc)); G.spelers[G.beurt].rem=p; G.darts=[]; G.beurt=1-G.beurt; }
    render(); save();
  }
  function volgende(){ if(!G||G.klaar) return; var p=prov(); if(p>=0){ var sc=G.spelers[G.beurt].rem - p; say(words(sc),String(sc)); G.spelers[G.beurt].rem=p; } G.darts=[]; G.beurt=1-G.beurt; render(); save(); }
  function undo(){ if(!G||G.klaar) return; G.darts.pop(); render(); save(); }
  function showWin(){
    var w=G.beurt;
    document.getElementById("wintekst").textContent=G.spelers[w].naam+" wint! ("+G.start+" → 0)";
    document.getElementById("winbox").style.display="block"; document.getElementById("board").style.display="none";
    var stop=document.getElementById("stop"); if(stop) stop.style.display="none";
    if(hasGuest()){
      document.getElementById("winform").style.display="none";
      document.getElementById("guestnote").style.display="block";
    } else {
      document.getElementById("winform").style.display="block";
      document.getElementById("guestnote").style.display="none";
      document.getElementById("f_pa").value=G.spelers[0].id; document.getElementById("f_pb").value=G.spelers[1].id;
      document.getElementById("f_win").value=G.spelers[w].id;
      document.getElementById("f_sa").value=G.start-G.spelers[0].rem; document.getElementById("f_sb").value=G.start-G.spelers[1].rem;
    }
  }
  function win(){ G.klaar=true; render(); save(); showWin(); }
  function render(msg){
    for(var i=0;i<2;i++){ document.getElementById("naam"+i).textContent=G.spelers[i].naam; document.getElementById("rem"+i).textContent=G.spelers[i].rem;
      document.getElementById("pan"+i).style.outline=(i===G.beurt&&!G.klaar)?"3px solid #2e7d32":"none"; }
    var t=""; for(var j=0;j<3;j++){ var d=G.darts[j]; t+="<span style='display:inline-block;min-width:48px;margin:0 4px;padding:7px 0;border:1px solid var(--line);border-radius:8px;font-weight:600'>"+(d?d.label:"–")+"</span>"; }
    document.getElementById("turn").innerHTML=t;
    document.getElementById("beurtinfo").textContent = msg ? msg : (G.klaar?"":("Aan de beurt: "+G.spelers[G.beurt].naam+" · nog "+prov()));
  }
  function toggleGuest(selId,gId){ var s=document.getElementById(selId),g=document.getElementById(gId);
    function upd(){ g.style.display = s.value==="__guest__" ? "block" : "none"; }
    s.addEventListener("change",upd); upd(); }
  function restore(){
    var raw; try{ raw=localStorage.getItem(SKEY); }catch(e){ return; }
    if(!raw) return; try{ G=JSON.parse(raw); }catch(e){ clearSaved(); return; }
    if(!G||!G.spelers||G.spelers.length!==2){ G=null; clearSaved(); return; }
    document.getElementById("setup").style.display="none";
    document.getElementById("game").style.display="block";
    var rb=document.getElementById("resume"); if(rb && !G.klaar) rb.style.display="flex";
    if(G.klaar){ showWin(); } else { buildBoard(); render(); }
  }
  document.getElementById("startBtn").addEventListener("click",startGame);
  document.getElementById("miss").addEventListener("click",function(){registerDart(0,"mis");});
  document.getElementById("undo").addEventListener("click",undo);
  document.getElementById("next").addEventListener("click",volgende);
  var stop=document.getElementById("stop"); if(stop) stop.addEventListener("click",function(e){ e.preventDefault(); if(confirm("Pot stoppen en wissen?")){ clearSaved(); location.href="/competitie/teller?game=darts"; } });
  var rd=document.getElementById("resumeDiscard"); if(rd) rd.addEventListener("click",function(){ clearSaved(); location.href="/competitie/teller?game=darts"; });
  var wf=document.getElementById("winform"); if(wf) wf.addEventListener("submit",function(){ clearSaved(); });
  Array.prototype.forEach.call(document.querySelectorAll("a.opnieuw"),function(a){ a.addEventListener("click",function(){ clearSaved(); }); });
  toggleGuest("p1","g1"); toggleGuest("p2","g2");
  restore();
})();
</script>`;

export function toernooienPage(game: GameType, list: Tournament[], players: Player[]) {
  return lds(html`
    ${pageTitle("trophy", "Toernooien")}
    ${gamePills(game, "/competitie/toernooien")}
    <form method="post" action="/competitie/toernooien" class="card">
      <h2 style="margin-top:0">Nieuw toernooi</h2>
      <input type="hidden" name="game" value="${game}" />
      <label>Naam <input name="name" required placeholder="Vrijmibo ${gameLabel(game)}" /></label>
      <label>Vorm <select name="format"><option value="round_robin">Round robin (geselecteerden tegen elkaar)</option><option value="single_elim">Single elimination</option></select></label>
      <div style="font-weight:640;font-size:.9rem;margin:12px 0 6px">Deelnemers selecteren</div>
      <div style="max-height:240px;overflow-y:auto;border:1px solid var(--line);border-radius:12px;padding:var(--sp-2)">
        ${players.map((p) => html`<label class="row" style="gap:var(--sp-2); font-weight:500; margin:4px 0"><input type="checkbox" name="player_ids" value="${p.id}" /> ${p.nickname || p.naam}</label>`)}
      </div>
      <button type="submit">Aanmaken</button>
    </form>
    <h2>Alle toernooien</h2>
    ${list.length === 0 ? emptyState({ icon: "trophy", title: "Nog geen toernooien" }) : html`<ul class="clean">${list.map((t) => html`<li>
        <a href="/competitie/toernooi/${t.id}"><strong>${t.name}</strong></a>
        <span class="muted">${gameLabel(t.game_type)} · ${t.status}</span>
      </li>`)}</ul>`}
    <p class="muted"><a href="/competitie?game=${game}">← ranglijst</a></p>
  `);
}

export function toernooiDetail(
  t: Tournament,
  deelnemers: { id: string; naam: string }[],
  standings: { id: string; naam: string; wins: number }[],
  pairs: [{ id: string; naam: string }, { id: string; naam: string }][],
  players: Player[],
) {
  const nm = naamMap(players);
  const ingeschreven = new Set(deelnemers.map((d) => d.id));
  return lds(html`
    <h1>${t.name}</h1>
    <p class="muted">${gameLabel(t.game_type)} · ${t.format === "round_robin" ? "round robin" : "single elim"} · <strong>${t.status}</strong></p>

    ${t.status === "open"
      ? html`<article class="card">
          <h2 style="margin-top:0">Inschrijven</h2>
          <form method="post" action="/competitie/toernooi/${t.id}/join">
            <label>Speler <select name="player_id">${players.filter((p) => !ingeschreven.has(p.id)).map((p) => html`<option value="${p.id}">${nm(p.id)}</option>`)}</select></label>
            <button type="submit">Inschrijven</button>
          </form>
          <p class="muted">${deelnemers.length} ingeschreven: ${deelnemers.map((d) => d.naam).join(", ") || "—"}</p>
          <form method="post" action="/competitie/toernooi/${t.id}/start" style="margin-top:var(--sp-2)"><button ${deelnemers.length < 2 ? "disabled" : ""}>Toernooi starten</button></form>
        </article>`
      : ""}

    ${t.status !== "open" && pairs.length
      ? html`<h2>Programma (round robin)</h2>
          <ul class="clean">${pairs.map((pr) => html`<li class="row wrap" style="gap:10px">
            <span style="flex:1 1 auto">${pr[0].naam} <span class="muted">vs</span> ${pr[1].naam}</span>
            <form method="post" action="/competitie/match" class="row" style="margin:0; gap:6px">
              <input type="hidden" name="game" value="${t.game_type}" /><input type="hidden" name="player_a" value="${pr[0].id}" />
              <input type="hidden" name="player_b" value="${pr[1].id}" /><input type="hidden" name="tournament_id" value="${t.id}" />
              <input type="hidden" name="back" value="/competitie/toernooi/${t.id}" />
              <select name="winner" style="margin:0;width:auto"><option value="${pr[0].id}">${pr[0].naam} wint</option><option value="${pr[1].id}">${pr[1].naam} wint</option></select>
              <button style="margin:0;padding:var(--sp-2) var(--sp-3)" aria-label="Uitslag opslaan" title="Uitslag opslaan">${raw(`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17l9-10"/></svg>`)}</button>
            </form>
          </li>`)}</ul>`
      : ""}

    <h2>Stand</h2>
    ${standings.length === 0 ? html`<p class="empty">—</p>` : html`<table><thead><tr><th>#</th><th>Speler</th><th>Wins</th></tr></thead>
      <tbody>${standings.map((s, i) => html`<tr><td class="pos">${i + 1}</td><td>${s.naam}</td><td class="pts">${s.wins}</td></tr>`)}</tbody></table>`}
    <p class="muted"><a href="/competitie/toernooien?game=${t.game_type}">← toernooien</a></p>
  `);
}
