// Idempotente mutaties (Stroom-plan 1.1; PoC op het intranet).
// De client stuurt per mutatie één uuid mee (verborgen veld "idem"; één id per
// gerenderd formulier, zie de injectie-script in views/layout.ts). Endpoints
// gebruiken dat als record-id: dubbel tikken of een retry na timeout stuurt
// hetzelfde id -> INSERT ... ON CONFLICT(id) DO NOTHING -> nooit een dubbel
// record. Zonder (geldig) idem-veld valt alles terug op een verse server-side
// uuid en is het gedrag exact als vanouds.

const HEX32 = /^[0-9a-f]{32}$/;

// Maakt van de client-waarde een record-id met tabel-prefix ("m", "e", "sl", ...).
// Afwezig of ongeldig -> null (caller gebruikt dan zijn eigen verse uuid).
export function idemId(raw: unknown, prefix: string): string | null {
  const v = String(raw ?? "").trim().toLowerCase().replace(/-/g, "");
  return HEX32.test(v) ? prefix + v : null;
}

// true als de INSERT daadwerkelijk schreef; false = duplicate (ON CONFLICT no-op).
// Gebruik dit vóór side-effects (ratings bijwerken, push versturen) bij een replay.
export function inserted(res: { meta?: { changes?: number } }): boolean {
  return (res.meta?.changes ?? 1) > 0;
}
