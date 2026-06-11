// Competitie per spel (darts/draughts) op ELO-basis. Eén model, game_type stuurt alles.
import type { Env } from "./airtable";

export type GameType = "darts" | "draughts" | "pingpong";
export const GAMES: { type: GameType; label: string }[] = [
  { type: "darts", label: "Darten" },
  { type: "draughts", label: "Dammen" },
  { type: "pingpong", label: "Pingpong" },
];
export function gameLabel(t: string): string {
  return GAMES.find((g) => g.type === t)?.label ?? t;
}

function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1-database (DB) niet geconfigureerd.");
  return env.DB;
}
function uid(): string {
  return "m" + crypto.randomUUID().replace(/-/g, "");
}
const K = 32;
function expected(a: number, b: number): number {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

export interface Rating { player_id: string; elo: number; wins: number; losses: number; naam?: string; nickname?: string; }

export async function getRating(env: Env, playerId: string, game: GameType): Promise<Rating> {
  const r = await db(env)
    .prepare("SELECT player_id, elo, wins, losses FROM ratings WHERE player_id=? AND game_type=?")
    .bind(playerId, game)
    .first<Rating>();
  return r ?? { player_id: playerId, elo: 1000, wins: 0, losses: 0 };
}

export async function getRanking(env: Env, game: GameType): Promise<Rating[]> {
  const r = await db(env)
    .prepare(
      `SELECT r.player_id, r.elo, r.wins, r.losses, m.naam, m.nickname
       FROM ratings r JOIN medewerkers m ON m.id = r.player_id
       WHERE r.game_type=? ORDER BY r.elo DESC, r.wins DESC`,
    )
    .bind(game)
    .all<Rating>();
  return r.results ?? [];
}

export interface MatchRow {
  id: string; game_type: string; player_a: string; player_b: string; winner: string;
  score_a: number | null; score_b: number | null;
  elo_a_after: number | null; elo_b_after: number | null;
  tournament_id: string | null; played_at: number;
  naam_a?: string; naam_b?: string;
}

export async function listMatches(env: Env, game: GameType, limit = 20): Promise<MatchRow[]> {
  const r = await db(env)
    .prepare(
      `SELECT x.*, a.naam AS naam_a, b.naam AS naam_b
       FROM matches x JOIN medewerkers a ON a.id=x.player_a JOIN medewerkers b ON b.id=x.player_b
       WHERE x.game_type=? AND x.deleted_at IS NULL ORDER BY x.played_at DESC LIMIT ?`,
    )
    .bind(game, limit)
    .all<MatchRow>();
  return r.results ?? [];
}

// Speelt een pot af: berekent ELO, schrijft match + werkt ratings bij.
// Idempotent (1.1): optioneel client-id; bij een replay (zelfde id) no-opt de INSERT
// en worden de ratings NIET nogmaals bijgewerkt — dubbel tikken kost geen dubbele ELO.
export async function recordMatch(
  env: Env,
  game: GameType,
  playerA: string,
  playerB: string,
  winner: string,
  scoreA: number | null,
  scoreB: number | null,
  tournamentId: string | null = null,
  id?: string | null,
): Promise<void> {
  const ra = await getRating(env, playerA, game);
  const rb = await getRating(env, playerB, game);
  const eA = expected(ra.elo, rb.elo);
  const sA = winner === playerA ? 1 : 0;
  const eloAafter = Math.round(ra.elo + K * (sA - eA));
  const eloBafter = Math.round(rb.elo + K * (1 - sA - (1 - eA)));
  const now = Date.now();
  const d = db(env);
  const res = await d
    .prepare(
      `INSERT INTO matches (id, game_type, player_a, player_b, winner, score_a, score_b,
        elo_a_before, elo_a_after, elo_b_before, elo_b_after, tournament_id, played_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING`,
    )
    .bind(id ?? uid(), game, playerA, playerB, winner, scoreA, scoreB, ra.elo, eloAafter, rb.elo, eloBafter, tournamentId, now)
    .run();
  if (((res.meta as { changes?: number } | undefined)?.changes ?? 1) === 0) return; // replay
  await upsertRating(env, playerA, game, eloAafter, sA === 1);
  await upsertRating(env, playerB, game, eloBafter, sA === 0);
}

async function upsertRating(env: Env, playerId: string, game: GameType, elo: number, won: boolean): Promise<void> {
  await db(env)
    .prepare(
      `INSERT INTO ratings (player_id, game_type, elo, wins, losses) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(player_id, game_type) DO UPDATE SET
         elo=excluded.elo,
         wins=ratings.wins + ?,
         losses=ratings.losses + ?`,
    )
    .bind(playerId, game, elo, won ? 1 : 0, won ? 0 : 1, won ? 1 : 0, won ? 0 : 1)
    .run();
}

// Nemesis: tegen wie verloor deze speler het vaakst (binnen game_type).
export async function getNemesis(
  env: Env,
  playerId: string,
  game: GameType,
): Promise<{ id: string; naam: string; losses: number } | undefined> {
  const r = await db(env)
    .prepare(
      `SELECT m.id AS id, m.naam AS naam, COUNT(*) AS losses
       FROM matches x JOIN medewerkers m ON m.id = x.winner
       WHERE x.game_type=? AND (x.player_a=? OR x.player_b=?) AND x.winner<>? AND x.deleted_at IS NULL
       GROUP BY x.winner ORDER BY losses DESC LIMIT 1`,
    )
    .bind(game, playerId, playerId, playerId)
    .first<{ id: string; naam: string; losses: number }>();
  return r ?? undefined;
}

// Laatste 5 potten als 'W'/'L' (nieuwste eerst).
export async function getLast5(env: Env, playerId: string, game: GameType): Promise<("W" | "L")[]> {
  const r = await db(env)
    .prepare(
      `SELECT winner FROM matches WHERE game_type=? AND (player_a=? OR player_b=?) AND deleted_at IS NULL
       ORDER BY played_at DESC LIMIT 5`,
    )
    .bind(game, playerId, playerId)
    .all<{ winner: string }>();
  return (r.results ?? []).map((m) => (m.winner === playerId ? "W" : "L"));
}

// Corrigeer een verkeerd ingevulde pot: alleen de MEEST RECENTE pot van een spel kan
// veilig weg — de opgeslagen voor-standen (elo_*_before) zetten de ratings exact terug.
// Oudere potten verwijderen zou alle latere ELO-berekeningen vervalsen; corrigeer dus
// direct na het invoeren (of laat een beheerder de reeks opnieuw invoeren).
export async function deleteLastMatch(env: Env, game: GameType, byPlayer?: string | null): Promise<{ ok: boolean; reden?: string }> {
  const d = db(env);
  const m = await d
    .prepare("SELECT * FROM matches WHERE game_type=? AND deleted_at IS NULL ORDER BY played_at DESC LIMIT 1")
    .bind(game)
    .first<{ id: string; player_a: string; player_b: string; winner: string; elo_a_before: number; elo_b_before: number }>();
  if (!m) return { ok: false, reden: "geen-potten" };
  // null = beheerder (alles mag); anders alleen een deelnemer van deze pot.
  if (byPlayer != null && m.player_a !== byPlayer && m.player_b !== byPlayer) return { ok: false, reden: "geen-deelnemer" };
  await d.prepare("UPDATE ratings SET elo=?, wins=wins-?, losses=losses-? WHERE player_id=? AND game_type=?")
    .bind(m.elo_a_before, m.winner === m.player_a ? 1 : 0, m.winner === m.player_a ? 0 : 1, m.player_a, game).run();
  await d.prepare("UPDATE ratings SET elo=?, wins=wins-?, losses=losses-? WHERE player_id=? AND game_type=?")
    .bind(m.elo_b_before, m.winner === m.player_b ? 1 : 0, m.winner === m.player_b ? 0 : 1, m.player_b, game).run();
  await d.prepare("UPDATE matches SET deleted_at=? WHERE id=?").bind(Date.now(), m.id).run();
  return { ok: true };
}

/* ---------- Toernooien ---------- */

export interface Tournament { id: string; game_type: string; name: string; format: string; status: string; created_at: number; }

export async function createTournament(env: Env, game: GameType, name: string, format: string, idem?: string | null): Promise<string> {
  const id = idem ?? "t" + crypto.randomUUID().replace(/-/g, "");
  await db(env)
    .prepare("INSERT INTO tournaments (id, game_type, name, format, status, created_at) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING")
    .bind(id, game, name, format, "open", Date.now())
    .run();
  return id;
}
export async function listTournaments(env: Env): Promise<Tournament[]> {
  const r = await db(env).prepare("SELECT * FROM tournaments ORDER BY created_at DESC").all<Tournament>();
  return r.results ?? [];
}
export async function getTournament(env: Env, id: string): Promise<Tournament | undefined> {
  const r = await db(env).prepare("SELECT * FROM tournaments WHERE id=?").bind(id).first<Tournament>();
  return r ?? undefined;
}
export async function setTournamentStatus(env: Env, id: string, status: string): Promise<void> {
  await db(env).prepare("UPDATE tournaments SET status=? WHERE id=?").bind(status, id).run();
}
export async function addTournamentPlayer(env: Env, tid: string, pid: string): Promise<void> {
  await db(env)
    .prepare("INSERT OR IGNORE INTO tournament_players (tournament_id, player_id) VALUES (?, ?)")
    .bind(tid, pid)
    .run();
}
export async function getTournamentPlayers(env: Env, tid: string): Promise<{ id: string; naam: string }[]> {
  const r = await db(env)
    .prepare(
      `SELECT m.id AS id, m.naam AS naam FROM tournament_players tp
       JOIN medewerkers m ON m.id = tp.player_id WHERE tp.tournament_id=? ORDER BY m.naam`,
    )
    .bind(tid)
    .all<{ id: string; naam: string }>();
  return r.results ?? [];
}
// Standen binnen een toernooi: wins per speler uit matches.
export async function tournamentStandings(env: Env, tid: string): Promise<{ id: string; naam: string; wins: number }[]> {
  const r = await db(env)
    .prepare(
      `SELECT m.id AS id, m.naam AS naam, COUNT(x.id) AS wins
       FROM tournament_players tp JOIN medewerkers m ON m.id = tp.player_id
       LEFT JOIN matches x ON x.tournament_id = tp.tournament_id AND x.winner = tp.player_id
       WHERE tp.tournament_id=? GROUP BY tp.player_id ORDER BY wins DESC, m.naam`,
    )
    .bind(tid)
    .all<{ id: string; naam: string; wins: number }>();
  return r.results ?? [];
}
// Round-robin paren (alle unieke combinaties).
export function roundRobinPairs<T>(players: T[]): [T, T][] {
  const pairs: [T, T][] = [];
  for (let i = 0; i < players.length; i++)
    for (let j = i + 1; j < players.length; j++) pairs.push([players[i], players[j]]);
  return pairs;
}
