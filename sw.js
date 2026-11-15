/* PANTAUAN PWA v3: cache ONLY public application shell.
 * Network-first for HTML/CSS/JS avoids old dashboard getting stuck after deploy.
 * Never intercept/cache POST, school data, secrets, API endpoints or external origins.
 */
const CACHE='pantauan-shell-v5';
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./assets/icon.svg'];
const ALLOWED=new Set(ASSETS.map(a=>new URL(a,self.registration.scope).pathname));
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(n=>n.startsWith('pantauan-shell-')&&n!==CACHE).map(n=>caches.delete(n)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==self.location.origin||!ALLOWED.has(u.pathname))return;
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const response=await fetch(e.request);
      if(response.ok&&response.type==='basic')await cache.put(e.request,response.clone());
      return response;
    }catch(err){
      const cached=await cache.match(e.request);
      if(cached)return cached;
      if(e.request.mode==='navigate'){
        const offline=await cache.match('./index.html');if(offline)return offline;
      }
      throw err;
    }
  })());
});
