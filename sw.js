/* CODMPanda Service Worker v2.2.0
   Cache-first for app shell, network-first for Firebase calls */

const CACHE_NAME = 'codmpanda-v48.0.0';
const APP_SHELL = [
  '/',
  '/index.html',
  '/app.js',
  '/app.js?v=20261024-safe-auth-linking-v2',
  '/badges.js?v=20261024-obsidian-spike-v4',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/hero-panda.jpg'
];
const FRAME_ASSETS = [
  '/frames/01_ghost_ops.png',
  '/frames/02_mythic_crystal.png',
  '/frames/03_inferno.png',
  '/frames/04_frost_division.png',
  '/frames/05_legendary_rank.png',
  '/frames/06_zombie_hunter.png',
  '/frames/07_dragon_blade.png',
  '/frames/08_shadow_legion.png',
  '/frames/09_war_trophy.png',
  '/frames/10_cosmic_vanguard.png',
  '/frames/11_ranked_champion.png',
  '/frames/12_weapon_master.png',
  '/frames/13_ice_crystal.png',
  '/frames/14_battle_hardened.png',
  '/frames/15_sharpshooter.png',
  '/frames/16_task_force.png',
  '/frames/17_urban_warrior.png',
  '/frames/18_chemical_warfare.png',
  '/frames/19_war_trophy_skulls.png',
  '/frames/20_war_machine.png'
];

// CDN assets we want cached for offline use
const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

// Install — pre-cache the app shell and every transparent avatar-frame asset.
// Frame images are independent cache writes, so one unavailable image cannot block the other frames.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL).catch(() => {
        // Don't fail install if an optional app-shell file is missing.
      });
      await Promise.all(FRAME_ASSETS.map((path) =>
        cache.add(path).catch((error) => {
          console.warn('[CODMPanda] Could not precache avatar frame:', path, error);
          return null;
        })
      ));
    }).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Firebase & Google API calls (always live, never cached)
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('google.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('securetoken')
  ) {
    return; // Let browser handle normally
  }

  // Skip Jitsi, YouTube embeds (always fresh)
  if (
    url.hostname.includes('jit.si') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('ytimg.com')
  ) {
    return;
  }

  // CDN assets — cache-first
  if (CDN_ASSETS.some((asset) => event.request.url.startsWith(asset.split('?')[0]))) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // App shell — network-first, fallback to cache
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Everything else — network with cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Listen for skip-waiting message from app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
