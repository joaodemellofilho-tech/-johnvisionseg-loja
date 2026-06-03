const CACHE_NAME = "johnvisionseg-pro-storefront-v17";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/css/style.css",
  "./assets/js/firebase-config.js",
  "./assets/js/app-data.js",
  "./assets/js/app.js",
  "./assets/images/security-hero.png",
  "./assets/images/product-camera.svg",
  "./assets/images/product-ptz.svg",
  "./assets/images/product-kit-cftv.svg",
  "./assets/images/product-dvr.svg",
  "./assets/images/product-alarm.svg",
  "./assets/images/product-fence.svg",
  "./assets/images/product-access.svg",
  "./assets/icons/favicon.svg",
  "./assets/icons/logo-mark.svg",
  "./assets/icons/logo.svg",
  "./assets/icons/pattern.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
