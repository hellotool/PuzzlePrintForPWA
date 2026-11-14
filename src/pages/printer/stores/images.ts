import { nanoid } from 'nanoid';
import { createStore, produce, type SetStoreFunction, unwrap } from 'solid-js/store';
import { chunkArray } from '@/shared/utils/list';
import type { SnapImage } from '../types/image';
import type { ConfigStore } from './config';

export interface ImagesStore {
  images: SnapImage[];
  chunkedImages: SnapImage[][];
}
export function createImagesStore(config: ConfigStore) {
  return createStore<ImagesStore>({
    images: [],
    get chunkedImages(): SnapImage[][] {
      this.images.length;
      return chunkArray(unwrap(this.images), config.layout.columns * config.layout.rows);
    },
  });
}

export interface ImagesActions {
  addImageFiles: (imageFiles: FileList | readonly File[]) => void;
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
    addImageFiles: (imageFiles: FileList | readonly File[]) => {
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
