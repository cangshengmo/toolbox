/* 随机决定器：转盘 / 抽签 / 掷硬币 */
App.registerTool({
  id: 'decide', name: '随机决定', icon: '🎡', desc: '转盘/抽签/掷硬币', order: 60,
  render(el) {
    el.innerHTML = `
      <div class="seg" id="dSeg">
        <button class="seg-btn active" data-v="wheel">转盘</button>
        <button class="seg-btn" data-v="lots">抽签</button>
        <button class="seg-btn" data-v="coin">掷硬币</button>
      </div>
      <div id="dBody"></div>
    `;
    const body = el.querySelector('#dBody');
    const timers = [];
    const rafs = [];
    const addIv = (fn, ms) => { const t = setInterval(fn, ms); timers.push(t); return t; };
    const addRaf = fn => {
      let alive = true;
      const loop = ts => {
        if (!alive) return;
        fn(ts);
        rafs.push(requestAnimationFrame(loop));
      };
      rafs.push(requestAnimationFrame(loop));
    };

    function show(v) {
      el.querySelectorAll('.seg-btn').forEach(x => x.classList.toggle('active', x.dataset.v === v));
      if (v === 'wheel') renderWheel();
      else if (v === 'lots') renderLots();
      else renderCoin();
    }
    el.querySelector('#dSeg').addEventListener('click', e => {
      const b = e.target.closest('[data-v]');
      if (b) show(b.dataset.v);
    });

    /* ---------- 转盘 ---------- */
    function renderWheel() {
      const COLORS = ['#4f6ef7', '#f7b84f', '#4fc3f7', '#ef5350', '#66bb6a', '#ab47bc', '#ffa726', '#26a69a'];
      let opts = App.store.get('decide', 'wheel', ['火锅', '烧烤', '日料', '汉堡', '面条', '饺子']);
      let rot = 0, spinning = false;

      body.innerHTML = `
        <canvas id="dCv" width="640" height="640" style="width:100%;max-width:320px;aspect-ratio:1;display:block;margin:0 auto"></canvas>
        <div class="row">
          <button class="btn-primary grow" id="dSpin">开始</button>
        </div>
        <div class="card" id="dRes" style="display:none;text-align:center">
          <div class="muted">转盘结果</div>
          <div style="font-size:26px;font-weight:700" id="dResText"></div>
        </div>
        <div class="card">
          <div class="muted" style="margin-bottom:6px">选项（一行一个，2-8 个）</div>
          <textarea class="input" id="dOpts" rows="6"></textarea>
        </div>
      `;
      const cv = body.querySelector('#dCv');
      const ctx = cv.getContext('2d');
      const ta = body.querySelector('#dOpts');
      ta.value = opts.join('\n');

      function draw() {
        const W = cv.width, R = W / 2, n = opts.length;
        const arc = Math.PI * 2 / n;
        ctx.clearRect(0, 0, W, W);
        ctx.save();
        ctx.translate(R, R);
        ctx.rotate(rot);
        for (let i = 0; i < n; i++) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, R - 6, i * arc, (i + 1) * arc);
          ctx.closePath();
          ctx.fillStyle = COLORS[i % COLORS.length];
          ctx.fill();
        }
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,.3)';
        for (let i = 0; i < n; i++) {
          const mid = i * arc + arc / 2;
          ctx.save();
          ctx.rotate(mid);
          ctx.translate(R * 0.6, 0);
          ctx.rotate(Math.PI / 2);
          const label = opts[i].length > 6 ? opts[i].slice(0, 6) + '…' : opts[i];
          ctx.strokeText(label, 0, 0, R * 0.66);
          ctx.fillText(label, 0, 0, R * 0.66);
          ctx.restore();
        }
        ctx.restore();
        ctx.beginPath();
        ctx.arc(R, R, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#f5f6fa';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(R, 10); ctx.lineTo(R - 16, 52); ctx.lineTo(R + 16, 52);
        ctx.closePath();
        ctx.fillStyle = '#e5484d';
        ctx.fill();
      }
      draw();

      const winnerOf = r => {
        const n = opts.length, arc = Math.PI * 2 / n;
        const norm = a => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        return Math.floor(norm(Math.PI * 1.5 - r) / arc) % n;
      };
      body.querySelector('#dSpin').addEventListener('click', () => {
        if (spinning) return;
        if (opts.length < 2) { App.toast('至少 2 个选项'); return; }
        spinning = true;
        body.querySelector('#dRes').style.display = 'none';
        ta.disabled = true;
        const btn = body.querySelector('#dSpin');
        btn.disabled = true;
        const start = performance.now();
        const dur = 3500;
        const total = (6 + Math.random() * 0.9) * Math.PI * 2;
        const from = rot;
        const ease = t => 1 - Math.pow(1 - t, 3);
        const step = ts => {
          const t = Math.min(1, (ts - start) / dur);
          rot = from + total * ease(t);
          draw();
          if (t < 1) rafs.push(requestAnimationFrame(step));
          else {
            spinning = false;
            ta.disabled = false;
            btn.disabled = false;
            const w = opts[winnerOf(rot)];
            body.querySelector('#dRes').style.display = '';
            body.querySelector('#dResText').textContent = w;
            App.toast('就决定是你了：' + w);
          }
        };
        rafs.push(requestAnimationFrame(step));
      });
      ta.addEventListener('input', () => {
        if (spinning) return;
        opts = ta.value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 8);
        App.store.set('decide', 'wheel', opts);
        if (opts.length >= 2) draw();
      });
    }

    /* ---------- 抽签 ---------- */
    function renderLots() {
      let lots = App.store.get('decide', 'lots', ['谁去洗碗', '我', '对象', '猜拳决定']);
      body.innerHTML = `
        <div class="card" style="text-align:center;min-height:120px;display:flex;flex-direction:column;justify-content:center">
          <div style="font-size:34px;font-weight:700;word-break:break-all" id="dLotShow">${App.esc(lots[0] || '？')}</div>
        </div>
        <div class="row">
          <button class="btn-primary grow" id="dLotBtn">抽一个</button>
        </div>
        <div class="card">
          <div class="muted" style="margin-bottom:6px">候选（一行一个）</div>
          <textarea class="input" id="dLotOpts" rows="5"></textarea>
        </div>
      `;
      const show = body.querySelector('#dLotShow');
      const ta = body.querySelector('#dLotOpts');
      ta.value = lots.join('\n');
      ta.addEventListener('input', () => {
        lots = ta.value.split('\n').map(s => s.trim()).filter(Boolean);
        App.store.set('decide', 'lots', lots);
      });
      body.querySelector('#dLotBtn').addEventListener('click', () => {
        if (!lots.length) { App.toast('先填几个候选'); return; }
        const btn = body.querySelector('#dLotBtn');
        btn.disabled = true;
        const t0 = Date.now();
        const iv = addIv(() => {
          if (Date.now() - t0 >= 1200) {
            clearInterval(iv);
            const pick = lots[Math.floor(Math.random() * lots.length)];
            show.textContent = pick;
            App.toast('抽中了：' + pick);
            btn.disabled = false;
          } else {
            show.textContent = lots[Math.floor(Math.random() * lots.length)];
          }
        }, 80);
      });
    }

    /* ---------- 掷硬币 ---------- */
    function renderCoin() {
      let coin = App.store.get('decide', 'coin', { heads: 0, tails: 0 });
      body.innerHTML = `
        <div class="card" style="text-align:center;min-height:160px;display:flex;flex-direction:column;justify-content:center">
          <div style="font-size:56px" id="dCoinFace">🪙</div>
          <div style="font-size:30px;font-weight:700" id="dCoinOut">&nbsp;</div>
        </div>
        <div class="row">
          <button class="btn-primary grow" id="dFlip">掷一次</button>
        </div>
        <div class="muted" style="text-align:center" id="dCoinStat"></div>
      `;
      const face = body.querySelector('#dCoinFace');
      const out = body.querySelector('#dCoinOut');
      const stat = body.querySelector('#dCoinStat');
      const renderStat = () => { stat.textContent = '正面 ' + coin.heads + ' · 反面 ' + coin.tails; };
      renderStat();
      body.querySelector('#dFlip').addEventListener('click', () => {
        const btn = body.querySelector('#dFlip');
        btn.disabled = true;
        const t0 = Date.now();
        const iv = addIv(() => {
          if (Date.now() - t0 >= 1000) {
            clearInterval(iv);
            const heads = Math.random() < 0.5;
            face.textContent = '🪙';
            out.textContent = heads ? '正面' : '反面';
            if (heads) coin.heads++; else coin.tails++;
            App.store.set('decide', 'coin', coin);
            renderStat();
            btn.disabled = false;
          } else {
            face.textContent = Math.random() < 0.5 ? '🙂' : '🙃';
          }
        }, 80);
      });
    }

    return () => {
      timers.forEach(clearInterval);
      rafs.forEach(id => cancelAnimationFrame(id));
    };
  }
});
