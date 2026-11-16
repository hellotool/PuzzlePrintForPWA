import { makeEventListener } from '@solid-primitives/event-listener';
import { createWindowSize } from '@solid-primitives/resize-observer';
import { debounce } from '@solid-primitives/scheduled';
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

// 对齐 AOSP LocalFloatingToolbarPopup：优先选区上方居中，空间不足翻转到下方，边缘 clamp。
const VERTICAL_MARGIN = 8;
const SCREEN_EDGE_MARGIN = 8;
// 对齐 Chromium SelectionPopupControllerImpl：滚动时隐藏，停止滚动 300ms 后再现。
const SCROLL_SHOW_DELAY_MS = 300;

export default function FloatingSelectionBar(props: FloatingSelectionBarProps) {
  const windowSize = createWindowSize();
  let toolbarRef: HTMLDivElement | undefined;
  let frame = 0;
  const [position, setPosition] = createSignal<ToolbarPosition | null>(null);
  const [hiddenByScroll, setHiddenByScroll] = createSignal(false);
  const showAfterScroll = debounce(() => {
    setHiddenByScroll(false);
    schedule();
  }, SCROLL_SHOW_DELAY_MS);

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
    const toolbarWidth = toolbarRect.width || 152;
    const toolbarHeight = toolbarRect.height || 48;
    const selectionTop = Math.min(...selectedRects.map((rect) => rect.top));
    const selectionBottom = Math.max(...selectedRects.map((rect) => rect.bottom));
    const selectionLeft = Math.min(...selectedRects.map((rect) => rect.left));
    const selectionRight = Math.max(...selectedRects.map((rect) => rect.right));

    const neededHeight = toolbarHeight + VERTICAL_MARGIN * 2;
    const spaceAbove = selectionTop - workspaceRect.top;
    const spaceBelow = workspaceRect.bottom - selectionBottom;

    let y: number;
    if (spaceAbove >= neededHeight) {
      y = selectionTop - toolbarHeight - VERTICAL_MARGIN;
    } else if (spaceBelow >= neededHeight) {
      y = selectionBottom + VERTICAL_MARGIN;
    } else if (spaceBelow >= toolbarHeight) {
      y = selectionBottom;
    } else {
      y = Math.max(workspaceRect.top, selectionTop - toolbarHeight - VERTICAL_MARGIN);
    }
    y = Math.max(workspaceRect.top, Math.min(y, workspaceRect.bottom - toolbarHeight));

    let x: number;
    if (toolbarWidth > windowSize.width - SCREEN_EDGE_MARGIN * 2) {
      x = SCREEN_EDGE_MARGIN;
    } else {
      const centerX = (selectionLeft + selectionRight) / 2;
      x = Math.max(
        SCREEN_EDGE_MARGIN,
        Math.min(centerX - toolbarWidth / 2, windowSize.width - toolbarWidth - SCREEN_EDGE_MARGIN),
      );
    }
    setPosition({ top: y, left: x });
  }

  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(updatePosition);
  }

  function handleScroll(event: Event) {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.closest('[data-print-scroll-area]')) return;
    setHiddenByScroll(true);
    showAfterScroll();
  }

  createEffect(() => {
    props.selectedIds;
    props.document;
    schedule();
  });

  createEffect(() => {
    windowSize.width;
    windowSize.height;
    schedule();
  });

  makeEventListener(document, 'scroll', handleScroll, true);

  onMount(() => {
    schedule();
  });

  onCleanup(() => {
    cancelAnimationFrame(frame);
  });

  const shown = () => position() !== null && !hiddenByScroll();

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
        opacity: shown() ? 1 : 0,
        pointerEvents: shown() ? 'auto' : 'none',
        transition: 'opacity 150ms cubic-bezier(0, 0, 0.2, 1)',
      }}
    >
      <SelectionBar onRotateLeft={props.onRotateLeft} onRotateRight={props.onRotateRight} onRemove={props.onRemove} />
    </Box>
  );
}
