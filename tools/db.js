/* 百宝箱 · 分贝仪:麦克风实时噪音值(不支持则降级提示) */
App.registerTool({
  id: 'db',
  name: '分贝仪',
  icon: 'mic',
  desc: '麦克风实时噪音值',
  order: 91,

  render(el) {
    el.innerHTML = `
      <div class="card" style="text-align:center">
        <div id="dbVal" style="font-size:46px;font-weight:700;color:var(--accent);font-variant-numeric:tabular-nums">--</div>
        <div class="muted" style="font-size:12.5px">dB(相对参考值,供参考非计量级)</div>
        <div style="height:12px;border-radius:999px;background:color-mix(in srgb, var(--text) 8%, transparent);margin-top:14px;overflow:hidden">
          <div id="dbBar" style="height:100%;width:0%;background:var(--accent);transition:width .15s"></div>
        </div>
        <div class="muted" id="dbDesc" style="font-size:13px;margin-top:10px;min-height:20px"></div>
        <button id="dbStart" class="btn btn-primary" style="min-height:44px;min-width:130px;margin-top:12px">启动麦克风</button>
        <button id="dbStop" class="btn" style="min-height:44px;margin-left:8px" hidden>停止</button>
      </div>
      <div class="muted" style="font-size:12px;text-align:center">对照:图书馆 40 · 交谈 60 · 地铁 80 · 演唱会 110</div>`;

    const valEl = el.querySelector('#dbVal');
    const barEl = el.querySelector('#dbBar');
    const descEl = el.querySelector('#dbDesc');
    const startBtn = el.querySelector('#dbStart');
    const stopBtn = el.querySelector('#dbStop');
    let stream = null;
    let ctx = null;
    let raf = null;

    function describe(v) {
      if (v < 40) return '🌙 安静';
      if (v < 60) return '💬 正常交谈';
      if (v < 80) return '🚗 嘈杂';
      if (v < 100) return '🚇 很吵,注意听力';
      return '🎸 危险,尽快离开';
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      if (stream) {
        stream.getTracks().forEach(function (t) { t.stop(); });
        stream = null;
      }
      if (ctx) {
        try { ctx.close(); } catch (e) { /* ignore */ }
        ctx = null;
      }
      startBtn.hidden = false;
      stopBtn.hidden = true;
    }

    function start() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        descEl.textContent = '此环境不支持麦克风';
        startBtn.disabled = true;
        return;
      }
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
        stream = s;
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        const src = ctx.createMediaStreamSource(s);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        src.connect(analyser);
        const buf = new Float32Array(analyser.fftSize);
        startBtn.hidden = true;
        stopBtn.hidden = false;
        (function loop() {
          if (!stream) return;
          analyser.getFloatTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
          const rms = Math.sqrt(sum / buf.length);
          const db = Math.max(0, Math.min(120, Math.round(20 * Math.log10(rms || 1e-8) + 100)));
          valEl.textContent = db;
          valEl.style.color = db > 100 ? 'var(--danger)' : db > 80 ? '#f59e0b' : 'var(--accent)';
          barEl.style.width = db + '%';
          descEl.textContent = describe(db);
          raf = requestAnimationFrame(loop);
        })();
      }).catch(function () {
        descEl.textContent = '麦克风权限被拒绝或不可用';
        startBtn.disabled = true;
      });
    }

    startBtn.addEventListener('click', start);
    stopBtn.addEventListener('click', stop);

    return function () {
      stop();
    };
  },
});
