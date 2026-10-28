// Bumped from v1 so pages cached by the old, leakier rules are purged on activate.
const CACHE_NAME = "gtec-v2";

// Personalised or auth-gated routes, with or without a locale prefix and with or
// without a trailing slash (`/en/admin` as well as `/en/admin/courses`).
const PRIVATE_ROUTE =
  /^\/(?:[a-z]{2}\/)?(?:portal|admin|sign-in|sign-up|complete-signup|forbidden|account-setup-incomplete)(?:\/|$)/;

const PRECACHE_URLS = [
  "/",
  "/en",
  "/~offline",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      );
    }).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only GET responses are cacheable, and never API, auth, portal, or admin routes
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    PRIVATE_ROUTE.test(url.pathname)
  ) {
    return;
  }

  // Cache-first for images and static assets
  if (
    request.destination === "image" ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
        return cached ?? fetchPromise;
      }),
    );
    return;
  }

  // Network-first for HTML documents (public pages)
  if (request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached ?? caches.match("/~offline");
          });
        }),
    );
  }
});
