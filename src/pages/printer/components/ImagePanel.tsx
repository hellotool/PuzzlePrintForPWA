import AddIcon from '@suid/icons-material/Add';
import ClearAllOutlinedIcon from '@suid/icons-material/ClearAllOutlined';
import CloseIcon from '@suid/icons-material/Close';
import PhotoLibraryOutlinedIcon from '@suid/icons-material/PhotoLibraryOutlined';
import { alpha, Box, Button, Fade, IconButton, Typography, useTheme } from '@suid/material';
import { createSignal, For, Show } from 'solid-js';
import { pickFiles } from '@/shared/utils/file';
import { useImages } from '../contexts/ImagesContext';
import ImageItem from './ImageSheets/ImageItem';

interface ImagePanelProps {
  onClose?: () => void;
  showCloseButton?: boolean;
  excludedKeys?: string[];
}

export default function ImagePanel(props: ImagePanelProps) {
  const theme = useTheme();
  const { state: images, actions: imagesActions } = useImages();
  const [dragEntered, setDragEntered] = createSignal(false);
  const visibleImages = () => images.images.filter((image) => !props.excludedKeys?.includes(image.key));

  let isSelfDrag = false;

  function handleAddImagesClick() {
    pickFiles({ accept: 'image/*', multiple: true })
      .then((files) => {
        if (files) {
          imagesActions.addImageFiles(files);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  function handleClearImagesClick() {
    imagesActions.clearImages();
  }

  function handleDragStart() {
    isSelfDrag = true;
  }

  function handleDragEnd() {
    isSelfDrag = false;
  }

  function handleDragEnter(event: DragEvent) {
    if (!isSelfDrag && event.dataTransfer?.types.includes('Files')) {
      setDragEntered(true);
    }
  }

  function handleDragOver(event: DragEvent) {
    if (!isSelfDrag && event.dataTransfer) {
      event.preventDefault();
      event.dataTransfer.dropEffect = event.dataTransfer.types.includes('Files') ? 'copy' : 'none';
    }
  }

  function handleDragLeave() {
    setDragEntered(false);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setDragEntered(false);
    if (event.dataTransfer?.files) {
      imagesActions.addImageFiles(event.dataTransfer.files);
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pt: 2, pb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          图片
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {visibleImages().length}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Show when={props.onClose && (props.showCloseButton ?? true)}>
          <IconButton size="small" aria-label="关闭图片面板" onClick={props.onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Show>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, px: 2, pb: 1 }}>
        <Button fullWidth variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddImagesClick}>
          添加图片
        </Button>
        <Button
          variant="outlined"
          size="small"
          aria-label="清空图片"
          disabled={images.images.length === 0}
          onClick={handleClearImagesClick}
        >
          <ClearAllOutlinedIcon fontSize="small" />
        </Button>
      </Box>
      <Box
        sx={{
          position: 'relative',
          flexGrow: 1,
          minHeight: 0,
          overflow: 'auto',
          p: 1,
        }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Show
          when={visibleImages().length > 0}
          fallback={
            <Box
              sx={{
                height: '100%',
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                color: 'text.secondary',
                textAlign: 'center',
                px: 2,
              }}
            >
              <PhotoLibraryOutlinedIcon fontSize="large" />
              <Typography variant="body2">还没有图片</Typography>
              <Typography variant="caption">添加或拖入截图后会按顺序排到纸上</Typography>
            </Box>
          }
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
              gap: 1,
            }}
          >
            <For each={visibleImages()}>
              {(image) => (
                <ImageItem
                  image={image}
                  sx={{
                    width: '100%',
                  }}
                />
              )}
            </For>
          </Box>
        </Show>
        <Fade in={dragEntered()}>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.hoverOpacity),
              color: 'primary.main',
            }}
          >
            <Typography variant="body2">拖到此处添加图片</Typography>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
}
