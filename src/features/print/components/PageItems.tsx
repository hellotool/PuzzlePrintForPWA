import { Box } from '@suid/material';
import { Index } from 'solid-js';
import type { PrintImageAssets, PrintPage, SizeCm } from '@/domain/print';

interface PageItemsProps {
  page: PrintPage;
  content: SizeCm;
  assets: PrintImageAssets;
  mode: 'preview' | 'edit' | 'print';
  selectedIds?: string[];
  draggingIds?: string[];
}

function toPercent(value: number, total: number) {
  return total > 0 ? `${(value / total) * 100}%` : '0%';
}

export default function PageItems(props: PageItemsProps) {
  return (
    <Index each={props.page.items}>
      {(item) => {
        const asset = () => props.assets[item().imageKey];
        const selected = () => props.selectedIds?.includes(item().id) ?? false;
        const dragging = () => props.draggingIds?.includes(item().id) ?? false;
        return (
          <Box
            component="img"
            data-print-item-id={item().id}
            data-print-selected={selected() ? 'true' : undefined}
            src={asset()?.url}
            alt={asset()?.name ?? ''}
            draggable={false}
            sx={{
              position: 'absolute',
              left: toPercent(item().frame.x, props.content.width),
              top: toPercent(item().frame.y, props.content.height),
              width: toPercent(item().frame.width, props.content.width),
              height: toPercent(item().frame.height, props.content.height),
              objectFit: item().fit,
              boxSizing: 'border-box',
              transform: `rotate(${item().rotation}deg)`,
              border: '1px dashed rgba(0, 0, 0, 0.2)',
              outline: selected() ? '2px solid' : 'none',
              outlineColor: selected() ? 'primary.main' : undefined,
              outlineOffset: -2,
              opacity: dragging() ? 0.28 : undefined,
              cursor: props.mode === 'edit' ? 'grab' : 'default',
              userSelect: 'none',
              pointerEvents: props.mode === 'preview' ? 'none' : 'auto',
            }}
          />
        );
      }}
    </Index>
  );
}
