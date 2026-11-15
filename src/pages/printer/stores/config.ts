import { createStore, type SetStoreFunction } from 'solid-js/store';
import type { NumberingConfig, PaperLayout, PreviewConfig, PrintConfig } from '../types/config';

export interface ConfigStore {
  layout: PaperLayout;
  print: PrintConfig;
  preview: PreviewConfig;
  numbering: NumberingConfig;
}

export const CONFIG_STORAGE_KEY = 'puzzle-print:config';

function createDefaultConfig(): ConfigStore {
  return {
    layout: {
      columns: 3,
      rows: 1,
    },
    print: {
      compatibility: true,
      contentMarginPreset: 'default',
      contentMarginLeft: 0.5,
      contentMarginTop: 1,
      contentMarginRight: 0.5,
      contentMarginBottom: 1,
      orientation: 'landscape',
      size: 'A4',
    },
    preview: {
      colorMode: 'gray',
      lightMode: false,
    },
    numbering: {
      imageEnabled: false,
      pageEnabled: false,
    },
  };
}

function loadStoredConfig(): ConfigStore {
  const defaults = createDefaultConfig();
  if (typeof sessionStorage === 'undefined') return defaults;
  try {
    const raw = sessionStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return defaults;
    const stored = JSON.parse(raw) as Partial<ConfigStore>;
    // 旧版配置只有 numbering.enabled，迁移为图片序号与页码两个开关
    const storedNumbering = (stored.numbering ?? {}) as Partial<NumberingConfig> & { enabled?: boolean };
    return {
      layout: { ...defaults.layout, ...stored.layout },
      print: { ...defaults.print, ...stored.print },
      preview: { ...defaults.preview, ...stored.preview },
      numbering: {
        imageEnabled: storedNumbering.imageEnabled ?? storedNumbering.enabled ?? defaults.numbering.imageEnabled,
        pageEnabled: storedNumbering.pageEnabled ?? storedNumbering.enabled ?? defaults.numbering.pageEnabled,
      },
    };
  } catch {
    return defaults;
  }
}

export function createConfigStore() {
  return createStore<ConfigStore>(loadStoredConfig());
}

export interface ConfigActions {
  layout: {
    setColumns: (columns: number) => void;
    setRows: (rows: number) => void;
  };
  print: {
    toggleCompatibility: () => void;
    setMarginPreset: (value: 'default' | 'custom') => void;
    setMarginLeft: (value: number) => void;
    setMarginTop: (value: number) => void;
    setMarginRight: (value: number) => void;
    setMarginBottom: (value: number) => void;
    resetMargins: () => void;
    setOrientation: (value: 'landscape' | 'portrait') => void;
    setPaperSize: (size: ConfigStore['print']['size']) => void;
  };
  preview: {
    setColorMode: (mode: 'colorful' | 'gray') => void;
    toggleLightMode: () => void;
  };
  numbering: {
    toggleImage: () => void;
    togglePage: () => void;
  };
}

export function createConfigActions(setState: SetStoreFunction<ConfigStore>): ConfigActions {
  return {
    layout: {
      setColumns: (columns: number) => {
        setState('layout', 'columns', columns);
      },

      setRows: (rows: number) => {
        setState('layout', 'rows', rows);
      },
    },

    print: {
      toggleCompatibility: () => {
        setState('print', 'compatibility', (prev) => !prev);
      },
      setMarginPreset: (preset) => {
        setState('print', 'contentMarginPreset', preset);
      },
      setMarginLeft: (value: number) => {
        setState('print', 'contentMarginLeft', value);
      },

      setMarginTop: (value: number) => {
        setState('print', 'contentMarginTop', value);
      },

      setMarginRight: (value: number) => {
        setState('print', 'contentMarginRight', value);
      },

      setMarginBottom: (value: number) => {
        setState('print', 'contentMarginBottom', value);
      },

      resetMargins: () => {
        setState('print', 'contentMarginLeft', 0.5);
        setState('print', 'contentMarginTop', 1);
        setState('print', 'contentMarginRight', 0.5);
        setState('print', 'contentMarginBottom', 1);
      },

      setOrientation: (value: 'landscape' | 'portrait') => {
        setState('print', 'orientation', value);
      },

      setPaperSize: (size: ConfigStore['print']['size']) => {
        setState('print', 'size', size);
      },
    },

    preview: {
      setColorMode: (mode: 'colorful' | 'gray') => {
        setState('preview', 'colorMode', mode);
      },
      toggleLightMode: () => {
        setState('preview', 'lightMode', (prev) => !prev);
      },
    },

    numbering: {
      toggleImage: () => {
        setState('numbering', 'imageEnabled', (prev) => !prev);
      },
      togglePage: () => {
        setState('numbering', 'pageEnabled', (prev) => !prev);
      },
    },
  };
}
