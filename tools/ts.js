/* 百宝箱 · 时间戳转换:Unix 时间戳 ↔ 日期 */
App.registerTool({
  id: 'ts',
  name: '时间戳转换',
  icon: 'clock',
  desc: '时间戳日期互转',
  order: 45,

  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="row">
          <input id="tStamp" class="input grow" type="text" inputmode="numeric" placeholder="时间戳(10位秒/13位毫秒)" style="font-family:ui-monospace,Consolas,monospace">
          <button id="tNow" class="btn" style="min-height:44px">现在</button>
        </div>
        <div id="tDateOut" style="font-size:14px;line-height:1.8"></div>
      </div>
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <input id="tDate" class="input grow" type="datetime-local" style="min-height:44px">
          <button id="tToStamp" class="btn btn-primary" style="min-height:44px">转时间戳</button>
        </div>
        <div id="tStampOut" style="margin-top:10px;font-size:14px"></div>
      </div>`;

    const stampEl = el.querySelector('#tStamp');
    const dateOutEl = el.querySelector('#tDateOut');
    const dateEl = el.querySelector('#tDate');
    const stampOutEl = el.querySelector('#tStampOut');

    function pad(x) { return String(x).padStart(2, '0'); }

    function fmtLocal(d) {
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
        + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function fromStamp() {
      const raw = stampEl.value.trim();
      if (!raw || !/^\d+$/.test(raw)) {
        dateOutEl.innerHTML = '<span class="muted">输入纯数字时间戳(10 位秒或 13 位毫秒)</span>';
        return;
      }
      let ms = +raw;
      if (raw.length <= 10) ms *= 1000;
      const d = new Date(ms);
      if (isNaN(d.getTime())) {
        dateOutEl.innerHTML = '<span style="color:var(--danger)">无效时间戳</span>';
        return;
      }
      dateOutEl.innerHTML = '<div>🗓 ' + fmtLocal(d) + '</div>'
        + '<div class="muted" style="font-size:12.5px">' + d.toISOString() + '</div>'
        + '<div class="muted" style="font-size:12.5px">毫秒值:' + d.getTime() + '</div>';
    }

    function fromDate() {
      const v = dateEl.value;
      if (!v) { stampOutEl.innerHTML = '<span class="muted">选个日期时间</span>'; return; }
      const d = new Date(v);
      if (isNaN(d.getTime())) { stampOutEl.innerHTML = '<span style="color:var(--danger)">无效日期</span>'; return; }
      stampOutEl.innerHTML = '<div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid var(--border)">'
        + '<span class="muted">秒级(10 位)</span><span style="font-family:ui-monospace,Consolas,monospace;font-weight:700">' + Math.floor(d.getTime() / 1000) + '</span></div>'
        + '<div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid var(--border)">'
        + '<span class="muted">毫秒级(13 位)</span><span style="font-family:ui-monospace,Consolas,monospace;font-weight:700">' + d.getTime() + '</span></div>';
    }

    stampEl.addEventListener('input', fromStamp);
    dateEl.addEventListener('change', fromDate);
    el.querySelector('#tToStamp').addEventListener('click', fromDate);
    el.querySelector('#tNow').addEventListener('click', function () {
      const now = new Date();
      stampEl.value = String(Math.floor(now.getTime() / 1000));
      fromStamp();
      dateEl.value = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate())
        + 'T' + pad(now.getHours()) + ':' + pad(now.getMinutes());
      fromDate();
    });

    /* 默认填当前时间戳 */
    stampEl.value = String(Math.floor(Date.now() / 1000));
    fromStamp();
  },
});
