/* 百宝箱 · BMI·基础代谢：体重健康区间与每日消耗 */
App.registerTool({
  id: 'bmi',
  name: 'BMI·基础代谢',
  icon: 'heart-pulse',
  desc: '体重健康区间与每日消耗',
  order: 42,

  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="row">
          <select id="bmSex" class="select" style="flex:0 0 110px">
            <option value="m">男</option>
            <option value="f">女</option>
          </select>
          <input id="bmAge" class="input grow" type="number" min="1" max="120" placeholder="年龄">
        </div>
        <div class="row">
          <input id="bmHeight" class="input grow" type="number" min="50" max="250" placeholder="身高(cm)">
          <input id="bmWeight" class="input grow" type="number" min="10" max="300" placeholder="体重(kg)">
        </div>
        <div class="row" style="margin-bottom:0">
          <select id="bmAct" class="select grow">
            <option value="1.2">久坐(几乎不动)</option>
            <option value="1.375">轻度(每周1-3次)</option>
            <option value="1.55">中度(每周3-5次)</option>
            <option value="1.725">高度(每周6-7次)</option>
            <option value="1.9">极高(体力劳动)</option>
          </select>
        </div>
      </div>
      <div id="bmOut"></div>`;

    const sexEl = el.querySelector('#bmSex');
    const ageEl = el.querySelector('#bmAge');
    const hEl = el.querySelector('#bmHeight');
    const wEl = el.querySelector('#bmWeight');
    const actEl = el.querySelector('#bmAct');
    const outEl = el.querySelector('#bmOut');

    function bigRow(label, value, accent) {
      return '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:7px 0">'
        + '<span class="muted">' + label + '</span>'
        + '<span style="font-size:' + (accent ? '24px' : '16px') + ';font-weight:700;'
        + (accent ? 'color:var(--accent)' : '') + '">' + value + '</span></div>';
    }

    function compute() {
      const age = parseFloat(ageEl.value) || 0;
      const h = parseFloat(hEl.value) || 0;
      const w = parseFloat(wEl.value) || 0;
      if (h <= 0 || w <= 0) {
        outEl.innerHTML = '<div class="empty">输入身高体重后自动计算</div>';
        return;
      }
      const bmi = w / Math.pow(h / 100, 2);
      let cat = '';
      let color = '';
      if (bmi < 18.5) { cat = '偏瘦'; color = '#3b82f6'; }
      else if (bmi < 24) { cat = '正常'; color = '#22c55e'; }
      else if (bmi < 28) { cat = '超重'; color = '#f59e0b'; }
      else { cat = '肥胖'; color = '#e5484d'; }
      const m2 = (h / 100) * (h / 100);
      const lo = (18.5 * m2).toFixed(1);
      const hi = (24 * m2).toFixed(1);
      let bmrRow = '';
      if (age > 0) {
        const bmr = 10 * w + 6.25 * h - 5 * age + (sexEl.value === 'm' ? 5 : -161);
        const tdee = bmr * (parseFloat(actEl.value) || 1.2);
        bmrRow = bigRow('基础代谢 BMR', Math.round(bmr) + ' 千卡/天', false);
        bmrRow += bigRow('每日消耗 TDEE', Math.round(tdee) + ' 千卡/天', true);
      }
      outEl.innerHTML = '<div class="card">'
        + '<div style="text-align:center;padding:6px 0 10px">'
        + '<div style="font-size:40px;font-weight:700;line-height:1.1;color:' + color + '">' + bmi.toFixed(1) + '</div>'
        + '<div style="font-weight:600;color:' + color + '">' + cat + '</div>'
        + '<div class="muted" style="font-size:12px;margin-top:4px">健康体重 ' + lo + ' ~ ' + hi + ' kg</div>'
        + '</div>'
        + bmrRow + '</div>';
    }

    [sexEl, ageEl, hEl, wEl, actEl].forEach(function (elm) {
      elm.addEventListener('input', compute);
      elm.addEventListener('change', compute);
    });

    compute();
  },
});
