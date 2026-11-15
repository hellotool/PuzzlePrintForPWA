export function hasExternalFiles(dataTransfer: DataTransfer | null): boolean {
  return !!dataTransfer && dataTransfer.types.includes('Files');
}

export function setDownloadUrl(dataTransfer: DataTransfer, image: { url: string; name: string; type?: string }): void {
  const mime = image.type?.startsWith('image/') ? image.type : 'image/png';
  const name = (image.name || 'image').replace(/:/g, '_');
  dataTransfer.setData('DownloadURL', `${mime}:${name}:${image.url}`);
}
