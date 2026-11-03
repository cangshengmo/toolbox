/* 百宝箱 · 扫雷:经典扫雷,手机友好棋盘 */
App.registerTool({
  id: 'mine',
  name: '扫雷',
  icon: 'bomb',
  desc: '经典扫雷手机友好',
  order: 63,

  render(el) {
    const LEVELS = {
      easy: { w: 9, h: 9, mines: 10, label: '简单 9×9' },
      mid: { w: 12, h: 12, mines: 25, label: '中等 12×12' },
    };
    let W = 9, H = 9, MINES = 10;
    let cells = [];      // {mine, adj, open, flag}
    let started = false;
    let over = false;
    let opened = 0;
    let flagMode = false;
    let flags = 0;
    let t0 = 0;
    let timer = null;
    let seconds = 0;

    el.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <select id="mnLevel" class="select grow">
            <option value="easy">简单 9×9 · 10 雷</option>
            <option value="mid">中等 12×12 · 25 雷</option>
          </select>
          <button id="mnNew" class="btn btn-primary" style="min-height:44px">新局</button>
        </div>
      </div>
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <span class="item-title" style="flex:1">💣 <span id="mnLeft">10</span></span>
          <button id="mnFlag" class="icon-btn" aria-label="插旗模式" style="min-width:44px;min-height:44px;font-size:18px">🚩</button>
          <span class="item-title" style="flex:0 0 auto;text-align:right;min-width:56px">⏱ <span id="mnTime">0s</span></span>
        </div>
      </div>
      <div class="g2048-board" id="mnBoard" style="touch-action:auto"></div>
      <div class="muted" id="mnMsg" style="font-size:12.5px;margin-top:8px;text-align:center">点击挖开;插旗模式下点格子插旗</div>
      <div class="muted" style="font-size:12px;margin-top:4px;text-align:center" id="mnBest"></div>`;

    const levelEl = el.querySelector('#mnLevel');
    const boardEl = el.querySelector('#mnBoard');
    const leftEl = el.querySelector('#mnLeft');
    const timeEl = el.querySelector('#mnTime');
    const msgEl = el.querySelector('#mnMsg');
    const bestEl = el.querySelector('#mnBest');
    const flagBtn = el.querySelector('#mnFlag');

    function bestOf() { return App.store.get('mine', 'best' + levelEl.value, 0); }

    function renderBest() {
      bestEl.textContent = '最快用时:简单 ' + App.store.get('mine', 'besteasy', 0) + 's · 中等 ' + App.store.get('mine', 'bestmid', 0) + 's(0 = 无记录)';
    }

    function idx(x, y) { return y * W + x; }

    function neighbors(i) {
      const x = i % W, y = Math.floor(i / W);
      const out = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < W && ny >= 0 && ny < H) out.push(idx(nx, ny));
        }
    }
      return out;
    }

    function newGame() {
      const lv = LEVELS[levelEl.value];
      W = lv.w; H = lv.h; MINES = lv.mines;
      cells = [];
      for (let i = 0; i < W * H; i++) cells.push({ mine: false, adj: 0, open: false, flag: false });
      started = false;
      over = false;
      opened = 0;
      flags = 0;
      seconds = 0;
      t0 = 0;
      if (timer) { clearInterval(timer); timer = null; }
      timeEl.textContent = '0s';
      flagMode = false;
      flagBtn.style.background = '';
      msgEl.textContent = '点击挖开;插旗模式下点格子插旗';
      boardEl.style.gridTemplateColumns = 'repeat(' + W + ', 1fr)';
      boardEl.style.gap = '3px';
      boardEl.style.padding = '6px';
      render();
      renderBest();
    }

    function placeMines(safe) {
      const banned = {};
      banned[safe] = true;
      neighbors(safe).forEach(function (n) { banned[n] = true; });
      let placed = 0;
      while (placed < MINES) {
        const p = Math.floor(Math.random() * W * H);
        if (banned[p] || cells[p].mine) continue;
        cells[p].mine = true;
        placed++;
      }
      cells.forEach(function (c, i) {
        if (c.mine) return;
        c.adj = neighbors(i).filter(function (n) { return cells[n].mine; }).length;
      });
    }

    function openCell(i) {
      if (over || cells[i].open || cells[i].flag) return;
      if (!started) {
        started = true;
        placeMines(i);
        t0 = Date.now();
        timer = setInterval(function () {
          seconds = Math.round((Date.now() - t0) / 1000);
          timeEl.textContent = seconds + 's';
        }, 500);
      }
      if (cells[i].mine) { lose(i); return; }
      const stack = [i];
      while (stack.length) {
        const cur = stack.pop();
        if (cells[cur].open || cells[cur].flag) continue;
        cells[cur].open = true;
        opened++;
        if (cells[cur].adj === 0) {
          neighbors(cur).forEach(function (n) {
            if (!cells[n].open && !cells[n].mine) stack.push(n);
          });
        }
      }
      if (opened === W * H - MINES) win();
      render();
    }

    function toggleFlag(i) {
      if (over || cells[i].open) return;
      cells[i].flag = !cells[i].flag;
      flags += cells[i].flag ? 1 : -1;
      leftEl.textContent = MINES - flags;
      render();
    }

    function lose(hit) {
      over = true;
      clearInterval(timer);
      cells.forEach(function (c) { if (c.mine) c.open = true; });
      cells[hit].hit = true;
      render();
      msgEl.textContent = '💥 踩雷了!点"新局"再来';
      App.beep(2);
    }

    function win() {
      over = true;
      clearInterval(timer);
      const best = bestOf();
      const isRecord = !best || seconds < best;
      if (isRecord) App.store.set('mine', 'best' + levelEl.value, seconds);
      msgEl.textContent = '🎉 通关!用时 ' + seconds + 's' + (isRecord ? '(新纪录!)' : '');
      App.beep(2);
      renderBest();
    }

    function render() {
      boardEl.innerHTML = cells.map(function (c, i) {
        let txt = '';
        let bg = '';
        let fg = '';
        if (c.open) {
          if (c.mine) { txt = '💣'; bg = c.hit ? 'var(--danger)' : 'color-mix(in srgb, var(--danger) 35%, transparent)'; }
          else if (c.adj) { txt = String(c.adj); fg = ['#', 'blue', 'green', 'red', 'purple', 'maroon', 'teal', 'black', 'gray'][c.adj] || 'black'; bg = 'color-mix(in srgb, var(--text) 5%, transparent)'; }
          else { bg = 'color-mix(in srgb, var(--text) 5%, transparent)'; }
        } else if (c.flag) {
          txt = '🚩';
          bg = 'color-mix(in srgb, #f59e0b 30%, transparent)';
        } else {
          bg = 'color-mix(in srgb, var(--text) 16%, transparent)';
        }
        return '<button class="g2048-cell" data-i="' + i + '" style="font-size:14px;font-weight:700;background:' + bg + ';color:' + (fg || 'inherit') + ';border-radius:6px;padding:0">' + txt + '</button>';
      }).join('');
    }

    boardEl.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-i]');
      if (!btn) return;
      const i = +btn.dataset.i;
      if (flagMode) toggleFlag(i);
      else openCell(i);
    });

    flagBtn.addEventListener('click', function () {
      flagMode = !flagMode;
      flagBtn.style.background = flagMode ? 'var(--accent)' : '';
      msgEl.textContent = flagMode ? '插旗模式:点格子插/拔旗' : '挖雷模式:点格子挖开';
    });

    el.querySelector('#mnNew').addEventListener('click', newGame);
    levelEl.addEventListener('change', newGame);

    newGame();

    return function () {
      if (timer) clearInterval(timer);
    };
  },
});
