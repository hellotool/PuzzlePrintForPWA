import { Meta, MetaProvider, Title } from '@solidjs/meta';
import { alpha, GlobalStyles, ThemeProvider } from '@suid/material';
import { createEffect } from 'solid-js';
import {
  makeDisableDefaultContextMenuListener,
  makeDisableDefaultDropListener,
  makeDisableDefaultF5Listener,
  makeMeta,
} from '@/app/global-effects';
import PrinterPage from '@/pages/printer';
import { useDisplayStandaloneMode } from '@/shared/hooks/useDisplayStandaloneMode';
import { createCurrentLocale, createGlobalTranslator, GlobalLocaleConfigProvider } from '@/shared/i18n';
import { createAppTheme } from '@/shared/themes/appTheme';

export function App() {
  const theme = createAppTheme();
  if (IS_TAURI) {
    makeDisableDefaultDropListener();
    makeDisableDefaultF5Listener();
    makeDisableDefaultContextMenuListener();
  } else {
    const standaloneMode = useDisplayStandaloneMode();

    createEffect(() => {
      if (standaloneMode()) {
        makeDisableDefaultDropListener();
        makeDisableDefaultContextMenuListener();
      }
    });
    // Meta 组件不稳定，所以需要手动更新
    makeMeta('theme-color', () => theme.palette.background.default);
  }

  const currentLocale = createCurrentLocale();
  const t = createGlobalTranslator(currentLocale);

  if (IS_TAURI) {
    createEffect(() => {
      const newTitle = t('app.name');
      import('@tauri-apps/api/window')
        .then(({ getCurrentWindow }) => getCurrentWindow().setTitle(newTitle))
        .catch(console.error);
    });
  }

  return (
    <ThemeProvider theme={theme}>
      <GlobalLocaleConfigProvider locale={currentLocale()} translator={t}>
        <MetaProvider>
          <Title>{t('app.name')}</Title>
          <Meta name="description" content={t('app.description')} />
          <Meta name="apple-mobile-web-app-title" content={t('app.name')} />
          {/* <Meta name="theme-color" content={theme.palette.background.default} /> */}
        </MetaProvider>
        <GlobalStyles
          styles={{
            body: {
              backgroundColor: theme.palette.background.default,
              colorScheme: theme.palette.mode,
              color: theme.palette.text.primary,
              ...{
                '--mdc-typography-font-family': theme.typography.fontFamily,
              },
            },
            '.mdc-tooltip__surface': {
              backgroundColor: alpha(theme.palette.grey[700], 0.9),
            },
          }}
        />
        <PrinterPage />
      </GlobalLocaleConfigProvider>
    </ThemeProvider>
  );
}
