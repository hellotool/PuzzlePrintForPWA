# 开发指南

## 技术栈

- 开发语言：[TypeScript](https://www.typescriptlang.org/)
- UI 框架：[Solid](https://www.solidjs.com/)
- UI 组件库：[Suid](https://suid.dev/)
- 构建工具：[Rsbuild](https://rsbuild.rs/)
- 桌面壳：[Tauri](https://tauri.app/) 2

## 🛠️ 开发准备

### 环境配置

- Node.js 26 及以上
- pnpm 12.6.0（由 `packageManager` 字段声明，Corepack 会自动使用）

## 📦 构建应用

| 类型              | 命令                     |
| ----------------- | ------------------------ |
| Web 版（PWA 暂停） | `pnpm run build:browser` |
| Tauri 版          | `pnpm run build:tauri`   |

> [!NOTE]
> PWA 目前由 `rstack.config.ts` 的 `ENABLE_PWA = false` 临时关闭，构建不会生成
> Service Worker 与 manifest。恢复时把该常量改为 `true`，并取消 `src/app/index.html`
> 中 manifest 链接的注释。

## 🚀 部署

- GitHub Pages 由 `.github/workflows/github-pages.yml` 部署到 `main` 分支。
- 工作流使用 `actions/configure-pages` 的 `base_path` 构建，避免仓库改名后资源路径错误。
- 修改 PWA 开关、manifest 或 `base` 相关配置后，先在本地按目标基路径构建并检查产物。

## ✅ 代码与文档质量

- 检查：`pnpm check`（代码用 Rslint + rs fmt，文档用 rumdl，TOML 用 tombi）
- 格式化：`pnpm format`

## 📄 文档生成

- 第三方声明：`pnpm docs:generateNotices`，模板在 `templates/NOTICES.md.ts` 与 `templates/NOTICES.zh-CN.md.ts`，补充条目在 `scripts/notices/notices.json`。请勿直接编辑生成的 `NOTICES.md` 与 `NOTICES.zh-CN.md`。
