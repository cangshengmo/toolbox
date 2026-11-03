/* 百宝箱 · 2048：经典数字合并小游戏 */
App.registerTool({
  id: 'g2048',
  name: '2048',
  icon: 'grid-2x2',
  desc: '经典数字合并小游戏',
  order: 61,

  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <div class="item-main">
            <div class="item-title">分数 <span id="g2Score" style="font-size:22px;color:var(--accent)">0</span></div>
            <div class="item-sub">最高分 <span id="g2Best">0</span> · 滑动或方向键操作</div>
            <div class="item-sub" id="g2Msg"></div>
          </div>
          <button id="g2New" class="btn btn-primary" style="min-height:40px">新游戏</button>
        </div>
      </div>
      <div class="g2048-board" id="g2Board"></div>
      <div class="muted" style="font-size:12px;margin-top:8px;text-align:center">滑动合并相同数字，目标 2048；进度自动保存</div>`;

    const scoreEl = el.querySelector('#g2Score');
    const bestEl = el.querySelector('#g2Best');
    const msgEl = el.querySelector('#g2Msg');
    const boardEl = el.querySelector('#g2Board');

    const COLORS = {
      2: ['#eee4da', '#776e65'],
      4: ['#ede0c8', '#776e65'],
      8: ['#f2b179', '#fff'],
      16: ['#f59563', '#fff'],
      32: ['#f67c5f', '#fff'],
      64: ['#f65e3b', '#fff'],
      128: ['#edcf72', '#fff'],
      256: ['#edcc61', '#fff'],
      512: ['#edc850', '#fff'],
      1024: ['#edc53f', '#fff'],
      2048: ['#edc22e', '#fff'],
    };

    let grid = null;
    let score = 0;
    let best = App.store.get('g2048', 'best', 0);
    let won = false;

    function save() {
      App.store.set('g2048', 'state', { grid: grid, score: score, won: won });
      App.store.set('g2048', 'best', best);
    }

    function spawn() {
      const empties = [];
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (grid[i][j] === 0) empties.push([i, j]);
        }
      }
      if (!empties.length) return;
      const p = empties[Math.floor(Math.random() * empties.length)];
      grid[p[0]][p[1]] = Math.random() < 0.9 ? 2 : 4;
    }

    function newGame() {
      grid = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
      score = 0;
      won = false;
      spawn();
      spawn();
      msgEl.textContent = '';
      save();
      render();
    }

    function render() {
      let html = '';
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const v = grid[i][j];
          const c = COLORS[v] || ['#3c3a32', '#fff'];
          html += '<div class="g2048-cell" style="background:' + c[0] + ';color:' + c[1] + '">'
            + (v ? v : '') + '</div>';
        }
      }
      boardEl.innerHTML = html;
      scoreEl.textContent = score;
      bestEl.textContent = best;
    }

    function gameOver() {
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (grid[i][j] === 0) return false;
          if (j < 3 && grid[i][j] === grid[i][j + 1]) return false;
          if (i < 3 && grid[i][j] === grid[i + 1][j]) return false;
        }
      }
      return true;
    }

    /* 单行向左压缩+合并,返回新行与得分 */
    function slideRow(row) {
      const arr = row.filter(function (v) { return v !== 0; });
      const out = [];
      let gained = 0;
      for (let i = 0; i < arr.length; i++) {
        if (i + 1 < arr.length && arr[i] === arr[i + 1]) {
          out.push(arr[i] * 2);
          gained += arr[i] * 2;
          i++;
        } else {
          out.push(arr[i]);
        }
      }
      while (out.length < 4) out.push(0);
      return { row: out, gained: gained };
    }

    /* dir: 0=左 1=上 2=右 3=下 */
    function move(dir) {
      let moved = false;
      let gain = 0;
      for (let i = 0; i < 4; i++) {
        const line = [];
        for (let j = 0;j < 4; j++) {
          if (dir === 0) line.push(grid[i][j]);
          else if (dir === 2) line.push(grid[i][3 - j]);
          else if (dir === 1) line.push(grid[j][i]);
          else line.push(grid[3 - j][i]);
        }
        const res = slideRow(line);
        gain += res.gained;
        for (let j = 0; j < 4; j++) {
          let ni = i, nj = j;
          if (dir === 2) nj = 3 - j;
          else if (dir === 1) { ni = j; nj = i; }
          else if (dir === 3) { ni = 3 - j; nj = i; }
          if (grid[ni][nj] !== res.row[j]) moved = true;
          grid[ni][nj] = res.row[j];
        }
      }
      if (!moved) return;
      score += gain;
      if (score > best) { best = score; }
      spawn();
      if (!won && grid.flat().indexOf(2048) !== -1) {
        won = true;
        App.toast('🎉 达成 2048!');
        App.beep(2);
      }
      if (gameOver()) {
        msgEl.textContent = '游戏结束,得分 ' + score;
      }
      save();
      render();
    }

    /* 键盘方向键(cleanup 时移除) */
    function onKey(e) {
      const map = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3 };
      if (!(e.key in map)) return;
      e.preventDefault();
      move(map[e.key]);
    }
    document.addEventListener('keydown', onKey);

    /* 触摸滑动 */
    let ts = null;
    boardEl.addEventListener('touchstart', function (e) {
      ts = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    boardEl.addEventListener('touchend', function (e) {
      if (!ts) return;
      const dx = e.changedTouches[0].clientX - ts.x;
      const dy = e.changedTouches[0].clientY - ts.y;
      ts = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 2 : 0);
      else move(dy > 0 ? 3 : 1);
    }, { passive: true });

    el.querySelector('#g2New').addEventListener('click', newGame);

    /* 恢复存档 */
    const st = App.store.get('g2048', 'state', null);
    if (st && Array.isArray(st.grid) && st.grid.length === 4 && typeof st.score === 'number') {
      grid = st.grid;
      score = st.score;
      won = !!st.won;
      render();
    } else {
      newGame();
    }

    return function () {
      document.removeEventListener('keydown', onKey);
    };
  },
});
