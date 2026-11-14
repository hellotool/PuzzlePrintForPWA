import ArrowDropDownIcon from '@suid/icons-material/ArrowDropDown';
import PhotoLibraryOutlinedIcon from '@suid/icons-material/PhotoLibraryOutlined';
import PrintIcon from '@suid/icons-material/Print';
import RedoIcon from '@suid/icons-material/Redo';
import SettingsIcon from '@suid/icons-material/Settings';
import UndoIcon from '@suid/icons-material/Undo';
import { Box, Button, ButtonGroup, IconButton, Menu, MenuItem, Paper } from '@suid/material';
import { createSignal } from 'solid-js';

interface ActionBarProps {
  canPrint: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isExporting: boolean;
  showPanelButtons: boolean;
  onPrint: () => void;
  onExportPdf: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenImages: () => void;
  onOpenSettings: () => void;
}

export default function ActionBar(props: ActionBarProps) {
  const [isExportMenuOpened, setExportMenuOpened] = createSignal(false);
  let exportMenuButtonRef: HTMLButtonElement | undefined;

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
      {props.showPanelButtons && (
        <>
          <IconButton aria-label="打开图片面板" onClick={props.onOpenImages}>
            <PhotoLibraryOutlinedIcon />
          </IconButton>
          <IconButton aria-label="打开设置面板" onClick={props.onOpenSettings}>
            <SettingsIcon />
          </IconButton>
        </>
      )}
      <Box sx={{ flexGrow: 1 }} />
      <IconButton aria-label="撤销" disabled={!props.canUndo} onClick={props.onUndo}>
        <UndoIcon />
      </IconButton>
      <IconButton aria-label="重做" disabled={!props.canRedo} onClick={props.onRedo}>
        <RedoIcon />
      </IconButton>
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
    </Paper>
  );
}
