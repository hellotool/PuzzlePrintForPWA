import { makeEventListener } from '@solid-primitives/event-listener';
import { Box, useMediaQuery, useTheme } from '@suid/material';
import { createEffect, createMemo, createSignal, Show } from 'solid-js';
import type { PrintImageAssets } from '@/domain/print';
import { buildGridDocument, removeItemsFromDocument, rotateItems } from '@/domain/print';
import AboutDialog from '@/features/about';
import { createPrintDocumentStore } from '@/features/print/editor/stores/createPrintDocumentStore';
import { exportPrintDocumentPdf } from '@/features/print/export/exportPdf';
import { withFlip } from '@/features/print/utils/flip';
import { usePasteImage } from '@/shared/hooks/usePasteImage';
import { pickFiles } from '@/shared/utils/file';
import ActionBar from './components/ActionBar';
import AdjustSheets from './components/AdjustSheets';
import AppBarArea from './components/AppBarArea';
import ImageSheets from './components/ImageSheets';
import MainArea from './components/MainArea';
import FloatingSelectionBar from './components/FloatingSelectionBar';
import SettingsPanel from './components/SettingsPanel';
import SPPrint from './components/SPPrint';
import { ConfigProvider, useConfig } from './contexts/ConfigContext';
import { ImagesProvider, useImages } from './contexts/ImagesContext';

