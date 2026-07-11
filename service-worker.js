var CACHE_NAME = "guitare-theorie-v5";
var CORE_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.json",
  "./js/music-theory.js",
  "./js/storage.js",
  "./js/nav.js",
  "./js/session-ui.js",
  "./js/notes.js",
  "./js/intervals.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(CORE_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.filter(function(n){return n!==CACHE_NAME;}).map(function(n){return caches.delete(n);}));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event){
  event.respondWith(
    caches.match(event.request).then(function(cached){
      return cached || fetch(event.request);
    })
  );
});
