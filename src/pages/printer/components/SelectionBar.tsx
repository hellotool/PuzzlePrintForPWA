import DeleteOutlineIcon from '@suid/icons-material/DeleteOutline';
import RotateLeftIcon from '@suid/icons-material/RotateLeft';
import RotateRightIcon from '@suid/icons-material/RotateRight';
import { Box, IconButton, Paper, Typography } from '@suid/material';

interface SelectionBarProps {
  selectedCount: number;
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
      <Typography variant="body2" color="text.secondary">
        已选 {props.selectedCount} 项
      </Typography>
      <Box sx={{ flexGrow: 1 }} />
      <IconButton aria-label="左转90度" onClick={props.onRotateLeft}>
        <RotateLeftIcon />
      </IconButton>
      <IconButton aria-label="右转90度" onClick={props.onRotateRight}>
        <RotateRightIcon />
      </IconButton>
      <IconButton aria-label="移除选中项" color="error" onClick={props.onRemove}>
        <DeleteOutlineIcon />
      </IconButton>
    </Paper>
  );
}
