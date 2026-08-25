// public/sw.js - AUREUS PWA Service Worker
const CACHE_NAME = 'aureus-cache-v1'
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

// Activación: Limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch: Estrategia Network-First con fallback a Caché para offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  // Ignorar llamadas de analítica y APIs de Supabase para evitar interceptar WebSockets
  const url = new URL(event.request.url)
  if (url.origin.includes('supabase.co') || url.pathname.includes('_vercel')) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
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
