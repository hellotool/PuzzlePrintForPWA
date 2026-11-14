import { Drawer, useMediaQuery } from '@suid/material';
import { Show } from 'solid-js';
import DragBar from '@/shared/ui/suid/DragBar';
import SettingsPanel from '../SettingsPanel';

interface AdjustSheetsProps {
  open: boolean;
  onClose: () => void;
}

export default function AdjustSheets(props: AdjustSheetsProps) {
  const hasTouch = useMediaQuery('(any-pointer: coarse)');

  return (
    <Drawer
      anchor="bottom"
      open={props.open}
      variant="temporary"
      onClose={props.onClose}
      PaperProps={{
        sx: {
          height: '88vh',
          maxHeight: 680,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          overflow: 'hidden',
        },
      }}
    >
      <Show when={hasTouch()}>
        <DragBar />
      </Show>
      <SettingsPanel />
    </Drawer>
  );
}
