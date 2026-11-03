/* 百宝箱 · 记忆翻牌:配对记忆游戏 */
App.registerTool({
  id: 'memory',
  name: '记忆翻牌',
  icon: 'layers',
  desc: '配对记忆小游戏',
  order: 67,

  render(el) {
    const POOL = ['🍎', '🐸', '🚀', '🎧', '🌵', '🐳', '🍕', '⚽', '🎲', '🌈', '🍄', '🔔'];
    let deck = [];   // {v, open, done}
    let flips = [];  // 当前翻开的索引
    let lock = false;
    let moves = 0;
    let pairs = 0;
    let total = 8;
    let startAt = 0;
    let timer = null;
    let seconds = 0;

    el.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <span class="item-title" style="flex:1">步数 <span id="mmMoves" style="color:var(--accent)">0</span></span>
          <span class="item-title" style="flex:0 0 auto;margin-right:8px">⏱ <span id="mmTime">0s</span></span>
          <button id="mmNew" class="btn btn-primary" style="min-height:40px">新局</button>
        </div>
      </div>
      <div class="g2048-board" id="mmBoard" style="gap:6px;padding:8px"></div>
      <div class="muted" id="mmMsg" style="font-size:12.5px;text-align:center;margin-top:8px">翻两张,找出相同的一对</div>
      <div class="muted" style="font-size:12px;text-align:center" id="mmBest"></div>`;

    const boardEl = el.querySelector('#mmBoard');
    const movesEl = el.querySelector('#mmMoves');
    const timeEl = el.querySelector('#mmTime');
    const msgEl = el.querySelector('#mmMsg');
    const bestEl = el.querySelector('#mmBest');

    function renderBest() {
      bestEl.textContent = '最少步数纪录:' + App.store.get('memory', 'bestmoves', 0)
        + ' · 最快 ' + App.store.get('memory', 'besttime', 0) + 's(0 = 无记录)';
    }

    function newGame() {
      const pick = POOL.slice();
      for (let i = pick.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = pick[i]; pick[i] = pick[j]; pick[j] = t;
      }
      deck = pick.slice(0, total).concat(pick.slice(0, total));
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = deck[i]; deck[i] = deck[j]; deck[j] = t;
      }
      deck = deck.map(function (v) { return { v: v, open: false, done: false }; });
      flips = [];
      lock = false;
      moves = 0;
      pairs = 0;
      seconds = 0;
      startAt = 0;
      if (timer) { clearInterval(timer); timer = null; }
      timeEl.textContent = '0s';
      movesEl.textContent = '0';
      msgEl.textContent = '翻两张,找出相同的一对';
      render();
      renderBest();
    }

    function render() {
      boardEl.style.gridTemplateColumns = 'repeat(4, 1fr)';
      boardEl.innerHTML = deck.map(function (c, i) {
        const show = c.open || c.done;
        const bg = c.done ? 'color-mix(in srgb, #22c55e 30%, transparent)' : show ? 'var(--accent)' : 'color-mix(in srgb, var(--text) 16%, transparent)';
        return '<button data-i="' + i + '" style="font-size:26px;background:' + bg
          + ';color:#fff;border-radius:10px">'
          + (show ? c.v : '❓') + '</button>';
      }).join('');
    }

    function startTimer() {
      if (timer) return;
      startAt = Date.now();
      timer = setInterval(function () {
        seconds = Math.round((Date.now() - startAt) / 1000);
        timeEl.textContent = seconds + 's';
      }, 500);
    }

    function flip(i) {
      if (lock || deck[i].open || deck[i].done) return;
      startTimer();
      deck[i].open = true;
      flips.push(i);
      render();
      if (flips.length < 2) return;
      moves++;
      movesEl.textContent = moves;
      const a = deck[flips[0]], b = deck[flips[1]];
      if (a.v === b.v) {
        a.done = true;
        b.done = true;
        a.open = false;
        b.open = false;
        pairs++;
        flips = [];
        render();
        if (pairs === total) win();
      } else {
        lock = true;
        setTimeout(function () {
          a.open = false;
          b.open = false;
          flips = [];
          lock = false;
          render();
        }, 750);
      }
    }

    function win() {
      if (timer) { clearInterval(timer); timer = null; }
      const bm = App.store.get('memory', 'bestmoves', 0);
      const bt = App.store.get('memory', 'besttime', 0);
      const recM = !bm || moves < bm;
      const recT = !bt || seconds < bt;
      if (recM) App.store.set('memory', 'bestmoves', moves);
      if (recT) App.store.set('memory', 'besttime', seconds);
      msgEl.textContent = '🎉 全部配对!用了 ' + moves + ' 步 ' + seconds + 's'
        + (recM || recT ? '(新纪录!)' : '');
      App.beep(2);
      renderBest();
    }

    boardEl.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-i]');
      if (!btn) return;
      flip(+btn.dataset.i);
    });

    el.querySelector('#mmNew').addEventListener('click', newGame);

    newGame();

    return function () {
      if (timer) clearInterval(timer);
    };
  },
});
