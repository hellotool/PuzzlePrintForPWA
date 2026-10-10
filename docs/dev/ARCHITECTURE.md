# 软件架构设计

本文描述项目的**现状架构**（as-built）与编码约定，是阅读代码、评审变更、新增功能时的
基准参考。文中所有结构描述均与代码一一对应；已知的偏离之处不掩饰，集中记录在第 11 节，
作为后续改进的 backlog。

## 1. 概览

项目是「一套前端代码，两种交付形态」：同源的 SolidJS 应用同时构建为 Web (PWA) 与
Tauri 桌面端。

- 语言：TypeScript（strict，含 `noUnusedLocals` / `noUnusedParameters`）
- UI：SolidJS 1.9 + SUID（Material Design）+ SCSS
- 构建：Rsbuild，两个 environment（`browser` / `tauri`），靠编译期常量区分形态
- 桌面壳：Tauri 2，Rust 侧仅 `opener` 插件，无自定义 command
- 质量门：`pnpm check` = rstack CLI（Rslint 检查 + rs fmt 格式）+ rumdl（文档）

前端为 **Feature-First** 架构：通用能力与业务知识分离，每个功能垂直成切片，页面只负责装配。

## 2. 分层与依赖方向

自下而上四层，依赖只能自上而下单向流动：

```text
app  ──▶  pages  ──▶  features  ──▶  shared
启动装配    页面组合     垂直功能切片     无业务知识的基础能力
```

规则：

1. `shared` 不得 import `features` / `pages` / `app`；它不知道本应用是做什么的。
2. `features` 之间不得相互 import。两个 feature 需要共用某物时，把它上提到 `shared`。
3. `features` 不得 import `app`。
4. `pages` 组合 feature 与 shared，不实现引擎逻辑。
5. `app` 只做启动与全局装配（入口、主题、i18n Provider、全局副作用、页面挂载），不写业务。

`src/locales/` 位于四层之外，是纯数据层：自身不依赖任何层，词典内容由 `app/App.tsx` 读取后
注入 `shared/i18n`。`shared/i18n` 只以 `import type` 引用它的词典类型，没有运行时耦合。

规则 1-5 目前在代码中均无违反。

## 3. 目录结构

```text
src/
├── app/                      # 应用组装层
│   ├── index.html            # HTML 模板
│   ├── index.tsx             # 入口：挂载 App、注册 SW、Tauri 窗口显示、<html lang>
│   ├── App.tsx               # 全局 Provider（主题/i18n/meta）、词典注册表与形态分支
│   ├── global-effects.ts     # disable-drop / disable-F5 / disable-context-menu / makeMeta
│   └── manifest/
│       └── manifest.json     # Web App Manifest 基础配置（icons / scope / display）
├── pages/
│   └── printer/              # 唯一业务页面：装配 + 页面私有状态
│       ├── index.tsx         # 页面骨架与 Provider 组合
│       ├── components/       # AppBarArea / MainArea / ImageSheets / AdjustSheets / SPPrint …
│       ├── contexts/         # ConfigContext / ImagesContext（Provider + useXxx 守卫）
│       ├── stores/           # config / images（createXxxStore + createXxxActions 同文件）
│       └── types/            # 页面私有类型
├── features/                 # 垂直功能切片
│   ├── print/                # 打印引擎（本项目的核心业务 feature）
│   └── about/                # 关于对话框（自带图标资源，自成一体）
├── shared/                   # 通用能力，无业务知识
│   ├── app-meta.ts           # APP_VERSION / COPYRIGHT / EMAIL / 仓库与许可证 URL（纯常量）
│   ├── components/           # UI 原语：toolbar/ list/ bottom-sheets/ insets/
│   ├── hooks/                # createSyncedState / createSheetOpenedState / usePreferredDarkMode …
│   ├── i18n/                 # locale 推断、translator、GlobalLocaleConfigProvider（词典由外部注入）
│   ├── pwa/                  # Service Worker 注册与更新提示（模块级 signal 单例）
│   ├── styles/               # reset.scss 与全局组件样式
│   ├── themes/               # createAppTheme
│   ├── utils/                # file / grid / list / platform / suid
│   └── types/                # 全局 ambient 声明（IS_TAURI、资源模块声明等）
└── locales/                  # 词典数据层（当前仅 app 级文案与 manifest 文案）
    ├── index.ts              # Locale 联合类型、GlobalDictionary 类型（由 zh-CN 推导）
    ├── zh-CN/
    └── en/
```

