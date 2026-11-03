/* 百宝箱 · 密码生成器：长度/字符集定制，强度提示 */
App.registerTool({
  id: 'password',
  name: '密码生成器',
  icon: 'key-round',
  desc: '密码生成与强度提示',
  order: 44,

  render(el) {
    el.innerHTML = `
      <div class="card">
        <div style="display:flex;align-items:center;gap:8px;background:color-mix(in srgb, var(--text) 6%, transparent);border-radius:12px;padding:12px;min-height:56px">
          <div id="pwOut" style="flex:1;min-width:0;font-size:17px;font-weight:600;word-break:break-all;font-variant-numeric:tabular-nums"></div>
          <button class="icon-btn" id="pwCopy" aria-label="复制密码" style="min-width:44px;min-height:44px">📋</button>
        </div>
        <div class="row" style="margin-top:12px">
          <span class="muted" style="flex:0 0 56px">长度</span>
          <input id="pwLen" type="range" min="8" max="32" value="16" style="flex:1;accent-color:var(--accent)">
          <span id="pwLenShow" style="min-width:28px;text-align:right;font-weight:600">16</span>
        </div>
        <div class="row" style="margin-bottom:0;flex-wrap:wrap;gap:8px">
          <label class="chip" style="cursor:pointer"><input type="checkbox" id="pwU" checked> 大写</label>
          <label class="chip" style="cursor:pointer"><input type="checkbox" id="pwL" checked> 小写</label>
          <label class="chip" style="cursor:pointer"><input type="checkbox" id="pwD" checked> 数字</label>
          <label class="chip" style="cursor:pointer"><input type="checkbox" id="pwS" checked> 符号</label>
          <label class="chip" style="cursor:pointer"><input type="checkbox" id="pwAmb"> 排除易混淆 0O1lI</label>
        </div>
      </div>
      <div class="card" id="pwMeta"></div>
      <button id="pwGen" class="btn btn-primary" style="width:100%;min-height:48px">🎲 重新生成</button>`;

    const outEl = el.querySelector('#pwOut');
    const metaEl = el.querySelector('#pwMeta');
    const lenEl = el.querySelector('#pwLen');
    const lenShowEl = el.querySelector('#pwLenShow');
    const ambEl = el.querySelector('#pwAmb');

    const SETS = {
      u: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      l: 'abcdefghijklmnopqrstuvwxyz',
      d: '0123456789',
      s: '!@#$%^&*()-_=+[]{};:,.<>?',
      uAmb: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
      lAmb: 'abcdefghijkmnopqrstuvwxyz',
      dAmb: '23456789',
    };

    function pool() {
      const amb = ambEl.checked;
      const parts = [];
      if (el.querySelector('#pwU').checked) parts.push(amb ? SETS.uAmb : SETS.u);
      if (el.querySelector('#pwL').checked) parts.push(amb ? SETS.lAmb : SETS.l);
      if (el.querySelector('#pwD').checked) parts.push(amb ? SETS.dAmb : SETS.d);
      if (el.querySelector('#pwS').checked) parts.push(SETS.s);
      return parts.join('');
    }

    /* 拒绝采样取无偏随机下标 */
    function randInt(max) {
      const a = new Uint32Array(1);
      const lim = Math.floor(0x100000000 / max) * max;
      let x;
      do { crypto.getRandomValues(a); x = a[0]; } while (x >= lim);
      return x % max;
    }

    function gen() {
      const chars = pool();
      if (!chars) { outEl.textContent = '请至少选一类字符'; metaEl.innerHTML = ''; return; }
      const n = +lenEl.value;
      let s = '';
      for (let i = 0; i < n; i++) s += chars[randInt(chars.length)];
      outEl.textContent = s;
      const bits = Math.round(n * Math.log2(chars.length));
      const label = bits >= 100 ? '极强' : bits >= 80 ? '强' : bits >= 60 ? '中' : '弱';
      const color = bits >= 80 ? 'var(--accent)' : bits >= 60 ? '#f59e0b' : '#e5484d';
      metaEl.innerHTML = '<div class="row" style="margin-bottom:0;justify-content:space-between">'
        + '<span class="muted">强度</span>'
        + '<span style="font-weight:700;color:' + color + '">' + label + ' · ' + bits + ' bits</span></div>';
    }

    function copy() {
      const s = outEl.textContent;
      if (!s || s === '请至少选一类字符') return;
      navigator.clipboard.writeText(s).then(function () { App.toast('已复制'); }, function () { App.toast('复制失败'); });
    }

    el.querySelectorAll('input[type="checkbox"]').forEach(function (c) {
      c.addEventListener('change', gen);
    });
    lenEl.addEventListener('input', function () {
      lenShowEl.textContent = lenEl.value;
      gen();
    });
    el.querySelector('#pwCopy').addEventListener('click', copy);
    el.querySelector('#pwGen').addEventListener('click', gen);

    gen();
  },
});
