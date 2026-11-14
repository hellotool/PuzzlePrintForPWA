import MoreVertIcon from '@suid/icons-material/MoreVert';
import { AppBar, Badge, IconButton, Menu, MenuItem, Toolbar, Typography } from '@suid/material';
import { createSignal, Show } from 'solid-js';
import { getWorkBox, isServiceWorkerWaiting } from '@/shared/pwa';

interface AppBarAreaProps {
  onAboutClick?: () => void;
}

export default function AppBarArea(props: AppBarAreaProps) {
  const [isMoreOptionsOpened, setMoreOptionsOpened] = createSignal(false);
  let moreOptionsRef: HTMLButtonElement | undefined;

  function handleUpdateMenuItemClick() {
    setMoreOptionsOpened(false);
    getWorkBox()?.messageSkipWaiting();
  }

  function handleAboutMenuItemClick() {
    setMoreOptionsOpened(false);
    props.onAboutClick?.();
  }

  return (
    <AppBar position="static" color="default" elevation={0}>
      <Toolbar variant="dense" sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Typography variant="h6" noWrap sx={{ fontWeight: 500, mr: 1, flexGrow: 1 }}>
          拼图打印
        </Typography>
        <IconButton
          aria-controls={isMoreOptionsOpened() ? 'more-options-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={isMoreOptionsOpened() ? 'true' : undefined}
          aria-label="更多选项"
          onClick={() => setMoreOptionsOpened(true)}
          ref={moreOptionsRef}
        >
          <Badge variant="dot" invisible={!isServiceWorkerWaiting()}>
            <MoreVertIcon />
          </Badge>
        </IconButton>
        <Menu
          id="more-options-menu"
          anchorEl={moreOptionsRef}
          open={isMoreOptionsOpened()}
          onClose={() => setMoreOptionsOpened(false)}
          PaperProps={{ sx: { minWidth: 168 } }}
        >
          <Show when={isServiceWorkerWaiting()}>
            <MenuItem onClick={handleUpdateMenuItemClick}>重启以应用更新</MenuItem>
          </Show>
          <MenuItem onClick={handleAboutMenuItemClick}>关于</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
