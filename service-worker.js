self.addEventListener('install',e=>{
e.waitUntil(caches.open('atlas-v1').then(c=>c.addAll([
'index.html','atlas.css','atlas.js','knowledge.js','manifest.json'
])));
});
self.addEventListener('fetch',e=>{
e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});