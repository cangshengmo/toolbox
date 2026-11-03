/* 百宝箱 · 二维码生成：文本/链接/WiFi 生成二维码（依赖 js/qr.js,MIT） */
App.registerTool({
  id: 'qr',
  name: '二维码生成',
  icon: 'qr-code',
  desc: '文本链接WiFi二维码',
  order: 45,

  render(el) {
    el.innerHTML = `
      <div class="seg" id="qSeg">
        <button class="seg-btn active" data-m="text">文本/链接</button>
        <button class="seg-btn" data-m="wifi">WiFi</button>
      </div>
      <div class="card">
        <div id="qInputs"></div>
        <button id="qGen" class="btn btn-primary" style="width:100%;min-height:44px;margin-top:4px">生成二维码</button>
      </div>
      <div id="qOut"></div>`;

    const segEl = el.querySelector('#qSeg');
    const inputsEl = el.querySelector('#qInputs');
    const outEl = el.querySelector('#qOut');
    let mode = 'text';

    function wifiEscape(v) {
      const BS = String.fromCharCode(92);
      const re = new RegExp('([' + BS + BS + ';,:' + String.fromCharCode(34) + '])', 'g');
      return String(v).replace(re, BS + '$1');
    }

    function buildText() {
      return `
        <textarea id="qText" class="input" placeholder="输入文本或链接"></textarea>`;
    }

    function buildWifi() {
      return `
        <div class="row">
          <input id="qSsid" class="input grow" type="text" placeholder="WiFi 名称(SSID)">
        </div>
        <div class="row">
          <input id="qPass" class="input grow" type="text" placeholder="密码(无加密可留空)">
        </div>
        <div class="row" style="margin-bottom:0">
          <select id="qEnc" class="select grow">
            <option value="WPA">WPA/WPA2/WPA3</option>
            <option value="WEP">WEP</option>
            <option value="nopass">无加密</option>
          </select>
        </div>`;
    }

    /* 由 qr.isDark 网格绘制 PNG(白底黑码) */
    function toPng(qr) {
      const n = qr.getModuleCount();
      const cell = Math.ceil(400 / (n + 8));
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

    function renderQr(text) {
      try {
        const qr = qrcode(0, 'M');
        qr.addData(text);
        qr.make();
        const n = qr.getModuleCount();
        outEl.innerHTML = '<div class="card" style="text-align:center">'
          + qr.createSvgTag({ cellSize: 4, margin: 2 })
          + '<div class="muted" style="font-size:12px;margin-top:8px">'
          + text.length + ' 字符 · ' + n + '×' + n + ' 模块</div>'
          + '<button id="qSave" class="btn" style="min-height:40px;margin-top:8px">保存 PNG</button>'
          + '</div>';
        const svg = outEl.querySelector('svg');
        svg.style.width = 'min(72vw, 300px)';
        svg.style.height = 'auto';
        outEl.querySelector('#qSave').addEventListener('click', function () {
          const a = document.createElement('a');
          a.href = toPng(qr);
          a.download = 'qrcode.png';
          a.click();
          App.toast('已生成 PNG');
        });
      } catch (err) {
        outEl.innerHTML = '<div class="empty">' + App.esc(String(err && err.message || err)) + '</div>';
      }
    }

    function currentText() {
      if (mode === 'text') return el.querySelector('#qText').value;
      const ssid = el.querySelector('#qSsid').value.trim();
      if (!ssid) return '';
      const enc = el.querySelector('#qEnc').value;
      const pass = el.querySelector('#qPass').value;
      if (enc === 'nopass') return 'WIFI:T:nopass;S:' + wifiEscape(ssid) + ';;';
      return 'WIFI:T:' + enc + ';S:' + wifiEscape(ssid) + ';P:' + wifiEscape(pass) + ';;';
    }

    function renderInputs() {
      inputsEl.innerHTML = mode === 'text' ? buildText() : buildWifi();
    }

    segEl.addEventListener('click', function (e) {
      const b = e.target.closest('.seg-btn');
      if (!b) return;
      mode = b.dataset.m;
      segEl.querySelectorAll('.seg-btn').forEach(function (x) {
        x.classList.toggle('active', x === b);
      });
      renderInputs();
    });

    el.querySelector('#qGen').addEventListener('click', function () {
      const text = currentText();
      if (!text) { App.toast(mode === 'wifi' ? '请输入 WiFi 名称' : '请输入内容'); return; }
      renderQr(text);
    });

    inputsEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.matches('#qSsid, #qPass, #qText')) {
        el.querySelector('#qGen').click();
      }
    });

    renderInputs();
  },
});
