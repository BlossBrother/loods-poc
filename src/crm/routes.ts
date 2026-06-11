// CRM-routes (ADR-001) — sub-app, gemonteerd op /crm in index.ts.
// Toegang: rol-token "crm" (team Concepts + beheerders), gezet in de
// identiteits-middleware van index.ts. De module-aan/uit-guard (mod:crm)
// loopt via PAD_MODULE in index.ts, net als bij de andere modules.
import { Hono } from "hono";
import { createInTabel, updateInTabel, type Env } from "../airtable";
import { layout } from "../views/layout";
import {
  crmDb, listKlantStats, getCrmKlant, klantNamen,
  listContacten, getContact, createContact, updateContact, deleteContact,
  listMomenten, createMoment,
  listTaken, createTaak, setTaakStatus,
  listDeals, getDeal, createDeal, updateDeal, deleteDeal,
  MOMENT_TYPES, DEAL_FASES, type MomentType, type DealFase,
} from "./data";
import { getAllPlayers, getPlayerById } from "../account";
import { canEditOrDelete } from "../ownership";
import { logAudit } from "../audit";
import {
  crmOverzicht, crmKlantkaart, crmTakenPagina, crmPipeline,
  crmContactForm, crmMomentForm, crmTaakForm, crmDealForm, crmKlantForm,
} from "../views/crm";

type Vars = { roles: string[]; playerId?: string; modules: string[] };
export const crmRoutes = new Hono<{ Bindings: Env; Variables: Vars }>();

/* ---------- helpers ---------- */

function vorm(f: FormData, k: string, max = 200): string {
  return String(f.get(k) ?? "").trim().slice(0, max);
}

// Datum-input (yyyy-mm-dd) -> ms; 12:00 om dag-verschuiving door tijdzones te voorkomen.
function dagMs(s: string): number | null {
  if (!s) return null;
  const t = Date.parse(`${s}T12:00:00`);
  return Number.isNaN(t) ? null : t;
}

