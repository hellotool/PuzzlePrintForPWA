import type { DataType } from 'csstype';
import { resolvePaperSize } from './paper';
import type { PrintDocument, PrintItem, PrintMargins, PrintPage, RectCm } from './types';

export interface BuildGridDocumentOptions {
  paperSize: DataType.PageSize | [number, number];
  orientation: 'landscape' | 'portrait';
  margins: PrintMargins;
  columns: number;
  rows: number;
  images: { key: string }[];
}

function createContentRect(paper: { width: number; height: number }, margins: PrintMargins): RectCm {
  return {
    x: margins.left,
    y: margins.top,
    width: Math.max(0, paper.width - margins.left - margins.right),
    height: Math.max(0, paper.height - margins.top - margins.bottom),
  };
}

export function buildGridDocument(options: BuildGridDocumentOptions): PrintDocument {
  const paper = resolvePaperSize(options.paperSize, options.orientation);
  const contentRect = createContentRect(paper, options.margins);
  const perPage = Math.max(1, options.columns * options.rows);
  const pages: PrintPage[] = [];

  for (let pageStart = 0; pageStart < options.images.length; pageStart += perPage) {
    const pageImages = options.images.slice(pageStart, pageStart + perPage);
    const cellWidth = contentRect.width / options.columns;
    const cellHeight = contentRect.height / options.rows;
    const items: PrintItem[] = pageImages.map((image, index) => ({
      id: image.key,
      imageKey: image.key,
      frame: {
        x: (index % options.columns) * cellWidth,
        y: Math.floor(index / options.columns) * cellHeight,
        width: cellWidth,
        height: cellHeight,
      },
      fit: 'contain',
      rotation: 0,
    }));
    pages.push({
      id: `page-${pages.length}`,
      items,
    });
  }

  return {
    paper,
    contentRect,
    margins: options.margins,
    layout: {
      columns: options.columns,
      rows: options.rows,
    },
    excludedImageKeys: [],
    pages,
  };
}

export function filterDocumentByExcludedKeys(document: PrintDocument, excludedImageKeys: string[]): PrintDocument {
  const excluded = new Set(excludedImageKeys);
  const pages = document.pages
    .map((page) => ({
      ...page,
      items: page.items.filter((item) => !excluded.has(item.imageKey)),
    }))
    .filter((page) => page.items.length > 0);
  return {
    ...document,
    excludedImageKeys: [...excluded],
    pages,
  };
}

export function removePage(document: PrintDocument, pageId: string): PrintDocument {
  const page = document.pages.find((value) => value.id === pageId);
  if (!page) return document;
  const excludedImageKeys = [...new Set([...document.excludedImageKeys, ...page.items.map((item) => item.imageKey)])];
  return {
    ...document,
    excludedImageKeys,
    pages: document.pages.filter((value) => value.id !== pageId),
  };
}

export function movePage(document: PrintDocument, fromIndex: number, toIndex: number): PrintDocument {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= document.pages.length ||
    toIndex >= document.pages.length
  ) {
    return document;
  }
  const pages = [...document.pages];
  const [page] = pages.splice(fromIndex, 1);
  pages.splice(toIndex, 0, page);
  return {
    ...document,
    pages,
  };
}

export function removeItemsFromDocument(document: PrintDocument, itemIds: string[]): PrintDocument {
  const ids = new Set(itemIds);
  if (ids.size === 0) return document;
  const removedKeys = document.pages
    .flatMap((page) => page.items)
    .filter((item) => ids.has(item.id))
    .map((item) => item.imageKey);
  const excludedImageKeys = [...new Set([...document.excludedImageKeys, ...removedKeys])];
  const pages = document.pages
    .map((page) => ({
      ...page,
      items: page.items.filter((item) => !ids.has(item.id)),
    }))
    .filter((page) => page.items.length > 0);
  return {
    ...document,
    excludedImageKeys,
    pages,
  };
}

export function getGridFrame(content: RectCm, columns: number, rows: number, index: number): RectCm {
  const width = content.width / columns;
  const height = content.height / rows;
  return {
    x: (index % columns) * width,
    y: Math.floor(index / columns) * height,
    width,
    height,
  };
}

export function rotateItems(document: PrintDocument, itemIds: string[], delta: number): PrintDocument {
  const ids = new Set(itemIds);
  if (ids.size === 0) return document;
  return {
    ...document,
    pages: document.pages.map((page) => ({
      ...page,
      items: page.items.map((item) =>
        ids.has(item.id) ? { ...item, rotation: (((item.rotation + delta) % 360) + 360) % 360 } : item,
      ),
    })),
  };
}

function rebuildGridPages(document: PrintDocument, items: PrintItem[]): PrintPage[] {
  const perPage = Math.max(1, document.layout.columns * document.layout.rows);
  const pages: PrintPage[] = [];
  for (let start = 0; start < items.length; start += perPage) {
    const pageItems = items.slice(start, start + perPage);
    pages.push({
      id: document.pages[pages.length]?.id ?? `page-${pages.length}`,
      items: pageItems.map((value, index) => ({
        ...value,
        frame: getGridFrame(document.contentRect, document.layout.columns, document.layout.rows, index),
      })),
    });
  }
  return pages;
}

/** Moves one or more items to a final flat slot index across all pages. */
export function moveItemsToIndex(document: PrintDocument, itemIds: string[], toIndex: number): PrintDocument {
  const ids = new Set(itemIds);
  if (ids.size === 0) return document;
  const items = document.pages.flatMap((page) => page.items);
  const moving = items.filter((item) => ids.has(item.id));
  if (moving.length === 0) return document;
  const remaining = items.filter((item) => !ids.has(item.id));
  const insertIndex = Math.max(0, Math.min(toIndex, remaining.length));
  remaining.splice(insertIndex, 0, ...moving);

  return {
    ...document,
    pages: rebuildGridPages(document, remaining),
  };
}

export function moveItemToIndex(document: PrintDocument, itemId: string, toIndex: number): PrintDocument {
  return moveItemsToIndex(document, [itemId], toIndex);
}

export function applyItemTransforms(next: PrintDocument, previous: PrintDocument): PrintDocument {
  const previousItems = new Map(previous.pages.flatMap((page) => page.items).map((item) => [item.imageKey, item]));
  return {
    ...next,
    pages: next.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => {
        const previousItem = previousItems.get(item.imageKey);
        return previousItem ? { ...item, rotation: previousItem.rotation } : item;
      }),
    })),
  };
}

export function duplicateItems(
  document: PrintDocument,
  itemIds: string[],
  createId: (sourceId: string, index: number) => string,
): PrintDocument {
  const selected = new Set(itemIds);
  if (selected.size === 0) return document;
  let copyIndex = 0;
  const items = document.pages.flatMap((page) =>
    page.items.flatMap((item) =>
      selected.has(item.id) ? [item, { ...item, id: createId(item.id, copyIndex++) }] : [item],
    ),
  );
  return {
    ...document,
    pages: rebuildGridPages(document, items),
  };
}
