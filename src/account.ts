// Mijn Account: speler = medewerker (gekoppeld op Access-email).
// Rollen ('admin','pv') en per-spel voice-voorkeuren.
import type { Env } from "./airtable";

export interface Player {
  id: string;
  naam: string;
  email: string;
  nickname?: string;
  introTune?: string; // spotify track-id (22 tekens)
  roles: string[];
  rol?: string;
  fotoKey?: string;
  functie?: string;
  afdeling?: string; // o.a. CRM-toegang (team Concepts), zie index.ts-middleware
  showBirthday: boolean;
}

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1-database (DB) niet geconfigureerd.");
  return env.DB;
}

export function hasRole(p: Player | undefined, role: string): boolean {
  return !!p && p.roles.includes(role);
}
export function isAdmin(p: Player | undefined): boolean {
  return hasRole(p, "admin");
}
export function isPv(p: Player | undefined): boolean {
  return hasRole(p, "pv");
}
// Kantine-beheer (v188): eigen extra-rol 'kantine' — bestellijst/saldo's/menu,
// zonder de brede 'admin'-rechten (agenda/CRM). 'admin' houdt het ook.
export function isKantineBeheerder(p: Player | undefined): boolean {
  return hasRole(p, "kantine") || isAdmin(p);
}

// Extra-rol (kolom roles, komma-lijst: admin/pv/kantine) aan- of uitzetten zonder
// de overige tokens te raken. Gebruikt door Beheer → Medewerkers (v188).
export async function setExtraRole(env: Env, id: string, role: string, on: boolean): Promise<void> {
  const r = await db(env).prepare("SELECT roles FROM medewerkers WHERE id=?").bind(id).first<{ roles: string }>();
  const set = new Set(String(r?.roles ?? "").split(",").map((x) => x.trim()).filter(Boolean));
  if (on) set.add(role); else set.delete(role);
  await db(env).prepare("UPDATE medewerkers SET roles=? WHERE id=?").bind([...set].join(","), id).run();
}

function toPlayer(r: Record<string, unknown>): Player {
  const roles = String(r.roles ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  return {
    id: String(r.id),
    naam: String(r.naam ?? ""),
    email: String(r.email ?? ""),
    nickname: r.nickname ? String(r.nickname) : undefined,
    introTune: r.intro_tune ? String(r.intro_tune) : undefined,
    roles,
    rol: r.rol ? String(r.rol) : undefined,
    fotoKey: r.foto_key ? String(r.foto_key) : undefined,
    functie: r.functie ? String(r.functie) : undefined,
    afdeling: r.afdeling ? String(r.afdeling) : undefined,
    showBirthday: r.verjaardag_zichtbaar == null ? true : !!r.verjaardag_zichtbaar,
  };
}

const COLS = "id,naam,email,nickname,intro_tune,roles,foto_key,functie,rol,afdeling,verjaardag_zichtbaar";

export async function getPlayerByEmail(env: Env, email?: string | null): Promise<Player | undefined> {
  if (!email) return undefined;
  const r = await db(env)
    .prepare(`SELECT ${COLS} FROM medewerkers WHERE lower(email)=lower(?) LIMIT 1`)
    .bind(email)
    .first<Record<string, unknown>>();
  return r ? toPlayer(r) : undefined;
}

export async function getPlayerById(env: Env, id: string): Promise<Player | undefined> {
  const r = await db(env)
    .prepare(`SELECT ${COLS} FROM medewerkers WHERE id=? LIMIT 1`)
    .bind(id)
    .first<Record<string, unknown>>();
  return r ? toPlayer(r) : undefined;
}

export async function getAllPlayers(env: Env): Promise<Player[]> {
  const r = await db(env)
    .prepare(`SELECT ${COLS} FROM medewerkers WHERE actief=1 ORDER BY naam COLLATE NOCASE ASC`)
    .all<Record<string, unknown>>();
  return (r.results ?? []).map(toPlayer);
}

// Toont nickname als die er is, anders de naam.
export function speelnaam(p: Pick<Player, "naam" | "nickname">): string {
  return p.nickname || p.naam;
}

export async function updateProfile(
  env: Env,
  id: string,
  nickname: string | undefined,
  introTune: string | undefined,
  showBirthday: boolean,
): Promise<void> {
  await db(env)
    .prepare("UPDATE medewerkers SET nickname=?, intro_tune=?, verjaardag_zichtbaar=? WHERE id=?")
    .bind(nickname || null, introTune || null, showBirthday ? 1 : 0, id)
    .run();
}

// Spotify-link -> track-id (22 tekens). Accepteert open.spotify.com-link of spotify:track:.
export function parseSpotify(input: string): string | undefined {
  const m = input.match(/track[/:]([A-Za-z0-9]{22})/);
  if (m) return m[1];
  if (/^[A-Za-z0-9]{22}$/.test(input.trim())) return input.trim();
  return undefined;
}

export async function getVoicePrefs(env: Env, playerId: string): Promise<Record<string, boolean>> {
  const r = await db(env)
    .prepare("SELECT game_type, voice_calls FROM player_game_prefs WHERE player_id=?")
    .bind(playerId)
    .all<{ game_type: string; voice_calls: number }>();
  const out: Record<string, boolean> = { darts: true, draughts: true, pingpong: true };
  for (const row of r.results ?? []) out[row.game_type] = !!row.voice_calls;
  return out;
}

export async function setVoicePref(
  env: Env,
  playerId: string,
  gameType: string,
  voiceCalls: boolean,
): Promise<void> {
  await db(env)
    .prepare(
      `INSERT INTO player_game_prefs (player_id, game_type, voice_calls) VALUES (?, ?, ?)
       ON CONFLICT(player_id, game_type) DO UPDATE SET voice_calls=excluded.voice_calls`,
    )
    .bind(playerId, gameType, voiceCalls ? 1 : 0)
    .run();
}
