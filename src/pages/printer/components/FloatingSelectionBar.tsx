import { Box } from '@suid/material';
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import type { PrintDocument } from '@/domain/print';
import SelectionBar from './SelectionBar';

interface FloatingSelectionBarProps {
  selectedIds: string[];
  document: PrintDocument;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onRemove: () => void;
}

interface ToolbarPosition {
  top: number;
  left: number;
}

export default function FloatingSelectionBar(props: FloatingSelectionBarProps) {
  let toolbarRef: HTMLDivElement | undefined;
  let frame = 0;
  const [position, setPosition] = createSignal<ToolbarPosition | null>(null);

  function updatePosition() {
    const toolbar = toolbarRef;
    const workspace = toolbar?.parentElement;
    if (!toolbar || !workspace) return;

    const selected = new Set(props.selectedIds);
    const selectedRects = [...document.querySelectorAll<HTMLElement>('[data-print-item-id]')]
      .filter((element) => selected.has(element.dataset.printItemId ?? ''))
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);

    if (selectedRects.length === 0) {
      setPosition(null);
      return;
    }

    const workspaceRect = workspace.getBoundingClientRect();
    const toolbarRect = toolbar.getBoundingClientRect();
    const toolbarWidth = toolbarRect.width || 240;
    const toolbarHeight = toolbarRect.height || 40;
    const top = Math.min(...selectedRects.map((rect) => rect.top));
    const left = Math.min(...selectedRects.map((rect) => rect.left));
    const right = Math.max(...selectedRects.map((rect) => rect.right));

    let y = Math.max(top - toolbarHeight - 8, workspaceRect.top + 8);
    y = Math.min(y, workspaceRect.bottom - toolbarHeight - 8);
    let x = (left + right) / 2 - toolbarWidth / 2;
    x = Math.max(8, Math.min(x, window.innerWidth - toolbarWidth - 8));
    setPosition({ top: y, left: x });
  }

  function schedule() {
    cancelAnimationFrame(frame);
    if (toolbarRef) updatePosition();
    frame = requestAnimationFrame(updatePosition);
  }

  createEffect(() => {
    props.selectedIds;
    props.document;
    schedule();
  });

  onMount(() => {
    document.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    schedule();
  });

  onCleanup(() => {
    cancelAnimationFrame(frame);
    document.removeEventListener('scroll', schedule, true);
    window.removeEventListener('resize', schedule);
  });

  return (
    <Box
      ref={(element) => {
        toolbarRef = element;
        schedule();
      }}
      data-print-selection-bar="true"
      sx={{
        position: 'fixed',
        top: position()?.top ?? 0,
        left: position()?.left ?? 0,
        zIndex: 10,
        visibility: position() ? 'visible' : 'hidden',
      }}
    >
      <SelectionBar onRotateLeft={props.onRotateLeft} onRotateRight={props.onRotateRight} onRemove={props.onRemove} />
    </Box>
  );
}
