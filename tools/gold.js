/* 百宝箱 · 黄金估价:克重×当日金价快速估算 */
App.registerTool({
  id: 'gold',
  name: '黄金估价',
  icon: 'circle-dollar-sign',
  desc: '克重乘金价速算',
  order: 88,

  render(el) {
    let price = App.store.get('gold', 'price', 0);
    let items = App.store.get('gold', 'items', []);
    if (!Array.isArray(items)) items = [];

    el.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <span class="muted" style="flex:0 0 auto">今日金价</span>
          <input id="gdPrice" class="input grow" type="number" step="0.01" min="0" placeholder="元/克" value="${price || ''}" inputmode="decimal">
          <button id="gdSave" class="btn btn-primary" style="min-height:44px">保存</button>
        </div>
      </div>
      <div class="card">
        <div class="row">
          <input id="gdName" class="input grow" type="text" placeholder="条目,如:手镯">
          <input id="gdW" class="input" type="number" step="0.01" min="0" placeholder="克重" style="flex:0 0 96px" inputmode="decimal">
        </div>
        <button id="gdAdd" class="btn btn-primary" style="width:100%;min-height:42px;margin-bottom:0">加一条</button>
      </div>
      <div id="gdList"></div>
      <div class="card" id="gdTotal" hidden style="text-align:center">
        <div class="muted" style="font-size:12.5px">合计估价</div>
        <div style="font-size:30px;font-weight:700;color:var(--accent)" id="gdSum">0 元</div>
      </div>
      <div class="empty" id="gdEmpty" hidden>先填金价,再加条目估算</div>`;

    const priceEl = el.querySelector('#gdPrice');
    const nameEl = el.querySelector('#gdName');
    const wEl = el.querySelector('#gdW');
    const listEl = el.querySelector('#gdList');
    const totalEl = el.querySelector('#gdTotal');
    const sumEl = el.querySelector('#gdSum');
    const emptyEl = el.querySelector('#gdEmpty');

    function save() {
      App.store.set('gold', 'price', price);
      App.store.set('gold', 'items', items);
    }

    function render() {
      const p = price > 0;
      let sum = 0;
      listEl.innerHTML = items.map(function (it) {
        const v = p ? it.w * price : 0;
        sum += v;
        return '<div class="item" style="padding:9px 12px">'
          + '<div class="item-main"><div class="item-title" style="font-size:14px">' + App.esc(it.name) + '</div>'
          + '<div class="item-sub">' + it.w + ' 克</div></div>'
          + '<span style="font-weight:600">' + (p ? (v.toFixed(0) + ' 元') : '—') + '</span>'
          + '<button class="icon-btn" data-del="' + App.esc(it.id) + '" aria-label="删除" style="min-width:40px;min-height:40px">🗑</button></div>';
      }).join('');
      totalEl.hidden = !items.length;
      sumEl.textContent = sum.toFixed(0) + ' 元';
      emptyEl.hidden = !!items.length || p;
      if (!items.length && p) emptyEl.hidden = false;
    }

    el.querySelector('#gdSave').addEventListener('click', function () {
      const v = parseFloat(priceEl.value);
      if (!v || v <= 0) { App.toast('请输入有效金价'); return; }
      price = v;
      save();
      render();
      App.toast('金价已保存');
    });
    priceEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') el.querySelector('#gdSave').click();
    });

    el.querySelector('#gdAdd').addEventListener('click', function () {
      const name = nameEl.value.trim();
      const w = parseFloat(wEl.value);
      if (!name) { App.toast('请输入条目名'); return; }
      if (!w || w <= 0) { App.toast('请输入克重'); return; }
      items.push({ id: App.uid(), name: name, w: w });
      save();
      nameEl.value = '';
      wEl.value = '';
      nameEl.focus();
      render();
    });

    listEl.addEventListener('click', function (e) {
      const btn = e.target.closest ? e.target.closest('button[data-del]') : null;
      if (!btn) return;
      if (btn.dataset.armed === '1') {
        items = items.filter(function (x) { return x.id !== btn.dataset.del; });
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
    });

    render();
  },
});
