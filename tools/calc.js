/* 计算器 + 单位换算 */

/* 表达式求值：小型递归下降解析器（无 eval） */
function bxEvalExpr(s) {
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { i++; continue; }
    if (c >= '0' && c <= '9' || c === '.') {
      let j = i;
      while (j < s.length && (s[j] >= '0' && s[j] <= '9' || s[j] === '.')) j++;
      tokens.push({ t: 'n', v: parseFloat(s.slice(i, j)) });
      i = j;
    } else if ('+-×÷()'.includes(c)) {
      tokens.push({ t: c }); i++;
    } else if (c === '%') {
      tokens.push({ t: '%' }); i++;
    } else { return NaN; }
  }
  let p = 0;
  const peek = () => tokens[p];
  function parseExpr() {
    let v = parseTerm();
    while (peek() && (peek().t === '+' || peek().t === '-')) {
      const op = tokens[p++].t;
      const r = parseTerm();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  function parseTerm() {
    let v = parseUnary();
    while (peek() && (peek().t === '×' || peek().t === '÷')) {
      const op = tokens[p++].t;
      const r = parseUnary();
      v = op === '×' ? v * r : v / r;
    }
    return v;
  }
  function parseUnary() {
    if (peek() && peek().t === '-') { p++; return -parseUnary(); }
    if (peek() && peek().t === '+') { p++; return parseUnary(); }
    return parsePostfix();
  }
  function parsePostfix() {
    let v = parseAtom();
    while (peek() && peek().t === '%') { p++; v = v / 100; }
    return v;
  }
  function parseAtom() {
    const tk = peek();
    if (!tk) return NaN;
    if (tk.t === 'n') { p++; return tk.v; }
    if (tk.t === '(') {
      p++;
      const v = parseExpr();
      if (peek() && peek().t === ')') p++;
      return v;
    }
    return NaN;
  }
  const r = parseExpr();
  return p === tokens.length ? r : NaN;
}

/* 数字格式化：普通值直接显示，极大/极小用科学计数 */
function bxFmtNum(n) {
  if (!isFinite(n)) return '错误';
  if (n !== 0 && (Math.abs(n) >= 1e12 || Math.abs(n) < 1e-6)) return n.toExponential(6);
  return String(parseFloat(n.toPrecision(12)));
}

/* 单位换算表 */
const BX_UNITS = {
  '长度': { 'mm': 0.001, 'cm': 0.01, 'm': 1, 'km': 1000, 'in': 0.0254, 'ft': 0.3048 },
  '重量': { 'mg': 0.000001, 'g': 0.001, 'kg': 1, 't': 1000, 'oz': 0.0283495, 'lb': 0.453592 },
  '面积': { 'm²': 1, 'km²': 1000000, '亩': 666.6667, '公顷': 10000, 'ft²': 0.092903 },
  '数据': { 'B': 1, 'KB': 1024, 'MB': 1048576, 'GB': 1073741824, 'TB': 1099511627776 },
  '温度': null,
};

function bxConvert(cat, from, to, v) {
  if (isNaN(v)) return NaN;
  if (cat === '温度') {
    let c = from === '℃' ? v : from === '℉' ? (v - 32) * 5 / 9 : v - 273.15;
    return to === '℃' ? c : to === '℉' ? c * 9 / 5 + 32 : c + 273.15;
  }
  const tbl = BX_UNITS[cat];
  if (!tbl || !(from in tbl) || !(to in tbl)) return NaN;
  return v * tbl[from] / tbl[to];
}

App.registerTool({
  id: 'calc', name: '计算器', icon: 'calculator', desc: '计算+单位换算', order: 40,
  render(el) {
    let view = 'calc';
    el.innerHTML = `
      <div class="seg" id="cSeg">
        <button class="seg-btn active" data-v="calc">计算器</button>
        <button class="seg-btn" data-v="conv">单位换算</button>
      </div>
      <div id="cBody"></div>
    `;
    const body = el.querySelector('#cBody');

    function renderCalc() {
      body.innerHTML = `
        <div class="card">
          <div class="muted" id="cExpr" style="min-height:22px;word-break:break-all">&nbsp;</div>
          <div class="big-time" id="cOut" style="font-size:32px;text-align:right">0</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px" id="cKeys"></div>
        <div id="cHist"></div>
      `;
      const keys = ['C', '(', ')', '⌫', '7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '%', '+'];
      const grid = body.querySelector('#cKeys');
      grid.innerHTML = keys.map(k =>
        `<button class="btn" data-k="${k}"${k === '=' ? '' : ''}>${k === '=' ? '=' : k}</button>`).join('') +
        `<button class="btn-primary" data-k="=" style="grid-column:span 4">=</button>`;
      const exprEl = body.querySelector('#cExpr');
      const outEl = body.querySelector('#cOut');
      let expr = '';
      const preview = () => {
        if (!expr) { exprEl.innerHTML = '&nbsp;'; outEl.textContent = '0'; return; }
        const r = bxEvalExpr(expr);
        outEl.textContent = isNaN(r) ? '…' : bxFmtNum(r);
      };
      grid.addEventListener('click', e => {
        const b = e.target.closest('[data-k]');
        if (!b) return;
        const k = b.dataset.k;
        if (k === 'C') expr = '';
        else if (k === '⌫') expr = expr.slice(0, -1);
        else if (k === '=') {
          const r = bxEvalExpr(expr);
          if (expr && isFinite(r)) {
            const hist = App.store.get('calc', 'history', []);
            hist.unshift({ expr, result: bxFmtNum(r), at: Date.now() });
            App.store.set('calc', 'history', hist.slice(0, 20));
            expr = String(bxFmtNum(r));
            renderHist();
          } else if (expr) {
            App.toast('无法计算');
          }
        }
        else expr += k;
        exprEl.textContent = expr || '\u00a0';
        preview();
      });
      function renderHist() {
        const hist = App.store.get('calc', 'history', []).slice(0, 5);
        const host = body.querySelector('#cHist');
        if (!hist.length) { host.innerHTML = ''; return; }
        host.innerHTML = `
          <div class="row" style="margin-top:12px">
            <div class="muted grow">最近计算</div>
            <button class="btn-danger" id="cClear" style="min-height:32px;padding:0 10px;font-size:13px">清空历史</button>
          </div>
          <div class="list">
            ${hist.map((h, i) => `
              <div class="item" data-i="${i}" style="cursor:pointer">
                <div class="item-main">
                  <div class="item-title">${App.esc(h.expr)} =</div>
                  <div class="item-sub">${App.esc(h.result)}</div>
                </div>
              </div>`).join('')}
          </div>`;
        host.querySelector('#cClear').addEventListener('click', function onClear() {
          if (this.dataset.arm) {
            App.store.remove('calc', 'history');
            renderHist();
          } else {
            this.dataset.arm = '1';
            this.textContent = '确认清空？';
            setTimeout(() => { if (this.isConnected) { this.dataset.arm = ''; this.textContent = '清空历史'; } }, 3000);
          }
        });
        host.addEventListener('click', e => {
          const it = e.target.closest('.item[data-i]');
          if (!it) return;
          const h = App.store.get('calc', 'history', [])[Number(it.dataset.i)];
          if (h) { expr = h.expr; exprEl.textContent = expr; preview(); }
        });
      }
      renderHist();
      preview();
    }

    function renderConv() {
      const cats = Object.keys(BX_UNITS);
      let cat = '长度';
      body.innerHTML = `
        <div class="row" id="uCats" style="flex-wrap:wrap"></div>
        <div class="card">
          <div class="row">
            <select class="select" id="uFrom" style="flex:1"></select>
            <input class="input" id="uVal" type="number" step="any" value="1" style="flex:1.2">
            <select class="select" id="uTo" style="flex:1"></select>
        </div>
        <div class="big-time" id="uOut" style="font-size:28px;text-align:center;margin-top:8px">-</div>
        <div class="muted" id="uTip" style="text-align:center"></div>
      </div>`;
      const catsEl = body.querySelector('#uCats');
      const fromEl = body.querySelector('#uFrom');
      const toEl = body.querySelector('#uTo');
      const valEl = body.querySelector('#uVal');
      const outEl = body.querySelector('#uOut');
      const tipEl = body.querySelector('#uTip');
      const fillSel = () => {
        const units = cat === '温度' ? ['℃', '℉', 'K'] : Object.keys(BX_UNITS[cat]);
        fromEl.innerHTML = units.map(u => `<option>${u}</option>`).join('');
        toEl.innerHTML = units.map((u, i) => `<option${i === 1 ? ' selected' : ''}>${u}</option>`).join('');
      };
      const renderCats = () => {
        catsEl.innerHTML = cats.map(c =>
          `<button class="chip${c === cat ? ' active' : ''}" data-c="${c}">${c}</button>`).join('');
      };
      const update = () => {
        const r = bxConvert(cat, fromEl.value, toEl.value, Number(valEl.value));
        outEl.textContent = isNaN(r) ? '-' : bxFmtNum(r) + ' ' + toEl.value;
        tipEl.textContent = valEl.value === '' ? '' : `1 ${fromEl.value} = ${bxFmtNum(bxConvert(cat, fromEl.value, toEl.value, 1))} ${toEl.value}`;
      };
      catsEl.addEventListener('click', e => {
        const b = e.target.closest('[data-c]');
        if (!b) return;
        cat = b.dataset.c;
        renderCats();
        fillSel();
        update();
      });
      fromEl.addEventListener('change', update);
      toEl.addEventListener('change', update);
      valEl.addEventListener('input', update);
      renderCats();
      fillSel();
      update();
    }

    body.addEventListener('click', e => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      view = b.dataset.v;
      el.querySelectorAll('.seg-btn').forEach(x => x.classList.toggle('active', x.dataset.v === view));
      if (view === 'calc') renderCalc(); else renderConv();
    });
    renderCalc();
  }
});
