/* 百宝箱 · AA 分账:聚会记账自动算每人该付多少 */
App.registerTool({
  id: 'aa',
  name: 'AA 分账',
  icon: 'users',
  desc: '聚会分账与转账建议',
  order: 83,

  render(el) {
    let session = App.store.get('aa', 'session', { people: [], expenses: [] });
    if (!session || typeof session !== 'object' || Array.isArray(session)) session = { people: [], expenses: [] };
    if (!Array.isArray(session.people)) session.people = [];
    if (!Array.isArray(session.expenses)) session.expenses = [];

    el.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <input id="aaPerson" class="input grow" type="text" placeholder="参与人昵称">
          <button id="aaPersonAdd" class="btn btn-primary" style="min-height:44px">加人</button>
        </div>
      </div>
      <div class="card" id="aaExpCard" hidden>
        <div class="row">
          <input id="aaName" class="input grow" type="text" placeholder="花销项目,如:晚饭">
          <input id="aaAmt" class="input" type="number" step="0.01" min="0" placeholder="金额" style="flex:0 0 96px" inputmode="decimal">
        </div>
        <div class="row" style="margin-bottom:0">
          <select id="aaPayer" class="select grow"></select>
          <button id="aaExpAdd" class="btn btn-primary" style="min-height:44px">记账</button>
        </div>
      </div>
      <div id="aaOut"></div>`;

    const personEl = el.querySelector('#aaPerson');
    const expCardEl = el.querySelector('#aaExpCard');
    const nameEl = el.querySelector('#aaName');
    const amtEl = el.querySelector('#aaAmt');
    const payerEl = el.querySelector('#aaPayer');
    const outEl = el.querySelector('#aaOut');

    function save() {
      App.store.set('aa', 'session', session);
    }

    function renderPayers() {
      payerEl.innerHTML = session.people.map(function (p) {
        return '<option value="' + App.esc(p) + '">' + App.esc(p) + '</option>';
      }).join('');
    }

    function render() {
      expCardEl.hidden = session.people.length === 0;
      renderPayers();
      const n = session.people.length;
      if (!n) {
        outEl.innerHTML = '<div class="empty">先添加参与人(至少 2 人更好算)</div>';
        return;
      }
      const paid = {};
      session.people.forEach(function (p) { paid[p] = 0; });
      let total = 0;
      session.expenses.forEach(function (x) {
        if (paid[x.payer] === undefined) return;
        paid[x.payer] += x.amount;
        total += x.amount;
      });
      const share = total / n;
      let html = '<div class="card">'
        + '<div style="display:flex;justify-content:space-between;align-items:baseline">'
        + '<span class="item-title">总支出</span><span style="font-size:24px;font-weight:700;color:var(--accent)">'
        + total.toFixed(2) + ' 元</span></div>'
        + '<div class="muted" style="font-size:12.5px;margin-top:2px">' + n + ' 人均摊,每人 ' + share.toFixed(2) + ' 元</div>';
      const balances = session.people.map(function (p) {
        return { name: p, diff: paid[p] - share };
      });
      html += '<div style="margin-top:10px">' + balances.map(function (b) {
        const color = b.diff > 0.005 ? '#22c55e' : b.diff < -0.005 ? 'var(--danger)' : 'var(--text-2)';
        const label = b.diff > 0.005 ? '应收 ' : b.diff < -0.005 ? '应付 ' : '已平 ';
        return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-top:1px solid var(--border);font-size:13.5px">'
          + '<span>' + App.esc(b.name) + '<span class="muted" style="font-size:11.5px">(垫 ' + paid[b.name].toFixed(2) + ')</span></span>'
          + '<span style="color:' + color + ';font-weight:600">' + label + Math.abs(b.diff).toFixed(2) + '</span></div>';
      }).join('') + '</div>';
      /* 转账建议:贪心配对债权债务 */
      const cred = balances.filter(function (b) { return b.diff > 0.005; }).map(function (b) { return { name: b.name, v: b.diff }; });
      const debt = balances.filter(function (b) { return b.diff < -0.005; }).map(function (b) { return { name: b.name, v: -b.diff }; });
      cred.sort(function (a, b) { return b.v - a.v; });
      debt.sort(function (a, b) { return b.v - a.v; });
      const moves = [];
      let ci = 0, di = 0;
      while (ci < cred.length && di < debt.length) {
        const amt = Math.min(cred[ci].v, debt[di].v);
        if (amt > 0.005) moves.push(debt[di].name + ' → ' + cred[ci].name + ':' + amt.toFixed(2) + ' 元');
        cred[ci].v -= amt;
        debt[di].v -= amt;
        if (cred[ci].v <= 0.005) ci++;
        if (debt[di].v <= 0.005) di++;
      }
      html += '<div style="margin-top:10px;font-size:13.5px">'
        + (moves.length ? '<div class="item-title" style="margin-bottom:6px">转账建议</div>'
          + moves.map(function (m) { return '<div style="padding:4px 0;border-top:1px solid var(--border)">' + App.esc(m) + '</div>'; }).join('')
          : (total > 0 ? '<div class="muted" style="text-align:center">已两清,无需转账</div>' : ''))
        + '</div></div>';
      /* 花销明细 */
      if (session.expenses.length) {
        html += '<div class="item-title" style="margin:12px 2px 10px">花销明细</div>'
          + session.expenses.map(function (x) {
            return '<div class="item" style="padding:8px 12px">'
              + '<div class="item-main"><div class="item-title" style="font-size:13.5px">' + App.esc(x.name) + '</div>'
              + '<div class="item-sub">' + App.esc(x.payer) + ' 垫付</div></div>'
              + '<span style="font-weight:600">' + x.amount.toFixed(2) + '</span>'
              + '<button class="icon-btn" data-del="' + App.esc(x.id) + '" aria-label="删除" style="min-width:40px;min-height:40px">🗑</button></div>';
          }).join('');
      }
      outEl.innerHTML = html;
    }

    el.querySelector('#aaPersonAdd').addEventListener('click', function () {
      const name = personEl.value.trim();
      if (!name) { App.toast('请输入昵称'); return; }
      if (session.people.indexOf(name) !== -1) { App.toast('已存在'); return; }
      session.people.push(name);
      save();
      personEl.value = '';
      personEl.focus();
      render();
    });
    personEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') el.querySelector('#aaPersonAdd').click();
    });

    el.querySelector('#aaExpAdd').addEventListener('click', function () {
      const name = nameEl.value.trim();
      const amount = parseFloat(amtEl.value);
      if (!name) { App.toast('请输入花销项目'); return; }
      if (!amount || amount <= 0) { App.toast('请输入金额'); return; }
      if (!payerEl.value) { App.toast('请选垫付人'); return; }
      session.expenses.push({ id: App.uid(), name: name, amount: amount, payer: payerEl.value });
      save();
      nameEl.value = '';
      amtEl.value = '';
      render();
    });

    outEl.addEventListener('click', function (e) {
      const btn = e.target.closest ? e.target.closest('button[data-del]') : null;
      if (!btn) return;
      if (btn.dataset.armed === '1') {
        session.expenses = session.expenses.filter(function (x) { return x.id !== btn.dataset.del; });
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
