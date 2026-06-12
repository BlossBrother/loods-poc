import { Hono } from "hono";
import type { Context } from "hono";
import { layout, errorPage } from "./views/layout";
import { voorJouPage, nieuwsPagina, documentenPagina } from "./views/intranet";
import { homeShellContent } from "./views/home2";
import { crmDb, listTaken } from "./crm/data";
import { buildForYou, touchSeen, groet, type ForYou } from "./foryou";
import { getHeaderConfig, getVariants, pickGreeting, amsterdamHour, saveHeaderConfig, saveVariants, resetHeader, DEFAULT_CONFIG, DEFAULT_VARIANTS, type HeaderConfig, type GreetingVariant } from "./headercfg";
import { beheerHeader } from "./views/beheerheader";
import { ask as kbAsk, reindexAll as kbReindex, algemeenAntwoord, removeDoc as removeKbDoc, webZoek } from "./rag";
import { listDump, verwerkDump, zetDumpAudience, verwijderDump } from "./kennisdump";
import { haalAnalytics } from "./analytics";
import { stijlgidsPage } from "./views/stijlgids";
import { getNavLayout, navSidebarPayload, saveNavGroups, saveModuleGroups } from "./nav";
import { bezoekPage } from "./views/bezoek";
import { socialPage, type PollView } from "./views/social";
import { createPoll, listPolls, getPoll, deletePoll, closePoll, getAlleStemmen, getStemmen, tally, vote } from "./polls";
import { smoelenboekPage } from "./views/smoelenboek";
import { zoekPage, zoekResultaten } from "./views/zoek";
import { emojiData, isEmoji } from "./views/emoji";
import {
  beheerHome,
  beheerModules,
  geenToegang,
  beheerMedewerkers,
  beheerNieuws,
  beheerDocumenten,
  beheerAfdelingen,
  beheerKlanten,
  beheerPush,
  beheerRassen,
  beheerTeeltadvies,
  beheerSnoeiPluk,
  beheerKlantdocumenten,
  beheerLeesbevestiging,
  beheerKennisdump,
  beheerAnalytics,
  beheerTiles,
  type LeesItem,
} from "./views/beheer";
import { getTiles, saveTiles, resetTiles } from "./tiles";
import { bevestigGelezen, gelezenDoor, leesOverzicht, registreerGezien } from "./leesbevestiging";
import { syncAccessUitzendkrachten, accessSyncGeconfigureerd } from "./accesssync";
import { zetStatus, wieIsErVandaag, opschoonAanwezigheid, isAanwStatus } from "./aanwezigheid";
import { vandaagPage } from "./views/vandaag";
import { securityHeaders } from "./security";
import { idemId } from "./idem";
import { softDeleteInTabel, restoreInTabel } from "./airtable";
import { restorePoll } from "./polls";
import { restoreEvent } from "./agenda";
import { deleteLastMatch } from "./elo";
import { homeSummary } from "./summary";
import { reindexZoek, zoekFts, type ZoekGroep } from "./zoekindex";
import { notifyAlle, listNotificaties, getNotificatie, markRead, getPrefs, setPref, unreadCount, purgeNotificaties, NOTIF_MODULES, verwijderNotificatiesVoorUrl, verwijderNotificatie, verwijderAlleNotificaties } from "./notify";
import { notificatiesPage } from "./views/notificaties";
import { rateLimit, limietKey } from "./ratelimit";
import { auditPage, type AuditRij } from "./views/auditlog";
import { amsterdamLocalToUtcIso, formatDatumTijd } from "./tz";
import { komendeVerjaardagen } from "./birthdays";
import { MANIFEST, SERVICE_WORKER, iconResponse } from "./pwa";
import { resolveAccessEmail, isBeheerderVoor, medewerkerVoorEmail, isDev } from "./access";
import { logEvent } from "./logs";
import {
  createMagicToken,
  verifyMagicToken,
  createInviteToken,
  verifyInviteToken,
  createSessionToken,
  verifySessionToken,
  sessionCookie,
  clearSessionCookie,
  readSessionCookie,
  SESSION_TTL,
} from "./portal/session";
import { sendMagicLink } from "./portal/mail";
import { sendPush, type PushPayload } from "./push/webpush";
import { BRAND_LOGO_B64 } from "./brand";
import { b64ToBytes } from "./icons";
import { pickLang, getStrings } from "./portal/i18n";
import {
  portalLayout,
  portalLogin,
  portalLoginSent,
  portalDashboard,
  portalRassen,
  portalTeeltadvies,
  portalSnoeiPluk,
  portalDocumenten,
} from "./views/portal";
import {
  getGepubliceerdNieuws,
  getDocumenten,
  getBezoekVandaag,
  getReceptieVandaag,
  createBezoek,
  setBezoekStatus,
  getMedewerkers,
  naamMap,
  getPosts,
  getReacties,
  getNieuwsReacties,
  getNieuwsReactie,
  createNieuwsReactie,
  deleteNieuwsReactie,
  getEmojiReacties,
  getEmojiVoorTarget,
  toggleEmoji,
  createPost,
  createReactie,
  getAlleNieuws,
  getAfdelingen,
  createInTabel,
  updateInTabel,
  deleteInTabel,
  opschoonBezoekmeldingen,
  getKlantByEmail,
  getKlanten,
  updateKlantLogin,
  getPushAbonnementen,
  upsertPushAbonnement,
  deletePushByEndpoint,
  getRassen,
  getTeeltadvies,
  getSnoeiPluk,
  getKlantdocumenten,
  portaalKeyToegestaan,
  getAlleRassen,
  getAlleTeeltadvies,
  getAlleSnoeiPluk,
  getAlleKlantdocumenten,
  type AirtableRecord,
  type ReceptieFields,
  type MedewerkerFields,
  type Env,
} from "./airtable";
import { getPlayerByEmail, getVoicePrefs, setVoicePref, updateProfile, parseSpotify } from "./account";
import { cachedTranslate, isLang } from "./translate";
import { mijnAccountPage, geenSpeler } from "./views/account";
import {
  getBalance, getActiveMenu, getAllMenu, addMenuItem, updateMenuItem,
  getLedger, addOrder, addTopup, settle, setBalance, allBalances, ordersSince,
} from "./snacks";
import { frietBestel, mijnSaldo, frietBeheer } from "./views/friet";
import { getEventsInRange, getEvent, createEvent, updateEvent, deleteEvent, zetRsvp, rsvpStand } from "./agenda";
import { agendaPage, eventDetail, verlofPage } from "./views/agenda";
import { getVerlofInRange, getActiveMedewerkers } from "./verlof";
import { syncVerlof } from "./buddee";
import {
  getRanking, listMatches, getRating, getNemesis, getLast5, recordMatch,
  createTournament, listTournaments, getTournament, setTournamentStatus,
  addTournamentPlayer, getTournamentPlayers, tournamentStandings, roundRobinPairs,
  type GameType,
} from "./elo";
import { getPlayerById, getAllPlayers, isAdmin, isKantineBeheerder, setExtraRole } from "./account";
import { competitieOverzicht, ranglijstPage, spelerProfiel, scoreTeller, toernooienPage, toernooiDetail } from "./views/competitie2";
import { MODULES, ALL_MODULE_IDS, getEnabledOrdered, setEnabledModules, moduleRoleTokens, isModuleOn, getFlag, setFlag, getFlags, PUSH_FEATURES } from "./modules";
import { createMelding, listMeldingen, setMeldingStatus, archiveMelding, getMelding, getOntvangers, setOntvangers, opschoonMeldingen, type MeldingType } from "./meldingen";
import { meldingenPagina, beheerMeldingen } from "./views/meldingen";
import { createNoodmelding, listNoodmeldingen, deleteNoodmelding, clearNoodmeldingen, getBhvOntvangers, setBhvOntvangers, type Noodmelding } from "./noodmelding";
import { noodmeldingPagina, beheerBhv } from "./views/noodmelding";
import { createBug, listBugs, setBugStatus, deleteBug } from "./bugmelding";
import { canEditOrDelete } from "./ownership";
import { logAudit } from "./audit";
import { bugPagina, beheerBugs } from "./views/bugmelding";
import { seedIfEmpty, listCourses, getCourse, getChapters, getChapter, getDoneChapters, markChapterDone, createCourse, updateCourse, deleteCourse, addChapter, updateChapter, deleteChapter } from "./trainingen";
import { trainingenLijst, trainingDetail, beheerTrainingen, beheerCourse } from "./views/trainingen";
import { crmRoutes } from "./crm/routes";

const app = new Hono<{ Bindings: Env; Variables: { roles: string[]; playerId?: string; modules: string[] } }>();

// Uitzendkracht-allowlist (v186, BLOK-F): beperkte toegang voor rol "Uitzendkracht".
const EXTERN_MODULES = new Set(["prikbord", "agenda", "nieuws"]);

// Rollen + aan-staande modules voor de zijbalk: speler (medewerker) ophalen via Access-email.
// Aan-staande modules komen als "mod:<id>" in roles zodat de nav-filtering ze ziet
// zonder dat elke layout()-aanroep aangepast hoeft te worden.
app.use("*", async (c, next) => {
  const path = c.req.path;
  // /api/modules is een hot path (elke paginalaad) en heeft geen identiteit nodig -> licht houden.
  // Overige /api-routes (o.a. /api/reactie, /api/reacties) krijgen WEL dezelfde identiteits-
  // resolutie als gewone pagina's, zodat reacties dezelfde auth-flow gebruiken als de rest.
  const skip = path === "/api/modules" || path.startsWith("/portaal") || path === "/sw.js" ||
    path.startsWith("/icon") || path === "/manifest.webmanifest" || path === "/brand-logo.png" ||
    path === "/bestand" || path === "/health";
  if (!skip) {
    try {
      const email = await resolveAccessEmail(c, c.env);
      const player = email ? await getPlayerByEmail(c.env, email) : undefined;
      const roles = player ? [...player.roles] : [];
      if (email && (isBeheerderVoor(email, c.env, []) || player?.rol === "Beheerder")) roles.push("beheerder");
      // Content-beheer (v186): rol Redacteur (HR) — ziet Inhoud-beheer in het menu;
      // de pad-bewuste magBeheren-gate beperkt 'm server-side tot de content-routes.
      if (player?.rol === "Redacteur") roles.push("redacteur");
      // Uitzendkracht (v186, BLOK-F): token "extern" — module-toegang wordt hieronder
      // beperkt tot de allowlist; de bestaande PAD_MODULE-guard blokkeert de rest op URL.
      const extern = player?.rol === "Uitzendkracht" && !roles.includes("beheerder");
      if (extern) roles.push("extern");
      // CRM (ADR-001): toegang voor team Concepts + beheerders. Nav-items en de
      // /crm-guard kijken naar dit token; uitbreiden kan later via Beheer.
      if ((player?.afdeling ?? "").trim().toLowerCase() === "concepts" || roles.includes("beheerder")) roles.push("crm");
      // Profiel-avatar voor de header (v175): initialen + evt. teamfoto als rol-token,
      // zodat layout() 'm server-side kan renderen zonder signatuurwijziging.
      if (player) {
        const nd = (player.naam || "").trim().split(/\s+/);
        const ini = (((nd[0]?.[0] ?? "") + (nd.length > 1 ? (nd[nd.length - 1][0] ?? "") : "")) || "?").toUpperCase();
        const fotoPad = player.fotoKey ? (/^https?:\/\//.test(player.fotoKey) ? player.fotoKey : `/bestand?k=${encodeURIComponent(player.fotoKey)}`) : undefined;
        roles.push("me:" + JSON.stringify({ i: ini, f: fotoPad }));
      }
      const navLayout = await getNavLayout(c.env);
      const payload = navSidebarPayload(navLayout);
      // Uitzendkracht: alleen prikbord/agenda/nieuws — menu's (nav-token) én
      // mod-tokens gefilterd, dus zijbalk, ballon, home-menu en URL-guard volgen vanzelf.
      if (extern) payload.m = payload.m.filter((x) => EXTERN_MODULES.has(x[0]));
      const enabledModules = payload.m.filter((x) => x[2]).map((x) => x[0]);
      c.set("modules", enabledModules);
      roles.push(...moduleRoleTokens(enabledModules));
      roles.push("nav:" + JSON.stringify(payload));
      c.set("roles", roles);
      if (player) c.set("playerId", player.id);
    } catch {
      c.set("roles", []);
      c.set("modules", [...ALL_MODULE_IDS]);
    }
  }
  await next();
});

app.use("*", securityHeaders);

// CSRF-hardening (securityrapport §3.4): weiger state-changing verzoeken die
// aantoonbaar van een andere site komen. Moderne browsers sturen Sec-Fetch-Site;
// we laten same-origin/same-site/none door en blokkeren "cross-site". Ontbreekt
// die header, dan vergelijken we de Origin-host met de eigen host. Server-naar-
// server endpoints (geauthenticeerd via PUSH_API_KEY) en veilige methoden (GET/
// HEAD/OPTIONS) blijven ongemoeid.
const CSRF_SKIP = new Set(["/api/push", "/api/bezoek-melding"]);
app.use("*", async (c, next) => {
  const m = c.req.method;
  if (m === "GET" || m === "HEAD" || m === "OPTIONS") return next();
  if (CSRF_SKIP.has(c.req.path)) return next();
  const sfs = c.req.header("sec-fetch-site");
  if (sfs) {
    if (sfs === "cross-site") return c.text("Cross-site verzoek geweigerd", 403);
    return next();
  }
  const origin = c.req.header("origin");
  if (origin) {
    try {
      const host = c.req.header("host") ?? new URL(c.req.url).host;
      if (new URL(origin).host !== host) return c.text("Cross-site verzoek geweigerd", 403);
    } catch {
      return c.text("Ongeldige origin", 403);
    }
  }
  return next();
});

// Server-side module-guard: een uitgeschakelde module is ook op URL/API onbereikbaar,
// niet alleen verborgen in het menu. Pad-prefix -> module-id. Beheer blijft admin-gated.
const PAD_MODULE: [string, string][] = [
  ["/agenda", "agenda"],
  ["/competitie", "competitie"],
  ["/friet", "kantine"],
  ["/social", "prikbord"],
  ["/smoelenboek", "team"],
  ["/meldingen", "meldingen"],
  ["/noodmelding", "meldingen"],
  ["/trainingen", "trainingen"],
  ["/crm", "crm"],
  ["/nieuws", "nieuws"],
  ["/documenten", "documenten"],
];
app.use("*", async (c, next) => {
  const path = c.req.path;
  if (!path.startsWith("/beheer")) {
    for (const [prefix, mod] of PAD_MODULE) {
      if (path === prefix || path.startsWith(prefix + "/")) {
        if (!isModuleOn(c.get("roles") ?? [], mod)) {
          return c.req.method === "GET" ? c.redirect("/") : c.text("Module uitgeschakeld", 403);
        }
        break;
      }
    }
  }
  return next();
});

// Kleine, altijd-verse endpoint voor de zijbalk-modulesync (snappy + actueel).
app.get("/api/modules", async (c) => c.json({ modules: await getEnabledOrdered(c.env) }));

// CRM-module (ADR-001): eigen sub-app (src/crm/routes.ts), toegang via rol-token "crm".
app.route("/crm", crmRoutes);

// Identiteit & beheerdersrechten van het INTERNE deel komen uit ./access
// (Cloudflare Access-JWT of -header; niet meer fail-open). Hier alleen nog een
// kleine helper voor de auteurslijsten.
// Veilige interne redirect (securityrapport §3.5): laat alleen een pad binnen de
// eigen site toe. Weert open-redirects (`https://evil`) én protocol-relatieve
// URL's (`//evil`, begint óók met "/"). Anders de fallback.
function veiligTerug(back: string | undefined | null, fallback: string): string {
  const b = String(back ?? "");
  return b.startsWith("/") && !b.startsWith("//") ? b : fallback;
}

function actieveAuteurs(medewerkers: AirtableRecord<MedewerkerFields>[]) {
  return medewerkers
    .filter((m) => m.fields.Actief !== false)
    .map((m) => ({ id: m.id, naam: m.fields.Naam ?? "(onbekend)" }));
}

// Content-beheer-paden (v186): deze /beheer-onderdelen zijn ook toegankelijk voor
// rol "Redacteur" (HR): inhoud maken/bijwerken, geen platform-instellingen.
// "/beheer" (de tegelpagina) exact; de rest als prefix.
const REDACTEUR_PADEN = ["/beheer/nieuws", "/beheer/documenten", "/beheer/medewerkers", "/beheer/afdelingen", "/beheer/trainingen", "/beheer/leesbevestiging"];
function isRedacteurPad(path: string): boolean {
  if (path === "/beheer") return true;
  return REDACTEUR_PADEN.some((p) => path === p || path.startsWith(p + "/"));
}

// Beheer-gate: resolve de geverifieerde identiteit en check beheerdersrol.
// v186: pad-bewust — een Redacteur (HR) komt alleen door op de content-paden,
// een echte beheerder overal. Platform-routes (modules, header, push, BHV, audit,
// klantenportaal) blijven daardoor automatisch beheerder-only.
async function magBeheren(
  c: Context,
  medewerkers: AirtableRecord<MedewerkerFields>[],
): Promise<boolean> {
  const email = await resolveAccessEmail(c, c.env);
  if (isBeheerderVoor(email, c.env, medewerkers)) return true;
  const me = medewerkerVoorEmail(email, medewerkers);
  return me?.fields.Rol === "Redacteur" && isRedacteurPad(c.req.path);
}

// Stuur een pushmelding naar alle aangemelde apparaten. Verlopen abonnementen
// (404/410) worden opgeruimd. Doet niets als de VAPID-sleutels ontbreken.
async function pushNaarIedereen(env: Env, payload: PushPayload): Promise<void> {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return;
  const subs = await getPushAbonnementen(env);
  await Promise.all(
    subs.map(async (s) => {
      const f = s.fields;
      if (!f.Endpoint || !f.P256dh || !f.Auth) return;
      try {
        const r = await sendPush(
          env,
          { endpoint: f.Endpoint, p256dh: f.P256dh, auth: f.Auth },
          payload,
        );
        if (r.gone) await deleteInTabel(env, "Pushabonnementen", s.id);
      } catch (e) {
        console.error("push faalde:", e);
      }
    }),
  );
}

// Stuur een pushmelding naar één specifieke persoon (op e-mail). Retourneert het
// aantal geslaagde afleveringen.
async function pushNaarEmail(
  env: Env,
  email: string,
  payload: PushPayload,
): Promise<number> {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return 0;
  const lc = email.toLowerCase();
  const subs = (await getPushAbonnementen(env)).filter(
    (s) => (s.fields["E-mail"] ?? "").toLowerCase() === lc,
  );
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      const f = s.fields;
      if (!f.Endpoint || !f.P256dh || !f.Auth) return;
      try {
        const r = await sendPush(
          env,
          { endpoint: f.Endpoint, p256dh: f.P256dh, auth: f.Auth },
          payload,
        );
        if (r.gone) await deleteInTabel(env, "Pushabonnementen", s.id);
        else if (r.status >= 200 && r.status < 300) sent++;
      } catch (e) {
        console.error("push faalde:", e);
      }
    }),
  );
  return sent;
}

// Wekelijkse samenvatting (maandag, Amsterdam) van openstaande meldingen naar de
// per categorie aangewezen ontvangers. Stilte als er niets openstaat of niemand is getagd.
async function weekelijkseMeldingenPush(env: Env): Promise<void> {
  if (!(await getFlag(env, "push_meldingen", true))) return;
  const dag = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Amsterdam", weekday: "short" }).format(new Date());
  if (dag !== "Mon") return;
  const players = await getAllPlayers(env);
  const emailById = new Map(players.map((p) => [p.id, p.email] as const));
  const types: MeldingType[] = ["voorraad", "defect"];
  for (const type of types) {
    const open = await listMeldingen(env, "open", type);
    if (open.length === 0) continue;
    const ids = await getOntvangers(env, type);
    const label = type === "voorraad" ? "voorraad" : "defecten";
    const payload = { title: `Wekelijkse samenvatting: ${label}`, body: `${open.length} openstaande ${type}-melding(en). Bekijk het overzicht.`, url: "/meldingen" };
    for (const id of ids) {
      const em = emailById.get(id);
      if (em) await pushNaarEmail(env, em, payload);
    }
  }
}

