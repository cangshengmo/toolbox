/* 百宝箱 · 演讲计时器:1/3/5 分钟自我介绍彩排 */
App.registerTool({
  id: 'speech',
  name: '演讲计时器',
  icon: 'megaphone',
  desc: '彩排计时提醒',
  order: 69,

  render(el) {
    let dur = 180;
    let endAt = 0;
    let timer = null;
    let running = false;
    let warned = {};

    el.innerHTML = `
      <div class="card" style="text-align:center;padding:24px 16px">
        <div class="seg" id="spSeg" style="justify-content:center">
          <button class="seg-btn" data-s="60">1 分钟</button>
          <button class="seg-btn active" data-s="180">3 分钟</button>
          <button class="seg-btn" data-s="300">5 分钟</button>
        </div>
        <div class="big-time" id="spTime" style="color:var(--text)">3:00</div>
        <div class="muted" id="spHint" style="min-height:20px"></div>
        <div class="row" style="justify-content:center">
          <button id="spStart" class="btn btn-primary" style="min-height:46px;min-width:110px">开始彩排</button>
          <button id="spReset" class="btn" style="min-height:46px">重置</button>
        </div>
      </div>
      <div class="muted" style="font-size:12px;text-align:center">剩 30 秒提示音,超时红色警告;离开页面自动停止</div>`;

    const segEl = el.querySelector('#spSeg');
    const timeEl = el.querySelector('#spTime');
    const hintEl = el.querySelector('#spHint');
    const startBtn = el.querySelector('#spStart');

    function fmt(sec) {
      const s = Math.max(0, Math.ceil(sec));
      return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }

    function paint(remain) {
      timeEl.textContent = fmt(remain);
      timeEl.style.color = remain <= 10 ? 'var(--danger)' : remain <= 30 ? '#f59e0b' : 'var(--text)';
    }

    function stop() {
      running = false;
      if (timer) { clearInterval(timer); timer = null; }
      startBtn.textContent = '开始彩排';
      startBtn.disabled = false;
    }

    function tick() {
      const remain = (endAt - Date.now()) / 1000;
      paint(remain);
      if (remain <= 30 && !warned['30']) {
        warned['30'] = true;
        App.beep(1);
        hintEl.textContent = '⏰ 还剩 30 秒,收个尾';
      }
      if (remain <= 0) {
        stop();
        paint(0);
        hintEl.textContent = '✅ 时间到!用时 ' + fmt(dur);
        App.beep(3);
      }
    }

    function start() {
      running = true;
      warned = {};
      hintEl.textContent = '';
      endAt = Date.now() + dur * 1000;
      startBtn.textContent = '进行中…';
      startBtn.disabled = true;
      timer = setInterval(tick, 200);
    }

    function reset() {
      stop();
      hintEl.textContent = '';
      paint(dur);
    }

    segEl.addEventListener('click', function (e) {
      const b = e.target.closest('.seg-btn');
      if (!b || running) return;
      dur = +b.dataset.s;
      segEl.querySelectorAll('.seg-btn').forEach(function (x) {
        x.classList.toggle('active', x === b);
      });
      reset();
    });

    startBtn.addEventListener('click', function () {
      if (running) return;
      start();
    });
    el.querySelector('#spReset').addEventListener('click', reset);

    paint(dur);
    return function () {
      if (timer) clearInterval(timer);
    };
  },
});
