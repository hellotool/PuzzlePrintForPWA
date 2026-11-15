export const PRINT_ITEMS_MIME = 'application/x-hatu-print-items';

export function hasPrintItems(dataTransfer: DataTransfer | null): boolean {
  return !!dataTransfer && dataTransfer.types.includes(PRINT_ITEMS_MIME);
}

export function hasExternalFiles(dataTransfer: DataTransfer | null): boolean {
  return !!dataTransfer && dataTransfer.types.includes('Files') && !hasPrintItems(dataTransfer);
}

export function setDownloadUrl(dataTransfer: DataTransfer, image: { url: string; name: string; type?: string }): void {
  const mime = image.type?.startsWith('image/') ? image.type : 'image/png';
  const name = (image.name || 'image').replace(/:/g, '_');
  dataTransfer.setData('DownloadURL', `${mime}:${name}:${image.url}`);
}
