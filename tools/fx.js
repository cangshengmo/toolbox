/* 百宝箱 · 汇率换算:手动更新汇率,离线可用 */
App.registerTool({
  id: 'fx',
  name: '汇率换算',
  icon: 'coins',
  desc: '手动汇率离线换算',
  order: 49,

  render(el) {
    const DEFAULTS = {
      CNY: 1,
      USD: 7.12,
      EUR: 7.85,
      JPY: 0.048,
      GBP: 9.10,
      HKD: 0.91,
      KRW: 0.0052,
    };
    const NAMES = { CNY: '人民币', USD: '美元', EUR: '欧元', JPY: '日元', GBP: '英镑', HKD: '港币', KRW: '韩元' };
    let rates = App.store.get('fx', 'rates', null);
    if (!rates || typeof rates !== 'object') rates = Object.assign({}, DEFAULTS);
    let updated = App.store.get('fx', 'updated', '');

    el.innerHTML = `
      <div class="card">
        <div class="row">
          <input id="fxAmt" class="input grow" type="number" step="any" value="100" inputmode="decimal" aria-label="金额">
          <select id="fxFrom" class="select" style="flex:0 0 118px"></select>
        </div>
        <div style="text-align:center;font-size:22px;color:var(--text-2);margin:-2px 0">⇅</div>
        <div class="row" style="margin-bottom:0">
          <div class="input grow" id="fxOut" style="display:flex;align-items:center;font-weight:700;font-size:19px;color:var(--accent);font-variant-numeric:tabular-nums">—</div>
          <select id="fxTo" class="select" style="flex:0 0 118px"></select>
        </div>
        <div class="muted" id="fxRateLine" style="font-size:12px;margin-top:8px;text-align:center"></div>
      </div>
      <div class="card">
        <div class="row" style="align-items:baseline">
          <span class="item-title">汇率表</span>
          <div class="grow"></div>
          <span class="muted" style="font-size:11.5px" id="fxUpdated"></span>
          <button id="fxReset" class="btn" style="min-height:34px;font-size:12.5px">恢复默认</button>
        </div>
        <div id="fxTable"></div>
        <button id="fxSave" class="btn btn-primary" style="width:100%;min-height:40px;margin-top:4px">保存汇率表</button>
        <div class="muted" style="font-size:12px;margin-top:6px">1 单位外币兑多少人民币,手动更新后离线可用</div>
      </div>`;

    const amtEl = el.querySelector('#fxAmt');
    const fromEl = el.querySelector('#fxFrom');
    const toEl = el.querySelector('#fxTo');
    const outEl = el.querySelector('#fxOut');
    const rateLineEl = el.querySelector('#fxRateLine');
    const tableEl = el.querySelector('#fxTable');
    const updatedEl = el.querySelector('#fxUpdated');

    const CODES = Object.keys(NAMES);

    function fillSelects() {
      const opts = CODES.map(function (c) {
        return '<option value="' + c + '">' + c + ' ' + NAMES[c] + '</option>';
      }).join('');
      fromEl.innerHTML = opts;
      toEl.innerHTML = opts;
      fromEl.value = 'CNY';
      toEl.value = 'USD';
    }

    function convert() {
      const amt = parseFloat(amtEl.value);
      if (isNaN(amt)) { outEl.textContent = '—'; rateLineEl.textContent = ''; return; }
      const cny = amt * (rates[fromEl.value] || 1);
      const result = cny / (rates[toEl.value] || 1);
      outEl.textContent = result.toFixed(result >= 100 ? 2 : 4).replace(/\.?0+$/, '') + ' ' + toEl.value;
      const unit = 1 / (rates[fromEl.value] || 1) * (rates[toEl.value] || 1);
      rateLineEl.textContent = '1 ' + fromEl.value + ' = ' + unit.toFixed(6).replace(/0+$/, '').replace(/\.$/, '') + ' ' + toEl.value;
    }

    function renderTable() {
      tableEl.innerHTML = CODES.map(function (c) {
        const ro = c === 'CNY';
        return '<div class="row" style="margin-bottom:8px">'
          + '<span class="muted" style="flex:0 0 96px">' + c + ' ' + NAMES[c] + '</span>'
          + '<input class="input grow" type="number" step="any" inputmode="decimal" data-cur="' + c + '"'
          + (ro ? ' value="1" disabled' : ' value="' + rates[c] + '"') + '></div>';
      }).join('');
    }

    function renderUpdated() {
      updatedEl.textContent = updated ? '更新于 ' + updated : '尚未手动更新';
    }

    [amtEl, fromEl, toEl].forEach(function (elm) {
      elm.addEventListener('input', convert);
      elm.addEventListener('change', convert);
    });

    el.querySelector('#fxSave').addEventListener('click', function () {
      tableEl.querySelectorAll('input[data-cur]').forEach(function (inp) {
        const v = parseFloat(inp.value);
        if (!isNaN(v) && v > 0) rates[inp.dataset.cur] = v;
      });
      updated = App.today();
      App.store.set('fx', 'rates', rates);
      App.store.set('fx', 'updated', updated);
      renderUpdated();
      convert();
      App.toast('汇率表已保存');
    });

    el.querySelector('#fxReset').addEventListener('click', function () {
      rates = Object.assign({}, DEFAULTS);
      updated = '';
      App.store.set('fx', 'rates', rates);
      App.store.set('fx', 'updated', '');
      renderTable();
      renderUpdated();
      convert();
      App.toast('已恢复默认汇率');
    });

    fillSelects();
    renderTable();
    renderUpdated();
    convert();
  },
});
