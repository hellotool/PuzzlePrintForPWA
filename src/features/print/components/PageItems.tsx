import { Box } from '@suid/material';
import { Index, Show } from 'solid-js';
import type { PrintImageAssets, PrintPage, SizeCm } from '@/domain/print';

interface PageItemsProps {
  page: PrintPage;
  content: SizeCm;
  assets: PrintImageAssets;
  mode: 'preview' | 'edit' | 'print';
  selectedIds?: string[];
  draggingIds?: string[];
  numberingEnabled?: boolean;
  numberingStart?: number;
}

function toPercent(value: number, total: number) {
  return total > 0 ? `${(value / total) * 100}%` : '0%';
}

export default function PageItems(props: PageItemsProps) {
  return (
    <Index each={props.page.items}>
      {(item, index) => {
        const asset = () => props.assets[item().imageKey];
        const selected = () => props.selectedIds?.includes(item().id) ?? false;
        const dragging = () => props.draggingIds?.includes(item().id) ?? false;
        return (
          <Box
            data-print-item-id={item().id}
            data-print-selected={selected() ? 'true' : undefined}
            draggable={props.mode === 'edit' ? true : undefined}
            sx={{
              position: 'absolute',
              left: toPercent(item().frame.x, props.content.width),
              top: toPercent(item().frame.y, props.content.height),
              width: toPercent(item().frame.width, props.content.width),
              height: toPercent(item().frame.height, props.content.height),
              opacity: dragging() ? 0.28 : undefined,
              cursor: props.mode === 'edit' ? 'grab' : 'default',
              userSelect: 'none',
              pointerEvents: props.mode === 'preview' ? 'none' : 'auto',
            }}
          >
            <Box
              component="img"
              src={asset()?.url}
              alt={asset()?.name ?? ''}
              draggable={false}
              sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: item().fit,
                boxSizing: 'border-box',
                transform: `rotate(${item().rotation}deg)`,
                border: '1px dashed rgba(0, 0, 0, 0.2)',
                outline: selected() ? '2px solid' : 'none',
                outlineColor: selected() ? 'primary.main' : undefined,
                outlineOffset: -2,
                pointerEvents: 'none',
              }}
            />
            <Show when={props.numberingEnabled}>
              <Box
                sx={{
                  position: 'absolute',
                  left: 4,
                  bottom: 4,
                  zIndex: 1,
                  px: 0.5,
                  py: 0.1,
                  borderRadius: 0.5,
                  bgcolor: 'rgba(255, 255, 255, 0.82)',
                  color: '#111',
                  fontSize: 11,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  pointerEvents: 'none',
                }}
              >
                {(props.numberingStart ?? 0) + index + 1}
              </Box>
            </Show>
          </Box>
        );
      }}
    </Index>
  );
}
