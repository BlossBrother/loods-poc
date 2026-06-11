// Web Push (RFC 8030/8188/8291 + VAPID RFC 8292) met Web Crypto.
// De aes128gcm-encryptie is geverifieerd tegen de RFC 8291-testvector.

import type { Env } from "../airtable";

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}
export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

const enc = new TextEncoder();

function b64uToBytes(s: string): Uint8Array {
  let t = s.replace(/-/g, "+").replace(/_/g, "/");
  while (t.length % 4) t += "=";
  const bin = atob(t);
  const o = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i);
  return o;
}
function bytesToB64u(b: Uint8Array): string {
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function cat(...arrs: Uint8Array[]): Uint8Array {
  let n = 0;
  for (const a of arrs) n += a.length;
  const o = new Uint8Array(n);
  let i = 0;
  for (const a of arrs) {
    o.set(a, i);
    i += a.length;
  }
  return o;
}
function u32be(n: number): Uint8Array {
  return new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
}

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  len: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    key,
    len * 8,
  );
  return new Uint8Array(bits);
}

// Versleutel één aes128gcm-record voor een abonnement (RFC 8291).
async function encryptPayload(
  plaintext: Uint8Array,
  p256dh: Uint8Array,
  auth: Uint8Array,
): Promise<Uint8Array> {
  const kp = (await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  )) as CryptoKeyPair;
  const asPublic = new Uint8Array((await crypto.subtle.exportKey("raw", kp.publicKey)) as ArrayBuffer);
  const uaKey = await crypto.subtle.importKey(
    "raw",
    p256dh,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const ecdh = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: uaKey } as unknown as Parameters<SubtleCrypto["deriveBits"]>[0],
      kp.privateKey,
      256,
    ),
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const ikm = await hkdf(
    auth,
    ecdh,
    cat(enc.encode("WebPush: info"), Uint8Array.of(0), p256dh, asPublic),
    32,
  );
  const cek = await hkdf(
    salt,
    ikm,
    cat(enc.encode("Content-Encoding: aes128gcm"), Uint8Array.of(0)),
    16,
  );
  const nonce = await hkdf(
    salt,
    ikm,
    cat(enc.encode("Content-Encoding: nonce"), Uint8Array.of(0)),
    12,
  );
  const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, [
    "encrypt",
  ]);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce, tagLength: 128 },
      aesKey,
      cat(plaintext, Uint8Array.of(2)),
    ),
  );
  return cat(salt, u32be(4096), Uint8Array.of(asPublic.length), asPublic, ct);
}

// Bouw de VAPID Authorization-header voor een push-endpoint (RFC 8292).
async function vapidHeader(env: Env, audience: string): Promise<string | undefined> {
  const pub = env.VAPID_PUBLIC_KEY;
  const priv = env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return undefined;
  const pubBytes = b64uToBytes(pub);
  const x = bytesToB64u(pubBytes.slice(1, 33));
  const y = bytesToB64u(pubBytes.slice(33, 65));
  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x, y, d: priv, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const header = bytesToB64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = bytesToB64u(
    enc.encode(
      JSON.stringify({
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 12 * 3600,
        sub: env.VAPID_SUBJECT || "mailto:beheer@fresh-forward.nl",
      }),
    ),
  );
  const signingInput = `${header}.${payload}`;
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(signingInput)),
  );
  return `vapid t=${signingInput}.${bytesToB64u(sig)}, k=${pub}`;
}

// Stuur één pushbericht. gone=true => abonnement is verlopen (verwijderen).
export async function sendPush(
  env: Env,
  sub: PushSubscriptionData,
  payload: PushPayload,
): Promise<{ status: number; gone: boolean }> {
  const audience = new URL(sub.endpoint).origin;
  const auth = await vapidHeader(env, audience);
  const body = await encryptPayload(
    enc.encode(JSON.stringify(payload)),
    b64uToBytes(sub.p256dh),
    b64uToBytes(sub.auth),
  );
  const headers: Record<string, string> = {
    "Content-Encoding": "aes128gcm",
    "Content-Type": "application/octet-stream",
    TTL: "2419200",
    Urgency: "normal",
  };
  if (auth) headers.Authorization = auth;
  const res = await fetch(sub.endpoint, { method: "POST", headers, body: body as BodyInit });
  return { status: res.status, gone: res.status === 404 || res.status === 410 };
}
