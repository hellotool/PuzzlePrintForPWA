import type { PrintDocument, PrintImageAssets, PrintItem } from '@/domain/print';

const POINTS_PER_CM = 72 / 2.54;
const RENDER_DPI = 150;

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });
}

function canvasToPng(canvas: HTMLCanvasElement) {
  return new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to encode image'));
        return;
      }
      blob
        .arrayBuffer()
        .then((buffer) => resolve(new Uint8Array(buffer)))
        .catch(reject);
    }, 'image/png');
  });
}

async function renderItemImage(item: PrintItem, url: string) {
  const image = await loadImage(url);
  const width = Math.max(1, Math.round((item.frame.width / 2.54) * RENDER_DPI));
  const height = Math.max(1, Math.round((item.frame.height / 2.54) * RENDER_DPI));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context unavailable');
  }
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  const imageWidth = image.naturalWidth || image.width || 1;
  const imageHeight = image.naturalHeight || image.height || 1;

  if (item.fit === 'cover') {
    const scale = Math.max(width / imageWidth, height / imageHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    context.drawImage(
      image,
      (imageWidth - sourceWidth) / 2,
      (imageHeight - sourceHeight) / 2,
      sourceWidth,
      sourceHeight,
      0,
      0,
      width,
      height,
    );
  } else {
    const scale = Math.min(width / imageWidth, height / imageHeight);
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;
    context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  return canvasToPng(canvas);
}

function downloadPdf(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface ExportPdfOptions {
  numbering?: boolean;
}

export async function exportPrintDocumentPdf(
  documentModel: PrintDocument,
  assets: PrintImageAssets,
  options: ExportPdfOptions = {},
  fileName = `puzzle-print-${new Date().toISOString().slice(0, 10)}.pdf`,
) {
  const { PDFDocument, StandardFonts, degrees, rgb } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  pdf.setTitle('Puzzle Print');
  pdf.setCreator('Puzzle Print');
  const pageWidth = documentModel.paper.width * POINTS_PER_CM;
  const pageHeight = documentModel.paper.height * POINTS_PER_CM;
  const renderCache = new Map<string, Uint8Array>();
  const numberingFont = options.numbering ? await pdf.embedFont(StandardFonts.Helvetica) : null;
  let itemNumber = 0;

  for (let pageIndex = 0; pageIndex < documentModel.pages.length; pageIndex += 1) {
    const pageModel = documentModel.pages[pageIndex];
    const page = pdf.addPage([pageWidth, pageHeight]);
    for (const item of pageModel.items) {
      itemNumber += 1;
      const asset = assets[item.imageKey];
      if (!asset) continue;
      const cacheKey = `${item.imageKey}|${item.fit}|${item.frame.width}x${item.frame.height}`;
      let png = renderCache.get(cacheKey);
      if (!png) {
        png = await renderItemImage(item, asset.url);
        renderCache.set(cacheKey, png);
      }
      const image = await pdf.embedPng(png);
      const width = item.frame.width * POINTS_PER_CM;
      const height = item.frame.height * POINTS_PER_CM;
      const x = (documentModel.margins.left + item.frame.x) * POINTS_PER_CM;
      const y =
        (documentModel.paper.height - documentModel.margins.top - item.frame.y - item.frame.height) * POINTS_PER_CM;

      if (item.rotation === 0) {
        page.drawImage(image, { x, y, width, height });
      } else {
        const radians = (item.rotation * Math.PI) / 180;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        page.drawImage(image, {
          x: centerX - (width / 2) * Math.cos(radians) + (height / 2) * Math.sin(radians),
          y: centerY - (width / 2) * Math.sin(radians) - (height / 2) * Math.cos(radians),
          width,
          height,
          rotate: degrees(item.rotation),
        });
      }

      if (numberingFont) {
        const label = String(itemNumber);
        const size = 8;
        const labelWidth = numberingFont.widthOfTextAtSize(label, size);
        page.drawRectangle({
          x: x + 2,
          y: y + 2,
          width: labelWidth + 4,
          height: size + 4,
          color: rgb(1, 1, 1),
          opacity: 0.82,
        });
        page.drawText(label, {
          x: x + 4,
          y: y + 4,
          size,
          font: numberingFont,
          color: rgb(0, 0, 0),
        });
      }
    }

    if (numberingFont) {
      const label = `${pageIndex + 1} / ${documentModel.pages.length}`;
      const size = 9;
      const labelWidth = numberingFont.widthOfTextAtSize(label, size);
      page.drawText(label, {
        x: pageWidth / 2 - labelWidth / 2,
        y: Math.max(6, (documentModel.margins.bottom * POINTS_PER_CM) / 2 - size / 2),
        size,
        font: numberingFont,
        color: rgb(0, 0, 0),
      });
    }
  }

  const bytes = await pdf.save();
  downloadPdf(bytes, fileName);
}
