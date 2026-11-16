import { Box } from '@suid/material';
import { For } from 'solid-js';

interface GridLinesProps {
  columns: number;
  rows: number;
  occupied: number;
}

const LINE = '1px dashed rgba(0, 0, 0, 0.2)';

// 裁切网格线属于页面布局而非单个图片：由占用格数静态推导，
// 拖拽 FLIP 动画期间线条不随图片移动，也不会因 index 变化产生边框跳变或相邻格重复轮廓。
// 用 CSS border 而非 SVG：Chromium 打印管线对 SVG 描边会丢弃或按缩放倍率加粗，CSS 边框打印稳定。
export default function GridLines(props: GridLinesProps) {
  const columns = () => Math.max(1, props.columns);
  const rows = () => Math.max(1, props.rows);
  const occupied = () => Math.max(0, props.occupied);

  const verticals = () => {
    const lines: { x: number; span: number; edge: boolean }[] = [];
    for (let c = 0; c <= columns(); c += 1) {
      const occupiedRows = c === 0 ? Math.ceil(occupied() / columns()) : Math.ceil((occupied() - (c - 1)) / columns());
      const span = Math.min(Math.max(occupiedRows, 0), rows());
      if (span > 0) lines.push({ x: (c / columns()) * 100, span: (span / rows()) * 100, edge: c === columns() });
    }
    return lines;
  };

  const horizontals = () => {
    const lines: { y: number; span: number; edge: boolean }[] = [];
    for (let r = 0; r <= rows(); r += 1) {
      // 共享横线取上一行与当前行占用数的较大者（前缀占用下即上一行）
      const span = Math.min(Math.max(occupied() - Math.max(r - 1, 0) * columns(), 0), columns());
      if (span > 0) lines.push({ y: (r / rows()) * 100, span: (span / columns()) * 100, edge: r === rows() });
    }
    return lines;
  };

  return (
    <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
      <For each={verticals()}>
        {(line) => (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: line.edge ? `calc(${line.x}% - 1px)` : `${line.x}%`,
              height: `${line.span}%`,
              width: 0,
              borderLeft: LINE,
            }}
          />
        )}
      </For>
      <For each={horizontals()}>
        {(line) => (
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: line.edge ? `calc(${line.y}% - 1px)` : `${line.y}%`,
              width: `${line.span}%`,
              height: 0,
              borderTop: LINE,
            }}
          />
        )}
      </For>
    </Box>
  );
}
