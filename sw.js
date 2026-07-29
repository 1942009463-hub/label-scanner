const CACHE='number-tag-v2';
const ASSETS=[
  '/',
  '/index.html',
  '/manifest.json',
];

// Install
self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE).then(cache=>cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch - network first for Tesseract CDN, cache first for local
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);

  // Tesseract CDN and worker assets — network first, cache fallback
  if(url.hostname.includes('jsdelivr.net')){
    e.respondWith(
      caches.open(CACHE).then(cache=>
        fetch(e.request).then(resp=>{
          if(resp.ok)cache.put(e.request,resp.clone());
          return resp;
        }).catch(()=>cache.match(e.request))
      )
    );
    return;
  }

  // Local assets — cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(cached=>cached||fetch(e.request))
  );
});
