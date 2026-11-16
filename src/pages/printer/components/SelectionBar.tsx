import DeleteOutlineIcon from '@suid/icons-material/DeleteOutline';
import MoreVertIcon from '@suid/icons-material/MoreVert';
import RotateLeftIcon from '@suid/icons-material/RotateLeft';
import RotateRightIcon from '@suid/icons-material/RotateRight';
import { createWindowSize } from '@solid-primitives/resize-observer';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Paper } from '@suid/material';
import { createSignal, For, Show } from 'solid-js';

interface SelectionBarProps {
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onRemove: () => void;
}

// 安卓浮动工具栏：48dp 高按钮，宽度不足时把放不下的操作收进溢出菜单。
const BUTTON_WIDTH = 48;
const OVERFLOW_WIDTH = 48;
const TOOLBAR_PADDING = 8;
const SCREEN_MARGIN = 16;

export default function SelectionBar(props: SelectionBarProps) {
  const windowSize = createWindowSize();
  let overflowButtonRef: HTMLButtonElement | undefined;
  const [isOverflowOpened, setOverflowOpened] = createSignal(false);

  const actions = () => [
    { key: 'rotate-left', label: '左转 90°', icon: <RotateLeftIcon />, onClick: props.onRotateLeft },
    { key: 'rotate-right', label: '右转 90°', icon: <RotateRightIcon />, onClick: props.onRotateRight },
    { key: 'remove', label: '移除选中项', icon: <DeleteOutlineIcon color="error" />, onClick: props.onRemove },
  ];

  const visibleCount = () => {
    const all = actions();
    const available = windowSize.width - SCREEN_MARGIN;
    if (TOOLBAR_PADDING + all.length * BUTTON_WIDTH <= available) return all.length;
    return Math.max(0, Math.floor((available - TOOLBAR_PADDING - OVERFLOW_WIDTH) / BUTTON_WIDTH));
  };

  function runAction(action: { onClick: () => void }) {
    setOverflowOpened(false);
    action.onClick();
  }

  return (
    <Paper
      elevation={6}
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: 48,
        px: 0.5,
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <For each={actions().slice(0, visibleCount())}>
        {(action) => (
          <IconButton aria-label={action.label} title={action.label} onClick={() => runAction(action)}>
            {action.icon}
          </IconButton>
        )}
      </For>
      <Show when={visibleCount() < actions().length}>
        <IconButton
          aria-label="更多操作"
          title="更多操作"
          aria-haspopup="true"
          aria-expanded={isOverflowOpened() ? 'true' : undefined}
          ref={overflowButtonRef}
          onClick={() => setOverflowOpened(true)}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={overflowButtonRef}
          open={isOverflowOpened()}
          onClose={() => setOverflowOpened(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <For each={actions().slice(visibleCount())}>
            {(action) => (
              <MenuItem onClick={() => runAction(action)}>
                <ListItemIcon>{action.icon}</ListItemIcon>
                <ListItemText>{action.label}</ListItemText>
              </MenuItem>
            )}
          </For>
        </Menu>
      </Show>
    </Paper>
  );
}
