// Auth-hardening voor het INTERNE deel.
//
// De Worker leunt op Cloudflare Access (M365). Twee niveaus, afhankelijk van config:
//
//  1) Volledige JWT-verificatie (aanrader): zet ACCESS_TEAM_DOMAIN + ACCESS_AUD.
//     We verifiëren dan de handtekening van het `Cf-Access-Jwt-Assertion`-token
//     tegen de publieke sleutels van je Access-team. Een verzoek dat NIET via
//     Access binnenkomt heeft geen geldig token -> geen identiteit -> geweigerd.
//
//  2) Niet geconfigureerd: we vertrouwen de header `cf-access-authenticated-user-email`
//     (door Access gezet). BELANGRIJK verschil met vroeger: ontbreekt de header,
//     dan is er GEEN identiteit en GEEN beheer (geen fail-open meer).
//
//  DEV_MODE="true" (alleen in .dev.vars) -> lokaal draaien zonder Access; jij bent beheerder.

import type { Context } from "hono";
import type { Env, AirtableRecord, MedewerkerFields } from "./airtable";

export function isDev(env: Env): boolean {
  return env.DEV_MODE === "true";
}

/* ---- JWKS-cache (publieke sleutels van het Access-team) ---- */

interface Jwk {
  kid: string;
  kty: string;
  n: string;
  e: string;
  alg?: string;
}
let jwksCache: { keys: Map<string, CryptoKey>; exp: number } | null = null;

async function getKeys(teamDomain: string): Promise<Map<string, CryptoKey>> {
  const now = Date.now();
  if (jwksCache && jwksCache.exp > now) return jwksCache.keys;
  // Robuust tegen een teamdomein zonder schema (anders faalt de fetch): vul https:// aan.
  const base = teamDomain.replace(/\/$/, "");
  const url = `${/^https?:\/\//.test(base) ? base : "https://" + base}/cdn-cgi/access/certs`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`JWKS ophalen faalde: ${res.status}`);
  const body = (await res.json()) as { keys: Jwk[] };
  const keys = new Map<string, CryptoKey>();
  for (const jwk of body.keys ?? []) {
    try {
      const key = await crypto.subtle.importKey(
        "jwk",
        { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["verify"],
      );
      keys.set(jwk.kid, key);
    } catch {
      /* sla onbruikbare sleutel over */
    }
  }
  jwksCache = { keys, exp: now + 60 * 60 * 1000 }; // 1 uur cachen
  return keys;
}

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Verifieer het Access-JWT en geef het e-mailadres terug (of undefined).
async function verifyAccessJwt(
  token: string,
  teamDomain: string,
  aud: string,
): Promise<string | undefined> {
  const parts = token.split(".");
  if (parts.length !== 3) return undefined;
  const [h, p, s] = parts;
  let header: { kid?: string; alg?: string };
  let payload: { aud?: string | string[]; exp?: number; iss?: string; email?: string };
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)));
    payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
  } catch {
    return undefined;
  }
  if (header.alg !== "RS256" || !header.kid) return undefined;

  const keys = await getKeys(teamDomain);
  const key = keys.get(header.kid);
  if (!key) return undefined;

  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    b64urlToBytes(s),
    new TextEncoder().encode(`${h}.${p}`),
  );
  if (!ok) return undefined;

  // Claims controleren.
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) return undefined;
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(aud)) return undefined;
  if (payload.iss && !payload.iss.startsWith(teamDomain.replace(/\/$/, ""))) return undefined;

  return payload.email ? payload.email.toLowerCase() : undefined;
}

