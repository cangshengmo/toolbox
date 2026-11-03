/* 百宝箱 · 核心框架：工具注册表 + hash 路由 + 页面渲染 + 公共组件 */
window.App = window.App || {};
App.tools = [];

App.registerTool = function (tool) {
  App.tools.push(tool);
};

App.getTool = function (id) {
  return App.tools.find(t => t.id === id);
};

/* HTML 转义：所有用户输入渲染前必须过这里 */
App.esc = function (s) {
  const map = { '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": '#39' };
  const chars = String(s == null ? '' : s).split('');
  const out = chars.map(c => map[c] ? '&' + map[c] + ';' : c).join('');
  return out;
};

App.uid = function () {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
};

App.today = function () {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

/* 提示浮层 */
App.toast = function (msg) {
  let el = document.getElementById('appToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'appToast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(App.toast._t);
  App.toast._t = setTimeout(() => el.classList.remove('show'), 1800);
};

/* ---------- 主题（auto/light/dark 循环切换）---------- */
App.THEMES = ['auto', 'light', 'dark'];
App.THEME_LABELS = { auto: '🌓', light: '☀️', dark: '🌙' };
App.theme = function () {
  return App.store.appGet('theme', 'auto');
};
App.setTheme = function (mode) {
  App.store.appSet('theme', mode);
  applyTheme();
};

function applyTheme() {
  const mode = App.theme();
  const dark = mode === 'dark' || (mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

/* 短提示音（WebAudio） */
App.beep = function (times) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    let t = ctx.currentTime;
    for (let i = 0; i < times; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.start(t); o.stop(t + 0.22);
      t += 0.28;
    }
    setTimeout(function () { ctx.close(); }, times * 300 + 500);
  } catch (e) { }
};

/* ---------- 路由与渲染 ---------- */
let _cleanup = null;

function renderHeader(back, icon, title) {
  const h = document.getElementById('appHeader');
  const left = back
    ? '<button id="backBtn" class="icon-btn" aria-label="返回">←</button>'
    : '<a href="#/" class="brand" aria-label="首页">🧰</a>';
  const ticon = ({ auto: 'sun-moon', light: 'sun', dark: 'moon' })[App.theme()] || 'sun-moon';
  h.innerHTML = `
    <div class="header-inner">
      ${left}
      <div class="header-title">${(App.icon && App.icon(icon)) || App.esc(icon)} ${App.esc(title)}</div>
      <button id="themeBtn" class="icon-btn" aria-label="切换主题">${App.icon(ticon)}</button>
    </div>`;
  const bb = h.querySelector('#backBtn');
  if (bb) bb.addEventListener('click', () => history.back());
  h.querySelector('#themeBtn').addEventListener('click', function () {
    const i = App.THEMES.indexOf(App.theme());
    const next = App.THEMES[(i + 1) % App.THEMES.length];
    App['setTheme'](next);
    document.getElementById('themeBtn').innerHTML = App.icon(({ auto: 'sun-moon', light: 'sun', dark: 'moon' })[next]);
  });
}

function route() {
  if (_cleanup) { try { _cleanup(); } catch (e) { } _cleanup = null; }
  const hash = location.hash || '#/';
  const m = hash.match(/^#\/t\/([\w-]+)/);
  const page = document.getElementById('page');
  window.scrollTo(0, 0);
  if (m) {
    const tool = App.getTool(m[1]);
    if (!tool) { renderNotFound(); return; }
    renderHeader(true, tool.icon, tool.name);
    page.className = 'page tool-page';
    page.innerHTML = '';
    _cleanup = tool.render(page) || null;
  } else {
    renderHeader(false, '🧰', '百宝箱');
    renderHome(page);
  }
  page.classList.add('bx-enter');
  setTimeout(() => page.classList.remove('bx-enter'), 750);
}

function renderNotFound() {
  const page = document.getElementById('page');
  renderHeader(true, '❓', '未找到');
  page.className = 'page';
  page.innerHTML = '<div class="empty">工具不存在，<a href="#/">回首页</a></div>';
}

function renderHome(page) {
  page.className = 'page home-page';
  page.innerHTML = `
    <div class="hero-date">${App.today()} · 共 ${App.tools.length} 个工具</div>
    <div class="tool-grid">
      ${App.tools.map(t => `
        <a class="tool-card" href="#/t/${App.esc(t.id)}">
          <div class="tool-icon">${(App.icon && App.icon(t.icon)) || App.esc(t.icon)}</div>
          <div class="tool-name">${App.esc(t.name)}</div>
          <div class="tool-desc">${App.esc(t.desc || '')}</div>
        </a>`).join('')}
    </div>`;
}

App.boot = function () {
  App.tools.sort((a, b) => (a.order || 99) - (b.order || 99));
  window.addEventListener('hashchange', route);
  applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  route();
};
