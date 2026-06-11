// Stateless, ondertekende tokens voor het klantenportaal (geen opslag nodig).
// Eén geheim (PORTAL_SECRET) tekent zowel de magic-link tokens als de sessiecookies.
// Een "kind" in de payload voorkomt dat een magic-link token als sessie geldt (of andersom).

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return b64url(new Uint8Array(sig));
}

// Constant-time stringvergelijking.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const KIND_MAGIC = "m";
const KIND_SESSION = "s";

async function makeToken(
  kind: string,
  email: string,
  secret: string,
  ttlSec: number,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const body = `${kind}.${b64url(enc.encode(email.toLowerCase()))}.${exp}`;
  const sig = await hmac(secret, body);
  return `${body}.${sig}`;
}

async function readToken(
  kind: string,
  token: string,
  secret: string,
): Promise<string | null> {
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [k, emailB64, expStr, sig] = parts;
  if (k !== kind) return null;
  const body = `${k}.${emailB64}.${expStr}`;
  const expected = await hmac(secret, body);
  if (!safeEqual(sig, expected)) return null;
  const exp = Number(expStr);
  if (!exp || exp < Math.floor(Date.now() / 1000)) return null;
  try {
    return new TextDecoder().decode(b64urlDecode(emailB64));
  } catch {
    return null;
  }
}

// Magic-link token: 15 minuten geldig.
export const createMagicToken = (email: string, secret: string) =>
  makeToken(KIND_MAGIC, email, secret, 15 * 60);
export const verifyMagicToken = (token: string, secret: string) =>
  readToken(KIND_MAGIC, token, secret);

// Sessie: 30 dagen geldig.
export const SESSION_TTL = 30 * 24 * 60 * 60;
export const createSessionToken = (email: string, secret: string) =>
  makeToken(KIND_SESSION, email, secret, SESSION_TTL);
export const verifySessionToken = (token: string, secret: string) =>
  readToken(KIND_SESSION, token, secret);

/* ---- Cookie-helpers (cookie is gescoped op /portaal) ---- */

export const SESSION_COOKIE = "ff_portal";

export function sessionCookie(value: string, maxAgeSec: number): string {
  const attrs = [
    `${SESSION_COOKIE}=${value}`,
    "Path=/portaal",
    "HttpOnly",
    "Secure",
    // Strict = CSRF-hardening (securityrapport): de cookie gaat nooit mee met
    // cross-site verzoeken. De magic-link-flow blijft werken: de link zelf heeft
    // geen cookie nodig (token in URL) en zet de sessie via Set-Cookie.
    "SameSite=Strict",
    `Max-Age=${maxAgeSec}`,
  ];
  return attrs.join("; ");
}
export const clearSessionCookie = () => sessionCookie("", 0);

export function readSessionCookie(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === SESSION_COOKIE) return v.join("=");
  }
  return undefined;
}

// Uitnodiging gemaakt door een beheerder: 7 dagen geldig. Aparte "kind" zodat
// een uitnodigingslink niet als sessie of magic-link geldt.
export const INVITE_TTL = 7 * 24 * 60 * 60;
export const createInviteToken = (email: string, secret: string) =>
  makeToken("i", email, secret, INVITE_TTL);
export const verifyInviteToken = (token: string, secret: string) =>
  readToken("i", token, secret);
