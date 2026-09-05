// public/sw.js - AUREUS PWA Service Worker
const CACHE_NAME = 'aureus-cache-v2'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
]

// Instalación: Cachear assets estáticos del app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }).then(() => self.skipWaiting())
  )
})

// Activación: Limpieza de cachés antiguas y toma de control inmediata
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch: Solo responder cuando sea una petición GET y NO pertenezca a Supabase ni a APIs dinámicas
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  // Ignorar WebSockets, Supabase, Vercel analytics o peticiones externas
  if (
    url.origin.includes('supabase.co') ||
    url.pathname.includes('/rest/v1') ||
    url.pathname.includes('/realtime/v1') ||
    url.pathname.includes('_vercel')
  ) {
    return
  }

  // Network-First para navegación y recursos
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html')
          }
          return new Response('Sin conexión a Internet', { status: 503, statusText: 'Offline' })
        })
      })
  )
})
