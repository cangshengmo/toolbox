/* 百宝箱 · WiFi 分享卡:生成 wifi: 二维码扫码即连 */
App.registerTool({
  id: 'wificard',
  name: 'WiFi 分享卡',
  icon: 'wifi',
  desc: 'WiFi 二维码扫码即连',
  order: 51,

  render(el) {
    let last = App.store.get('wificard', 'last', null);
    if (!last || typeof last !== 'object') last = null;

    el.innerHTML = `
      <div class="card">
        <div class="row">
          <input id="wfSsid" class="input grow" type="text" placeholder="WiFi 名称(SSID)" maxlength="32">
        </div>
        <div class="row">
          <input id="wfPass" class="input grow" type="text" placeholder="密码(无加密可留空)">
          <select id="wfEnc" class="select" style="flex:0 0 110px">
            <option value="WPA">WPA/WPA2</option>
            <option value="WEP">WEP</option>
            <option value="nopass">无加密</option>
          </select>
        </div>
        <div class="row" style="margin-bottom:0">
          <button id="wfGen" class="btn btn-primary grow" style="min-height:44px">生成分享卡</button>
          <button id="wfSave" class="btn" style="min-height:44px" hidden>保存 PNG</button>
        </div>
      </div>
      <div id="wfOut"></div>`;

    const ssidEl = el.querySelector('#wfSsid');
    const passEl = el.querySelector('#wfPass');
    const encEl = el.querySelector('#wfEnc');
    const saveBtn = el.querySelector('#wfSave');
    const outEl = el.querySelector('#wfOut');

    function wifiEscape(v) {
      const BS = String.fromCharCode(92);
      const re = new RegExp('([' + BS + BS + ';,:' + String.fromCharCode(34) + '])', 'g');
      return String(v).replace(re, BS + '$1');
    }

    /* 白底黑码 PNG 数据地址 */
    function toPng(qr) {
      const n = qr.getModuleCount();
      const cell = Math.ceil(420 / (n + 8));
      const size = (n + 8) * cell;
      const cv = document.createElement('canvas');
      cv.width = size;
      cv.height = size;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#000';
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (qr.isDark(r, c)) ctx.fillRect((c + 4) * cell, (r + 4) * cell, cell, cell);
        }
      }
      return cv.toDataURL('image/png');
    }

    function build() {
      const ssid = ssidEl.value.trim();
      if (!ssid) { App.toast('请输入 WiFi 名称'); return; }
      const enc = encEl.value;
      const pass = passEl.value;
      const uri = enc === 'nopass'
        ? 'WIFI:T:nopass;S:' + wifiEscape(ssid) + ';;'
        : 'WIFI:T:' + enc + ';S:' + wifiEscape(ssid) + ';P:' + wifiEscape(pass) + ';;';
      try {
        const qr = qrcode(0, 'M');
        qr.addData(uri);
        qr.make();
        outEl.innerHTML = '<div class="card" style="text-align:center;padding:18px">'
          + '<div style="font-size:15px;font-weight:700;word-break:break-all">📶 ' + App.esc(ssid) + '</div>'
          + '<div style="margin:12px auto;max-width:280px">' + qr.createSvgTag({ cellSize: 4, margin: 2 }) + '</div>'
          + '<div class="muted" style="font-size:12.5px">用相机扫码即可连接' + (enc === 'nopass' ? '(开放网络)' : '') + '</div>'
          + '</div>';
        const svg = outEl.querySelector('svg');
        svg.style.width = '100%';
        svg.style.height = 'auto';
        saveBtn.hidden = false;
        saveBtn.onclick = function () {
          const a = document.createElement('a');
          a.href = toPng(qr);
          a.download = 'WiFi-' + ssid + '.png';
          a.click();
          App.toast('已生成 PNG');
        };
        App.store.set('wificard', 'last', { ssid: ssid, enc: enc, pass: pass });
      } catch (err) {
        outEl.innerHTML = '<div class="empty">' + App.esc(String(err && err.message || err)) + '</div>';
      }
    }

    el.querySelector('#wfGen').addEventListener('click', build);
    [ssidEl, passEl].forEach(function (elm) {
      elm.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') build();
      });
    });

    if (last) {
      ssidEl.value = last.ssid || '';
      passEl.value = last.pass || '';
      encEl.value = last.enc || 'WPA';
    }
  },
});
