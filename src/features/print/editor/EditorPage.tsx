import DeleteOutlineIcon from '@suid/icons-material/DeleteOutline';
import KeyboardArrowDownIcon from '@suid/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@suid/icons-material/KeyboardArrowUp';
import { Box, IconButton, Typography } from '@suid/material';
import { onCleanup, Show } from 'solid-js';
import { getGridFrame, type PrintDocument, type PrintImageAssets, type PrintPage } from '@/domain/print';
import { hasPrintItems, PRINT_ITEMS_MIME, setDownloadUrl } from '@/features/print/utils/drag';
import PageItems from '../components/PageItems';
import GridLines from '../components/GridLines';
import PaperSurface from '../components/PaperSurface';
import PrintPlaceholderCell from '../components/PrintPlaceholderCell';
import type { DragStartInfo } from './PrintEditor';

interface EditorPageProps {
  document: PrintDocument;
  page: PrintPage;
  pageNumber: number;
  pageCount: number;
  imageNumberingEnabled: boolean;
  pageNumberingEnabled: boolean;
  numberingStart: number;
  assets: PrintImageAssets;
  colorMode: 'colorful' | 'gray';
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  draggingIds: string[];
  onDragStart: (itemId: string, clientX: number, clientY: number) => DragStartInfo | undefined;
  onDragMove: (clientX: number, clientY: number) => void;
  onDragEnd: (clientX: number, clientY: number) => void;
  onDragDrop: () => void;
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

function createNativeDragGhost(info: DragStartInfo): HTMLElement {
  const ghost = document.createElement('div');
  ghost.style.cssText = `position:fixed;left:-10000px;top:-10000px;width:${info.width}px;height:${info.height}px;pointer-events:none;`;
  const img = document.createElement('img');
  img.src = info.url;
  img.alt = '';
  img.draggable = false;
  img.style.cssText = `width:100%;height:100%;object-fit:contain;transform:rotate(${info.rotation}deg);opacity:0.9;box-shadow:0 8px 24px rgba(0,0,0,0.35);`;
  ghost.appendChild(img);
  if (info.itemIds.length > 1) {
    const badge = document.createElement('div');
    badge.textContent = String(info.itemIds.length);
    badge.style.cssText =
      'position:absolute;top:4px;right:4px;min-width:20px;padding:2px 6px;border-radius:10px;background:#00796b;color:#fff;font-size:12px;font-weight:600;line-height:1.5;text-align:center;font-family:sans-serif;';
    ghost.appendChild(badge);
  }
  return ghost;
}

export default function EditorPage(props: EditorPageProps) {
  let contentRef: HTMLDivElement | undefined;
  let nativeGhostEl: HTMLElement | null = null;

  onCleanup(() => {
    if (nativeGhostEl) {
      nativeGhostEl.remove();
      nativeGhostEl = null;
      props.onDragCancel();
    }
  });

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

  function handlePointerDown(event: PointerEvent) {
    const target = event.target as HTMLElement | null;
    const itemElement = target?.closest('[data-print-item-id]') as HTMLElement | null;
    const itemId = itemElement?.dataset.printItemId;
    if (!contentRef) return;
    contentRef.focus();
    if (!itemId) return;

    // 不 preventDefault、不捕获指针：把拖拽交给原生 drag 事件，
    // 同时保留 touch-action 的纵向滚动，避免与滑动冲突。
    const additive = event.shiftKey || event.ctrlKey || event.metaKey;
    if (additive && props.selectedIds.includes(itemId)) {
      props.onSelectionChange(props.selectedIds.filter((id) => id !== itemId));
      return;
    }
    if (!props.selectedIds.includes(itemId)) {
      props.onSelectionChange(additive ? [...props.selectedIds, itemId] : [itemId]);
    }
  }

  function handleDragStart(event: DragEvent) {
    const itemElement = (event.target as HTMLElement | null)?.closest('[data-print-item-id]') as HTMLElement | null;
    const itemId = itemElement?.dataset.printItemId;
    if (!itemId || !event.dataTransfer || nativeGhostEl) {
      event.preventDefault();
      return;
    }
    if (!props.selectedIds.includes(itemId)) {
      props.onSelectionChange([itemId]);
    }
    const info = props.onDragStart(itemId, event.clientX, event.clientY);
    if (!info) {
      event.preventDefault();
      return;
    }
    const dataTransfer = event.dataTransfer;
    dataTransfer.effectAllowed = 'copyMove';
    dataTransfer.setData(PRINT_ITEMS_MIME, JSON.stringify(info.itemIds));
    dataTransfer.setData('text/plain', info.name);
    if (info.url) {
      setDownloadUrl(dataTransfer, { url: info.url, name: info.name, type: info.type });
    }
    nativeGhostEl = createNativeDragGhost(info);
    document.body.appendChild(nativeGhostEl);
    dataTransfer.setDragImage(nativeGhostEl, info.width / 2, info.height / 2);
  }

  function handleDrag(event: DragEvent) {
    if (!nativeGhostEl) return;
    if (event.clientX === 0 && event.clientY === 0) return;
    props.onDragMove(event.clientX, event.clientY);
  }

  function handleDragEnd(event: DragEvent) {
    if (!nativeGhostEl) return;
    nativeGhostEl.remove();
    nativeGhostEl = null;
    props.onDragEnd(event.clientX, event.clientY);
  }

  function handleDragEnter(event: DragEvent) {
    if (!event.dataTransfer || !hasPrintItems(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleDragOver(event: DragEvent) {
    if (!event.dataTransfer || !hasPrintItems(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    props.onDragMove(event.clientX, event.clientY);
  }

  function handleDrop(event: DragEvent) {
    if (!event.dataTransfer || !hasPrintItems(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    props.onDragDrop();
    props.onDragMove(event.clientX, event.clientY);
  }

  function handleKeyDown(event: KeyboardEvent) {
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
        pageId={props.page.id}
        contentRef={(element) => {
          contentRef = element;
        }}
        footer={props.pageNumberingEnabled ? `${props.pageNumber} / ${props.pageCount}` : undefined}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <GridLines
          columns={props.document.layout.columns}
          rows={props.document.layout.rows}
          occupied={props.page.items.length}
        />
        <PageItems
          page={props.page}
          content={props.document.contentRect}
          assets={props.assets}
          mode="edit"
          colorMode={props.colorMode}
          selectedIds={props.selectedIds}
          draggingIds={props.draggingIds}
          numberingEnabled={props.imageNumberingEnabled}
          numberingStart={props.numberingStart}
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
