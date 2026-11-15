import DragIndicatorIcon from '@suid/icons-material/DragIndicator';
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
            sx={{
              position: 'absolute',
              left: toPercent(item().frame.x, props.content.width),
              top: toPercent(item().frame.y, props.content.height),
              width: toPercent(item().frame.width, props.content.width),
              height: toPercent(item().frame.height, props.content.height),
              opacity: dragging() ? 0.35 : undefined,
              cursor: props.mode === 'edit' ? 'default' : 'default',
              userSelect: 'none',
              pointerEvents: props.mode === 'preview' ? 'none' : 'auto',
              '&:hover [data-print-drag-handle], &[data-print-selected="true"] [data-print-drag-handle]': {
                opacity: 1,
              },
              '@media (pointer: coarse)': {
                '[data-print-drag-handle]': { opacity: 1 },
              },
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
            <Show when={props.mode === 'edit'}>
              <Box
                data-print-drag-handle="true"
                role="button"
                aria-label="拖动调整顺序"
                title="拖动调整顺序"
                sx={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 22,
                  height: 22,
                  borderRadius: 0.75,
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  color: 'text.secondary',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                  cursor: 'grab',
                  touchAction: 'none',
                  opacity: 0.5,
                  transition: 'opacity 120ms ease',
                  '&:active': { cursor: 'grabbing' },
                }}
              >
                <DragIndicatorIcon sx={{ fontSize: 16 }} />
              </Box>
            </Show>
          </Box>
        );
      }}
    </Index>
  );
}
