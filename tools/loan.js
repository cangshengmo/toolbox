/* 百宝箱 · 贷款计算器：等额本息/本金月供与总息 */
App.registerTool({
  id: 'loan',
  name: '贷款计算器',
  icon: 'banknote',
  desc: '等额本息/本金月供总息',
  order: 41,

  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="row">
          <input id="lnAmt" class="input grow" type="number" min="0" step="any" placeholder="贷款金额(万元)" inputmode="decimal">
          <input id="lnYears" class="input" type="number" min="1" max="50" placeholder="年限" style="flex:0 0 84px">
        </div>
        <div class="row">
          <input id="lnRate" class="input grow" type="number" min="0" step="0.01" placeholder="年利率(%)" inputmode="decimal">
          <select id="lnMode" class="select" style="flex:0 0 130px">
            <option value="ac">等额本息</option>
            <option value="ab">等额本金</option>
          </select>
        </div>
      </div>
      <div id="lnOut"></div>`;

    const amtEl = el.querySelector('#lnAmt');
    const yearsEl = el.querySelector('#lnYears');
    const rateEl = el.querySelector('#lnRate');
    const modeEl = el.querySelector('#lnMode');
    const outEl = el.querySelector('#lnOut');

    /* 等额本息:月供 M = P·r·(1+r)^n / ((1+r)^n - 1) */
    function acMonthPay(P, r, n) {
      if (r <= 0) return P / n;
      const k = Math.pow(1 + r, n);
      return P * r * k / (k - 1);
    }

    function fmtWan(v) {
      return (v / 10000).toFixed(2) + ' 万';
    }

    function compute() {
      const P = (parseFloat(amtEl.value) || 0) * 10000;
      const years = parseInt(yearsEl.value, 10) || 0;
      const ratePct = parseFloat(rateEl.value) || 0;
      const n = years * 12;
      if (P <= 0 || n <= 0 || ratePct < 0) {
        outEl.innerHTML = '<div class="empty">输入贷款金额、年限与利率后自动计算</div>';
        return;
      }
      const r = ratePct / 100 / 12;
      let html = '';
      if (modeEl.value === 'ac') {
        const m = acMonthPay(P, r, n);
        const total = m * n;
        html += bigRow('每月月供', m.toFixed(2) + ' 元', true);
        html += bigRow('还款总额', fmtWan(total), false);
        html += bigRow('利息总额', fmtWan(total - P), false);
      } else {
        const base = P / n;
        const first = base + P * r;
        const last = base + base * r;
        const totalInt = (n + 1) * P * r / 2;
        html += bigRow('首月月供', first.toFixed(2) + ' 元', true);
        html += bigRow('末月月供', last.toFixed(2) + ' 元', false);
        html += bigRow('每月递减', (base * r).toFixed(2) + ' 元', false);
        html += bigRow('还款总额', fmtWan(P + totalInt), false);
        html += bigRow('利息总额', fmtWan(totalInt), false);
      }
      html += '<div class="muted" style="font-size:12px;margin-top:10px">' + n + ' 期 · 结果仅供参考</div>';
      outEl.innerHTML = '<div class="card">' + html + '</div>';
    }

    function bigRow(label, value, accent) {
      return '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:7px 0">'
        + '<span class="muted">' + label + '</span>'
        + '<span style="font-size:' + (accent ? '24px' : '16px') + ';font-weight:700;'
        + (accent ? 'color:var(--accent)' : '') + '">' + value + '</span></div>';
    }

    [amtEl, yearsEl, rateEl, modeEl].forEach(function (elm) {
      elm.addEventListener('input', compute);
      elm.addEventListener('change', compute);
    });

    compute();
  },
});
