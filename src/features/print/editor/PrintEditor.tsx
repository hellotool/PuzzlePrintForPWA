import { Box, Typography } from '@suid/material';
import { Index, onCleanup, Show, createSignal } from 'solid-js';
import {
  getGridFrame,
  moveItemsToIndex,
  movePage,
  removeItemsFromDocument,
  removePage,
  type PrintDocument,
  type PrintImageAssets,
} from '@/domain/print';
import PaperSurface from '../components/PaperSurface';
import PrintPlaceholderCell from '../components/PrintPlaceholderCell';
import EditorPage from './EditorPage';

interface PrintEditorProps {
  document: PrintDocument;
  assets: PrintImageAssets;
  colorMode: 'colorful' | 'gray';
  numberingEnabled: boolean;
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

interface DragGhost {
  left: number;
  top: number;
  width: number;
  height: number;
  rotation: number;
  url: string;
  count: number;
}

const runningAnimations = new WeakMap<HTMLElement, Animation>();

function captureItemRects() {
  const rects = new Map<string, DOMRect>();
  document.querySelectorAll<HTMLElement>('[data-print-item-id]').forEach((element) => {
    const id = element.dataset.printItemId;
    if (id) rects.set(id, element.getBoundingClientRect());
  });
  return rects;
}

function animateItemRects(previous: Map<string, DOMRect>) {
  if (typeof document === 'undefined') return;
  document.querySelectorAll<HTMLElement>('[data-print-item-id]').forEach((element) => {
    const id = element.dataset.printItemId;
    const before = id ? previous.get(id) : undefined;
    if (!before || typeof element.animate !== 'function') return;
    const after = element.getBoundingClientRect();
    const deltaX = before.left - after.left;
    const deltaY = before.top - after.top;
    if (deltaX === 0 && deltaY === 0) return;
    runningAnimations.get(element)?.cancel();
    const animation = element.animate([{ translate: `${deltaX}px ${deltaY}px` }, { translate: '0px 0px' }], {
      duration: 180,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
    });
    runningAnimations.set(element, animation);
    animation.addEventListener('finish', () => {
      if (runningAnimations.get(element) === animation) {
        runningAnimations.delete(element);
      }
    });
  });
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
  let scrollerRef: HTMLDivElement | undefined;
  let dragState: DragState | null = null;
  let scrollFrame = 0;
  let flipFrame = 0;
  const [previewDocument, setPreviewDocument] = createSignal<PrintDocument | null>(null);
  const [draggingIds, setDraggingIds] = createSignal<string[]>([]);
  const [dragGhost, setDragGhost] = createSignal<DragGhost | null>(null);

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
    const previous = captureItemRects();
    setPreviewDocument(moveItemsToIndex(props.document, itemIds, toIndex));
    if (flipFrame !== 0) cancelAnimationFrame(flipFrame);
    flipFrame = requestAnimationFrame(() => {
      flipFrame = 0;
      animateItemRects(previous);
    });
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

  function updateGhost(clientX: number, clientY: number) {
    const state = dragState;
    if (!state) return;
    const current = dragGhost();
    if (!current) return;
    setDragGhost({
      ...current,
      left: clientX - state.width / 2,
      top: clientY - state.height / 2,
    });
  }

  function applyPreview(index: number) {
    const state = dragState;
    if (!state || index === state.insertIndex) return;
    state.insertIndex = index;
    reorderItemsToIndex(state.itemIds, index);
  }

  function handleDragStart(itemId: string, clientX: number, clientY: number) {
    const flattened = props.document.pages.flatMap((page) => page.items);
    const item = flattened.find((value) => value.id === itemId);
    if (!item) return;
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

    const initialIndex = resolveInsertIndex(clientX, clientY);
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
    setDragGhost({
      left: clientX - width / 2,
      top: clientY - height / 2,
      width,
      height,
      rotation: item.rotation,
      url: props.assets[item.imageKey]?.url ?? '',
      count: itemIds.length,
    });
    props.onBeginTransaction();
    props.onDragStateChange?.(true);
    startAutoScroll();
  }

  function handleDragMove(clientX: number, clientY: number) {
    if (!dragState) return;
    dragState.lastClientX = clientX;
    dragState.lastClientY = clientY;
    updateGhost(clientX, clientY);
    const index = resolveInsertIndex(clientX, clientY);
    if (index !== null) applyPreview(index);
  }

  function handleDragEnd(clientX: number, clientY: number) {
    if (dragState) {
      dragState.lastClientX = clientX;
      dragState.lastClientY = clientY;
    }
    finishDrag(true);
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
    stopAutoScroll();
    if (flipFrame !== 0) {
      cancelAnimationFrame(flipFrame);
      flipFrame = 0;
    }
    setPreviewDocument(null);
    setDraggingIds([]);
    setDragGhost(null);
    props.onDragStateChange?.(false);
  }

  function startAutoScroll() {
    if (scrollFrame !== 0) return;
    const tick = () => {
      scrollFrame = 0;
      const state = dragState;
      const scroller = scrollerRef;
      if (!state) return;
      if (!scroller) {
        scrollFrame = requestAnimationFrame(tick);
        return;
      }
      const rect = scroller.getBoundingClientRect();
      const threshold = 56;
      const maxSpeed = 22;
      let delta = 0;
      if (state.lastClientY < rect.top + threshold) {
        delta = -Math.ceil(((rect.top + threshold - state.lastClientY) / threshold) * maxSpeed);
      } else if (state.lastClientY > rect.bottom - threshold) {
        delta = Math.ceil(((state.lastClientY - (rect.bottom - threshold)) / threshold) * maxSpeed);
      }
      if (delta !== 0) {
        const before = scroller.scrollTop;
        scroller.scrollTop = before + delta;
        if (scroller.scrollTop !== before) {
          const index = resolveInsertIndex(state.lastClientX, state.lastClientY);
          if (index !== null) applyPreview(index);
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

  onCleanup(() => {
    stopAutoScroll();
    if (flipFrame !== 0) {
      cancelAnimationFrame(flipFrame);
      flipFrame = 0;
    }
    if (dragState) {
      dragState = null;
      props.onCancelTransaction();
      props.onDragStateChange?.(false);
    }
  });

  function deleteSelected() {
    if (props.selectedIds.length === 0) return;
    props.onBeginTransaction();
    props.onUpdateDocument(removeItemsFromDocument(props.document, props.selectedIds));
    props.onCommitTransaction();
    props.onSelectionChange([]);
  }

  function movePageBy(index: number, delta: number) {
    props.onBeginTransaction();
    props.onUpdateDocument(movePage(props.document, index, index + delta));
    props.onCommitTransaction();
  }

  function deletePage(index: number) {
    const page = props.document.pages[index];
    if (!page) return;
    props.onBeginTransaction();
    props.onUpdateDocument(removePage(props.document, page.id));
    props.onCommitTransaction();
    props.onSelectionChange([]);
  }

  return (
    <Box
      ref={(element) => {
        scrollerRef = element;
      }}
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
            numberingEnabled={props.numberingEnabled}
            numberingStart={numberingStartAt(index)}
            assets={props.assets}
            colorMode={props.colorMode}
            selectedIds={props.selectedIds}
            onSelectionChange={props.onSelectionChange}
            draggingIds={draggingIds()}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
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
        <Box sx={{ width: '100%', maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <PaperSurface
            paper={props.document.paper}
            contentRect={props.document.contentRect}
            mode="edit"
            colorMode={props.colorMode}
          >
            <PrintPlaceholderCell
              frame={getGridFrame(
                props.document.contentRect,
                props.document.layout.columns,
                props.document.layout.rows,
                0,
              )}
              content={props.document.contentRect}
              onAddImages={props.onAddImages}
            />
          </PaperSurface>
          <Typography align="center" variant="caption" color="text.secondary">
            第 {activeDocument().pages.length + 1} 页
          </Typography>
        </Box>
      </Show>
      <Show when={dragGhost()}>
        {(ghost) => (
          <Box
            data-print-drag-ghost="true"
            sx={{
              position: 'fixed',
              left: ghost().left,
              top: ghost().top,
              width: ghost().width,
              height: ghost().height,
              transform: `rotate(${ghost().rotation}deg)`,
              pointerEvents: 'none',
              zIndex: 1300,
            }}
          >
            <Box
              component="img"
              src={ghost().url}
              alt=""
              draggable={false}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                opacity: 0.9,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
              }}
            />
            <Show when={ghost().count > 1}>
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  minWidth: 20,
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 10,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontSize: 12,
                  fontWeight: 600,
                  lineHeight: 1.5,
                  textAlign: 'center',
                }}
              >
                {ghost().count}
              </Box>
            </Show>
          </Box>
        )}
      </Show>
    </Box>
  );
}
