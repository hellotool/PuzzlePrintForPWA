import { makeTable, makeUrl, type Notice } from '../scripts/notices/notice.ts';

export default function render(notices: Notice[]): string {
  return `# Third-Party Notices

[简体中文](./NOTICES.zh-CN.md) |
**English**

This document lists the third-party open source components used by this project and their license information.

## Runtime Dependencies

Dependencies distributed with the application.

${makeTable(
  ['Component', 'License', 'Copyrights'],
  notices.map((notice) => [makeUrl(notice.name, notice.url), notice.license, notice.copyrights.join('<br />')]),
)}
`;
}
