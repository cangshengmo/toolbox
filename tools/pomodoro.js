/* 百宝箱 · 番茄钟：25 分钟专注计时 */
App.registerTool({
  id: 'pomodoro',
  name: '番茄钟',
  icon: 'timer',
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
        <div class="row" style="justify-content:center;margin-bottom:0" id="pmNoise">
          <button class="btn" data-noise="off" style="min-height:40px;font-size:13.5px">🔇 无声</button>
          <button class="btn" data-noise="white" style="min-height:40px;font-size:13.5px">🌫 白噪音</button>
          <button class="btn" data-noise="rain" style="min-height:40px;font-size:13.5px">🌧 雨声</button>
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
      <div class="card">
        <div class="item-title" style="margin-bottom:8px">近 7 天专注</div>
        <div id="pmWeek" style="display:flex;align-items:flex-end;gap:8px;height:110px"></div>
        <div class="muted" id="pmWeekSum" style="font-size:12px;margin-top:8px;text-align:center"></div>
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
      renderWeek(stats);
    }

    /* 近 7 天柱状图:高度按番茄数,分钟数按当前专注时长估算 */
    function renderWeek(stats) {
      const weekEl = el.querySelector('#pmWeek');
      const sumEl = el.querySelector('#pmWeekSum');
      if (!weekEl) return;
      const days = [];
      const names = ['日', '一', '二', '三', '四', '五', '六'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        days.push({ ds: ds, label: names[d.getDay()], n: stats[ds] || 0 });
      }
      const max = Math.max(1, Math.max.apply(null, days.map(function (x) { return x.n; })));
      weekEl.innerHTML = days.map(function (x) {
        const h = x.n ? Math.max(8, Math.round(x.n / max * 84)) : 4;
        const isToday = x.ds === App.today();
        return '<div style="flex:1;text-align:center">'
          + '<div style="font-size:11px;color:var(--text-2);margin-bottom:2px">' + (x.n || '') + '</div>'
          + '<div style="height:' + h + 'px;border-radius:6px 6px 0 0;background:' + (x.n ? 'var(--accent)' : 'color-mix(in srgb, var(--text) 10%, transparent)') + (isToday ? ';outline:2px solid var(--accent);outline-offset:1px' : '') + '"></div>'
          + '<div style="font-size:11px;color:var(--text-2);margin-top:3px">' + x.label + '</div>'
          + '</div>';
      }).join('');
      const total = days.reduce(function (s, x) { return s + x.n; }, 0);
      sumEl.textContent = '本周共 ' + total + ' 个番茄 ≈ ' + (total * settings.focus) + ' 分钟(按当前 ' + settings.focus + ' 分钟估算)';
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

    /* ---------- 白噪音/雨声(Web Audio 合成,离线可用) ---------- */
    let audioCtx = null;
    let noiseSrc = null;
    let noiseMode = 'off';

    function paintNoise() {
      el.querySelectorAll('#pmNoise button').forEach(function (b) {
        const on = b.dataset.noise === noiseMode;
        b.style.background = on ? 'var(--accent)' : '';
        b.style.borderColor = on ? 'transparent' : '';
        b.style.color = on ? '#fff' : '';
      });
    }

    function stopNoise() {
      if (noiseSrc) {
        try { noiseSrc.stop(); } catch (e) { /* already stopped */ }
        noiseSrc = null;
      }
    }

    function playNoise(kind) {
      stopNoise();
      noiseMode = kind;
      if (kind === 'off') { paintNoise(); return; }
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const len = 2 * audioCtx.sampleRate;
        const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        noiseSrc = audioCtx.createBufferSource();
        noiseSrc.buffer = buf;
        noiseSrc.loop = true;
        const gain = audioCtx.createGain();
        if (kind === 'rain') {
          const f = audioCtx.createBiquadFilter();
          f.type = 'lowpass';
          f.frequency.value = 900;
          noiseSrc.connect(f);
          f.connect(gain);
        } else {
          noiseSrc.connect(gain);
        }
        gain.gain.value = kind === 'rain' ? 0.25 : 0.08;
        gain.connect(audioCtx.destination);
        noiseSrc.start();
      } catch (e) {
        App.toast('当前环境不支持音频');
        noiseMode = 'off';
      }
      paintNoise();
    }

    el.querySelector('#pmNoise').addEventListener('click', function (e) {
      const b = e.target.closest ? e.target.closest('button[data-noise]') : null;
      if (!b) return;
      playNoise(b.dataset.noise);
    });

    paint();
    updateStats();
    paintNoise();

    /* 路由离开时清理定时器与音频 */
    return function cleanup() {
      if (timer) clearInterval(timer);
      timer = null;
      stopNoise();
    };
  },
});
