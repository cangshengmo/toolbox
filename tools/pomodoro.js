/* 百宝箱 · 番茄钟：25 分钟专注计时 */
App.registerTool({
  id: 'pomodoro',
  name: '番茄钟',
  icon: '🍅',
  desc: '25分钟专注计时',
  order: 30,

  render(el) {
    let settings = App.store.get('pomodoro', 'settings', { focus: 25, break: 5 });
    if (!settings || typeof settings !== 'object') settings = {};
    if (settings.focus !== 15 && settings.focus !== 25 && settings.focus !== 45) settings.focus = 25;
    if (settings.break !== 3 && settings.break !== 5 && settings.break !== 10) settings.break = 5;

    /* 内存态：mode 当前模式，endAt 运行截止时间戳，pausedMs 暂停时剩余毫秒 */
    let mode = 'focus';
    let endAt = 0;
    let pausedMs = null;
    let timer = null; /* setInterval 句柄 */

    el.innerHTML = `
      <div class="card" style="text-align:center;padding:24px 16px">
        <div class="seg" id="pmSeg" style="justify-content:center">
          <button class="seg-btn active" data-mode="focus" style="min-height:44px">专注</button>
          <button class="seg-btn" data-mode="break" style="min-height:44px">休息</button>
        </div>
        <div class="big-time" id="pmTime">25:00</div>
        <div class="row" style="justify-content:center">
          <button id="pmToggle" class="btn btn-primary" style="min-height:44px;min-width:96px">开始</button>
          <button id="pmReset" class="btn" style="min-height:44px">重置</button>
        </div>
      </div>
      <div class="card">
        <div class="row">
          <span class="muted">专注时长</span>
          <div class="grow"></div>
          <select id="pmFocus" class="select" style="min-height:44px">
            <option value="15">15 分钟</option>
            <option value="25">25 分钟</option>
            <option value="45">45 分钟</option>
          </select>
        </div>
        <div class="row">
          <span class="muted">休息时长</span>
          <div class="grow"></div>
          <select id="pmBreak" class="select" style="min-height:44px">
            <option value="3">3 分钟</option>
            <option value="5">5 分钟</option>
            <option value="10">10 分钟</option>
          </select>
        </div>
      </div>
      <div class="muted" id="pmStats" style="text-align:center">今日已完成 0 个番茄</div>`;

    const timeEl = el.querySelector('#pmTime');
    const toggleBtn = el.querySelector('#pmToggle');
    const resetBtn = el.querySelector('#pmReset');
    const segEl = el.querySelector('#pmSeg');
    const focusSel = el.querySelector('#pmFocus');
    const breakSel = el.querySelector('#pmBreak');
    const statsEl = el.querySelector('#pmStats');

    focusSel.value = String(settings.focus);
    breakSel.value = String(settings.break);

    function duration() {
      return (mode === 'focus' ? settings.focus : settings.break) * 60000;
    }

    /* 用 endAt 时间戳算剩余，不累计误差；停止时用 pausedMs 或整段时长 */
    function remainingMs() {
      if (timer) return Math.max(0, endAt - Date.now());
      if (pausedMs != null) return pausedMs;
      return duration();
    }

    function fmtTime(ms) {
      const s = Math.ceil(ms / 1000);
      const m = Math.floor(s / 60);
      const ss = s % 60;
      return String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
    }

    function paint() {
      timeEl.textContent = fmtTime(remainingMs());
      segEl.querySelectorAll('.seg-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.mode === mode);
        b.disabled = !!timer; /* 计时中禁用切换 */
      });
      toggleBtn.textContent = timer ? '暂停' : '开始';
    }

    function updateStats() {
      const stats = App.store.get('pomodoro', 'stats', {}) || {};
      statsEl.textContent = '今日已完成 ' + (stats[App.today()] || 0) + ' 个番茄';
    }

    function start() {
      const rem = pausedMs != null ? pausedMs : duration();
      if (rem <= 0) { finish(); return; }
      endAt = Date.now() + rem;
      pausedMs = null;
      timer = setInterval(tick, 250);
      paint();
    }

    function pause() {
      const rem = Math.max(0, endAt - Date.now());
      clearInterval(timer);
      timer = null;
      if (rem <= 0) { pausedMs = null; finish(); return; }
      pausedMs = rem;
      paint();
    }

    function tick() {
      const rem = endAt - Date.now();
      if (rem > 0) {
        timeEl.textContent = fmtTime(rem);
        return;
      }
      clearInterval(timer);
      timer = null;
      pausedMs = null;
      finish();
    }

    function finish() {
      App.beep(3);
      if (mode === 'focus') {
        const stats = App.store.get('pomodoro', 'stats', {}) || {};
        const today = App.today();
        stats[today] = (stats[today] || 0) + 1;
        App.store.set('pomodoro', 'stats', stats);
        mode = 'break';
        App.toast('专注完成，休息一下~');
      } else {
        mode = 'focus';
        App.toast('休息结束，开始下一轮！');
      }
      updateStats();
      paint();
    }

    function reset() {
      clearInterval(timer);
      timer = null;
      pausedMs = null;
      paint();
    }

    toggleBtn.addEventListener('click', function () {
      if (timer) pause();
      else start();
    });
    resetBtn.addEventListener('click', reset);

    segEl.addEventListener('click', function (e) {
      const btn = e.target.closest ? e.target.closest('.seg-btn') : null;
      if (!btn || btn.disabled) return;
      mode = btn.dataset.mode;
      pausedMs = null;
      paint();
    });

    /* 改动即存；未计时时立即按新时长刷新显示 */
    focusSel.addEventListener('change', function () {
      settings.focus = parseInt(focusSel.value, 10) || 25;
      App.store.set('pomodoro', 'settings', settings);
      if (!timer) { pausedMs = null; paint(); }
    });
    breakSel.addEventListener('change', function () {
      settings.break = parseInt(breakSel.value, 10) || 5;
      App.store.set('pomodoro', 'settings', settings);
      if (!timer) { pausedMs = null; paint(); }
    });

    paint();
    updateStats();

    /* 路由离开时清理定时器 */
    return function cleanup() {
      if (timer) clearInterval(timer);
      timer = null;
    };
  },
});
