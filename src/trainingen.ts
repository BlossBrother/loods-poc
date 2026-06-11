// Trainingen-module: cursussen + hoofdstukken (markdown). Tenant-scoped, platform-klaar.
import type { Env } from "./airtable";
import { COURSE_SEED } from "./courses_seed";

export interface Course { id: string; title: string; description: string | null; sort: number; published: number; created_at: number; }
export interface Chapter { id: string; course_id: string; title: string; body: string | null; sort: number; }

const TENANT = "default";
function db(env: Env): D1Database {
  if (!env.DB) throw new Error("D1-database (DB) niet geconfigureerd.");
  return env.DB;
}
function uid(p: string): string { return p + crypto.randomUUID().replace(/-/g, ""); }

// Laad de starter-cursussen één keer (als er nog geen cursussen zijn voor deze tenant).
export async function seedIfEmpty(env: Env): Promise<void> {
  const row = await db(env).prepare("SELECT COUNT(*) AS n FROM courses WHERE tenant_id=?").bind(TENANT).first<{ n: number }>();
  if ((row?.n ?? 0) > 0) return;
  let ci = 0;
  for (const c of COURSE_SEED) {
    const cid = uid("c");
    await db(env)
      .prepare("INSERT INTO courses (id, tenant_id, title, description, sort, published, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)")
      .bind(cid, TENANT, c.title, c.description, ci++, Date.now())
      .run();
    let hi = 0;
    for (const ch of c.chapters) {
      await db(env)
        .prepare("INSERT INTO course_chapters (id, tenant_id, course_id, title, body, sort) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(uid("cc"), TENANT, cid, ch.title, ch.body, hi++)
        .run();
    }
  }
}

export async function getDoneChapters(env: Env, playerId: string, courseId: string): Promise<Set<string>> {
  const r = await db(env)
    .prepare("SELECT chapter_id FROM course_progress WHERE tenant_id=? AND player_id=? AND course_id=? AND done=1")
    .bind(TENANT, playerId, courseId).all<{ chapter_id: string }>();
  return new Set((r.results ?? []).map((x) => x.chapter_id));
}

export async function markChapterDone(env: Env, playerId: string, courseId: string, chapterId: string): Promise<void> {
  await db(env)
    .prepare(`INSERT INTO course_progress (tenant_id, player_id, course_id, chapter_id, done, created_at)
              VALUES (?, ?, ?, ?, 1, ?)
              ON CONFLICT(tenant_id, player_id, chapter_id) DO UPDATE SET done=1`)
    .bind(TENANT, playerId, courseId, chapterId, Date.now()).run();
}

export async function listCourses(env: Env, includeUnpublished = false): Promise<Course[]> {
  const sql = includeUnpublished
    ? "SELECT * FROM courses WHERE tenant_id=? ORDER BY sort, title"
    : "SELECT * FROM courses WHERE tenant_id=? AND published=1 ORDER BY sort, title";
  const r = await db(env).prepare(sql).bind(TENANT).all<Course>();
  return r.results ?? [];
}
export async function getCourse(env: Env, id: string): Promise<Course | undefined> {
  const r = await db(env).prepare("SELECT * FROM courses WHERE tenant_id=? AND id=?").bind(TENANT, id).first<Course>();
  return r ?? undefined;
}
export async function getChapters(env: Env, courseId: string): Promise<Chapter[]> {
  const r = await db(env).prepare("SELECT * FROM course_chapters WHERE tenant_id=? AND course_id=? ORDER BY sort, title").bind(TENANT, courseId).all<Chapter>();
  return r.results ?? [];
}
export async function getChapter(env: Env, id: string): Promise<Chapter | undefined> {
  const r = await db(env).prepare("SELECT * FROM course_chapters WHERE tenant_id=? AND id=?").bind(TENANT, id).first<Chapter>();
  return r ?? undefined;
}

export async function createCourse(env: Env, title: string, description: string): Promise<string> {
  const id = uid("c");
  const max = await db(env).prepare("SELECT COALESCE(MAX(sort),-1) AS m FROM courses WHERE tenant_id=?").bind(TENANT).first<{ m: number }>();
  await db(env).prepare("INSERT INTO courses (id, tenant_id, title, description, sort, published, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)").bind(id, TENANT, title, description || null, (max?.m ?? -1) + 1, Date.now()).run();
  return id;
}
export async function updateCourse(env: Env, id: string, title: string, description: string, published: boolean): Promise<void> {
  await db(env).prepare("UPDATE courses SET title=?, description=?, published=? WHERE tenant_id=? AND id=?").bind(title, description || null, published ? 1 : 0, TENANT, id).run();
}
export async function deleteCourse(env: Env, id: string): Promise<void> {
  await db(env).prepare("DELETE FROM course_chapters WHERE tenant_id=? AND course_id=?").bind(TENANT, id).run();
  await db(env).prepare("DELETE FROM courses WHERE tenant_id=? AND id=?").bind(TENANT, id).run();
}
export async function addChapter(env: Env, courseId: string, title: string, body: string): Promise<void> {
  const max = await db(env).prepare("SELECT COALESCE(MAX(sort),-1) AS m FROM course_chapters WHERE tenant_id=? AND course_id=?").bind(TENANT, courseId).first<{ m: number }>();
  await db(env).prepare("INSERT INTO course_chapters (id, tenant_id, course_id, title, body, sort) VALUES (?, ?, ?, ?, ?, ?)").bind(uid("cc"), TENANT, courseId, title, body || null, (max?.m ?? -1) + 1).run();
}
export async function updateChapter(env: Env, id: string, title: string, body: string): Promise<void> {
  await db(env).prepare("UPDATE course_chapters SET title=?, body=? WHERE tenant_id=? AND id=?").bind(title, body || null, TENANT, id).run();
}
export async function deleteChapter(env: Env, id: string): Promise<void> {
  await db(env).prepare("DELETE FROM course_chapters WHERE tenant_id=? AND id=?").bind(TENANT, id).run();
}
