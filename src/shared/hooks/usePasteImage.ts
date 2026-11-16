import { makeEventListener } from '@solid-primitives/event-listener';

const IGNORED_TARGETS = 'input, textarea, select, [contenteditable], [role="dialog"], [role="menu"], .MuiModal-root';

export function usePasteImage(onFiles: (files: File[]) => void) {
  function handlePaste(event: ClipboardEvent) {
    if (event.defaultPrevented) return;
    if (event.target instanceof Element && event.target.closest(IGNORED_TARGETS)) return;
    if (typeof document !== 'undefined' && document.querySelector('[aria-modal="true"], .MuiModal-root')) return;

    const clipboard = event.clipboardData;
    if (!clipboard) return;
    const files: File[] = [];
    for (const item of Array.from(clipboard.items)) {
      if (item.kind !== 'file' || !item.type.startsWith('image/')) continue;
      const file = item.getAsFile();
      if (file) files.push(file);
    }
    if (files.length === 0) {
      for (const file of Array.from(clipboard.files)) {
        if (file.type.startsWith('image/')) files.push(file);
      }
    }
    if (files.length === 0) return;

    event.preventDefault();
    onFiles(files);
  }

  makeEventListener(document, 'paste', handlePaste);
}
