/* 百宝箱 · 心情日记：每日心情+短记，心情曲线 */
App.registerTool({
  id: 'mood',
  name: '心情日记',
  icon: 'smile',
  desc: '每日心情与短记曲线',
  order: 71,

  render(el) {
    let entries = App.store.get('mood', 'entries', []);
    if (!Array.isArray(entries)) entries = [];

    const MOODS = [
      { e: '😄', s: 5, label: '很好' },
      { e: '🙂', s: 4, label: '不错' },
      { e: '😐', s: 3, label: '一般' },
      { e: '😞', s: 2, label: '不佳' },
      { e: '😢', s: 1, label: '糟糕' },
    ];

    el.innerHTML = `
      <div class="card">
        <div class="item-title" style="margin-bottom:10px">今天感觉怎么样？</div>
        <div class="row" id="mdPicker" style="gap:6px;margin-bottom:0">
          ${MOODS.map(function (m, i) {
            return `<button class="btn" data-mood="${m.s}" aria-label="${m.label}" style="flex:1;min-width:0;padding:0 6px;min-height:48px;font-size:24px">${m.e}</button>`;
          }).join('')}
        </div>
        <textarea id="mdNote" class="input" style="margin-top:10px" placeholder="写点什么…（可选）"></textarea>
        <button id="mdSave" class="btn btn-primary" style="width:100%;margin-top:10px">保存今天</button>
      </div>
      <div class="card">
        <div class="item-title" style="margin-bottom:10px">近 14 天心情曲线</div>
        <div id="mdChart"></div>
        <div class="muted" style="font-size:12px;margin-top:6px">😢 1 · 😞 2 · 😐 3 · 🙂 4 · 😄 5</div>
        <div class="empty" id="mdChartEmpty" hidden>还没有记录，先保存今天的心情吧</div>
      </div>
      <div class="item-title" style="margin:4px 2px 10px">历史记录</div>
      <div class="list" id="mdList"></div>
      <div class="empty" id="mdEmpty" hidden>还没有心情记录</div>`;

    const noteInput = el.querySelector('#mdNote');
    const saveBtn = el.querySelector('#mdSave');
    const pickerEl = el.querySelector('#mdPicker');
    const chartEl = el.querySelector('#mdChart');
    const chartEmptyEl = el.querySelector('#mdChartEmpty');
    const listEl = el.querySelector('#mdList');
    const emptyEl = el.querySelector('#mdEmpty');
    let sel = 0;
    const todayEntry = entries.find(function (x) { return x.date === App.today(); });
    if (todayEntry) sel = todayEntry.mood;

    function save() {
      App.store.set('mood', 'entries', entries);
    }

    function renderPicker() {
      pickerEl.querySelectorAll('button').forEach(function (b) {
        const on = +b.dataset.mood === sel;
        b.style.background = on ? 'var(--accent)' : '';
        b.style.borderColor = on ? 'transparent' : '';
        b.style.color = on ? '#fff' : '';
      });
      saveBtn.textContent = entries.some(function (x) { return x.date === App.today(); }) ? '更新今天' : '保存今天';
    }

    /* 近 14 天曲线:SVG 折线,缺记录的日子断开 */
    function renderChart() {
      const days = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
      }
      const pts = days.map(function (ds, i) {
        const it = entries.find(function (x) { return x.date === ds; });
        return it ? { x: 4 + i * (300 / 13), y: 82 - (it.mood - 1) * 16, m: it.mood } : null;
      });
      const segs = [];
      let run = [];
      pts.forEach(function (p) {
        if (p) run.push(p);
        else if (run.length) { segs.push(run); run = []; }
      });
      if (run.length) segs.push(run);
      let svg = '<svg viewBox="0 0 308 92" style="width:100%;height:auto;display:block" aria-hidden="true">';
      svg += '<line x1="0" y1="82" x2="308" y2="82" stroke="var(--border)" stroke-width="1" />';
      segs.forEach(function (seg) {
        if (seg.length > 1) {
          svg += '<polyline points="' + seg.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ')
            + '" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />';
        }
      });
      pts.forEach(function (p, i) {
        if (p) svg += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="3.5" fill="var(--accent)" />';
      });
      svg += '</svg>';
      chartEl.innerHTML = svg;
      chartEmptyEl.hidden = pts.some(function (p) { return p; });
    }

    function renderList() {
      listEl.innerHTML = [...entries].sort(function (a, b) { return b.date.localeCompare(a.date); }).map(function (it) {
        const m = MOODS.find(function (x) { return x.s === it.mood; }) || MOODS[2];
        return `
          <div class="item">
            <div style="font-size:24px" aria-hidden="true">${m.e}</div>
            <div class="item-main">
              <div class="item-title">${App.esc(it.date)}</div>
              <div class="item-sub">${it.note ? App.esc(it.note) : '(无短记)'}</div>
            </div>
            <button class="icon-btn" data-act="del" data-id="${App.esc(it.id)}" aria-label="删除"
              style="min-width:44px;min-height:44px">🗑</button>
          </div>`;
      }).join('');
      emptyEl.hidden = entries.length > 0;
    }

    function renderAll() {
      renderPicker();
      renderChart();
      renderList();
    }

    pickerEl.addEventListener('click', function (e) {
      const b = e.target.closest ? e.target.closest('button[data-mood]') : null;
      if (!b) return;
      sel = +b.dataset.mood;
      renderPicker();
    });

    saveBtn.addEventListener('click', function () {
      if (!sel) { App.toast('先选一个心情'); return; }
      const today = App.today();
      const exist = entries.find(function (x) { return x.date === today; });
      if (exist) {
        exist.mood = sel;
        exist.note = noteInput.value.trim();
      } else {
        entries.push({ id: App.uid(), date: today, mood: sel, note: noteInput.value.trim() });
      }
      save();
      noteInput.value = '';
      renderAll();
      App.toast('已记录今天的心情 ' + ((MOODS.find(function (x) { return x.s === sel; }) || {}).e));
    });

    noteInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveBtn.click();
      }
    });

    listEl.addEventListener('click', function (e) {
      const btn = e.target.closest ? e.target.closest('button[data-act]') : null;
      if (!btn) return;
      if (btn.dataset.act === 'del') {
        if (btn.dataset.armed === '1') {
          entries = entries.filter(function (x) { return x.id !== btn.dataset.id; });
          save();
          if (sel && !entries.some(function (x) { return x.date === App.today(); })) {
            sel = 0;
          }
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
    });

    renderAll();
  },
});
