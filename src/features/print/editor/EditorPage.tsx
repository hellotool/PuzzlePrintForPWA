import DeleteOutlineIcon from '@suid/icons-material/DeleteOutline';
import KeyboardArrowDownIcon from '@suid/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@suid/icons-material/KeyboardArrowUp';
import { alpha, Box, IconButton, Typography } from '@suid/material';
import { createSignal, onCleanup, Show } from 'solid-js';
import { getGridFrame, type PrintDocument, type PrintImageAssets, type PrintPage, type RectCm } from '@/domain/print';
import PageItems from '../components/PageItems';
import PaperSurface from '../components/PaperSurface';
import PrintPlaceholderCell from '../components/PrintPlaceholderCell';

interface EditorPageProps {
  document: PrintDocument;
  page: PrintPage;
  pageNumber: number;
  assets: PrintImageAssets;
  colorMode: 'colorful' | 'gray';
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  draggingIds: string[];
  onDragStart: (itemId: string, clientX: number, clientY: number) => void;
  onDragMove: (clientX: number, clientY: number) => void;
  onDragEnd: (clientX: number, clientY: number) => void;
  onDragCancel: () => void;
  onDeleteSelected: () => void;
  showAddPlaceholder: boolean;
  onAddImages: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMovePageUp: () => void;
  onMovePageDown: () => void;
  onDeletePage: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

type Gesture =
  | {
      type: 'drag';
      itemId: string;
      pointerId: number;
      startX: number;
      startY: number;
      started: boolean;
    }
  | {
      type: 'marquee';
      pointerId: number;
      startX: number;
      startY: number;
      rect: DOMRect;
    };

export default function EditorPage(props: EditorPageProps) {
  let contentRef: HTMLDivElement | undefined;
  let gesture: Gesture | null = null;
  const [marquee, setMarquee] = createSignal<RectCm | null>(null);

  onCleanup(cleanupPointer);

  const placeholderFrame = () => {
    if (!props.showAddPlaceholder) return null;
    const capacity = props.document.layout.columns * props.document.layout.rows;
    if (props.page.items.length >= capacity) return null;
    return getGridFrame(
      props.document.contentRect,
      props.document.layout.columns,
      props.document.layout.rows,
      props.page.items.length,
    );
  };

  function pointerToContent(clientX: number, clientY: number) {
    if (!contentRef) return null;
    const rect = contentRef.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const content = props.document.contentRect;
    return {
      x: ((clientX - rect.left) / rect.width) * content.width,
      y: ((clientY - rect.top) / rect.height) * content.height,
      rect,
    };
  }

  function cleanupPointer() {
    const active = gesture;
    gesture = null;
    setMarquee(null);
    if (active && contentRef?.hasPointerCapture(active.pointerId)) {
      contentRef.releasePointerCapture(active.pointerId);
    }
  }

  function handlePointerMove(event: PointerEvent) {
    const active = gesture;
    if (!active || event.pointerId !== active.pointerId) return;

    if (active.type === 'drag') {
      if (!active.started) {
        if (Math.hypot(event.clientX - active.startX, event.clientY - active.startY) < 4) return;
        active.started = true;
        props.onDragStart(active.itemId, event.clientX, event.clientY);
      }
      props.onDragMove(event.clientX, event.clientY);
      return;
    }

    const pointer = pointerToContent(event.clientX, event.clientY);
    if (!pointer) return;
    const width = Math.abs(event.clientX - active.startX);
    const height = Math.abs(event.clientY - active.startY);
    const start = pointerToContent(active.startX, active.startY);
    if (!start) return;
    const marqueeRect = {
      x: Math.min(start.x, pointer.x),
      y: Math.min(start.y, pointer.y),
      width: (width / active.rect.width) * props.document.contentRect.width,
      height: (height / active.rect.height) * props.document.contentRect.height,
    };
    setMarquee(marqueeRect);
    const hits = props.page.items
      .filter(
        (item) =>
          item.frame.x < marqueeRect.x + marqueeRect.width &&
          item.frame.x + item.frame.width > marqueeRect.x &&
          item.frame.y < marqueeRect.y + marqueeRect.height &&
          item.frame.y + item.frame.height > marqueeRect.y,
      )
      .map((item) => item.id);
    props.onSelectionChange(hits);
  }

  function handlePointerUp(event: PointerEvent) {
    const active = gesture;
    if (!active || event.pointerId !== active.pointerId) return;
    if (active.type === 'drag' && active.started) {
      props.onDragEnd(event.clientX, event.clientY);
    }
    cleanupPointer();
  }

  function handlePointerCancel() {
    if (gesture?.type === 'drag' && gesture.started) {
      props.onDragCancel();
    }
    cleanupPointer();
  }

  function handleLostPointerCapture(event: PointerEvent) {
    if (gesture?.type !== 'drag' || !gesture.started || event.pointerId !== gesture.pointerId) return;
    props.onDragCancel();
    cleanupPointer();
  }

  function handlePointerDown(event: PointerEvent) {
    const target = event.target as HTMLElement | null;
    const itemElement = target?.closest('[data-print-item-id]') as HTMLElement | null;
    const itemId = itemElement?.dataset.printItemId;
    if (!contentRef) return;
    const rect = contentRef.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    if (gesture) cleanupPointer();
    event.preventDefault();
    contentRef.focus();

    if (!itemId) {
      if (!(event.shiftKey || event.ctrlKey || event.metaKey)) {
        props.onSelectionChange([]);
      }
      gesture = {
        type: 'marquee',
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        rect,
      };
    } else {
      const additive = event.shiftKey || event.ctrlKey || event.metaKey;
      if (additive && props.selectedIds.includes(itemId)) {
        props.onSelectionChange(props.selectedIds.filter((id) => id !== itemId));
        return;
      }
      if (!props.selectedIds.includes(itemId)) {
        props.onSelectionChange(additive ? [...props.selectedIds, itemId] : [itemId]);
      }
      gesture = {
        type: 'drag',
        itemId,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        started: false,
      };
    }

    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // Some WebViews reject capture for already-released pointers.
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (gesture?.type === 'drag' && gesture.started) {
      if (event.key === 'Escape') {
        event.preventDefault();
        props.onDragCancel();
        cleanupPointer();
      }
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) {
        props.onRedo();
      } else {
        props.onUndo();
      }
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      props.onSelectionChange(props.page.items.map((item) => item.id));
      return;
    }
    if (event.key === 'Escape') {
      props.onSelectionChange([]);
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      props.onDeleteSelected();
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <PaperSurface
        paper={props.document.paper}
        contentRect={props.document.contentRect}
        mode="edit"
        colorMode={props.colorMode}
        pageId={props.page.id}
        contentRef={(element) => {
          contentRef = element;
        }}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
        onKeyDown={handleKeyDown}
      >
        <PageItems
          page={props.page}
          content={props.document.contentRect}
          assets={props.assets}
          mode="edit"
          selectedIds={props.selectedIds}
          draggingIds={props.draggingIds}
        />
        <Show when={placeholderFrame()}>
          {(frame) => (
            <PrintPlaceholderCell
              frame={frame()}
              content={props.document.contentRect}
              onAddImages={props.onAddImages}
            />
          )}
        </Show>
        {marquee() && (
          <Box
            data-print-marquee="true"
            sx={{
              position: 'absolute',
              left: `${(marquee()!.x / props.document.contentRect.width) * 100}%`,
              top: `${(marquee()!.y / props.document.contentRect.height) * 100}%`,
              width: `${(marquee()!.width / props.document.contentRect.width) * 100}%`,
              height: `${(marquee()!.height / props.document.contentRect.height) * 100}%`,
              border: '1px solid',
              borderColor: 'primary.main',
              backgroundColor: alpha('#00796b', 0.08),
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />
        )}
      </PaperSurface>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          第 {props.pageNumber} 页
        </Typography>
        <IconButton
          size="small"
          aria-label={`上移第 ${props.pageNumber} 页`}
          disabled={!props.canMoveUp}
          onClick={props.onMovePageUp}
        >
          <KeyboardArrowUpIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          aria-label={`下移第 ${props.pageNumber} 页`}
          disabled={!props.canMoveDown}
          onClick={props.onMovePageDown}
        >
          <KeyboardArrowDownIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          aria-label={`删除第 ${props.pageNumber} 页`}
          onClick={props.onDeletePage}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
