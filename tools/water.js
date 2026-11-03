/* 百宝箱 · 喝水打卡：每日目标杯数进度 */
App.registerTool({
  id: 'water',
  name: '喝水打卡',
  icon: 'glass-water',
  desc: '每日目标杯数进度',
  order: 21,

  render(el) {
    let cfg = App.store.get('water', 'cfg', { goal: 8, log: {} });
    if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) cfg = { goal: 8, log: {} };
    if (!cfg.log || typeof cfg.log !== 'object') cfg.log = {};
    if (!cfg.goal || cfg.goal < 1) cfg.goal = 8;

    el.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <div class="item-main">
            <div class="item-title" style="font-size:17px">今日 <span id="wtCount">0</span> / <span id="wtGoalShow">8</span> 杯</div>
            <div class="item-sub" id="wtHint">再接再厉</div>
          </div>
          <button id="wtMinus" class="icon-btn" aria-label="减一杯" style="min-width:48px;min-height:48px;font-size:20px">−</button>
          <button id="wtPlus" class="btn btn-primary" aria-label="加一杯" style="min-width:64px;height:48px;min-height:48px;font-size:22px">+</button>
        </div>
        <div style="height:10px;border-radius:999px;background:color-mix(in srgb, var(--text) 8%, transparent);margin-top:12px;overflow:hidden">
          <div id="wtBar" style="height:100%;width:0%;background:var(--accent);border-radius:999px;transition:width .3s"></div>
        </div>
        <div class="row" style="margin-top:14px;margin-bottom:0">
          <span class="muted">每日目标</span>
          <div class="grow"></div>
          <button class="icon-btn" id="wtGoalMinus" aria-label="目标减一" style="min-width:36px;min-height:36px">−</button>
          <span id="wtGoal" style="min-width:28px;text-align:center;font-weight:600">8</span>
          <button class="icon-btn" id="wtGoalPlus" aria-label="目标加一" style="min-width:36px;min-height:36px">+</button>
        </div>
      </div>
      <div class="card">
        <div class="item-title" style="margin-bottom:10px">最近 7 天</div>
        <div id="wtWeek" class="grid-2"></div>
      </div>`;

    const countEl = el.querySelector('#wtCount');
    const goalShowEl = el.querySelector('#wtGoalShow');
    const hintEl = el.querySelector('#wtHint');
    const barEl = el.querySelector('#wtBar');
    const weekEl = el.querySelector('#wtWeek');
    const goalEl = el.querySelector('#wtGoal');
    const plusBtn = el.querySelector('#wtPlus');
    const minusBtn = el.querySelector('#wtMinus');

    function today() { return App.today(); }

    function countOf(ds) { return cfg.log[ds] || 0; }

    function render() {
      const n = countOf(today());
      countEl.textContent = n;
      goalShowEl.textContent = cfg.goal;
      goalEl.textContent = cfg.goal;
      barEl.style.width = Math.min(100, n / cfg.goal * 100) + '%';
      hintEl.textContent = n >= cfg.goal ? '今日目标已达成 🎉' : '还差 ' + (cfg.goal - n) + ' 杯，加油';
      renderWeek();
    }

    function renderWeek() {
      const rows = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        const n = countOf(ds);
        const pct = Math.min(100, Math.round(n / cfg.goal * 100));
        rows.push(
          '<div style="padding:8px 10px;background:var(--surface);border:1px solid var(--border);border-radius:10px">'
          + '<div class="muted" style="font-size:12px">' + ds.slice(5).replace('-', '/') + '</div>'
          + '<div style="font-weight:600">' + n + ' / ' + cfg.goal + ' 杯</div>'
          + '<div style="height:6px;border-radius:999px;background:color-mix(in srgb, var(--text) 8%, transparent);margin-top:6px;overflow:hidden">'
          + '<div style="height:100%;width:' + pct + '%;background:var(--accent)"></div>'
          + '</div></div>'
        );
      }
      weekEl.innerHTML = rows.join('');
    }

    function save() {
      App.store.set('water', 'cfg', cfg);
    }

    plusBtn.addEventListener('click', function () {
      const ds = today();
      cfg.log[ds] = countOf(ds) + 1;
      save();
      render();
      if (cfg.log[ds] === cfg.goal) { App.toast('今日目标达成 🎉'); App.beep(1); }
    });

    minusBtn.addEventListener('click', function () {
      const ds = today();
      cfg.log[ds] = Math.max(0, countOf(ds) - 1);
      if (cfg.log[ds] === 0) delete cfg.log[ds];
      save();
      render();
    });

    function changeGoal(delta) {
      cfg.goal = Math.min(20, Math.max(1, cfg.goal + delta));
      save();
      render();
    }

    el.querySelector('#wtGoalPlus').addEventListener('click', function () { changeGoal(1); });
    el.querySelector('#wtGoalMinus').addEventListener('click', function () { changeGoal(-1); });

    render();
  },
});
