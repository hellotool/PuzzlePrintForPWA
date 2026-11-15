<div align="center">

<img src="./assets/images/icon.svg" width="192" height="192" alt="应用图标">

# 哈兔拼图打印

**仓库**：
[![Gitee 主仓库](https://img.shields.io/badge/Gitee-主仓库-C71D23?logo=gitee)][repository-gitee]
[![GitHub 副仓库](https://img.shields.io/badge/GitHub-副仓库-0969da?logo=github)][repository-github]

**平台**：
[![Windows 10+](https://img.shields.io/badge/Windows_10+-0078D4?logo=windows)][release-gitee]
[![ChromeOS](https://img.shields.io/badge/ChromeOS-4285F4?logo=googlechrome&logoColor=f5f5f5)][web-app]
[![Web](https://img.shields.io/badge/Web-5A0FC8?logo=googlechrome&logoColor=f5f5f5)][web-app]

**语言**：
**中文** |
<small>期待您的翻译！</small>

_该应用程序目前仅支持中文_。

</div>

在同一张纸上打印多张图片。

![哈兔工具 - 实验性项目](https://img.shields.io/badge/哈兔工具-实验性项目-2196f3)
[![Apache 2.0 许可证](https://img.shields.io/github/license/hellotool/PuzzlePrintForPWA?label=许可证)](./LICENSE)

![GitHub - Stars](https://img.shields.io/github/stars/hellotool/PuzzlePrintForPWA?style=flat&logo=github)
[![Gitee - Stars](https://gitee.com/hellotool/PuzzlePrintForPWA/badge/star.svg?theme=dark)][stargazers-gitee]

## 特性

- 批量添加图片：文件选择、拖入窗口、`Ctrl+V` 粘贴
- 网格布局与裁切参考线
- 原生拖拽排序，支持多选整组移动，可把图片拖出窗口保存
- 导出 PDF
- 可选页码与图片序号
- 支持在线使用

> [!NOTE]
> PWA 安装与离线缓存目前临时关闭，在线版不受影响。恢复后会更新此处说明。

## 软件截图

TODO

## 下载与安装

您可以直接使用 Web 版：

- [进入 Web 版][web-app]

PWA 安装与离线缓存目前临时关闭。恢复后，支持 PWA 的浏览器可以重新将该应用安装到桌面。

您也可以下载本地版。

- [Gitee 发行版][release-gitee]
- [GitHub 发行版][release-github]

> [!NOTE]
> 本应用的前身是“快照凭证打印助手”，现已更名为“哈兔拼图打印”。
> 由于应用的标识（identifier）已经改变，新版不会覆盖旧版，也不会自动升级旧版。
> 如果您已经安装过旧版，可以放心在“设置 > 应用”中将其卸载，再安装新版；两者互不影响。
> 如果您此前把旧版作为 PWA 安装到了桌面，请在浏览器中卸载旧站点；当前 PWA 安装暂时关闭，恢复后可重新添加。

## 使用方法

1. 添加图片：选择文件、把图片文件拖入窗口，或在页面按 `Ctrl+V` 粘贴截图。
2. 在选项面板调整版面、纸张、方向与页边距；需要凭证序号时开启 **页码与序号**。
3. 拖动图片调整打印顺序；按住 `Shift`/`Ctrl` 可多选，拖动任意一张会整组移动。
4. 点击 **打印**；点击旁边的箭头可导出 PDF。
5. 在打印对话框中调整参数并打印。

## 兼容性

### Web 版兼容性

本应用需要在支持打印功能的浏览器中打开，建议使用 Chrome v88 或者 Edge v88 更高版本浏览器打开本应用，**不支持在微信、QQ 中使用**。

具体兼容性如下表：

| 操作系统 | 应用（浏览器）                                                                                                                    | 特性 | 详情                                       | 解决方案           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------------------ | ------------------ |
| Android  | 微信、QQ、飞书、360 极速浏览器、夸克、X 浏览器、UC 浏览器、QQ 浏览器、小米浏览器、百度浏览器、百度、搜狗浏览器极速版、OPPO 浏览器 | 打印 | **无法使用打印功能**                       | 更换其他浏览器     |
| Android  | FireFox、Iceraven 等 FireFox 的分支                                                                                               | 打印 | 始终带有页头与页脚，页面方向、布局尺寸错误 | 更换其他浏览器     |
| Android  | Chrome、Edge、Chromium、Cromite、华为浏览器、花瓣浏览器等 Chromium 的分支、荣耀浏览器、Via                                        | 打印 | 页面方向、纸张尺寸错误                     | 打印时手动选择参数 |
| Windows  | FireFox                                                                                                                           | 打印 | 纸张尺寸错误                               | 打印时手动选择参数 |

### Tauri 版兼容性

| 操作系统 | 特性     | 详情                                | 解决方案            |
| -------- | -------- | ----------------------------------- | ------------------- |
| Windows  | 应用启动 | 需要 WebView2 v88.0.0.0 或 更高版本 | 安装或更新 WebView2 |

## 开发与贡献

请参阅[《开发指南》](./docs/dev/README.md)与[《贡献指南》](./CONTRIBUTING.md)。

## 许可证

本项目以 Apache 2.0 许可证授权，详情请参阅 [许可证文件](./LICENSE)。

## 第三方声明

本项目使用了第三方开源代码，您可以在 [声明文件](./NOTICES.zh-CN.md) 中查看详细信息。

Chromebook、ChromeOS 和 ChromeOS 徽标是 Google LLC 的商标。

---

<div align="center">
版权所有 © 2025-2026 杰西 205
</div>

[repository-gitee]: https://gitee.com/hellotool/PuzzlePrintForPWA
[repository-github]: https://github.com/hellotool/PuzzlePrintForPWA
[release-gitee]: https://gitee.com/hellotool/PuzzlePrintForPWA/releases
[release-github]: https://github.com/hellotool/PuzzlePrintForPWA/releases
[web-app]: https://hellotool.github.io/PuzzlePrintForPWA/
[stargazers-gitee]: https://gitee.com/hellotool/PuzzlePrintForPWA/stargazers
