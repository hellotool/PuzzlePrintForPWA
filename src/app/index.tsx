import '@/shared/styles/index.scss';
import { render } from 'solid-js/web';
import { isServiceWorkerSupported } from '@/shared/utils/platform';
import { App } from './App';

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
