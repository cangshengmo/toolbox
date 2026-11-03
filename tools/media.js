/* 百宝箱 · 读书观影记录:打分+短评+统计 */
App.registerTool({
  id: 'media',
  name: '读书观影',
  icon: 'book-open',
  desc: '书影剧打分短评',
  order: 84,

  render(el) {
    let items = App.store.get('media', 'items', []);
    if (!Array.isArray(items)) items = [];

    el.innerHTML = `
      <div class="card">
        <div class="row">
          <select id="mdType" class="select" style="flex:0 0 96px">
            <option value="book">书籍</option>
            <option value="movie">电影</option>
            <option value="series">剧集</option>
          </select>
          <input id="mdTitle" class="input grow" type="text" placeholder="标题">
        </div>
        <div class="row">
          <div id="mdStars" style="display:flex;gap:4px;flex:0 0 auto"></div>
          <input id="mdNote" class="input grow" type="text" placeholder="短评(可选)">
          <button id="mdAdd" class="btn btn-primary" style="min-height:44px">记录</button>
        </div>
      </div>
      <div class="card">
        <div class="item-title" style="margin-bottom:8px">统计</div>
        <div id="mdStats" class="muted" style="font-size:13px"></div>
      </div>
      <div class="item-title" style="margin:4px 2px 10px">全部记录</div>
      <div class="list" id="mdList"></div>
      <div class="empty" id="mdEmpty" hidden>还没有记录,看完记一个吧</div>`;

    const typeEl = el.querySelector('#mdType');
    const titleEl = el.querySelector('#mdTitle');
    const starsEl = el.querySelector('#mdStars');
    const noteEl = el.querySelector('#mdNote');
    const statsEl = el.querySelector('#mdStats');
    const listEl = el.querySelector('#mdList');
    const emptyEl = el.querySelector('#mdEmpty');
    let rating = 5;

    function renderStars() {
      starsEl.innerHTML = [1, 2, 3, 4, 5].map(function (i) {
        return '<button data-star="' + i + '" aria-label="' + i + ' 星" style="border:none;background:none;font-size:24px;padding:2px;cursor:pointer;color:' + (i <= rating ? '#f5a623' : 'var(--border)') + '">★</button>';
      }).join('');
    }

    starsEl.addEventListener('click', function (e) {
      const b = e.target.closest ? e.target.closest('button[data-star]') : null;
      if (b) { rating = +b.dataset.star; renderStars(); }
    });

    const TYPES = { book: '书籍', movie: '电影', series: '剧集' };

    function save() {
      App.store.set('media', 'items', items);
    }

    function render() {
      renderStars();
      const byType = { book: 0, movie: 0, series: 0 };
      let sum = 0;
      items.forEach(function (x) { byType[x.type] = (byType[x.type] || 0) + 1; sum += x.rating; });
      statsEl.textContent = items.length
        ? '共 ' + items.length + ' 部 · 均分 ' + (sum / items.length).toFixed(1) + ' · 书 ' + byType.book + ' / 影 ' + byType.movie + ' / 剧 ' + byType.series
        : '暂无数据';
      listEl.innerHTML = [...items].reverse().map(function (x) {
        return `
          <div class="item">
            <div style="font-size:22px" aria-hidden="true">${x.type === 'book' ? '📖' : x.type === 'movie' ? '🎬' : '📺'}</div>
            <div class="item-main">
              <div class="item-title">${App.esc(x.title)}</div>
              <div class="item-sub"><span style="color:#f5a623">${'★'.repeat(x.rating)}</span> · ${TYPES[x.type] || ''}${x.note ? ' · ' + App.esc(x.note) : ''}</div>
            </div>
            <button class="icon-btn" data-act="del" data-id="${App.esc(x.id)}" aria-label="删除"
              style="min-width:44px;min-height:44px">🗑</button>
          </div>`;
      }).join('');
      emptyEl.hidden = items.length > 0;
    }

    el.querySelector('#mdAdd').addEventListener('click', function () {
      const title = titleEl.value.trim();
      if (!title) { App.toast('请输入标题'); return; }
      items.push({ id: App.uid(), title: title, type: typeEl.value, rating: rating, note: noteEl.value.trim(), date: App.today() });
      save();
      titleEl.value = '';
      noteEl.value = '';
      rating = 5;
      render();
      titleEl.focus();
    });
    titleEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') el.querySelector('#mdAdd').click();
    });

    listEl.addEventListener('click', function (e) {
      const btn = e.target.closest ? e.target.closest('button[data-act="del"]') : null;
      if (!btn) return;
      if (btn.dataset.armed === '1') {
        items = items.filter(function (x) { return x.id !== btn.dataset.id; });
        save();
        render();
        return;
      }
      btn.dataset.armed = '1';
      btn.dataset.orig = btn.textContent;
      btn.textContent = '确认？';
      setTimeout(function () {
        if (btn.isConnected) {
          btn.dataset.armed = '';
          btn.textContent = btn.dataset.orig;
        }
      }, 3000);
    });

    render();
  },
});
