/* 百宝箱 · 纪念日：重要日子倒数天 */
App.registerTool({
  id: 'days',
  name: '纪念日',
  icon: 'calendar-heart',
  desc: '重要日子倒数天',
  order: 55,

  render(el) {
    let days = App.store.get('days', 'days', []);
    if (!Array.isArray(days)) days = [];

    el.innerHTML = `
      <div class="card">
        <div class="row">
          <input id="dyName" class="input grow" type="text" placeholder="日子名称，如：生日">
          <input id="dyDate" class="input" type="date" style="flex:0 0 150px;min-height:44px">
        </div>
        <div class="row" style="margin-top:0">
          <label style="display:flex;align-items:center;gap:6px;font-size:13.5px;color:var(--text-2)">
            <input id="dyRepeat" type="checkbox"> 每年重复
          </label>
          <div class="grow"></div>
          <button id="dyAdd" class="btn btn-primary" style="min-height:44px">添加</button>
        </div>
      </div>
      <div class="list" id="dyList" style="margin-top:12px"></div>
      <div class="empty" id="dyEmpty" hidden>还没有纪念日，添加一个重要日子吧</div>`;

    const nameInput = el.querySelector('#dyName');
    const dateInput = el.querySelector('#dyDate');
    const repeatInput = el.querySelector('#dyRepeat');
    const listEl = el.querySelector('#dyList');
    const emptyEl = el.querySelector('#dyEmpty');

    const MS = 86400000;

    /* 'YYYY-MM-DD' → 当地时区 0 点的 Date；非法返回 null */
    function parseDate(s) {
      const p = String(s || '').split('-').map(Number);
      if (p.length !== 3 || p.some(function (x) { return isNaN(x); })) return null;
      return new Date(p[0], p[1] - 1, p[2]);
    }

    function today0() {
      const n = new Date();
      return new Date(n.getFullYear(), n.getMonth(), n.getDate());
    }

    /* 距某日 0 点的天数，负数 = 已过 */
    function daysUntil(d) {
      return Math.round((d - today0()) / MS);
    }

    /* 下一次发生日：repeat 从存档年份往后找；否则固定日期 */
    function nextDate(item) {
      const d = parseDate(item.date);
      if (!d) return null;
      if (!item.repeat) return d;
      let y = d.getFullYear();
      let cand = new Date(y, d.getMonth(), d.getDate());
      const t = today0();
      while (cand < t) {
        y++;
        cand = new Date(y, d.getMonth(), d.getDate());
      }
      return cand;
    }

    /* 排序键：未来/每年重复按剩余天数升序；过去固定日期排最后 */
    function sortKey(item) {
      const nd = nextDate(item);
      if (!nd) return 1e9;
      const n = daysUntil(nd);
      if (!item.repeat && n < 0) return 1e6 + (-n);
      return n;
    }

    function rowInner(item) {
      const nd = nextDate(item);
      const n = daysUntil(nd);
      let label = '还有', num = n, unit = '天';
      if (n === 0) { label = '就是今天'; num = '🎉'; unit = ''; }
      else if (n < 0) { label = '已'; num = -n; }
      const dateLabel = item.date + (item.repeat ? ' · 每年' : '');
      return `
        <div class="item-main">
          <div class="item-title">${App.esc(item.name)}</div>
          <div class="item-sub">${App.esc(dateLabel)}</div>
        </div>
        <div style="text-align:right;flex:0 0 auto">
          <div class="muted" style="font-size:12px">${label}</div>
          <div style="font-size:26px;font-weight:700;color:var(--accent);line-height:1.15">${num}</div>
          <div class="muted" style="font-size:12px">${unit}</div>
        </div>`;
    }

    function save() {
      App.store.set('days', 'days', days);
    }

    function renderAll() {
      days.sort(function (a, b) { return sortKey(a) - sortKey(b); });
      listEl.innerHTML = days.map(function (item) {
        return `
          <div class="item" data-row="${App.esc(item.id)}">
            ${rowInner(item)}
            <button class="icon-btn" data-act="del" data-id="${App.esc(item.id)}" aria-label="删除"
              style="min-width:44px;min-height:44px">🗑</button>
          </div>`;
      }).join('');
      emptyEl.hidden = days.length > 0;
    }

    function addDays() {
      const name = nameInput.value.trim();
      const date = dateInput.value;
      if (!name) { App.toast('请输入日子名称'); return; }
      if (!date) { App.toast('请选择日期'); dateInput.focus(); return; }
      days.push({ id: App.uid(), name: name, date: date, repeat: repeatInput.checked });
      save();
      nameInput.value = '';
      dateInput.value = '';
      repeatInput.checked = false;
      renderAll();
      nameInput.focus();
    }

    /* 两击确认删除：首击变"确认删除？"，3 秒内再击执行，超时还原 */
    function armDelete(btn, id) {
      if (btn.dataset.armed === '1') {
        days = days.filter(function (x) { return x.id !== id; });
        save();
        renderAll();
        return;
      }
      btn.dataset.armed = '1';
      btn.dataset.orig = btn.textContent;
      btn.textContent = '确认删除？';
      setTimeout(function () {
        if (btn.isConnected) {
          btn.dataset.armed = '';
          btn.textContent = btn.dataset.orig;
        }
      }, 3000);
    }

    el.querySelector('#dyAdd').addEventListener('click', addDays);
    nameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') dateInput.focus();
    });
    dateInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') addDays();
    });

    listEl.addEventListener('click', function (e) {
      const btn = e.target.closest ? e.target.closest('button[data-act]') : null;
      if (!btn) return;
      if (btn.dataset.act === 'del') armDelete(btn, btn.dataset.id);
    });

    renderAll();
  },
});
