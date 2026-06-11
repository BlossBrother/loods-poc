// Lichte rate limiter (securityrapport): vast venster, in het geheugen van de
// Worker-isolate. Bewust best-effort: isolates kunnen herstarten of parallel
// draaien, dus dit is een rem op misbruik/kosten, geen waterdichte quota.
// Voor de zware endpoints (AI-vraagbaak, vertaling, magic-link-mail) is dat
// precies genoeg; harde quota kunnen later via Durable Objects/KV.
const buckets = new Map<string, { n: number; reset: number }>();

// true = toegestaan; false = limiet bereikt binnen het venster.
export function rateLimit(key: string, max: number, perMs: number): boolean {
  const nu = Date.now();
  if (buckets.size > 5000) buckets.clear(); // simpele bescherming tegen onbegrensde groei
  const b = buckets.get(key);
  if (!b || b.reset < nu) {
    buckets.set(key, { n: 1, reset: nu + perMs });
    return true;
  }
  if (b.n >= max) return false;
  b.n++;
  return true;
}

// Stabiele sleutel voor de aanroeper: identiteit als die er is, anders het IP.
export function limietKey(route: string, identiteit: string | undefined, ip: string | undefined): string {
  return route + ":" + (identiteit?.toLowerCase() || ip || "anoniem");
}
