import AddIcon from '@suid/icons-material/Add';
import { createEventListener } from '@solid-primitives/event-listener';
import { alpha, Box, useTheme } from '@suid/material';
import { Index, onCleanup, Show, createSignal } from 'solid-js';
import {
  moveItemsToIndex,
  movePage,
  removeItemsFromDocument,
  removePage,
  type PrintDocument,
  type PrintImageAssets,
} from '@/domain/print';
import EditorPage from './EditorPage';
import { cancelFlip, withFlip } from '../utils/flip';

interface PrintEditorProps {
  document: PrintDocument;
  assets: PrintImageAssets;
  colorMode: 'colorful' | 'gray';
  imageNumberingEnabled: boolean;
  pageNumberingEnabled: boolean;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onUpdateDocument: (document: PrintDocument) => void;
  onBeginTransaction: () => void;
  onCommitTransaction: () => void;
  onCancelTransaction: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddImages: () => void;
  onDragStateChange?: (dragging: boolean) => void;
}

export interface DragStartInfo {
  itemIds: string[];
  url: string;
  name: string;
  type?: string;
  rotation: number;
  width: number;
  height: number;
}

interface DragState {
  itemId: string;
  itemIds: string[];
  rotation: number;
  width: number;
  height: number;
  lastClientX: number;
  lastClientY: number;
  insertIndex: number;
}

interface MarqueeGesture {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  moved: boolean;
  baseIds: string[];
}

interface MarqueeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function sameItemOrder(a: PrintDocument, b: PrintDocument) {
  const aItems = a.pages.flatMap((page) => page.items);
  const bItems = b.pages.flatMap((page) => page.items);
  return aItems.length === bItems.length && aItems.every((item, index) => item.id === bItems[index].id);
}

