import { Box, useMediaQuery, useTheme } from '@suid/material';
import { createEffect, createMemo, createSignal, Show } from 'solid-js';
import type { PrintImageAssets } from '@/domain/print';
import { buildGridDocument, removeItemsFromDocument, rotateItems } from '@/domain/print';
import AboutDialog from '@/features/about';
import { createPrinting } from '@/features/print';
import { createPrintDocumentStore } from '@/features/print/editor/stores/createPrintDocumentStore';
import { exportPrintDocumentPdf } from '@/features/print/export/exportPdf';
import { pickFiles } from '@/shared/utils/file';
import ActionBar from './components/ActionBar';
import AdjustSheets from './components/AdjustSheets';
import AppBarArea from './components/AppBarArea';
import ImagePanel from './components/ImagePanel';
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

  const [isImageSheetOpened, setImageSheetOpened] = createSignal(false);
  const [isSettingsSheetOpened, setSettingsSheetOpened] = createSignal(false);
  const [isAboutDialogOpened, setAboutDialogOpened] = createSignal(false);
  const [isExporting, setExporting] = createSignal(false);
  const [selectedIds, setSelectedIds] = createSignal<string[]>([]);
  const [isDragging, setDragging] = createSignal(false);

  const isPrinting = createPrinting();

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
      images.images.map((image) => [image.key, { url: image.url, name: image.name }]),
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
    documentStore.update(removeItemsFromDocument(documentStore.document(), selectedIds()));
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
      await exportPrintDocumentPdf(documentStore.document(), assets());
    } catch (error) {
      console.error(error);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <AppBarArea onAboutClick={() => setAboutDialogOpened(true)} />
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: isDesktop() ? '252px minmax(0, 1fr) 292px' : 'minmax(0, 1fr)',
          overflow: 'hidden',
        }}
      >
        <Show when={isDesktop()}>
          <Box
            sx={{
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              borderRight: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <ImagePanel excludedKeys={documentStore.document().excludedImageKeys} />
          </Box>
        </Show>
        <MainArea
          document={documentStore.document()}
          assets={assets()}
          colorMode={config.preview.colorMode}
          lightMode={config.preview.lightMode}
          selectedIds={selectedIds()}
          onSelectionChange={setSelectedIds}
          onUpdateDocument={documentStore.update}
          onBeginTransaction={documentStore.beginTransaction}
          onCommitTransaction={documentStore.commitTransaction}
          onCancelTransaction={documentStore.cancelTransaction}
          onUndo={documentStore.undo}
          onRedo={documentStore.redo}
          onAddImages={handleAddImages}
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
            selectedCount={selectedIds().length}
            onRotateLeft={() => rotateSelected(-90)}
            onRotateRight={() => rotateSelected(90)}
            onRemove={removeSelected}
          />
        </Show>
      </Box>
      <ActionBar
        canPrint={images.images.length > 0}
        canUndo={documentStore.canUndo()}
        canRedo={documentStore.canRedo()}
        isExporting={isExporting()}
        showPanelButtons={!isDesktop()}
        onPrint={handlePrint}
        onExportPdf={handleExportPdf}
        onUndo={documentStore.undo}
        onRedo={documentStore.redo}
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
      <Show when={isPrinting()}>
        <SPPrint document={documentStore.document()} assets={assets()} />
      </Show>
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
