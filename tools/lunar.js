/* 百宝箱 · 农历查询:农历日期与传统节日(Intl 原生中国历,离线精确) */
App.registerTool({
  id: 'lunar',
  name: '农历查询',
  icon: 'calendar-check',
  desc: '农历日期与节日',
  order: 46,

  render(el) {
    const ZODIAC = { 子: '鼠', 丑: '牛', 寅: '虎', 卯: '兔', 辰: '龙', 巳: '蛇', 午: '马', 未: '羊', 申: '猴', 酉: '鸡', 戌: '狗', 亥: '猪' };

    el.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <input id="lnDate" class="input grow" type="date" style="min-height:44px">
          <button id="lnToday" class="btn" style="min-height:44px">今天</button>
        </div>
      </div>
      <div class="card" style="text-align:center;padding:22px 14px">
        <div id="lnOut" style="font-size:15px;line-height:2"></div>
      </div>
      <div class="card">
        <div class="item-title" style="margin-bottom:8px">农历节日(按农历月日)</div>
        <div class="muted" style="font-size:13px;line-height:2">
          正月初一 春节 · 正月十五 元宵<br>
          五月初五 端午 · 七月初七 七夕<br>
          八月十五 中秋 · 九月初九 重阳<br>
          腊月初八 腊八 · 腊月最后一天 除夕
        </div>
      </div>
      <div class="muted" style="font-size:11.5px;text-align:center">基于设备内置中国历法,支持闰月,离线可用</div>`;

    const dateEl = el.querySelector('#lnDate');
    const outEl = el.querySelector('#lnOut');

    let fmt = null;
    try {
      fmt = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch (e) {
      fmt = null;
    }

    function chineseDay(n) {
      const d = parseInt(n, 10);
      const pre = ['初', '十', '廿', '三'];
      const num = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
      if (d === 10) return '初十';
      if (d === 20) return '二十';
      if (d === 30) return '三十';
      if (d < 10) return '初' + num[d - 1];
      if (d < 20) return '十' + num[d - 11];
      return '廿' + num[d - 21];
    }

    function zodiacOf(y) {
      const branches = '子丑寅卯辰巳午未申酉戌亥';
      return ZODIAC[branches[(y - 4) % 12]] || '';
    }

    function show(ds) {
      if (!fmt) {
        outEl.innerHTML = '<div style="color:var(--danger)">此设备不支持中国历法格式化</div>';
        return;
      }
      const p = ds.split('-');
      const d = new Date(+p[0], +p[1] - 1, +p[2]);
      const parts = {};
      fmt.formatToParts(d).forEach(function (x) { parts[x.type] = x.value; });
      const month = parts.month || '';
      const day = chineseDay(parts.day || 1);
      const y = parseInt(parts.relatedYear || parts.year, 10) || d.getFullYear();
      const animal = zodiacOf(y);
      /* 节日匹配:正月初一/正月十五/五月初五/七月初七/八月十五/九月初九/腊月初八 */
      const fest = { '正月初一': '🧧 春节', '正月十五': '🏮 元宵节', '五月初五': '🐉 端午节', '七月初七': '💌 七夕', '八月十五': '🥮 中秋节', '九月初九': '⛰️ 重阳节', '腊月初八': '🥣 腊八节' };
      const key = month + day;
      const festText = fest[key] || '';
      outEl.innerHTML = '<div style="font-size:26px;font-weight:700">' + month + day + '</div>'
        + '<div class="muted" style="font-size:13.5px;margin-top:4px">' + y + '年' + (animal ? '(' + animal + ') ' : '') + '· ' + ds + '</div>'
        + (festText ? '<div style="margin-top:10px;font-weight:600;color:var(--accent)">' + festText + '</div>' : '');
    }

    function today() {
      dateEl.value = App.today();
      show(App.today());
    }

    dateEl.addEventListener('change', function () {
      if (dateEl.value) show(dateEl.value);
    });
    el.querySelector('#lnToday').addEventListener('click', today);

    today();
  },
});