// v204: ochtend-push "Waar werk je vandaag?" (08:15 Amsterdam, ma-vr) — alleen
// naar wie vandaag nog GEEN status heeft én niet met verlof is (Buddee). Eén tik
// op de push = deeplink naar /vandaag. Opt-out per gebruiker via Notificaties →
// Voorkeuren (module 'team'). Eenmaal-per-dag-slot via app_settings.
async function ochtendStatusPush(env: Env): Promise<void> {
  if (amsterdamHour() !== 8) return; // de andere DST-trigger (zomer/winter) slaat over
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Amsterdam", weekday: "short" }).format(new Date());
  if (wd === "Sat" || wd === "Sun") return;
  if (!env.DB) return;
  const dag = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date());
  const slot = await env.DB.prepare("SELECT value FROM app_settings WHERE tenant_id='default' AND key='wwv_laatst'").first<{ value: string }>().catch(() => null);
  if (slot?.value === dag) return; // al verstuurd vandaag
  await env.DB.prepare("INSERT INTO app_settings (tenant_id, key, value, updated_at) VALUES ('default','wwv_laatst',?,?) ON CONFLICT(tenant_id, key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at")
    .bind(dag, Date.now()).run();
  const { rijen } = await wieIsErVandaag(env);
  const doel = rijen.filter((r) => !r.verlof && !r.status && r.email).map((r) => r.email);
  if (!doel.length) return;
  await notifyAlle(
    env,
    { module: "team", titel: "Waar werk je vandaag?", body: "Eén tik: kantoor, thuis of op pad — handig voor je collega's.", url: "/vandaag" },
    doel,
    (email, payload) => pushNaarEmail(env, email, payload),
  );
  console.log(`Ochtend-statuspush verstuurd naar ${doel.length} collega('s).`);
}

// Push bij een nieuw/gewijzigd agenda-item (indien aangezet).
async function agendaPush(env: Env, ev: { title: string; start_at: number; location?: string }, url: string): Promise<void> {
  if (!(await getFlag(env, "push_agenda", true))) return;
  const wanneer = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(ev.start_at));
  // 4.2: via het notificatiecentrum \u2014 historie per medewerker, per-module voorkeuren,
  // push met badge_count; apparaten zonder e-mail krijgen de kale push.
  const meds = await getMedewerkers(env);
  const emails = meds.filter((m) => m.fields.Actief !== false && m.fields["E-mail"]).map((m) => String(m.fields["E-mail"]));
  await notifyAlle(
    env,
    { module: "agenda", titel: "Agenda: " + ev.title, body: wanneer + (ev.location ? " \u00b7 " + ev.location : ""), url },
    emails,
    (email, payload) => pushNaarEmail(env, email, payload),
    async (payload) => {
      const anoniem = (await getPushAbonnementen(env)).filter((s) => !(s.fields["E-mail"] ?? "").trim());
      await Promise.all(anoniem.map(async (s) => {
        const f = s.fields;
        if (!f.Endpoint || !f.P256dh || !f.Auth) return;
        try {
          const r = await sendPush(env, { endpoint: f.Endpoint, p256dh: f.P256dh, auth: f.Auth }, payload);
          if (r.gone) await deleteInTabel(env, "Pushabonnementen", s.id);
        } catch (e) { console.error("push faalde:", e); }
      }));
    },
  );
}

// Zoek het e-mailadres bij "voor wie" (e-mailadres of een (deel van een) naam).
const normNaam = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accenten weg
    .replace(/[^a-z0-9]+/g, " ") // streepjes/punten/spaties gelijk
    .trim();

async function resolveEmail(env: Env, voor?: string): Promise<string | undefined> {
  if (!voor) return undefined;
  if (voor.includes("@")) return voor.trim();
  const q = normNaam(voor);
  if (!q) return undefined;
  const med = await getMedewerkers(env);
  const naam = (x: AirtableRecord<MedewerkerFields>) => normNaam(x.fields.Naam ?? "");
  // 1) exact (genormaliseerd), 2) e-mail begint met de naam, 3) naam bevat / wordt bevat
  let m = med.find((x) => naam(x) === q);
  if (!m) m = med.find((x) => (x.fields["E-mail"] ?? "").toLowerCase().split("@")[0] === q.replace(/ /g, "."));
  if (!m) m = med.find((x) => { const n = naam(x); return !!n && (n.includes(q) || (q.length > 2 && q.includes(n))); });
  return m?.fields["E-mail"];
}

// Authenticatie voor de server-naar-server endpoints. Accepteert het geheim via
// "Authorization: Bearer <secret>" of via de header "X-Intranet-Secret".
function pushAuthOk(c: Context): boolean {
  const key = c.env.PUSH_API_KEY;
  if (!key) return false;
  const bearer = (c.req.header("authorization") || "").replace(/^Bearer\s+/i, "");
  return bearer === key || c.req.header("x-intranet-secret") === key;
}

// ---- PWA assets ----
app.get("/manifest.webmanifest", (c) => {
  c.header("Content-Type", "application/manifest+json");
  return c.body(JSON.stringify(MANIFEST));
});
app.get("/sw.js", (c) => {
  c.header("Content-Type", "text/javascript; charset=utf-8");
  c.header("Cache-Control", "no-cache");
  return c.body(SERVICE_WORKER);
});
app.get("/icon-192.png", () => iconResponse(192));
app.get("/icon-512.png", () => iconResponse(512));
app.get("/brand-logo.png", () =>
  new Response(b64ToBytes(BRAND_LOGO_B64), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
  }),
);

// Alleen deze content-types tonen we inline; de rest forceren we als download.
// Voorkomt dat een geupload HTML/SVG-bestand same-origin in de browser uitvoert.
const INLINE_OK = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

function bestandResponse(obj: R2ObjectBody, key: string): Response {
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  const naam = (obj.customMetadata?.naam ?? key.split("/").pop() ?? "bestand").replace(
    /["\\\r\n]/g,
    "",
  );
  const type = (obj.httpMetadata?.contentType ?? "").toLowerCase();
  const dispositie = INLINE_OK.has(type) ? "inline" : "attachment";
  headers.set("Content-Disposition", `${dispositie}; filename="${naam}"`);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("etag", obj.httpEtag);
  return new Response(obj.body, { headers });
}

// Download van een intern geupload document uit R2 (achter Cloudflare Access).
// Defense-in-depth (securityrapport §3.3): /bestand zit achter Access (alleen
// /portaal* heeft de bypass), maar we eisen hier expliciet een interne identiteit
// zodat een verzoek zónder Access-identiteit nooit een sleutel kan ophalen.
// Portaal-afbeeldingen lopen bewust via /portaal/bestand (eigen allowlist), niet hier.
app.get("/bestand", async (c) => {
  const key = c.req.query("k");
  if (!key || !c.env.DOCS) return c.notFound();
  if (!isDev(c.env) && !(await resolveAccessEmail(c, c.env))) return c.notFound();
  const obj = await c.env.DOCS.get(key);
  if (!obj) return c.notFound();
  return bestandResponse(obj, key);
});

// ---- Health ----
app.get("/health", (c) =>
  c.json({ ok: true, service: "fresh-forward-intranet" }),
);

// ---- Intranet ----
app.get("/", async (c) => {
  const [nieuws, medewerkers] = await Promise.all([
    getGepubliceerdNieuws(c.env),
    getMedewerkers(c.env),
  ]);
  const jarigen = komendeVerjaardagen(medewerkers, 7);
  const apps = {
    buddee: c.env.BUDDEE_URL ?? "https://app.buddee.nl",
    timechimp: c.env.TIMECHIMP_URL ?? "https://app.timechimp.com",
    wkPoule: c.env.WK_POULE_URL || "https://www.scorito.com",
  };
  const email = await resolveAccessEmail(c, c.env);
  const me = medewerkerVoorEmail(email, medewerkers);
  // "Nieuw"-badge op basis van wanneer je het nieuws voor het laatst zag.
  // Ingelogd (Access) => per persoon, over apparaten heen (opgeslagen bij de medewerker).
  // Niet herkend (lokaal/dev) => terugval op een per-browser cookie.
  const momentVan = (n: AirtableRecord<typeof nieuws[number]["fields"]>) =>
    n.fields.Publicatiedatum ? Date.parse(n.fields.Publicatiedatum) : Date.parse(n.createdTime);
  let seen: number | undefined;
  if (me) {
    seen = me.fields["Nieuws gezien"] ? Date.parse(me.fields["Nieuws gezien"]) : undefined;
  } else {
    const seenRaw = (c.req.header("cookie") ?? "")
      .split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("ff_nieuws_seen="))
      ?.slice("ff_nieuws_seen=".length);
    seen = seenRaw ? Number(seenRaw) : undefined;
  }
  const cutoff = seen;
  const nieuwIds = new Set<string>(
    cutoff !== undefined ? nieuws.filter((n) => momentVan(n) > cutoff).map((n) => n.id) : [],
  );
  // "Gezien" wordt pas bijgewerkt op /nieuws — daar lees je het echt (opruimslag).
  // ---- Loods-home (restyle ronde 1): data voor de lagen van de home-stack ----
  // v186: c.get("modules") is voor uitzendkrachten al beperkt tot de allowlist —
  // home (chips, Voor jou, Snel naar) volgt daardoor dezelfde beperking.
  const toegestaneModules = new Set(c.get("modules") ?? []);
  const enabledOrder = (await getEnabledOrdered(c.env).catch(() => [] as string[]))
    .filter((id) => toegestaneModules.size === 0 || toegestaneModules.has(id));
  const enabledForYou = new Set(enabledOrder);
  let fy: ForYou = { totalNew: 0, groups: [] };
  try { fy = await buildForYou(c.env, me?.id, enabledForYou); } catch { /* leeg laten */ }
  // Vandaag (Amsterdam): events tot middernacht + kantine-deadline.
  const nu = Date.now();
  const [amsU, amsM] = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()).split(":").map(Number);
  const dagEinde = nu + (24 * 60 - (amsU * 60 + amsM)) * 60_000;
  let events: Awaited<ReturnType<typeof getEventsInRange>> = [];
  if (enabledForYou.has("agenda")) { try { events = await getEventsInRange(c.env, nu, dagEinde); } catch { events = []; } }
  const fmtTijd = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", hour: "2-digit", minute: "2-digit", hour12: false });
  const vandaag = events.slice(0, 4).map((e) => ({
    tijd: e.all_day ? "hele dag" : fmtTijd.format(new Date(e.start_at)),
    titel: e.title, sub: e.location ?? e.category ?? "", route: `/agenda/event/${e.id}`,
  }));
  let kantine: { titel: string; sub: string; route: string } | null = null;
  if (enabledForYou.has("kantine") && (await getFlag(c.env, "bestellijst_open", true))) {
    kantine = { titel: "Friet bestellen kan nog", sub: "De bestellijst is open", route: "/friet" };
  }
  // v201 (audit 12/6 §C1): afwezigen van vandaag óp home — zelfde bron als /vandaag.
  // AVG-veilige default: alleen "afwezig", geen verloftype (open HR-besluit v185).
  let afwezig: { aantal: number; sub: string } | null = null;
  // v204: one-tap-statusvraag op home (ma-vr, alleen als je vandaag nog niets
  // hebt ingevuld en niet met verlof bent) — de zachte tegenhanger van de
  // ochtend-push; bewust GEEN blokkerende vraag bij het openen (te opdringerig).
  let statusVraag = false;
  if (enabledForYou.has("team")) {
    try {
      const { rijen } = await wieIsErVandaag(c.env);
      const weg = rijen.filter((r) => !!r.verlof);
      if (weg.length > 0) {
        const namen = weg.slice(0, 2).map((r) => r.naam.trim().split(/\s+/)[0]).join(", ");
        afwezig = { aantal: weg.length, sub: weg.length > 2 ? `${namen} en ${weg.length - 2} anderen` : namen };
      }
      const mijEmail = (email ?? "").toLowerCase();
      const mij = mijEmail ? rijen.find((r) => r.email.toLowerCase() === mijEmail) : undefined;
      const wdH = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Amsterdam", weekday: "short" }).format(new Date());
      statusVraag = !!mij && !mij.status && !mij.verlof && wdH !== "Sat" && wdH !== "Sun";
    } catch { /* aanwezigheid niet beschikbaar -> geen rij/vraag */ }
  }
  // BHV-banner: alleen bij een noodmelding van het afgelopen half uur.
  let alarm: { titel: string; sub: string; route: string } | null = null;
  try {
    const nood = (await listNoodmeldingen(c.env, 1))[0];
    if (nood && nu - nood.created_at < 30 * 60_000) {
      alarm = { titel: "Noodmelding actief", sub: `${nood.melder_naam ?? "Onbekend"}${nood.locatie ? ` · ${nood.locatie}` : ""}`, route: "/noodmelding" };
    }
  } catch { /* geen meldingen */ }
  // v192: must-read-banner — recente nieuwsberichten (≤14 dagen) waarvoor deze
  // gebruiker nog geen leesbevestiging gaf, als vaste kaart bovenaan home
  // (rapport diepteonderzoek §3.1; bouwt op leesbevestiging v185).
  let mustread: { titel: string; sub: string; route: string } | null = null;
  // v194: banner alleen als de "Gelezen"-knop aanstaat (vlag lees_knop) — bij
  // ghost-modus (stille registratie) is er niets om te bevestigen.
  if (email && enabledForYou.has("nieuws") && (await getFlag(c.env, "lees_knop", false))) {
    try {
      const bevestigd = await gelezenDoor(c.env, email);
      const RECENT_MS = 14 * 24 * 60 * 60 * 1000;
      const open = nieuws.filter((n) => nu - momentVan(n) < RECENT_MS && !bevestigd.has(`nieuws:${n.id}`));
      if (open.length > 0) {
        mustread = {
          titel: open.length === 1 ? "1 bericht wacht op je leesbevestiging" : `${open.length} berichten wachten op je leesbevestiging`,
          sub: open[0].fields.Titel ?? "(zonder titel)",
          route: open.length === 1 ? `/nieuws#nieuws-${open[0].id}` : "/nieuws",
        };
      }
    } catch { /* tabel ontbreekt -> geen banner */ }
  }
  // Teller-chips + Voor jou voeden uit dezelfde bron als de headerteller (foryou).
  const CHIP_ROUTE: Record<string, string> = { prikbord: "/social", meldingen: "/meldingen", nieuws: "/nieuws", agenda: "/agenda", competitie: "/competitie", kantine: "/friet", trainingen: "/trainingen", team: "/smoelenboek", documenten: "/documenten", crm: "/crm" };
  // v181: documenten = boek (was 'file', identiek aan Nieuws) — nu gelijk aan zijbalk/ballon.
  const CHIP_ICON: Record<string, string> = { prikbord: "msg", meldingen: "bell", nieuws: "file", agenda: "cal", competitie: "award", kantine: "coffee", trainingen: "book", team: "users", documenten: "book", crm: "brief" };
  const chips = fy.groups.filter((g) => g.count > 0).slice(0, 4).map((g) => ({ label: g.label, count: g.count, route: CHIP_ROUTE[g.moduleKey] ?? "/voor-jou", icon: CHIP_ICON[g.moduleKey] ?? "file" }));
  // App-snelkoppelingen als chips in dezelfde rij (blijven op home, zie afspraak).
  // v205 (PJ): aanwezigheid als chip bovenin (teller = afwezigen) i.p.v. rij in de
  // vandaag-kaart; WK-poule verdwijnt hier na het WK weer.
  if (enabledForYou.has("team")) chips.push({ label: "Vandaag", count: afwezig?.aantal ?? 0, route: "/vandaag", icon: "users" });
  // App-snelkoppelingen (beheerbaar via Beheer → Snelkoppelingen; standaard = de
  // env-tiles WK-poule/Buddee/TimeChimp, dus ongewijzigd zonder config).
  try {
    for (const tl of await getTiles(c.env)) {
      if (tl.enabled) chips.push({ label: tl.label, count: 0, route: tl.url, icon: tl.icon });
    }
  } catch {
    chips.push({ label: "WK-poule", count: 0, route: apps.wkPoule, icon: "ball" });
    chips.push({ label: "Buddee", count: 0, route: apps.buddee, icon: "users" });
    chips.push({ label: "TimeChimp", count: 0, route: apps.timechimp, icon: "clock" });
  }
  const voorJou = fy.groups.flatMap((g) => g.items.map((it) => ({ titel: it.title, sub: it.subtitle, route: it.route, icon: CHIP_ICON[g.moduleKey] ?? "file", cta: "Bekijk" }))).slice(0, 4);
  if ((c.get("roles") ?? []).includes("crm")) {
    try {
      const openTaken = await listTaken(crmDb(c.env), { status: "open", limit: 4 });
      if (openTaken.length) voorJou.unshift({ titel: `${openTaken.length >= 4 ? "4+" : openTaken.length} open CRM-ta${openTaken.length === 1 ? "ak" : "ken"}`, sub: openTaken[0].titel, route: "/crm/taken", icon: "brief", cta: "Open" });
    } catch { /* migratie 0018 ontbreekt */ }
  }
  const nieuwsCards = nieuws.slice(0, 3).map((n) => ({
    id: n.id,
    titel: n.fields.Titel ?? "(zonder titel)",
    meta: `${n.fields.Categorie ? `${n.fields.Categorie} · ` : ""}${n.fields.Publicatiedatum ?? ""}`,
    categorie: n.fields.Categorie,
    cover: n.fields.Afbeeldingssleutel ? `/bestand?k=${encodeURIComponent(n.fields.Afbeeldingssleutel)}` : (n.fields.Afbeelding?.[0]?.thumbnails?.large?.url ?? n.fields.Afbeelding?.[0]?.url),
    nieuw: nieuwIds.has(n.id),
  }));
  const eersteJarige = jarigen[0];
  // Snel naar: alle ingeschakelde modules als grid (navigatiepariteit met de oude zijbalk).
  const MODULE_LABEL = new Map(MODULES.map((m) => [m.id, m.label]));
  const snelNaar = enabledOrder
    .filter((id) => id !== "crm" || (c.get("roles") ?? []).includes("crm"))
    .map((id) => ({ label: MODULE_LABEL.get(id) ?? id, route: CHIP_ROUTE[id] ?? "/", icon: CHIP_ICON[id] ?? "file" }));
  const _voornaam = me?.fields.Naam ? String(me.fields.Naam).trim().split(/\s+/)[0] : "";
  const _hcfg = await getHeaderConfig(c.env);
  const _hvars = await getVariants(c.env);
  // v198: home draait nu ÍN de shell (layout) als gewone SPA-pagina — terug naar
  // home is een content-swap zonder paginaherlaad (structurele fix stotteren).
  // Meer-menu/tabbar/avatar/zoeken komen uit de shell zelf (zelfde nav-token).
  return c.html(layout("Home", "/", homeShellContent({
    groet: pickGreeting(_hcfg, _hvars, amsterdamHour(), `${email ?? "anon"}|${new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam" }).format(new Date())}|${amsterdamHour() < 12 ? "o" : amsterdamHour() < 18 ? "m" : "a"}`),
    voornaam: _voornaam,
    datumregel: `${new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", weekday: "long", day: "numeric", month: "long" }).format(new Date())} · Fresh Forward`,
    chips,
    alarm,
    mustread,
    vandaag,
    kantine,
    statusVraag,
    voorJou,
    nieuws: nieuwsCards,
    jarige: eersteJarige
      ? { naam: eersteJarige.naam.trim().split(/\s+/)[0], datum: eersteJarige.overDagen === 0 ? "vandaag" : `${eersteJarige.datum} · over ${eersteJarige.overDagen} ${eersteJarige.overDagen === 1 ? "dag" : "dagen"}`, vandaag: eersteJarige.overDagen === 0 }
      : null,
    snelNaar,
    pushKey: c.env.VAPID_PUBLIC_KEY ?? "",
  }), c.get("roles") ?? []));
});

