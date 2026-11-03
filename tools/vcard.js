/* 百宝箱 · 二维码名片:个人联系信息二维码 */
App.registerTool({
  id: 'vcard',
  name: '二维码名片',
  icon: 'contact',
  desc: '联系信息二维码',
  order: 89,

  render(el) {
    let info = App.store.get('vcard', 'info', { name: '', tel: '', email: '', org: '' });
    if (!info || typeof info !== 'object') info = { name: '', tel: '', email: '', org: '' };

    el.innerHTML = `
      <div class="card">
        <div class="row">
          <input id="vcName" class="input grow" type="text" placeholder="姓名 *" value="${App.esc(info.name)}">
          <input id="vcTel" class="input grow" type="text" placeholder="电话" value="${App.esc(info.tel)}" inputmode="tel">
        </div>
        <div class="row" style="margin-bottom:0">
          <input id="vcEmail" class="input grow" type="text" placeholder="邮箱" value="${App.esc(info.email)}" inputmode="email">
          <input id="vcOrg" class="input grow" type="text" placeholder="公司/组织" value="${App.esc(info.org)}">
        </div>
        <button id="vcGen" class="btn btn-primary" style="width:100%;min-height:44px;margin-top:10px">生成名片</button>
      </div>
      <div id="vcOut"></div>`;

    const nameEl = el.querySelector('#vcName');
    const telEl = el.querySelector('#vcTel');
    const emailEl = el.querySelector('#vcEmail');
    const orgEl = el.querySelector('#vcOrg');
    const outEl = el.querySelector('#vcOut');

    function mecard() {
      let s = 'MECARD:';
      if (info.name) s += 'N:' + info.name + ';';
      if (info.tel) s += 'TEL:' + info.tel + ';';
      if (info.email) s += 'EMAIL:' + info.email + ';';
      if (info.org) s += 'ORG:' + info.org + ';';
      s += ';';
      return s;
    }

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

    el.querySelector('#vcGen').addEventListener('click', function () {
      info = {
        name: nameEl.value.trim(),
        tel: telEl.value.trim(),
        email: emailEl.value.trim(),
        org: orgEl.value.trim(),
      };
      if (!info.name) { App.toast('至少填姓名'); return; }
      if (!info.tel && !info.email) { App.toast('电话或邮箱至少填一个'); return; }
      App.store.set('vcard', 'info', info);
      try {
        const qr = qrcode(0, 'M');
        qr.addData(mecard());
        qr.make();
        outEl.innerHTML = '<div class="card" style="text-align:center;padding:18px">'
          + '<div style="font-size:16px;font-weight:700">' + App.esc(info.name) + '</div>'
          + (info.org ? '<div class="muted" style="font-size:12.5px">' + App.esc(info.org) + '</div>' : '')
          + '<div style="margin:12px auto;max-width:280px">' + qr.createSvgTag({ cellSize: 4, margin: 2 }) + '</div>'
          + '<div class="muted" style="font-size:12.5px">扫码保存联系方式(MECARD 格式,主流相机支持)</div>'
          + '<button id="vcSave" class="btn" style="min-height:40px;margin-top:8px">保存 PNG</button>'
          + '</div>';
        const svg = outEl.querySelector('svg');
        svg.style.width = '100%';
        svg.style.height = 'auto';
        outEl.querySelector('#vcSave').addEventListener('click', function () {
          const a = document.createElement('a');
          a.href = toPng(qr);
          a.download = '名片-' + info.name + '.png';
          a.click();
          App.toast('已生成 PNG');
        });
      } catch (err) {
        outEl.innerHTML = '<div class="empty">' + App.esc(String(err && err.message || err)) + '</div>';
      }
    });
  },
});
