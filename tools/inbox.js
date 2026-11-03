/* 百宝箱 · 收件箱速记:一键速记,稍后整理进各工具 */
App.registerTool({
  id: 'inbox',
  name: '收件箱速记',
  icon: 'inbox',
  desc: '一键速记稍后整理',
  order: 6,

  render(el) {
    let items = App.store.get('inbox', 'items', []);
    if (!Array.isArray(items)) items = [];

    el.innerHTML = `
      <div class="card">
        <textarea id="ibText" class="input" style="min-height:72px" placeholder="想到什么记什么,回车或点按钮收进收件箱"></textarea>
        <button id="ibAdd" class="btn btn-primary" style="width:100%;min-height:44px;margin-top:10px">⚡ 收进收件箱</button>
      </div>
      <div class="muted" style="font-size:12px;margin:0 2px 10px">共 ${items.length} 条 · 「转待办」会移入待办清单</div>
      <div class="list" id="ibList"></div>
      <div class="empty" id="ibEmpty" hidden>收件箱是空的,速记一条吧</div>`;

    const textEl = el.querySelector('#ibText');
    const listEl = el.querySelector('#ibList');
    const emptyEl = el.querySelector('#ibEmpty');

    function save() {
      App.store.set('inbox', 'items', items);
    }

    function render() {
      listEl.innerHTML = [...items].reverse().map(function (it) {
        return `
          <div class="item">
            <div class="item-main">
              <div class="item-title" style="font-size:14px;white-space:pre-wrap;word-break:break-word">${App.esc(it.text)}</div>
              <div class="item-sub">${App.esc(it.date)}</div>
            </div>
            <button class="icon-btn" data-act="todo" data-id="${App.esc(it.id)}" aria-label="转待办"
              style="min-width:44px;min-height:44px;font-size:15px" title="转待办">✅</button>
            <button class="icon-btn" data-act="copy" data-id="${App.esc(it.id)}" aria-label="复制"
              style="min-width:44px;min-height:44px;font-size:15px" title="复制">📋</button>
            <button class="icon-btn" data-act="del" data-id="${App.esc(it.id)}" aria-label="删除"
              style="min-width:44px;min-height:44px">🗑</button>
          </div>`;
      }).join('');
      emptyEl.hidden = items.length > 0;
    }

    function add() {
      const text = textEl.value.trim();
      if (!text) { App.toast('写点什么吧'); return; }
      items.push({ id: App.uid(), text: text, date: App.today() });
      save();
      textEl.value = '';
      textEl.focus();
      render();
      App.toast('已收进收件箱');
    }

    el.querySelector('#ibAdd').addEventListener('click', add);
    textEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); add(); }
    });

    listEl.addEventListener('click', function (e) {
      const btn = e.target.closest ? e.target.closest('button[data-act]') : null;
      if (!btn) return;
      const id = btn.dataset.id;
      const it = items.find(function (x) { return x.id === id; });
      if (!it) return;
      if (btn.dataset.act === 'copy') {
        navigator.clipboard.writeText(it.text).then(function () { App.toast('已复制'); }, function () { App.toast('复制失败'); });
        return;
      }
      if (btn.dataset.act === 'todo') {
        const list = App.store.get('todo', 'list', []);
        if (Array.isArray(list)) {
          list.unshift({ id: App.uid(), text: it.text.split('\n')[0], done: false, q: 2, created: App.today() });
          App.store.set('todo', 'list', list);
        }
        items = items.filter(function (x) { return x.id !== id; });
        save();
        render();
        App.toast('已转待办');
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
