import { createSignal } from 'solid-js';
import type { Workbox } from 'workbox-window';

const [isServiceWorkerWaiting, setIsServiceWorkerWaiting] = createSignal(false);

export { isServiceWorkerWaiting };

let workbox: Workbox | undefined;



export async function registerServiceWorker() {
  const { Workbox } = await import('workbox-window');
  workbox = new Workbox(`${import.meta.env.BASE_URL}/service-worker.js`);
  workbox.addEventListener('waiting', () => {
    setIsServiceWorkerWaiting(true);
  });
  workbox.addEventListener('controlling', () => {
    window.location.reload();
  });
  workbox.register();
}

export function getWorkBox() {
  return workbox;
}
