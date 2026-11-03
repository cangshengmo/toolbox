/* 百宝箱 · 塔罗每日一抽:单张牌面+寓意解读 */
App.registerTool({
  id: 'tarot',
  name: '塔罗每日一抽',
  icon: 'sparkles',
  desc: '每日一张牌面解读',
  order: 68,

  render(el) {
    const CARDS = [
      { n: '愚者', k: '0', m: '新的开始与无限可能,带着好奇心出发吧' },
      { n: '魔术师', k: 'I', m: '创造力与行动力在线,想到就去做' },
      { n: '女祭司', k: 'II', m: '倾听直觉,答案在你心里' },
      { n: '皇后', k: 'III', m: '丰盛与滋养,善待自己照顾他人' },
      { n: '皇帝', k: 'IV', m: '建立秩序与边界,稳住大局' },
      { n: '教皇', k: 'V', m: '遵循传统智慧,或向可信的人请教' },
      { n: '恋人', k: 'VI', m: '面临选择,跟随内心真实的渴望' },
      { n: '战车', k: 'VII', m: '目标明确,全速前进' },
      { n: '力量', k: 'VIII', m: '以柔克刚,耐心比蛮力更有用' },
      { n: '隐士', k: 'IX', m: '适独处与反思,答案需要静下来找' },
      { n: '命运之轮', k: 'X', m: '时来运转,顺势而为' },
      { n: '正义', k: 'XI', m: '权衡利弊,公平面对每个决定' },
      { n: '倒吊人', k: 'XII', m: '换个角度看问题,暂停也是前进' },
      { n: '死神', k: 'XIII', m: '一段周期结束,为新事物腾出空间' },
      { n: '节制', k: 'XIV', m: '调和与平衡,不急不躁' },
      { n: '恶魔', k: 'XV', m: '警惕欲望与执念,别被束缚' },
      { n: '高塔', k: 'XVI', m: '意外的变动,崩塌之后是重建' },
      { n: '星星', k: 'XVII', m: '希望与疗愈,相信会更好' },
      { n: '月亮', k: 'XVIII', m: '不安与迷雾,别急着下结论' },
      { n: '太阳', k: 'XIX', m: '光明与活力,尽情绽放' },
      { n: '审判', k: 'XX', m: '复盘与觉醒,迎接重要的召唤' },
      { n: '世界', k: 'XXI', m: '圆满与达成,为自己庆祝' },
    ];

    el.innerHTML = `
      <div class="card" style="text-align:center">
        <div id="ttCard" style="min-height:200px;display:flex;flex-direction:column;justify-content:center;padding:10px">
          <div class="muted">同一张牌陪你一整天,每晚换新</div>
          <button id="ttDraw" class="btn btn-primary" style="min-height:46px;margin:12px auto 0;min-width:140px">🔮 揭开今日牌</button>
        </div>
      </div>
      <div class="muted" style="font-size:12px;text-align:center">仅供娱乐与自省,命运在自己手里</div>`;

    const cardEl = el.querySelector('#ttCard');
    const drawBtn = el.querySelector('#ttDraw');

    /* 以日期为种子的确定性抽取 */
    function todayIndex() {
      const s = App.today();
      let h = 0;
      for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) % 1000000007;
      }
      return h % CARDS.length;
    }

    function show(i) {
      const c = CARDS[i];
      cardEl.innerHTML = '<div style="font-size:44px;line-height:1.2">🔮</div>'
        + '<div class="muted" style="font-size:12px;margin-top:6px">第 ' + c.k + ' 号牌 · ' + App.today() + '</div>'
        + '<div style="font-size:24px;font-weight:700;margin-top:4px">' + c.n + '</div>'
        + '<div style="font-size:14.5px;margin-top:8px;line-height:1.7">' + c.m + '</div>'
        + '<button id="ttAgain" class="btn" style="min-height:38px;font-size:13px;margin-top:12px">重新抽一张(娱乐)</button>';
      cardEl.querySelector('#ttAgain').addEventListener('click', function () {
        show(Math.floor(Math.random() * CARDS.length));
      });
    }

    /* 当日已抽过则直接展示 */
    const drawn = App.store.get('tarot', 'lastdate', '');
    if (drawn === App.today()) {
      const lastIdx = App.store.get('tarot', 'lastidx', 0);
      if (lastIdx >= 0 && lastIdx < CARDS.length) show(lastIdx);
    }
    drawBtn.addEventListener('click', function () {
      const i = todayIndex();
      App.store.set('tarot', 'lastdate', App.today());
      App.store.set('tarot', 'lastidx', i);
      show(i);
      App.beep(1);
    });
  },
});
