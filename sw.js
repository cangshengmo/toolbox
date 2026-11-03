/* 百宝箱 · Service Worker
   经典脚本（非 module）：预缓存全部资源，cache-first 离线策略。
   更新资源后请把 CACHE 版本号 +1，旧缓存会在 activate 阶段清除。 */

const CACHE = 'bx-cache-v14';

const ASSETS = [
  './',
  './index.html',
  './css/app.css',
  './js/icons.js',
  './js/store.js',
  './js/core.js',
  './js/qr.js',
  './tools/todo.js',
  './tools/week.js',
  './tools/goals.js',
  './tools/habit.js',
  './tools/water.js',
  './tools/pomodoro.js',
  './tools/calc.js',
  './tools/math.js',
  './tools/loan.js',
  './tools/bmi.js',
  './tools/ratio.js',
  './tools/password.js',
  './tools/qr.js',
  './tools/json.js',
  './tools/regex.js',
  './tools/color.js',
  './tools/world.js',
  './tools/timer.js',
  './tools/days.js',
  './tools/decide.js',
  './tools/g2048.js',
  './tools/dice.js',
  './tools/notes.js',
  './tools/mood.js',
  './tools/words.js',
  './tools/shopping.js',
  './tools/expense.js',
  './tools/weight.js',
  './tools/aa.js',
  './tools/media.js',
  './tools/backup.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

/* 安装：预缓存全部资源，并立即接管页面 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* 激活：删除所有旧版本缓存 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

/* 请求拦截：只处理同源 GET，cache-first */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        // 只缓存成功的同源响应，避免把 404/错误页写进缓存
        if (response && response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
