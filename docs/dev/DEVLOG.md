# 开发记录

按轮次追加事实与度量；度量注明测量命令与对照基线。证据目录 `tmp-research.local/`（gitignore 覆盖，未跟踪）。

## 2026-11-16

- 20:41 本轮改动（基线提交 `5b2ff29`）：移除拖动手柄改回原生 HTML5 DnD（恢复 `PRINT_ITEMS_MIME`/`hasPrintItems`，
  EditorPage 原生 drag 事件链 + 自绘 setDragImage 鬼影，无触摸 polyfill）；取消选中仅限
  `[data-print-scroll-area]` 内非交互元素点击；选中框改 primary（SUID sx 不解析 `outlineColor` 的主题路径，
  见 `node_modules/@suid/system/createSystemProps.js` 仅 color/bgcolor/border*Color 走 palette，故改用
  `useTheme().palette.primary.main` 独立 overlay）；灰度滤镜从 PaperSurface 下移到图片元素，避免选中框/框选被去色；
  末页仅占位时改为虚线添加区（无页码、无纸张样式）；浮动选中工具栏按 AOSP/Chromium 行为重写。
- 20:41 安卓行为调研（GitHub API contents 接口取源码，存 `tmp-research.local/*.java`）：
  AOSP `LocalFloatingToolbarPopup.java:435-521` 定位算法（上方优先、不足翻下方、clamp）；
  Chromium `SelectionPopupControllerImpl.java:1033-1051` 滚动隐藏 + `SHOW_DELAY_MS=300` 再现。
  实现见 `FloatingSelectionBar.tsx`、`SelectionBar.tsx`（48px 高、宽度不足溢出菜单）。
- 20:41 度量：无头 Edge（playwright-core 1.65.1，channel msedge）自动化 `node tmp-research.local/test.cjs`
  **32/32 通过**（桌面 1280×800、移动 390×844、极窄 160×600；含拖放改序/取消不改序、框选、多选旋转、
  删除+撤销、滚动隐藏再现、溢出菜单、无控制台错误）。对照基线：改动前同脚本不可跑（手柄版无原生 drag 链）。
  视觉截图 `tmp-research.local/shots/01..11`。`npx rs check` lint+format 通过；`pnpm build:browser` 成功（总 1040.8 kB）。
- 20:41 本轮被证伪的假设：① 以为 sx `outlineColor: 'primary.main'` 会解析主题色——读 SUID 源码证伪；
  ② 以为框选可从内容区任意空白起步——`getGridFrame`（document.ts:130）无缝铺满，满页/带占位页均无空白格，
  框选只能始于删除或改布局后产生的空格（测试改为行数+1 制造空格后通过）。
- 22:38 库替换一轮（用户指示：一组直接替换、二组先调研回归）：
  一组已实施——usePasteImage/createPrinting/printer index 手写监听统一为 `makeEventListener`；
  PageItems 选中/拖拽判断改 solid-js `createSelector`（需显式 keyFn，缺省签名 U 推断为整数组，tsc 报错后修正）。
  二组源码级调研结论（tarball 存 `tmp-research.local/prim/`）：**可引入** storage `makePersisted`（store 走 reconcile、
  迁移可放 deserialize）、scheduled `debounce`（trailing 语义与手写一致）、resize-observer `createWindowSize`、
  memo `createWritableMemo`（latest-wins 与现 effect 同步等价，初值需守卫）；**部分/可选** raf `createRAF`（仅覆盖循环，
  一次性 rAF 调度不覆盖）、media（现 SUID 封装已薄）；**拒绝** upload `createDropzone`（isDragging 由区内 dragstart/dragend
  置位——外部拖入不亮、内部拖拽反亮；无 enter/leave 深度态；transformFiles 每次 dragover 建 object URL 泄漏；
  dragover/drop 无条件 preventDefault 干扰内部 DnD）、upload `createFileUploader`（每次选图建 object URL 泄漏）、
  keyboard `createShortcut`（全局 document 挂载，输入框内 Ctrl+Z 会误触撤销；无 element 作用域选项）；timer 收益不抵改造面，跳过。
- 22:38 轮廓去重新方法（用户澄清 grid.ts 非死代码：旧 e8cfa36 按 index 去左/上边框，FLIP 动画下会跳变）：
  新增 `GridLines.tsx` 静态 SVG 网格线 overlay，跨度纯由占用格数推导（共享线取相邻行/列占用较大者），
  编辑与打印（SPPrint）共用；图片格去掉自带 border；选中项 zIndex 2 保证选中框压线；grid.ts 删除。
  maybeXxx（环境兼容预留）与 insets（安卓 insets 避让预留）按用户说明保留，不删。
- 22:38 度量：`node tmp-research.local/test.cjs` **34/34 通过**（新增 2 项：编辑网格线 overlay 7 条且 img border 0、
  beforeprint 触发后打印视图含 7 条裁切线；基线 32 项全保持）。目视：满页中间单虚线、部分页空格无线（shots/01、06）。
  `npx rs check` lint+format 通过；`pnpm build:browser` 成功（1042.5 kB）。
