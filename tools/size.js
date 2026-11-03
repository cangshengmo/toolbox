/* 百宝箱 · 尺码对照:鞋码/衣服国际尺码对照表 */
App.registerTool({
  id: 'size',
  name: '尺码对照',
  icon: 'ruler',
  desc: '鞋码衣服国际对照',
  order: 87,

  render(el) {
    /* 鞋码对照:中国码(毫米口径常见 220-290) */
    const SHOES = [
      { cn: '220', eu: '34', usm: '4', usw: '5.5', uk: '3', cm: '22.0' },
      { cn: '225', eu: '35', usm: '4.5', usw: '6', uk: '3.5', cm: '22.5' },
      { cn: '230', eu: '36', usm: '5', usw: '6.5', uk: '4', cm: '23.0' },
      { cn: '235', eu: '37', usm: '5.5', usw: '7', uk: '4.5', cm: '23.5' },
      { cn: '240', eu: '38', usm: '6', usw: '7.5', uk: '5', cm: '24.0' },
      { cn: '245', eu: '39', usm: '6.5', usw: '8', uk: '5.5', cm: '24.5' },
      { cn: '250', eu: '40', usm: '7', usw: '8.5', uk: '6', cm: '25.0' },
      { cn: '255', eu: '41', usm: '8', usw: '9', uk: '7', cm: '25.5' },
      { cn: '260', eu: '42', usm: '8.5', usw: '9.5', uk: '7.5', cm: '26.0' },
      { cn: '265', eu: '43', usm: '9', usw: '10', uk: '8', cm: '26.5' },
      { cn: '270', eu: '44', usm: '10', usw: '11', uk: '9', cm: '27.0' },
      { cn: '275', eu: '45', usm: '10.5', usw: '11.5', uk: '9.5', cm: '27.5' },
      { cn: '280', eu: '46', usm: '11', usw: '12', uk: '10', cm: '28.0' },
    ];
    const CLOTHES = [
      { cn: '160/76A', l: 'S', chest: '84-90', waist: '72-78' },
      { cn: '165/84A', l: 'M', chest: '90-96', waist: '78-84' },
      { cn: '170/88A', l: 'L', chest: '96-102', waist: '84-90' },
      { cn: '175/96A', l: 'XL', chest: '102-108', waist: '90-96' },
      { cn: '180/100A', l: 'XXL', chest: '108-114', waist: '96-102' },
    ];

    el.innerHTML = `
      <div class="card">
        <div class="item-title" style="margin-bottom:8px">快速查鞋码</div>
        <div class="row" style="margin-bottom:0">
          <input id="szIn" class="input grow" type="text" inputmode="numeric" placeholder="输入中国码(如 255)或欧码(如 40)">
          <div class="input grow" id="szOut" style="display:flex;align-items:center;font-weight:700;color:var(--accent);font-size:15px">—</div>
        </div>
      </div>
      <div class="card">
        <div class="item-title" style="margin-bottom:8px">鞋码对照</div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:12.5px;text-align:center" id="szShoe">
            <thead><tr style="color:var(--text-2)">
              <th style="padding:6px 4px">中国</th><th>欧码</th><th>美男</th><th>美女</th><th>英码</th><th>脚长cm</th>
            </tr></thead>
            <tbody></tbody>
          </table>
        </div>
        <div class="muted" style="font-size:11.5px;margin-top:6px">各品牌略有差异,以脚长为准</div>
      </div>
      <div class="card">
        <div class="item-title" style="margin-bottom:8px">上装对照</div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:12.5px;text-align:center" id="szCloth">
            <thead><tr style="color:var(--text-2)">
              <th style="padding:6px 4px">中国</th><th>字母码</th><th>胸围cm</th><th>腰围cm</th>
            </tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>`;

    const inEl = el.querySelector('#szIn');
    const outEl = el.querySelector('#szOut');
    const shoeBody = el.querySelector('#szShoe tbody');
    const clothBody = el.querySelector('#szCloth tbody');

    function renderTables(hl) {
      shoeBody.innerHTML = SHOES.map(function (r) {
        const hit = hl && (r.cn === hl || r.eu === hl);
        return '<tr style="' + (hit ? 'background:color-mix(in srgb, var(--accent) 18%, transparent);font-weight:700' : 'border-top:1px solid var(--border)') + '">'
          + [r.cn, r.eu, r.usm, r.usw, r.uk, r.cm].map(function (v) { return '<td style="padding:6px 4px">' + v + '</td>'; }).join('')
          + '</tr>';
      }).join('');
      clothBody.innerHTML = CLOTHES.map(function (r) {
        return '<tr style="border-top:1px solid var(--border)">'
          + [r.cn, r.l, r.chest, r.waist].map(function (v) { return '<td style="padding:6px 4px">' + v + '</td>'; }).join('')
          + '</tr>';
      }).join('');
    }

    inEl.addEventListener('input', function () {
      const q = inEl.value.trim();
      if (!q) { outEl.textContent = '—'; renderTables(null); return; }
      const row = SHOES.find(function (r) { return r.cn === q || r.eu === q; });
      if (row) {
        outEl.textContent = '中国 ' + row.cn + ' = 欧 ' + row.eu + ' = 美(男) ' + row.usm;
        renderTables(row.cn);
      } else {
        outEl.textContent = '未找到 ' + q + ',可看下表';
        renderTables(null);
      }
    });

    renderTables(null);
  },
});
