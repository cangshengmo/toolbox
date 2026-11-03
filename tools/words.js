/* 百宝箱 · 单词卡 SRS：Leitner 盒间隔重复，自定义卡组 */
App.registerTool({
  id: 'words',
  name: '单词卡 SRS',
  icon: 'languages',
  desc: '间隔重复背单词',
  order: 72,

  render(el) {
    el.innerHTML = `
      <div class="seg" id="wdSeg">
        <button class="seg-btn active" data-v="review">复习</button>
        <button class="seg-btn" data-v="manage">卡组</button>
      </div>
      <div id="wdReview"></div>
      <div id="wdManage" hidden></div>`;

    const segEl = el.querySelector('#wdSeg');
    const reviewEl = el.querySelector('#wdReview');
    const manageEl = el.querySelector('#wdManage');

    let decks = App.store.get('words', 'decks', []);
    if (!Array.isArray(decks)) decks = [];
    let cards = App.store.get('words', 'cards', {});
    if (!cards || typeof cards !== 'object' || Array.isArray(cards)) cards = {};

    /* Leitner 盒:box 0-5,答对升盒,间隔天数;答错回盒 0(今天重复) */
    const INTERVALS = [0, 1, 2, 4, 8, 16];

    function save() {
      App.store.set('words', 'decks', decks);
      App.store.set('words', 'cards', cards);
    }

    function deckCards(deckId) {
      return cards[deckId] || [];
    }

    function dueList(deckId) {
      const today = App.today();
      return deckCards(deckId).filter(function (c) {
        return String(c.due || '') <= today;
      });
    }

    function totalDue(deckId) {
      if (deckId === 'all') {
        return decks.reduce(function (n, d) { return n + dueList(d.id).length; }, 0);
      }
      return dueList(deckId).length;
    }

    /* ---------- 复习视图 ---------- */
    let scope = 'all';
    let queue = [];
    let qpos = 0;
    let flipped = false;
    let doneCount = 0;

    function startReview() {
      queue = [];
      qpos = 0;
      flipped = false;
      doneCount = 0;
      if (scope === 'all') {
        decks.forEach(function (d) { queue = queue.concat(dueList(d.id)); });
      } else {
        queue = dueList(scope);
      }
      renderReview();
    }

    function currentCard() {
      return queue[qpos] || null;
    }

    function renderReview() {
      if (!decks.length) {
        reviewEl.innerHTML = '<div class="empty">先到"卡组"里建一个卡组、加几张卡吧</div>';
        return;
      }
      const head = `
        <div class="row">
          <select id="wdScope" class="select grow">
            <option value="all">全部卡组</option>
            ${decks.map(function (d) {
              return '<option value="' + App.esc(d.id) + '"' + (scope === d.id ? ' selected' : '') + '>' + App.esc(d.name) + '</option>';
            }).join('')}
          </select>
        </div>`;
      const card = currentCard();
      if (!card) {
        reviewEl.innerHTML = head
          + '<div class="card" style="text-align:center;padding:30px 14px">'
          + '<div style="font-size:34px">🎉</div>'
          + '<div class="item-title" style="margin-top:6px">' + (doneCount ? '今日已完成 ' + doneCount + ' 张' : '今日没有待复习的卡片') + '</div>'
          + '<div class="muted" style="font-size:12.5px;margin-top:4px">明天再来,或去卡组添加新卡</div>'
          + '</div>';
        return;
      }
      const boxLabel = '第 ' + ((card.box || 0) + 1) + ' 格';
      reviewEl.innerHTML = head
        + '<div class="card" id="wdCard" style="text-align:center;padding:26px 14px;min-height:150px;display:flex;flex-direction:column;justify-content:center">'
        + '<div style="font-size:26px;font-weight:700;word-break:break-word">' + App.esc(card.front) + '</div>'
        + (flipped
          ? '<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border);font-size:17px;word-break:break-word">' + App.esc(card.back) + '</div>'
          : '<div class="muted" style="margin-top:14px;font-size:12.5px">点击卡片显示答案 · ' + boxLabel + '</div>')
        + '</div>'
        + (flipped
          ? '<div class="row" style="margin-top:12px">'
            + '<button id="wdNo" class="btn btn-danger grow" style="min-height:46px">😵 忘记</button>'
            + '<button id="wdYes" class="btn btn-primary grow" style="min-height:46px">😄 认识</button>'
            + '</div>'
          : '')
        + '<div class="muted" style="font-size:12.5px;margin-top:10px;text-align:center">今日待学 ' + (queue.length - qpos) + ' 张 · 已完成 ' + doneCount + ' 张</div>';
    }

    /* 答题:know=true 升盒并按间隔排期,false 回盒 0 今天再来 */
    function answer(know) {
      const card = currentCard();
      if (!card) return;
      if (know) {
        card.box = Math.min(5, (card.box || 0) + 1);
        const d = new Date();
        d.setDate(d.getDate() + INTERVALS[card.box]);
        card.due = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      } else {
        card.box = 0;
        card.due = App.today();
      }
      save();
      doneCount++;
      qpos++;
      flipped = false;
      renderReview();
    }

    /* ---------- 卡组视图 ---------- */
    function renderManage() {
      let html = `
        <div class="card">
          <div class="row">
            <input id="wdDeckName" class="input grow" type="text" placeholder="新建卡组名称">
            <button id="wdDeckAdd" class="btn btn-primary" style="min-height:44px">建卡组</button>
          </div>
        </div>`;
      if (!decks.length) {
        html += '<div class="empty">还没有卡组,先建一个吧</div>';
        manageEl.innerHTML = html;
        return;
      }
      html += decks.map(function (d) {
        const all = deckCards(d.id);
        const due = dueList(d.id).length;
        const learned = all.reduce(function (n, c) { return n + ((c.box || 0) >= 3 ? 1 : 0); }, 0);
        return `
          <div class="item">
            <div class="item-main">
              <div class="item-title">${App.esc(d.name)}</div>
              <div class="item-sub">共 ${all.length} 张 · 今日待学 ${due} 张 · 已掌握 ${learned} 张</div>
            </div>
            <button class="icon-btn" data-act="deldeck" data-id="${App.esc(d.id)}" aria-label="删除卡组"
              style="min-width:44px;min-height:44px">🗑</button>
          </div>`;
      }).join('');
      html += `
        <div class="card" style="margin-top:12px">
          <div class="row">
            <select id="wdDeckSel" class="select" style="flex:0 0 120px">
              ${decks.map(function (d) { return '<option value="' + App.esc(d.id) + '">' + App.esc(d.name) + '</option>'; }).join('')}
            </select>
            <input id="wdFront" class="input grow" type="text" placeholder="正面(单词)">
          </div>
          <div class="row" style="margin-bottom:0">
            <input id="wdBack" class="input grow" type="text" placeholder="背面(释义)">
            <button id="wdCardAdd" class="btn btn-primary" style="min-height:44px">加卡</button>
          </div>
        </div>
        <div class="muted" style="font-size:12px;margin-top:8px">间隔重复:认识 → 第1/2/4/8/16天复习;忘记 → 今天再来</div>`;
      manageEl.innerHTML = html;
    }

    /* 两击确认删除 */
    function armDelete(btn, fn) {
      if (btn.dataset.armed === '1') { fn(); return; }
      btn.dataset.armed = '1';
      btn.dataset.orig = btn.textContent;
      btn.textContent = '确认？';
      setTimeout(function () {
        if (btn.isConnected) {
          btn.dataset.armed = '';
          btn.textContent = btn.dataset.orig;
        }
      }, 3000);
    }

    segEl.addEventListener('click', function (e) {
      const b = e.target.closest('.seg-btn');
      if (!b) return;
      const v = b.dataset.v;
      segEl.querySelectorAll('.seg-btn').forEach(function (x) {
        x.classList.toggle('active', x === b);
      });
      reviewEl.hidden = v !== 'review';
      manageEl.hidden = v !== 'manage';
      if (v === 'review') startReview(); else renderManage();
    });

    reviewEl.addEventListener('click', function (e) {
      if (e.target.closest('#wdCard')) {
        flipped = true;
        renderReview();
        return;
      }
      if (e.target.closest('#wdYes')) { answer(true); return; }
      if (e.target.closest('#wdNo')) { answer(false); return; }
      const sel = e.target.closest('#wdScope');
      if (sel) {
        scope = sel.value;
        startReview();
      }
    });

    reviewEl.addEventListener('change', function (e) {
      if (e.target.id === 'wdScope') {
        scope = e.target.value;
        startReview();
      }
    });

    manageEl.addEventListener('click', function (e) {
      const delBtn = e.target.closest('button[data-act="deldeck"]');
      if (delBtn) {
        armDelete(delBtn, function () {
          const id = delBtn.dataset.id;
          decks = decks.filter(function (d) { return d.id !== id; });
          delete cards[id];
          save();
          renderManage();
          App.toast('卡组已删除');
        });
        return;
      }
      if (e.target.closest('#wdDeckAdd')) {
        const nameEl = el.querySelector('#wdDeckName');
        const name = nameEl.value.trim();
        if (!name) { App.toast('请输入卡组名称'); return; }
        decks.push({ id: App.uid(), name: name });
        save();
        renderManage();
        return;
      }
      if (e.target.closest('#wdCardAdd')) {
        const deckSel = el.querySelector('#wdDeckSel');
        const frontEl = el.querySelector('#wdFront');
        const backEl = el.querySelector('#wdBack');
        const front = frontEl.value.trim();
        const back = backEl.value.trim();
        if (!deckSel || !deckSel.value) { App.toast('先建一个卡组'); return; }
        if (!front || !back) { App.toast('正反面都要填'); return; }
        const deckId = deckSel.value;
        if (!cards[deckId]) cards[deckId] = [];
        cards[deckId].push({ id: App.uid(), front: front, back: back, box: 0, due: App.today() });
        save();
        frontEl.value = '';
        backEl.value = '';
        frontEl.focus();
        renderManage();
        App.toast('已添加,今日即可复习');
      }
    });

    reviewEl.hidden = false;
    manageEl.hidden = true;
    startReview();
  },
});
