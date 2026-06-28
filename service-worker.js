/* ===========================================
   Atlas Service Worker
   Version 1.0
=========================================== */

const CACHE = "atlas-v1";

const FILES = [

    "./",

    "./index.html",

    "./atlas.css",

    "./atlas.js",

    "./knowledge.js",

    "./manifest.json",

    "./assets/icon-192.png",

    "./assets/icon-512.png"

];

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE)

        .then(cache => cache.addAll(FILES))

    );

});

self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request)

        .then(response => {

            return response || fetch(event.request);

        })

    );

});
