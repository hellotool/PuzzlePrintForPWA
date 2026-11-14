import PhotoLibraryOutlinedIcon from '@suid/icons-material/PhotoLibraryOutlined';
import { Box, Button, Paper, ThemeProvider, Typography, useTheme } from '@suid/material';
import { createMemo, Show } from 'solid-js';
import type { PrintDocument, PrintImageAssets } from '@/domain/print';
import PrintEditor from '@/features/print/editor/PrintEditor';
import { usePreferredDarkMode } from '@/shared/hooks/usePreferredDarkMode';
import { createAppTheme } from '@/shared/themes/appTheme';

interface MainAreaProps {
  document: PrintDocument;
  assets: PrintImageAssets;
  colorMode: 'colorful' | 'gray';
  lightMode: boolean;
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

export default function MainArea(props: MainAreaProps) {
  const theme = useTheme();
  const isPreferredDark = usePreferredDarkMode();
  const editorTheme = createMemo(() => {
    if (isPreferredDark() && props.lightMode) {
      return createAppTheme({ isDarkMode: false });
    }
    return theme;
  });

  return (
    <Box
      component="main"
      sx={{
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
                添加图片后，应用会按网格拼到纸上；拖动图片可以调整顺序。
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
    </Box>
  );
}
