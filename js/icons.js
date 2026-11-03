/* 百宝箱 · 内联 SVG 图标库（Lucide v0.469.0, ISC License）
 * 通过 App.icon(name) 取用；未知名回退为 emoji 显示 */
window.App = window.App || {};
App.ICONS = {
  "alarm-clock": "<circle cx=\"12\" cy=\"13\" r=\"8\" />\n  <path d=\"M12 9v4l2 2\" />\n  <path d=\"M5 3 2 6\" />\n  <path d=\"m22 6-3-3\" />\n  <path d=\"M6.38 18.7 4 21\" />\n  <path d=\"M17.64 18.67 20 21\" />",
  "calculator": "<rect width=\"16\" height=\"20\" x=\"4\" y=\"2\" rx=\"2\" />\n  <line x1=\"8\" x2=\"16\" y1=\"6\" y2=\"6\" />\n  <line x1=\"16\" x2=\"16\" y1=\"14\" y2=\"18\" />\n  <path d=\"M16 10h.01\" />\n  <path d=\"M12 10h.01\" />\n  <path d=\"M8 10h.01\" />\n  <path d=\"M12 14h.01\" />\n  <path d=\"M8 14h.01\" />\n  <path d=\"M12 18h.01\" />\n  <path d=\"M8 18h.01\" />",
  "database-backup": "<ellipse cx=\"12\" cy=\"5\" rx=\"9\" ry=\"3\" />\n  <path d=\"M3 12a9 3 0 0 0 5 2.69\" />\n  <path d=\"M21 9.3V5\" />\n  <path d=\"M3 5v14a9 3 0 0 0 6.47 2.88\" />\n  <path d=\"M12 12v4h4\" />\n  <path d=\"M13 20a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5c-1.33 0-2.54.54-3.41 1.41L12 16\" />",
  "ferris-wheel": "<circle cx=\"12\" cy=\"12\" r=\"2\" />\n  <path d=\"M12 2v4\" />\n  <path d=\"m6.8 15-3.5 2\" />\n  <path d=\"m20.7 7-3.5 2\" />\n  <path d=\"M6.8 9 3.3 7\" />\n  <path d=\"m20.7 17-3.5-2\" />\n  <path d=\"m9 22 3-8 3 8\" />\n  <path d=\"M8 22h8\" />\n  <path d=\"M18 18.7a9 9 0 1 0-12 0\" />",
  "flame": "<path d=\"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z\" />",
  "moon": "<path d=\"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z\" />",
  "square-check-big": "<path d=\"M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.5\" />\n  <path d=\"m9 11 3 3L22 4\" />",
  "sticky-note": "<path d=\"M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z\" />\n  <path d=\"M15 3v4a2 2 0 0 0 2 2h4\" />",
  "sun-moon": "<path d=\"M12 8a2.83 2.83 0 0 0 4 4 4 4 0 1 1-4-4\" />\n  <path d=\"M12 2v2\" />\n  <path d=\"M12 20v2\" />\n  <path d=\"m4.9 4.9 1.4 1.4\" />\n  <path d=\"m17.7 17.7 1.4 1.4\" />\n  <path d=\"M2 12h2\" />\n  <path d=\"M20 12h2\" />\n  <path d=\"m6.3 17.7-1.4 1.4\" />\n  <path d=\"m19.1 4.9-1.4 1.4\" />",
  "sun": "<circle cx=\"12\" cy=\"12\" r=\"4\" />\n  <path d=\"M12 2v2\" />\n  <path d=\"M12 20v2\" />\n  <path d=\"m4.93 4.93 1.41 1.41\" />\n  <path d=\"m17.66 17.66 1.41 1.41\" />\n  <path d=\"M2 12h2\" />\n  <path d=\"M20 12h2\" />\n  <path d=\"m6.34 17.66-1.41 1.41\" />\n  <path d=\"m19.07 4.93-1.41 1.41\" />",
  "timer": "<line x1=\"10\" x2=\"14\" y1=\"2\" y2=\"2\" />\n  <line x1=\"12\" x2=\"15\" y1=\"14\" y2=\"11\" />\n  <circle cx=\"12\" cy=\"14\" r=\"8\" />",
  "wallet": "<path d=\"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1\" />\n  <path d=\"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4\" />",
};

App.ICONS['calendar-heart'] = '<path d="M3 10h18V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7" /><path d="M8 2v4" /><path d="M21.29 14.7a2.43 2.43 0 0 0-2.65-.52c-.3.12-.57.3-.8.53l-.34.34-.35-.34a2.43 2.43 0 0 0-2.65-.53c-.3.12-.56.3-.79.53-.95.94-1 2.53.2 3.74L17.5 22l3.6-3.55c1.2-1.21 1.14-2.8.19-3.74Z" />';

App.ICONS['smile'] = '<circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" />';
App.ICONS['glass-water'] = '<path d="M5.116 4.104A1 1 0 0 1 6.11 3h11.78a1 1 0 0 1 .994 1.105L17.19 20.21A2 2 0 0 1 15.2 22H8.8a2 2 0 0 1-2-1.79z" /><path d="M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0" />';
App.ICONS['shopping-cart'] = '<circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />';

App.ICONS['banknote'] = '<rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" />';
App.ICONS['heart-pulse'] = '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />';
App.ICONS['percent'] = '<line x1="19" x2="5" y1="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />';

App.icon = function (name) {
  if (App.ICONS[name]) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + App.ICONS[name] + '</svg>';
  }
  return null;
};