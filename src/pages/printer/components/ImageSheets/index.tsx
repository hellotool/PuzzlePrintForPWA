import { Drawer, useMediaQuery } from '@suid/material';
import { Show } from 'solid-js';
import DragBar from '@/shared/ui/suid/DragBar';
import ImagePanel from '../ImagePanel';

interface ImageSheetsProps {
  open: boolean;
  onClose: () => void;
  excludedKeys?: string[];
}

export default function ImageSheets(props: ImageSheetsProps) {
  const hasFinePointer = useMediaQuery('(any-pointer: fine)');
  const hasTouch = useMediaQuery('(any-pointer: coarse)');

  return (
    <Drawer
      anchor="bottom"
      open={props.open}
      variant="temporary"
      onClose={props.onClose}
      PaperProps={{
        sx: {
          height: '82vh',
          maxHeight: 560,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          overflow: 'hidden',
        },
      }}
    >
      <Show when={hasTouch()}>
        <DragBar />
      </Show>
      <ImagePanel onClose={props.onClose} showCloseButton={hasFinePointer()} excludedKeys={props.excludedKeys} />
    </Drawer>
  );
}
