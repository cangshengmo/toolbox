/* 百宝箱 · JSON 格式化：格式化/压缩/校验 */
App.registerTool({
  id: 'json',
  name: 'JSON 格式化',
  icon: 'braces',
  desc: '格式化压缩与校验',
  order: 46,

  render(el) {
    el.innerHTML = `
      <div class="card">
        <textarea id="jsIn" class="input" style="min-height:140px;font-family:ui-monospace,Consolas,monospace;font-size:13px" placeholder='粘贴 JSON,如 {"a":1,"b":[2,3]}'></textarea>
        <div class="row" style="margin-top:10px;margin-bottom:0">
          <button id="jsFmt" class="btn btn-primary grow" style="min-height:42px">格式化</button>
          <button id="jsMin" class="btn grow" style="min-height:42px">压缩</button>
          <button id="jsCopy" class="btn grow" style="min-height:42px">复制结果</button>
        </div>
      </div>
      <div class="card" id="jsErr" hidden style="border-color:var(--danger)"></div>
      <textarea id="jsOut" class="input" style="min-height:180px;font-family:ui-monospace,Consolas,monospace;font-size:13px" readonly placeholder="结果"></textarea>`;

    const inEl = el.querySelector('#jsIn');
    const outEl = el.querySelector('#jsOut');
    const errEl = el.querySelector('#jsErr');

    function run(minify) {
      const raw = inEl.value.trim();
      if (!raw) { App.toast('请输入 JSON'); return; }
      try {
        const obj = JSON.parse(raw);
        errEl.hidden = true;
        outEl.value = minify ? JSON.stringify(obj) : JSON.stringify(obj, null, 2);
        App.toast(minify ? '已压缩' : '已格式化');
      } catch (err) {
        errEl.hidden = false;
        errEl.innerHTML = '<div style="color:var(--danger);font-weight:600;font-size:13.5px">✗ JSON 无效</div>'
          + '<div style="font-size:12.5px;margin-top:4px;word-break:break-all">' + App.esc(String(err.message)) + '</div>';
        App.toast('JSON 无效,详见错误卡片');
      }
    }

    el.querySelector('#jsFmt').addEventListener('click', function () { run(false); });
    el.querySelector('#jsMin').addEventListener('click', function () { run(true); });
    el.querySelector('#jsCopy').addEventListener('click', function () {
      if (!outEl.value) { App.toast('暂无结果'); return; }
      navigator.clipboard.writeText(outEl.value).then(function () { App.toast('已复制'); }, function () { App.toast('复制失败'); });
    });

    inEl.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run(false);
    });
  },
});
