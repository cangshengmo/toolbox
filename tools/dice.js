/* 百宝箱 · 骰子套装：1-6 颗 D6/D20,可加总 */
App.registerTool({
  id: 'dice',
  name: '骰子套装',
  icon: 'dices',
  desc: 'D6/D20多骰加总',
  order: 62,

  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <select id="dcType" class="select" style="flex:0 0 110px">
            <option value="6">D6 六面</option>
            <option value="20">D20 二十面</option>
          </select>
          <select id="dcCount" class="select grow">
            <option value="1">1 颗</option>
            <option value="2">2 颗</option>
            <option value="3">3 颗</option>
            <option value="4">4 颗</option>
            <option value="5">5 颗</option>
            <option value="6">6 颗</option>
          </select>
          <button id="dcRoll" class="btn btn-primary" style="min-height:44px;min-width:88px">🎲 掷</button>
        </div>
      </div>
      <div class="card" id="dcOut" style="text-align:center;min-height:110px">
        <div class="muted" id="dcHint">选好类型和数量,掷!</div>
        <div id="dcVals" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:10px"></div>
        <div id="dcTotal" style="font-size:30px;font-weight:700;color:var(--accent);margin-top:8px;font-variant-numeric:tabular-nums"></div>
      </div>
      <div class="item-title" style="margin:4px 2px 10px">历史</div>
      <div id="dcHis" class="list"></div>
      <div class="empty" id="dcEmpty" hidden>还没有掷过</div>`;

    const typeEl = el.querySelector('#dcType');
    const countEl = el.querySelector('#dcCount');
    const outEl = el.querySelector('#dcOut');
    const hintEl = el.querySelector('#dcHint');
    const valsEl = el.querySelector('#dcVals');
    const totalEl = el.querySelector('#dcTotal');
    const hisEl = el.querySelector('#dcHis');
    const emptyEl = el.querySelector('#dcEmpty');

    let history = App.store.get('dice', 'history', []);
    if (!Array.isArray(history)) history = [];

    function save() {
      App.store.set('dice', 'history', history.slice(0, 20));
    }

    function chip(v, faces) {
      const hot = faces === 20 && v === 20;
      const low = faces === 20 && v === 1;
      const bg = hot ? 'var(--accent)' : low ? 'var(--danger)' : 'color-mix(in srgb, var(--text) 8%, transparent)';
      const fg = (hot || low) ? '#fff' : 'var(--text)';
      return '<div style="min-width:52px;padding:10px 8px;border-radius:12px;background:' + bg + ';color:' + fg
        + ';font-size:22px;font-weight:700;font-variant-numeric:tabular-nums">' + v + '</div>';
    }

    function roll() {
      const faces = +typeEl.value;
      const n = +countEl.value;
      const vals = [];
      for (let i = 0; i < n; i++) vals.push(rnd(faces) + 1);
      function rnd(f) { return Math.floor(Math.random() * f); }
      const total = vals.reduce(function (a, b) { return a + b; }, 0);
      hintEl.textContent = 'D' + faces + ' × ' + n;
      valsEl.innerHTML = vals.map(function (v) { return chip(v, faces); }).join('');
      totalEl.textContent = n > 1 ? '总点数 ' + total : '';
      history.unshift({ t: typeEl.value, n: n, v: vals, total: total });
      history = history.slice(0, 20);
      save();
      renderHis();
      App.beep(1);
    }

    function renderHis() {
      hisEl.innerHTML = history.map(function (h) {
        return '<div class="item" style="padding:8px 12px">'
          + '<div class="item-main"><div class="item-title" style="font-size:13.5px;font-family:ui-monospace,Consolas,monospace">'
          + h.v.join(' + ') + '</div>'
          + '<div class="item-sub">D' + h.t + ' × ' + h.n + (h.n > 1 ? ' = ' + h.total : '') + '</div></div>'
          + '</div>';
      }).join('');
      emptyEl.hidden = history.length > 0;
    }

    el.querySelector('#dcRoll').addEventListener('click', roll);

    renderHis();
  },
});
