/* 百宝箱 · 愿望清单:心愿与存钱进度 */
App.registerTool({
  id: 'wish',
  name: '愿望清单',
  icon: 'gift',
  desc: '心愿与存钱进度',
  order: 85,

  render(el) {
    let items = App.store.get('wish', 'items', []);
    if (!Array.isArray(items)) items = [];

    el.innerHTML = `
      <div class="card">
        <div class="row">
          <input id="wsName" class="input grow" type="text" placeholder="心愿,如:新手机">
          <input id="wsTarget" class="input" type="number" min="1" placeholder="目标价" style="flex:0 0 96px" inputmode="decimal">
        </div>
        <button id="wsAdd" class="btn btn-primary" style="width:100%;min-height:42px;margin-bottom:0">加入愿望清单</button>
      </div>
      <div id="wsList"></div>
      <div class="empty" id="wsEmpty" hidden>还没有心愿,许一个吧</div>`;

    const nameEl = el.querySelector('#wsName');
    const targetEl = el.querySelector('#wsTarget');
    const listEl = el.querySelector('#wsList');
    const emptyEl = el.querySelector('#wsEmpty');

    function save() {
      App.store.set('wish', 'items', items);
    }

    function render() {
      listEl.innerHTML = items.map(function (it) {
        const pct = it.target ? Math.min(100, Math.round(it.saved / it.target * 100)) : 0;
        const full = it.target && it.saved >= it.target;
        return `
          <div class="card">
            <div style="display:flex;align-items:baseline;gap:8px">
              <span style="flex:1;min-width:0;font-weight:600;font-size:14.5px;word-break:break-word">${App.esc(it.name)}</span>
              <button class="icon-btn" data-act="del" data-id="${App.esc(it.id)}" aria-label="删除" style="min-width:36px;min-height:36px;font-size:13px">🗑</button>
            </div>
            ${it.target ? `
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:4px">
              <span class="muted" style="font-size:12.5px">已存 <b style="color:var(--accent)">${it.saved}</b> / ${it.target} 元</span>
              <span style="font-weight:700;color:${full ? '#22c55e' : 'var(--accent)'}">${full ? '🎉 够啦!' : pct + '%'}</span>
            </div>
            <div style="height:8px;border-radius:999px;background:color-mix(in srgb, var(--text) 8%, transparent);overflow:hidden;margin-top:6px">
              <div style="height:100%;width:${pct}%;background:${full ? '#22c55e' : 'var(--accent)'};transition:width .3s"></div>
            </div>` : ''}
            <div class="row" style="margin:8px 0 0;gap:6px">
              <button class="btn" data-act="minus" data-id="${App.esc(it.id)}" style="min-height:36px;flex:0 0 44px">−</button>
              <button class="btn btn-primary" data-act="plus" data-id="${App.esc(it.id)}" style="min-height:36px;flex:1">+ 存一点</button>
              <button class="btn" data-act="plus10" data-id="${App.esc(it.id)}" style="min-height:36px;flex:0 0 56px">+10</button>
            </div>
          </div>`;
      }).join('');
      emptyEl.hidden = items.length > 0;
    }

    el.querySelector('#wsAdd').addEventListener('click', function () {
      const name = nameEl.value.trim();
      if (!name) { App.toast('请输入心愿'); return; }
      const target = parseFloat(targetEl.value) || 0;
      items.push({ id: App.uid(), name: name, target: target, saved: 0 });
      save();
      nameEl.value = '';
      targetEl.value = '';
      nameEl.focus();
      render();
    });
    nameEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') el.querySelector('#wsAdd').click();
    });

    listEl.addEventListener('click', function (e) {
      const btn = e.target.closest ? e.target.closest('button[data-act]') : null;
      if (!btn) return;
      const id = btn.dataset.id;
      const it = items.find(function (x) { return x.id === id; });
      if (!it) return;
      if (btn.dataset.act === 'plus' || btn.dataset.act === 'plus10') {
        it.saved += btn.dataset.act === 'plus10' ? 10 : 1;
        save();
        render();
        return;
      }
      if (btn.dataset.act === 'minus') {
        it.saved = Math.max(0, it.saved - 1);
        save();
        render();
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
