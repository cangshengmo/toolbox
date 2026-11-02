/* 百宝箱 · 记账本：轻量支出记录 */
(function () {
  'use strict';

  const CATS = ['餐饮', '交通', '购物', '娱乐', '居住', '医疗', '其他'];

  /* 读取数据（损坏时立即重写为空列表，并过滤非法记录） */
  function load() {
    const list = App.store.get('expense', 'records', []);
    if (!Array.isArray(list)) {
      App.store.set('expense', 'records', []);
      return [];
    }
    return list.filter(function (r) {
      return r && typeof r === 'object'
        && typeof r.amount === 'number' && isFinite(r.amount)
        && typeof r.date === 'string' && r.date.length >= 7;
    });
  }

  function save(list) { App.store.set('expense', 'records', list); }

  function fmt(n) { return Number(n).toFixed(2); }

  App.registerTool({
    id: 'expense',
    name: '记账本',
    icon: '💰',
    desc: '轻量支出记录',
    order: 80,

    render: function (el) {
      const timers = []; // 清理：未决的两击确认计时器
      const nowYM = App.today().slice(0, 7); // 'YYYY-MM'
      let viewYM = nowYM;
      let cat = CATS[0];

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
        <div class="card" data-role="month-card"></div>
        <div class="card">
          <div class="row">
            <input class="input grow" data-role="amount" type="number" step="0.01" min="0" placeholder="金额（元）" required>
          </div>
          <div class="row" data-role="chips" style="flex-wrap:wrap;gap:8px"></div>
          <input class="input" data-role="note" type="text" maxlength="50" placeholder="备注（可选）">
          <div class="row"><button class="btn btn-primary grow" data-role="save">保存</button></div>
        </div>
        <div data-role="list-box"></div>
        <div class="card" data-role="sum-card"></div>`;

      const monthCard = el.querySelector('[data-role="month-card"]');
      const chipsBox = el.querySelector('[data-role="chips"]');
      const listBox = el.querySelector('[data-role="list-box"]');
      const sumCard = el.querySelector('[data-role="sum-card"]');

      function shiftYM(ym, delta) {
        let y = +ym.slice(0, 4);
        let m = +ym.slice(5, 7) + delta;
        if (m < 1) { m = 12; y -= 1; }
        if (m > 12) { m = 1; y += 1; }
        return y + '-' + String(m).padStart(2, '0');
      }

      function monthRecords() {
        return load().filter(function (r) { return String(r.date).slice(0, 7) === viewYM; });
      }

      /* ---------- 月份切换 + 总额 ---------- */
      function renderMonth() {
        const total = monthRecords().reduce(function (s, r) { return s + r.amount; }, 0);
        const y = +viewYM.slice(0, 4);
        const m = +viewYM.slice(5, 7);
        const canNext = viewYM < nowYM; // 不能翻到未来月份
        monthCard.innerHTML = `
          <div style="text-align:center">
            <div class="muted" style="font-size:13px">支出总额</div>
            <div class="big-time">¥${fmt(total)}</div>
          </div>
          <div class="row" style="margin-top:8px">
            <button class="icon-btn" data-role="prev" aria-label="上个月">‹</button>
            <div class="grow" style="text-align:center;font-weight:600">${y}年${m}月</div>
            <button class="icon-btn" data-role="next" aria-label="下个月" ${canNext ? '' : 'disabled style="opacity:.35"'}>›</button>
          </div>`;
        monthCard.querySelector('[data-role="prev"]').addEventListener('click', function () {
          viewYM = shiftYM(viewYM, -1);
          renderDynamic();
        });
        monthCard.querySelector('[data-role="next"]').addEventListener('click', function () {
          if (viewYM >= nowYM) return;
          viewYM = shiftYM(viewYM, 1);
          renderDynamic();
        });
      }

      /* ---------- 记一笔 ---------- */
      function renderChips() {
        chipsBox.innerHTML = CATS.map(function (c) {
          return `<button type="button" class="chip${c === cat ? ' active' : ''}" data-cat="${c}" style="min-height:44px">${c}</button>`;
        }).join('');
        chipsBox.querySelectorAll('[data-cat]').forEach(function (b) {
          b.addEventListener('click', function () {
            cat = b.getAttribute('data-cat');
            renderChips();
          });
        });
      }

      /* ---------- 当月列表（日期降序） ---------- */
      function renderList() {
        const records = monthRecords().slice().sort(function (a, b) {
          if (a.date !== b.date) return a.date < b.date ? 1 : -1;
          return String(a.id || '') > String(b.id || '') ? -1 : 1;
        });
        if (!records.length) {
          listBox.innerHTML = '<div class="empty">本月暂无记录，记一笔吧</div>';
          return;
        }
        listBox.innerHTML = '<div class="list">' + records.map(function (r) {
          const title = App.esc(r.cat || '其他') + (r.note ? ' · ' + App.esc(r.note) : '');
          return `
            <div class="item">
              <div class="item-main">
                <div class="item-title">${title}</div>
                <div class="item-sub">${App.esc(r.date)}</div>
              </div>
              <span style="font-weight:600">¥${fmt(r.amount)}</span>
              <button class="icon-btn" data-del="${App.esc(r.id || '')}" aria-label="删除这条记录">✕</button>
            </div>`;
        }).join('') + '</div>';
        listBox.querySelectorAll('[data-del]').forEach(function (b) {
          twoClick(b, '确认', function () {
            const id = b.getAttribute('data-del');
            save(load().filter(function (r) { return r.id !== id; }));
            App.toast('已删除');
            renderDynamic();
          });
        });
      }

      /* ---------- 当月分类汇总（金额降序） ---------- */
      function renderSummary() {
        const records = monthRecords();
        if (!records.length) {
          sumCard.innerHTML = '<div class="muted" style="text-align:center">本月暂无分类汇总</div>';
          return;
        }
        const byCat = {};
        records.forEach(function (r) {
          const c = r.cat || '其他';
          byCat[c] = (byCat[c] || 0) + r.amount;
        });
        const rows = Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; });
        sumCard.innerHTML = '<div class="muted" style="margin-bottom:4px">分类汇总</div>' + rows.map(function (c) {
          return `<div class="row"><span>${App.esc(c)}</span><span class="grow"></span><span style="font-weight:600">¥${fmt(byCat[c])}</span></div>`;
        }).join('');
      }

      function renderDynamic() {
        renderMonth();
        renderList();
        renderSummary();
      }

      renderChips();
      renderDynamic();

      el.querySelector('[data-role="save"]').addEventListener('click', function () {
        const amtInput = el.querySelector('[data-role="amount"]');
        const noteInput = el.querySelector('[data-role="note"]');
        const v = parseFloat(amtInput.value);
        if (!isFinite(v) || v <= 0) {
          App.toast('请输入有效金额');
          amtInput.focus();
          return;
        }
        const list = load();
        list.push({
          id: App.uid(),
          amount: Math.round(v * 100) / 100,
          cat: cat,
          note: String(noteInput.value || '').trim(),
          date: App.today(),
        });
        save(list);
        amtInput.value = '';
        noteInput.value = '';
        cat = CATS[0];
        renderChips();
        viewYM = nowYM; // 回到当前月，立即看到新记录
        renderDynamic();
        App.toast('已记录');
      });

      return function () { timers.forEach(function (c) { c(); }); };
    }
  });
})();