// ---- Nieuws: volledige artikelen + reacties (verhuisd van home; opruimslag) ----
app.get("/nieuws", async (c) => {
  const [nieuws, medewerkers, nwReacties, nwEmoji] = await Promise.all([
    getGepubliceerdNieuws(c.env),
    getMedewerkers(c.env),
    getNieuwsReacties(c.env),
    getEmojiReacties(c.env, "nieuws"),
  ]);
  const email = await resolveAccessEmail(c, c.env);
  const me = medewerkerVoorEmail(email, medewerkers);
  const momentVan = (n: (typeof nieuws)[number]) =>
    n.fields.Publicatiedatum ? Date.parse(n.fields.Publicatiedatum) : Date.parse(n.createdTime);
  let seen: number | undefined;
  if (me) {
    seen = me.fields["Nieuws gezien"] ? Date.parse(me.fields["Nieuws gezien"]) : undefined;
  } else {
    const seenRaw = (c.req.header("cookie") ?? "")
      .split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("ff_nieuws_seen="))
      ?.slice("ff_nieuws_seen=".length);
    seen = seenRaw ? Number(seenRaw) : undefined;
  }
  const cutoff = seen;
  const nieuwIds = new Set<string>(
    cutoff !== undefined ? nieuws.filter((n) => momentVan(n) > cutoff).map((n) => n.id) : [],
  );
  // Hier (de leesplek) markeren we het nieuws als gezien — niet meer op home.
  if (me) {
    c.executionCtx.waitUntil(
      updateInTabel(c.env, "Medewerkers", me.id, {
        "Nieuws gezien": new Date().toISOString(),
      }).catch(() => {}),
    );
  } else {
    c.header(
      "Set-Cookie",
      `ff_nieuws_seen=${Date.now()}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`,
    );
  }
  const emojiByNieuws = new Map<string, { counts: Record<string, number>; mine: string[] }>();
  {
    const perTarget = new Map<string, { emoji: string; auteur_id: string }[]>();
    for (const r of nwEmoji) { const a = perTarget.get(r.target_id) ?? []; a.push(r); perTarget.set(r.target_id, a); }
    for (const [tid, rs] of perTarget) emojiByNieuws.set(tid, emojiData(rs, me?.id));
  }
  const player = email ? await getPlayerByEmail(c.env, email) : undefined;
  const naamById = naamMap(medewerkers);
  const reactiesByNieuws = new Map<string, { id: string; naam: string; reactie: string; datum: string; kanWeg: boolean }[]>();
  for (const r of nwReacties) {
    const arr = reactiesByNieuws.get(r.nieuws_id) ?? [];
    arr.push({
      id: r.id,
      naam: (r.auteur_id && naamById.get(r.auteur_id)) || "(onbekend)",
      reactie: r.reactie,
      datum: formatDatumTijd(r.created_at),
      kanWeg: canEditOrDelete(player, r.auteur_id),
    });
    reactiesByNieuws.set(r.nieuws_id, arr);
  }
  c.executionCtx.waitUntil(touchSeen(c.env, me?.id, "nieuws").catch(() => {}));
  // Leesbevestiging (v185): welke berichten heeft deze gebruiker al bevestigd.
  const gelezen = email ? await gelezenDoor(c.env, email).catch(() => new Set<string>()) : new Set<string>();
  // v194: stille "gezien"-registratie (ghost) — pagina openen telt als gezien;
  // de "Gelezen"-knop is alleen zichtbaar als de beheer-vlag 'lees_knop' aanstaat.
  if (email) {
    const naamGezien = me?.fields?.Naam ? String(me.fields.Naam) : null;
    c.executionCtx.waitUntil(registreerGezien(c.env, "nieuws", nieuws.map((n) => n.id), email, naamGezien).catch(() => {}));
  }
  const leesKnop = await getFlag(c.env, "lees_knop", false);
  return c.html(layout("Nieuws", "/nieuws", nieuwsPagina(nieuws, nieuwIds, reactiesByNieuws, !!me, emojiByNieuws, gelezen, !!email && leesKnop), c.get("roles") ?? []));
});

// ---- Documenten (verhuisd van home; opruimslag) ----
app.get("/documenten", async (c) => {
  const documenten = await getDocumenten(c.env);
  // Leesbevestiging (v185): "Gelezen"-knop op documenten in categorie Beleid.
  const email = await resolveAccessEmail(c, c.env);
  const gelezen = email ? await gelezenDoor(c.env, email).catch(() => new Set<string>()) : new Set<string>();
  // v194: stille "gezien"-registratie voor beleidsdocumenten (ghost); knop achter vlag.
  if (email) {
    const beleidIds = documenten.filter((d) => d.fields.Categorie === "Beleid").map((d) => d.id);
    c.executionCtx.waitUntil(registreerGezien(c.env, "document", beleidIds, email, null).catch(() => {}));
  }
  const leesKnopDoc = await getFlag(c.env, "lees_knop", false);
  return c.html(layout("Documenten", "/documenten", documentenPagina(documenten, gelezen, !!email && leesKnopDoc), c.get("roles") ?? []));
});

// Leesbevestiging vastleggen (v185) — idempotent; aangeroepen door de .lees-btn (layout).
app.post("/api/gelezen", async (c) => {
  const email = await resolveAccessEmail(c, c.env);
  if (!email) return c.json({ ok: false, error: "geen identiteit" }, 401);
  let b: { type?: string; id?: string } = {};
  try { b = await c.req.json(); } catch { /* leeg */ }
  const type = b.type === "document" ? "document" : b.type === "nieuws" ? "nieuws" : null;
  const id = String(b.id ?? "").trim().slice(0, 64);
  if (!type || !id) return c.json({ ok: false, error: "type/id ontbreekt" }, 400);
  const me = medewerkerVoorEmail(email, await getMedewerkers(c.env));
  await bevestigGelezen(c.env, type, id, email, me?.fields.Naam ? String(me.fields.Naam) : null);
  return c.json({ ok: true });
});

// ---- "Voor jou": overzicht van nieuwe dingen per ingeschakelde module ----
app.get("/voor-jou", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  const me = medewerkerVoorEmail(await resolveAccessEmail(c, c.env), medewerkers);
  const enabled = new Set(await getEnabledOrdered(c.env).catch(() => [] as string[]));
  let fy: ForYou = { totalNew: 0, groups: [] };
  try { fy = await buildForYou(c.env, me?.id, enabled); } catch { /* leeg */ }
  const voornaam = me?.fields.Naam ? String(me.fields.Naam).trim().split(/\s+/)[0] : "";
  return c.html(layout("Voor jou", "/voor-jou", voorJouPage(fy, groet(), voornaam), c.get("roles") ?? []));
});

// ---- Globaal zoeken (nieuws + documenten + mensen) ----
async function zoekFilter(env: Env, q: string) {
  if (!q) return { mensen: [], nieuws: [], documenten: [] } as {
    mensen: Awaited<ReturnType<typeof getMedewerkers>>;
    nieuws: Awaited<ReturnType<typeof getGepubliceerdNieuws>>;
    documenten: Awaited<ReturnType<typeof getDocumenten>>;
  };
  const [meds, nws, docs] = await Promise.all([
    getMedewerkers(env),
    getGepubliceerdNieuws(env),
    getDocumenten(env),
  ]);
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hit = (hay: string) => { const h = hay.toLowerCase(); return terms.every((t) => h.includes(t)); };
  return {
    mensen: meds.filter(
      (m) => m.fields.Actief !== false &&
        hit([m.fields.Naam, m.fields.Functie, m.fields.Afdeling, m.fields.Rol, m.fields["E-mail"]].filter(Boolean).join(" ")),
    ),
    nieuws: nws.filter((n) => hit([n.fields.Titel, n.fields.Inhoud, n.fields.Categorie].filter(Boolean).join(" "))),
    documenten: docs.filter((d) => hit([d.fields.Titel, d.fields.Omschrijving, d.fields.Categorie].filter(Boolean).join(" "))),
  };
}

app.get("/zoek", async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  const [r, fts] = await Promise.all([
    zoekFilter(c.env, q),
    q ? zoekFts(c.env, q).catch(() => [] as ZoekGroep[]) : Promise.resolve([] as ZoekGroep[]),
  ]);
  return c.html(layout("Zoeken", "/zoek", zoekPage(q, r.mensen, r.nieuws, r.documenten, (c.get("roles") ?? []).includes("beheerder"), fts), c.get("roles") ?? []));
});

// Live-zoeken: alleen het resultaten-fragment (server-rendered, zelfde escaping).
// 4.1: FTS5-groepen (prikbord/peilingen/agenda/trainingen) naast de rijke kaarten.
app.get("/api/zoek", async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  const [r, fts] = await Promise.all([
    zoekFilter(c.env, q),
    q ? zoekFts(c.env, q).catch(() => [] as ZoekGroep[]) : Promise.resolve([] as ZoekGroep[]),
  ]);
  return c.html(zoekResultaten(q, r.mensen, r.nieuws, r.documenten, fts));
});

// ---- Bezoekmelding ----// ---- Bezoekmelding ----
app.get("/bezoek", async (c) => {
  if (c.env.BEZOEK_ENABLED !== "true") return c.redirect("/");
  const vandaag = await getBezoekVandaag(c.env);
  let receptie: AirtableRecord<ReceptieFields>[] = [];
  let receptieFout: string | undefined;
  try {
    receptie = await getReceptieVandaag(c.env);
  } catch (e) {
    receptieFout = e instanceof Error ? e.message : String(e);
  }
  const ok = c.req.query("ok");
  const melding =
    ok === "in"
      ? "Bezoeker ingecheckt."
      : ok === "uit"
        ? "Bezoeker uitgecheckt."
        : ok
          ? "Bezoeker aangemeld."
          : undefined;
  return c.html(
    layout(
      "Bezoekmelding",
      "/bezoek",
      bezoekPage(vandaag, receptie, { melding, receptieFout }), c.get("roles") ?? []),
  );
});

app.post("/bezoek", async (c) => {
  if (c.env.BEZOEK_ENABLED !== "true") return c.redirect("/");
  const form = await c.req.formData();
  const verwacht = String(form.get("verwacht_op") ?? "");
  await createBezoek(c.env, {
    Bezoeker: String(form.get("bezoeker") ?? ""),
    Bedrijf: String(form.get("bedrijf") ?? "") || undefined,
    "E-mail": String(form.get("email") ?? "") || undefined,
    "Verwacht op": verwacht ? amsterdamLocalToUtcIso(verwacht) : undefined,
    Reden: String(form.get("reden") ?? "") || undefined,
    Status: "Verwacht",
    Opmerkingen: String(form.get("opmerkingen") ?? "") || undefined,
  });
  return c.redirect("/bezoek?ok=1");
});

// In-/uitchecken van een bezoeker. Zet status + tijdstip in Airtable en logt
// het event naar D1 (indien gekoppeld).
app.post("/bezoek/incheck", async (c) => {
  if (c.env.BEZOEK_ENABLED !== "true") return c.redirect("/");
  const id = String((await c.req.formData()).get("id") ?? "");
  if (!id) return c.redirect("/bezoek");
  await setBezoekStatus(c.env, id, "Ingecheckt");
  const email = await resolveAccessEmail(c, c.env);
  c.executionCtx.waitUntil(
    logEvent(c.env, { type: "bezoek_incheck", ref: id, actor: email }),
  );
  return c.redirect("/bezoek?ok=in");
});

app.post("/bezoek/uitcheck", async (c) => {
  if (c.env.BEZOEK_ENABLED !== "true") return c.redirect("/");
  const id = String((await c.req.formData()).get("id") ?? "");
  if (!id) return c.redirect("/bezoek");
  await setBezoekStatus(c.env, id, "Vertrokken");
  const email = await resolveAccessEmail(c, c.env);
  c.executionCtx.waitUntil(
    logEvent(c.env, { type: "bezoek_uitcheck", ref: id, actor: email }),
  );
  return c.redirect("/bezoek?ok=uit");
});

// ---- Smoelenboek / team ----
app.get("/smoelenboek", async (c) => {
  if (!isModuleOn(c.get("roles") ?? [], "team")) return c.redirect("/");
  const medewerkers = await getMedewerkers(c.env);
  return c.html(layout("Team", "/smoelenboek", smoelenboekPage(medewerkers), c.get("roles") ?? []));
});

// ---- Meldingen (voorraad / defect) ----
async function magMeldingAfhandelen(c: Context<{ Bindings: Env; Variables: { roles: string[]; playerId?: string; modules: string[] } }>): Promise<boolean> {
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  if (isAdmin(me)) return true;
  if (!me) return false;
  const [ovV, ovD] = await Promise.all([getOntvangers(c.env, "voorraad"), getOntvangers(c.env, "defect")]);
  return ovV.includes(me.id) || ovD.includes(me.id);
}

app.get("/meldingen", async (c) => {
  if (!isModuleOn(c.get("roles") ?? [], "meldingen")) return c.redirect("/");
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  c.executionCtx.waitUntil(touchSeen(c.env, me?.id, "meldingen").catch(() => {}));
  const [voorraad, defecten, ovV, ovD] = await Promise.all([
    listMeldingen(c.env, "open", "voorraad"),
    listMeldingen(c.env, "open", "defect"),
    getOntvangers(c.env, "voorraad"),
    getOntvangers(c.env, "defect"),
  ]);
  const admin = isAdmin(me);
  const kan = { voorraad: admin || (!!me && ovV.includes(me.id)), defect: admin || (!!me && ovD.includes(me.id)) };
  const melding = c.req.query("ok") ? "Melding geplaatst. Bedankt!" : c.req.query("done") ? "Melding afgehandeld." : undefined;
  return c.html(layout("Meldingen", "/meldingen", meldingenPagina(voorraad, defecten, kan, { melding }), c.get("roles") ?? []));
});

app.post("/meldingen", async (c) => {
  if (!isModuleOn(c.get("roles") ?? [], "meldingen")) return c.redirect("/");
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  const form = await c.req.formData();
  const type: MeldingType = String(form.get("type") ?? "") === "defect" ? "defect" : "voorraad";
  const titel = String(form.get("titel") ?? "").trim().slice(0, 120);
  if (!titel) return c.redirect("/meldingen");
  await createMelding(c.env, {
    type, titel,
    omschrijving: String(form.get("omschrijving") ?? "").trim() || undefined,
    locatie: String(form.get("locatie") ?? "").trim() || undefined,
    gemeldDoor: me?.id, gemeldNaam: me?.naam,
  });
  return c.redirect("/meldingen?ok=1");
});

app.post("/meldingen/afgehandeld", async (c) => {
  if (!isModuleOn(c.get("roles") ?? [], "meldingen")) return c.redirect("/");
  const id = String((await c.req.formData()).get("id") ?? "");
  if (id && (await magMeldingAfhandelen(c))) await setMeldingStatus(c.env, id, "afgehandeld");
  return c.redirect("/meldingen?done=1");
});
app.post("/meldingen/verwijder", async (c) => {
  if (!isModuleOn(c.get("roles") ?? [], "meldingen")) return c.redirect("/");
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  const id = String((await c.req.formData()).get("id") ?? "");
  const m = id ? await getMelding(c.env, id) : undefined;
  // maker óf wie mag afhandelen (ontvanger/admin) mag verwijderen
  if (id && (canEditOrDelete(me, m?.gemeld_door) || (await magMeldingAfhandelen(c)))) {
    await archiveMelding(c.env, id);
    await logAudit(c.env, me?.email, "archive", "melding", id);
  }
  return c.redirect("/meldingen?done=1");
});

// ---- Noodmelding / BHV ----
app.get("/noodmelding", async (c) => {
  const roles = c.get("roles") ?? [];
  if (!isModuleOn(roles, "meldingen")) return c.redirect("/");
  const bhv = await getBhvOntvangers(c.env);
  const verzonden = c.req.query("ok") != null;
  const bereikt = c.req.query("n") != null ? Number(c.req.query("n")) : undefined;
  // v186: actieve melding (<30 min) tonen + afhandelen door BHV'er/beheerder/melder.
  const recent = (await listNoodmeldingen(c.env, 1).catch(() => [] as Noodmelding[]))[0];
  const actief = recent && Date.now() - recent.created_at < 30 * 60_000 ? recent : undefined;
  const pid = c.get("playerId");
  const kanSluiten = !!actief && (roles.includes("beheerder") || (!!pid && (bhv.includes(pid) || actief.melder_id === pid)));
  return c.html(layout("Noodmelding", "/noodmelding", noodmeldingPagina(bhv.length, { verzonden, bereikt, actief, kanSluiten, afgehandeld: c.req.query("af") != null }), roles));
});

// v186: actieve noodmelding afhandelen — BHV'er, beheerder of de melder zelf.
app.post("/noodmelding/afgehandeld", async (c) => {
  const roles = c.get("roles") ?? [];
  if (!isModuleOn(roles, "meldingen")) return c.redirect("/");
  const id = String((await c.req.formData()).get("id") ?? "");
  const recent = (await listNoodmeldingen(c.env, 1).catch(() => [] as Noodmelding[]))[0];
  if (id && recent && recent.id === id) {
    const pid = c.get("playerId");
    const bhv = await getBhvOntvangers(c.env);
    const mag = roles.includes("beheerder") || (!!pid && (bhv.includes(pid) || recent.melder_id === pid));
    if (mag) await deleteNoodmelding(c.env, id);
  }
  return c.redirect("/noodmelding?af=1");
});

app.post("/noodmelding", async (c) => {
  const roles = c.get("roles") ?? [];
  if (!isModuleOn(roles, "meldingen")) return c.redirect("/");
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  const locatie = String((await c.req.formData()).get("locatie") ?? "").trim().slice(0, 100) || undefined;
  await createNoodmelding(c.env, { melderId: me?.id, melderNaam: me?.naam, locatie });
  const ids = await getBhvOntvangers(c.env);
  const players = await getAllPlayers(c.env);
  const emailById = new Map(players.map((p) => [p.id, p.email] as const));
  const body = (me?.naam ?? "Iemand") + " vraagt BHV-hulp" + (locatie ? " \u00b7 " + locatie : "");
  let bereikt = 0;
  for (const id of ids) {
    const em = emailById.get(id);
    if (em) bereikt += await pushNaarEmail(c.env, em, { title: "\ud83d\udea8 NOODMELDING / BHV", body, url: "/noodmelding" });
  }
  return c.redirect("/noodmelding?ok=1&n=" + bereikt);
});

