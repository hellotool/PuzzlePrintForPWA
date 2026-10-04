import { nanoid } from 'nanoid';
import { produce, type SetStoreFunction } from 'solid-js/store';
import type { ConfigStore } from '@/pages/PrinterPage/stores/config';
import type { ImagesStore } from '@/pages/PrinterPage/stores/images';
import type { SnapImage } from '@/pages/PrinterPage/types/image';
import { chunkArray } from '@/shared/utils/list';

export interface ImagesActions {
  addImageFiles: (imageFiles: FileList) => void;
  refreshChunkedImages: () => void;
  clearImages: () => void;
}
export function createImagesActions(setState: SetStoreFunction<ImagesStore>, config: ConfigStore): ImagesActions {
  function refreshChunkedImages() {
    setState(
      produce((state) => {
        state.chunkedImages = chunkArray(state.images, config.layout.columns * config.layout.rows);
      }),
    );
  }

  return {
    addImageFiles: (imageFiles: FileList) => {
      if (imageFiles.length === 0) {
        return;
      }
      const newImages: SnapImage[] = Array.from(imageFiles)
        .filter((file) => file.type.startsWith('image/'))
        .map((file) => ({
          key: nanoid(),
          url: URL.createObjectURL(file),
          name: file.name,
        }));
      setState(
        produce((state) => {
          state.images.push(...newImages);
        }),
      );
    },
    refreshChunkedImages,
    clearImages: () => {
      setState(
        produce((state) => {
          for (const image of state.images) {
            URL.revokeObjectURL(image.url);
          }
          state.images = [];
        }),
      );
    },
  };
}
