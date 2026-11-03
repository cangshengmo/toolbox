/* 百宝箱 · 颜色工具：取色/HEX↔RGB↔HSL/色阶 */
App.registerTool({
  id: 'color',
  name: '颜色工具',
  icon: 'palette',
  desc: '取色转换与色阶',
  order: 48,

  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:0;align-items:center">
          <input type="color" id="clPick" value="#4f6ef7" aria-label="取色" style="width:56px;height:56px;padding:0;border:none;background:none;border-radius:12px;cursor:pointer;flex:0 0 56px">
          <div class="grow">
            <div class="row" style="margin-bottom:8px">
              <span class="muted" style="flex:0 0 44px">HEX</span>
              <input id="clHex" class="input grow" type="text" value="#4f6ef7" style="font-family:ui-monospace,Consolas,monospace">
            </div>
            <div class="row" style="margin-bottom:0">
              <span class="muted" style="flex:0 0 44px">RGB</span>
              <input id="clRgb" class="input grow" type="text" value="rgb(79, 110, 247)" style="font-family:ui-monospace,Consolas,monospace">
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="item-title" style="margin-bottom:8px">格式复制</div>
        <div id="clFmts" style="display:flex;flex-wrap:wrap;gap:8px"></div>
      </div>
      <div class="card">
        <div class="item-title" style="margin-bottom:8px">明暗色阶</div>
        <div id="clShades" style="display:flex;gap:6px"></div>
        <div class="muted" style="font-size:12px;margin-top:6px">从左到右:依次混入 60%~0% 黑与 0%~60% 白</div>
      </div>`;

    const pickEl = el.querySelector('#clPick');
    const hexEl = el.querySelector('#clHex');
    const rgbEl = el.querySelector('#clRgb');
    const fmtsEl = el.querySelector('#clFmts');
    const shadesEl = el.querySelector('#clShades');

    function hexToRgb(hex) {
      const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
      if (!m) return null;
      const n = parseInt(m[1], 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    function rgbToHex(r, g, b) {
      const h = function (x) { return ('0' + Math.max(0, Math.min(255, Math.round(x))).toString(16)).slice(-2); };
      return '#' + h(r) + h(g) + h(b);
    }

    function rgbToHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
      }
      return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
    }

    function mix(hex, other, ratio) {
      const a = hexToRgb(hex);
      const b = hexToRgb(other);
      if (!a || !b) return '#000000';
      return rgbToHex(a[0] + (b[0] - a[0]) * ratio, a[1] + (b[1] - a[1]) * ratio, a[2] + (b[2] - a[2]) * ratio);
    }

    function chip(label, value) {
      return '<button class="chip" data-copy="' + App.esc(value) + '" style="font-family:ui-monospace,Consolas,monospace;font-size:12.5px">' + label + ' ' + App.esc(value) + '</button>';
    }

    function apply(hex) {
      const rgb = hexToRgb(hex);
      if (!rgb) { App.toast('HEX 格式:#RRGGBB'); return; }
      const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
      pickEl.value = hex;
      hexEl.value = hex;
      rgbEl.value = 'rgb(' + rgb.join(', ') + ')';
      fmtsEl.innerHTML = chip('HEX', hex) + chip('RGB', 'rgb(' + rgb.join(', ') + ')')
        + chip('HSL', 'hsl(' + hsl.join(', ') + ')');
      let cells = '';
      for (let i = 0; i < 10; i++) {
        const sh = i < 5 ? mix(hex, '#000000', (5 - i) * 0.12) : mix(hex, '#ffffff', (i - 4) * 0.12);
        cells += '<button data-copy="' + sh + '" style="flex:1;aspect-ratio:1;border:none;border-radius:8px;background:' + sh + ';cursor:pointer" aria-label="' + sh + '"></button>';
      }
      shadesEl.innerHTML = cells;
    }

    pickEl.addEventListener('input', function () { apply(pickEl.value); });
    hexEl.addEventListener('change', function () {
      let v = hexEl.value.trim();
      if (v.charAt(0) !== '#') v = '#' + v;
      apply(v);
    });
    rgbEl.addEventListener('change', function () {
      const m = /(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(rgbEl.value);
      if (m) apply(rgbToHex(+m[1], +m[2], +m[3]));
      else App.toast('格式:rgb(r, g, b)');
    });

    el.addEventListener('click', function (e) {
      const b = e.target.closest('[data-copy]');
      if (!b) return;
      navigator.clipboard.writeText(b.dataset.copy).then(function () { App.toast('已复制 ' + b.dataset.copy); }, function () { App.toast('复制失败'); });
    });

    apply('#4f6ef7');
  },
});