// ---- Bugmelding ----
app.get("/bug", async (c) => {
  const melding = c.req.query("ok") ? "Bedankt! Je melding is doorgegeven." : undefined;
  return c.html(layout("Bug melden", "/bug", bugPagina({ melding }), c.get("roles") ?? []));
});
app.post("/bug", async (c) => {
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  const form = await c.req.formData();
  const titel = String(form.get("titel") ?? "").trim().slice(0, 140);
  if (!titel) return c.redirect("/bug");
  let screenshotKey: string | undefined;
  const shot = form.get("screenshot") as unknown as File | null;
  if (shot && shot.size > 0 && c.env.DOCS) {
    const veilig = shot.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    screenshotKey = `bug/${crypto.randomUUID()}_${veilig}`;
    await c.env.DOCS.put(screenshotKey, shot.stream(), {
      httpMetadata: { contentType: shot.type || "image/png" },
      customMetadata: { naam: shot.name },
    });
  }
  const categorie = ["bug", "idee", "anders"].includes(String(form.get("categorie"))) ? String(form.get("categorie")) : "bug";
  await createBug(c.env, { melderId: me?.id, melderNaam: me?.naam, titel, omschrijving: String(form.get("omschrijving") ?? "").trim() || undefined, screenshotKey, categorie });
  // 4.4: beheerders direct op de hoogte via het notificatiecentrum (+push).
  c.executionCtx.waitUntil((async () => {
    try {
      const meds = await getMedewerkers(c.env);
      const admins = new Set((c.env.BEHEERDER_EMAILS ?? "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean));
      for (const m of meds) if (m.fields.Rol === "Beheerder" && m.fields["E-mail"]) admins.add(String(m.fields["E-mail"]).toLowerCase());
      await notifyAlle(
        c.env,
        { module: "meldingen", titel: `Feedback (${categorie}): ${titel}`, body: me?.naam ? `Van ${me.naam}` : undefined, url: "/beheer/bugmeldingen" },
        Array.from(admins),
        (email, payload) => pushNaarEmail(c.env, email, payload),
      );
    } catch (e) { console.error("feedback-notify faalde:", e); }
  })());
  return c.redirect("/bug?ok=1");
});

// ---- Trainingen ----
app.get("/trainingen", async (c) => {
  const roles = c.get("roles") ?? [];
  if (!isModuleOn(roles, "trainingen")) return c.redirect("/");
  await seedIfEmpty(c.env);
  const courses = await listCourses(c.env, false);
  return c.html(layout("Trainingen", "/trainingen", trainingenLijst(courses), roles));
});

app.get("/trainingen/:id", async (c) => {
  const roles = c.get("roles") ?? [];
  if (!isModuleOn(roles, "trainingen")) return c.redirect("/");
  const course = await getCourse(c.env, c.req.param("id"));
  if (!course || !course.published) return c.redirect("/trainingen");
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  const [chapters, done] = await Promise.all([
    getChapters(c.env, course.id),
    me ? getDoneChapters(c.env, me.id, course.id) : Promise.resolve(new Set<string>()),
  ]);
  return c.html(layout(course.title, "/trainingen", trainingDetail(course, chapters, done, !!me), roles));
});
app.post("/trainingen/:id/afronden", async (c) => {
  if (!isModuleOn(c.get("roles") ?? [], "trainingen")) return c.redirect("/");
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  const chapter = String((await c.req.formData()).get("chapter") ?? "");
  if (me && chapter) await markChapterDone(c.env, me.id, c.req.param("id"), chapter);
  return c.redirect("/trainingen/" + c.req.param("id"));
});

// ---- Competitie ----
function kiesGame(q?: string): GameType {
  return q === "draughts" ? "draughts" : q === "pingpong" ? "pingpong" : "darts";
}

app.get("/competitie", async (c) => {
  if (!isModuleOn(c.get("roles") ?? [], "competitie")) return c.redirect("/");
  const game = kiesGame(c.req.query("game"));
  const [ranking, recent] = await Promise.all([getRanking(c.env, game), listMatches(c.env, game, 10)]);
  return c.html(layout("Competitie", "/competitie", competitieOverzicht(game, ranking, recent), c.get("roles") ?? []));
});

app.get("/competitie/ranglijst", async (c) => {
  const game = kiesGame(c.req.query("game"));
  const ranking = await getRanking(c.env, game);
  return c.html(layout("Ranglijst", "/competitie/ranglijst", ranglijstPage(game, ranking), c.get("roles") ?? []));
});

app.get("/competitie/speler/:id", async (c) => {
  const game = kiesGame(c.req.query("game"));
  const id = c.req.param("id");
  const sp = await getPlayerById(c.env, id);
  if (!sp) return c.notFound();
  const [rating, nemesis, last5, all] = await Promise.all([
    getRating(c.env, id, game), getNemesis(c.env, id, game), getLast5(c.env, id, game), listMatches(c.env, game, 50),
  ]);
  const recent = all.filter((m) => m.player_a === id || m.player_b === id).slice(0, 10);
  return c.html(layout(sp.naam, "/competitie", spelerProfiel(game, { id, naam: sp.nickname || sp.naam }, rating, nemesis, last5, recent), c.get("roles") ?? []));
});

app.get("/competitie/teller", async (c) => {
  const game = kiesGame(c.req.query("game"));
  const players = await getAllPlayers(c.env);
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  const voiceOn = me ? (await getVoicePrefs(c.env, me.id))[game] !== false : true;
  return c.html(layout("Score-teller", "/competitie", scoreTeller(game, players, voiceOn), c.get("roles") ?? []));
});

app.post("/competitie/match", async (c) => {
  const form = await c.req.formData();
  const game = kiesGame(String(form.get("game") ?? ""));
  const a = String(form.get("player_a") ?? "");
  const b = String(form.get("player_b") ?? "");
  const winner = String(form.get("winner") ?? "");
  if (!a || !b || a === b || (winner !== a && winner !== b)) return c.redirect(`/competitie?game=${game}`);
  const sa = form.get("score_a") ? Number(form.get("score_a")) : null;
  const sb = form.get("score_b") ? Number(form.get("score_b")) : null;
  const tid = String(form.get("tournament_id") ?? "") || null;
  await recordMatch(c.env, game, a, b, winner, sa, sb, tid, idemId(form.get("idem"), "m"));
  const back = String(form.get("back") ?? "");
  return c.redirect(veiligTerug(back, `/competitie?game=${game}`));
});

// Corrigeer de laatst ingevoerde pot (verkeerd ingevuld): zet de ELO exact terug.
// Mag door een beheerder of door een van de twee deelnemers van die pot.
app.post("/competitie/match/verwijder-laatste", async (c) => {
  const form = await c.req.formData();
  const game = kiesGame(String(form.get("game") ?? ""));
  const medewerkers = await getMedewerkers(c.env);
  const email = await resolveAccessEmail(c, c.env);
  const me = medewerkerVoorEmail(email, medewerkers);
  const admin = isBeheerderVoor(email, c.env, medewerkers);
  const r = await deleteLastMatch(c.env, game, admin ? null : (me?.id ?? "__geen__"));
  if (r.ok) await logAudit(c.env, email, "delete", "match-laatste", game);
  return c.redirect(`/competitie?game=${game}`);
});

app.get("/competitie/toernooien", async (c) => {
  const game = kiesGame(c.req.query("game"));
  const [list, players] = await Promise.all([listTournaments(c.env), getAllPlayers(c.env)]);
  return c.html(layout("Toernooien", "/competitie/toernooien", toernooienPage(game, list, players), c.get("roles") ?? []));
});

app.post("/competitie/toernooien", async (c) => {
  const form = await c.req.formData();
  const game = kiesGame(String(form.get("game") ?? ""));
  const name = String(form.get("name") ?? "").trim();
  const format = String(form.get("format") ?? "round_robin");
  if (name) {
    const ids = form.getAll("player_ids").map(String).filter(Boolean);
    const id = await createTournament(c.env, game, name, format, idemId(form.get("idem"), "t"));
    for (const pid of ids) await addTournamentPlayer(c.env, id, pid);
    return c.redirect(`/competitie/toernooi/${id}`);
  }
  return c.redirect(`/competitie/toernooien?game=${game}`);
});

app.get("/competitie/toernooi/:id", async (c) => {
  const t = await getTournament(c.env, c.req.param("id"));
  if (!t) return c.notFound();
  const [deelnemers, standings, players] = await Promise.all([
    getTournamentPlayers(c.env, t.id), tournamentStandings(c.env, t.id), getAllPlayers(c.env),
  ]);
  const pairs = t.status !== "open" && t.format === "round_robin" ? roundRobinPairs(deelnemers) : [];
  return c.html(layout(t.name, "/competitie/toernooien", toernooiDetail(t, deelnemers, standings, pairs, players), c.get("roles") ?? []));
});

app.post("/competitie/toernooi/:id/join", async (c) => {
  const id = c.req.param("id");
  const pid = String((await c.req.formData()).get("player_id") ?? "");
  if (pid) await addTournamentPlayer(c.env, id, pid);
  return c.redirect(`/competitie/toernooi/${id}`);
});

app.post("/competitie/toernooi/:id/start", async (c) => {
  const id = c.req.param("id");
  await setTournamentStatus(c.env, id, "running");
  return c.redirect(`/competitie/toernooi/${id}`);
});


// ---- Prikbord (sociaal) ----
app.get("/social", async (c) => {
  if (!isModuleOn(c.get("roles") ?? [], "prikbord")) return c.redirect("/");
  const [posts, reacties, medewerkers, postEmoji] = await Promise.all([
    getPosts(c.env),
    getReacties(c.env),
    getMedewerkers(c.env),
    getEmojiReacties(c.env, "post"),
  ]);
  const reactiesByPost = new Map<string, typeof reacties>();
  for (const r of reacties) {
    const pid = r.fields.Post?.[0];
    if (!pid) continue;
    const arr = reactiesByPost.get(pid) ?? [];
    arr.push(r);
    reactiesByPost.set(pid, arr);
  }
  const auteurs = actieveAuteurs(medewerkers);
  const fotoById = new Map<string, string>();
  for (const m of medewerkers) {
    const u = m.fields.Foto?.[0]?.thumbnails?.large?.url ?? m.fields.Foto?.[0]?.url;
    if (u) fotoById.set(m.id, u);
  }
  const email = await resolveAccessEmail(c, c.env);
  const me = medewerkerVoorEmail(email, medewerkers);
  c.executionCtx.waitUntil(touchSeen(c.env, me?.id, "prikbord").catch(() => {}));
  const emojiByPost = new Map<string, { counts: Record<string, number>; mine: string[] }>();
  {
    const perTarget = new Map<string, { emoji: string; auteur_id: string }[]>();
    for (const r of postEmoji) { const a = perTarget.get(r.target_id) ?? []; a.push(r); perTarget.set(r.target_id, a); }
    for (const [tid, rs] of perTarget) emojiByPost.set(tid, emojiData(rs, me?.id));
  }
  let pollsView: PollView[] = [];
  try {
    const allePolls = await listPolls(c.env);
    const alleStemmen = await getAlleStemmen(c.env);
    const stemmenByPoll = new Map<string, typeof alleStemmen>();
    for (const st of alleStemmen) { const a = stemmenByPoll.get(st.poll_id) ?? []; a.push(st); stemmenByPoll.set(st.poll_id, a); }
    pollsView = allePolls.map((q) => {
      const t = tally(q, stemmenByPoll.get(q.id) ?? [], me?.id);
      return { id: q.id, vraag: q.vraag, opties: q.opties, multi: q.multi, makerId: q.maker_id, makerNaam: q.maker_naam, status: q.status, createdTime: new Date(q.created_at).toISOString(), closesAt: q.closes_at ?? null, counts: t.counts, total: t.total, mine: t.mine };
    });
  } catch { pollsView = []; }
  const melding = c.req.query("ok") ? "Geplaatst." : undefined;
  return c.html(
    layout(
      "Prikbord",
      "/social",
      socialPage(posts, reactiesByPost, auteurs, naamMap(medewerkers), fotoById, me?.id, me?.fields.Naam, isDev(c.env), (c.get("roles") ?? []).includes("beheerder"), emojiByPost, pollsView, {
        melding,
      }), c.get("roles") ?? []),
  );
});

app.post("/social", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  const email = await resolveAccessEmail(c, c.env);
  const me = medewerkerVoorEmail(email, medewerkers)?.id;
  const form = await c.req.formData();
  const bericht = String(form.get("bericht") ?? "").trim();
  // Auteur = de ingelogde collega (Access). Alleen lokaal mag de keuze uit het formulier komen.
  const auteur = me ?? (isDev(c.env) ? String(form.get("auteur") ?? "") : "");
  // Optionele shout-out: ontvanger moet een bekende collega zijn en niet jezelf.
  const ontvangerRaw = String(form.get("ontvanger") ?? "").trim();
  const ontvanger = ontvangerRaw && ontvangerRaw !== auteur && medewerkers.some((m) => m.id === ontvangerRaw)
    ? ontvangerRaw
    : undefined;
  let afbeeldingKey: string | undefined;
  const foto = form.get("afbeelding") as unknown as File | null;
  if (foto && foto.size > 0 && c.env.DOCS) {
    const veilig = foto.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    afbeeldingKey = `prikbord/${crypto.randomUUID()}_${veilig}`;
    await c.env.DOCS.put(afbeeldingKey, foto.stream(), { httpMetadata: { contentType: foto.type || "image/jpeg" }, customMetadata: { naam: foto.name } });
  }
  const isPoll = String(form.get("is_poll") ?? "") === "on";
  if (isPoll) {
    const vraag = String(form.get("poll_vraag") ?? "").trim().slice(0, 160);
    const opties = String(form.get("poll_opties") ?? "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(0, 6);
    const multi = String(form.get("poll_multi") ?? "") === "on";
    if (vraag && opties.length >= 2 && auteur) {
      const makerNaam = medewerkers.find((m) => m.id === auteur)?.fields.Naam;
      await createPoll(c.env, { vraag, opties, multi, makerId: auteur, makerNaam }, idemId(form.get("idem"), "pl"));
    }
    return c.redirect("/social?ok=1");
  }
  if ((bericht || afbeeldingKey) && auteur) await createPost(c.env, bericht, auteur, afbeeldingKey, ontvanger, idemId(form.get("idem"), "r"));
  return c.redirect("/social?ok=1");
});

app.post("/social/reactie", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  const email = await resolveAccessEmail(c, c.env);
  const me = medewerkerVoorEmail(email, medewerkers)?.id;
  const form = await c.req.formData();
  const reactie = String(form.get("reactie") ?? "").trim();
  const post = String(form.get("post") ?? "");
  const auteur = me ?? (isDev(c.env) ? String(form.get("auteur") ?? "") : "");
  if (reactie && post && auteur) await createReactie(c.env, reactie, post, auteur, idemId(form.get("idem"), "r"));
  return c.redirect("/social?ok=1");
});

app.post("/social/verwijder", async (c) => {
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  const id = String((await c.req.formData()).get("id") ?? "");
  const post = (await getPosts(c.env)).find((p) => p.id === id);
  if (id && canEditOrDelete(me, post?.fields.Auteur?.[0])) {
    await softDeleteInTabel(c.env, "Posts", id); // 1.4: undo mogelijk via /api/herstel
    await logAudit(c.env, me?.email, "delete", "post", id);
  }
  return c.redirect("/social?ok=1");
});

app.post("/social/reactie/verwijder", async (c) => {
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  const id = String((await c.req.formData()).get("id") ?? "");
  const r = (await getReacties(c.env)).find((x) => x.id === id);
  if (id && canEditOrDelete(me, r?.fields.Auteur?.[0])) {
    await softDeleteInTabel(c.env, "Reacties", id); // 1.4: undo mogelijk via /api/herstel
    await logAudit(c.env, me?.email, "delete", "reactie", id);
  }
  return c.redirect("/social?ok=1");
});

// ---- Polls (peilingen op het prikbord) ----
app.post("/social/poll/sluit", async (c) => {
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  const id = String((await c.req.formData()).get("id") ?? "");
  const poll = id ? await getPoll(c.env, id) : undefined;
  if (poll && canEditOrDelete(me, poll.maker_id)) {
    await closePoll(c.env, id);
    await logAudit(c.env, me?.email, "close", "poll", id);
  }
  return c.redirect("/social?ok=1");
});

app.post("/social/poll/verwijder", async (c) => {
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  const id = String((await c.req.formData()).get("id") ?? "");
  const poll = id ? await getPoll(c.env, id) : undefined;
  if (poll && canEditOrDelete(me, poll.maker_id)) {
    await deletePoll(c.env, id);
    await logAudit(c.env, me?.email, "delete", "poll", id);
  }
  return c.redirect("/social?ok=1");
});

// ---- Reacties onder nieuws ----
app.post("/nieuws/reactie", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  const me = medewerkerVoorEmail(await resolveAccessEmail(c, c.env), medewerkers)?.id;
  const form = await c.req.formData();
  const reactie = String(form.get("reactie") ?? "").trim().slice(0, 500);
  const nieuwsId = String(form.get("nieuws") ?? "");
  if (reactie && nieuwsId && me) await createNieuwsReactie(c.env, nieuwsId, reactie, me, idemId(form.get("idem"), "r"));
  return c.redirect("/nieuws?ok=1#nieuws-" + encodeURIComponent(nieuwsId));
});

app.post("/nieuws/reactie/verwijder", async (c) => {
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  const id = String((await c.req.formData()).get("id") ?? "");
  const r = id ? await getNieuwsReactie(c.env, id) : undefined;
  if (r && canEditOrDelete(me, r.auteur_id ?? undefined)) {
    await deleteNieuwsReactie(c.env, id);
    await logAudit(c.env, me?.email, "delete", "nieuws_reactie", id);
  }
  return c.redirect("/nieuws?ok=1#nieuws-" + encodeURIComponent(r?.nieuws_id ?? ""));
});

// Identiteit voor de emoji-reacties: dezelfde flow als de overige acties. Eerst de
// door de middleware gezette playerId, anders de canonieke e-maillookup, met de
// in-memory medewerkerslijst als laatste terugval.
async function reactieIdentiteit(c: any): Promise<string | undefined> {
  const viaMw = c.get("playerId") as string | undefined;
  if (viaMw) return viaMw;
  const email = await resolveAccessEmail(c, c.env);
  if (!email) return undefined;
  const viaDb = (await getPlayerByEmail(c.env, email))?.id;
  if (viaDb) return viaDb;
  const medewerkers = await getMedewerkers(c.env);
  return medewerkerVoorEmail(email, medewerkers)?.id;
}

// Verse emoji-stand voor alle posts + nieuws (nooit gecachet). De client gebruikt dit
// om bij paginalaad de (mogelijk uit cache geserveerde) reactiebalken bij te werken,
// zodat een reactie ook na herladen meteen correct geteld staat.
app.get("/api/reacties", async (c) => {
  const me = await reactieIdentiteit(c);
  const out: Record<string, { counts: Record<string, number>; mine: string[] }> = {};
  for (const type of ["post", "nieuws"] as const) {
    const rijen = await getEmojiReacties(c.env, type);
    const per = new Map<string, { emoji: string; auteur_id: string }[]>();
    for (const r of rijen) {
      const a = per.get(r.target_id) ?? [];
      a.push({ emoji: r.emoji, auteur_id: r.auteur_id });
      per.set(r.target_id, a);
    }
    for (const [tid, rs] of per) out[type + ":" + tid] = emojiData(rs, me);
  }
  return c.json(out);
});

// ---- Emoji-reacties (post + nieuws), live toggle ----
app.post("/api/reactie", async (c) => {
  const me = await reactieIdentiteit(c);
  if (!me) return c.json({ error: "geen-identiteit" }, 403);
  const body = (await c.req.json().catch(() => ({}))) as { type?: string; id?: string; emoji?: string };
  const type = body.type === "nieuws" ? "nieuws" : body.type === "post" ? "post" : "";
  const id = String(body.id ?? "");
  const emoji = String(body.emoji ?? "");
  if (!type || !id || !isEmoji(emoji)) return c.json({ error: "ongeldig" }, 400);
  await toggleEmoji(c.env, type, id, emoji, me);
  const rijen = await getEmojiVoorTarget(c.env, type, id);
  return c.json(emojiData(rijen, me));
});

// ---- Inline vertaling (Workers AI / m2m100) ----
app.post("/api/vertaal", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { text?: string; lang?: string };
  const text = String(body.text ?? "").slice(0, 4000).trim();
  const lang = String(body.lang ?? "").toLowerCase();
  if (!text) return c.json({ error: "leeg" }, 400);
  if (!isLang(lang)) return c.json({ error: "taal" }, 400);
  if (!c.env.AI) return c.json({ error: "ai-uit" }, 503);
  // Rate limit (securityrapport): vertalen draait op Workers AI.
  if (!rateLimit(limietKey("vertaal", await resolveAccessEmail(c, c.env), c.req.header("cf-connecting-ip")), 20, 60_000)) {
    return c.json({ error: "te-veel" }, 429);
  }
  try {
    const vert = await cachedTranslate(c.env, text, lang, "nl");
    return c.json({ text: vert });
  } catch (e) {
    return c.json({ error: "mislukt" }, 500);
  }
});

