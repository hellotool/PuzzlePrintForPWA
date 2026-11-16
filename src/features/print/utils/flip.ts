const runningAnimations = new WeakMap<HTMLElement, Animation>();

function captureItemRects() {
  const rects = new Map<string, DOMRect>();
  // 限定滚动区：常挂载的打印层副本 rect 为 0，全局查询会把真实矩形覆盖成左上角零点
  document.querySelectorAll<HTMLElement>('[data-print-scroll-area] [data-print-item-id]').forEach((element) => {
    const id = element.dataset.printItemId;
    if (id) rects.set(id, element.getBoundingClientRect());
  });
  return rects;
}

function animateItemRects(previous: Map<string, DOMRect>) {
  document.querySelectorAll<HTMLElement>('[data-print-scroll-area] [data-print-item-id]').forEach((element) => {
    const id = element.dataset.printItemId;
    const before = id ? previous.get(id) : undefined;
    if (!before || typeof element.animate !== 'function') return;
    const after = element.getBoundingClientRect();
    const deltaX = before.left - after.left;
    const deltaY = before.top - after.top;
    if (deltaX === 0 && deltaY === 0) return;
    runningAnimations.get(element)?.cancel();
    const animation = element.animate([{ translate: `${deltaX}px ${deltaY}px` }, { translate: '0px 0px' }], {
      duration: 180,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
    });
    runningAnimations.set(element, animation);
    animation.addEventListener('finish', () => {
      if (runningAnimations.get(element) === animation) {
        runningAnimations.delete(element);
      }
    });
  });
}

let flipFrame = 0;

/** 先记录旧位置，执行 DOM 更新，再下一帧 FLIP 补间到新位置。 */
export function withFlip(update: () => void) {
  const previous = captureItemRects();
  update();
  if (flipFrame !== 0) cancelAnimationFrame(flipFrame);
  flipFrame = requestAnimationFrame(() => {
    flipFrame = 0;
    animateItemRects(previous);
  });
}

export function cancelFlip() {
  if (flipFrame !== 0) {
    cancelAnimationFrame(flipFrame);
    flipFrame = 0;
  }
}