feature 的标准骨架（按需取舍，不强制全建）：

```text
features/print/
├── index.ts                  # 对外公共入口，外部只从这里 import
├── components/
├── contexts/
├── hooks/
├── utils/
└── locales/                  # feature 词典（既定方向，待补译功能文案时落地）
    ├── en.ts
    └── zh-CN.ts
```

## 4. 各层职责

### `app`

持有「应用是什么」的知识：名称、版本、仓库地址、版权。入口决定形态差异：
Tauri 下禁用拖拽/F5/右键、显示窗口并同步标题；浏览器下注册 Service Worker、
同步 `theme-color`。`IS_TAURI` 分支只允许出现在这一层。

### `shared`

存放可原样搬到别的项目里的代码。判断标准是「改名换皮后还能不能用」：
`mergeMultiSxProps`、`createSyncedState`、`platform.ts` 属于这里；任何含「打印」「图片」
「凭证」字样的逻辑不属于。

两个容易误判为 feature 的模块明确属于本层，因为它们不携带领域知识：

- `components/insets`：`InsetsProvider` 可嵌套叠加——子 Provider 先读父级 insets，
  未指定的边沿用父级值；`InsetsContext` 有零值默认值，组件在 Provider 外也能工作。
- `pwa`：Service Worker 注册与更新提示。持有模块级 signal 单例（`isServiceWorkerWaiting`），
  并按需动态 import `workbox-window`；是无 Provider 的全局状态，属本模式唯一例外。

`app-meta.ts` 是应用身份常量（版本、版权、邮箱、仓库与许可证 URL）：纯数据、无行为、
无依赖。放在本层是为了让 `features` 能合法读取它——部署元信息不等于业务知识，
而「关于」这类 UI 模块天生需要它。注意它是本项目唯一带应用身份的 shared 模块。

### `features`

feature 的准入标准：**携带领域知识、能脱离具体页面独立成立**。按能力切分，不按 UI 位置切分。
每个 feature 通过自身 `index.ts` 暴露最小 API，外部不深路径 import 内部文件。

- `print`：打印引擎。两组平行组件——`Print`/`PrintPaper`（真实打印）与
  `PrintPreview`/`PrintPreviewPaper`（屏幕预览）——共享 `utils/` 的纸张计算。
  父组件（`Print` / `PrintPreview`）把纸张尺寸、边距换算成比例后经 context 下发，
  子组件（`*Paper`）从 context 读取，二者不直接传参。
- `about`：关于对话框及其图标资源。自成一体的 UI 能力，不含打印领域知识，与 `print` 无依赖。

打印链路的时序（`print` 与页面协作的核心机制）：

1. 用户触发 `window.print()` → 浏览器派发 `beforeprint`；
2. `createPrinting` 监听该事件，把 `isPrinting` 置为 `true`；
3. 页面据此挂载 `SPPrint`，`Print` 组件经 Portal 渲染到 `body > .print` 节点；
4. `Print` 注入的 GlobalStyles 在 `@media print` 下隐藏 `body` 其他直接子节点，
   只保留 `.print`——以此实现「整页只有打印区进入纸面」；
5. `afterprint` 后 `isPrinting` 复位，打印区卸载。

### `pages`

`pages/printer` 是页面装配层：AppBar、主区域、两个 bottom sheet、打印入口，以及页面私有状态
（待打印图片集合、打印/预览配置）。这些状态是「本页面的业务流程」，不是可复用能力，
因此留在 `pages/`，不塞进 `features/print`。

当前应用只有一个页面，`pages/` 层的价值在于：让 `app/` 保持薄装配、让页面级状态有明确的
归属边界，并为将来增加页面（如设置页）留好位置。

## 5. 状态管理

不使用外部状态库，采用「store 模块 + Context 注入」：

- **stores/ 是纯工厂**。每个文件导出 `createXxxStore()` 与 `createXxxActions(setState, …)`，
  读写同处一个模块（不存在独立 actions 目录）。store 模块之间只依赖类型
  （如 `stores/images.ts` 仅 `import type { ConfigStore }`），不产生运行时耦合。
- **contexts/ 只做注入**。Provider 调工厂、组装 `{ state, actions }` 放进 context；
  `useXxx()` 读取并在缺失 Provider 时抛出带指引的错误。context 不承载业务逻辑。
- **Provider 顺序即依赖声明**。`ImagesProvider` 内部调用 `useConfig()`，因此必须位于
  `ConfigProvider` 之内（见 `pages/printer/index.tsx` 的组合顺序）。
  跨 store 的联动只允许经 context 层完成，store 工厂不直接 import 彼此的运行时。
