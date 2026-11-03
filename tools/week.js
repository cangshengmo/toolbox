/* 百宝箱 · 周计划看板：周一到周日七天任务卡片 */
App.registerTool({
  id: 'week',
  name: '周计划',
  icon: 'calendar-days',
  desc: '一周七天任务看板',
  order: 12,

  render(el) {
    /* 本周周一日期串 */
    function mondayOf(d) {
      const x = new Date(d);
      const wd = (x.getDay() + 6) % 7;
      x.setDate(x.getDate() - wd);
      return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
    }

    let weekOffset = 0;
    let items = App.store.get('week', 'items', []);
    if (!Array.isArray(items)) items = [];

    el.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <button class="icon-btn" id="wkPrev" aria-label="上一周" style="min-width:40px;min-height:40px">‹</button>
          <div class="grow" id="wkTitle" style="text-align:center;font-weight:600"></div>
          <button class="icon-btn" id="wkNext" aria-label="下一周" style="min-width:40px;min-height:40px">›</button>
        </div>
      </div>
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <input id="wkInput" class="input grow" type="text" placeholder="这周要做什么？">
          <select id="wkDay" class="select" style="flex:0 0 96px">
            <option value="0">周一</option>
            <option value="1">周二</option>
            <option value="2">周三</option>
            <option value="3">周四</option>
            <option value="4">周五</option>
            <option value="5">周六</option>
            <option value="6">周日</option>
          </select>
        </div>
        <button id="wkAdd" class="btn btn-primary" style="width:100%;min-height:42px;margin-top:10px">添加计划</button>
      </div>
      <div id="wkBoard" class="quad-grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))"></div>`;

    const titleEl = el.querySelector('#wkTitle');
    const boardEl = el.querySelector('#wkBoard');
    const inputEl = el.querySelector('#wkInput');
    const dayEl = el.querySelector('#wkDay');
    const addBtn = el.querySelector('#wkAdd');

    function save() {
      App.store.set('week', 'items', items);
    }

    function fmt(ds) {
      const p = ds.split('-');
      return (+p[1]) + '/' + (+p[2]);
    }

    function render() {
      const base = new Date();
      base.setDate(base.getDate() + weekOffset * 7);
      const mon = mondayOf(base);
      titleEl.textContent = mon.slice(0, 4) + '年' + (+mon.slice(5, 7)) + '月' + (+mon.slice(8, 10)) + '日 那一周' + (weekOffset === 0 ? '(本周)' : '');
      const todayStr = App.today();
      let html = '';
      for (let i = 0; i < 7; i++) {
        const ds = (function () {
          const d = new Date(mon.slice(0, 4), +mon.slice(5, 7) - 1, +mon.slice(8, 10));
          d.setDate(d.getDate() + i);
          return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        })();
        const dayItems = items.filter(function (it) { return it.week === mon && it.day === i; });
        const names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        const isToday = ds === todayStr;
        html += '<div class="card" style="margin-bottom:10px;' + (isToday ? 'border-color:var(--accent)' : '') + '">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
          + '<span style="font-weight:600;font-size:13.5px">' + names[i] + (isToday ? ' · 今天' : '') + '</span>'
          + '<span class="muted" style="font-size:11px">' + fmt(ds) + '</span></div>'
          + dayItems.map(function (it) {
            return '<div style="display:flex;align-items:center;gap:6px;padding:5px 0">'
              + '<button class="icon-btn" data-act="toggle" data-id="' + App.esc(it.id) + '" aria-label="完成" style="min-width:32px;min-height:32px;font-size:14px">' + (it.done ? '✅' : '⬜') + '</button>'
              + '<span style="flex:1;min-width:0;font-size:13px;' + (it.done ? 'text-decoration:line-through;opacity:.45' : '') + '">' + App.esc(it.text) + '</span>'
              + '<button class="icon-btn" data-act="del" data-id="' + App.esc(it.id) + '" aria-label="删除" style="min-width:32px;min-height:32px;font-size:13px">🗑</button>'
              + '</div>';
          }).join('')
          + (dayItems.length ? '' : '<div class="muted" style="font-size:12px;padding:4px 0">—</div>')
          + '</div>';
      }
      boardEl.innerHTML = html;
    }

    function add() {
      const text = inputEl.value.trim();
      if (!text) { App.toast('请输入计划内容'); return; }
      items.push({ id: App.uid(), text: text, day: +dayEl.value, week: weekOfView(), done: false });
      save();
      inputEl.value = '';
      inputEl.focus();
      render();
    }

    function weekOfView() {
      const base = new Date();
      base.setDate(base.getDate() + weekOffset * 7);
      return mondayOf(base);
    }

    el.querySelector('#wkPrev').addEventListener('click', function () { weekOffset--; render(); });
    el.querySelector('#wkNext').addEventListener('click', function () { weekOffset++; render(); });
    addBtn.addEventListener('click', add);
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') add();
    });

    boardEl.addEventListener('click', function (e) {
      const btn = e.target.closest ? e.target.closest('button[data-act]') : null;
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.act === 'toggle') {
        const it = items.find(function (x) { return x.id === id; });
        if (it) { it.done = !it.done; save(); render(); }
        return;
      }
      if (btn.dataset.act === 'del') {
        if (btn.dataset.armed === '1') {
          items = items.filter(function (x) { return x.id !== id; });
          save();
          render();
          return;
        }
        btn.dataset.armed = '1';
        btn.dataset.orig = btn.textContent;
        btn.textContent = '确认？';
        setTimeout(function () {
          if (btn.isConnected) {
            btn.dataset.armed = '';
            btn.textContent = btn.dataset.orig;
          }
        }, 3000);
      }
    });

    render();
  },
});
