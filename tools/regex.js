/* 百宝箱 · 正则测试器：实时匹配高亮与分组捕获 */
App.registerTool({
  id: 'regex',
  name: '正则测试器',
  icon: 'regex',
  desc: '实时匹配高亮捕获',
  order: 47,

  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <span class="muted" style="flex:0 0 auto;font-family:ui-monospace,Consolas,monospace">/</span>
          <input id="rxPat" class="input grow" type="text" placeholder="正则,如 \\d+ 或 [a-z]{2,}" style="font-family:ui-monospace,Consolas,monospace">
          <span class="muted" style="flex:0 0 auto;font-family:ui-monospace,Consolas,monospace">/</span>
          <span class="muted" style="flex:0 0 auto">flags</span>
          <input id="rxFlags" class="input" type="text" value="g" style="flex:0 0 64px;font-family:ui-monospace,Consolas,monospace">
        </div>
      </div>
      <div class="card">
        <textarea id="rxText" class="input" style="min-height:110px" placeholder="测试文本"></textarea>
      </div>
      <div class="card">
        <div class="item-title" style="margin-bottom:8px">匹配结果</div>
        <div id="rxHl" style="font-size:14px;line-height:1.7;word-break:break-all;white-space:pre-wrap"></div>
      </div>
      <div class="card" id="rxList" style="margin-top:0"></div>`;

    const patEl = el.querySelector('#rxPat');
    const flagsEl = el.querySelector('#rxFlags');
    const textEl = el.querySelector('#rxText');
    const hlEl = el.querySelector('#rxHl');
    const listEl = el.querySelector('#rxList');

    function run() {
      const pat = patEl.value;
      const flags = flagsEl.value.replace(/[^gimsuy]/g, '');
      const text = textEl.value;
      if (!pat || !text) {
        hlEl.textContent = '输入正则与测试文本后实时匹配';
        listEl.innerHTML = '';
        return;
      }
      let re;
      try {
        re = new RegExp(pat, flags);
      } catch (err) {
        hlEl.innerHTML = '<span style="color:var(--danger)">正则无效:' + App.esc(String(err.message)) + '</span>';
        listEl.innerHTML = '';
        return;
      }
      const matches = [];
      if (flags.indexOf('g') !== -1) {
        let m;
        let guard = 0;
        while ((m = re.exec(text)) !== null && guard < 500) {
          matches.push(m);
          if (m.index === re.lastIndex) re.lastIndex++;
          guard++;
        }
      } else {
        const m = re.exec(text);
        if (m) matches.push(m);
      }
      if (!matches.length) {
        hlEl.textContent = text;
        listEl.innerHTML = '<div class="muted">无匹配</div>';
        return;
      }
      /* 高亮:按 match 区间拼接,前 300 个 */
      const shown = matches.slice(0, 300);
      let html = '';
      let pos = 0;
      shown.forEach(function (m) {
        html += App.esc(text.slice(pos, m.index));
        html += '<mark style="background:color-mix(in srgb, var(--accent) 30%, transparent);border-radius:4px;padding:0 2px">' + App.esc(m[0]) + '</mark>';
        pos = m.index + m[0].length;
      });
      html += App.esc(text.slice(pos));
      hlEl.innerHTML = html;
      listEl.innerHTML = '<div class="item-title" style="margin-bottom:8px">共 ' + matches.length + ' 处</div>'
        + shown.map(function (m, i) {
          const groups = m.slice(1).map(function (g, gi) {
            return g === undefined ? null : '$' + (gi + 1) + '=' + App.esc(g);
          }).filter(Boolean).join(' · ');
          return '<div class="item" style="padding:8px 12px">'
            + '<span class="muted" style="flex:0 0 auto">#' + (i + 1) + '@' + m.index + '</span>'
            + '<div class="item-main" style="min-width:0"><div class="item-title" style="font-family:ui-monospace,Consolas,monospace;font-size:13.5px;word-break:break-all">' + App.esc(m[0]) + '</div>'
            + (groups ? '<div class="item-sub">' + groups + '</div>' : '')
            + '</div></div>';
        }).join('');
    }

    [patEl, flagsEl, textEl].forEach(function (elm) {
      elm.addEventListener('input', run);
    });

    run();
  },
});
