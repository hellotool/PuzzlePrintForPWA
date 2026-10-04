import { createStore, unwrap } from 'solid-js/store';
import type { ConfigStore } from '@/pages/PrinterPage/stores/config';
import type { SnapImage } from '@/pages/PrinterPage/types/image';
import { chunkArray } from '@/shared/utils/list';

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