- 11-17/00:02 二组四个安全项落地：`makePersisted`（config，迁移放 deserialize，显式泛型
  `<ConfigStore, StoreReturn<ConfigStore>>` 否则推断为 unknown）、`debounce`（滚动再现）、
  `createWindowSize`（SelectionBar/FloatingSelectionBar）、`createWritableMemo`（ListSliderItem；
  注意该组件当前无引用，CustomMarginItems 用的是数字输入框，故滑杆路径无 UI 可测）。
- 11-17/00:02 打包语义修复（用户报"加图另起纸、删中间图留空位"）：根因有二——
  ① `removeItemsFromDocument`/`filterDocumentByExcludedKeys`/`removePage` 只过滤不重排；
  ② store 重建时 `applyItemTransforms` 先打包（含被排除图）再过滤 → 空洞+幻影页。
  修复：三个函数改走 `rebuildGridPages` 重排；store effect/reflow 先排除再 applyItemTransforms。
- 11-17/00:02 框选重构（用户报"只能单页内选、被纸裁切、撑大滚动区"）：marquee 提升到 PrintEditor
  滚动区层级，overlay 改 **fixed**（absolute 子元素会撑大 scroll overflow）；滚动时起点按内容锚定平移
  （scroll 监听 shift gesture.start）；命中测试跨全部页；自动滚动 tick 泛化为 autoScrollPoint 共享。
  EditorPage/PaperSurface 删除 marquee pointer 管线。全局 deselect 跳过加选修饰键。
- 11-17/00:02 打印回归三连修（用户报空白图/粗线/兼容模式每页后空白页/布局变小）：
  ① SVG 网格线在 Chromium 打印管线被丢弃（headless PDF 无 stroke/fill 图元）或描边按 ~3.125 倍加粗（用户预览粗线）
  → GridLines 改 **CSS border div**（PDF 取证：1px、dash 3/3 的填充路径，1010 moveto/页）；
  ② 兼容模式空白页 = PrintPaper aspect-ratio 亚像素溢出碎片页（空白页流仅 body 背景矩形）→
  打印媒体下 `aspectRatio:auto; height:<纸高/内容高>cm` 精确限高（先试 maxHeight:100vh 在用户引擎解析异常致布局缩小，弃用）；
  ③ 预览空白图 = 打印层 beforeprint 才挂载，预览快照与大图解码竞态 → **SPPrint 常挂载**（屏幕 display:none），
  删除 createPrinting hook。取证：Chrome 与 Edge headless `page.pdf` 均 3 页、图像 XObject 3/3/2、
  printBackground:false 仍有图；单元格放置尺度正常（外层 0.24pt/unit 缩放后 ≈362px/格）。
- 11-17/00:02 度量：`node tmp-research.local/test.cjs` **42/42 通过**（新增：删中间补位、加图填末页、
  跨页框选/不裁切/不撑滚动区/选中保留、配置写入与刷新保留、自定义边距同步持久化）。
  测试计数选择器需限定 `[data-print-scroll-area]`（打印层常挂载后全局 id 计数翻倍；应用侧按 id 去重不受影响）。
  `npx rs check` 通过；`pnpm build:browser` 成功（1045.5 kB）。
- 11-17/00:29 四连修（用户报：拖动动画从左上角播放、删除无动画、亮色预览失效/关不掉、打印带背景色、
  起点=终点框选巨大）：
  ① FLIP 起点左上角 = `captureItemRects` 全局查询被常挂载打印层 0×0 副本覆盖 → 限定滚动区；
  ② 删除/移页/删页补位移动接 FLIP：抽 `utils/flip.ts` `withFlip/cancelFlip`，PrintEditor 与
  printer index `removeSelected`（工具栏删除路径原先绕过 FLIP）共用；
  ③ 框选巨大 = 起点=终点的单击落在滚动区边缘时自动滚动把位移累加进矩形 → `moved` 阈值 3px 后才启动
  自动滚动，未移动时 scroll 锚定只移起点不更新矩形；
  ④ 打印背景色 = body 背景随背景图形打印 → `body: {'@media print': {background:'#fff'}}`
  （SUID GlobalStyles 顶层 '@media print' 键不产出规则，必须嵌套在选择器下，取证 styleSheets 确认）；
  ⑤ 亮色预览根因：**SUID styled 只订阅首见主题对象的 palette 信号，运行时换主题对象不重样式**
  （系统级切换有效因同一对象内 palette memo 变化；editorTheme memo 重算返回 light 但消费侧冻结，
  临时 console 取证后移除）→ `createAppTheme` 支持 `isDarkMode` 访问器，MainArea 改单一稳定主题对象
  `isDarkMode: () => isPreferredDark() && !props.lightMode`。开关双向取证：18,18,18 ↔ 255,255,255。
- 11-17/00:29 度量：`node tmp-research.local/test.cjs` **44/44 通过**（新增：FLIP 起点非左上角特征断言、
  删除补位有运行中动画）；`dark-check.cjs` 亮色/静止框选/打印背景三项通过。
  `npx rs check` 通过；`pnpm build:browser` 成功（1045.7 kB）。