function eurocenten(s: string): number | null {
  if (!s) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

async function klantOpties(h: ReturnType<typeof crmDb>): Promise<{ id: string; naam: string }[]> {
  const m = await klantNamen(h);
  return [...m].map(([id, naam]) => ({ id, naam })).sort((a, b) => a.naam.localeCompare(b.naam));
}

// Ownership (zelfde principe als de rest van de app): maker of beheerder/admin.
async function magMuteren(env: Env, roles: string[], me: string | undefined, createdBy?: string | null): Promise<boolean> {
  if (roles.includes("beheerder") || roles.includes("admin")) return true;
  const speler = me ? await getPlayerById(env, me) : undefined;
  return canEditOrDelete(speler, createdBy);
}

/* ---------- toegang ---------- */

crmRoutes.use("*", async (c, next) => {
  const roles = c.get("roles") ?? [];
  if (!roles.includes("crm")) {
    return c.req.method === "GET" ? c.redirect("/") : c.text("Geen toegang", 403);
  }
  return next();
});

/* ---------- overzicht + klantenkaart ---------- */

crmRoutes.get("/", async (c) => {
  const zoek = (c.req.query("q") ?? "").trim().slice(0, 80) || undefined;
  const stats = await listKlantStats(crmDb(c.env), zoek);
  const melding = c.req.query("ok") ? "Opgeslagen." : undefined;
  return c.html(layout("CRM", c.req.path, crmOverzicht(stats, { zoek, melding }), c.get("roles") ?? []));
});

// Klant aanmaken/bewerken — schrijft naar de gedeelde tabel `klanten` via dezelfde
// helper als Beheer → Klanten (createInTabel/updateInTabel), zodat portaal-toegang
// (e-mail + Actief) automatisch meeloopt. Vóór /klant/:id geregistreerd.
crmRoutes.get("/klant/nieuw", (c) => {
  return c.html(layout("Nieuwe klant", c.req.path, crmKlantForm(), c.get("roles") ?? []));
});

crmRoutes.post("/klant", async (c) => {
  const f = await c.req.formData();
  const naam = vorm(f, "naam", 120);
  if (!naam) return c.redirect("/crm/klant/nieuw");
  const rec = await createInTabel(c.env, "Klanten", {
    Naam: naam,
    Bedrijf: vorm(f, "bedrijf", 120) || undefined,
    "E-mail": vorm(f, "email", 160) || undefined,
    Taal: vorm(f, "taal", 5) || undefined,
    Actief: f.get("actief") != null,
    Notitie: vorm(f, "notitie", 1000) || undefined,
  });
  await logAudit(c.env, c.get("playerId"), "aangemaakt", "klant", rec.id);
  return c.redirect(`/crm/klant/${rec.id}?ok=1`);
});

crmRoutes.get("/klant/:id/bewerk", async (c) => {
  const klant = await getCrmKlant(crmDb(c.env), c.req.param("id"));
  if (!klant) return c.redirect("/crm");
  return c.html(layout("Klant bewerken", c.req.path, crmKlantForm(klant), c.get("roles") ?? []));
});

crmRoutes.post("/klant/:id/bewerk", async (c) => {
  const klant = await getCrmKlant(crmDb(c.env), c.req.param("id"));
  if (!klant) return c.redirect("/crm");
  const f = await c.req.formData();
  const naam = vorm(f, "naam", 120);
  if (!naam) return c.redirect(`/crm/klant/${klant.id}/bewerk`);
  await updateInTabel(c.env, "Klanten", klant.id, {
    Naam: naam,
    Bedrijf: vorm(f, "bedrijf", 120) || undefined,
    "E-mail": vorm(f, "email", 160) || undefined,
    Taal: vorm(f, "taal", 5) || undefined,
    Actief: f.get("actief") != null,
    Notitie: vorm(f, "notitie", 1000) || undefined,
  });
  await logAudit(c.env, c.get("playerId"), "bijgewerkt", "klant", klant.id);
  return c.redirect(`/crm/klant/${klant.id}?ok=1`);
});

crmRoutes.get("/klant/:id", async (c) => {
  const h = crmDb(c.env);
  const klant = await getCrmKlant(h, c.req.param("id"));
  if (!klant) return c.redirect("/crm");
  const [contacten, momenten, taken, deals] = await Promise.all([
    listContacten(h, klant.id),
    listMomenten(h, klant.id),
    listTaken(h, { status: "open", klantId: klant.id }),
    listDeals(h, klant.id),
  ]);
  const melding = c.req.query("ok") ? "Opgeslagen." : undefined;
  return c.html(layout(klant.naam, c.req.path, crmKlantkaart(klant, contacten, momenten, taken, deals, { melding }), c.get("roles") ?? []));
});

/* ---------- contactpersonen ---------- */

crmRoutes.get("/klant/:id/contact/nieuw", async (c) => {
  const klant = await getCrmKlant(crmDb(c.env), c.req.param("id"));
  if (!klant) return c.redirect("/crm");
  return c.html(layout("Contactpersoon", c.req.path, crmContactForm(klant.id, klant.naam), c.get("roles") ?? []));
});

crmRoutes.post("/klant/:id/contact", async (c) => {
  const h = crmDb(c.env);
  const klant = await getCrmKlant(h, c.req.param("id"));
  if (!klant) return c.redirect("/crm");
  const f = await c.req.formData();
  const naam = vorm(f, "naam", 120);
  if (!naam) return c.redirect(`/crm/klant/${klant.id}/contact/nieuw`);
  const id = await createContact(h, {
    klantId: klant.id,
    naam,
    functie: vorm(f, "functie", 120) || undefined,
    email: vorm(f, "email", 160) || undefined,
    telefoon: vorm(f, "telefoon", 40) || undefined,
    notitie: vorm(f, "notitie", 1000) || undefined,
    createdBy: c.get("playerId"),
  });
  await logAudit(c.env, c.get("playerId"), "aangemaakt", "crm_contactpersoon", id);
  return c.redirect(`/crm/klant/${klant.id}?ok=1`);
});

crmRoutes.get("/contact/:id/bewerk", async (c) => {
  const h = crmDb(c.env);
  const contact = await getContact(h, c.req.param("id"));
  if (!contact) return c.redirect("/crm");
  const klant = await getCrmKlant(h, contact.klant_id);
  return c.html(layout("Contactpersoon", c.req.path, crmContactForm(contact.klant_id, klant?.naam ?? "Klant", contact), c.get("roles") ?? []));
});

crmRoutes.post("/contact/:id", async (c) => {
  const h = crmDb(c.env);
  const contact = await getContact(h, c.req.param("id"));
  if (!contact) return c.redirect("/crm");
  if (!(await magMuteren(c.env, c.get("roles") ?? [], c.get("playerId"), contact.created_by))) return c.text("Geen rechten", 403);
  const f = await c.req.formData();
  const naam = vorm(f, "naam", 120);
  if (!naam) return c.redirect(`/crm/contact/${contact.id}/bewerk`);
  await updateContact(h, contact.id, {
    naam,
    functie: vorm(f, "functie", 120) || undefined,
    email: vorm(f, "email", 160) || undefined,
    telefoon: vorm(f, "telefoon", 40) || undefined,
    notitie: vorm(f, "notitie", 1000) || undefined,
  });
  await logAudit(c.env, c.get("playerId"), "bijgewerkt", "crm_contactpersoon", contact.id);
  return c.redirect(`/crm/klant/${contact.klant_id}?ok=1`);
});

crmRoutes.post("/contact/:id/verwijder", async (c) => {
  const h = crmDb(c.env);
  const contact = await getContact(h, c.req.param("id"));
  if (!contact) return c.redirect("/crm");
  if (!(await magMuteren(c.env, c.get("roles") ?? [], c.get("playerId"), contact.created_by))) return c.text("Geen rechten", 403);
  await deleteContact(h, contact.id);
  await logAudit(c.env, c.get("playerId"), "verwijderd", "crm_contactpersoon", contact.id);
  return c.redirect(`/crm/klant/${contact.klant_id}?ok=1`);
});

/* ---------- contactmomenten ---------- */

crmRoutes.get("/moment/nieuw", async (c) => {
  const klanten = await klantOpties(crmDb(c.env));
  const sel = c.req.query("klant") || undefined;
  return c.html(layout("Contactmoment", c.req.path, crmMomentForm(klanten, sel), c.get("roles") ?? []));
});

crmRoutes.post("/moment", async (c) => {
  const h = crmDb(c.env);
  const f = await c.req.formData();
  const klantId = vorm(f, "klant", 60);
  const notitie = vorm(f, "notitie", 2000);
  if (!klantId || !notitie) return c.redirect("/crm/moment/nieuw");
  const typeRaw = vorm(f, "type", 20);
  const type: MomentType = MOMENT_TYPES.some((t) => t.type === typeRaw) ? (typeRaw as MomentType) : "overig";
  const me = c.get("playerId");
  const speler = me ? await getPlayerById(c.env, me) : undefined;
  const id = await createMoment(h, {
    klantId,
    type,
    notitie,
    datum: dagMs(vorm(f, "datum", 12)) ?? Date.now(),
    createdBy: me,
    createdNaam: speler?.naam,
  });
  await logAudit(c.env, me, "aangemaakt", "crm_contactmoment", id);
  return c.redirect(`/crm/klant/${klantId}?ok=1`);
});

/* ---------- taken ---------- */

crmRoutes.get("/taken", async (c) => {
  const h = crmDb(c.env);
  const [open, klaar, namen] = await Promise.all([
    listTaken(h, { status: "open" }),
    listTaken(h, { status: "klaar", limit: 20 }),
    klantNamen(h),
  ]);
  const melding = c.req.query("ok") ? "Opgeslagen." : undefined;
  return c.html(layout("Taken", c.req.path, crmTakenPagina(open, klaar, namen, { melding }), c.get("roles") ?? []));
});

crmRoutes.get("/taak/nieuw", async (c) => {
  const [klanten, players] = await Promise.all([klantOpties(crmDb(c.env)), getAllPlayers(c.env)]);
  return c.html(layout("Nieuwe taak", c.req.path, crmTaakForm(klanten, players, { selKlant: c.req.query("klant") || undefined, meId: c.get("playerId") }), c.get("roles") ?? []));
});

crmRoutes.post("/taak", async (c) => {
  const h = crmDb(c.env);
  const f = await c.req.formData();
  const titel = vorm(f, "titel", 160);
  if (!titel) return c.redirect("/crm/taak/nieuw");
  const eigenaarId = vorm(f, "eigenaar", 60) || undefined;
  const eigenaar = eigenaarId ? await getPlayerById(c.env, eigenaarId) : undefined;
  const klantId = vorm(f, "klant", 60) || undefined;
  const id = await createTaak(h, {
    klantId,
    titel,
    omschrijving: vorm(f, "omschrijving", 1000) || undefined,
    deadline: dagMs(vorm(f, "deadline", 12)),
    eigenaarId,
    eigenaarNaam: eigenaar?.naam,
    createdBy: c.get("playerId"),
  });
  await logAudit(c.env, c.get("playerId"), "aangemaakt", "crm_taak", id);
  return c.redirect(klantId ? `/crm/klant/${klantId}?ok=1` : "/crm/taken?ok=1");
});

crmRoutes.post("/taak/:id/status", async (c) => {
  const f = await c.req.formData();
  const status = vorm(f, "status", 10) === "klaar" ? "klaar" : "open";
  await setTaakStatus(crmDb(c.env), c.req.param("id"), status);
  await logAudit(c.env, c.get("playerId"), status === "klaar" ? "afgerond" : "heropend", "crm_taak", c.req.param("id"));
  const terug = vorm(f, "terug", 120);
  return c.redirect(terug.startsWith("/crm") ? `${terug}?ok=1` : "/crm/taken?ok=1");
});

/* ---------- pipeline / deals ---------- */

crmRoutes.get("/pipeline", async (c) => {
  const h = crmDb(c.env);
  const [deals, namen] = await Promise.all([listDeals(h), klantNamen(h)]);
  const melding = c.req.query("ok") ? "Opgeslagen." : undefined;
  return c.html(layout("Pipeline", c.req.path, crmPipeline(deals, namen, { melding }), c.get("roles") ?? []));
});

crmRoutes.get("/deal/nieuw", async (c) => {
  const [klanten, players] = await Promise.all([klantOpties(crmDb(c.env)), getAllPlayers(c.env)]);
  return c.html(layout("Nieuwe deal", c.req.path, crmDealForm(klanten, players, { selKlant: c.req.query("klant") || undefined, meId: c.get("playerId") }), c.get("roles") ?? []));
});

crmRoutes.post("/deal", async (c) => {
  const h = crmDb(c.env);
  const f = await c.req.formData();
  const titel = vorm(f, "titel", 160);
  const klantId = vorm(f, "klant", 60);
  if (!titel || !klantId) return c.redirect("/crm/deal/nieuw");
  const faseRaw = vorm(f, "fase", 20);
  const fase: DealFase = DEAL_FASES.some((x) => x.fase === faseRaw) ? (faseRaw as DealFase) : "lead";
  const eigenaarId = vorm(f, "eigenaar", 60) || undefined;
  const eigenaar = eigenaarId ? await getPlayerById(c.env, eigenaarId) : undefined;
  const id = await createDeal(h, {
    klantId,
    titel,
    waardeCents: eurocenten(vorm(f, "waarde", 20)),
    fase,
    notitie: vorm(f, "notitie", 2000) || undefined,
    eigenaarId,
    eigenaarNaam: eigenaar?.naam,
    createdBy: c.get("playerId"),
  });
  await logAudit(c.env, c.get("playerId"), "aangemaakt", "crm_deal", id);
  return c.redirect("/crm/pipeline?ok=1");
});

crmRoutes.get("/deal/:id", async (c) => {
  const h = crmDb(c.env);
  const deal = await getDeal(h, c.req.param("id"));
  if (!deal) return c.redirect("/crm/pipeline");
  const [klanten, players] = await Promise.all([klantOpties(h), getAllPlayers(c.env)]);
  return c.html(layout("Deal", c.req.path, crmDealForm(klanten, players, { deal }), c.get("roles") ?? []));
});

crmRoutes.post("/deal/:id", async (c) => {
  const h = crmDb(c.env);
  const deal = await getDeal(h, c.req.param("id"));
  if (!deal) return c.redirect("/crm/pipeline");
  if (!(await magMuteren(c.env, c.get("roles") ?? [], c.get("playerId"), deal.created_by))) return c.text("Geen rechten", 403);
  const f = await c.req.formData();
  const titel = vorm(f, "titel", 160);
  if (!titel) return c.redirect(`/crm/deal/${deal.id}`);
  const faseRaw = vorm(f, "fase", 20);
  const fase: DealFase = DEAL_FASES.some((x) => x.fase === faseRaw) ? (faseRaw as DealFase) : deal.fase;
  const eigenaarId = vorm(f, "eigenaar", 60) || undefined;
  const eigenaar = eigenaarId ? await getPlayerById(c.env, eigenaarId) : undefined;
  await updateDeal(h, deal.id, {
    titel,
    waardeCents: eurocenten(vorm(f, "waarde", 20)),
    fase,
    notitie: vorm(f, "notitie", 2000) || undefined,
    eigenaarId,
    eigenaarNaam: eigenaar?.naam,
  });
  await logAudit(c.env, c.get("playerId"), "bijgewerkt", "crm_deal", deal.id);
  return c.redirect("/crm/pipeline?ok=1");
});

crmRoutes.post("/deal/:id/verwijder", async (c) => {
  const h = crmDb(c.env);
  const deal = await getDeal(h, c.req.param("id"));
  if (!deal) return c.redirect("/crm/pipeline");
  if (!(await magMuteren(c.env, c.get("roles") ?? [], c.get("playerId"), deal.created_by))) return c.text("Geen rechten", 403);
  await deleteDeal(h, deal.id);
  await logAudit(c.env, c.get("playerId"), "verwijderd", "crm_deal", deal.id);
  return c.redirect("/crm/pipeline?ok=1");
});