// Bepaalt het geverifieerde e-mailadres van de ingelogde collega (of undefined).
function eersteBeheerderEmail(env: Env): string | undefined {
  const lijst = (env.BEHEERDER_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return lijst[0] ? lijst[0].toLowerCase() : undefined;
}

export async function resolveAccessEmail(
  c: Context,
  env: Env,
): Promise<string | undefined> {
  // Lokaal (DEV_MODE): geef een concrete identiteit terug (DEV_EMAIL of de eerste
  // beheerder) i.p.v. undefined. Zo werken identiteit-gebonden features (emoji-
  // reacties, reacties onder nieuws, "mijn account", nieuws-gezien) ook in dev,
  // consistent met "jij bent beheerder" (isBeheerderVoor). Deze tak draait nooit
  // in productie: DEV_MODE staat alleen in .dev.vars en wordt niet gedeployed.
  if (isDev(env)) {
    const dev = (env.DEV_EMAIL ?? eersteBeheerderEmail(env) ?? "").toLowerCase();
    return dev || undefined;
  }
  if (env.ACCESS_TEAM_DOMAIN && env.ACCESS_AUD) {
    const token =
      c.req.header("cf-access-jwt-assertion") ??
      cookieValue(c.req.header("cookie"), "CF_Authorization");
    if (!token) return undefined;
    try {
      return await verifyAccessJwt(token, env.ACCESS_TEAM_DOMAIN, env.ACCESS_AUD);
    } catch {
      return undefined;
    }
  }
  // Fallback (geen volledige JWT-verificatie geconfigureerd): vertrouw op wat Access
  // zelf zet. Bij paginanavigaties zet Access de header `cf-access-authenticated-user-
  // email`; bij `fetch()`/XHR (zoals de emoji-reactie) ontbreekt die header vaak,
  // terwijl het `CF_Authorization`-cookie (de Access-JWT) wél meekomt. Lees daarom
  // het e-mailadres uit het cookie-token als de header ontbreekt — zo krijgen fetch-
  // calls dezelfde identiteit als navigaties (lost de "log opnieuw in"-403 op).
  // Geen fail-open: zonder header én zonder leesbaar token -> undefined.
  // (Aanrader voor productie: zet ACCESS_TEAM_DOMAIN + ACCESS_AUD voor échte verificatie.)
  const header = c.req.header("cf-access-authenticated-user-email");
  if (header) return header.toLowerCase();
  const cookieToken = cookieValue(c.req.header("cookie"), "CF_Authorization");
  const uitCookie = cookieToken ? emailUitToken(cookieToken) : undefined;
  return uitCookie ? uitCookie.toLowerCase() : undefined;
}


// Leest de `email`-claim uit een (Access-)JWT zonder de handtekening te verifiëren.
// Alleen bedoeld voor de fallback hierboven: de app zit achter Cloudflare Access, dus
// een verzoek dat de Worker bereikt is al door Access toegelaten; dit is niet zwakker
// dan het vertrouwen op de door Access gezette e-mailheader in dezelfde fallback.
function emailUitToken(token: string): string | undefined {
  const parts = token.split(".");
  if (parts.length !== 3) return undefined;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1]))) as { email?: string };
    return payload.email || undefined;
  } catch {
    return undefined;
  }
}

function cookieValue(header: string | undefined, naam: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === naam) return v.join("=");
  }
  return undefined;
}

// Vind het medewerker-record bij het geverifieerde e-mailadres.
export function medewerkerVoorEmail(
  email: string | undefined,
  medewerkers: AirtableRecord<MedewerkerFields>[],
): AirtableRecord<MedewerkerFields> | undefined {
  if (!email) return undefined;
  // trim(): een onzichtbare spatie in het Medewerkers-veld mag de koppeling niet breken.
  const zoek = email.trim().toLowerCase();
  return medewerkers.find(
    (m) => (m.fields["E-mail"] ?? "").trim().toLowerCase() === zoek,
  );
}

// Is deze (geverifieerde) gebruiker beheerder? Lokaal (DEV_MODE) = ja.
export function isBeheerderVoor(
  email: string | undefined,
  env: Env,
  medewerkers: AirtableRecord<MedewerkerFields>[],
): boolean {
  if (isDev(env)) return true;
  if (!email) return false;
  const lijst = (env.BEHEERDER_EMAILS ?? "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (lijst.includes(email)) return true;
  return medewerkerVoorEmail(email, medewerkers)?.fields.Rol === "Beheerder";
}
