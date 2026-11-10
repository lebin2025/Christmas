# THE MAGIC OF CHRISTMAS · 素材清单与资源映射

> 检查时间：2026-11-09 · 检查方式：逐张读取像素、生成缩略联系表并人工目视确认
> **结论先行：素材文件名与实际内容并不一致，且 30 张原始图片全部没有透明通道。**

---

## 一、项目检查结果

| 项目 | 实际情况 |
| --- | --- |
| 技术栈 | **无**。检查时项目为空白工程，只有 `public/assets/`，无 `package.json`、无源码、无构建配置 |
| 目录结构 | 源素材已移至 `sources/christmas/{scenes, decorations, interactive, particles, overlays}/`（不进部署包）；浏览器资源在 `public/assets/christmas/{derived, audio, musicbox}/`，由 `scripts/` 从源转码生成 |
| 已有页面 / 组件 | 无 |
| 已安装依赖 | 无（`node_modules` 不存在）。环境：Node v22.22.2 / npm 10.9.7 / Python 3.13 + Pillow 13 |
| 素材总量 | 30 张，约 **150 MB**（仓库内，原始素材在 `sources/`）；`public/` 部署包仅约 21 MB（derived + audio + musicbox 的 webp/mp3/mp4） |
| 音频 | **原始素材中没有音频文件**；现有音频见文末「补充生成」，主曲已由用户提供的《A Letter I Never Sent》替换 |

### ⚠️ 三个必须知道的真相

1. **全部 `RGB`，无 alpha**：2048² 装饰图 / 交互图 / 雪花图都是不透明 PNG，直接放到场景上会出现方形硬边。
2. **底分三种**：纯白底（bell / velvet-bow / pine-branch / wreath / vinyl / golden-star / 三张雪花粒子）、纯黑底（`decorations/star.png`）、实景照片底（envelope / key / ornament / snowflake / candle / gift-* / letter-*）。三种底要用三种不同处理策略。
3. **文件名与内容不符**：`film-grain.png` 不是胶片颗粒，是一张**月光森林**；`forest.png` 不是树林剪影，是一张带圣诞树与光旋的**蓝色魔法森林**；`snowflake.png`（decorations）是暗色散景上的银色雪花**实景照片**，不是透明贴图；`opening.webp` 是教堂广场，`final.webp` 是极光雪谷。

---

## 二、原始素材清单（按实际内容记录）

### A. 场景 · 5 张 · 2848×1600 · WebP · RGB · 无透明

统一摄影语言：深蓝夜色 + 琥珀色窗火、画家笔触、低照度、中心透视、天空留有深色负空间，适合叠加标题。

| 文件路径 | 实际画面内容 | 尺寸 / 格式 / 通道 | 推荐用途 |
| --- | --- | --- | --- |
| `scenes/opening.webp` | 雪夜小镇广场：哥特教堂双尖塔、满月、中央发光的圣诞树、两侧木构房屋与路灯 | 2848×1600 / WebP / RGB 无 alpha | **ACT VI 终幕**：回到广场，月光与金色尘埃收束全片 |
| `scenes/street.webp` | 雪后商业街纵深透视，两侧橱窗暖光、湿漉漉的石板路反光、远处教堂 | 同左 | **ACT II 圣诞小镇**：最适合做横向视差与镜头推进 |
| `scenes/tree.webp` | 广场巨型圣诞树特写，树顶金星、金色彩灯螺旋、树下成堆礼物 | 同左 | **ACT III 圣诞树**：树灯交互的舞台 |
| `scenes/cabin.webp` | 室内：燃烧的壁炉、左侧蓝夜窗户、右侧圣诞树、沙发、地毯、书本与礼物 | 同左 | **ACT IV 圣诞小屋**：拆礼物、烛光、唱片机 |
| `scenes/final.webp` | 极光下的雪谷全景，远山、星星点点的村庄、中央远处一棵发光的树 | 同左 | **ACT I 抵达**：最辽阔的定场镜头 |

