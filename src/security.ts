import type { MiddlewareHandler } from "hono";

// Basis security-headers voor het hele platform.
export const securityHeaders: MiddlewareHandler = async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  c.header(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self'",
      "manifest-src 'self'",
      // Spotify-embed (intro tune op de accountpagina / dart pit). Zonder frame-src
      // viel dit terug op default-src 'self' -> iframe geblokkeerd (wit blok). (taak 8)
      "frame-src https://open.spotify.com",
      "media-src 'self' https: blob:",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  );
};