// ---- Kennisbank-vraagbaak (RAG) ----
app.post("/api/ask", async (c) => {
  // Rate limit (securityrapport): AI-aanroepen zijn de duurste route.
  const wie = await resolveAccessEmail(c, c.env);
  if (!rateLimit(limietKey("ask", wie, c.req.header("cf-connecting-ip")), 6, 60_000)) {
    return c.json({ error: "te-veel", answer: "Even rustig aan — probeer het over een minuut opnieuw." }, 429);
  }
  const body = (await c.req.json().catch(() => ({}))) as { question?: string };
  const question = String(body.question ?? "").slice(0, 500).trim();
  if (!question) return c.json({ error: "leeg" }, 400);
  const res = await kbAsk(c.env, question);
  c.executionCtx.waitUntil((async () => {
    try {
      if (c.env.DB) await c.env.DB.prepare("INSERT INTO ask_log (id, user_ref, question, answered, source_ids, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind("al" + crypto.randomUUID().replace(/-/g, ""), null, question, res.answered ? 1 : 0, JSON.stringify((res.sources ?? []).map((x) => x.title)), Date.now()).run();
    } catch { /* log best-effort */ }
  })());
  return c.json(res);
});

// v200: gecombineerd zoeken + AI voor de assistent-sheet. Altijd interne
// FTS-treffers; is de invoer een echte vraag, dan ook een AI-antwoord — eerst de
// kennisbank (RAG, met bronnen), en weet die het niet: een gelabeld
// algemene-kennis-antwoord (PJ 12/6).
app.post("/api/assist", async (c) => {
  const wie = await resolveAccessEmail(c, c.env);
  const body = (await c.req.json().catch(() => ({}))) as { q?: string };
  const q = String(body.q ?? "").slice(0, 500).trim();
  if (!q) return c.json({ error: "leeg" }, 400);
  const treffers = await zoekFts(c.env, q, 3).catch(() => [] as ZoekGroep[]);
  const isVraag = /\?\s*$/.test(q)
    || /^(hoe|wat|waar|wanneer|wie|waarom|hoeveel|welke?|kan|mag|moet|is|zijn|heb|heeft|werkt|leg|geef)\b/i.test(q)
    || q.split(/\s+/).length >= 5;
  let answer: string | undefined; let sources: { title: string; url?: string }[] | undefined;
  let mode: "kennisbank" | "web" | "algemeen" | undefined;
  if (isVraag) {
    if (!rateLimit(limietKey("ask", wie, c.req.header("cf-connecting-ip")), 6, 60_000)) {
      return c.json({ treffers, answer: "Even rustig aan — probeer het over een minuut opnieuw.", mode: "algemeen" });
    }
    const res = await kbAsk(c.env, q).catch(() => null);
    // v201: agent-keten — het interne antwoord BEOORDELEN i.p.v. blind vertrouwen.
    // De RAG vindt soms vaag verwante chunks ("kas" -> kantine/kassa) en zegt dan
    // zélf "kan ik niet vinden in de context"; dat is geen antwoord -> door.
    const weigering = (s: string) =>
      s.length < 280 &&
      /(kan|kon)[^.]{0,60}(geen|niet)[^.]{0,50}(vinden|terugvinden|beantwoorden)|geen informatie (gevonden|beschikbaar|over)|niet (terug te vinden|beschikbaar) in|(meegeleverde|gegeven|beschikbare) context|niet in de (context|kennisbank)/i.test(s);
    if (res && res.answered && !weigering(res.answer)) { answer = res.answer; sources = res.sources; mode = "kennisbank"; }
    else {
      // v206: stap 3 — live webzoek (Tavily) mét bronnen; pas daarna kale modelkennis.
      const web = await webZoek(c.env, q).catch(() => null);
      if (web) { answer = web.answer; sources = web.sources; mode = "web"; }
      else { answer = await algemeenAntwoord(c.env, q).catch(() => "Daar kan ik nu even niet bij — probeer het straks opnieuw."); mode = "algemeen"; }
    }
    c.executionCtx.waitUntil((async () => {
      try {
        if (c.env.DB) await c.env.DB.prepare("INSERT INTO ask_log (id, user_ref, question, answered, source_ids, created_at) VALUES (?, ?, ?, ?, ?, ?)")
          .bind("al" + crypto.randomUUID().replace(/-/g, ""), null, q, mode === "kennisbank" ? 1 : 0, JSON.stringify((sources ?? []).map((x) => x.title)), Date.now()).run();
      } catch { /* log best-effort */ }
    })());
  }
  return c.json({ treffers, answer, sources, mode });
});

app.post("/api/kennisbank/reindex", async (c) => {
  if (!(c.get("roles") ?? []).includes("beheerder")) return c.json({ error: "geen-toegang" }, 403);
  try {
    // 4.1: dezelfde knop ververst ook de globale FTS5-zoekindex.
    const zoekN = await reindexZoek(c.env).catch(() => 0);
    const n = await kbReindex(c.env);
    return c.json({ ok: true, chunks: n, zoek: zoekN });
  }
  catch (e) { return c.json({ error: "mislukt", detail: String(e) }, 500); }
});

// ---- Live stemmen op een poll ----
app.post("/api/poll-stem", async (c) => {
  const me = await reactieIdentiteit(c);
  if (!me) return c.json({ error: "geen-identiteit" }, 403);
  const body = (await c.req.json().catch(() => ({}))) as { poll?: string; optie?: number; idem?: string };
  const pollId = String(body.poll ?? "");
  const optie = Number(body.optie);
  const poll = pollId ? await getPoll(c.env, pollId) : undefined;
  if (!poll) return c.json({ error: "onbekend" }, 404);
  if (poll.status !== "open") return c.json({ error: "gesloten" }, 409);
  if (!Number.isInteger(optie) || optie < 0 || optie >= poll.opties.length) return c.json({ error: "optie" }, 400);
  await vote(c.env, poll, optie, me, idemId(body.idem, "ps"));
  const t = tally(poll, await getStemmen(c.env, pollId), me);
  return c.json({ counts: t.counts, total: t.total, mine: t.mine, multi: poll.multi, status: poll.status });
});

// Diagnose: met welk e-mailadres ben je volgens Access binnen, en welk medewerker-
// record hoort daarbij? Toont alleen je EIGEN identiteit (AVG-veilig). Handig bij
// "geen medewerker gekoppeld": open /api/whoami op het toestel met het probleem.
app.get("/api/whoami", async (c) => {
  const email = await resolveAccessEmail(c, c.env);
  const medewerkers = await getMedewerkers(c.env);
  const m = medewerkerVoorEmail(email, medewerkers);
  return c.json({
    email: email ?? null,
    medewerker: m ? { id: m.id, naam: m.fields.Naam ?? null } : null,
    uitleg: m ? "Gekoppeld." : (email ? "Geen medewerker-record met exact dit e-mailadres." : "Geen Access-identiteit op dit verzoek."),
  });
});

// Undo (Stroom-plan 1.4): zet een soft-deleted record terug. Zelfde rechten als
// verwijderen (maker of beheerder); agenda volgt de agenda-bewerkrol.
app.post("/api/herstel", async (c) => {
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  const body = (await c.req.json().catch(() => ({}))) as { type?: string; id?: string };
  const id = String(body.id ?? "");
  const type = String(body.type ?? "");
  if (!id || !c.env.DB) return c.json({ error: "id" }, 400);
  const db = c.env.DB;
  let ok = false;
  if (type === "post") {
    const r = await db.prepare("SELECT auteur_id FROM posts WHERE id=?").bind(id).first<{ auteur_id: string }>();
    if (r && canEditOrDelete(me, r.auteur_id)) { await restoreInTabel(c.env, "Posts", id); ok = true; }
  } else if (type === "reactie") {
    const r = await db.prepare("SELECT auteur_id FROM reacties WHERE id=?").bind(id).first<{ auteur_id: string }>();
    if (r && canEditOrDelete(me, r.auteur_id)) { await restoreInTabel(c.env, "Reacties", id); ok = true; }
  } else if (type === "poll") {
    const r = await db.prepare("SELECT maker_id FROM polls WHERE id=?").bind(id).first<{ maker_id: string }>();
    if (r && canEditOrDelete(me, r.maker_id)) { await restorePoll(c.env, id); ok = true; }
  } else if (type === "agenda") {
    if (canEditAgenda(c.get("roles") ?? [])) { await restoreEvent(c.env, id); ok = true; }
  }
  if (ok) await logAudit(c.env, me?.email, "restore", type, id);
  return ok ? c.json({ ok: true }) : c.json({ error: "geen-toegang" }, 403);
});

// ---- Notificatiecentrum (Stroom-plan 4.2) ----
app.get("/notificaties", async (c) => {
  const email = await resolveAccessEmail(c, c.env);
  if (!email) return c.redirect("/");
  const [rijen, prefs, unread] = await Promise.all([
    listNotificaties(c.env, email).catch(() => []),
    getPrefs(c.env, email),
    unreadCount(c.env, email),
  ]);
  return c.html(layout("Notificaties", "/notificaties", notificatiesPage(rijen, prefs, unread), c.get("roles") ?? []));
});

// Tap = gelezen + door naar de deep link (3.3).
app.get("/notificaties/open/:id", async (c) => {
  const email = await resolveAccessEmail(c, c.env);
  if (!email) return c.redirect("/");
  const n = await getNotificatie(c.env, email, c.req.param("id"));
  if (!n) return c.redirect("/notificaties");
  await markRead(c.env, email, n.id);
  return c.redirect(veiligTerug(n.url, "/notificaties"));
});

app.post("/notificaties/gelezen", async (c) => {
  const email = await resolveAccessEmail(c, c.env);
  if (email) await markRead(c.env, email, null);
  return c.redirect("/notificaties");
});

// v203: eigen notificaties wissen — per stuk of alles (alleen je eigen rijen).
app.post("/notificaties/verwijder", async (c) => {
  const email = await resolveAccessEmail(c, c.env);
  if (!email) return c.redirect("/");
  const form = await c.req.formData();
  const id = String(form.get("id") ?? "");
  if (id === "alles") await verwijderAlleNotificaties(c.env, email).catch(() => {});
  else if (id) await verwijderNotificatie(c.env, email, id).catch(() => {});
  return c.redirect("/notificaties");
});

app.post("/notificaties/prefs", async (c) => {
  const email = await resolveAccessEmail(c, c.env);
  if (!email) return c.redirect("/");
  const form = await c.req.formData();
  for (const m of NOTIF_MODULES) {
    await setPref(c.env, email, m.key, String(form.get("mod_" + m.key) ?? "") === "on");
  }
  return c.redirect("/notificaties?ok=1");
});

// Home-dashboard (Stroom-plan 3.2): status per module in één D1-batch.
// Zelfde bron als de servergerenderde tegels op home; valt onder de SWR-cache.
app.get("/api/home/summary", async (c) => {
  const enabled = await getEnabledOrdered(c.env).catch(() => [] as string[]);
  let modules = await homeSummary(c.env, enabled);
  // CRM-status alleen voor wie de module mag zien (team Concepts + beheer).
  if (!(c.get("roles") ?? []).includes("crm")) modules = modules.filter((m) => m.key !== "crm");
  return c.json({ modules });
});

// App-icoon badge (PWA): zelfde teller als de header-begroeting ("X nieuwe dingen").
// De client spiegelt dit getal via navigator.setAppBadge op het app-icoon.
app.get("/api/badge", async (c) => {
  const email = await resolveAccessEmail(c, c.env);
  const me = email ? await getPlayerByEmail(c.env, email) : undefined;
  const enabled = new Set(await getEnabledOrdered(c.env).catch(() => [] as string[]));
  let nieuw = 0;
  // Badge-tellers per tab (v179, pariteit met home) — zelfde bron als de home-badges.
  const tabs: Record<string, number> = {};
  try {
    const fy = await buildForYou(c.env, me?.id, enabled);
    nieuw = fy.totalNew;
    for (const g of fy.groups) tabs[g.moduleKey] = g.count;
  } catch { nieuw = 0; }
  // Premium-audit: unread-notificaties tellen mee; de client toont er ook een dot mee.
  const unread = email ? await unreadCount(c.env, email).catch(() => 0) : 0;
  return c.json({ count: Math.max(nieuw, unread), nieuw, unread, tabs });
});

// Levende stijlgids (designsysteem-preview, beheerder-only).
app.get("/stijlgids", async (c) => {
  const roles = c.get("roles") ?? [];
  if (!roles.includes("beheerder")) return c.redirect("/");
  return c.html(layout("Stijlgids", "/stijlgids", stijlgidsPage(), roles));
});

// ---- Beheer (alleen beheerders) ----
app.get("/beheer", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  // Redacteur (HR) ziet alleen de Inhoud-tegels; volledige beheerders alles.
  const volledig = (c.get("roles") ?? []).includes("beheerder");
  return c.html(layout("Beheer", "/", beheerHome(volledig), c.get("roles") ?? []));
});

// Modules aan/uit (platform-config). Bepaalt welke onderdelen zichtbaar/bereikbaar zijn.
app.get("/beheer/modules", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const [navLayout, shoutoutsHome, leesKnop] = await Promise.all([getNavLayout(c.env), getFlag(c.env, "shoutouts_home", false), getFlag(c.env, "lees_knop", false)]);
  const melding = c.req.query("ok") ? "Menu-indeling opgeslagen." : undefined;
  return c.html(layout("Menu-indeling", "/beheer/modules", beheerModules(navLayout, shoutoutsHome, { melding, leesKnop }), c.get("roles") ?? []));
});

app.post("/beheer/modules", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const form = await c.req.formData();
  const ids = form.getAll("module").map((v) => String(v));
  await setEnabledModules(c.env, ids);
  await setFlag(c.env, "shoutouts_home", form.get("shoutouts_home") != null);
  await setFlag(c.env, "lees_knop", form.get("lees_knop") != null); // v194
  // Menu-indeling (groepen + module->group/order) uit het verborgen layout-veld.
  const rawLayout = String(form.get("layout") ?? "");
  if (rawLayout) {
    try {
      const parsed = JSON.parse(rawLayout) as { groups?: { id: string; naam: string }[]; modules?: Record<string, { group: string; order: number }> };
      if (Array.isArray(parsed.groups)) await saveNavGroups(c.env, parsed.groups.map((g, i) => ({ id: g.id, naam: g.naam, order: i })));
      if (parsed.modules && typeof parsed.modules === "object") await saveModuleGroups(c.env, parsed.modules);
    } catch { /* ongeldige payload negeren */ }
  }
  return c.redirect("/beheer/modules?ok=1");
});

app.get("/beheer/meldingen", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const [players, ovV, ovD] = await Promise.all([
    getAllPlayers(c.env), getOntvangers(c.env, "voorraad"), getOntvangers(c.env, "defect"),
  ]);
  const melding = c.req.query("ok") ? "Ontvangers opgeslagen." : undefined;
  return c.html(layout("Meldingen-ontvangers", "/", beheerMeldingen(players, { voorraad: new Set(ovV), defect: new Set(ovD) }, { melding }), c.get("roles") ?? []));
});

app.post("/beheer/meldingen", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const form = await c.req.formData();
  await setOntvangers(c.env, "voorraad", form.getAll("voorraad").map(String));
  await setOntvangers(c.env, "defect", form.getAll("defect").map(String));
  return c.redirect("/beheer/meldingen?ok=1");
});

app.get("/beheer/bhv", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const [players, ids, recente] = await Promise.all([
    getAllPlayers(c.env), getBhvOntvangers(c.env), listNoodmeldingen(c.env, 25),
  ]);
  const melding = c.req.query("ok") ? "BHV-groep opgeslagen." : undefined;
  return c.html(layout("BHV-groep", "/", beheerBhv(players, new Set(ids), recente, { melding }), c.get("roles") ?? []));
});

app.post("/beheer/bhv", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const form = await c.req.formData();
  await setBhvOntvangers(c.env, form.getAll("bhv").map(String));
  return c.redirect("/beheer/bhv?ok=1");
});
app.post("/beheer/bhv/verwijder", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const form = await c.req.formData();
  if (String(form.get("all") ?? "") === "1") await clearNoodmeldingen(c.env);
  else { const id = String(form.get("id") ?? ""); if (id) await deleteNoodmelding(c.env, id); }
  return c.redirect("/beheer/bhv?ok=1");
});

// ---- Audit-log (Stroom-plan 4.5): gefilterde tabel + CSV-export, beheerder-only ----
async function auditQuery(env: Env, f: { q: string; actie: string; dagen: number }, limit: number): Promise<AuditRij[]> {
  if (!env.DB) return [];
  const sinds = Date.now() - f.dagen * 24 * 60 * 60 * 1000;
  const like = `%${f.q}%`;
  const r = await env.DB
    .prepare(
      `SELECT id, actor, action, entity, entity_id, created_at FROM audit_log
       WHERE tenant_id='default' AND created_at >= ?
         AND (? = '' OR action = ?)
         AND (? = '' OR actor LIKE ? OR entity LIKE ? OR entity_id LIKE ?)
       ORDER BY created_at DESC LIMIT ?`,
    )
    .bind(sinds, f.actie, f.actie, f.q, like, like, like, limit)
    .all<AuditRij>();
  return r.results ?? [];
}
function auditFilters(c: Context): { q: string; actie: string; dagen: number } {
  const q = (c.req.query("q") ?? "").trim().slice(0, 80);
  const actie = (c.req.query("actie") ?? "").trim().slice(0, 20);
  const dagen = [7, 30, 365].includes(Number(c.req.query("dagen"))) ? Number(c.req.query("dagen")) : 30;
  return { q, actie, dagen };
}
// Leesbevestiging-overzicht (v185): wie heeft welk nieuws/beleidsdocument gelezen.
app.get("/beheer/leesbevestiging", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const [nieuws, documenten, stats] = await Promise.all([
    getGepubliceerdNieuws(c.env),
    getDocumenten(c.env),
    leesOverzicht(c.env).catch(() => new Map<string, { aantal: number; namen: string[] }>()),
  ]);
  const totaal = medewerkers.filter((m) => m.fields.Actief !== false && m.fields["E-mail"]).length;
  const stat = (k: string) => stats.get(k) ?? { aantal: 0, namen: [] };
  // v194: naast expliciete bevestigingen ook de stille "gezien"-registratie tonen.
  const items: LeesItem[] = [
    ...nieuws.map((n) => ({
      type: "nieuws" as const,
      titel: n.fields.Titel ?? "(zonder titel)",
      meta: n.fields.Publicatiedatum ?? "",
      ...stat(`nieuws:${n.id}`),
      gezien: stat(`nieuws_gezien:${n.id}`).aantal,
      gezienNamen: stat(`nieuws_gezien:${n.id}`).namen,
    })),
    ...documenten.filter((d) => d.fields.Categorie === "Beleid").map((d) => ({
      type: "document" as const,
      titel: d.fields.Titel ?? "(zonder titel)",
      meta: d.fields.Categorie ?? "",
      ...stat(`document:${d.id}`),
      gezien: stat(`document_gezien:${d.id}`).aantal,
      gezienNamen: stat(`document_gezien:${d.id}`).namen,
    })),
  ];
  return c.html(layout("Leesbevestiging", "/beheer", beheerLeesbevestiging(items, totaal), c.get("roles") ?? []));
});

// ---- Analytics (v206): geaggregeerd beheerdashboard ----
app.get("/beheer/analytics", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const data = await haalAnalytics(c.env);
  // Noemer-fallback: D1-kolom 'actief' kan ontbreken — val terug op Airtable-bron.
  if (!data.totaalActief) data.totaalActief = medewerkers.filter((m) => m.fields.Actief !== false && m.fields["E-mail"]).length;
  return c.html(layout("Analytics", "/beheer", beheerAnalytics(data), c.get("roles") ?? []));
});

// ---- Kennisdump (v202): documenten droppen -> AI leest/categoriseert/indexeert ----
app.get("/beheer/kennisdump", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const items = await listDump(c.env);
  const ok = c.req.query("ok");
  return c.html(layout("Kennisdump", "/beheer", beheerKennisdump(items, { melding: ok || undefined }), c.get("roles") ?? []));
});

app.post("/beheer/kennisdump", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.text("geen toegang", 403);
  const email = (await resolveAccessEmail(c, c.env)) ?? "beheer";
  const form = await c.req.formData();
  // workers-types typt getAll() als string[]; bestanden komen er als File in — cast.
  const files = (form.getAll("bestand") as unknown as (string | File)[])
    .filter((f): f is File => typeof f !== "string" && !!f && f.size > 0)
    .slice(0, 8);
  if (!files.length) return c.redirect("/beheer/kennisdump?ok=" + encodeURIComponent("Geen bestanden ontvangen."));
  let okN = 0;
  const fouten: string[] = [];
  for (const f of files) {
    if (f.size > 15 * 1024 * 1024) { fouten.push(`${f.name}: te groot (max 15MB)`); continue; }
    const res = await verwerkDump(c.env, f.name, await f.arrayBuffer(), email)
      .catch((e) => ({ ok: false as const, fout: String(e).slice(0, 120) }));
    if (res.ok) okN++;
    else fouten.push(`${f.name}: ${"fout" in res ? res.fout : "onbekend"}`);
  }
  const msg = `${okN} document${okN === 1 ? "" : "en"} verwerkt en geïndexeerd${fouten.length ? ` · mislukt: ${fouten.join("; ").slice(0, 280)}` : ""}`;
  return c.redirect("/beheer/kennisdump?ok=" + encodeURIComponent(msg));
});

app.post("/beheer/kennisdump/audience", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.text("geen toegang", 403);
  const form = await c.req.formData();
  const id = String(form.get("id") ?? "");
  const klant = String(form.get("klant") ?? "0") === "1";
  if (id) await zetDumpAudience(c.env, id, klant).catch(() => {});
  return c.redirect("/beheer/kennisdump?ok=" + encodeURIComponent(klant ? "Zichtbaar gemaakt voor klanten (portaal-vraagbaak)." : "Weer alleen intern."));
});

app.post("/beheer/kennisdump/verwijder", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.text("geen toegang", 403);
  const form = await c.req.formData();
  const id = String(form.get("id") ?? "");
  if (id) await verwijderDump(c.env, id).catch(() => {});
  return c.redirect("/beheer/kennisdump?ok=" + encodeURIComponent("Verwijderd uit de kennisbank."));
});

app.get("/beheer/audit", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const f = auditFilters(c);
  const rijen = await auditQuery(c.env, f, 200).catch(() => [] as AuditRij[]);
  return c.html(layout("Audit-log", "/beheer", auditPage(rijen, f), c.get("roles") ?? []));
});
app.get("/beheer/audit.csv", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.text("geen toegang", 403);
  const f = auditFilters(c);
  const rijen = await auditQuery(c.env, f, 2000).catch(() => [] as AuditRij[]);
  const esc = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const csv = ["wanneer;wie;actie;entiteit;id",
    ...rijen.map((r) => [new Date(r.created_at).toISOString(), r.actor ?? "", r.action, r.entity, r.entity_id].map(esc).join(";")),
  ].join("\r\n");
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-log-${f.dagen}d.csv"`,
    },
  });
});

app.get("/beheer/bugmeldingen", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const melding = c.req.query("ok") ? "Opgeslagen." : undefined;
  return c.html(layout("Bugmeldingen", "/", beheerBugs(await listBugs(c.env), { melding }), c.get("roles") ?? []));
});
app.post("/beheer/bugmeldingen/status", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const form = await c.req.formData();
  const id = String(form.get("id") ?? ""); const status = String(form.get("status") ?? "open");
  if (id) await setBugStatus(c.env, id, status);
  return c.redirect("/beheer/bugmeldingen?ok=1");
});
app.post("/beheer/bugmeldingen/verwijder", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const id = String((await c.req.formData()).get("id") ?? "");
  if (id) await deleteBug(c.env, id);
  return c.redirect("/beheer/bugmeldingen?ok=1");
});

// ---- Beheer: Trainingen ----
app.get("/beheer/trainingen", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  await seedIfEmpty(c.env);
  const melding = c.req.query("ok") ? "Opgeslagen." : undefined;
  return c.html(layout("Trainingen beheren", "/", beheerTrainingen(await listCourses(c.env, true), { melding }), c.get("roles") ?? []));
});
app.post("/beheer/trainingen", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const form = await c.req.formData();
  const title = String(form.get("title") ?? "").trim();
  if (title) await createCourse(c.env, title, String(form.get("description") ?? "").trim());
  return c.redirect("/beheer/trainingen?ok=1");
});
app.post("/beheer/trainingen/hoofdstuk/:cid/verwijder", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const ch = await getChapter(c.env, c.req.param("cid"));
  await deleteChapter(c.env, c.req.param("cid"));
  return c.redirect("/beheer/trainingen/" + (ch?.course_id ?? ""));
});
app.post("/beheer/trainingen/hoofdstuk/:cid", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const ch = await getChapter(c.env, c.req.param("cid"));
  const form = await c.req.formData();
  await updateChapter(c.env, c.req.param("cid"), String(form.get("title") ?? "").trim(), String(form.get("body") ?? ""));
  return c.redirect("/beheer/trainingen/" + (ch?.course_id ?? ""));
});
app.post("/beheer/trainingen/:id/hoofdstuk", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const form = await c.req.formData();
  const title = String(form.get("title") ?? "").trim();
  if (title) await addChapter(c.env, c.req.param("id"), title, String(form.get("body") ?? ""));
  return c.redirect("/beheer/trainingen/" + c.req.param("id"));
});
app.post("/beheer/trainingen/:id/verwijder", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  await deleteCourse(c.env, c.req.param("id"));
  return c.redirect("/beheer/trainingen");
});
app.post("/beheer/trainingen/:id", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const form = await c.req.formData();
  await updateCourse(c.env, c.req.param("id"), String(form.get("title") ?? "").trim(), String(form.get("description") ?? "").trim(), form.get("published") != null);
  return c.redirect("/beheer/trainingen/" + c.req.param("id") + "?ok=1");
});
app.get("/beheer/trainingen/:id", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const course = await getCourse(c.env, c.req.param("id"));
  if (!course) return c.redirect("/beheer/trainingen");
  const melding = c.req.query("ok") ? "Opgeslagen." : undefined;
  return c.html(layout("Cursus bewerken", "/", beheerCourse(course, await getChapters(c.env, course.id), { melding }), c.get("roles") ?? []));
});