function PrinterPageContent() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { state: images, actions: imagesActions } = useImages();
  const { state: config } = useConfig();
  usePasteImage((files) => imagesActions.addImageFiles(files));

  const [isImageSheetOpened, setImageSheetOpened] = createSignal(false);
  const [isSettingsSheetOpened, setSettingsSheetOpened] = createSignal(false);
  const [isAboutDialogOpened, setAboutDialogOpened] = createSignal(false);
  const [isExporting, setExporting] = createSignal(false);
  const [selectedIds, setSelectedIds] = createSignal<string[]>([]);
  const [isDragging, setDragging] = createSignal(false);

  const documentSource = createMemo(() =>
    buildGridDocument({
      paperSize: config.print.size,
      orientation: config.print.orientation,
      margins: {
        top: config.print.contentMarginTop,
        right: config.print.contentMarginRight,
        bottom: config.print.contentMarginBottom,
        left: config.print.contentMarginLeft,
      },
      columns: config.layout.columns,
      rows: config.layout.rows,
      images: images.images.map((image) => ({ key: image.key })),
    }),
  );
  const documentStore = createPrintDocumentStore(documentSource);
  const assets = createMemo<PrintImageAssets>(() => {
    return Object.fromEntries(
      images.images.map((image) => [image.key, { url: image.url, name: image.name, type: image.type }]),
    ) as PrintImageAssets;
  });

  createEffect(() => {
    const ids = selectedIds();
    if (ids.length === 0) return;
    const existing = new Set(documentStore.document().pages.flatMap((page) => page.items.map((item) => item.id)));
    const next = ids.filter((id) => existing.has(id));
    if (next.length !== ids.length) {
      setSelectedIds(next);
    }
  });

  // 阻止浏览器在未经处理的区域放下文件时直接打开文件导致页面跳转。
  function guard(event: DragEvent) {
    if (event.dataTransfer?.types.includes('Files')) {
      event.preventDefault();
    }
  }
  function deselectOnOutside(event: PointerEvent) {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    // 加选修饰键按下时交给框选/点选逻辑处理基底选中。
    if (event.shiftKey || event.ctrlKey || event.metaKey) return;
    // 仅纸张滚动区内的空白点击取消选中；工具栏、侧栏、底部操作栏等区域保持选中。
    if (!target.closest('[data-print-scroll-area]')) return;
    if (target.closest('[data-print-item-id], [data-print-selection-bar], button, [role="button"], a, input')) return;
    setSelectedIds([]);
  }
  makeEventListener(window, 'dragover', guard);
  makeEventListener(window, 'drop', guard);
  makeEventListener(document, 'pointerdown', deselectOnOutside);

  function openImageSheet() {
    setSettingsSheetOpened(false);
    setImageSheetOpened(true);
  }

  function openSettingsSheet() {
    setImageSheetOpened(false);
    setSettingsSheetOpened(true);
  }

  function handleAddImages() {
    pickFiles({ accept: 'image/*', multiple: true })
      .then((files) => {
        if (files) {
          imagesActions.addImageFiles(files);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  function rotateSelected(delta: number) {
    if (selectedIds().length === 0) return;
    documentStore.beginTransaction();
    documentStore.update(rotateItems(documentStore.document(), selectedIds(), delta));
    documentStore.commitTransaction();
  }

  function removeSelected() {
    if (selectedIds().length === 0) return;
    documentStore.beginTransaction();
    withFlip(() => documentStore.update(removeItemsFromDocument(documentStore.document(), selectedIds())));
    documentStore.commitTransaction();
    setSelectedIds([]);
  }

  function handlePrint() {
    window.print();
  }

  async function handleExportPdf() {
    if (isExporting()) return;
    setExporting(true);
    try {
      await exportPrintDocumentPdf(documentStore.document(), assets(), {
        imageNumbering: config.numbering.imageEnabled,
        pageNumbering: config.numbering.pageEnabled,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <AppBarArea
        canUndo={documentStore.canUndo()}
        canRedo={documentStore.canRedo()}
        onUndo={documentStore.undo}
        onRedo={documentStore.redo}
        onAboutClick={() => setAboutDialogOpened(true)}
      />
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: isDesktop() ? 'minmax(0, 1fr) 292px' : 'minmax(0, 1fr)',
          overflow: 'hidden',
        }}
      >
        <MainArea
          document={documentStore.document()}
          assets={assets()}
          colorMode={config.preview.colorMode}
          lightMode={config.preview.lightMode}
          imageNumberingEnabled={config.numbering.imageEnabled}
          pageNumberingEnabled={config.numbering.pageEnabled && config.print.compatibility}
          selectedIds={selectedIds()}
          onSelectionChange={setSelectedIds}
          onUpdateDocument={documentStore.update}
          onBeginTransaction={documentStore.beginTransaction}
          onCommitTransaction={documentStore.commitTransaction}
          onCancelTransaction={documentStore.cancelTransaction}
          onUndo={documentStore.undo}
          onRedo={documentStore.redo}
          onAddImages={handleAddImages}
          onAddImageFiles={imagesActions.addImageFiles}
          onDragStateChange={setDragging}
        />
        <Show when={isDesktop()}>
          <Box
            sx={{
              minHeight: 0,
              borderLeft: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              overflow: 'hidden',
            }}
          >
            <SettingsPanel />
          </Box>
        </Show>
        <Show when={selectedIds().length > 0 && !isDragging()}>
          <FloatingSelectionBar
            selectedIds={selectedIds()}
            document={documentStore.document()}
            onRotateLeft={() => rotateSelected(-90)}
            onRotateRight={() => rotateSelected(90)}
            onRemove={removeSelected}
          />
        </Show>
      </Box>
      <ActionBar
        canPrint={images.images.length > 0}
        isExporting={isExporting()}
        imageCount={images.images.length}
        imagePopupMode={isDesktop()}
        showSettingsButton={!isDesktop()}
        excludedKeys={documentStore.document().excludedImageKeys}
        onPrint={handlePrint}
        onExportPdf={handleExportPdf}
        onOpenImages={openImageSheet}
        onOpenSettings={openSettingsSheet}
      />
      <Show when={!isDesktop()}>
        <ImageSheets
          open={isImageSheetOpened()}
          onClose={() => setImageSheetOpened(false)}
          excludedKeys={documentStore.document().excludedImageKeys}
        />
        <AdjustSheets open={isSettingsSheetOpened()} onClose={() => setSettingsSheetOpened(false)} />
      </Show>
      {/* 打印层常挂载（屏幕 display:none）：beforeprint 才挂载会让打印预览快照与大图解码竞态导致空白图 */}
      <SPPrint
        document={documentStore.document()}
        assets={assets()}
        compatibility={config.print.compatibility}
        imageNumberingEnabled={config.numbering.imageEnabled}
        pageNumberingEnabled={config.numbering.pageEnabled && config.print.compatibility}
      />
      <AboutDialog open={isAboutDialogOpened()} onClose={() => setAboutDialogOpened(false)} />
    </Box>
  );
}

export default function PrinterPage() {
  return (
    <ConfigProvider>
      <ImagesProvider>
        <PrinterPageContent />
      </ImagesProvider>
    </ConfigProvider>
  );
}
