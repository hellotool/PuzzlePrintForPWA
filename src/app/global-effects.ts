import { makeEventListener } from '@solid-primitives/event-listener';
import { type Accessor, createEffect, onCleanup } from 'solid-js';

const ALLOW_INPUT_TYPES = new Set(['email', 'text', 'password', 'number', 'tel', 'url', 'search']);

const DEFAULT_WHEN = (target: EventTarget): boolean => {
  if (target instanceof HTMLInputElement && ALLOW_INPUT_TYPES.has(target.type)) {
    return false;
  }
  return true;
};

export function makeDisableDefaultContextMenuListener(when: (target: EventTarget) => boolean = DEFAULT_WHEN) {
  makeEventListener(
    document.documentElement,
    'contextmenu',
    (e) => {
      if (!e.target || when(e.target)) {
        e.preventDefault();
      }
    },
    { capture: true },
  );
}

export function makeDisableDefaultDropListener() {
  makeEventListener(
    document.documentElement,
    'dragover',
    (e) => {
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'none';
      }
    },
    {
      capture: true,
    },
  );
  makeEventListener(
    document.documentElement,
    'drop',
    (e) => {
      e.preventDefault();
    },
    { capture: true },
  );
}

export function makeDisableDefaultF5Listener() {
  makeEventListener(
    document.documentElement,
    'keydown',
    (e) => {
      if (e.key === 'F5') {
        e.preventDefault();
      }
    },
    { capture: true },
  );
}

export function makeMeta(name: string, content: Accessor<string>) {
  let metaElement: HTMLMetaElement | undefined = document.createElement('meta');
  metaElement.name = name;
  document.head.appendChild(metaElement);
  onCleanup(() => {
    if (!metaElement) return;
    document.head.removeChild(metaElement);
    metaElement = undefined;
  });
  // Meta 组件不稳定，所以需要手动更新
  createEffect(() => {
    if (!metaElement) return;
    metaElement.content = content();
  });
}
