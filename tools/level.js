/* 百宝箱 · 水平仪:重力感应实时水平提示(不支持则降级提示) */
App.registerTool({
  id: 'level',
  name: '水平仪',
  icon: 'compass',
  desc: '重力感应水平提示',
  order: 90,

  render(el) {
    el.innerHTML = `
      <div class="card" style="text-align:center">
        <div id="lvWrap" style="position:relative;width:240px;height:240px;margin:0 auto;border-radius:50%;border:2px solid var(--border);background:radial-gradient(circle, color-mix(in srgb, #22c55e 18%, transparent) 0 14%, transparent 14%), color-mix(in srgb, var(--text) 5%, transparent)">
          <div id="lvDot" style="position:absolute;left:50%;top:50%;width:26px;height:26px;border-radius:50%;background:var(--accent);transform:translate(-50%,-50%);transition:left .1s,top .1s"></div>
        </div>
        <div class="item-title" id="lvText" style="margin-top:12px">待启动</div>
        <div class="muted" id="lvAngles" style="font-size:12.5px"></div>
        <button id="lvStart" class="btn btn-primary" style="min-height:44px;min-width:130px;margin-top:10px">启动传感器</button>
      </div>
      <div class="muted" style="font-size:12px;text-align:center;margin-top:6px" id="lvHint">手机平放桌面,气泡居中即为水平</div>`;

    const dotEl = el.querySelector('#lvDot');
    const textEl = el.querySelector('#lvText');
    const anglesEl = el.querySelector('#lvAngles');
    const startBtn = el.querySelector('#lvStart');
    const hintEl = el.querySelector('#lvHint');
    let active = false;

    function paint(beta, gamma) {
      const limit = 45;
      const bx = Math.max(-limit, Math.min(limit, gamma || 0));
      const by = Math.max(-limit, Math.min(limit, beta || 0));
      dotEl.style.left = (50 + bx / limit * 42) + '%';
      dotEl.style.top = (50 + by / limit * 42) + '%';
      const level = Math.abs(beta || 0) < 1.5 && Math.abs(gamma || 0) < 1.5;
      textEl.textContent = level ? '✅ 水平!' : '倾斜中';
      textEl.style.color = level ? '#22c55e' : 'var(--text)';
      anglesEl.textContent = '前后 ' + (beta || 0).toFixed(1) + '° · 左右 ' + (gamma || 0).toFixed(1) + '°';
    }

    function onOrient(e) {
      if (e.beta === null && e.gamma === null) return;
      active = true;
      paint(e.beta, e.gamma);
    }

    startBtn.addEventListener('click', function () {
      if (active) return;
      const DOE = window.DeviceOrientationEvent;
      if (!DOE) {
        textEl.textContent = '此设备不支持方向传感器';
        hintEl.textContent = '请在安卓/带陀螺仪的手机上使用';
        startBtn.disabled = true;
        return;
      }
      if (typeof DOE.requestPermission === 'function') {
        DOE.requestPermission().then(function (state) {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', onOrient);
          } else {
            textEl.textContent = '传感器权限被拒绝';
          }
        }).catch(function () {
          textEl.textContent = '无法访问传感器';
        });
      } else {
        window.addEventListener('deviceorientation', onOrient);
        setTimeout(function () {
          if (!active) {
            textEl.textContent = '未收到传感器数据';
            hintEl.textContent = '桌面设备通常没有方向传感器,请在手机上使用';
          }
        }, 2500);
      }
      textEl.textContent = '等待传感器数据…';
    });

    return function () {
      window.removeEventListener('deviceorientation', onOrient);
    };
  },
});
