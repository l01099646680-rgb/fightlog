"use strict";

const scope = self.registration.scope;
const cachePrefix = "pwa-shell:" + scope + ":";
const cacheName = cachePrefix + "v1";
const entry = new URL("./fightlog.html", scope).href;
const shell = new Set([entry, ...[
  "pwa-install.js",
  "pwa-install.css",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png"
].map(path => new URL(path, scope).href)]);

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll([...shell].map(url => new Request(url, { cache: "reload" })));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(cachePrefix) && name !== cacheName)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

// Only this app's published files belong in the offline cache.
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const path = url.origin + url.pathname;
  const key = path;
  if (!shell.has(key)) return;

  event.respondWith((async () => {
    let response;
    try {
      response = await fetch(request);
    } catch {
      return (await caches.match(key, { cacheName })) || Response.error();
    }
    if (response.ok && response.type === "basic" && !response.redirected && !url.search) {
      const copy = response.clone();
      event.waitUntil(caches.open(cacheName).then(cache => cache.put(key, copy)).catch(() => {}));
    }
    return response;
  })());
});
