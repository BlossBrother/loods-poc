import { ICON_192_B64, ICON_512_B64, b64ToBytes } from "./icons";

export const THEME = "#2f8b54";

// Zichtbaar buildversie-label (footer/menu). Aflezen op toestel = welke versie laadt er echt.
export const BUILD = "v209";

export const MANIFEST = {
  name: "Fresh Forward",
  short_name: "Fresh Forward",
  description: "Fresh Forward intern platform",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "portrait",
  background_color: "#0A0E14",
  theme_color: "#0A0E14",
  icons: [
    { src: "/icon-192.png?v=ff4", sizes: "192x192", type: "image/png", purpose: "any maskable" },
    { src: "/icon-512.png?v=ff4", sizes: "512x512", type: "image/png", purpose: "any maskable" },
  ],
};

// Service worker, geoptimaliseerd voor snel wisselen tussen tabbladen.
// - Tabbladen worden bij activatie alvast opgehaald (warme cache).
// - Navigeren: network-first -> nieuwe deploys meteen zichtbaar; offline terugval op cache.
// - Na een actie (?ok=... na in-/uitchecken, posten, opslaan): altijd vers van
//   het netwerk, zodat je je wijziging direct ziet.
export const SERVICE_WORKER = `
const CACHE = "ff-v181";
const WARM = ["/smoelenboek", "/competitie", "/social"];

self.addEventListener("install", function () { self.skipWaiting(); });

self.addEventListener("activate", function (e) {
  e.waitUntil((async function () {
    var keys = await caches.keys();
    // ff-spa* is de SWR-cache van de SPA-router (Stroom-plan 1.5) — niet opruimen.
    await Promise.all(keys.filter(function (k) { return k !== CACHE && k.indexOf("ff-spa") !== 0; }).map(function (k) { return caches.delete(k); }));
    await self.clients.claim();
    try {
      var cache = await caches.open(CACHE);
      await Promise.all(WARM.map(async function (u) {
        try { var r = await fetch(u, { credentials: "include" }); if (r && r.ok) await cache.put(u, r.clone()); } catch (e) {}
      }));
    } catch (e) {}
  })());
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // API-GET's (Stroom 2.1): network-first met cache-fallback. Online altijd vers;
  // offline de laatst bekende data (anders breken badge/reacties/modules zonder netwerk).
  if (url.pathname.indexOf("/api/") === 0) {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (m) {
          return m || new Response("{}", { status: 503, headers: { "Content-Type": "application/json" } });
        });
      })
    );
    return;
  }

  var accept = req.headers.get("accept") || "";
  var isHTML = req.mode === "navigate" || accept.indexOf("text/html") !== -1;

  // v192: home ("/") = stale-while-revalidate. Home is een standalone pagina met
  // server-side Airtable-werk en laadde daardoor telkens zichtbaar traag (video 12/6).
  // De cache toont 'm direct; het verse antwoord wordt op de achtergrond opgeslagen
  // en is er bij het volgende bezoek. Deploys blijven zichtbaar: de CACHE-bump per
  // deploy leegt deze cache sowieso.
  // v193: ?ok=-redirects (na een actie) slaan de cache over — je eigen wijziging
  // moet je direct terugzien, niet de stale gecachte home.
  if (isHTML && url.pathname === "/" && url.search.indexOf("ok=") === -1) {
    e.respondWith(
      caches.open(CACHE).then(function (cache) {
        return cache.match("/").then(function (cached) {
          var fetched = fetch(req).then(function (res) {
            if (res && res.ok) cache.put("/", res.clone());
            return res;
          }).catch(function () { return cached; });
          e.waitUntil(fetched.catch(function () {}));
          return cached || fetched;
        });
      })
    );
    return;
  }

  // Pagina's: NETWORK-FIRST -> een nieuwe deploy is meteen zichtbaar (geen stale UI).
  // Offline of bij netwerkfout valt het netjes terug op de cache.
  if (isHTML) {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(new Request(url.pathname), copy); }); }
        return res;
      }).catch(function () { return caches.match(req).then(function (m) { return m || caches.match(url.pathname); }); })
    );
    return;
  }

  // Statische assets: stale-while-revalidate (snel, op de achtergrond verversen).
  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req).then(function (cached) {
        var fetched = fetch(req).then(function (res) {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(function () { return cached; });
        e.waitUntil(fetched.catch(function () {}));
        return cached || fetched;
      });
    })
  );
});

self.addEventListener("push", function (e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) {}
  var title = data.title || "Fresh Forward";
  var opts = { body: data.body || "", icon: "/icon-192.png", badge: "/icon-192.png", data: { url: data.url || "/" } };
  e.waitUntil(self.registration.showNotification(title, opts));
  // App-icoon badge: exacte teller indien meegestuurd (badge_count), anders een stip.
  // Bij openen van de app zet de pagina daarna het exacte aantal via /api/badge.
  try {
    if (navigator.setAppBadge) {
      if (typeof data.badge_count === "number") navigator.setAppBadge(data.badge_count);
      else navigator.setAppBadge();
    }
  } catch (err) {}
});
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  try { if (navigator.clearAppBadge) navigator.clearAppBadge(); } catch (err) {}
  var url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) { if (list[i].url.indexOf(url) !== -1 && "focus" in list[i]) return list[i].focus(); }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  }));
});
`;

export function iconResponse(which: 192 | 512): Response {
  const bytes = b64ToBytes(which === 192 ? ICON_192_B64 : ICON_512_B64);
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