### B. 圣诞装饰 · 10 张 · 2048×2048 · PNG · RGB · 无透明

| 文件路径 | 实际内容 | 底 | 推荐用途 |
| --- | --- | --- | --- |
| `decorations/bell.png` | 金色双铃 + 红色丝绒蝴蝶结 | 纯白 | 抠图 → ACT II / IV 悬挂装饰 |
| `decorations/velvet-bow.png` | 深红色丝绒蝴蝶结 | 纯白 | 抠图 → 礼物 / 信件封口的角标 |
| `decorations/pine-branch.png` | 单枝冷杉，朝上 | 纯白 | 抠图 → 前景层，制造景深遮挡 |
| `decorations/wreath.png` | 冷杉花环 + 干橙片 + 红蝴蝶结（中间有真实镂空） | 浅白纹理 | 抠图（保留镂空）→ ACT II 门楣 |
| `decorations/snowflake.png` | 银色雪花吊饰，背景是虚化的圣诞树散景 | 暗色实景 | 照片板 → 柔边遮罩，ACT III 悬浮装饰 |
| `decorations/star.png` | 金色五角星吊饰，发光 | **纯黑** | 直接用 `mix-blend-mode: screen`，黑底自动消失 |
| `decorations/ornament.png` | 透明玻璃球挂饰，内部映出一棵圣诞树 | 暗色散景实景 | 照片板 → ACT III 景深前景 |
| `decorations/gift-box.png` | 深红礼盒 + 金色缎带，背景是圣诞树散景 | 暗色实景 | 照片板 → ACT IV 桌面陈设 |
| `decorations/envelope.png` | 米色信封 + 红色火漆封蜡，平铺俯拍 | 暗绿冷杉实景 | 照片板 → ACT V 信件区 |
| `decorations/key.png` | 金色古董钥匙，背景是虚化的挂球与礼物 | 暗色实景 | 照片板 → ACT I「打开夜晚的钥匙」 |

### C. 交互素材 · 7 张 · 2048×2048 · PNG · RGB · 无透明

| 文件路径 | 实际内容 | 底 | 推荐用途 |
| --- | --- | --- | --- |
| `interactive/gift-closed.png` | 合上的红金礼盒，深红影棚背景 | 深红渐变 | 与 gift-open 同位置交叉淡入 → **拆礼物动画** |
| `interactive/gift-open.png` | 盒盖飞起、金色魔法光粒从盒中涌出 | 深红渐变 | 同上 |
| `interactive/letter-closed.png` | 封好的奶油色信封 + 火漆，衬冷杉枝 | 暗色实景 | 与 letter-open 交叉淡入 → **展开信纸** |
| `interactive/letter-open.png` | 展开的空白信纸 + 蜡烛 + 火漆 | 暗色实景 | 同上，信纸区域承载心愿输入 |
| `interactive/candle.png` | 燃烧的白色蜡烛 | 暖棕渐变 | 柔边遮罩 + CSS 火焰闪烁 → ACT IV 光源 |
| `interactive/vinyl.png` | 黑色黑胶唱片 + 酒红标签 | **纯白** | 抠图 → **旋转唱片机**（旋转时白底会露馅，必须抠） |
| `interactive/golden-star.png` | 发光的金色星星 + 光晕环 | 浅白 | 抠图 → 树顶星 / 终幕星轨；白底版本留作照片板 |

### D. 雪花粒子 · 3 张 · 2048×2048 · PNG · RGB · 无透明

| 文件 | 实际内容 | 底 | 推荐用途 |
| --- | --- | --- | --- |
| `particles/snowflake-01.png` | 蓬松的球状雪团 / 雪绒 | 纯白 | 放大虚化 → Canvas 近景雪花精灵 |
| `particles/snowflake-02.png` | 六角冰晶，淡蓝色 | 纯白 | 中景雪花精灵（结构最清晰） |
| `particles/snowflake-03.png` | 模糊的圆形雪绒球 | 纯白 | 远景失焦雪花精灵 |

