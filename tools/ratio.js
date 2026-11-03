/* 百宝箱 · 比例计算器：折扣/增长率/百分比速算 */
App.registerTool({
  id: 'ratio',
  name: '比例计算器',
  icon: 'percent',
  desc: '折扣增长率百分比速算',
  order: 43,

  render(el) {
    el.innerHTML = `
      <div class="seg" id="rtSeg">
        <button class="seg-btn active" data-m="off">折扣</button>
        <button class="seg-btn" data-m="pct">百分比</button>
        <button class="seg-btn" data-m="gro">增长率</button>
      </div>
      <div class="card" id="rtCard">
        <div id="rtInputs"></div>
        <div id="rtOut" style="margin-top:6px"></div>
      </div>`;

    const segEl = el.querySelector('#rtSeg');
    const inputsEl = el.querySelector('#rtInputs');
    const outEl = el.querySelector('#rtOut');
    let mode = 'off';
    let values = { off: {}, pct: {}, gro: {} };

    const FIELDS = {
      off: [
        { k: 'p', label: '原价(元)' },
        { k: 'z', label: '折扣(几折,如 7.5)' },
      ],
      pct: [
        { k: 'a', label: '数值 A' },
        { k: 'b', label: '数值 B' },
      ],
      gro: [
        { k: 'o', label: '旧值' },
        { k: 'nv', label: '新值' },
      ],
    };

    function renderInputs() {
      inputsEl.innerHTML = FIELDS[mode].map(function (f) {
        const v = values[mode][f.k] || '';
        return '<div class="row"><input class="input grow" type="number" step="any" inputmode="decimal" '
          + 'data-k="' + f.k + '" placeholder="' + f.label + '" value="' + v + '"></div>';
      }).join('');
      compute();
    }

    function bigRow(label, value, accent) {
      return '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:7px 0">'
        + '<span class="muted">' + label + '</span>'
        + '<span style="font-size:' + (accent ? '24px' : '16px') + ';font-weight:700;'
        + (accent ? 'color:var(--accent)' : '') + '">' + value + '</span></div>';
    }

    function compute() {
      const v = values[mode];
      const num = function (k) { return parseFloat(v[k]); };
      let html = '';
      if (mode === 'off') {
        const p = num('p'), z = num('z');
        if (p > 0 && z > 0 && z <= 10) {
          const now = p * z / 10;
          html += bigRow('现价', now.toFixed(2) + ' 元', true);
          html += bigRow('共省', (p - now).toFixed(2) + ' 元', false);
          html += bigRow('相当于', Math.round(z * 10) + '% 价', false);
        }
      } else if (mode === 'pct') {
        const a = num('a'), b = num('b');
        if (!isNaN(a) && !isNaN(b)) {
          html += bigRow('B 的 A%', (a * b / 100).toFixed(4).replace(/\.?0+$/, '') , true);
          html += bigRow('A 占 B', (b !== 0 ? (a / b * 100).toFixed(2) + '%' : '—'), false);
        }
      } else {
        const o = num('o'), nv = num('nv');
        if (!isNaN(o) && !isNaN(nv) && o !== 0) {
          const g = (nv - o) / Math.abs(o) * 100;
          html += bigRow('变化量', (nv - o).toFixed(2), false);
          html += bigRow(g >= 0 ? '增长率' : '下降率', Math.abs(g).toFixed(2) + '%', true);
        }
      }
      outEl.innerHTML = html || '<div class="muted" style="padding:8px 0">填写上方数值即出结果</div>';
    }

    inputsEl.addEventListener('input', function (e) {
      if (e.target.matches('input[data-k]')) {
        values[mode][e.target.dataset.k] = e.target.value;
        compute();
      }
    });

    segEl.addEventListener('click', function (e) {
      const b = e.target.closest ? e.target.closest('.seg-btn') : null;
      if (!b) return;
      mode = b.dataset.m;
      segEl.querySelectorAll('.seg-btn').forEach(function (x) {
        x.classList.toggle('active', x === b);
      });
      renderInputs();
    });

    renderInputs();
  },
});
