import DeleteOutlineIcon from '@suid/icons-material/DeleteOutline';
import RotateLeftIcon from '@suid/icons-material/RotateLeft';
import RotateRightIcon from '@suid/icons-material/RotateRight';
import { IconButton, Paper } from '@suid/material';

interface SelectionBarProps {
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onRemove: () => void;
}

export default function SelectionBar(props: SelectionBarProps) {
  return (
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.5,
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
    >
      <IconButton aria-label="左转90度" title="左转90度" onClick={props.onRotateLeft}>
        <RotateLeftIcon />
      </IconButton>
      <IconButton aria-label="右转90度" title="右转90度" onClick={props.onRotateRight}>
        <RotateRightIcon />
      </IconButton>
      <IconButton aria-label="移除选中项" title="移除选中项" color="error" onClick={props.onRemove}>
        <DeleteOutlineIcon />
      </IconButton>
    </Paper>
  );
}
