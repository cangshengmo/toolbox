/* 百宝箱 · 目标进度追踪：目标+关键结果进度条(OKR) */
App.registerTool({
  id: 'goals',
  name: '目标进度',
  icon: 'target',
  desc: 'OKR 目标与关键结果',
  order: 13,

  render(el) {
    let goals = App.store.get('goals', 'goals', []);
    if (!Array.isArray(goals)) goals = [];

    el.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <input id="glName" class="input grow" type="text" placeholder="新目标,如:这个月读完一本书">
          <button id="glAdd" class="btn btn-primary" style="min-height:44px">建目标</button>
        </div>
      </div>
      <div id="glList"></div>
      <div class="empty" id="glEmpty" hidden>还没有目标,建一个吧</div>`;

    const listEl = el.querySelector('#glList');
    const nameEl = el.querySelector('#glName');
    const emptyEl = el.querySelector('#glEmpty');

    function save() {
      App.store.set('goals', 'goals', goals);
    }

    function pct(cur, target) {
      if (!target) return 0;
      return Math.max(0, Math.min(100, Math.round(cur / target * 100)));
    }

    function bar(p) {
      const color = p >= 100 ? '#22c55e' : 'var(--accent)';
      return '<div style="height:8px;border-radius:999px;background:color-mix(in srgb, var(--text) 8%, transparent);overflow:hidden;margin-top:4px">'
        + '<div style="height:100%;width:' + p + '%;background:' + color + ';transition:width .3s"></div></div>';
    }

    function render() {
      listEl.innerHTML = goals.map(function (g) {
        const krs = g.krs || [];
        const overall = krs.length
          ? Math.round(krs.reduce(function (s, k) { return s + pct(k.cur, k.target); }, 0) / krs.length)
          : 0;
        let html = '<div class="card">'
          + '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">'
          + '<div class="item-title" style="font-size:15.5px">' + App.esc(g.name) + '</div>'
          + '<div style="font-size:20px;font-weight:700;color:' + (overall >= 100 ? '#22c55e' : 'var(--accent)') + '">' + overall + '%</div>'
          + '</div>'
          + bar(overall)
          + '<div style="margin-top:10px">';
        if (!krs.length) {
          html += '<div class="muted" style="font-size:12.5px">在下方为这个目标添加关键结果</div>';
        }
        html += krs.map(function (k) {
          return '<div style="padding:7px 0;border-top:1px solid var(--border)">'
            + '<div style="display:flex;align-items:center;gap:8px">'
            + '<span style="flex:1;min-width:0;font-size:13.5px;word-break:break-word">' + App.esc(k.name) + '</span>'
            + '<span class="muted" style="font-size:12px;flex:0 0 auto">' + k.cur + '/' + k.target + '</span>'
            + '<button class="icon-btn" data-act="minus" data-g="' + App.esc(g.id) + '" data-k="' + App.esc(k.id) + '" aria-label="减一" style="min-width:32px;min-height:32px">−</button>'
            + '<button class="icon-btn" data-act="plus" data-g="' + App.esc(g.id) + '" data-k="' + App.esc(k.id) + '" aria-label="加一" style="min-width:32px;min-height:32px">+</button>'
            + '<button class="icon-btn" data-act="delkr" data-g="' + App.esc(g.id) + '" data-k="' + App.esc(k.id) + '" aria-label="删除" style="min-width:32px;min-height:32px;font-size:12px">🗑</button>'
            + '</div>'
            + bar(pct(k.cur, k.target))
            + '</div>';
        }).join('');
        html += '</div>'
          + '<div class="row" style="margin:10px 0 0">'
          + '<input class="input grow" type="text" placeholder="关键结果,如:读到第 10 章" data-krname="' + App.esc(g.id) + '" style="min-height:38px;font-size:13px">'
          + '<input class="input" type="number" min="1" placeholder="目标值" data-krtarget="' + App.esc(g.id) + '" style="flex:0 0 84px;min-height:38px;font-size:13px">'
          + '<button class="btn btn-primary" style="min-height:38px;font-size:13px" data-addkr="' + App.esc(g.id) + '">加</button>'
          + '</div>'
          + '<div style="text-align:right;margin-top:8px">'
          + '<button class="btn btn-danger" data-delgoal="' + App.esc(g.id) + '" style="min-height:34px;font-size:12.5px">删除目标</button>'
          + '</div>'
          + '</div>';
        return html;
      }).join('');
      emptyEl.hidden = goals.length > 0;
    }

    function findGoal(id) {
      return goals.find(function (g) { return g.id === id; });
    }

    el.querySelector('#glAdd').addEventListener('click', function () {
      const name = nameEl.value.trim();
      if (!name) { App.toast('请输入目标名称'); return; }
      goals.push({ id: App.uid(), name: name, krs: [] });
      save();
      nameEl.value = '';
      nameEl.focus();
      render();
    });
    nameEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') el.querySelector('#glAdd').click();
    });

    /* 两击确认删除(通用) */
    function armDelete(btn, fn) {
      if (btn.dataset.armed === '1') { fn(); return; }
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

    listEl.addEventListener('click', function (e) {
      const plus = e.target.closest('button[data-act="plus"]');
      const minus = e.target.closest('button[data-act="minus"]');
      if (plus || minus) {
        const g = findGoal((plus || minus).dataset.g);
        if (!g) return;
        const k = g.krs.find(function (x) { return x.id === (plus || minus).dataset.k; });
        if (!k) return;
        k.cur = Math.max(0, k.cur + (plus ? 1 : -1));
        if (k.cur > k.target) k.cur = k.target;
        save();
        render();
        return;
      }
      const addKr = e.target.closest('button[data-addkr]');
      if (addKr) {
        const g = findGoal(addKr.dataset.addkr);
        if (!g) return;
        const nameInput = listEl.querySelector('input[data-krname="' + addKr.dataset.addkr + '"]');
        const targetInput = listEl.querySelector('input[data-krtarget="' + addKr.dataset.addkr + '"]');
        const name = nameInput.value.trim();
        const target = parseInt(targetInput.value, 10);
        if (!name) { App.toast('请输入关键结果'); return; }
        if (!target || target < 1) { App.toast('请填目标值(正整数)'); return; }
        g.krs.push({ id: App.uid(), name: name, target: target, cur: 0 });
        save();
        render();
        return;
      }
      const delKr = e.target.closest('button[data-act="delkr"]');
      if (delKr) {
        armDelete(delKr, function () {
          const g = findGoal(delKr.dataset.g);
          if (!g) return;
          g.krs = g.krs.filter(function (x) { return x.id !== delKr.dataset.k; });
          save();
          render();
        });
        return;
      }
      const delGoal = e.target.closest('button[data-delgoal]');
      if (delGoal) {
        armDelete(delGoal, function () {
          goals = goals.filter(function (g) { return g.id !== delGoal.dataset.delgoal; });
          save();
          render();
        });
      }
    });

    render();
  },
});
