import { createContext, createEffect, type JSX, useContext } from 'solid-js';

import {
  CONFIG_STORAGE_KEY,
  type ConfigActions,
  type ConfigStore,
  createConfigActions,
  createConfigStore,
} from '../stores/config';

const ConfigContext = createContext<{ state: ConfigStore; actions: ConfigActions }>();

interface ConfigProviderProps {
  children: JSX.Element;
}

export function ConfigProvider(props: ConfigProviderProps) {
  const [state, setState] = createConfigStore();
  const actions = createConfigActions(setState);

  createEffect(() => {
    if (state.print.contentMarginPreset === 'default') {
      actions.print.resetMargins();
    }
  });

  createEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(
      CONFIG_STORAGE_KEY,
      JSON.stringify({
        layout: state.layout,
        print: state.print,
        preview: state.preview,
      }),
    );
  });

  return <ConfigContext.Provider value={{ state, actions }}>{props.children}</ConfigContext.Provider>;
}
export function useConfig() {
  const value = useContext(ConfigContext);
  if (!value) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return value;
}
