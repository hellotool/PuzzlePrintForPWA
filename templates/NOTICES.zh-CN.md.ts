import { makeTable, makeUrl, type Notice } from '../scripts/notices/notice.ts';

export default function render(notices: Notice[]): string {
  return `# 第三方声明

**简体中文** |
[English](./NOTICES.md)

本文档列出了本项目使用的第三方开源组件及其许可证信息。

## 运行时依赖

随应用分发的依赖。

${makeTable(
  ['开源项目', '许可证', '版权声明'],
  notices.map((notice) => [makeUrl(notice.name, notice.url), notice.license, notice.copyrights.join('<br />')]),
)}
`;
}
