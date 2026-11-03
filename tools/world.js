/* 百宝箱 · 世界时钟：多时区当前时间对照 */
App.registerTool({
  id: 'world',
  name: '世界时钟',
  icon: 'globe',
  desc: '多时区当前时间对照',
  order: 56,

  render(el) {
    const ZONES = [
      { city: '本地', tz: null },
      { city: '北京', tz: 'Asia/Shanghai' },
      { city: '东京', tz: 'Asia/Tokyo' },
      { city: '悉尼', tz: 'Australia/Sydney' },
      { city: '新德里', tz: 'Asia/Kolkata' },
      { city: '迪拜', tz: 'Asia/Dubai' },
      { city: '莫斯科', tz: 'Europe/Moscow' },
      { city: '伦敦', tz: 'Europe/London' },
      { city: '纽约', tz: 'America/New_York' },
      { city: '洛杉矶', tz: 'America/Los_Angeles' },
    ];

    el.innerHTML = '<div class="list" id="wcList"></div>';
    const listEl = el.querySelector('#wcList');

    function rowInner(z, now) {
      const timeFmt = new Intl.DateTimeFormat('zh-CN', {
        timeZone: z.tz || undefined,
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      });
      const dateFmt = new Intl.DateTimeFormat('zh-CN', {
        timeZone: z.tz || undefined,
        month: 'numeric', day: 'numeric', weekday: 'short',
      });
      const h = +timeFmt.formatToParts(now).find(function (p) { return p.type === 'hour'; }).value;
      const icon = h < 5 ? '🌙' : h < 8 ? '🌅' : h < 17 ? '☀️' : h < 20 ? '🌇' : '🌙';
      return `
        <div class="item">
          <div style="font-size:22px" aria-hidden="true">${icon}</div>
          <div class="item-main">
            <div class="item-title">${App.esc(z.city)}</div>
            <div class="item-sub">${dateFmt.format(now)}</div>
          </div>
          <div style="font-size:19px;font-weight:600;font-variant-numeric:tabular-nums">${timeFmt.format(now)}</div>
        </div>`;
    }

    function tick() {
      const now = new Date();
      listEl.innerHTML = ZONES.map(function (z) { return rowInner(z, now); }).join('');
    }

    tick();
    const iv = setInterval(tick, 1000);
    return function () { clearInterval(iv); };
  },
});
