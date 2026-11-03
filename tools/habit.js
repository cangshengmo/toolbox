/* 百宝箱 · 习惯打卡：每日习惯追踪 */
App.registerTool({
  id: 'habit',
  name: '习惯打卡',
  icon: 'flame',
  desc: '每日习惯追踪',
  order: 20,

  render(el) {
    let habits = App.store.get('habit', 'habits', []);
    if (!Array.isArray(habits)) habits = [];

    el.innerHTML = `
      <div class="card">
        <div class="row">
          <input id="hbIcon" class="input" type="text" maxlength="2" placeholder="图标"
            style="width:64px;flex:0 0 64px;text-align:center;min-height:44px">
          <input id="hbName" class="input grow" type="text" placeholder="习惯名称，如：每天喝水">
          <button id="hbAdd" class="btn btn-primary" style="min-height:44px">添加</button>
        </div>
      </div>
      <div class="card" style="margin-top:0">
        <div class="row" style="margin-bottom:0; align-items:center">
          <button class="icon-btn" id="hbHeatPrev" aria-label="上月" style="min-width:40px;min-height:40px">‹</button>
          <div class="grow" id="hbHeatTitle" style="text-align:center;font-weight:600"></div>
          <button class="icon-btn" id="hbHeatNext" aria-label="下月" style="min-width:40px;min-height:40px">›</button>
        </div>
        <div class="heat-grid" id="hbHeatGrid" style="margin-top:10px"></div>
        <div class="muted" style="font-size:12px;margin-top:8px;text-align:right">颜色深浅 = 当天完成习惯占比</div>
      </div>
      <div class="list" id="hbList" style="margin-top:12px"></div>
      <div class="empty" id="hbEmpty" hidden>还没有习惯，添加一个开始打卡吧</div>`;

    const iconInput = el.querySelector('#hbIcon');
    const nameInput = el.querySelector('#hbName');
    const listEl = el.querySelector('#hbList');
    const emptyEl = el.querySelector('#hbEmpty');
    const heatTitleEl = el.querySelector('#hbHeatTitle');
    const heatGridEl = el.querySelector('#hbHeatGrid');

    /* 热力图当前查看的月份,默认当月 */
    let heatY = new Date().getFullYear();
    let heatM = new Date().getMonth() + 1;

    function fmt(d) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    /* 连续天数：今天已打卡从今天往前数，否则从昨天往前数 */
    function streak(h) {
      const rec = h.records || {};
      const d = new Date();
      if (!rec[fmt(d)]) d.setDate(d.getDate() - 1);
      let n = 0;
      while (rec[fmt(d)]) {
        n++;
        d.setDate(d.getDate() - 1);
      }
      return n;
    }

    function rowInner(h) {
      const rec = h.records || {};
      const today = App.today();
      const doneToday = !!rec[today];
      const btnStyle = doneToday
        ? 'min-width:44px;min-height:44px;font-size:18px;background:var(--accent);border-radius:10px'
        : 'min-width:44px;min-height:44px;font-size:18px';
      let dots = '';
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const on = !!rec[fmt(d)];
        dots += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;`
          + `margin-left:4px;vertical-align:middle;box-sizing:border-box;`
          + (on ? 'background:var(--accent)' : 'border:1px solid #9aa0a6') + `"></span>`;
      }
      return `
        <button class="icon-btn" data-act="toggle" data-id="${App.esc(h.id)}" aria-label="打卡"
          style="${btnStyle}">${App.esc(doneToday ? '✅' : h.icon)}</button>
        <div class="item-main">
          <div class="item-title">${App.esc(h.name)}</div>
          <div class="item-sub">连续 ${streak(h)} 天<span>${dots}</span></div>
        </div>
        <button class="icon-btn" data-act="del" data-id="${App.esc(h.id)}" aria-label="删除"
          style="min-width:44px;min-height:44px">🗑</button>`;
    }

    function renderAll() {
      listEl.innerHTML = habits.map(function (h) {
        return `<div class="item" data-row="${App.esc(h.id)}">${rowInner(h)}</div>`;
      }).join('');
      emptyEl.hidden = habits.length > 0;
    }

    /* 打卡后只更新该行 */
    function updateRow(h) {
      const rowEl = listEl.querySelector('.item[data-row="' + h.id + '"]');
      if (rowEl) rowEl.innerHTML = rowInner(h);
    }

    function save() {
      App.store.set('habit', 'habits', habits);
    }

    function toggleToday(id) {
      const h = habits.find(function (x) { return x.id === id; });
      if (!h) return;
      h.records = h.records || {};
      const today = App.today();
      if (h.records[today]) delete h.records[today];
      else h.records[today] = true;
      save();
      updateRow(h);
      renderHeatmap();
    }

    /* 两击确认删除：首击变"确认删除？"，3 秒内再击执行，超时还原 */
    function armDelete(btn, id) {
      if (btn.dataset.armed === '1') {
        habits = habits.filter(function (x) { return x.id !== id; });
        save();
        renderAll();
        renderHeatmap();
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

    function addHabit() {
      const name = nameInput.value.trim();
      if (!name) { App.toast('请输入习惯名称'); return; }
      const icon = iconInput.value.trim() || '⭐';
      habits.push({ id: App.uid(), name: name, icon: icon, records: {} });
      save();
      iconInput.value = '';
      nameInput.value = '';
      renderAll();
      renderHeatmap();
      nameInput.focus();
    }

    el.querySelector('#hbAdd').addEventListener('click', addHabit);
    nameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') addHabit();
    });

    listEl.addEventListener('click', function (e) {
      const btn = e.target.closest ? e.target.closest('button[data-act]') : null;
      if (!btn) return;
      if (btn.dataset.act === 'toggle') toggleToday(btn.dataset.id);
      else if (btn.dataset.act === 'del') armDelete(btn, btn.dataset.id);
    });

    /* ---------- 月度热力图 ---------- */
    function pad2(x) { return String(x).padStart(2, '0'); }

    /* 统计每天完成的习惯数(跨全部习惯) */
    function heatCounts() {
      const counts = {};
      habits.forEach(function (h) {
        const rec = h.records || {};
        for (const d in rec) {
          if (rec[d]) counts[d] = (counts[d] || 0) + 1;
        }
      });
      return counts;
    }

    function renderHeatmap() {
      heatTitleEl.textContent = heatY + '年' + heatM + '月';
      const daysInMonth = new Date(heatY, heatM, 0).getDate();
      const lead = (new Date(heatY, heatM - 1, 1).getDay() + 6) % 7; /* 周一为第一列 */
      let html = ['一', '二', '三', '四', '五', '六', '日'].map(function (w) {
        return '<div class="heat-cell heat-head">' + w + '</div>';
      }).join('');
      for (let i = 0; i < lead; i++) html += '<div></div>';
      const counts = heatCounts();
      const total = habits.length;
      for (let d = 1; d <= daysInMonth; d++) {
        const ds = heatY + '-' + pad2(heatM) + '-' + pad2(d);
        const n = counts[ds] || 0;
        let level = 0;
        if (total > 0 && n > 0) {
          const r = n / total;
          level = r >= 1 ? 4 : r >= 0.67 ? 3 : r >= 0.34 ? 2 : 1;
        }
        html += '<button class="heat-cell l' + level + '" data-hd="' + ds + '" data-n="' + n + '">' + d + '</button>';
      }
      heatGridEl.innerHTML = html;
    }

    el.querySelector('#hbHeatPrev').addEventListener('click', function () {
      heatM--;
      if (heatM < 1) { heatM = 12; heatY--; }
      renderHeatmap();
    });
    el.querySelector('#hbHeatNext').addEventListener('click', function () {
      heatM++;
      if (heatM > 12) { heatM = 1; heatY++; }
      renderHeatmap();
    });

    heatGridEl.addEventListener('click', function (e) {
      const cell = e.target.closest ? e.target.closest('button[data-hd]') : null;
      if (!cell) return;
      if (habits.length === 0) { App.toast('先添加习惯吧'); return; }
      const ds = cell.dataset.hd;
      const n = cell.dataset.n;
      const md = ds.slice(5).replace('-', '月') + '日';
      App.toast(md + ' 完成 ' + n + '/' + habits.length + ' 个习惯');
    });

    renderAll();
    renderHeatmap();
  },
});
