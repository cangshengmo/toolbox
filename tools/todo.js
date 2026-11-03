/* 百宝箱 · 待办清单：简单的任务清单 */
App.registerTool({
  id: 'todo',
  name: '待办清单',
  icon: 'square-check-big',
  desc: '简单的任务清单',
  order: 10,

  render(el) {
    let list = App.store.get('todo', 'list', []);
    if (!Array.isArray(list)) list = [];

    el.innerHTML = `
      <div class="seg" id="todoSeg">
        <button class="seg-btn" data-v="list">列表</button>
        <button class="seg-btn" data-v="quad">四象限</button>
      </div>
      <div id="todoListWrap">
        <div class="row">
          <input id="todoInput" class="input grow" type="text" placeholder="想做什么？">
          <button id="todoAdd" class="btn btn-primary" style="min-height:44px">添加</button>
        </div>
        <div class="list" id="todoList" style="margin-top:12px"></div>
        <div class="empty" id="todoEmpty" hidden>还没有任务，添加一个吧</div>
        <div class="row" id="todoFooter" style="margin-top:12px; margin-bottom:0">
          <span class="muted" id="todoLeft"></span>
          <div class="grow"></div>
          <button id="todoClear" class="btn btn-danger" style="min-height:44px">清除已完成</button>
        </div>
      </div>
      <div id="todoQuadWrap" hidden>
        <div class="quad-grid" id="todoQuad"></div>
        <div class="muted" style="font-size:12px;margin-top:8px">点文字循环换象限；输入框可直接加进对应象限</div>
      </div>`;

    const input = el.querySelector('#todoInput');
    const listEl = el.querySelector('#todoList');
    const emptyEl = el.querySelector('#todoEmpty');
    const leftEl = el.querySelector('#todoLeft');
    const clearBtn = el.querySelector('#todoClear');
    const segEl = el.querySelector('#todoSeg');
    const listWrap = el.querySelector('#todoListWrap');
    const quadWrap = el.querySelector('#todoQuadWrap');
    const quadGrid = el.querySelector('#todoQuad');

    /* 视图状态:列表 / 四象限 */
    let view = App.store.get('todo', 'view', 'list');
    if (view !== 'list' && view !== 'quad') view = 'list';

    function save() {
      App.store.set('todo', 'list', list);
    }

    /* 只重渲染列表区域，不触碰输入框 */
    function renderList() {
      listEl.innerHTML = list.map(function (t) {
        const titleStyle = t.done ? ' style="text-decoration:line-through;opacity:.45"' : '';
        return `
          <div class="item">
            <button class="icon-btn" data-act="toggle" data-id="${App.esc(t.id)}"
              aria-label="${t.done ? '标记为未完成' : '标记为完成'}"
              style="min-width:44px;min-height:44px;font-size:18px">${t.done ? '✅' : '⬜'}</button>
            <div class="item-main">
              <div class="item-title"${titleStyle}>${App.esc(t.text)}</div>
            </div>
            <button class="icon-btn" data-act="del" data-id="${App.esc(t.id)}"
              aria-label="删除" style="min-width:44px;min-height:44px">🗑</button>
          </div>`;
      }).join('');
      const left = list.filter(function (t) { return !t.done; }).length;
      const doneCount = list.length - left;
      emptyEl.hidden = list.length > 0;
      leftEl.textContent = '剩余 ' + left + ' 项';
      clearBtn.disabled = doneCount === 0;
    }

    function addTodo() {
      const text = input.value.trim();
      if (!text) return;
      list.unshift({ id: App.uid(), text: text, done: false, created: App.today() });
      save();
      input.value = '';
      renderList();
      input.focus();
    }

    /* 两击确认删除：首击变"确认删除？"，3 秒内再击执行，超时还原 */
    function armDelete(btn, id) {
      if (btn.dataset.armed === '1') {
        list = list.filter(function (t) { return t.id !== id; });
        save();
        renderList();
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

    el.querySelector('#todoAdd').addEventListener('click', addTodo);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') addTodo();
    });

    listEl.addEventListener('click', function (e) {
      const btn = e.target.closest ? e.target.closest('button[data-act]') : null;
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.act === 'toggle') {
        const item = list.find(function (t) { return t.id === id; });
        if (!item) return;
        item.done = !item.done;
        save();
        renderList();
      } else if (btn.dataset.act === 'del') {
        armDelete(btn, id);
      }
    });

    clearBtn.addEventListener('click', function () {
      list = list.filter(function (t) { return !t.done; });
      save();
      renderList();
    });

    /* ---------- 四象限视图 ---------- */
    const QUAD_NAMES = ['重要且紧急', '重要不紧急', '紧急不重要', '不重要不紧急'];

    function quadTasks(qi) {
      return list.filter(function (t) { return (t.q || 2) === qi; });
    }

    function renderQuad() {
      quadGrid.innerHTML = QUAD_NAMES.map(function (name, i) {
        const q = i + 1;
        const items = quadTasks(q);
        return `
          <div class="card quad-card">
            <div class="quad-head"><span>${name}</span><span>${items.length}</span></div>
            <div>
              ${items.map(function (t) {
                return `<div class="quad-item">
                  <span class="quad-text${t.done ? ' done' : ''}" data-qtask="${App.esc(t.id)}">${App.esc(t.text)}</span>
                </div>`;
              }).join('')}
              ${items.length === 0 ? '<div class="muted" style="font-size:12px;padding:4px 0">空空如也</div>' : ''}
            </div>
            <div class="row" style="margin-top:8px; margin-bottom:0">
              <input class="input grow" style="min-height:38px;font-size:13px" type="text" placeholder="添加到该象限" data-qinput="${q}">
              <button class="btn btn-primary" style="min-height:38px;font-size:13px" data-qadd="${q}">+</button>
            </div>
          </div>`;
      }).join('');
    }

    function applyView() {
      segEl.querySelectorAll('.seg-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.v === view);
      });
      listWrap.hidden = view === 'quad';
      quadWrap.hidden = view !== 'quad';
      if (view === 'quad') renderQuad();
      else renderList();
    }

    segEl.addEventListener('click', function (e) {
      const b = e.target.closest ? e.target.closest('.seg-btn') : null;
      if (!b) return;
      view = b.dataset.v;
      App.store.set('todo', 'view', view);
      applyView();
    });

    /* 象限内加任务 / 点文字循环换象限 */
    function addQuadTask(q, inp) {
      const text = inp.value.trim();
      if (!text) { App.toast('请输入内容'); return; }
      list.unshift({ id: App.uid(), text: text, done: false, q: q, created: App.today() });
      save();
      renderQuad();
    }

    quadGrid.addEventListener('click', function (e) {
      const task = e.target.closest ? e.target.closest('[data-qtask]') : null;
      if (task) {
        const t = list.find(function (x) { return x.id === task.dataset.qtask; });
        if (!t) return;
        t.q = (t.q || 2) % 4 + 1;
        save();
        renderQuad();
        App.toast('已移到:' + QUAD_NAMES[t.q - 1]);
        return;
      }
      const addBtn = e.target.closest('[data-qadd]');
      if (addBtn) {
        const q = +addBtn.dataset.qadd;
        const inp = quadGrid.querySelector('input[data-qinput="' + q + '"]');
        addQuadTask(q, inp);
      }
    });

    quadGrid.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.matches('[data-qinput]')) {
        addQuadTask(+e.target.dataset.qinput, e.target);
      }
    });

    applyView();
    renderList();
  },
});