app.get("/beheer/medewerkers", async (c) => {
  const [medewerkers, afdelingen] = await Promise.all([
    getMedewerkers(c.env),
    getAfdelingen(c.env),
  ]);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const id = c.req.query("id");
  const bewerk = id ? medewerkers.find((m) => m.id === id) : undefined;
  const melding = c.req.query("ok")
    ? (c.req.query("cf") === "fout"
        ? "Opgeslagen — maar de Cloudflare-sync (uitzendkracht-login) is mislukt. Probeer opnieuw op te slaan of check de configuratie."
        : "Opgeslagen.")
    : undefined;
  const afdNamen = afdelingen.map((a) => a.fields.Naam ?? "").filter(Boolean);
  // v186: alleen volledige beheerders mogen Beheerder/Redacteur toekennen.
  const magRollen = (c.get("roles") ?? []).includes("beheerder");
  // v188: extra-recht kantine-beheer (kolom roles) tonen als vinkje.
  const kantineAan = bewerk ? (((await getPlayerById(c.env, bewerk.id))?.roles ?? []).includes("kantine")) : false;
  return c.html(
    layout("Medewerkers", "/", beheerMedewerkers(medewerkers, afdNamen, bewerk, { melding, magRollen, kantine: kantineAan }), c.get("roles") ?? []),
  );
});

app.post("/beheer/medewerkers", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const form = await c.req.formData();
  const id = String(form.get("id") ?? "");
  // v186: rol-escalatie blokkeren — een Redacteur (HR) kan Beheerder/Redacteur niet
  // toekennen of afpakken; bestaande beschermde rollen blijven dan ongewijzigd.
  let rol: string | undefined = String(form.get("rol") ?? "") || undefined;
  if (!(c.get("roles") ?? []).includes("beheerder")) {
    const huidig = id ? (medewerkers.find((m) => m.id === id)?.fields.Rol as string | undefined) : undefined;
    const beschermd = (r?: string) => r === "Beheerder" || r === "Redacteur";
    if (beschermd(rol) || beschermd(huidig)) rol = huidig;
  }
  const fields: Record<string, unknown> = {
    Naam: String(form.get("naam") ?? ""),
    "E-mail": String(form.get("email") ?? "") || undefined,
    Rol: rol,
    Afdeling: String(form.get("afdeling") ?? "") || undefined,
    Verjaardag: String(form.get("verjaardag") ?? "") || undefined,
    Telefoon: String(form.get("telefoon") ?? "") || undefined,
    Functie: String(form.get("functie") ?? "") || undefined,
    Actief: form.get("actief") != null,
  };
  const fotoUrl = String(form.get("foto_url") ?? "").trim();
  const fotoFile = form.get("foto") as unknown as File | null;
  if (fotoFile && fotoFile.size > 0 && c.env.DOCS) {
    const veilig = fotoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const sleutel = `medewerkers/${Date.now()}-${crypto.randomUUID()}-${veilig}`;
    await c.env.DOCS.put(sleutel, fotoFile.stream(), {
      httpMetadata: { contentType: fotoFile.type || "image/jpeg" },
      customMetadata: { naam: fotoFile.name },
    });
    fields.Foto = sleutel;
  } else if (fotoUrl) {
    fields.Foto = fotoUrl;
  }
  let mid = id;
  if (id) await updateInTabel(c.env, "Medewerkers", id, fields);
  else mid = (await createInTabel<MedewerkerFields>(c.env, "Medewerkers", fields)).id;
  // v188: extra-recht kantine-beheer (kolom roles, los van de hoofdrol).
  if (mid) await setExtraRole(c.env, mid, "kantine", form.get("kantine_beheer") != null).catch((e) => console.error("kantine-rol opslaan faalde:", e));
  // v187: Access-groep "Uitzendkrachten" direct meesyncen (alleen als geconfigureerd).
  let cf = "";
  if (accessSyncGeconfigureerd(c.env)) {
    const r = await syncAccessUitzendkrachten(c.env);
    if (!r.ok) { console.error("Access-sync uitzendkrachten faalde:", r.error); cf = "&cf=fout"; }
  }
  return c.redirect("/beheer/medewerkers?ok=1" + cf);
});

app.get("/beheer/afdelingen", async (c) => {
  const [medewerkers, afdelingen] = await Promise.all([
    getMedewerkers(c.env),
    getAfdelingen(c.env),
  ]);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const melding = c.req.query("ok") ? "Opgeslagen." : undefined;
  return c.html(layout("Afdelingen", "/", beheerAfdelingen(afdelingen, { melding }), c.get("roles") ?? []));
});

app.post("/beheer/afdelingen", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const form = await c.req.formData();
  const naam = String(form.get("naam") ?? "").trim();
  if (naam) await createInTabel(c.env, "Afdelingen", { Naam: naam });
  return c.redirect("/beheer/afdelingen?ok=1");
});

app.post("/beheer/afdelingen/verwijder", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const form = await c.req.formData();
  const id = String(form.get("id") ?? "");
  if (id) await deleteInTabel(c.env, "Afdelingen", id);
  return c.redirect("/beheer/afdelingen?ok=1");
});

app.get("/beheer/nieuws", async (c) => {
  const [nieuws, medewerkers] = await Promise.all([
    getAlleNieuws(c.env),
    getMedewerkers(c.env),
  ]);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const id = c.req.query("id");
  const bewerk = id ? nieuws.find((n) => n.id === id) : undefined;
  const melding = c.req.query("ok") ? "Opgeslagen." : undefined;
  return c.html(layout("Nieuws beheren", "/", beheerNieuws(nieuws, bewerk, { melding }), c.get("roles") ?? []));
});

app.post("/beheer/nieuws", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const form = await c.req.formData();
  const id = String(form.get("id") ?? "");
  const fields: Record<string, unknown> = {
    Titel: String(form.get("titel") ?? ""),
    Inhoud: String(form.get("inhoud") ?? "") || undefined,
    Categorie: String(form.get("categorie") ?? "") || undefined,
    Publicatiedatum: String(form.get("publicatiedatum") ?? "") || undefined,
    Status: String(form.get("status") ?? "") || undefined,
    Zichtbaarheid: String(form.get("zichtbaarheid") ?? "") || undefined,
    Uitgelicht: form.get("uitgelicht") != null,
  };
  const foto = form.get("afbeelding") as unknown as File | null;
  if (foto && foto.size > 0 && c.env.DOCS) {
    const veilig = foto.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const sleutel = `nieuws/${Date.now()}-${crypto.randomUUID()}-${veilig}`;
    await c.env.DOCS.put(sleutel, foto.stream(), {
      httpMetadata: { contentType: foto.type || "image/jpeg" },
      customMetadata: { naam: foto.name },
    });
    fields.Afbeeldingssleutel = sleutel;
  }
  if (id) await updateInTabel(c.env, "Nieuws", id, fields);
  else await createInTabel(c.env, "Nieuws", fields);
  if (form.get("push") != null && fields.Status === "Gepubliceerd" && (await getFlag(c.env, "push_nieuws", true))) {
    const titel = String(fields.Titel || "Nieuw bericht");
    const inhoud = String(fields.Inhoud || "");
    c.executionCtx.waitUntil(
      pushNaarIedereen(c.env, { title: titel, body: inhoud.slice(0, 140), url: "/" }),
    );
  }
  return c.redirect("/beheer/nieuws?ok=1");
});

app.post("/beheer/nieuws/verwijder", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const id = String((await c.req.formData()).get("id") ?? "");
  if (id) {
    await deleteInTabel(c.env, "Nieuws", id);
    // v205: cascade (zelfde als agenda v203) — notificaties + kennisbank-index mee opruimen.
    c.executionCtx.waitUntil((async () => {
      try { await verwijderNotificatiesVoorUrl(c.env, `nieuws-${id}`); } catch { /* best effort */ }
      try { await removeKbDoc(c.env, "kbnws_" + id); } catch { /* best effort */ }
    })());
  }
  return c.redirect("/beheer/nieuws?ok=1");
});

app.get("/beheer/documenten", async (c) => {
  const [documenten, medewerkers] = await Promise.all([
    getDocumenten(c.env),
    getMedewerkers(c.env),
  ]);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const id = c.req.query("id");
  const bewerk = id ? documenten.find((d) => d.id === id) : undefined;
  const melding = c.req.query("ok") ? "Opgeslagen." : undefined;
  return c.html(
    layout("Documenten beheren", "/", beheerDocumenten(documenten, bewerk, { melding }), c.get("roles") ?? []),
  );
});

app.post("/beheer/documenten", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const form = await c.req.formData();
  const id = String(form.get("id") ?? "");
  const fields: Record<string, unknown> = {
    Titel: String(form.get("titel") ?? ""),
    Omschrijving: String(form.get("omschrijving") ?? "") || undefined,
    "Externe link": String(form.get("link") ?? "") || undefined,
    Categorie: String(form.get("categorie") ?? "") || undefined,
  };
  const bestand = form.get("bestand") as unknown as File | null;
  if (bestand && bestand.size > 0) {
    const veilig = bestand.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const sleutel = `docs/${Date.now()}-${crypto.randomUUID()}-${veilig}`;
    if (c.env.DOCS) {
      await c.env.DOCS.put(sleutel, bestand.stream(), {
        httpMetadata: { contentType: bestand.type || "application/octet-stream" },
        customMetadata: { naam: bestand.name },
      });
    }
    fields.Bestandssleutel = sleutel;
    fields.Bestandsnaam = bestand.name;
  }
  if (id) await updateInTabel(c.env, "Documenten", id, fields);
  else await createInTabel(c.env, "Documenten", fields);
  return c.redirect("/beheer/documenten?ok=1");
});

// ---- Beheer: klanten + inloglinks (klantenportaal) ----
app.get("/beheer/klanten", async (c) => {
  const [klanten, medewerkers] = await Promise.all([
    getKlanten(c.env),
    getMedewerkers(c.env),
  ]);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const id = c.req.query("id");
  const bewerk = id ? klanten.find((k) => k.id === id) : undefined;
  const melding = c.req.query("ok") ? "Klant opgeslagen." : undefined;
  return c.html(layout("Klanten", "/", beheerKlanten(klanten, bewerk, { melding }), c.get("roles") ?? []));
});

app.post("/beheer/klanten", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const form = await c.req.formData();
  const id = String(form.get("id") ?? "");
  const email = String(form.get("email") ?? "").trim();
  if (email) {
    const fields: Record<string, unknown> = {
      Naam: String(form.get("naam") ?? "").trim() || email,
      "E-mail": email,
      Bedrijf: String(form.get("bedrijf") ?? "") || undefined,
      Taal: String(form.get("taal") ?? "") || undefined,
      Actief: form.get("actief") != null,
    };
    if (id) await updateInTabel(c.env, "Klanten", id, fields);
    else await createInTabel(c.env, "Klanten", fields);
  }
  return c.redirect("/beheer/klanten?ok=1");
});

app.post("/beheer/klanten/verwijder", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const id = String((await c.req.formData()).get("id") ?? "");
  if (id) await deleteInTabel(c.env, "Klanten", id);
  return c.redirect("/beheer/klanten?ok=1");
});

app.post("/beheer/klanten/link", async (c) => {
  const [klanten, medewerkers] = await Promise.all([
    getKlanten(c.env),
    getMedewerkers(c.env),
  ]);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const secret = c.env.PORTAL_SECRET;
  const email = String((await c.req.formData()).get("email") ?? "")
    .trim()
    .toLowerCase();
  let link: string | undefined;
  let fout: string | undefined;
  if (!secret) {
    fout = "PORTAL_SECRET ontbreekt - stel die eerst in (wrangler secret put PORTAL_SECRET).";
  } else if (email) {
    const token = await createInviteToken(email, secret);
    const base = c.env.PORTAL_BASE_URL ?? new URL(c.req.url).origin;
    link = `${base}/portaal/verify?token=${encodeURIComponent(token)}`;
  }
  return c.html(
    layout("Klanten", "/", beheerKlanten(klanten, undefined, { link, linkEmail: email, fout }), c.get("roles") ?? []),
  );
});

// ---- Beheer: Snelkoppelingen (app-tegels op home) ----
app.get("/beheer/tiles", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const tiles = await getTiles(c.env);
  const melding = c.req.query("ok") === "reset" ? "Hersteld naar standaard." : c.req.query("ok") ? "Opgeslagen." : undefined;
  return c.html(layout("Snelkoppelingen", "/", beheerTiles(tiles, { melding }), c.get("roles") ?? []));
});

app.post("/beheer/tiles", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const form = await c.req.formData();
  if (form.get("reset")) { await resetTiles(c.env); return c.redirect("/beheer/tiles?ok=reset"); }
  let tiles: unknown = [];
  try { tiles = JSON.parse(String(form.get("tiles") ?? "[]")); } catch { tiles = []; }
  await saveTiles(c.env, tiles);
  await logAudit(c.env, await resolveAccessEmail(c, c.env), "update", "snelkoppelingen", "tiles");
  return c.redirect("/beheer/tiles?ok=1");
});

// ---- Beheer: Header & begroeting ----
app.get("/beheer/header", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const [cfg, variants] = await Promise.all([getHeaderConfig(c.env), getVariants(c.env)]);
  const melding = c.req.query("ok") === "reset" ? "Hersteld naar standaard." : c.req.query("ok") ? "Opgeslagen." : undefined;
  return c.html(layout("Header & begroeting", "/", beheerHeader(cfg, variants, { melding }), c.get("roles") ?? []));
});

app.post("/beheer/header", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const form = await c.req.formData();
  if (form.get("reset")) { await resetHeader(c.env); return c.redirect("/beheer/header?ok=reset"); }
  const hex = (v: unknown, d: string) => { const x = String(v ?? "").trim(); return /^#[0-9a-fA-F]{3,8}$/.test(x) ? x : d; };
  const cfg: HeaderConfig = {
    enabled: form.get("enabled") === "on",
    useTimeBased: form.get("use_time_based") === "on",
    randomize: form.get("randomize") === "on",
    subtitleTemplate: String(form.get("subtitle_template") ?? "").slice(0, 160) || DEFAULT_CONFIG.subtitleTemplate,
    gradientFrom: hex(form.get("gradient_from"), DEFAULT_CONFIG.gradientFrom),
    gradientTo: hex(form.get("gradient_to"), DEFAULT_CONFIG.gradientTo),
    textColor: hex(form.get("text_color"), DEFAULT_CONFIG.textColor),
    fallbackGreeting: DEFAULT_CONFIG.fallbackGreeting,
  };
  let variants: GreetingVariant[] = [];
  try {
    const arr = JSON.parse(String(form.get("variants") ?? "[]"));
    if (Array.isArray(arr)) variants = arr.map((v) => ({
      text: String(v.text ?? "").slice(0, 40).trim(),
      slot: (["morning", "afternoon", "evening", "any"].includes(v.slot) ? v.slot : "any") as GreetingVariant["slot"],
      weight: Math.max(1, Number(v.weight) || 1),
      active: v.active !== false,
    })).filter((v) => v.text);
  } catch { /* ongeldige JSON -> leeg */ }
  if (!variants.length) variants = DEFAULT_VARIANTS;
  await saveHeaderConfig(c.env, cfg);
  await saveVariants(c.env, variants);
  return c.redirect("/beheer/header?ok=1");
});

// ---- Beheer: Rassen ----
app.get("/beheer/rassen", async (c) => {
  const [items, medewerkers] = await Promise.all([getAlleRassen(c.env), getMedewerkers(c.env)]);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const id = c.req.query("id");
  const bewerk = id ? items.find((x) => x.id === id) : undefined;
  const melding = c.req.query("ok") ? "Opgeslagen." : undefined;
  return c.html(layout("Rassen", "/", beheerRassen(items, bewerk, { melding }), c.get("roles") ?? []));
});
app.post("/beheer/rassen", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const form = await c.req.formData();
  const id = String(form.get("id") ?? "");
  const fields: Record<string, unknown> = {
    Naam: String(form.get("naam") ?? ""),
    Gewas: String(form.get("gewas") ?? "") || undefined,
    Omschrijving: String(form.get("omschrijving") ?? "") || undefined,
    Smaak: String(form.get("smaak") ?? "") || undefined,
    Kleur: String(form.get("kleur") ?? "") || undefined,
    Seizoen: String(form.get("seizoen") ?? "") || undefined,
    Volgorde: form.get("volgorde") ? Number(form.get("volgorde")) : undefined,
    Gepubliceerd: form.get("gepubliceerd") != null,
  };
  const afb = String(form.get("afbeelding") ?? "");
  if (afb) fields.Afbeeldingssleutel = afb;
  const portBestand = form.get("bestand") as unknown as File | null;
  if (portBestand && portBestand.size > 0 && c.env.DOCS) {
    const veilig = portBestand.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const sleutel = `portaal/${crypto.randomUUID()}_${veilig}`;
    await c.env.DOCS.put(sleutel, portBestand.stream(), {
      httpMetadata: { contentType: portBestand.type || "application/octet-stream" },
      customMetadata: { naam: portBestand.name },
    });
    fields.Bestandssleutel = sleutel;
    fields.Bestandsnaam = portBestand.name;
  }
  if (id) await updateInTabel(c.env, "Rassen", id, fields);
  else await createInTabel(c.env, "Rassen", fields);
  return c.redirect("/beheer/rassen?ok=1");
});
app.post("/beheer/rassen/verwijder", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const id = String((await c.req.formData()).get("id") ?? "");
  if (id) await deleteInTabel(c.env, "Rassen", id);
  return c.redirect("/beheer/rassen?ok=1");
});

// ---- Beheer: Teeltadvies ----
app.get("/beheer/teeltadvies", async (c) => {
  const [items, rassen, medewerkers] = await Promise.all([getAlleTeeltadvies(c.env), getAlleRassen(c.env), getMedewerkers(c.env)]);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const id = c.req.query("id");
  const bewerk = id ? items.find((x) => x.id === id) : undefined;
  const melding = c.req.query("ok") ? "Opgeslagen." : undefined;
  return c.html(layout("Teeltadvies", "/", beheerTeeltadvies(items, rassen, bewerk, { melding }), c.get("roles") ?? []));
});
app.post("/beheer/teeltadvies", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const form = await c.req.formData();
  const id = String(form.get("id") ?? "");
  const fields: Record<string, unknown> = {
    Titel: String(form.get("titel") ?? ""),
    Inhoud: String(form.get("inhoud") ?? "") || undefined,
    Ras: String(form.get("ras") ?? "") || undefined,
    Categorie: String(form.get("categorie") ?? "") || undefined,
    Volgorde: form.get("volgorde") ? Number(form.get("volgorde")) : undefined,
    Gepubliceerd: form.get("gepubliceerd") != null,
  };
  const afb = String(form.get("afbeelding") ?? "");
  if (afb) fields.Afbeeldingssleutel = afb;
  const portBestand = form.get("bestand") as unknown as File | null;
  if (portBestand && portBestand.size > 0 && c.env.DOCS) {
    const veilig = portBestand.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const sleutel = `portaal/${crypto.randomUUID()}_${veilig}`;
    await c.env.DOCS.put(sleutel, portBestand.stream(), {
      httpMetadata: { contentType: portBestand.type || "application/octet-stream" },
      customMetadata: { naam: portBestand.name },
    });
    fields.Bestandssleutel = sleutel;
    fields.Bestandsnaam = portBestand.name;
  }
  if (id) await updateInTabel(c.env, "Teeltadvies", id, fields);
  else await createInTabel(c.env, "Teeltadvies", fields);
  return c.redirect("/beheer/teeltadvies?ok=1");
});
app.post("/beheer/teeltadvies/verwijder", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const id = String((await c.req.formData()).get("id") ?? "");
  if (id) await deleteInTabel(c.env, "Teeltadvies", id);
  return c.redirect("/beheer/teeltadvies?ok=1");
});