- **派生状态写在 store 内**。如 `chunkedImages` 用 store getter 实现，随 `images` 与
  排版配置自动重算，而不是在组件里 `createMemo`。
- 跨层传递靠显式 props 或 context，不使用全局单例事件总线。

数据流方向：用户输入 → actions 改 store → 响应式派生（预览、分页）→ 打印动作读取快照。

## 6. 命名约定

SolidJS 社区的约定（源自作者对该问题的明确答复，`useContext` 是官方范例）：

- **`createXxx`**：创建一个新的响应式原语/资源——signal、store、effect、订阅。
  每次调用产生新实例，调用处即 owner。Solid 的一切只创建一次，故默认前缀是 `create`。
- **`useXxx`**：消费一个**已经被创建好的**东西——从 context 里取值。
  语义即「use the already created context」。

判定口诀：这个函数是在**制造**一个东西，还是在**取用**别人造好的东西？

项目内的应用：

| 函数 | 前缀 | 依据 |
| ---- | ---- | ---- |
| `useConfig` / `useImages` / `useInsets` / `usePrintPaperConfig` | `use` | 纯 context 读取 |
| `createPrinting` / `createSheetOpenState` / `createSyncedState` / `createCurrentLocale` | `create` | 创建 signal/effect |
| `createConfigStore` / `createConfigActions` / `createAppTheme` | `create` | 工厂 |

其余命名与文件约定：

- 目录 kebab-case；组件文件 PascalCase；工具与原语文件 camelCase。
- 具名导出为默认；仅页面/对话框等「一个文件一个主体」的组件允许 default export。
- 包装 SUID `useMediaQuery` 的 `usePreferredDarkMode` / `useDisplayStandaloneMode`
  保留 `use` 前缀，作为对 SUID API 的透传对齐；二者成对出现，风格一致即可。

## 7. 双形态与构建

Rsbuild `source.define` 注入编译期常量：

| 常量 | browser | tauri | 用途 |
| ---- | ------- | ----- | ---- |
| `IS_TAURI` | false | true | 形态分支（全局副作用、窗口） |
| `CONFIG_ENABLE_PWA` | true | false | 是否注册 Service Worker、是否显示更新入口 |
| `import.meta.env.APP_VERSION` | 同 | 同 | 取自 `package.json` version |
| `import.meta.env.GIT_REFERENCE` | 同 | 同 | tag 或 commit hash，拼许可证链接 |

分支规则：形态判断集中在 `app/`（`index.tsx` 与 `App.tsx`），组件内部不出现 `IS_TAURI`
或 `CONFIG_ENABLE_PWA`；新增形态差异优先做成条件装配，而非散落三元。
UI 若需要「仅某形态可见」，优先依赖运行时状态而非编译期常量——例如「重启以应用更新」
菜单项只由 `isServiceWorkerWaiting()` 控制，而未注册 SW 的形态里该 signal 恒为 `false`。

两个 environment 的构建差异：

- `browser`：拷贝 `public/`；生产构建用 `GenerateSW` 生成 Service Worker
  （`cacheId: puzzle-print`）；`web-manifest-plugin` 合并产出 `manifest.json`。
- `tauri`：不拷贝 public、不生成 SW、不产出 manifest。

PWA 更新流：SW 进入 waiting → `isServiceWorkerWaiting` 置位 → AppBar 更多按钮显示角标 →
用户点「重启以应用更新」→ `messageSkipWaiting()` → `controlling` 后整页 reload。

Web App Manifest 拆成三处，各自归位，构建期合并：

- 基础配置（icons、scope、display）：`src/app/manifest/manifest.json`，属应用元信息；
- 多语言文案（name、description）：`src/locales/<lang>/manifest.ts`，属词典数据；
- 合并逻辑：`scripts/manifest/localized.ts`，以 zh-CN 为基准、其余语言生成 `*_localized`
  字段，纯构建期脚本，不进 `src/`。

## 8. 国际化

- 运行时完全由 `@solid-primitives/i18n` 承担（`flatten` + `translator`），无 i18next。
- 词典类型由 zh-CN 推导（`RawGlobalDictionary = typeof zhCN`），en 以
  `satisfies typeof zhCN` 约束，保持缺译在编译期可见。
