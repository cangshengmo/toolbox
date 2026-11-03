/* 百宝箱 · 速算练习：加减乘除限时挑战 */
App.registerTool({
  id: 'math',
  name: '速算练习',
  icon: 'brain',
  desc: '加减乘除限时挑战',
  order: 37,

  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="row">
          <select id="maLevel" class="select grow">
            <option value="1">简单(20以内加减)</option>
            <option value="2">中等(100以内含乘除)</option>
            <option value="3">困难(1000以内)</option>
          </select>
          <select id="maDur" class="select" style="flex:0 0 96px">
            <option value="60">60 秒</option>
            <option value="30">30 秒</option>
            <option value="120">120 秒</option>
          </select>
        </div>
        <button id="maStart" class="btn btn-primary" style="width:100%;min-height:46px">开始挑战</button>
      </div>
      <div class="card" id="maPlay" hidden style="text-align:center">
        <div class="muted" style="font-size:12.5px" id="maMeta"></div>
        <div id="maQ" style="font-size:34px;font-weight:700;margin:14px 0;font-variant-numeric:tabular-nums"></div>
        <input id="maAns" class="input" type="number" inputmode="numeric" placeholder="?" style="text-align:center;font-size:22px;font-weight:600">
        <div class="muted" style="font-size:12px;margin-top:8px">输入后回车提交</div>
        <div style="height:8px;border-radius:999px;background:color-mix(in srgb, var(--text) 8%, transparent);margin-top:12px;overflow:hidden">
          <div id="maBar" style="height:100%;width:100%;background:var(--accent);transition:width .2s linear"></div>
        </div>
      </div>
      <div class="card" id="maResult" hidden style="text-align:center"></div>
      <div class="muted" style="font-size:12px;text-align:center;margin-top:8px" id="maBest"></div>`;

    const levelEl = el.querySelector('#maLevel');
    const durEl = el.querySelector('#maDur');
    const startBtn = el.querySelector('#maStart');
    const playEl = el.querySelector('#maPlay');
    const qEl = el.querySelector('#maQ');
    const ansEl = el.querySelector('#maAns');
    const metaEl = el.querySelector('#maMeta');
    const barEl = el.querySelector('#maBar');
    const resultEl = el.querySelector('#maResult');
    const bestEl = el.querySelector('#maBest');

    let running = false;
    let q = null;
    let score = 0;
    let streak = 0;
    let asked = 0;
    let right = 0;
    let endAt = 0;
    let timer = null;

    function bestKey() { return 'best' + levelEl.value; }
    function bestOf() { return App.store.get('math', bestKey(), 0); }

    function renderBest() {
      bestEl.textContent = '最高纪录:简单 ' + App.store.get('math', 'best1', 0)
        + ' · 中等 ' + App.store.get('math', 'best2', 0)
        + ' · 困难 ' + App.store.get('math', 'best3', 0) + ' 分';
    }

    function rnd(n) { return Math.floor(Math.random() * n); }

    function makeQ() {
      const lv = +levelEl.value;
      let a, b, op, ans;
      if (lv === 1) {
        op = rnd(2) ? '+' : '-';
        a = rnd(19) + 1; b = rnd(19) + 1;
        if (op === '-' && b > a) { const t = a; a = b; b = t; }
        ans = op === '+' ? a + b : a - b;
      } else if (lv === 2) {
        op = ['+', '-', '×'][rnd(3)];
        a = rnd(20) + 1; b = rnd(9) + 1;
        if (op === '+') ans = a + b;
        else if (op === '-') { if (b > a) { const t = a; a = b; b = t; } ans = a - b; }
        else ans = a * b;
      } else {
        op = ['+', '-', '×', '÷'][rnd(4)];
        if (op === '+') { a = rnd(400) + 50; b = rnd(400) + 50; ans = a + b; }
        else if (op === '-') { a = rnd(600) + 200; b = rnd(a - 1) + 1; ans = a - b; }
        else if (op === '×') { a = rnd(40) + 10; b = rnd(20) + 5; ans = a * b; }
        else { b = rnd(12) + 2; ans = rnd(30) + 5; a = b * ans; }
      }
      return { a: a, op: op, b: b, ans: ans };
    }

    function showQ() {
      q = makeQ();
      asked++;
      qEl.textContent = q.a + ' ' + q.op + ' ' + q.b + ' = ?';
      ansEl.value = '';
      ansEl.focus();
    }

    function finish() {
      running = false;
      clearInterval(timer);
      timer = null;
      playEl.hidden = true;
      const acc = asked ? Math.round(right / asked * 100) : 0;
      const best = bestOf();
      const isRecord = score > best;
      if (isRecord) App.store.set('math', bestKey(), score);
      resultEl.hidden = false;
      resultEl.innerHTML = '<div style="font-size:30px;font-weight:700;color:var(--accent)">' + score + ' 分</div>'
        + '<div class="muted" style="margin-top:6px">答对 ' + right + ' / ' + asked + ' · 正确率 ' + acc + '%</div>'
        + (isRecord ? '<div style="color:var(--accent);font-weight:600;margin-top:6px">🏆 新纪录!</div>' : '');
      renderBest();
      startBtn.textContent = '再来一局';
    }

    function submit() {
      if (!running) return;
      const v = parseFloat(ansEl.value);
      if (isNaN(v)) return;
      if (v === q.ans) {
        right++;
        streak++;
        score += 10 + Math.min(20, (streak - 1) * 2);
        App.toast('✓ +' + (10 + Math.min(20, (streak - 1) * 2)));
      } else {
        streak = 0;
        App.toast('✗ 答案是 ' + q.ans);
      }
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      metaEl.textContent = '得分 ' + score + ' · 剩余 ' + left + ' 秒';
      showQ();
    }

    function start() {
      if (running) return;
      running = true;
      score = 0; streak = 0; asked = 0; right = 0;
      resultEl.hidden = true;
      playEl.hidden = false;
      startBtn.textContent = '进行中…';
      startBtn.disabled = true;
      const dur = +durEl.value;
      endAt = Date.now() + dur * 1000;
      metaEl.textContent = '得分 0 · 剩余 ' + dur + ' 秒';
      barEl.style.width = '100%';
      showQ();
      timer = setInterval(function () {
        const left = (endAt - Date.now()) / 1000;
        barEl.style.width = Math.max(0, left / dur * 100) + '%';
        if (left <= 0) finish();
      }, 200);
    }

    ansEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submit();
    });
    startBtn.addEventListener('click', start);

    renderBest();
    return function () {
      if (timer) clearInterval(timer);
    };
  },
});