// ---- Beheer: Snoei & pluk ----
app.get("/beheer/snoei", async (c) => {
  const [items, rassen, medewerkers] = await Promise.all([getAlleSnoeiPluk(c.env), getAlleRassen(c.env), getMedewerkers(c.env)]);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const id = c.req.query("id");
  const bewerk = id ? items.find((x) => x.id === id) : undefined;
  const melding = c.req.query("ok") ? "Opgeslagen." : undefined;
  return c.html(layout("Snoei & pluk", "/", beheerSnoeiPluk(items, rassen, bewerk, { melding }), c.get("roles") ?? []));
});
app.post("/beheer/snoei", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const form = await c.req.formData();
  const id = String(form.get("id") ?? "");
  const fields: Record<string, unknown> = {
    Titel: String(form.get("titel") ?? ""),
    Type: String(form.get("type") ?? "") || undefined,
    Inhoud: String(form.get("inhoud") ?? "") || undefined,
    Ras: String(form.get("ras") ?? "") || undefined,
    Periode: String(form.get("periode") ?? "") || undefined,
    Volgorde: form.get("volgorde") ? Number(form.get("volgorde")) : undefined,
    Gepubliceerd: form.get("gepubliceerd") != null,
  };
  const afb = String(form.get("afbeelding") ?? "");
  if (afb) fields.Afbeeldingssleutel = afb;
  const portBestand = form.get("bestand") as unknown as File | null;
  if (portBestand && portBestand.size > 0 && c.env.DOCS) {
    const veilig = portBestand.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const sleutel = `portaal/${crypto.randomUUID()}_${veilig}`;
    await c.env.DOCS.put(sleutel, portBestand.stream(), {
      httpMetadata: { contentType: portBestand.type || "application/octet-stream" },
      customMetadata: { naam: portBestand.name },
    });
    fields.Bestandssleutel = sleutel;
    fields.Bestandsnaam = portBestand.name;
  }
  if (id) await updateInTabel(c.env, "Snoei en pluk", id, fields);
  else await createInTabel(c.env, "Snoei en pluk", fields);
  return c.redirect("/beheer/snoei?ok=1");
});
app.post("/beheer/snoei/verwijder", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const id = String((await c.req.formData()).get("id") ?? "");
  if (id) await deleteInTabel(c.env, "Snoei en pluk", id);
  return c.redirect("/beheer/snoei?ok=1");
});

// ---- Beheer: Klantdocumenten ----
app.get("/beheer/klantdocumenten", async (c) => {
  const [items, medewerkers] = await Promise.all([getAlleKlantdocumenten(c.env), getMedewerkers(c.env)]);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const id = c.req.query("id");
  const bewerk = id ? items.find((x) => x.id === id) : undefined;
  const melding = c.req.query("ok") ? "Opgeslagen." : undefined;
  return c.html(layout("Klantdocumenten", "/", beheerKlantdocumenten(items, bewerk, { melding }), c.get("roles") ?? []));
});
app.post("/beheer/klantdocumenten", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const form = await c.req.formData();
  const id = String(form.get("id") ?? "");
  const fields: Record<string, unknown> = {
    Titel: String(form.get("titel") ?? ""),
    Omschrijving: String(form.get("omschrijving") ?? "") || undefined,
    "Externe link": String(form.get("link") ?? "") || undefined,
    Categorie: String(form.get("categorie") ?? "") || undefined,
    Gepubliceerd: form.get("gepubliceerd") != null,
  };
  const bestand = form.get("bestand") as unknown as File | null;
  if (bestand && bestand.size > 0 && c.env.DOCS) {
    const veilig = bestand.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const sleutel = `klantdocs/${Date.now()}-${crypto.randomUUID()}-${veilig}`;
    await c.env.DOCS.put(sleutel, bestand.stream(), {
      httpMetadata: { contentType: bestand.type || "application/octet-stream" },
      customMetadata: { naam: bestand.name },
    });
    fields.Bestandssleutel = sleutel;
    fields.Bestandsnaam = bestand.name;
  }
  if (id) await updateInTabel(c.env, "Klantdocumenten", id, fields);
  else await createInTabel(c.env, "Klantdocumenten", fields);
  return c.redirect("/beheer/klantdocumenten?ok=1");
});
app.post("/beheer/klantdocumenten/verwijder", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  const id = String((await c.req.formData()).get("id") ?? "");
  if (id) await deleteInTabel(c.env, "Klantdocumenten", id);
  return c.redirect("/beheer/klantdocumenten?ok=1");
});


// ---- Agenda ----
function canEditAgenda(roles: string[]): boolean {
  return roles.includes("admin") || roles.includes("pv");
}
function readEventForm(form: FormData) {
  const title = String(form.get("title") ?? "").trim();
  if (!title) return undefined;
  const start = Date.parse(amsterdamLocalToUtcIso(String(form.get("start") ?? "")));
  const end = Date.parse(amsterdamLocalToUtcIso(String(form.get("end") ?? "")));
  if (Number.isNaN(start) || Number.isNaN(end)) return undefined;
  return {
    title,
    description: String(form.get("description") ?? "") || undefined,
    location: String(form.get("location") ?? "") || undefined,
    category: String(form.get("category") ?? "company"),
    start_at: start,
    end_at: end > start ? end : start + 3600000,
    all_day: form.get("all_day") != null,
  };
}

app.get("/agenda", async (c) => {
  const roles = c.get("roles") ?? [];
  if (!isModuleOn(roles, "agenda")) return c.redirect("/");
  c.executionCtx.waitUntil((async () => { try { const uid = (await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env)))?.id; await touchSeen(c.env, uid, "agenda"); } catch {} })());
  // Verlofoverzicht (afwezigheidsplanner, bron Buddee) is een aparte weergave.
  if ((c.req.query("view") ?? "") === "verlof") {
    const todayAmsV = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date());
    const anchorV = c.req.query("date") || todayAmsV;
    const baseV = new Date(anchorV + "T12:00:00Z").getTime();
    const verlof = await getVerlofInRange(c.env, baseV - 21 * 86400000, baseV + 21 * 86400000);
    const team = await getActiveMedewerkers(c.env);
    return c.html(layout("Verlof", "/agenda", verlofPage(anchorV, team, verlof, canEditAgenda(roles)), roles));
  }
  // C2: onthoud de weergavekeuze per gebruiker (cookie). Expliciete ?view wint en wordt onthouden.
  const cookieView = (c.req.header("cookie") ?? "").match(/ff_agenda_view=(dag|week|maand)/)?.[1];
  const vq = c.req.query("view") ?? cookieView ?? "maand";
  const view = (vq === "week" || vq === "dag" ? vq : "maand") as "maand" | "week" | "dag";
  if (c.req.query("view")) c.header("Set-Cookie", `ff_agenda_view=${view}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`);
  const todayAms = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date());
  const anchor = c.req.query("date") || todayAms;
  const base = new Date(anchor + "T12:00:00Z").getTime();
  const events = await getEventsInRange(c.env, base - 45 * 86400000, base + 45 * 86400000);
  const editId = c.req.query("edit");
  const bewerk = editId ? await getEvent(c.env, editId) : undefined;
  return c.html(layout("Agenda", "/agenda", agendaPage(view, anchor, events, canEditAgenda(roles), { showForm: c.req.query("new") != null, bewerk }), roles));
});

app.get("/agenda/event/:id", async (c) => {
  const roles = c.get("roles") ?? [];
  if (!isModuleOn(roles, "agenda")) return c.redirect("/");
  const e = await getEvent(c.env, c.req.param("id"));
  if (!e) return c.redirect("/agenda");
  // v205: RSVP-blok — alleen op (semi-)toekomstige events; defensief als de
  // tabel (migratie 0006) nog niet bestaat.
  const emailRsvp = await resolveAccessEmail(c, c.env);
  const toonRsvp = !!emailRsvp && e.end_at > Date.now() - 24 * 60 * 60 * 1000;
  const stand = toonRsvp ? await rsvpStand(c.env, e.id, emailRsvp).catch(() => null) : null;
  return c.html(layout(e.title, "/agenda", eventDetail(e, canEditAgenda(roles), stand), roles));
});

// v205: RSVP zetten — één tik, idempotent; terug naar het event.
app.post("/agenda/event/:id/rsvp", async (c) => {
  const email = await resolveAccessEmail(c, c.env);
  const id = c.req.param("id");
  if (!email) return c.redirect(`/agenda/event/${id}`);
  const form = await c.req.formData();
  const gaat = String(form.get("gaat") ?? "") === "ja";
  const me = await getPlayerByEmail(c.env, email);
  await zetRsvp(c.env, id, email, me?.naam ?? email, gaat).catch(() => { /* tabel mist (migratie 0006) */ });
  return c.redirect(`/agenda/event/${id}`);
});
app.post("/agenda", async (c) => {
  if (!canEditAgenda(c.get("roles") ?? [])) return c.redirect("/agenda");
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  const form = await c.req.formData();
  const ev = readEventForm(form);
  if (ev) {
    const nieuw = await createEvent(c.env, { ...ev, created_by: me?.id ?? "?" }, idemId(form.get("idem"), "e"));
    if (nieuw) c.executionCtx.waitUntil(agendaPush(c.env, ev, "/agenda")); // replay -> niet nogmaals pushen
  }
  return c.redirect(`/agenda?view=${form.get("view") ?? "maand"}&date=${form.get("date") ?? ""}`);
});
app.post("/agenda/:id/update", async (c) => {
  if (!canEditAgenda(c.get("roles") ?? [])) return c.redirect("/agenda");
  const form = await c.req.formData();
  const ev = readEventForm(form);
  const id = c.req.param("id");
  if (ev) {
    await updateEvent(c.env, id, ev);
    c.executionCtx.waitUntil(agendaPush(c.env, ev, "/agenda/event/" + id));
  }
  return c.redirect(`/agenda?view=${form.get("view") ?? "maand"}&date=${form.get("date") ?? ""}`);
});
// ---- "Wie is er vandaag" (spoor B2, v185): Buddee-afwezigheid + eigen dagstatus ----
app.get("/vandaag", async (c) => {
  const roles = c.get("roles") ?? [];
  if (!isModuleOn(roles, "team")) return c.redirect("/");
  const email = ((await resolveAccessEmail(c, c.env)) ?? "").toLowerCase();
  const { rijen } = await wieIsErVandaag(c.env);
  const mijn = rijen.find((r) => r.email.toLowerCase() === email)?.status ?? null;
  const datumLabel = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const ok = c.req.query("ok");
  return c.html(layout("Vandaag", "/smoelenboek", vandaagPage(datumLabel, rijen, { status: mijn }, { melding: ok || undefined }), roles));
});
app.post("/vandaag", async (c) => {
  const email = await resolveAccessEmail(c, c.env);
  if (!email) return c.redirect("/vandaag");
  const form = await c.req.formData();
  const status = String(form.get("status") ?? "");
  if (status === "" || isAanwStatus(status)) {
    const me = medewerkerVoorEmail(email, await getMedewerkers(c.env));
    await zetStatus(c.env, email, me?.fields.Naam ? String(me.fields.Naam) : email, status === "" ? "" : status);
  }
  // v204: vanaf home (one-tap-vraag) terug naar home; ?ok= laat de SW-cache
  // overslaan zodat je de vraag direct ziet verdwijnen.
  if (String(form.get("terug") ?? "") === "/") return c.redirect("/?ok=status");
  return c.redirect("/vandaag?ok=" + encodeURIComponent(status ? "Status doorgegeven" : "Status gewist"));
});

app.post("/agenda/verlof/sync", async (c) => {
  if (!canEditAgenda(c.get("roles") ?? [])) return c.redirect("/agenda?view=verlof");
  try { await syncVerlof(c.env); } catch (e) { console.error("Buddee-verlofsync (handmatig) faalde:", e); }
  return c.redirect("/agenda?view=verlof");
});
app.post("/agenda/:id/delete", async (c) => {
  if (!canEditAgenda(c.get("roles") ?? [])) return c.redirect("/agenda");
  const form = await c.req.formData();
  const eventId = c.req.param("id");
  await deleteEvent(c.env, eventId);
  // v203: cascade — notificaties van dit event bij ALLE ontvangers weg én uit de
  // kennisbank-index (kbev_<id>), zodat de assistent het niet meer opduikt
  // (melding PJ 12/6: "lollig" agendapunt bleef in notificaties + index hangen).
  // NB: een al afgeleverde push op het toestel zelf is technisch niet terug te
  // trekken; het notificatiecentrum en de index zijn wél direct schoon.
  c.executionCtx.waitUntil((async () => {
    try { await verwijderNotificatiesVoorUrl(c.env, `/agenda/event/${eventId}`); } catch { /* best effort */ }
    try { await removeKbDoc(c.env, "kbev_" + eventId); } catch { /* best effort */ }
  })());
  return c.redirect(`/agenda?view=${form.get("view") ?? "maand"}&date=${form.get("date") ?? ""}`);
});

// ---- Kantine (Friet/Vis) ----
app.get("/friet", async (c) => {
  if (!isModuleOn(c.get("roles") ?? [], "kantine")) return c.redirect("/");
  const [menu, open] = await Promise.all([getActiveMenu(c.env), getFlag(c.env, "bestellijst_open", true)]);
  return c.html(layout("Bestellen", "/friet", frietBestel(menu, open), c.get("roles") ?? []));
});
app.post("/friet/order", async (c) => {
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  if (!me) return c.redirect("/friet");
  if (!(await getFlag(c.env, "bestellijst_open", true))) return c.redirect("/friet");
  const form = await c.req.formData();
  const menu = await getActiveMenu(c.env);
  const items = menu
    .map((m) => ({ name: m.name, qty: parseInt(String(form.get(`qty_${m.id}`) ?? "0"), 10) || 0, price: m.price_cents }))
    .filter((i) => i.qty > 0);
  if (items.length) await addOrder(c.env, me.id, items, me.id, idemId(form.get("idem"), "sl"));
  return c.redirect("/friet/saldo?ok=1");
});
app.get("/friet/saldo", async (c) => {
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  const roles = c.get("roles") ?? [];
  if (!me) return c.redirect("/mijn-account");
  const [saldo, ledger] = await Promise.all([getBalance(c.env, me.id), getLedger(c.env, me.id)]);
  return c.html(layout("Mijn saldo", "/friet/saldo", mijnSaldo(saldo, ledger), roles));
});

app.get("/friet/beheer", async (c) => {
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  if (!isKantineBeheerder(me)) return c.html(layout("Geen toegang", "/friet", geenToegang(), c.get("roles") ?? []), 403);
  const todayAms = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date());
  const since = Date.parse(amsterdamLocalToUtcIso(todayAms + "T00:00"));
  const [balances, menu, open, orders] = await Promise.all([
    allBalances(c.env), getAllMenu(c.env), getFlag(c.env, "bestellijst_open", true), ordersSince(c.env, since),
  ]);
  return c.html(layout("Kantine-beheer", "/friet/beheer", frietBeheer(balances, menu, open, orders), c.get("roles") ?? []));
});

app.post("/friet/beheer/bestellijst", async (c) => {
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  if (!isKantineBeheerder(me)) return c.html(layout("Geen toegang", "/friet", geenToegang(), c.get("roles") ?? []), 403);
  const aan = String((await c.req.formData()).get("open") ?? "") === "1";
  await setFlag(c.env, "bestellijst_open", aan);
  return c.redirect("/friet/beheer");
});
app.post("/friet/beheer/topup", async (c) => {
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  if (!isKantineBeheerder(me)) return c.redirect("/friet");
  const form = await c.req.formData();
  const pid = String(form.get("player_id") ?? "");
  const cents = Math.round(parseFloat(String(form.get("euro") ?? "0")) * 100);
  if (pid && cents > 0 && me) await addTopup(c.env, pid, cents, me.id);
  return c.redirect("/friet/beheer");
});
app.post("/friet/beheer/setbalance", async (c) => {
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  if (!isKantineBeheerder(me)) return c.redirect("/friet");
  const form = await c.req.formData();
  const pid = String(form.get("player_id") ?? "");
  const cents = Math.round(parseFloat(String(form.get("euro") ?? "")) * 100);
  if (pid && me && Number.isFinite(cents)) await setBalance(c.env, pid, cents, me.id);
  return c.redirect("/friet/beheer");
});
app.post("/friet/beheer/settle", async (c) => {
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  if (!isKantineBeheerder(me)) return c.redirect("/friet");
  const pid = String((await c.req.formData()).get("player_id") ?? "");
  if (pid && me) await settle(c.env, pid, me.id);
  return c.redirect("/friet/beheer");
});
app.post("/friet/beheer/menu", async (c) => {
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  if (!isKantineBeheerder(me)) return c.redirect("/friet");
  const form = await c.req.formData();
  const name = String(form.get("name") ?? "").trim();
  const cents = Math.round(parseFloat(String(form.get("euro") ?? "0")) * 100);
  if (name && cents > 0) await addMenuItem(c.env, name, cents);
  return c.redirect("/friet/beheer");
});
app.post("/friet/beheer/menu/update", async (c) => {
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  if (!isKantineBeheerder(me)) return c.redirect("/friet");
  const form = await c.req.formData();
  const id = String(form.get("id") ?? "");
  const cents = Math.round(parseFloat(String(form.get("euro") ?? "0")) * 100);
  if (id && cents > 0) await updateMenuItem(c.env, id, cents, form.get("active") != null);
  return c.redirect("/friet/beheer");
});
// Bulk-opslaan: de hele menulijst in één keer (alleen gewijzigde regels schrijven).
app.post("/friet/beheer/menu/bulk", async (c) => {
  const me = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  if (!isKantineBeheerder(me)) return c.redirect("/friet");
  const form = await c.req.formData();
  const items = await getAllMenu(c.env);
  for (const m of items) {
    const raw = form.get(`euro_${m.id}`);
    if (raw == null) continue; // stond niet in het formulier
    const cents = Math.round(parseFloat(String(raw)) * 100);
    const actief = form.get(`active_${m.id}`) != null;
    if (!Number.isFinite(cents) || cents <= 0) continue;
    if (cents !== m.price_cents || actief !== !!m.active) await updateMenuItem(c.env, m.id, cents, actief);
  }
  return c.redirect("/friet/beheer");
});

// ---- Mijn account ----
app.get("/mijn-account", async (c) => {
  const email = await resolveAccessEmail(c, c.env);
  const p = await getPlayerByEmail(c.env, email);
  const roles = c.get("roles") ?? [];
  if (!p) return c.html(layout("Mijn account", "/mijn-account", geenSpeler(), roles));
  const [prefs, saldo] = await Promise.all([getVoicePrefs(c.env, p.id), getBalance(c.env, p.id)]);
  const spellen: [GameType, string][] = [["darts", "Darten"], ["draughts", "Dammen"], ["pingpong", "Pingpong"]];
  const comp = await Promise.all(
    spellen.map(async ([g, label]) => {
      const [r, nem] = await Promise.all([getRating(c.env, p.id, g), getNemesis(c.env, p.id, g)]);
      return { game: g as string, label, elo: r.elo, wins: r.wins, losses: r.losses, nemesis: nem ? `${nem.naam} (${nem.losses}×)` : undefined };
    }),
  );
  const melding = c.req.query("ok") ? "Opgeslagen." : undefined;
  const accMods = { competitie: isModuleOn(roles, "competitie"), kantine: isModuleOn(roles, "kantine") };
  return c.html(layout("Mijn account", "/mijn-account", mijnAccountPage(p, prefs, saldo, comp, accMods, { melding }), roles));
});
app.post("/mijn-account", async (c) => {
  const p = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  if (!p) return c.redirect("/mijn-account");
  const form = await c.req.formData();
  const nickname = String(form.get("nickname") ?? "").trim().slice(0, 24) || undefined;
  const intro = parseSpotify(String(form.get("intro") ?? ""));
  const showBirthday = form.get("verjaardag_zichtbaar") != null;
  await updateProfile(c.env, p.id, nickname, intro, showBirthday);
  return c.redirect("/mijn-account?ok=1");
});
app.post("/mijn-account/voice", async (c) => {
  const p = await getPlayerByEmail(c.env, await resolveAccessEmail(c, c.env));
  if (!p) return c.redirect("/mijn-account");
  const form = await c.req.formData();
  await setVoicePref(c.env, p.id, "darts", form.get("darts") != null);
  await setVoicePref(c.env, p.id, "draughts", form.get("draughts") != null);
  return c.redirect("/mijn-account?ok=1");
});

// ---- Pushmeldingen ----
// Server-naar-server: een andere Worker stuurt een push naar één persoon.
// Beveiligd met een bearer-sleutel (PUSH_API_KEY). Body: { email, title, body?, url? }.
app.post("/api/push", async (c) => {
  if (!pushAuthOk(c)) return c.json({ ok: false, error: "unauthorized" }, 401);
  const body = await c.req
    .json<{
      to?: string;
      email?: string;
      naam?: string;
      voor?: string;
      title?: string;
      body?: string;
      message?: string;
      url?: string;
    }>()
    .catch(() => null);
  const email = await resolveEmail(
    c.env,
    body?.to || body?.email || body?.naam || body?.voor,
  );
  if (!body || !email) {
    return c.json({ ok: false, error: "ontvanger (to) niet gevonden" }, 400);
  }
  const sent = await pushNaarEmail(c.env, email, {
    title: body.title || "Melding",
    body: body.body || body.message || "",
    url: body.url || "/",
  });
  return c.json({ ok: true, sent, matched: email });
});

