/* 百宝箱 · 五子棋:双人同屏对战 */
App.registerTool({
  id: 'gomoku',
  name: '五子棋',
  icon: 'circle-dot',
  desc: '双人同屏五连珠',
  order: 66,

  render(el) {
    const LINE = 15;
    const PAD = 16;
    const CELL = 21;
    const SIZE = PAD * 2 + CELL * (LINE - 1);
    let grid = [];     // 0 空 1 黑 2 白
    let turn = 1;
    let over = false;
    let moves = [];
    let score = App.store.get('gomoku', 'score', { b: 0, w: 0 });
    if (!score || typeof score !== 'object') score = { b: 0, w: 0 };

    el.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <span class="item-title" style="flex:1" id="gkTurn">⚫ 黑方落子</span>
          <button id="gkUndo" class="btn" style="min-height:40px;font-size:13px">悔棋</button>
          <button id="gkNew" class="btn btn-primary" style="min-height:40px">新局</button>
        </div>
      </div>
      <div class="card" style="display:flex;justify-content:center">
        <canvas id="gkCv" width="${SIZE}" height="${SIZE}" style="max-width:100%;touch-action:manipulation;cursor:pointer"></canvas>
      </div>
      <div class="muted" id="gkMsg" style="font-size:12.5px;text-align:center;margin-top:8px">黑先白后,先连成五子者胜</div>
      <div class="card">
        <div class="row" style="margin-bottom:0;justify-content:space-around;text-align:center">
          <div><div class="muted" style="font-size:12px">黑方胜局</div><div class="item-title" id="gkSB">0</div></div>
          <div><div class="muted" style="font-size:12px">白方胜局</div><div class="item-title" id="gkSW">0</div></div>
        </div>
      </div>`;

    const cv = el.querySelector('#gkCv');
    const ctx = cv.getContext('2d');
    const turnEl = el.querySelector('#gkTurn');
    const msgEl = el.querySelector('#gkMsg');
    const sbEl = el.querySelector('#gkSB');
    const swEl = el.querySelector('#gkSW');

    function save() {
      App.store.set('gomoku', 'score', score);
    }

    function renderScore() {
      sbEl.textContent = score.b;
      swEl.textContent = score.w;
    }

    function draw() {
      ctx.fillStyle = '#e8c17a';
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.strokeStyle = '#7a5c2e';
      ctx.lineWidth = 1;
      for (let i = 0; i < LINE; i++) {
        ctx.beginPath();
        ctx.moveTo(PAD, PAD + i * CELL);
        ctx.lineTo(SIZE - PAD, PAD + i * CELL);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(PAD + i * CELL, PAD);
        ctx.lineTo(PAD + i * CELL, SIZE - PAD);
        ctx.stroke();
      }
      /* 星位 */
      [[3, 3], [11, 3], [7, 7], [3, 11], [11, 11]].forEach(function (p) {
        ctx.beginPath();
        ctx.arc(PAD + p[0] * CELL, PAD + p[1] * CELL, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#7a5c2e';
        ctx.fill();
      });
      moves.forEach(function (m, i) {
        ctx.beginPath();
        ctx.arc(PAD + m.x * CELL, PAD + m.y * CELL, CELL * 0.44, 0, Math.PI * 2);
        ctx.fillStyle = m.v === 1 ? '#1a1c20' : '#f5f0e6';
        ctx.fill();
        ctx.strokeStyle = m.v === 1 ? '#000' : '#999';
        ctx.stroke();
        if (i === moves.length - 1) {
          ctx.beginPath();
          ctx.arc(PAD + m.x * CELL, PAD + m.y * CELL, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = m.v === 1 ? '#fff' : '#333';
          ctx.fill();
        }
      });
    }

    function newGame() {
      grid = Array.from({ length: LINE }, function () { return Array(LINE).fill(0); });
      turn = 1;
      over = false;
      moves = [];
      turnEl.textContent = '⚫ 黑方落子';
      msgEl.textContent = '黑先白后,先连成五子者胜';
      draw();
    }

    function checkWin(x, y, v) {
      const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
      for (const d of dirs) {
        let count = 1;
        for (const s of [1, -1]) {
          let nx = x + d[0] * s, ny = y + d[1] * s;
          while (nx >= 0 && nx < LINE && ny >= 0 && ny < LINE && grid[ny][nx] === v) {
            count++;
            nx += d[0] * s;
            ny += d[1] * s;
          }
        }
        if (count >= 5) return true;
      }
      return false;
    }

    function place(x, y) {
      if (over || grid[y][x] !== 0) return;
      grid[y][x] = turn;
      moves.push({ x: x, y: y, v: turn });
      draw();
      if (checkWin(x, y, turn)) {
        over = true;
        const name = turn === 1 ? '黑方' : '白方';
        msgEl.textContent = '🎉 ' + name + '五连珠获胜!' + (moves.length ? ' 共 ' + moves.length + ' 手' : '');
        if (turn === 1) score.b++; else score.w++;
        save();
        renderScore();
        App.beep(2);
        return;
      }
      if (moves.length === LINE * LINE) {
        over = true;
        msgEl.textContent = '棋盘已满,平局';
        return;
      }
      turn = turn === 1 ? 2 : 1;
      turnEl.textContent = turn === 1 ? '⚫ 黑方落子' : '⚪ 白方落子';
    }

    cv.addEventListener('click', function (e) {
      if (over) return;
      const rect = cv.getBoundingClientRect();
      const scale = SIZE / rect.width;
      const px = (e.clientX - rect.left) * scale;
      const py = (e.clientY - rect.top) * scale;
      const x = Math.round((px - PAD) / CELL);
      const y = Math.round((py - PAD) / CELL);
      if (x < 0 || x >= LINE || y < 0 || y >= LINE) return;
      place(x, y);
    });

    el.querySelector('#gkUndo').addEventListener('click', function () {
      if (!moves.length || over) { if (over) App.toast('已结束,开新局吧'); return; }
      const last = moves.pop();
      grid[last.y][last.x] = 0;
      turn = last.v;
      over = false;
      turnEl.textContent = turn === 1 ? '⚫ 黑方落子' : '⚪ 白方落子';
      msgEl.textContent = '已悔一手';
      draw();
    });

    el.querySelector('#gkNew').addEventListener('click', newGame);

    renderScore();
    newGame();
  },
});
