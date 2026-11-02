# 百宝箱 🧰

**百宝箱**是一个个人集成工具箱 PWA：纯前端、零构建、零依赖，原生 HTML / CSS / JavaScript 编写，手机与平板优先。所有数据只存在浏览器 localStorage 里，没有服务器、没有账号，安装后离线也能用。

内置工具：待办清单、习惯打卡、番茄钟、计算器、倒计时/秒表、随机决定、速记本、记账本、数据备份。

## 在线地址

**https://cangshengmo.github.io/toolbox/**

## 本地运行

Service Worker 要求页面通过 HTTP(S) 提供，直接双击 `index.html`（`file://` 协议）无法注册 SW、无法离线使用，所以本地预览需要先起一个静态服务器：

```bash
# 方式一：Python
python -m http.server 8080

# 方式二：Node
npx serve .
```

然后浏览器打开 <http://localhost:8080> 即可。

## 安装到手机（添加到主屏幕）

1. 手机 Chrome 打开 <https://cangshengmo.github.io/toolbox/>
2. 点右上角「⋮」菜单
3. 选择「添加到主屏幕 / 安装应用」
4. 确认后桌面出现图标，点开即全屏运行，支持离线

（iOS 上用 Safari：分享 → 添加到主屏幕。）

## 数据说明

- 所有数据保存在浏览器 **localStorage**，键名统一 `bx:` 前缀（`bx:<工具id>:<键>`），完全本地存储，不上传任何服务器。
- 清除浏览器数据、卸载 PWA 会一并清掉数据，重要数据请定期用「备份」工具导出。
- 「备份」工具可以把全部 `bx:*` 数据导出为 JSON 文件，也可以导入 JSON 恢复，用于换机或迁移浏览器。

## 如何新增一个工具

4 步接入，不需要任何构建工具：

1. 在 `tools/` 下新建 `xxx.js`，用 `App.registerTool` 注册工具；
2. 在 `index.html` 里加一行 `<script src="tools/xxx.js"></script>`；
3. 在 `sw.js` 的 `ASSETS` 数组里加一行 `'./tools/xxx.js'`（让它能被离线缓存）；
4. `git push` 提交部署。

`tools/xxx.js` 极简示例：

```js
App.registerTool({
  id: 'hello',            // 唯一 ID，路由为 #/t/hello
  name: '打招呼',
  icon: '👋',
  desc: '最简单的示例工具',
  order: 99,              // 首页排序，越小越靠前
  render(page) {
    page.innerHTML = '<button class="btn btn-primary" id="hi">你好</button>';
    page.querySelector('#hi').onclick = () => App.toast('你好，世界！');
  },
});
```

## 目录结构

```
toolbox/
├── index.html            # 入口页面（脚本顺序：store → core → 各工具）
├── manifest.webmanifest  # PWA 清单
├── sw.js                 # Service Worker（预缓存 + cache-first 离线）
├── css/
│   └── app.css           # 全部样式（CSS 变量深浅主题，手机优先）
├── js/
│   ├── store.js          # localStorage 封装（bx: 前缀、导入导出）
│   └── core.js           # 核心框架（工具注册、hash 路由、主题、toast）
├── tools/                # 各工具模块
│   ├── todo.js           # 待办清单
│   ├── habit.js          # 习惯打卡
│   ├── pomodoro.js       # 番茄钟
│   ├── calc.js           # 计算器
│   ├── timer.js          # 倒计时 / 秒表
│   ├── decide.js         # 随机决定
│   ├── notes.js          # 速记本
│   ├── expense.js        # 记账本
│   └── backup.js         # 数据备份
└── icons/
    ├── icon-192.png      # PWA 图标
    └── icon-512.png      # PWA 图标（含 maskable）
```
