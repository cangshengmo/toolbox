/* 百宝箱 · 购物清单：可勾选、可复用的采购单 */
App.registerTool({
  id: 'shopping',
  name: '购物清单',
  icon: 'shopping-cart',
  desc: '可勾选、可复用的采购单',
  order: 79,

  render(el) {
    let items = App.store.get('shopping', 'items', []);
    if (!Array.isArray(items)) items = [];
    let frequent = App.store.get('shopping', 'frequent', []);
    if (!Array.isArray(frequent)) frequent = [];

    el.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <input id="spInput" class="input grow" type="text" placeholder="要买什么？">
          <button id="spAdd" class="btn btn-primary" style="min-height:44px">添加</button>
        </div>
      </div>
      <div class="card" id="spFreqCard" hidden>
        <div class="muted" style="font-size:12.5px;margin-bottom:8px">常买(点一下加回清单)</div>
        <div id="spFreq" style="display:flex;flex-wrap:wrap;gap:8px"></div>
      </div>
      <div class="card">
        <div class="row" style="margin-bottom:8px">
          <span class="item-title" style="font-size:14px">👨‍👩‍👧 家庭共享(离线)</span>
        </div>
        <div class="row" style="margin-bottom:0">
          <button id="spShare" class="btn btn-primary grow" style="min-height:42px">📤 分享清单给家人</button>
          <button id="spImportBtn" class="btn grow" style="min-height:42px">📥 导入家人清单</button>
        </div>
        <div id="spImportBox" hidden style="margin-top:10px">
          <textarea id="spImportText" class="input" style="min-height:80px;font-size:13px" placeholder="粘贴家人分享的清单文本"></textarea>
          <button id="spImportGo" class="btn btn-primary" style="width:100%;min-height:40px;margin-top:6px">合并进我的清单</button>
        </div>
        <div class="muted" style="font-size:11.5px;margin-top:6px">无后端方案:文本互通,各存各的;待购项前标 ▢,已购标 ☑</div>
      </div>
      <div class="list" id="spList" style="margin-top:12px"></div>
      <div class="empty" id="spEmpty" hidden>清单是空的，添加第一件吧</div>
      <div class="row" id="spFooter" hidden style="margin-top:12px">
        <span class="muted" id="spDoneInfo"></span>
        <div class="grow"></div>
        <button id="spClear" class="btn btn-danger" style="min-height:44px">清空已购</button>
      </div>`;

    const input = el.querySelector('#spInput');
    const listEl = el.querySelector('#spList');
    const emptyEl = el.querySelector('#spEmpty');
    const footerEl = el.querySelector('#spFooter');
    const freqCardEl = el.querySelector('#spFreqCard');
    const freqEl = el.querySelector('#spFreq');
    const doneInfoEl = el.querySelector('#spDoneInfo');
    const clearBtn = el.querySelector('#spClear');

    function save() {
      App.store.set('shopping', 'items', items);
      App.store.set('shopping', 'frequent', frequent);
    }

    function renderFreq() {
      freqCardEl.hidden = frequent.length === 0;
      freqEl.innerHTML = frequent.map(function (name) {
        return '<button class="chip" data-freq="' + App.esc(name) + '">' + App.esc(name) + '</button>';
      }).join('');
    }

    function renderList() {
      listEl.innerHTML = items.map(function (it) {
        const titleStyle = it.done ? ' style="text-decoration:line-through;opacity:.45"' : '';
        return `
          <div class="item">
            <button class="icon-btn" data-act="toggle" data-id="${App.esc(it.id)}"
              aria-label="${it.done ? '标记为未买' : '标记为已买'}"
              style="min-width:44px;min-height:44px;font-size:18px">${it.done ? '✅' : '⬜'}</button>
            <div class="item-main">
              <div class="item-title"${titleStyle}>${App.esc(it.name)}</div>
            </div>
            <button class="icon-btn" data-act="del" data-id="${App.esc(it.id)}"
              aria-label="删除" style="min-width:44px;min-height:44px">🗑</button>
          </div>`;
      }).join('');
      const doneCount = items.filter(function (it) { return it.done; }).length;
      emptyEl.hidden = items.length > 0;
      footerEl.hidden = items.length === 0;
      doneInfoEl.textContent = '已购 ' + doneCount + ' / ' + items.length + ' 项';
      clearBtn.disabled = doneCount === 0;
    }

    function renderAll() {
      renderFreq();
      renderList();
    }

    function addItem(name) {
      name = (name || '').trim();
      if (!name) { App.toast('请输入商品名'); return; }
      const dup = items.some(function (it) { return it.name === name; });
      if (dup) { App.toast('清单里已经有了'); return; }
      items.unshift({ id: App.uid(), name: name, done: false });
      save();
      renderList();
    }

    el.querySelector('#spAdd').addEventListener('click', function () {
      addItem(input.value);
      input.value = '';
      input.focus();
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        addItem(input.value);
        input.value = '';
        input.focus();
      }
    });

    freqEl.addEventListener('click', function (e) {
      const chip = e.target.closest ? e.target.closest('button[data-freq]') : null;
      if (!chip) return;
      addItem(chip.dataset.freq);
    });

    listEl.addEventListener('click', function (e) {
      const btn = e.target.closest ? e.target.closest('button[data-act]') : null;
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.act === 'toggle') {
        const it = items.find(function (x) { return x.id === id; });
        if (!it) return;
        it.done = !it.done;
        save();
        renderList();
      } else if (btn.dataset.act === 'del') {
        if (btn.dataset.armed === '1') {
          items = items.filter(function (x) { return x.id !== id; });
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
    });

    /* 清空已购:勾选过的商品名存入"常买"(去重,最多 20 个),再从清单移除 */
    clearBtn.addEventListener('click', function () {
      const bought = items.filter(function (it) { return it.done; }).map(function (it) { return it.name; });
      if (!bought.length) return;
      bought.forEach(function (name) {
        if (frequent.indexOf(name) === -1) {
          frequent.unshift(name);
        }
      });
      frequent = frequent.slice(0, 20);
      items = items.filter(function (it) { return !it.done; });
      save();
      renderAll();
      App.toast('已归入常买,下次一键加回');
    });

    /* ---------- 家庭共享(离线文本互通,#55) ---------- */
    function listText() {
      const lines = items.map(function (it) {
        return (it.done ? '☑ ' : '▢ ') + it.name;
      });
      return '🛒 百宝箱购物清单\n' + (lines.length ? lines.join('\n') : '(空)');
    }

    el.querySelector('#spShare').addEventListener('click', function () {
      const text = listText();
      if (navigator.share) {
        navigator.share({ title: '购物清单', text: text }).catch(function () { /* 用户取消 */ });
      } else {
        navigator.clipboard.writeText(text).then(function () { App.toast('已复制清单文本,发给家人吧'); }, function () { App.toast('复制失败'); });
      }
    });

    el.querySelector('#spImportBtn').addEventListener('click', function () {
      const box = el.querySelector('#spImportBox');
      box.hidden = !box.hidden;
    });

    el.querySelector('#spImportGo').addEventListener('click', function () {
      const raw = el.querySelector('#spImportText').value;
      let added = 0;
      raw.split('\n').forEach(function (line) {
        const name = line.replace(/^[▢☑✓✗\-\s]+/, '').trim();
        if (!name) return;
        const dup = items.some(function (it) { return it.name === name; });
        if (dup) return;
        items.unshift({ id: App.uid(), name: name, done: false });
        added++;
      });
      save();
      renderAll();
      el.querySelector('#spImportText').value = '';
      App.toast(added ? '已合并 ' + added + ' 项' : '没有新东西可合并');
    });

    renderAll();
  },
});
