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

/* ---------- 自定义主题色（accent）---------- */
App.DEFAULT_ACCENT = '#4f6ef7';

App.applyAccent = function () {
  const c = App.store.appGet('accent', '');
  const root = document.documentElement;
  if (c) root.style.setProperty('--accent', c);
  else root.style.removeProperty('--accent');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', c || App.DEFAULT_ACCENT);
};

App.setAccent = function (color) {
  App.store.appSet('accent', color || '');
  App.applyAccent();
};

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

/* 长按置顶后抑制随之而来的 click,须跨重渲染存活,故放文件域 */
let _pinSuppressClick = false;

const HOME_ACCENTS = ['#4f6ef7', '#8b5cf6', '#ec4899', '#e5484d', '#f59e0b', '#22c55e', '#14b8a6', '#64748b'];

function renderHome(page) {
  page.className = 'page home-page';
  const pinned = App.store.appGet('pinned', []);
  const pinSet = [];
  const rest = [];
  App.tools.forEach(function (t) {
    if (pinned.indexOf(t.id) !== -1) pinSet.push(t); else rest.push(t);
  });
  pinSet.sort(function (a, b) { return pinned.indexOf(a.id) - pinned.indexOf(b.id); });
  const shown = pinSet.concat(rest);
  const cur = App.store.appGet('accent', '') || App.DEFAULT_ACCENT;

  const hour = new Date().getHours();
  const greet = hour < 5 ? '夜深了 🌙' : hour < 9 ? '早安 ☀️' : hour < 12 ? '上午好' : hour < 14 ? '午安 🌤' : hour < 18 ? '下午好' : hour < 23 ? '晚上好 🌆' : '夜深了 🌙';
  const lastExport = App.store.appGet('lastExport', '');
  const dismissed = App.store.appGet('backupDismiss', '');
  let backupDays = null;
  if (lastExport) {
    backupDays = Math.round((Date.now() - new Date(lastExport.replace(/-/g, '/')).getTime()) / 86400000);
  }
  let hasData = false;
  for (const k in localStorage) {
    if (k.indexOf('bx:') === 0 && k.indexOf(':app:') === -1) { hasData = true; break; }
  }
  const overdue = hasData && backupDays === null || hasData && backupDays !== null && backupDays >= 30;
  const showBanner = overdue && dismissed !== App.today();
  const banner = showBanner
    ? '<div class="card" id="bkBanner" style="border-color:#f59e0b">'
      + '<div style="display:flex;align-items:center;gap:8px"><span>💾</span>'
      + '<div class="grow" style="font-size:13.5px">' + (backupDays === null ? '还没有备份过数据' : '距上次备份已 ' + backupDays + ' 天') + ',建议导出一份</div>'
      + '<a class="btn btn-primary" href="#/t/backup" style="min-height:36px;font-size:13px;flex:0 0 auto">去备份</a>'
      + '<button class="icon-btn" id="bkDismiss" aria-label="今日不再提醒" style="min-width:36px;min-height:36px;font-size:13px">✕</button></div></div>'
    : '';

  page.innerHTML = `
    <div class="hero-greet" style="font-size:21px;font-weight:700;margin:4px 2px 0">${greet}</div>
    <div class="hero-date">${App.today()} · 共 ${App.tools.length} 个工具${pinSet.length ? ' · ★' + pinSet.length : ''}</div>
    <div class="row" style="margin:8px 0 12px">
      <input id="homeSearch" class="input grow" type="search" placeholder="搜工具或记录内容" aria-label="搜索">
    </div>
    <div id="searchResults" hidden></div>
    ${banner}
    <div class="tool-grid" id="toolGrid">
      ${shown.map(function (t) {
        const isPinned = pinned.indexOf(t.id) !== -1;
        return `
        <a class="tool-card" href="#/t/${App.esc(t.id)}" data-tool="${App.esc(t.id)}">
          ${isPinned ? '<span class="pin-badge" aria-hidden="true">★</span>' : ''}
          <div class="tool-icon">${(App.icon && App.icon(t.icon)) || App.esc(t.icon)}</div>
          <div class="tool-name">${App.esc(t.name)}</div>
          <div class="tool-desc">${App.esc(t.desc || '')}</div>
        </a>`;
      }).join('')}
    </div>
    <div class="card" id="accentCard">
      <div class="row" style="margin-bottom:8px">
        <span style="font-weight:600;font-size:14px">🎨 主题色</span>
        <div class="grow"></div>
        <button class="icon-btn" id="accentReset" aria-label="恢复默认" style="min-width:36px;min-height:36px;font-size:12px">默认</button>
        <input type="color" id="accentPick" value="${cur}" aria-label="自定义颜色" style="width:36px;height:36px;padding:0;border:none;background:none;cursor:pointer">
      </div>
      <div class="accent-row">
        ${HOME_ACCENTS.map(function (c) {
          return `<button class="accent-dot${c === cur ? ' active' : ''}" data-c="${c}" style="background:${c}" aria-label="主题色 ${c}"></button>`;
        }).join('')}
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:10px">
        <span class="muted" style="font-size:12.5px">图标风格</span>
        ${['thin', 'normal', 'bold'].map(function (s) {
          const curStyle = App.store.appGet('iconstyle', 'normal');
          return '<button class="chip' + (curStyle === s ? ' active' : '') + '" data-istyle="' + s + '" style="min-height:32px;font-size:12.5px">' + (s === 'thin' ? '细' : s === 'bold' ? '粗' : '标准') + '</button>';
        }).join('')}
      </div>
    </div>`;

  /* 长按(500ms)/右键切换置顶 */
  const grid = page.querySelector('#toolGrid');
  let lpTimer = null;
  let lpXY = null;

  function togglePin(id) {
    let p = App.store.appGet('pinned', []);
    const at = p.indexOf(id);
    if (at !== -1) {
      p.splice(at, 1);
      App.toast('已取消置顶');
    } else {
      p.push(id);
      App.toast('已置顶，长按可取消');
    }
    App.store.appSet('pinned', p);
    _pinSuppressClick = true;
    renderHome(page);
  }

  grid.addEventListener('contextmenu', function (e) {
    const card = e.target.closest('.tool-card');
    if (!card) return;
    e.preventDefault();
    togglePin(card.dataset.tool);
  });

  grid.addEventListener('touchstart', function (e) {
    const card = e.target.closest('.tool-card');
    if (!card) return;
    const t0 = e.touches[0];
    lpXY = { x: t0.clientX, y: t0.clientY };
    lpTimer = setTimeout(function () {
      lpTimer = null;
      if (navigator.vibrate) navigator.vibrate(15);
      togglePin(card.dataset.tool);
    }, 500);
  }, { passive: true });

  grid.addEventListener('touchmove', function (e) {
    if (!lpTimer || !lpXY) return;
    const t0 = e.touches[0];
    if (Math.abs(t0.clientX - lpXY.x) > 10 || Math.abs(t0.clientY - lpXY.y) > 10) {
      clearTimeout(lpTimer);
      lpTimer = null;
    }
  }, { passive: true });

  grid.addEventListener('touchend', function () {
    if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
  });

  grid.addEventListener('click', function (e) {
    if (_pinSuppressClick) {
      e.preventDefault();
      e.stopPropagation();
      _pinSuppressClick = false;
    }
  }, true);

  /* 主题色卡片 */
  page.querySelector('#accentCard').addEventListener('click', function (e) {
    const dot = e.target.closest('.accent-dot');
    if (dot) {
      App.setAccent(dot.dataset.c);
      renderHome(page);
      return;
    }
    const istyle = e.target.closest('button[data-istyle]');
    if (istyle) {
      App.store.appSet('iconstyle', istyle.dataset.istyle);
      renderHome(page);
    }
  });
  page.querySelector('#accentPick').addEventListener('input', function (e) {
    App.setAccent(e.target.value);
  });
  page.querySelector('#accentReset').addEventListener('click', function () {
    App.setAccent('');
    renderHome(page);
  });

  /* ---------- 全局搜索:工具名/描述 + 各工具记录内容 ---------- */
  const searchEl = page.querySelector('#homeSearch');
  const resultsEl = page.querySelector('#searchResults');
  const gridEl = page.querySelector('#toolGrid');

  searchEl.addEventListener('input', function () {
    const q = searchEl.value.trim().toLowerCase();
    if (!q) {
      resultsEl.hidden = true;
      resultsEl.innerHTML = '';
      gridEl.style.display = '';
      return;
    }
    const seen = {};
    const hits = [];
    App.tools.forEach(function (t) {
      if (t.name.toLowerCase().indexOf(q) !== -1 || String(t.desc || '').toLowerCase().indexOf(q) !== -1) {
        seen[t.id] = true;
        hits.push(t);
      }
    });
    for (const key in localStorage) {
      if (key.indexOf('bx:') !== 0 || key.indexOf(':app:') !== -1 || hits.length > 40) continue;
      const toolId = key.slice(3, key.indexOf(':', 3));
      if (seen[toolId]) continue;
      let raw = null;
      try { raw = localStorage.getItem(key); } catch (e) { continue; }
      if (raw && raw.toLowerCase().indexOf(q) !== -1 && App.getTool(toolId)) {
        seen[toolId] = true;
        hits.push(App.getTool(toolId));
      }
    }
    gridEl.style.display = 'none';
    resultsEl.hidden = false;
    resultsEl.innerHTML = hits.length
      ? '<div class="card"><div class="item-title" style="margin-bottom:8px">找到 ' + hits.length + ' 个工具</div>'
        + hits.map(function (t) {
          return '<a class="item" href="#/t/' + App.esc(t.id) + '" style="text-decoration:none;color:inherit">'
            + '<div class="tool-icon" style="font-size:24px;width:auto">' + ((App.icon && App.icon(t.icon)) || App.esc(t.icon)) + '</div>'
            + '<div class="item-main"><div class="item-title">' + App.esc(t.name) + '</div>'
            + '<div class="item-sub">' + App.esc(t.desc || '') + '</div></div></a>';
        }).join('') + '</div>'
      : '<div class="empty">没有匹配的工具或记录</div>';
  });

  /* 备份横幅:今日不再提醒 */
  const bkDismiss = page.querySelector('#bkDismiss');
  if (bkDismiss) {
    bkDismiss.addEventListener('click', function () {
      App.store.appSet('backupDismiss', App.today());
      const b = page.querySelector('#bkBanner');
      if (b) b.remove();
    });
  }
}

App.boot = function () {
  App.tools.sort((a, b) => (a.order || 99) - (b.order || 99));
  window.addEventListener('hashchange', route);
  applyTheme();
  App.applyAccent();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    applyTheme();
    App.applyAccent();
  });
  route();
};