export default function PrintEditor(props: PrintEditorProps) {
  const theme = useTheme();
  let scrollerRef: HTMLDivElement | undefined;
  let dragState: DragState | null = null;
  let dragDropped = false;
  let marqueeGesture: MarqueeGesture | null = null;
  let autoScrollPoint: { x: number; y: number } | null = null;
  let lastScrollTop = 0;
  let lastScrollLeft = 0;
  let scrollFrame = 0;
  const [previewDocument, setPreviewDocument] = createSignal<PrintDocument | null>(null);
  const [draggingIds, setDraggingIds] = createSignal<string[]>([]);
  const [marquee, setMarquee] = createSignal<MarqueeRect | null>(null);

  const activeDocument = () => previewDocument() ?? props.document;
  const capacity = () => Math.max(1, props.document.layout.columns * props.document.layout.rows);
  const lastPageFull = () => {
    const pages = activeDocument().pages;
    return pages.length > 0 && pages[pages.length - 1].items.length >= capacity();
  };

  function numberingStartAt(pageIndex: number) {
    return activeDocument()
      .pages.slice(0, pageIndex)
      .reduce((total, page) => total + page.items.length, 0);
  }

  function reorderItemsToIndex(itemIds: string[], toIndex: number) {
    withFlip(() => setPreviewDocument(moveItemsToIndex(props.document, itemIds, toIndex)));
  }

  function updateWithFlip(next: PrintDocument) {
    withFlip(() => props.onUpdateDocument(next));
  }

  function totalItemCount() {
    return activeDocument().pages.reduce((total, page) => total + page.items.length, 0);
  }

  function resolveInsertIndex(clientX: number, clientY: number): number | null {
    if (typeof document === 'undefined') return null;
    const current = activeDocument();
    const total = totalItemCount();
    if (total === 0) return null;
    const elements = [...document.querySelectorAll<HTMLElement>('[data-print-content][data-print-page-id]')];
    const elementsById = new Map(elements.map((element) => [element.dataset.printPageId, element]));
    const capacity = Math.max(1, props.document.layout.columns * props.document.layout.rows);
    const columns = Math.max(1, props.document.layout.columns);
    const rows = Math.max(1, props.document.layout.rows);

    for (let pageIndex = 0; pageIndex < current.pages.length; pageIndex += 1) {
      const page = current.pages[pageIndex];
      const element = elementsById.get(page.id);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom &&
          rect.width > 0 &&
          rect.height > 0
        ) {
          const column = clamp(Math.floor(((clientX - rect.left) / rect.width) * columns), 0, columns - 1);
          const row = clamp(Math.floor(((clientY - rect.top) / rect.height) * rows), 0, rows - 1);
          const cellIndex = row * columns + column;
          return clamp(pageIndex * capacity + cellIndex, 0, total - 1);
        }
      }
    }
    return null;
  }

  function applyPreview(index: number) {
    const state = dragState;
    if (!state || index === state.insertIndex) return;
    state.insertIndex = index;
    reorderItemsToIndex(state.itemIds, index);
  }

  function handleDragStart(itemId: string, clientX: number, clientY: number): DragStartInfo | undefined {
    const flattened = props.document.pages.flatMap((page) => page.items);
    const item = flattened.find((value) => value.id === itemId);
    if (!item) return undefined;
    const existingIds = new Set(flattened.map((value) => value.id));
    const selected = props.selectedIds.filter((id) => existingIds.has(id));
    const itemIds = selected.includes(itemId) && selected.length > 1 ? selected : [itemId];
    const page = props.document.pages.find((value) => value.items.some((entry) => entry.id === itemId));
    const contentElement =
      page && typeof document !== 'undefined'
        ? document.querySelector<HTMLElement>(`[data-print-content][data-print-page-id="${page.id}"]`)
        : null;
    const contentRect = contentElement?.getBoundingClientRect();
    const sourceRect =
      typeof document !== 'undefined'
        ? document.querySelector<HTMLElement>(`[data-print-item-id="${itemId}"]`)?.getBoundingClientRect()
        : undefined;
    const width =
      contentRect && props.document.contentRect.width > 0
        ? (item.frame.width / props.document.contentRect.width) * contentRect.width
        : (sourceRect?.width ?? 96);
    const height =
      contentRect && props.document.contentRect.height > 0
        ? (item.frame.height / props.document.contentRect.height) * contentRect.height
        : (sourceRect?.height ?? 96);
    const asset = props.assets[item.imageKey];

    const initialIndex = resolveInsertIndex(clientX, clientY);
    dragDropped = false;
    dragState = {
      itemId,
      itemIds,
      rotation: item.rotation,
      width,
      height,
      lastClientX: clientX,
      lastClientY: clientY,
      insertIndex: initialIndex ?? -1,
    };
    setDraggingIds(itemIds);
    props.onBeginTransaction();
    props.onDragStateChange?.(true);
    startAutoScroll();
    return {
      itemIds,
      url: asset?.url ?? '',
      name: asset?.name ?? '',
      type: asset?.type,
      rotation: item.rotation,
      width,
      height,
    };
  }

  function handleDragMove(clientX: number, clientY: number) {
    if (!dragState) return;
    dragState.lastClientX = clientX;
    dragState.lastClientY = clientY;
    autoScrollPoint = { x: clientX, y: clientY };
    const index = resolveInsertIndex(clientX, clientY);
    if (index !== null) applyPreview(index);
  }

  function handleDragDrop() {
    dragDropped = true;
  }

  function handleDragEnd(clientX: number, clientY: number) {
    if (dragState) {
      dragState.lastClientX = clientX;
      dragState.lastClientY = clientY;
    }
    finishDrag(dragDropped);
  }

  function finishDrag(commit: boolean) {
    const state = dragState;
    if (!state) return;
    if (commit) {
      const index = resolveInsertIndex(state.lastClientX, state.lastClientY);
      if (index !== null) applyPreview(index);
      const next = previewDocument();
      if (next && !sameItemOrder(next, props.document)) {
        props.onUpdateDocument(next);
        props.onCommitTransaction();
      } else {
        props.onCancelTransaction();
      }
    } else {
      props.onCancelTransaction();
    }
    dragState = null;
    autoScrollPoint = null;
    stopAutoScroll();
    cancelFlip();
    setPreviewDocument(null);
    setDraggingIds([]);
    props.onDragStateChange?.(false);
  }

  function startAutoScroll() {
    if (scrollFrame !== 0) return;
    const tick = () => {
      scrollFrame = 0;
      const point = autoScrollPoint;
      const scroller = scrollerRef;
      if (!point) return;
      if (!scroller) {
        scrollFrame = requestAnimationFrame(tick);
        return;
      }
      const rect = scroller.getBoundingClientRect();
      const threshold = 56;
      const maxSpeed = 22;
      let delta = 0;
      if (point.y < rect.top + threshold) {
        delta = -Math.ceil(((rect.top + threshold - point.y) / threshold) * maxSpeed);
      } else if (point.y > rect.bottom - threshold) {
        delta = Math.ceil(((point.y - (rect.bottom - threshold)) / threshold) * maxSpeed);
      }
      if (delta !== 0) {
        const before = scroller.scrollTop;
        scroller.scrollTop = before + delta;
        if (scroller.scrollTop !== before) {
          if (dragState) {
            const index = resolveInsertIndex(point.x, point.y);
            if (index !== null) applyPreview(index);
          }
        }
      }
      scrollFrame = requestAnimationFrame(tick);
    };
    scrollFrame = requestAnimationFrame(tick);
  }

  function stopAutoScroll() {
    if (scrollFrame !== 0) {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
    }
  }

  function updateMarquee(clientX: number, clientY: number) {
    const gesture = marqueeGesture;
    if (!gesture) return;
    // 矩形用客户端坐标 + fixed 渲染：绝对定位子元素会撑大滚动区的可溢出范围。
    setMarquee({
      x: Math.min(gesture.startX, clientX),
      y: Math.min(gesture.startY, clientY),
      width: Math.abs(clientX - gesture.startX),
      height: Math.abs(clientY - gesture.startY),
    });
    const left = Math.min(gesture.startX, clientX);
    const top = Math.min(gesture.startY, clientY);
    const right = Math.max(gesture.startX, clientX);
    const bottom = Math.max(gesture.startY, clientY);
    const hits = [...document.querySelectorAll<HTMLElement>('[data-print-item-id]')]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          rect.left < right &&
          rect.right > left &&
          rect.top < bottom &&
          rect.bottom > top
        );
      })
      .map((element) => element.dataset.printItemId as string);
    props.onSelectionChange([...new Set([...gesture.baseIds, ...hits])]);
  }

  function handleScrollerScroll() {
    const gesture = marqueeGesture;
    const scroller = scrollerRef;
    if (!gesture || !scroller) return;
    const dy = scroller.scrollTop - lastScrollTop;
    const dx = scroller.scrollLeft - lastScrollLeft;
    lastScrollTop = scroller.scrollTop;
    lastScrollLeft = scroller.scrollLeft;
    if (dx === 0 && dy === 0) return;
    // 起点锚定内容：滚动时随内容平移，矩形保持覆盖同一批内容区域。
    gesture.startX -= dx;
    gesture.startY -= dy;
    if (gesture.moved) updateMarquee(gesture.lastX, gesture.lastY);
  }

  createEventListener(() => scrollerRef, 'scroll', handleScrollerScroll);

  function cleanupMarquee() {
    const gesture = marqueeGesture;
    marqueeGesture = null;
    setMarquee(null);
    autoScrollPoint = null;
    stopAutoScroll();
    if (gesture && scrollerRef?.hasPointerCapture(gesture.pointerId)) {
      scrollerRef.releasePointerCapture(gesture.pointerId);
    }
  }

  function handleScrollerPointerDown(event: PointerEvent) {
    // 框选在滚动区层级发起：可跨页、可越过纸张边界，overlay 不被单张纸裁切。
    if (event.pointerType !== 'mouse') return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('[data-print-item-id], button, [role="button"], a, input, [data-print-selection-bar]')) return;
    if (!scrollerRef) return;
    if (marqueeGesture) cleanupMarquee();
    event.preventDefault();
    const additive = event.shiftKey || event.ctrlKey || event.metaKey;
    marqueeGesture = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
      baseIds: additive ? props.selectedIds : [],
    };
    lastScrollTop = scrollerRef.scrollTop;
    lastScrollLeft = scrollerRef.scrollLeft;
    if (!additive) props.onSelectionChange([]);
    try {
      scrollerRef.setPointerCapture(event.pointerId);
    } catch {
      // Some WebViews reject capture for already-released pointers.
    }
    updateMarquee(event.clientX, event.clientY);
  }

  function handleScrollerPointerMove(event: PointerEvent) {
    const gesture = marqueeGesture;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    gesture.lastX = event.clientX;
    gesture.lastY = event.clientY;
    // 未移动不启动自动滚动：否则起点=终点的单击落在边缘时会被滚动的位移撑出巨大矩形
    if (!gesture.moved) {
      if (Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) < 3) return;
      gesture.moved = true;
      startAutoScroll();
    }
    autoScrollPoint = { x: event.clientX, y: event.clientY };
    updateMarquee(event.clientX, event.clientY);
  }

  function handleScrollerPointerUp(event: PointerEvent) {
    if (!marqueeGesture || event.pointerId !== marqueeGesture.pointerId) return;
    cleanupMarquee();
  }

  function handleScrollerLostPointerCapture(event: PointerEvent) {
    if (!marqueeGesture || event.pointerId !== marqueeGesture.pointerId) return;
    cleanupMarquee();
  }

  onCleanup(() => {
    cleanupMarquee();
    stopAutoScroll();
    cancelFlip();
    if (dragState) {
      dragState = null;
      props.onCancelTransaction();
      props.onDragStateChange?.(false);
    }
  });

  function deleteSelected() {
    if (props.selectedIds.length === 0) return;
    props.onBeginTransaction();
    updateWithFlip(removeItemsFromDocument(props.document, props.selectedIds));
    props.onCommitTransaction();
    props.onSelectionChange([]);
  }

  function movePageBy(index: number, delta: number) {
    props.onBeginTransaction();
    updateWithFlip(movePage(props.document, index, index + delta));
    props.onCommitTransaction();
  }

  function deletePage(index: number) {
    const page = props.document.pages[index];
    if (!page) return;
    props.onBeginTransaction();
    updateWithFlip(removePage(props.document, page.id));
    props.onCommitTransaction();
    props.onSelectionChange([]);
  }

  return (
    <Box
      ref={(element) => {
        scrollerRef = element;
      }}
      data-print-scroll-area="true"
      onPointerDown={handleScrollerPointerDown}
      onPointerMove={handleScrollerPointerMove}
      onPointerUp={handleScrollerPointerUp}
      onPointerCancel={handleScrollerPointerUp}
      onLostPointerCapture={handleScrollerLostPointerCapture}
      sx={{
        height: '100%',
        minHeight: 0,
        overflow: 'auto',
        p: { xs: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
      }}
    >
      <Index each={activeDocument().pages}>
        {(page, index) => (
          <EditorPage
            document={activeDocument()}
            page={page()}
            pageNumber={index + 1}
            pageCount={activeDocument().pages.length}
            imageNumberingEnabled={props.imageNumberingEnabled}
            pageNumberingEnabled={props.pageNumberingEnabled}
            numberingStart={numberingStartAt(index)}
            assets={props.assets}
            colorMode={props.colorMode}
            selectedIds={props.selectedIds}
            onSelectionChange={props.onSelectionChange}
            draggingIds={draggingIds()}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onDragDrop={handleDragDrop}
            onDragCancel={() => finishDrag(false)}
            onDeleteSelected={deleteSelected}
            canMoveUp={index > 0}
            canMoveDown={index < activeDocument().pages.length - 1}
            onMovePageUp={() => movePageBy(index, -1)}
            onMovePageDown={() => movePageBy(index, 1)}
            onDeletePage={() => deletePage(index)}
            onUndo={props.onUndo}
            onRedo={props.onRedo}
            showAddPlaceholder={index === activeDocument().pages.length - 1 && !lastPageFull()}
            onAddImages={props.onAddImages}
          />
        )}
      </Index>
      <Show when={lastPageFull()}>
        <Box
          data-print-add-placeholder="true"
          role="button"
          tabIndex={0}
          aria-label="添加图片"
          onClick={props.onAddImages}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              props.onAddImages();
            }
          }}
          sx={{
            width: '100%',
            maxWidth: 760,
            aspectRatio: `${props.document.paper.width} / ${props.document.paper.height}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed',
            borderColor: 'divider',
            color: 'text.secondary',
            cursor: 'pointer',
            bgcolor: 'transparent',
            transition: 'background-color 150ms ease',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <AddIcon />
        </Box>
      </Show>
      <Show when={marquee()}>
        {(rect) => (
          <Box
            data-print-marquee="true"
            sx={{
              position: 'fixed',
              left: rect().x,
              top: rect().y,
              width: rect().width,
              height: rect().height,
              border: '1px solid',
              borderColor: 'primary.main',
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              pointerEvents: 'none',
              zIndex: 5,
            }}
          />
        )}
      </Show>
    </Box>
  );
}
