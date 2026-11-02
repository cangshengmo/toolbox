/* 百宝箱 · 便签：彩色便签记事 */
(function () {
  'use strict';

  const COLORS = ['#FFE08A', '#A8E6A3', '#9AD0F0', '#F6B5C9', '#DDD3F0'];
  const INK = '#333'; // 柔和底色上用深色文字

  /* 读取数据（损坏时立即重写为空列表） */
  function load() {
    const list = App.store.get('notes', 'notes', []);
    if (!Array.isArray(list)) {
      App.store.set('notes', 'notes', []);
      return [];
    }
    return list.filter(function (n) { return n && typeof n === 'object' && n.id; });
  }

  function save(list) { App.store.set('notes', 'notes', list); }

  function fmtDate(ts) {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  App.registerTool({
    id: 'notes',
    name: '便签',
    icon: '📝',
    desc: '彩色便签记事',
    order: 70,

    render: function (el) {
      const timers = []; // 清理：未决的两击确认计时器
      let query = '';
      let editingId = null;
      let currentColor = COLORS[0];

      /* 两击确认：首击变提示文字，3 秒内再击执行，否则还原 */
      function twoClick(btn, confirmText, fn) {
        const orig = btn.textContent;
        let armed = false;
        let t = null;
        btn.addEventListener('click', function () {
          if (!armed) {
            armed = true;
            btn.textContent = confirmText;
            t = setTimeout(function () { armed = false; btn.textContent = orig; }, 3000);
          } else {
            clearTimeout(t);
            armed = false;
            btn.textContent = orig;
            fn();
          }
        });
        timers.push(function () { clearTimeout(t); });
      }

      el.innerHTML = `
        <div data-view="list">
          <div class="row">
            <input class="input grow" type="search" placeholder="搜索便签…" data-role="search">
            <button class="btn btn-primary" data-role="new">新建</button>
          </div>
          <div data-role="list"></div>
        </div>
        <div data-view="edit" style="display:none"></div>`;

      const listView = el.querySelector('[data-view="list"]');
      const editView = el.querySelector('[data-view="edit"]');
      const listBox = el.querySelector('[data-role="list"]');

      function sorted() {
        return load().slice().sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); });
      }

      /* ---------- 列表视图 ---------- */
      function renderList() {
        const q = query.trim().toLowerCase();
        const all = sorted();
        const list = q ? all.filter(function (n) { return String(n.text || '').toLowerCase().indexOf(q) >= 0; }) : all;
        if (!list.length) {
          listBox.innerHTML = `<div class="empty">${q ? '没有匹配的便签' : '还没有便签，点「新建」记一条吧'}</div>`;
          return;
        }
        listBox.innerHTML = '<div class="grid-2">' + list.map(function (n) {
          const body = (n.text || '') !== '' ? App.esc(n.text) : '<span style="opacity:.55">（空便签）</span>';
          return `
            <div class="card" data-id="${App.esc(n.id)}" style="background:${App.esc(n.color)};color:${INK};cursor:pointer">
              <div style="white-space:pre-wrap;word-break:break-all;max-height:5em;overflow:hidden">${body}</div>
              <div class="item-sub" style="color:${INK};opacity:.6;margin-top:6px">${fmtDate(n.updated)}</div>
            </div>`;
        }).join('') + '</div>';
        listBox.querySelectorAll('[data-id]').forEach(function (c) {
          c.addEventListener('click', function () { openEdit(c.getAttribute('data-id'), false); });
        });
      }

      function showList() {
        editingId = null;
        editView.style.display = 'none';
        editView.innerHTML = '';
        listView.style.display = '';
        renderList();
      }

      /* ---------- 编辑视图（替换列表显示） ---------- */
      function openEdit(id, isNew) {
        const note = load().find(function (n) { return n.id === id; });
        if (!note) { showList(); return; }
        editingId = id;
        currentColor = COLORS.indexOf(note.color) >= 0 ? note.color : COLORS[0];

        editView.innerHTML = `
          <div class="card">
            <textarea class="input" data-role="text" placeholder="写点什么…" style="min-height:180px">${App.esc(note.text || '')}</textarea>
            <div class="row" data-role="colors" style="flex-wrap:wrap;gap:8px">
              ${COLORS.map(function (c) {
                return `<button type="button" class="icon-btn" data-color="${c}" aria-label="颜色" style="width:44px;height:44px;border-radius:10px;background:${c};border:3px solid ${c === currentColor ? '#4f6ef7' : 'transparent'}"></button>`;
              }).join('')}
            </div>
          </div>
          <div class="row">
            <button class="btn btn-primary grow" data-role="save">保存</button>
            <button class="btn btn-danger" data-role="del">删除</button>
            <button class="btn" data-role="back">返回</button>
          </div>`;

        const ta = editView.querySelector('[data-role="text"]');
        const colorBtns = editView.querySelectorAll('[data-color]');
        colorBtns.forEach(function (b) {
          b.addEventListener('click', function () {
            currentColor = b.getAttribute('data-color');
            colorBtns.forEach(function (x) {
              x.style.border = '3px solid ' + (x === b ? '#4f6ef7' : 'transparent');
            });
          });
        });

        function persist() {
          const list = load();
          const n = list.find(function (x) { return x.id === editingId; });
          if (!n) return;
          n.text = ta.value;
          n.color = currentColor;
          n.updated = Date.now();
          save(list);
        }

        editView.querySelector('[data-role="save"]').addEventListener('click', function () {
          if (!ta.value.trim()) { // 空内容不保留
            save(load().filter(function (x) { return x.id !== editingId; }));
            App.toast('空便签已移除');
          } else {
            persist();
            App.toast('已保存');
          }
          showList();
        });

        twoClick(editView.querySelector('[data-role="del"]'), '确认删除？', function () {
          save(load().filter(function (x) { return x.id !== editingId; }));
          App.toast('已删除');
          showList();
        });

        editView.querySelector('[data-role="back"]').addEventListener('click', function () {
          const list = load();
          const n = list.find(function (x) { return x.id === editingId; });
          if (n) {
            if (!ta.value.trim()) {
              save(list.filter(function (x) { return x.id !== editingId; })); // 返回且内容为空：自动删除该记录
            } else {
              persist(); // 有内容：自动保留，避免丢字
            }
          }
          showList();
        });

        listView.style.display = 'none';
        editView.style.display = '';
        if (isNew || !(note.text || '').trim()) ta.focus();
      }

      el.querySelector('[data-role="search"]').addEventListener('input', function (e) {
        query = e.target.value;
        renderList();
      });

      /* 新建：先入一条空记录再进入编辑 */
      el.querySelector('[data-role="new"]').addEventListener('click', function () {
        const list = load();
        const note = { id: App.uid(), text: '', color: COLORS[0], updated: Date.now() };
        list.unshift(note);
        save(list);
        openEdit(note.id, true);
      });

      renderList();

      return function () { timers.forEach(function (c) { c(); }); };
    }
  });
})();