> 这三张是**白底上的白色物体**，对比极低，不能当普通贴图用。脚本以「放大白底与主体的微小亮度差」生成 alpha，并重新着色为冷白，供 Canvas 分层绘制。

### E. 氛围层 · 5 张 · 2848×1600 · PNG · RGB · 无透明

| 文件 | 实际内容 | 推荐用途 |
| --- | --- | --- |
| `overlays/bokeh.png` | 密集的暖金色光斑，高亮 | `screen` 混合、低透明度 → 全片暖光晕 |
| `overlays/golden-dust.png` | 浅金色尘埃 + 一条斜向星轨 | `screen` → ACT V / VI 魔法粒子流 |
| `overlays/fog.png` | 中性灰的雾气渐变纹理 | 场景底部雾层，`screen` + 低透明度 |
| `overlays/forest.png` | **蓝色魔法森林 + 光旋 + 远景圣诞树**（完整画面） | **ACT V 主场景背景**，不是叠加层 |
| `overlays/film-grain.png` | **月光穿过树林的蓝色光束**（完整画面，并非颗粒） | ACT I / V 的冷调氛围底；真正的胶片颗粒改用 CSS SVG `feTurbulence` 程序化生成 |

### F. 补充生成（非原始素材）

| 文件 | 说明 |
| --- | --- |
| `audio/A Letter I Never Sent.mp4` | **用户提供，现为主曲 `AUDIO.music`**：3:20（200s）M4A/AAC 单音轨、无视频流，保留原文件名与空格；Howler 以 `html5: true` 交给浏览器媒体栈解码、`loop: true` 循环。声音台与 ACT IV 唱片机文案同步更新 |
| `audio/musicbox.wav` | 原创 25.6s 无缝八音盒 / 钢片琴旋律（D 大调，75 BPM），Python stdlib 合成，无版权风险。**已存档、不再引用**，需要时可运行 `scripts/generate_audio.py` 重新生成 |
| `audio/winter-ambience.wav` | 原创 12s 无缝风声 + 壁炉噼啪环境声；仍作为可开关的环境音 `AUDIO.ambience` |
| `audio/Snowflakes & Unspoken Love.mp4` | **用户提供，ACT III 音乐盒独立音轨 `AUDIO.musicBox`**：3:04（184s）M4A/AAC 单音轨、无视频流，保留原文件名；独立 Howl 实例、`html5: true`、`loop: false`，不自动播放。与全局主曲互斥，不会同时响 |
| `derived/**` | 由 `scripts/derive_assets.py` 生成的浏览器优化版：2400px WebP 场景、真正带 alpha 的 WebP 抠图、900px 照片板、1600px 氛围层、256px 雪花精灵。原始文件保持不动 |

### G. ACT III 音乐盒（用户后补的 3 张照片 + 1 首曲子）

原始文件全部收拢在 `public/assets/christmas/musicbox/source/` 子文件夹，原名未动；`musicbox/*.webp` 是它们的**纯格式转码**：同尺寸、同像素、不裁剪、不调色；两张白底产品图额外由 `scripts/derive_musicbox_alpha.py`（输入目录已指向 `musicbox/source/`）计算 alpha（亮度斜坡 + 从四边洪泛填充，只清除与画面外连通的棚拍白底/棋盘格/桌面反光，物体内部的白色高光原样保留）。**没有生成任何新画面或替代素材**。

> 早期曾额外派生 `ballerina.webp` / `winding-key.webp` 两张独立摆件图层，现已**移除**——打开态照片 `圣诞雪夜芭蕾音乐盒.png`（open）本身已画好内景（雪夜小镇、舞者、钥匙），无需再叠独立图层。对应的 `MUSIC_BOX.ballerina` / `MUSIC_BOX.windingKey`、源 PNG 与 webp 均已删除；`derive_musicbox_alpha.py` 的 `PLATES` 也收敛为 `closed` / `lid` 两项。

