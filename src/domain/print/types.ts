export interface SizeCm {
  width: number;
  height: number;
}

export interface RectCm {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PrintMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PrintItem {
  id: string;
  imageKey: string;
  /** Position and size relative to the page content area, in cm. */
  frame: RectCm;
  fit: 'contain' | 'cover';
  rotation: number;
}

export interface PrintPage {
  id: string;
  items: PrintItem[];
}

export interface PrintDocument {
  paper: SizeCm;
  contentRect: RectCm;
  margins: PrintMargins;
  layout: {
    columns: number;
    rows: number;
  };
  excludedImageKeys: string[];
  pages: PrintPage[];
}

export interface PrintImageAsset {
  url: string;
  name: string;
}

export type PrintImageAssets = Record<string, PrintImageAsset>;
