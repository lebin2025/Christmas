# THE MAGIC OF CHRISTMAS · 未说出口的圣诞

> 六幕沉浸式暗恋叙事：雪夜抵达、圣诞镇、许愿树下的音乐盒、未寄出的信。
> 以克制的留白讲一个「想爱却不敢表达」的冬夜——双击私语、留灯、钥匙悬停、
> 窗影、礼物转交、称呼试探、收回那句话……微小互动串起一整夜没说出口的心事。

[English version below](#english)

---

## 特性

- **六幕线性叙事**：雪夜抵达 / 圣诞镇 / 圣诞树 / 小屋 / 未寄之信 / 终章，可逐幕前进、回看。
- **跨幕「未说出口」互动**：双击屏幕任意处，左下角便签会显影一句没敢说的话又收回；计数跨刷新保留。
- **交互式八音盒（ACT III）**：纯静态照片程序化开合动画（闭合 → 打开 → 播放 → 暂停 → 完成归零），相机随开盖推近，独立盖铰链、暖光、播放器。
- **环境音与配乐**：站点全曲、八音盒专属旋律、夜的风声三路互斥播放，支持进度 / 音量 / 淡入淡出。
- **客户端持久化**：心愿与「未说出口」计数存入浏览器内 **SQLite（sql.js）**，文件落盘到 IndexedDB，刷新不丢；不可用时自动回退 localStorage。
- **无障碍与移动端**：遵循 `prefers-reduced-motion`，移动端布局与播放器自适应，`overflow:clip` 杜绝程序滚动。
- **按需挂载 · 首屏轻量**：六幕只挂载当前一幕（动态组件切换，黑场 veil 盖住换页），首屏只请求当幕的 1 张场景大图与少量装饰，而非一次拉全部场景图；音频不预加载、SQLite 空闲水合，显著降低首屏并发与流量。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Vue 3（`<script setup>` + Composition API） |
| 渲染 | 单幕按需挂载（动态 `<component :is>` + `:key`），黑场 veil 覆盖换页 |
| 构建 | Vite 6（项目站点 `base: '/Christmas/'`） |
| 动画 | GSAP 时间线（开合 / 相机推近 / 防快速点击冲突） |
| 音频 | Howler.js（多路互斥、进度、音量、淡入淡出） |
| 数据库 | sql.js（浏览器内 SQLite）+ IndexedDB 持久化 |
| 资源处理 | Python + Pillow（白底产品图像素级 alpha 推导） |
| 验收 | Playwright-core 无头 QA（五态 / 移动端 / 降低动效全绿） |

## 本地运行

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 输出到 dist/
npm run preview    # 本地预览构建产物
```

> 构建使用 `emptyOutDir: false`，构建前请先 `node scripts/clean_dist.mjs` 清空旧产物，
> 避免遗留历史包。

## 部署（GitHub Pages）

仓库已配置 `.github/workflows/deploy.yml`：推送 `main` 即自动构建并发布到
GitHub Pages 项目站点 `https://<user>.github.io/Christmas/`。

启用步骤：

1. 仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。
2. 推送任意改动到 `main`，Actions 会自动构建并部署。
3. 首次部署后，站点地址出现在仓库 **Settings → Pages** 与每次 Action 的运行摘要中。

> 若改为部署到用户/组织根站点（`https://<user>.github.io/`），
> 只需把 `vite.config.js` 里的 `base` 改为 `'/'` 即可，其余无需改动。

## 项目结构

```
Christmas/
├─ index.html                 # 入口；base 敏感资源已用相对路径
├─ vite.config.js             # base: '/Christmas/'
├─ src/
│  ├─ main.js  App.vue
│  ├─ assets/assets.js        # 唯一资源映射（所有 URL 由 BASE_URL 拼接）
│  ├─ composables/            # 状态 / 音频 / 影片 / 八音盒 / SQLite 数据库 / 雪
│  ├─ components/             # 场景壳、导航、播放控制、八音盒、叠层
│  ├─ scenes/                 # 六幕场景
│  └─ styles/                 # 全局 / 场景 / 变量 / 动画
├─ public/
│  ├─ favicon.svg
│  └─ assets/christmas/       # 部署用：derived/(webp) + audio/(mp3/mp4) + musicbox/(webp)
├─ sources/christmas/         # 转码源素材（原始 PNG/webp），不进部署包，供 scripts/ 重跑
├─ scripts/                   # alpha 推导、无头 QA、dist 清理
├─ ASSET_INVENTORY.md         # 素材来源与转码说明（详见）
└─ LICENSE
```

## 数据 / 数据库

本项目是**纯静态站点，无服务端、无中心数据库**。用户数据存于浏览器：

- 数据库文件是真正的 **SQLite**（sql.js 在 WebAssembly 中运行），以二进制 blob 存入 **IndexedDB**。
- 表：`wishes`（心愿）、`kv`（单值，如未说出口计数）。
- 站点加载时从 IndexedDB 水合，每次写入即刻落盘；sqlite.js / IndexedDB 不可用时回退 localStorage，体验不中断。
- 由于数据留在各访客浏览器，**心愿不跨设备、不跨用户共享**。如需云端共享，需另加后端（如 better-sqlite3 服务 + API）。

## 素材说明

八音盒与场景素材均为用户提供照片的**纯格式转码**（同像素、不裁剪、不调色），
部分白底产品图经 `scripts/derive_musicbox_alpha.py` 计算透明通道，不生成新画面。
完整清单与核对记录见 [`ASSET_INVENTORY.md`](./ASSET_INVENTORY.md)。

---

## English

An interactive six-act Christmas experience about unspoken love — a quiet,
restrained winter night where a line is never quite said. Double-click to let a
note unfold and retreat; the music box opens on ACT III; wishes and an
"unspoken" counter persist in the browser.

- **Stack:** Vue 3 + Vite 6, GSAP, Howler.js, and **client-side SQLite** (sql.js) persisted to IndexedDB — a fully static site, no server.
- **Run:** `npm install` → `npm run dev`.
- **Deploy:** GitHub Pages via `.github/workflows/deploy.yml`; `base` is `/Christmas/` for project-site hosting (set to `/` for a user/org root site).
- **Data:** SQLite database saved as a blob in IndexedDB; falls back to localStorage automatically.

## License

See [LICENSE](./LICENSE).
