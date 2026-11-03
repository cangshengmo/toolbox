/* 百宝箱 · 进制转换:二/八/十/十六进制互换 */
App.registerTool({
  id: 'base',
  name: '进制转换',
  icon: 'binary',
  desc: '二八十十六进制互换',
  order: 44,

  render(el) {
    const BASES = [
      { b: 2, n: '二进制' },
      { b: 8, n: '八进制' },
      { b: 10, n: '十进制' },
      { b: 16, n: '十六进制' },
    ];
    let from = 10;

    el.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <input id="bsIn" class="input grow" type="text" placeholder="输入数值" autocomplete="off" spellcheck="false" style="font-family:ui-monospace,Consolas,monospace">
          <select id="bsFrom" class="select" style="flex:0 0 130px">
            ${BASES.map(function (x) { return '<option value="' + x.b + '">' + x.n + '(' + x.b + '进制)</option>'; }).join('')}
          </select>
        </div>
      </div>
      <div id="bsOut"></div>`;

    const inEl = el.querySelector('#bsIn');
    const fromEl = el.querySelector('#bsFrom');
    const outEl = el.querySelector('#bsOut');

    function digitsOf(b) {
      const letters = 'abcdef';
      let d = '0123456789'.slice(0, Math.min(b, 10));
      if (b > 10) d += letters.slice(0, b - 10);
      return d;
    }

    function convert() {
      const raw = inEl.value.trim().toLowerCase();
      if (!raw) { outEl.innerHTML = '<div class="empty">输入数值后自动转换</div>'; return; }
      const allowed = digitsOf(from);
      for (let i = 0; i < raw.length; i++) {
        if (allowed.indexOf(raw[i]) === -1) {
          outEl.innerHTML = '<div class="empty" style="color:var(--danger)">' + from + ' 进制不认识字符 "' + App.esc(raw[i]) + '"</div>';
          return;
        }
      }
      const value = parseInt(raw, from);
      if (isNaN(value) || value < 0) {
        outEl.innerHTML = '<div class="empty" style="color:var(--danger)">无法解析(仅支持非负整数)</div>';
        return;
      }
      outEl.innerHTML = '<div class="card">'
        + BASES.map(function (x) {
          const v = value.toString(x.b);
          const label = x.b === 16 ? v.toUpperCase() : v;
          return '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:7px 0;border-top:1px solid var(--border)">'
            + '<span class="muted">' + x.n + ' <span style="font-size:11px">(' + x.b + ')</span></span>'
            + '<span style="font-family:ui-monospace,Consolas,monospace;font-weight:700;font-size:16px;word-break:break-all">' + label + '</span></div>';
        }).join('')
        + '</div>';
    }

    inEl.addEventListener('input', convert);
    fromEl.addEventListener('change', function () {
      from = +fromEl.value;
      convert();
    });
    convert();
  },
});
