/* 百宝箱 · 打字速度测试:中文/英文双模式 WPM */
App.registerTool({
  id: 'typing',
  name: '打字测试',
  icon: 'keyboard',
  desc: '中英文双模式测速',
  order: 64,

  render(el) {
    const EN = 'the quick brown fox jumps over a lazy dog while time flows like a river through every open window we gather what remains and move on to better things that wait for us beyond the hills where morning light returns to fill the quiet room with warmth again so keep your fingers moving steady and let each word land where it belongs in rhythm with your breath until the test is done';
    const ZH = ['测定打字速度需要保持稳定的节奏', '清晨的阳光洒在书桌上,新的一天开始了', '把注意力放在手指上,感受每一次敲击', '好的输入法会记住你的常用词,越用越顺手', '练字先练腕,打字先练心,稳定胜过爆发', '夜色渐深,窗外的路灯次第亮了起来', '坚持不懈地练习,速度自然水到渠成', '将长句拆成短句,节奏感会立刻好起来'];

    let mode = 'en';
    let running = false;
    let text = '';
    let typed = '';
    let startAt = 0;
    let timer = null;
    let right = 0;

    el.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <div class="seg" id="tySeg" style="margin-bottom:0;flex:1">
            <button class="seg-btn active" data-m="en">英文</button>
            <button class="seg-btn" data-m="zh">中文</button>
          </div>
          <button id="tyStart" class="btn btn-primary" style="min-height:44px">开始 60s</button>
        </div>
      </div>
      <div class="card" id="tyPlay" hidden>
        <div id="tyText" style="font-size:17px;line-height:1.9;word-break:break-all;letter-spacing:.5px"></div>
        <div class="row" style="margin:12px 0 0">
          <input id="tyInput" class="input grow" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="在此输入,计时从第一个键开始">
          <span class="muted" style="flex:0 0 auto" id="tyClock">60s</span>
        </div>
      </div>
      <div class="card" id="tyResult" hidden style="text-align:center"></div>
      <div class="muted" style="font-size:12px;text-align:center;margin-top:6px" id="tyBest"></div>`;

    const segEl = el.querySelector('#tySeg');
    const startBtn = el.querySelector('#tyStart');
    const playEl = el.querySelector('#tyPlay');
    const textEl = el.querySelector('#tyText');
    const inputEl = el.querySelector('#tyInput');
    const clockEl = el.querySelector('#tyClock');
    const resultEl = el.querySelector('#tyResult');
    const bestEl = el.querySelector('#tyBest');

    function renderBest() {
      bestEl.textContent = '最高纪录:英文 ' + App.store.get('typing', 'besten', 0)
        + ' WPM · 中文 ' + App.store.get('typing', 'bestzh', 0) + ' 字/分';
    }

    function newText() {
      if (mode === 'en') {
        const words = EN.split(' ');
        const start = Math.floor(Math.random() * (words.length - 14));
        text = words.slice(start, start + 12).join(' ');
      } else {
        text = ZH[Math.floor(Math.random() * ZH.length)];
      }
      typed = '';
      paint();
    }

    function paint() {
      /* 已打部分逐字着色,未打部分正常显示 */
      let html = '';
      for (let i = 0; i < text.length; i++) {
        if (i < typed.length) {
          const ok = typed[i] === text[i];
          html += '<span style="' + (ok ? 'color:#22c55e' : 'color:var(--danger);text-decoration:underline') + '">' + App.esc(text[i]) + '</span>';
        } else {
          html += App.esc(text[i]);
        }
      }
      textEl.innerHTML = html;
    }

    function start() {
      running = true;
      right = 0;
      typed = '';
      resultEl.hidden = true;
      playEl.hidden = false;
      startBtn.disabled = true;
      startBtn.textContent = '测试中…';
      newText();
      setTimeout(function () { inputEl.focus(); }, 100);
    }

    function finish() {
      running = false;
      clearInterval(timer);
      timer = null;
      playEl.hidden = true;
      startBtn.disabled = false;
      startBtn.textContent = '开始 60s';
      const secs = 60;
      const speed = Math.round(right / secs * 60 / (mode === 'en' ? 5 : 1));
      const unit = mode === 'en' ? ' WPM' : ' 字/分';
      const best = App.store.get('typing', 'best' + mode, 0);
      const isRecord = speed > best;
      if (isRecord) App.store.set('typing', 'best' + mode, speed);
      resultEl.hidden = false;
      resultEl.innerHTML = '<div style="font-size:30px;font-weight:700;color:var(--accent)">' + speed + unit + '</div>'
        + '<div class="muted" style="margin-top:6px">有效字符 ' + right + ' · 时长 60 秒</div>'
        + (isRecord ? '<div style="color:var(--accent);font-weight:600;margin-top:6px">🏆 新纪录!</div>' : '');
      renderBest();
    }

    function tick() {
      const left = Math.max(0, 60 - Math.round((Date.now() - startAt) / 1000));
      clockEl.textContent = left + 's';
      if (left <= 0) finish();
    }

    segEl.addEventListener('click', function (e) {
      const b = e.target.closest('.seg-btn');
      if (!b || running) return;
      mode = b.dataset.m;
      segEl.querySelectorAll('.seg-btn').forEach(function (x) {
        x.classList.toggle('active', x === b);
      });
    });

    inputEl.addEventListener('keydown', function (e) {
      if (!running) return;
      if (!timer && inputEl.value.length) {
        startAt = Date.now();
        timer = setInterval(tick, 250);
      }
    });

    inputEl.addEventListener('input', function () {
      if (!running) return;
      const v = inputEl.value;
      typed = v.slice(0, text.length);
      /* 统计当前输入中正确字符数(全对则整段累计) */
      let ok = 0;
      for (let i = 0; i < typed.length; i++) {
        if (typed[i] === text[i]) ok++;
      }
      right = ok;
      paint();
      if (typed.length >= text.length) newText();
      if (!timer && v.length) {
        startAt = Date.now();
        timer = setInterval(tick, 250);
      }
    });

    startBtn.addEventListener('click', start);

    renderBest();
    return function () {
      if (timer) clearInterval(timer);
    };
  },
});
