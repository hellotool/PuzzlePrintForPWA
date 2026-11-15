import ArrowDropDownIcon from '@suid/icons-material/ArrowDropDown';
import PhotoLibraryOutlinedIcon from '@suid/icons-material/PhotoLibraryOutlined';
import PrintIcon from '@suid/icons-material/Print';
import SettingsIcon from '@suid/icons-material/Settings';
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Popover,
  useMediaQuery,
} from '@suid/material';
import { createSignal, Show } from 'solid-js';
import ImagePanel from './ImagePanel';

interface ActionBarProps {
  canPrint: boolean;
  isExporting: boolean;
  imageCount: number;
  imagePopupMode: boolean;
  showSettingsButton: boolean;
  excludedKeys?: string[];
  onPrint: () => void;
  onExportPdf: () => void;
  onOpenImages: () => void;
  onOpenSettings: () => void;
}

export default function ActionBar(props: ActionBarProps) {
  const hasFinePointer = useMediaQuery('(any-pointer: fine)');
  const [isExportMenuOpened, setExportMenuOpened] = createSignal(false);
  const [isImagePopupOpened, setImagePopupOpened] = createSignal(false);
  let exportMenuButtonRef: HTMLButtonElement | undefined;
  let imageButtonRef: HTMLButtonElement | undefined;

  function handleImagesClick() {
    if (props.imagePopupMode) {
      setImagePopupOpened(true);
    } else {
      props.onOpenImages();
    }
  }

  return (
    <Paper
      component="footer"
      elevation={0}
      square
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: { xs: 1, md: 2 },
        py: 1,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        flexShrink: 0,
      }}
    >
      <IconButton
        aria-label="图片面板"
        title="图片面板"
        aria-haspopup={props.imagePopupMode ? 'dialog' : undefined}
        aria-expanded={props.imagePopupMode && isImagePopupOpened() ? 'true' : undefined}
        onClick={handleImagesClick}
        ref={imageButtonRef}
      >
        <Badge color="primary" badgeContent={props.imageCount} max={999} invisible={props.imageCount === 0}>
          <PhotoLibraryOutlinedIcon />
        </Badge>
      </IconButton>
      <Show when={props.showSettingsButton}>
        <IconButton aria-label="打开设置面板" title="选项" onClick={props.onOpenSettings}>
          <SettingsIcon />
        </IconButton>
      </Show>
      <Box sx={{ flexGrow: 1 }} />
      <ButtonGroup variant="contained">
        <Button startIcon={<PrintIcon />} disabled={!props.canPrint} onClick={props.onPrint}>
          打印
        </Button>
        <Button
          aria-label="更多打印选项"
          aria-haspopup="true"
          aria-expanded={isExportMenuOpened() ? 'true' : undefined}
          disabled={!props.canPrint}
          onClick={() => setExportMenuOpened(true)}
          ref={exportMenuButtonRef}
          sx={{ minWidth: 0, px: 0.5 }}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Menu anchorEl={exportMenuButtonRef} open={isExportMenuOpened()} onClose={() => setExportMenuOpened(false)}>
        <MenuItem
          disabled={props.isExporting}
          onClick={() => {
            setExportMenuOpened(false);
            props.onExportPdf();
          }}
        >
          {props.isExporting ? '导出中…' : '导出 PDF'}
        </MenuItem>
      </Menu>
      <Show when={props.imagePopupMode}>
        <Popover
          anchorEl={imageButtonRef}
          open={isImagePopupOpened()}
          onClose={() => setImagePopupOpened(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          marginThreshold={8}
          PaperProps={{
            sx: {
              width: 340,
              maxWidth: 'calc(100vw - 16px)',
              height: 'min(62vh, 520px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 2,
            },
          }}
        >
          <ImagePanel
            onClose={() => setImagePopupOpened(false)}
            showCloseButton={hasFinePointer()}
            excludedKeys={props.excludedKeys}
          />
        </Popover>
      </Show>
    </Paper>
  );
}
