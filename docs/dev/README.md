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

| 类型         | 命令                       |
| ------------ | -------------------------- |
| Web (PWA) 版 | `pnpm run build:browser`   |
| Tauri 版     | `pnpm run build:tauri`     |

## ✅ 代码与文档质量

- 检查：`pnpm check`（代码用 Rslint + rs fmt，文档用 rumdl）
- 格式化：`pnpm format`

## 📄 文档生成

- 第三方声明：`pnpm docs:generateNotices`，模板在 `templates/NOTICES.md.ts` 与 `templates/NOTICES.zh-CN.md.ts`，补充条目在 `scripts/notices/notices.json`。请勿直接编辑生成的 `NOTICES.md` 与 `NOTICES.zh-CN.md`。
