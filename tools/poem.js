/* 百宝箱 · 古诗词背诵卡:挖空填句背古诗 */
App.registerTool({
  id: 'poem',
  name: '古诗词背诵',
  icon: 'book-open',
  desc: '挖空填句背古诗',
  order: 70,

  render(el) {
    const POEMS = [
      { t: '静夜思', a: '唐·李白', l: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'] },
      { t: '春晓', a: '唐·孟浩然', l: ['春眠不觉晓', '处处闻啼鸟', '夜来风雨声', '花落知多少'] },
      { t: '登鹳雀楼', a: '唐·王之涣', l: ['白日依山尽', '黄河入海流', '欲穷千里目', '更上一层楼'] },
      { t: '江雪', a: '唐·柳宗元', l: ['千山鸟飞绝', '万径人踪灭', '孤舟蓑笠翁', '独钓寒江雪'] },
      { t: '悯农', a: '唐·李绅', l: ['锄禾日当午', '汗滴禾下土', '谁知盘中餐', '粒粒皆辛苦'] },
      { t: '相思', a: '唐·王维', l: ['红豆生南国', '春来发几枝', '愿君多采撷', '此物最相思'] },
      { t: '望庐山瀑布', a: '唐·李白', l: ['日照香炉生紫烟', '遥看瀑布挂前川', '飞流直下三千尺', '疑是银河落九天'] },
      { t: '山行', a: '唐·杜牧', l: ['远上寒山石径斜', '白云生处有人家', '停车坐爱枫林晚', '霜叶红于二月花'] },
    ];
    let picked = null;   // {pi, li} 挖空的句
    let right = 0;
    let asked = 0;

    el.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:0">
          <select id="pmPoem" class="select grow">
            <option value="-1">随机一首</option>
            ${POEMS.map(function (p, i) {
              return '<option value="' + i + '">' + p.t + ' · ' + p.a + '</option>';
            }).join('')}
          </select>
          <button id="pmGo" class="btn btn-primary" style="min-height:44px">开背</button>
        </div>
      </div>
      <div class="card" id="pmPlay" hidden>
        <div style="display:flex;align-items:baseline;gap:8px">
          <span class="item-title" id="pmTitle"></span>
          <span class="muted" style="font-size:12px" id="pmAuthor"></span>
        </div>
        <div id="pmLines" style="margin-top:10px;font-size:16.5px;line-height:2.1"></div>
        <div class="row" style="margin:10px 0 0">
          <input id="pmAns" class="input grow" type="text" placeholder="填入挖空的那句">
          <button id="pmCheck" class="btn btn-primary" style="min-height:44px">检查</button>
        </div>
      </div>
      <div class="muted" id="pmScore" style="font-size:12.5px;text-align:center;margin-top:8px">本次:对 0 / 总 0</div>`;

    const poemSel = el.querySelector('#pmPoem');
    const playEl = el.querySelector('#pmPlay');
    const titleEl = el.querySelector('#pmTitle');
    const authorEl = el.querySelector('#pmAuthor');
    const linesEl = el.querySelector('#pmLines');
    const ansEl = el.querySelector('#pmAns');
    const scoreEl = el.querySelector('#pmScore');

    function norm(s) {
      return String(s).replace(/[，。、！？；：,.!?;:\s]/g, '');
    }

    function pick() {
      const v = poemSel.value;
      const pi = v === '-1' ? Math.floor(Math.random() * POEMS.length) : +v;
      const poem = POEMS[pi];
      const li = Math.floor(Math.random() * poem.l.length);
      picked = { pi: pi, li: li };
      asked++;
      titleEl.textContent = '《' + poem.t + '》';
      authorEl.textContent = poem.a;
      linesEl.innerHTML = poem.l.map(function (line, i) {
        if (i === li) {
          return '<div id="pmBlank" style="color:var(--accent);font-weight:600;letter-spacing:2px">'
            + line.split('').map(function () { return '▢'; }).join('') + '</div>';
        }
        return '<div>' + App.esc(line) + '</div>';
      }).join('');
      playEl.hidden = false;
      ansEl.value = '';
      ansEl.focus();
      renderScore();
    }

    function renderScore() {
      scoreEl.textContent = '本次:对 ' + right + ' / 总 ' + asked;
    }

    function check() {
      if (!picked) return;
      const poem = POEMS[picked.pi];
      const expect = poem.l[picked.li];
      if (norm(ansEl.value) === norm(expect)) {
        right++;
        App.toast('✓ 答对了');
        document.getElementById('pmBlank').innerHTML = '<span style="color:#22c55e">' + App.esc(expect) + '</span>';
      } else {
        App.toast('✗ 应是:' + expect);
        document.getElementById('pmBlank').innerHTML = '<span style="color:var(--danger)">' + App.esc(expect) + '</span>';
      }
      renderScore();
      setTimeout(pick, 1400);
    }

    el.querySelector('#pmGo').addEventListener('click', pick);
    el.querySelector('#pmCheck').addEventListener('click', check);
    ansEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') check();
    });

    renderScore();
  },
});
