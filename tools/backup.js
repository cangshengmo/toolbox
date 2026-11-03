/* 百宝箱 · 数据备份：导出/导入/清空全部数据 */
(function () {
  'use strict';

  App.registerTool({
    id: 'backup',
    name: '数据备份',
    icon: 'database-backup',
    desc: '导出/导入全部数据',
    order: 90,

    render: function (el) {
      const timers = []; // 清理：未决的两击确认计时器

      /* 两击确认：首击变提示文字，3 秒内再击执行，否则还原 */
      function twoClick(btn, confirmText, fn) {
        const orig = btn.textContent;
        let armed = false;
        let t = null;
        btn.addEventListener('click', function () {
          if (!armed) {
            armed = true;
            btn.textContent = confirmText;
            t = setTimeout(function () { armed = false; btn.textContent = orig; }, 3000);
          } else {
            clearTimeout(t);
            armed = false;
            btn.textContent = orig;
            fn();
          }
        });
        timers.push(function () { clearTimeout(t); });
      }

      /* ---------- 概览 ---------- */
      const all = App.store.exportAll();
      const keyCount = Object.keys(all).length;
      const bytes = JSON.stringify(all).length;
      const kb = (bytes / 1024).toFixed(1);

      el.innerHTML = `
        <div class="card">
          <div class="row"><span>数据键数量</span><span class="grow"></span><span style="font-weight:600">${keyCount} 项</span></div>
          <div class="row"><span>数据大小</span><span class="grow"></span><span style="font-weight:600">${kb} KB</span></div>
          <div class="row"><span>工具数量</span><span class="grow"></span><span style="font-weight:600">${App.tools.length} 个</span></div>
        </div>

        <div class="card">
          <div class="item-title">导出备份</div>
          <div class="muted" style="margin:4px 0 10px">将全部工具数据保存为 JSON 文件</div>
          <button class="btn btn-primary" data-role="export">导出备份文件</button>
        </div>

        <div class="card">
          <div class="item-title">导入备份</div>
          <div class="muted" style="margin:4px 0 10px">选择之前导出的备份文件，导入后覆盖当前数据</div>
          <input class="input" type="file" accept=".json,application/json" data-role="file">
          <div data-role="import-box" style="margin-top:10px"></div>
        </div>

        <div class="card">
          <div class="item-title" style="color:#c0392b">危险区</div>
          <div class="muted" style="margin:4px 0 10px">数据仅存在本机浏览器，换设备请先导出</div>
          <button class="btn btn-danger" data-role="clear">清空所有数据</button>
        </div>`;

      /* ---------- 导出 ---------- */
      el.querySelector('[data-role="export"]').addEventListener('click', function () {
        const payload = {
          app: 'baibaoxiang',
          version: 1,
          exportedAt: new Date().toISOString(),
          data: App.store.exportAll(), // 键为完整 'bx:...' 键名
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = '百宝箱备份-' + App.today() + '.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
        App.toast('已导出');
      });

      /* ---------- 导入 ---------- */
      const importBox = el.querySelector('[data-role="import-box"]');
      const fileInput = el.querySelector('[data-role="file"]');

      fileInput.addEventListener('change', function () {
        importBox.innerHTML = '';
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onerror = function () { App.toast('读取文件失败'); };
        reader.onload = function () {
          let obj = null;
          try { obj = JSON.parse(String(reader.result)); } catch (e) { obj = null; }
          if (!obj || obj.app !== 'baibaoxiang' || !obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data)) {
            App.toast('备份文件格式不对');
            return;
          }
          const count = Object.keys(obj.data).length;
          importBox.innerHTML = `
            <div class="row">
              <span class="muted grow">导入将覆盖当前数据（${count} 项）</span>
              <button class="btn btn-danger" data-role="do-import">确认导入</button>
            </div>`;
          twoClick(importBox.querySelector('[data-role="do-import"]'), '确认导入？', function () {
            App.store.importAll(obj.data);
            App.toast('导入成功');
            setTimeout(function () { location.reload(); }, 1000);
          });
        };
        reader.readAsText(file);
      });

      /* ---------- 危险区 ---------- */
      twoClick(el.querySelector('[data-role="clear"]'), '确认清空？', function () {
        App.store.clearAll();
        location.reload();
      });

      return function () { timers.forEach(function (c) { c(); }); };
    }
  });
})();
