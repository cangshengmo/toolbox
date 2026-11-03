/* 百宝箱 · 数独:四宫/六宫/九宫渐进难度(回溯生成,唯一解) */
App.registerTool({
  id: 'sudoku',
  name: '数独',
  icon: 'grid-3x3',
  desc: '四六九宫渐进难度',
  order: 65,

  render(el) {
    const SIZES = {
      4: { R: 2, C: 2, clues: 7, label: '四宫格' },
      6: { R: 2, C: 3, clues: 14, clueMin: 12, label: '六宫格' },
      9: { R: 3, C: 3, clues: 38, clueMin: 30, label: '九宫格' },
    };
    let N = 4, R = 2, C = 2;
    let sol = null;     // 解
    let board = null;   // 当前局面(0=空)
    let given = null;   // 原题固定格
    let sel = -1;
    let startAt = 0;
    let timer = null;
    let seconds = 0;
    let done = false;

    el.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <select id="skSize" class="select grow">
            <option value="4">四宫格(入门)</option>
            <option value="6">六宫格(进阶)</option>
            <option value="9">九宫格(经典)</option>
          </select>
          <button id="skNew" class="btn btn-primary" style="min-height:44px">新题</button>
        </div>
      </div>
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <span class="item-title" style="flex:1">⏱ <span id="skTime">0s</span></span>
          <span class="muted" style="font-size:12px" id="skMsg">点格子,再点数字盘填入</span>
        </div>
      </div>
      <div class="g2048-board" id="skBoard" style="gap:2px;padding:4px"></div>
      <div class="card">
        <div id="skPad" style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap"></div>
      </div>
      <div class="muted" style="font-size:12px;text-align:center" id="skBest"></div>`;

    const sizeEl = el.querySelector('#skSize');
    const boardEl = el.querySelector('#skBoard');
    const padEl = el.querySelector('#skPad');
    const timeEl = el.querySelector('#skTime');
    const msgEl = el.querySelector('#skMsg');
    const bestEl = el.querySelector('#skBest');

    function shuffle(a) {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    function isSafe(g, r, c, v) {
      for (let i = 0; i < N; i++) {
        if (g[r][i] === v || g[i][c] === v) return false;
      }
      const br = Math.floor(r / R) * R, bc = Math.floor(c / C) * C;
      for (let i = 0; i < R; i++) {
        for (let j = 0; j < C; j++) {
          if (g[br + i][bc + j] === v) return false;
        }
      }
      return true;
    }

    function fillAll(g, pos) {
      if (pos === N * N) return true;
      const r = Math.floor(pos / N), c = pos % N;
      const vals = shuffle(Array.from({ length: N }, function (_, i) { return i + 1; }));
      for (let i = 0; i < N; i++) {
        if (isSafe(g, r, c, vals[i])) {
          g[r][c] = vals[i];
          if (fillAll(g, pos + 1)) return true;
          g[r][c] = 0;
        }
      }
      return false;
    }

    /* 数解数,达到 limit 即早退 */
    function countSolutions(g, limit) {
      let count = 0;
      function dfs() {
        if (count >= limit) return;
        let target = -1;
        for (let i = 0; i < N * N && target < 0; i++) {
          if (g[Math.floor(i / N)][i % N] === 0) target = i;
        }
        if (target < 0) { count++; return; }
        const r = Math.floor(target / N), c = target % N;
        for (let v = 1; v <= N; v++) {
          if (isSafe(g, r, c, v)) {
            g[r][c] = v;
            dfs();
            g[r][c] = 0;
            if (count >= limit) return;
          }
        }
      }
      dfs();
      return count;
    }

    function generate() {
      const cfg = SIZES[N];
      sol = Array.from({ length: N }, function () { return Array(N).fill(0); });
      fillAll(sol, 0);
      board = sol.map(function (row) { return row.slice(); });
      const clues = Math.max(cfg.clueMin || 4, cfg.clues - Math.floor(Math.random() * 3));
      const positions = shuffle(Array.from({ length: N * N }, function (_, i) { return i; }));
      let removed = 0;
      for (let p = 0; p < positions.length; p++) {
        if (N * N - removed <= clues) break;
        const r = Math.floor(positions[p] / N), c = positions[p] % N;
        const backup = board[r][c];
        board[r][c] = 0;
        if (countSolutions(board.map(function (row) { return row.slice(); }), 2) !== 1) {
          board[r][c] = backup;
        } else {
          removed++;
        }
      }
      given = board.map(function (row) { return row.map(function (v) { return v !== 0; }); });
      sel = -1;
      done = false;
      seconds = 0;
      if (timer) { clearInterval(timer); timer = null; }
      timeEl.textContent = '0s';
      msgEl.textContent = '点格子,再点数字盘填入';
      render();
      renderPad();
      renderBest();
    }

    function renderPad() {
      let html = '';
      for (let v = 1; v <= N; v++) {
        html += '<button class="btn" data-v="' + v + '" style="min-width:44px;min-height:44px;font-size:17px">' + v + '</button>';
      }
      html += '<button class="btn" data-v="0" style="min-width:60px;min-height:44px;font-size:14px">清除</button>';
      padEl.innerHTML = html;
    }

    function render() {
      let html = '';
      for (let i = 0; i < N * N; i++) {
        const r = Math.floor(i / N), c = i % N;
        const v = board[r][c];
        const thickR = (c % C === C - 1 && c !== N - 1) ? '2px' : '1px';
        const thickB = (r % R === R - 1 && r !== N - 1) ? '2px' : '1px';
        const style = 'border-right:' + thickR + ' solid var(--border);border-bottom:' + thickB + ' solid var(--border);'
          + 'font-size:' + (N === 9 ? '15px' : '19px') + ';'
          + (given[r][c] ? 'font-weight:700;' : 'color:var(--accent);')
          + (sel === i ? 'background:color-mix(in srgb, var(--accent) 25%, transparent);' : '');
        html += '<button data-i="' + i + '" style="' + style + '">' + (v ? v : '') + '</button>';
      }
      boardEl.innerHTML = html;
    }

    function checkWin() {
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (board[r][c] !== sol[r][c]) return;
        }
      }
      done = true;
      if (timer) { clearInterval(timer); timer = null; }
      const best = App.store.get('sudoku', 'best' + N, 0);
      const isRecord = !best || seconds < best;
      if (isRecord) App.store.set('sudoku', 'best' + N, seconds);
      msgEl.textContent = '🎉 完成!用时 ' + seconds + 's' + (isRecord ? '(新纪录!)' : '');
      App.beep(2);
      renderBest();
    }

    function startTimer() {
      if (timer || done) return;
      startAt = Date.now() - seconds * 1000;
      timer = setInterval(function () {
        seconds = Math.round((Date.now() - startAt) / 1000);
        timeEl.textContent = seconds + 's';
      }, 500);
    }

    boardEl.addEventListener('click', function (e) {
      if (done) return;
      const btn = e.target.closest('button[data-i]');
      if (!btn) return;
      const i = +btn.dataset.i;
      if (given[Math.floor(i / N)][i % N]) { App.toast('原题数字不能改'); return; }
      sel = i;
      startTimer();
      render();
    });

    padEl.addEventListener('click', function (e) {
      if (done || sel < 0) { if (sel < 0) App.toast('先点一个空格'); return; }
      const btn = e.target.closest('button[data-v]');
      if (!btn) return;
      const v = +btn.dataset.v;
      const r = Math.floor(sel / N), c = sel % N;
      board[r][c] = v;
      if (v !== 0 && v !== sol[r][c]) {
        App.toast('与答案不符');
      }
      render();
      checkWin();
    });

    el.querySelector('#skNew').addEventListener('click', generate);
    sizeEl.addEventListener('change', function () {
      N = +sizeEl.value;
      const cfg = SIZES[N];
      R = cfg.R; C = cfg.C;
      generate();
    });

    function renderBest() {
      bestEl.textContent = '最快:四宫 ' + App.store.get('sudoku', 'best4', 0) + 's · 六宫 '
        + App.store.get('sudoku', 'best6', 0) + 's · 九宫 ' + App.store.get('sudoku', 'best9', 0) + 's(0 = 无记录)';
    }

    generate();

    return function () {
      if (timer) clearInterval(timer);
    };
  },
});
