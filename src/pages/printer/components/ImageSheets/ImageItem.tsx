import { Box, Paper, Typography } from '@suid/material';
import type { BoxProps } from '@suid/system/Box';
import { splitProps } from 'solid-js';
import { setDownloadUrl } from '@/features/print/utils/drag';
import type { SnapImage } from '../../types/image';

interface ImageItemProps extends BoxProps {
  image: SnapImage;
}
export default function ImageItem(props: ImageItemProps) {
  const [localProps, otherProps] = splitProps(props, ['image']);

  function handleDragStart(event: DragEvent) {
    if (!event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', localProps.image.name);
    setDownloadUrl(event.dataTransfer, localProps.image);
  }

  return (
    <Box title={localProps.image.name} draggable onDragStart={handleDragStart} {...otherProps}>
      <Paper
        sx={{
          width: '100%',
          aspectRatio: '1',
          overflow: 'hidden',
        }}
        variant="outlined"
      >
        <Box
          component="img"
          draggable={false}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          src={localProps.image.url}
          loading="lazy"
          decoding="async"
          alt={localProps.image.name}
        />
      </Paper>
      <Typography
        component="div"
        sx={{
          width: '100%',
          textAlign: 'center',
          marginTop: 1,
          userSelect: 'text',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        variant="caption"
      >
        {localProps.image.name}
      </Typography>
    </Box>
  );
}
