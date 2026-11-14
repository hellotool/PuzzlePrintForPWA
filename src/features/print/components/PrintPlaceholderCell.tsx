import AddIcon from '@suid/icons-material/Add';
import { Box } from '@suid/material';
import type { RectCm, SizeCm } from '@/domain/print';

interface PrintPlaceholderCellProps {
  frame: RectCm;
  content: SizeCm;
  onAddImages: () => void;
}

function toPercent(value: number, total: number) {
  return total > 0 ? `${(value / total) * 100}%` : '0%';
}

export default function PrintPlaceholderCell(props: PrintPlaceholderCellProps) {
  return (
    <Box
      data-print-add-placeholder="true"
      role="button"
      tabIndex={0}
      aria-label="添加图片"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={props.onAddImages}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          props.onAddImages();
        }
      }}
      sx={{
        position: 'absolute',
        left: toPercent(props.frame.x, props.content.width),
        top: toPercent(props.frame.y, props.content.height),
        width: toPercent(props.frame.width, props.content.width),
        height: toPercent(props.frame.height, props.content.height),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed',
        borderColor: 'divider',
        color: 'text.secondary',
        cursor: 'pointer',
        bgcolor: 'transparent',
        transition: 'background-color 150ms ease',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <AddIcon />
    </Box>
  );
}
