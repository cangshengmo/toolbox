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
      <div class="row">
        <input id="todoInput" class="input grow" type="text" placeholder="想做什么？">
        <button id="todoAdd" class="btn btn-primary" style="min-height:44px">添加</button>
      </div>
      <div class="list" id="todoList" style="margin-top:12px"></div>
      <div class="empty" id="todoEmpty" hidden>还没有任务，添加一个吧</div>
      <div class="row" id="todoFooter" style="margin-top:12px">
        <span class="muted" id="todoLeft"></span>
        <div class="grow"></div>
        <button id="todoClear" class="btn btn-danger" style="min-height:44px">清除已完成</button>
      </div>`;

    const input = el.querySelector('#todoInput');
    const listEl = el.querySelector('#todoList');
    const emptyEl = el.querySelector('#todoEmpty');
    const leftEl = el.querySelector('#todoLeft');
    const clearBtn = el.querySelector('#todoClear');

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

    renderList();
  },
});
