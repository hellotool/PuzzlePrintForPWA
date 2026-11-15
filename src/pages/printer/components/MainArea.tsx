import FileDownloadOutlinedIcon from '@suid/icons-material/FileDownloadOutlined';
import PhotoLibraryOutlinedIcon from '@suid/icons-material/PhotoLibraryOutlined';
import { alpha, Box, Button, Paper, ThemeProvider, Typography, useTheme } from '@suid/material';
import { createMemo, createSignal, Show } from 'solid-js';
import type { PrintDocument, PrintImageAssets } from '@/domain/print';
import PrintEditor from '@/features/print/editor/PrintEditor';
import { hasExternalFiles } from '@/features/print/utils/drag';
import { usePreferredDarkMode } from '@/shared/hooks/usePreferredDarkMode';
import { createAppTheme } from '@/shared/themes/appTheme';

interface MainAreaProps {
  document: PrintDocument;
  assets: PrintImageAssets;
  colorMode: 'colorful' | 'gray';
  lightMode: boolean;
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
  onAddImageFiles: (files: FileList | readonly File[]) => void;
  onDragStateChange?: (dragging: boolean) => void;
}

export default function MainArea(props: MainAreaProps) {
  const theme = useTheme();
  const isPreferredDark = usePreferredDarkMode();
  const [fileDragDepth, setFileDragDepth] = createSignal(0);
  const editorTheme = createMemo(() => {
    if (isPreferredDark() && props.lightMode) {
      return createAppTheme({ isDarkMode: false });
    }
    return theme;
  });

  function handleDragEnter(event: DragEvent) {
    if (!hasExternalFiles(event.dataTransfer)) return;
    setFileDragDepth((depth) => depth + 1);
  }

  function handleDragOver(event: DragEvent) {
    if (!hasExternalFiles(event.dataTransfer) || !event.dataTransfer) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  function handleDragLeave(event: DragEvent) {
    if (!hasExternalFiles(event.dataTransfer)) return;
    setFileDragDepth((depth) => Math.max(0, depth - 1));
  }

  function handleDrop(event: DragEvent) {
    if (!hasExternalFiles(event.dataTransfer) || !event.dataTransfer) return;
    event.preventDefault();
    setFileDragDepth(0);
    props.onAddImageFiles(event.dataTransfer.files);
  }

  return (
    <Box
      component="main"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        position: 'relative',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
      }}
    >
      <Show
        when={props.document.pages.length > 0}
        fallback={
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                maxWidth: 420,
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
                textAlign: 'center',
              }}
            >
              <PhotoLibraryOutlinedIcon color="primary" fontSize="large" />
              <Typography variant="h6">把图片放到纸上</Typography>
              <Typography variant="body2" color="text.secondary">
                选择、粘贴或直接把图片文件拖进来，应用会按网格拼到纸上；拖动图片可以调整顺序。
              </Typography>
              <Show when={props.onAddImages}>
                <Button variant="contained" onClick={props.onAddImages}>
                  选择图片
                </Button>
              </Show>
            </Paper>
          </Box>
        }
      >
        <ThemeProvider theme={editorTheme()}>
          <PrintEditor
            document={props.document}
            assets={props.assets}
            colorMode={props.colorMode}
            imageNumberingEnabled={props.imageNumberingEnabled}
            pageNumberingEnabled={props.pageNumberingEnabled}
            selectedIds={props.selectedIds}
            onSelectionChange={props.onSelectionChange}
            onUpdateDocument={props.onUpdateDocument}
            onAddImages={props.onAddImages}
            onBeginTransaction={props.onBeginTransaction}
            onCommitTransaction={props.onCommitTransaction}
            onCancelTransaction={props.onCancelTransaction}
            onUndo={props.onUndo}
            onRedo={props.onRedo}
            onDragStateChange={props.onDragStateChange}
          />
        </ThemeProvider>
      </Show>
      <Show when={fileDragDepth() > 0}>
        <Box
          sx={{
            position: 'absolute',
            inset: 8,
            zIndex: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            borderRadius: 2,
            border: '2px dashed',
            borderColor: 'primary.main',
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            color: 'primary.main',
            pointerEvents: 'none',
          }}
        >
          <FileDownloadOutlinedIcon fontSize="large" />
          <Typography variant="h6">松开以添加图片</Typography>
        </Box>
      </Show>
    </Box>
  );
}
