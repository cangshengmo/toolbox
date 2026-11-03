/* 百宝箱 · 体重曲线：记录与趋势折线图 */
App.registerTool({
  id: 'weight',
  name: '体重曲线',
  icon: 'activity',
  desc: '体重记录与趋势',
  order: 82,

  render(el) {
    let entries = App.store.get('weight', 'entries', []);
    if (!Array.isArray(entries)) entries = [];

    el.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <input id="wtDate" class="input" type="date" style="flex:0 0 150px;min-height:44px">
          <input id="wtKg" class="input grow" type="number" step="0.1" min="20" max="300" placeholder="体重(kg)" inputmode="decimal">
          <button id="wtAdd" class="btn btn-primary" style="min-height:44px">记录</button>
        </div>
      </div>
      <div class="card">
        <div class="item-title" style="margin-bottom:8px">趋势(近 30 条)</div>
        <div id="wtChart"></div>
        <div class="muted" id="wtStats" style="font-size:12px;margin-top:6px;text-align:center"></div>
      </div>
      <div class="item-title" style="margin:4px 2px 10px">历史记录</div>
      <div class="list" id="wtList"></div>
      <div class="empty" id="wtEmpty" hidden>还没有记录,先称一下吧</div>`;

    const dateEl = el.querySelector('#wtDate');
    const kgEl = el.querySelector('#wtKg');
    const chartEl = el.querySelector('#wtChart');
    const statsEl = el.querySelector('#wtStats');
    const listEl = el.querySelector('#wtList');
    const emptyEl = el.querySelector('#wtEmpty');
    dateEl.value = App.today();

    function sorted() {
      return [...entries].sort(function (a, b) { return a.date.localeCompare(b.date); });
    }

    function save() {
      App.store.set('weight', 'entries', entries);
    }

    function renderChart() {
      const data = sorted().slice(-30);
      if (!data.length) { chartEl.innerHTML = ''; statsEl.textContent = ''; return; }
      const vals = data.map(function (x) { return x.kg; });
      const min = Math.min.apply(null, vals);
      const max = Math.max.apply(null, vals);
      const span = Math.max(0.5, max - min);
      let svg = '<svg viewBox="0 0 308 96" style="width:100%;height:auto;display:block" aria-hidden="true">';
      svg += '<line x1="0" y1="84" x2="308" y2="84" stroke="var(--border)" stroke-width="1" />';
      const pts = data.map(function (x, i) {
        return { x: 4 + (data.length === 1 ? 150 : i * (300 / (data.length - 1))), y: 84 - (x.kg - min) / span * 64 };
      });
      if (pts.length > 1) {
        svg += '<polyline points="' + pts.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ')
          + '" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />';
      }
      pts.forEach(function (p) {
        svg += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="3.5" fill="var(--accent)" />';
      });
      svg += '<text x="4" y="12" font-size="10" fill="var(--text-2)">' + max.toFixed(1) + '</text>';
      svg += '<text x="4" y="80" font-size="10" fill="var(--text-2)">' + min.toFixed(1) + '</text>';
      svg += '</svg>';
      chartEl.innerHTML = svg;
      const last = vals[vals.length - 1];
      const prev = vals.length > 1 ? vals[vals.length - 2] : null;
      const diff = prev === null ? '' : (last - prev >= 0 ? ' ↑' : ' ↓') + Math.abs(last - prev).toFixed(1);
      const avg = vals.reduce(function (s, v) { return s + v; }, 0) / vals.length;
      statsEl.textContent = '最新 ' + last.toFixed(1) + 'kg' + diff + ' · 均值 ' + avg.toFixed(1) + ' · 最低 ' + min.toFixed(1) + ' · 最高 ' + max.toFixed(1);
    }

    function renderList() {
      const rows = [...entries].sort(function (a, b) { return b.date.localeCompare(a.date); });
      listEl.innerHTML = rows.map(function (it) {
        return `
          <div class="item">
            <div class="item-main">
              <div class="item-title">${it.kg.toFixed(1)} kg</div>
              <div class="item-sub">${App.esc(it.date)}</div>
            </div>
            <button class="icon-btn" data-act="del" data-id="${App.esc(it.id)}" aria-label="删除"
              style="min-width:44px;min-height:44px">🗑</button>
          </div>`;
      }).join('');
      emptyEl.hidden = entries.length > 0;
    }

    function renderAll() {
      renderChart();
      renderList();
    }

    function add() {
      const date = dateEl.value;
      const kg = parseFloat(kgEl.value);
      if (!date) { App.toast('请选择日期'); return; }
      if (!kg || kg < 20 || kg > 300) { App.toast('请输入合理体重(kg)'); return; }
      const exist = entries.find(function (x) { return x.date === date; });
      if (exist) { exist.kg = kg; App.toast('已更新当天记录'); }
      else entries.push({ id: App.uid(), date: date, kg: kg });
      save();
      kgEl.value = '';
      renderAll();
    }

    el.querySelector('#wtAdd').addEventListener('click', add);
    kgEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') add();
    });

    listEl.addEventListener('click', function (e) {
      const btn = e.target.closest ? e.target.closest('button[data-act="del"]') : null;
      if (!btn) return;
      if (btn.dataset.armed === '1') {
        entries = entries.filter(function (x) { return x.id !== btn.dataset.id; });
        save();
        renderAll();
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
    });

    renderAll();
  },
});