- **机制与数据分离**：`shared/i18n` 只提供机制，接受一个 `I18nRegistry`
  （`available` 可用语言、`fallback` 兜底语言、`dictionaries` 词典映射），自身不 import
  任何具体词典；`app/App.tsx` 负责组装 registry 并注入。二者之间只剩 `import type`
  的词典类型依赖，没有运行时耦合。
- `createCurrentLocale(registry)` 按 `navigator.languages` 顺序匹配可用语言（支持前缀匹配，
  如 `zh-CN,zh` → `zh-CN`），无匹配则落 `fallback`，并监听 `languagechange`。
- 组件一律 `useGlobalTranslator()` 取 `t`，不直接引用词典模块。
- 现状：词典只含 app 级文案（name/shortName/description）与 manifest 字段，
  页面 UI 文案为硬编码中文。feature 自带 `locales/` 的下沉模式是既定方向，
  待补译功能文案时落地；届时只需扩展 `app/App.tsx` 里的 registry 组装点，
  `locales/` 的聚合规则不变——聚合是单向注册表，feature 不反向依赖聚合入口。

## 9. Tauri 侧约定

Rust 侧保持最小：不写业务逻辑，仅 `tauri-plugin-opener`。capabilities 只授予
`core:default`、`opener:default`、`core:window:allow-show`、`core:window:allow-set-title`。
新增 command 的唯一理由：浏览器能力不足（文件系统、原生打印）；届时以 `commands/` 模块组织，
并同步收紧 capabilities 到最小权限。

## 10. 导入与代码风格

- 一律使用 `@/*` 别名（指向 `src/*`）import **跨层**模块；**模块内部**（同一 feature/page
  子树，以及 `shared` 子树内部）用相对路径——重命名一个模块时应只改目录名，不改一堆别名路径。
- feature 的外部引用只走其 `index.ts` 公共入口。
- 代码风格由 rs fmt 统一（单引号，行宽 120），lint 由 Rslint 负责（含 `eslint-plugin-solid`）；
  文档由 rumdl 检查。提交前 `pnpm check`。import 顺序目前不自动整理——原 Biome
  `organizeImports` 未迁移，需要时在 `define.lint` 里启用 `import/order`。
- `pnpm check` **不含类型检查**：Rsbuild 经 Babel 只剥类型、不校验，需另跑 `npx tsc --noEmit`。

## 11. 已知偏差与改进方向

第 2-10 节描述的规则目前在代码中均被遵守。上一版清单中的 10 项偏差，1-8 已在一轮重构中
消除（模块归位、词典注入、命名与导出统一、模块内相对导入、移除页面层编译期分支），
本次迁移提交后 git 历史可查；其余保留项与新发现的存量欠账如下。
新增代码不得重新引入已消除的偏差。

| # | 偏差 | 位置 | 建议方向 |
| - | ---- | ---- | -------- |
| 1 | `ConfigActions` 接口与实现双份手写，多数 action 是单行 `setState` 转发，加一个配置项改三处 | `pages/printer/stores/config.ts` | 可接受现状；若配置持续增长，扁平化 action 或收敛为通用 setter |
| 2 | feature 词典下沉未落地，UI 文案硬编码中文 | 全局 | 待补译功能文案时按第 8 节模式执行 |
| 3 | `DragBar.tsx` 从 `@mui/material`（React 库，未安装）import，且全仓零引用 | `shared/components/bottom-sheets/` | 死代码：确认无保留意图后删除，或按 SUID 重写 |
| 4 | `ListSliderItem.tsx` 使用未导入的 `SliderOwnProps` / `Slider` / `SliderComponent`，仅被注释代码引用 | `shared/components/list/` | 启用滑块项时补齐 SUID 类型与组件导入，否则删除 |
| 5 | 偏差 3、4 使 `npx tsc --noEmit` 报 7 个错误；因类型检查不在质量门内，长期未被发现 | 全局 | 先清 3、4，再把 `tsc --noEmit` 纳入 `check` 脚本 |
| 6 | `pnpm check` 因 `src/app/index.html`（EJS 的 `<%=` 尖括号被 HTML parser 拒绝、`<html>` 缺 `lang`）与 `features/about/assets/icon.svg`（缺 `<title>`）报 4 个 Biome 错误 | `biome.json` / 上述两文件 | 在 `files.includes` 排除 HTML 模板或改分隔符；`lang` 与 `<title>` 可顺手补上 |

第 3-6 项不是分层问题，而是本轮为验证重构而运行 `tsc` 与 `biome` 时暴露的存量欠账，
均早于本次重构存在。
