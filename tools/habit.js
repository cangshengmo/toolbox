/* 百宝箱 · 习惯打卡：每日习惯追踪 */
App.registerTool({
  id: 'habit',
  name: '习惯打卡',
  icon: '🔥',
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
      <div class="list" id="hbList" style="margin-top:12px"></div>
      <div class="empty" id="hbEmpty" hidden>还没有习惯，添加一个开始打卡吧</div>`;

    const iconInput = el.querySelector('#hbIcon');
    const nameInput = el.querySelector('#hbName');
    const listEl = el.querySelector('#hbList');
    const emptyEl = el.querySelector('#hbEmpty');

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
    }

    /* 两击确认删除：首击变"确认删除？"，3 秒内再击执行，超时还原 */
    function armDelete(btn, id) {
      if (btn.dataset.armed === '1') {
        habits = habits.filter(function (x) { return x.id !== id; });
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

    function addHabit() {
      const name = nameInput.value.trim();
      if (!name) { App.toast('请输入习惯名称'); return; }
      const icon = iconInput.value.trim() || '⭐';
      habits.push({ id: App.uid(), name: name, icon: icon, records: {} });
      save();
      iconInput.value = '';
      nameInput.value = '';
      renderAll();
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

    renderAll();
  },
});