// Kant-en-klaar voor de bezoeker-aanmelding: meld de collega dat er bezoek is.
// Body: { voor: "<naam of e-mail van de collega>", bezoeker: "<naam>", bedrijf?: "<bedrijf>" }
app.post("/api/bezoek-melding", async (c) => {
  if (!pushAuthOk(c)) return c.json({ ok: false, error: "unauthorized" }, 401);
  const body = await c.req
    .json<{ voor?: string; bezoeker?: string; bedrijf?: string; url?: string }>()
    .catch(() => null);
  if (!body || !body.voor || !body.bezoeker) {
    return c.json({ ok: false, error: "voor en bezoeker zijn vereist" }, 400);
  }
  const email = await resolveEmail(c.env, body.voor);
  if (!email) {
    return c.json({ ok: false, error: "collega niet gevonden", matched: null }, 404);
  }
  const tekst = `${body.bezoeker}${body.bedrijf ? ` van ${body.bedrijf}` : ""} is bij de receptie.`;
  const sent = await pushNaarEmail(c.env, email, {
    title: "Je hebt bezoek",
    body: tekst,
    url: body.url || "/",
  });
  return c.json({ ok: true, sent, matched: email });
});

app.post("/push/subscribe", async (c) => {
  const body = await c.req
    .json<{ endpoint?: string; p256dh?: string; auth?: string }>()
    .catch(() => null);
  if (!body || !body.endpoint || !body.p256dh || !body.auth) return c.json({ ok: false }, 400);
  const email = await resolveAccessEmail(c, c.env);
  await upsertPushAbonnement(c.env, email, body.endpoint, body.p256dh, body.auth);
  return c.json({ ok: true });
});

app.post("/push/unsubscribe", async (c) => {
  const body = await c.req.json<{ endpoint?: string }>().catch(() => null);
  // Alleen het eigen (of een anoniem) abonnement — zie deletePushByEndpoint.
  if (body?.endpoint) await deletePushByEndpoint(c.env, body.endpoint, (await resolveAccessEmail(c, c.env)) ?? null);
  return c.json({ ok: true });
});

app.get("/beheer/push", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const aantal = (await getPushAbonnementen(c.env)).length;
  const flags = await getFlags(c.env, PUSH_FEATURES.map((f) => f.key));
  const melding = c.req.query("ok") ? "Pushmelding verstuurd." : c.req.query("saved") ? "Push-instellingen opgeslagen." : undefined;
  const fout = c.req.query("fout")
    ? "Versturen lukte niet of er waren geen aanmeldingen (staan de VAPID-sleutels ingesteld?)."
    : undefined;
  return c.html(layout("Pushmelding", "/", beheerPush(aantal, flags, { melding, fout }), c.get("roles") ?? []));
});

app.post("/beheer/push", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const form = await c.req.formData();
  const titel = String(form.get("titel") ?? "").trim();
  const bericht = String(form.get("bericht") ?? "").trim();
  if (!titel || !bericht) return c.redirect("/beheer/push?fout=1");
  c.executionCtx.waitUntil(pushNaarIedereen(c.env, { title: titel, body: bericht, url: "/" }));
  return c.redirect("/beheer/push?ok=1");
});

app.post("/beheer/push/instellingen", async (c) => {
  const medewerkers = await getMedewerkers(c.env);
  if (!(await magBeheren(c, medewerkers))) {
    return c.html(layout("Geen toegang", "/", geenToegang(), c.get("roles") ?? []), 403);
  }
  const form = await c.req.formData();
  for (const f of PUSH_FEATURES) await setFlag(c.env, f.key, form.get(f.key) != null);
  return c.redirect("/beheer/push?saved=1");
});

/* ===========================================================================
   KLANTENPORTAAL  (/portaal/*)  - volledig gescheiden van het interne deel.
   Eigen magic-link login; checkt Cloudflare Access NIET en geeft geen interne
   rechten. Sessiecookie is gescoped op /portaal. Taal per klant (veld "Taal"),
   met de browsertaal als terugval. Bij go-live: in Cloudflare Access een
   Bypass-policy voor /portaal* zetten zodat klanten erbij kunnen.
   =========================================================================== */

// Geverifieerd e-mailadres uit de portaal-sessiecookie (of undefined).
async function portalSessie(c: Context): Promise<string | undefined> {
  const secret = c.env.PORTAL_SECRET;
  if (!secret) return undefined;
  const cookie = readSessionCookie(c.req.header("cookie"));
  if (!cookie) return undefined;
  return (await verifySessionToken(cookie, secret)) ?? undefined;
}

async function eisPortal(c: Context): Promise<string | null> {
  return (await portalSessie(c)) ?? null;
}

// Taal: vaste keuze + browsertaal-terugval. (Pre-login alleen browsertaal,
// zodat we niet verklappen of een e-mailadres bekend is.)
function strings(taal: string | undefined, c: Context) {
  return getStrings(pickLang(taal, c.req.header("accept-language")));
}

// Strings voor een ingelogde klant: op basis van zijn voorkeurstaal.
async function stringsVoorKlant(c: Context, email: string) {
  let taal: string | undefined;
  try {
    taal = (await getKlantByEmail(c.env, email))?.fields.Taal;
  } catch {
    /* taal is optioneel */
  }
  return strings(taal, c);
}

app.get("/portaal", async (c) => {
  const email = await portalSessie(c);
  if (!email) return c.redirect("/portaal/login");
  let klant;
  try {
    klant = await getKlantByEmail(c.env, email);
  } catch {
    /* optioneel */
  }
  const t = strings(klant?.fields.Taal, c);
  const naam = klant?.fields.Naam ?? "";
  return c.html(
    portalLayout(t, "/portaal", "", portalDashboard(t, naam), { ingelogd: true }),
  );
});

app.post("/portaal/ask", async (c) => {
  const email = await portalSessie(c);
  if (!email) return c.json({ error: "geen-sessie" }, 401);
  const body = (await c.req.json().catch(() => ({}))) as { question?: string };
  const question = String(body.question ?? "").slice(0, 500).trim();
  if (!question) return c.json({ error: "leeg" }, 400);
  const TALEN: Record<string, string> = { nl: "Nederlands", en: "Engels", de: "Duits", pl: "Pools", fr: "Frans", es: "Spaans" };
  let lang: string | undefined;
  try { const klant = await getKlantByEmail(c.env, email); const code = String(klant?.fields.Taal ?? "").toLowerCase(); lang = TALEN[code]; } catch { /* taal optioneel */ }
  const res = await kbAsk(c.env, question, { audiences: ["public", "grower"], lang });
  c.executionCtx.waitUntil((async () => {
    try { if (c.env.DB) await c.env.DB.prepare("INSERT INTO ask_log (id, user_ref, question, answered, source_ids, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind("al" + crypto.randomUUID().replace(/-/g, ""), "portal", question, res.answered ? 1 : 0, JSON.stringify((res.sources ?? []).map((x) => x.title)), Date.now()).run(); } catch { /* log */ }
  })());
  return c.json(res);
});

app.get("/portaal/login", async (c) => {
  if (await portalSessie(c)) return c.redirect("/portaal");
  const t = strings(undefined, c);
  const fout = c.req.query("verlopen") ? t.login.verlopen : undefined;
  return c.html(
    portalLayout(t, "/portaal/login", t.login.title, portalLogin(t, { fout })),
  );
});

app.post("/portaal/login", async (c) => {
  const t = strings(undefined, c); // pre-login: alleen browsertaal
  const email = String((await c.req.formData()).get("email") ?? "")
    .trim()
    .toLowerCase();
  const secret = c.env.PORTAL_SECRET;
  if (!secret) {
    return c.html(
      portalLayout(
        t,
        "/portaal/login",
        t.login.title,
        portalLogin(t, { fout: t.login.nietIngesteld }),
      ),
    );
  }
  let devLink: string | undefined;
  // Alleen actieve klanten krijgen een link. Antwoord is altijd hetzelfde
  // (geen e-mail-enumeratie: we verklappen niet of het adres bestaat).
  if (email) {
    try {
      const klant = await getKlantByEmail(c.env, email);
      if (klant) {
        // Rate limit (securityrapport): max 3 mails per kwartier per adres,
        // 10 per IP — tegen mail-spam/enumeratie. Respons blijft identiek.
        const ip = c.req.header("cf-connecting-ip");
        if (!rateLimit(limietKey("magic-mail", email, ip), 3, 15 * 60_000) || !rateLimit(limietKey("magic-ip", undefined, ip), 10, 15 * 60_000)) {
          return c.redirect("/portaal/login?sent=1");
        }
        const token = await createMagicToken(email, secret);
        const base = c.env.PORTAL_BASE_URL ?? new URL(c.req.url).origin;
        const link = `${base}/portaal/verify?token=${encodeURIComponent(token)}`;
        const res = await sendMagicLink(c.env, email, link);
        devLink = res.devLink;
        c.executionCtx.waitUntil(
          logEvent(c.env, { type: "portaal_login_aangevraagd", ref: email }),
        );
      }
    } catch (e) {
      console.error("portaal login faalde:", e);
    }
  }
  return c.html(
    portalLayout(t, "/portaal/login", t.sent.title, portalLoginSent(t, devLink)),
  );
});

app.get("/portaal/verify", async (c) => {
  const secret = c.env.PORTAL_SECRET;
  const token = c.req.query("token") ?? "";
  if (!secret || !token) return c.redirect("/portaal/login?verlopen=1");
  const email =
    (await verifyMagicToken(token, secret)) ?? (await verifyInviteToken(token, secret));
  if (!email) return c.redirect("/portaal/login?verlopen=1");
  // Dubbelcheck: klant nog steeds actief?
  const klant = await getKlantByEmail(c.env, email);
  if (!klant) return c.redirect("/portaal/login?verlopen=1");
  const sessie = await createSessionToken(email, secret);
  c.header("Set-Cookie", sessionCookie(sessie, SESSION_TTL));
  c.executionCtx.waitUntil(updateKlantLogin(c.env, klant.id).catch(() => {}));
  c.executionCtx.waitUntil(logEvent(c.env, { type: "portaal_login", ref: email }));
  return c.redirect("/portaal");
});

app.get("/portaal/logout", (c) => {
  c.header("Set-Cookie", clearSessionCookie());
  return c.redirect("/portaal/login");
});

app.get("/portaal/rassen", async (c) => {
  const email = await eisPortal(c);
  if (!email) return c.redirect("/portaal/login");
  const [rassen, t] = await Promise.all([getRassen(c.env), stringsVoorKlant(c, email)]);
  return c.html(
    portalLayout(t, "/portaal/rassen", t.rassen.title, portalRassen(t, rassen), {
      ingelogd: true,
    }),
  );
});

app.get("/portaal/teeltadvies", async (c) => {
  const email = await eisPortal(c);
  if (!email) return c.redirect("/portaal/login");
  const [adviezen, rassen, t] = await Promise.all([
    getTeeltadvies(c.env),
    getRassen(c.env),
    stringsVoorKlant(c, email),
  ]);
  const rasNaam = new Map(rassen.map((r) => [r.id, r.fields.Naam ?? ""]));
  return c.html(
    portalLayout(
      t,
      "/portaal/teeltadvies",
      t.teelt.title,
      portalTeeltadvies(t, adviezen, rasNaam),
      { ingelogd: true },
    ),
  );
});

app.get("/portaal/snoei-pluk", async (c) => {
  const email = await eisPortal(c);
  if (!email) return c.redirect("/portaal/login");
  const [items, rassen, t] = await Promise.all([
    getSnoeiPluk(c.env),
    getRassen(c.env),
    stringsVoorKlant(c, email),
  ]);
  const rasNaam = new Map(rassen.map((r) => [r.id, r.fields.Naam ?? ""]));
  return c.html(
    portalLayout(
      t,
      "/portaal/snoei-pluk",
      t.snoei.title,
      portalSnoeiPluk(t, items, rasNaam),
      { ingelogd: true },
    ),
  );
});

app.get("/portaal/documenten", async (c) => {
  const email = await eisPortal(c);
  if (!email) return c.redirect("/portaal/login");
  const [docs, t] = await Promise.all([
    getKlantdocumenten(c.env),
    stringsVoorKlant(c, email),
  ]);
  return c.html(
    portalLayout(t, "/portaal/documenten", t.docs.title, portalDocumenten(t, docs), {
      ingelogd: true,
    }),
  );
});

// Document-download/afbeeldingen voor klanten - alleen met geldige portaal-sessie
// ÉN alleen sleutels die bij gepubliceerde portaal-content horen (securityrapport
// §3.1): voorkomt dat een ingelogde klant interne of andermans bestanden ophaalt
// door een sleutel te raden.
app.get("/portaal/bestand", async (c) => {
  if (!(await eisPortal(c))) return c.redirect("/portaal/login");
  const key = c.req.query("k");
  if (!key || !c.env.DOCS) return c.notFound();
  if (!(await portaalKeyToegestaan(c.env, key))) return c.notFound();
  const obj = await c.env.DOCS.get(key);
  if (!obj) return c.notFound();
  return bestandResponse(obj, key);
});

app.notFound((c) =>
  c.html(layout("Niet gevonden", "/", errorPage("Pagina niet gevonden", "Deze pagina bestaat niet (meer). Misschien is er iets verplaatst."), c.get("roles") ?? []), 404),
);
app.onError((err, c) => {
  console.error("Onafgevangen fout:", err);
  return c.html(layout("Er ging iets mis", "/", errorPage("Er ging iets mis", "Er trad een onverwachte fout op. Probeer het opnieuw."), c.get("roles") ?? []), 500);
});

export default {
  fetch: app.fetch,
  // AVG: dagelijkse opschoning van oude bezoekmeldingen (opt-in via env).
  scheduled: async (_controller, env, ctx) => {
    // v204: ochtendtriggers (06:15/07:15 UTC = 08:15 Amsterdam in zomer/winter,
    // ma-vr) doen ALLEEN de statuspush; de nachttaken blijven bij de 03:00-run.
    const cronExpr = (_controller as { cron?: string } | undefined)?.cron ?? "";
    if (cronExpr === "15 6 * * 1-5" || cronExpr === "15 7 * * 1-5") {
      ctx.waitUntil(ochtendStatusPush(env).catch((e) => console.error("Ochtend-statuspush faalde:", e)));
      return;
    }
    if (env.AVG_CLEANUP_ENABLED === "true") {
      const dagen = Number(env.RETENTIE_DAGEN ?? "90") || 90;
      ctx.waitUntil(
        opschoonBezoekmeldingen(env, dagen)
          .then((n) =>
            console.log(`AVG-cleanup: ${n} bezoekmelding(en) verwijderd (>${dagen} dagen).`),
          )
          .catch((e) => console.error("AVG-cleanup faalde:", e)),
      );
      ctx.waitUntil(
        opschoonMeldingen(env, dagen)
          .then((n) => console.log(`AVG-cleanup: ${n} afgehandelde melding(en) verwijderd (>${dagen} dagen).`))
          .catch((e) => console.error("Meldingen-cleanup faalde:", e)),
      );
    }
    ctx.waitUntil(
      weekelijkseMeldingenPush(env).catch((e) => console.error("Meldingen-push faalde:", e)),
    );
    // Kennisbank dagelijks herindexeren (FAQ + portaal-teelt + nieuws + agenda) zodat nieuwe
    // content vanzelf vindbaar wordt. Draait alleen als de RAG-stack actief is.
    if (env.VECTORIZE && env.AI && env.DB) {
      ctx.waitUntil(
        kbReindex(env)
          .then((n) => console.log(`Kennisbank-herindex: ${n} stuk(ken) geïndexeerd.`))
          .catch((e) => console.error("Kennisbank-herindex faalde:", e)),
      );
    }
    if (env.BUDDEE_EMAIL && env.BUDDEE_PASSWORD) {
      ctx.waitUntil(
        syncVerlof(env)
          .then((r) => console.log(`Buddee-verlof gesynct: ${r.count} registratie(s).`))
          .catch((e) => console.error("Buddee-verlofsync faalde:", e)),
      );
    }
    // Notificatie-historie (4.2): ouder dan 90 dagen opruimen.
    if (env.DB) {
      ctx.waitUntil(purgeNotificaties(env).catch((e) => console.error("Notificatie-opschoning faalde:", e)));
    }
    // Aanwezigheid (v185, AVG): alleen de status van vandaag bewaren — geen historie.
    if (env.DB) {
      ctx.waitUntil(
        opschoonAanwezigheid(env)
          .then((n) => { if (n) console.log(`Aanwezigheid-opschoning: ${n} rij(en) gewist.`); })
          .catch((e) => console.error("Aanwezigheid-opschoning faalde:", e)),
      );
    }
    // Access-groep-sync (v187): dagelijkse zelfherstel-sync van de uitzendkracht-groep.
    if (accessSyncGeconfigureerd(env)) {
      ctx.waitUntil(
        syncAccessUitzendkrachten(env)
          .then((r) => console.log(`Access-sync uitzendkrachten: ${r.ok ? "ok" : "FOUT " + (r.error ?? "")} (${r.aantal} adres(sen)).`))
          .catch((e) => console.error("Access-sync uitzendkrachten faalde:", e)),
      );
    }
    // Globale zoekindex (4.1) dagelijks verversen.
    if (env.DB) {
      ctx.waitUntil(
        reindexZoek(env)
          .then((n) => console.log(`Zoekindex ververst: ${n} items.`))
          .catch((e) => console.error("Zoekindex-reindex faalde:", e)),
      );
    }
    // AVG: retentie voor interne logtabellen (stonden zonder einddatum).
    // events + audit_log: 12 maanden; vraagbaak-log + vertaalcache: 6 maanden.
    if (env.DB) {
      const d1r = env.DB;
      const jaar = Date.now() - 365 * 24 * 60 * 60 * 1000;
      const half = Date.now() - 180 * 24 * 60 * 60 * 1000;
      ctx.waitUntil(
        (async () => {
          await d1r.prepare("DELETE FROM events WHERE ts < ?").bind(new Date(jaar).toISOString()).run();
          await d1r.prepare("DELETE FROM audit_log WHERE created_at < ?").bind(jaar).run();
          await d1r.prepare("DELETE FROM ask_log WHERE created_at < ?").bind(half).run();
          await d1r.prepare("DELETE FROM vertaal_cache WHERE created_at < ?").bind(half).run();
        })()
          .then(() => console.log("AVG-retentie logtabellen gedraaid (12/6 mnd)."))
          .catch((e) => console.error("AVG-retentie logtabellen faalde:", e)),
      );
    }
    // Soft-deleted records (Stroom-plan 1.4) definitief opruimen na 30 dagen.
    if (env.DB) {
      const d1 = env.DB;
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      ctx.waitUntil(
        (async () => {
          // Expliciete queries (securityrapport): geen tabelnamen via samenvoeging.
          await d1.prepare("DELETE FROM poll_stemmen WHERE poll_id IN (SELECT id FROM polls WHERE deleted_at IS NOT NULL AND deleted_at < ?)").bind(cutoff).run();
          await d1.prepare("DELETE FROM posts WHERE deleted_at IS NOT NULL AND deleted_at < ?").bind(cutoff).run();
          await d1.prepare("DELETE FROM reacties WHERE deleted_at IS NOT NULL AND deleted_at < ?").bind(cutoff).run();
          await d1.prepare("DELETE FROM polls WHERE deleted_at IS NOT NULL AND deleted_at < ?").bind(cutoff).run();
          await d1.prepare("DELETE FROM agenda_events WHERE deleted_at IS NOT NULL AND deleted_at < ?").bind(cutoff).run();
          await d1.prepare("DELETE FROM matches WHERE deleted_at IS NOT NULL AND deleted_at < ?").bind(cutoff).run();
          // CRM (migratie 0018) — als laatste, zodat een ontbrekende migratie de rest niet blokkeert.
          await d1.prepare("DELETE FROM crm_contactpersonen WHERE deleted_at IS NOT NULL AND deleted_at < ?").bind(cutoff).run();
          await d1.prepare("DELETE FROM crm_contactmomenten WHERE deleted_at IS NOT NULL AND deleted_at < ?").bind(cutoff).run();
          await d1.prepare("DELETE FROM crm_taken WHERE deleted_at IS NOT NULL AND deleted_at < ?").bind(cutoff).run();
          await d1.prepare("DELETE FROM crm_deals WHERE deleted_at IS NOT NULL AND deleted_at < ?").bind(cutoff).run();
        })()
          .then(() => console.log("Soft-delete-opschoning gedraaid (>30 dagen)."))
          .catch((e) => console.error("Soft-delete-opschoning faalde:", e)),
      );
    }
  },
} satisfies ExportedHandler<Env>;
