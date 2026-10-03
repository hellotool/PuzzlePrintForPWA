export interface Notice {
  name: string;
  license: string;
  url: string;
  copyrights: string[];
}

export function makeUrl(text: string, url: string) {
  return `[${text}](${url})`;
}

export function makeTable(headers: string[], rows: string[][]) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${Array.from({ length: headers.length }, () => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}