| 原始文件（位于 `musicbox/source/`） | 尺寸 / 通道 | 内容核对 | 映射名 / 用途 |
| --- | --- | --- | --- |
| `Antique Christmas Music Box (Closed).png` | 2240×2048 RGB 白底 | 完整闭合的深胡桃木音乐盒，3/4 俯视，右侧带上弦钥匙 | `MUSIC_BOX.closed`，STATE A 闭合态 |
| `圣诞雪夜芭蕾音乐盒.png` | 1312×1199 **RGBA 真透明** | 打开态全景：竖起盖框、雪夜小镇内景、舞者、钥匙（内景已含舞者/钥匙） | `MUSIC_BOX.open`，打开态基底 |
| `Antique Christmas Music Box Lid.png` | 2240×2048 RGB 白底 | 盖面（含金色雪花纹章）的完整上视产品图 | `MUSIC_BOX.lid`，经 CSS `clip-path` 裁出盖面，绕 50%/59% 铰链 `rotateX(-108°)` |

**夜的风声（ambience）**：原 `winter-ambience.wav` 已替换为 `cold-wind-breeze-ambience-8e383c41.mp3`（`AUDIO.ambience` 现指向该 mp3，旧 wav 已删除）。默认仍 `ambienceOn:false`，可在音乐控制器点「夜的风声」开启。

---

## 三、统一资源映射

程序中的唯一入口：`src/assets/assets.js`（`SCENES` / `CUTOUTS` / `PLATES` / `OVERLAYS` / `FLAKES` / `MUSIC_BOX` / `AUDIO`）。所有组件只通过该映射取地址，不写死路径；换素材时只改一处。音乐盒曲目的**唯一可配置处是 `AUDIO.musicBox`**。

### 六幕分镜 → 素材

| 幕 | 标题 | 主场景图 | 分层与交互素材 |
| --- | --- | --- | --- |
| ACT I | THE ARRIVAL | `final.webp` 极光雪谷 | `fog` 底部雾 + `film-grain` 冷光 + `key` 照片板 + 冷杉前景 |
| ACT II | CHRISTMAS TOWN | `street.webp` 雪街 | `wreath` 花环、`bell` 金铃、`pine-branch` 双层前景视差 |
| ACT III | THE CHRISTMAS TREE | `tree.webp` 巨树 | `star-on-black`（screen）、`golden-star` 抠图、`ornament` / `snowflake-ornament` 景深板；树灯点击交互；**树右前方雪地上的五态音乐盒**（`MUSIC_BOX.*` + `AUDIO.musicBox`），盖子/舞者/钥匙各自独立动画 |
| ACT IV | THE CHRISTMAS CABIN | `cabin.webp` 壁炉室内 | `gift-closed/open` 拆礼物、`candle` 烛光、`vinyl` 抠图旋转唱片机 |
| ACT V | LETTERS TO CHRISTMAS | `forest.png` 魔法森林（实为完整场景） | `letter-closed/open` 展开信纸、`envelope`、心愿输入与 localStorage 保存、`golden-dust` 星轨 |
| ACT VI | A NIGHT TO REMEMBER | `opening.webp` 教堂广场 | `bokeh` / `golden-dust` / `golden-star`、心愿星群、返回首页 |

### 处理策略对照

| 底类型 | 处理方式 | 涉及素材 |
| --- | --- | --- |
| 纯白底 | 亮度差 → 软 alpha + 内部白点回填 + 边缘预压暗（去白边、形成轮廓光） | bell, velvet-bow, pine-branch, wreath, vinyl, golden-star, 3× 雪花粒子 |
| 纯黑底 | 不抠图，CSS `mix-blend-mode: screen` 让黑底自然消失 | `decorations/star.png` |
| 实景照片底 | 保留为「摄影照片板」：径向柔边遮罩 + 极细金色描边 + 投影，做成有意识的艺术装裱而非硬贴方块 | envelope, key, ornament, snowflake, gift-box, candle, gift-closed/open, letter-closed/open |
| 氛围层 | `screen` 混合 + 低透明度 + 缓慢漂移；`forest` / `film-grain` 当完整画面用 | 5 张 overlays |
