/* 倒计时器 */
App.registerTool({
  id: 'timer', name: '倒计时', icon: '⏰', desc: '快速倒计时提醒', order: 50,
  render(el) {
    const PRESETS = [1, 3, 5, 10, 15, 30, 60];
    let totalMs = 5 * 60 * 1000;
    let endAt = 0, remainMs = 0, running = false, iv = 0;

    el.innerHTML = `
      <div class="row" id="tPresets"></div>
      <div class="row">
        <input class="input grow" id="tCustom" type="number" min="1" max="600" placeholder="自定义分钟数">
        <button class="btn-primary" id="tStart">开始</button>
      </div>
      <div class="card" id="tRunCard" style="display:none;text-align:center">
        <div class="big-time" id="tShow">00:00</div>
        <div class="row" style="justify-content:center">
          <button class="btn-primary" id="tPause">暂停</button>
          <button class="btn" id="tCancel">取消</button>
        </div>
      </div>
      <div class="muted" id="tHint" style="text-align:center">选一个预设或输入分钟数开始</div>
    `;
    const $ = s => el.querySelector(s);
    const fmt = ms => {
      const s = Math.max(0, Math.ceil(ms / 1000));
      return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    };
    const renderPresets = () => {
      $('#tPresets').innerHTML = PRESETS.map(m =>
        `<button class="chip${m * 60000 === totalMs ? ' active' : ''}" data-m="${m}">${m} 分钟</button>`).join('');
    };
    renderPresets();
    $('#tPresets').addEventListener('click', e => {
      const b = e.target.closest('[data-m]');
      if (!b || running) return;
      totalMs = Number(b.dataset.m) * 60000;
      renderPresets();
    });
    const stopIv = () => { clearInterval(iv); iv = 0; };
    const finish = () => {
      stopIv(); running = false;
      $('#tRunCard').style.display = 'none';
      $('#tStart').disabled = false;
      $('#tPause').textContent = '暂停';
      $('#tHint').textContent = '时间到！';
      App.toast('时间到！');
      App.beep(4);
    };
    const tick = () => {
      const left = endAt - Date.now();
      if (left <= 0) { finish(); return; }
      $('#tShow').textContent = fmt(left);
    };
    $('#tStart').addEventListener('click', () => {
      if (running) return;
      const custom = Number($('#tCustom').value);
      const ms = custom > 0 ? custom * 60000 : totalMs;
      if (!(ms > 0)) { App.toast('请输入分钟数'); return; }
      endAt = Date.now() + ms;
      running = true;
      $('#tRunCard').style.display = '';
      $('#tShow').textContent = fmt(ms);
      $('#tHint').textContent = '计时中…';
      $('#tStart').disabled = true;
      stopIv();
      iv = setInterval(tick, 250);
    });
    $('#tPause').addEventListener('click', () => {
      if (!running) return;
      if (iv) {
        remainMs = endAt - Date.now();
        stopIv();
        $('#tPause').textContent = '继续';
      } else {
        endAt = Date.now() + remainMs;
        iv = setInterval(tick, 250);
        $('#tPause').textContent = '暂停';
      }
    });
    $('#tCancel').addEventListener('click', () => {
      stopIv(); running = false;
      $('#tRunCard').style.display = 'none';
      $('#tStart').disabled = false;
      $('#tPause').textContent = '暂停';
      $('#tHint').textContent = '已取消';
    });
    return () => stopIv();
  }
});
