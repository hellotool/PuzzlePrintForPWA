import '@/shared/styles/index.scss';
import { polyfill } from 'mobile-drag-drop';
import { render } from 'solid-js/web';
import { isServiceWorkerSupported } from '@/shared/utils/platform';
import { App } from './App';

// 触摸设备把 touch 翻译成标准 drag 事件，复用同一套原生拖拽处理器；
// holdToDrag 保证快速滑动仍是滚动、长按才发起拖拽，桌面鼠标不受影响。
polyfill({ holdToDrag: 250, dragImageCenterOnTouch: true });

document.documentElement.lang = 'zh-CN';

if (IS_TAURI) {
  document.documentElement.classList.add('tauri');
  import('@tauri-apps/api/window').then(({ getCurrentWindow }) => getCurrentWindow().show()).catch(console.error);
}

if (CONFIG_ENABLE_PWA && import.meta.env.PROD && isServiceWorkerSupported()) {
  import('@/shared/pwa').then(({ registerServiceWorker }) => registerServiceWorker()).catch(console.error);
} else if (!CONFIG_ENABLE_PWA && import.meta.env.PROD && isServiceWorkerSupported()) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .catch(console.error);
  if ('caches' in window) {
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .catch(console.error);
  }
}

const root = document.getElementById('root');
if (root) {
  render(() => <App />, root);
}
