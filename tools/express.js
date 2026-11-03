/* 百宝箱 · 快递备忘:单号+状态备忘列表 */
App.registerTool({
  id: 'express',
  name: '快递备忘',
  icon: 'package',
  desc: '快递单号状态备忘',
  order: 86,

  render(el) {
    let items = App.store.get('express', 'items', []);
    if (!Array.isArray(items)) items = [];
    const STATUS = ['待发货', '运输中', '派送中', '已签收'];

    el.innerHTML = `
      <div class="card">
        <div class="row">
          <input id="exName" class="input grow" type="text" placeholder="物品,如:键盘">
        </div>
        <div class="row" style="margin-bottom:0">
          <input id="exNo" class="input grow" type="text" placeholder="快递单号" inputmode="numeric">
          <button id="exAdd" class="btn btn-primary" style="min-height:44px">记下</button>
        </div>
      </div>
      <div id="exList"></div>
      <div class="empty" id="exEmpty" hidden>没有待跟进的快递</div>`;

    const nameEl = el.querySelector('#exName');
    const noEl = el.querySelector('#exNo');
    const listEl = el.querySelector('#exList');
    const emptyEl = el.querySelector('#exEmpty');

    function save() {
      App.store.set('express', 'items', items);
    }

    function statusColor(s) {
      return s === '已签收' ? '#22c55e' : s === '派送中' ? 'var(--accent)' : s === '运输中' ? '#f59e0b' : 'var(--text-2)';
    }

    function render() {
      listEl.innerHTML = items.map(function (it) {
        return `
          <div class="item">
            <div class="item-main">
              <div class="item-title">${App.esc(it.name)}
                <span style="font-weight:600;color:${statusColor(it.status)};font-size:12.5px;margin-left:6px">· ${it.status}</span></div>
              <div class="item-sub" style="font-family:ui-monospace,Consolas,monospace">${App.esc(it.no)}</div>
            </div>
            <button class="icon-btn" data-act="next" data-id="${App.esc(it.id)}" aria-label="推进状态" title="推进状态"
              style="min-width:44px;min-height:44px">➡</button>
            <button class="icon-btn" data-act="copy" data-id="${App.esc(it.id)}" aria-label="复制单号" title="复制单号"
              style="min-width:44px;min-height:44px">📋</button>
            <button class="icon-btn" data-act="del" data-id="${App.esc(it.id)}" aria-label="删除"
              style="min-width:44px;min-height:44px">🗑</button>
          </div>`;
      }).join('');
      emptyEl.hidden = items.length > 0;
    }

    el.querySelector('#exAdd').addEventListener('click', function () {
      const name = nameEl.value.trim();
      const no = noEl.value.trim();
      if (!name) { App.toast('请输入物品名'); return; }
      if (!no) { App.toast('请输入单号'); return; }
      items.unshift({ id: App.uid(), name: name, no: no, status: STATUS[0] });
      save();
      nameEl.value = '';
      noEl.value = '';
      nameEl.focus();
      render();
    });
    noEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') el.querySelector('#exAdd').click();
    });

    listEl.addEventListener('click', function (e) {
      const btn = e.target.closest ? e.target.closest('button[data-act]') : null;
      if (!btn) return;
      const id = btn.dataset.id;
      const it = items.find(function (x) { return x.id === id; });
      if (!it) return;
      if (btn.dataset.act === 'next') {
        const i = STATUS.indexOf(it.status);
        it.status = STATUS[Math.min(STATUS.length - 1, i + 1)];
        save();
        render();
        if (it.status === '已签收') App.toast('📦 已签收,可删除了');
        return;
      }
      if (btn.dataset.act === 'copy') {
        navigator.clipboard.writeText(it.no).then(function () { App.toast('单号已复制'); }, function () { App.toast('复制失败'); });
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
