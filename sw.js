/* PANTAUAN — offline shell only. Never cache student data, responses, POST or external origins. */
const CACHE='pantauan-shell-v3';
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./assets/icon.svg'];
self.addEventListener('install', e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  const all=await caches.keys();await Promise.all(all.filter(k=>k.startsWith('pantauan-shell-')&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);if(u.origin!==self.location.origin)return;
  if(!u.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  if(!ASSETS.some(a=>new URL(a,self.registration.scope).pathname===u.pathname))return;
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request)));
});
