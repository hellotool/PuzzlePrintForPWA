import { makeEventListener } from '@solid-primitives/event-listener';
import { flatten, type NullableTranslator, type Translator, translator } from '@solid-primitives/i18n';
import { type Accessor, createContext, createSignal, type JSX, useContext } from 'solid-js';
import { type GlobalDictionary, type Locale, locales, type RawGlobalDictionary } from '@/locales';
import en from '@/locales/en';
import zhCN from '@/locales/zh-CN';

const GlobalLocaleConfigContext = createContext<{
  locale: Accessor<Locale>;
  translator: NullableTranslator<GlobalDictionary>;
}>();

interface GlobalLocaleConfigProviderProps {
  children: JSX.Element;
  locale: Locale;
  translator: NullableTranslator<GlobalDictionary>;
}
export function GlobalLocaleConfigProvider(props: GlobalLocaleConfigProviderProps) {
  return (
    <GlobalLocaleConfigContext.Provider
      value={{
        locale: () => props.locale,
        translator: props.translator,
      }}
    >
      {props.children}
    </GlobalLocaleConfigContext.Provider>
  );
}

export function useGlobalLocaleConfig() {
  const value = useContext(GlobalLocaleConfigContext);
  if (!value) {
    throw new Error('useGlobalLocale must be used within an GlobalLocaleProvider');
  }
  return value;
}

export function useGlobalLocale() {
  const config = useGlobalLocaleConfig();
  return config.locale;
}

export function useGlobalTranslator(): NullableTranslator<GlobalDictionary> {
  const config = useGlobalLocaleConfig();
  return config.translator;
}

function getAvailableLocales() {
  const availableLocales: Locale[] = [];
  for (const browserLanguage of navigator.languages) {
    if (browserLanguage in locales) {
      availableLocales.push(browserLanguage as Locale);
    } else {
      const similarLocale = locales.find((locale) => browserLanguage.startsWith(locale));
      if (similarLocale) {
        availableLocales.push(similarLocale);
      }
    }
  }
  return availableLocales;
}

export function createCurrentLocale() {
  const [currentLocale, setCurrentLocale] = createSignal(getAvailableLocales()[0]);
  makeEventListener(window, 'languagechange', () => {
    setCurrentLocale(getAvailableLocales()[0]);
  });
  return currentLocale;
}

export function createGlobalTranslator<T extends string>(currentLocale: Accessor<T>): Translator<GlobalDictionary> {
  const dictionary = () => {
    let rawDictionary: RawGlobalDictionary;
    switch (currentLocale()) {
      case 'zh-CN':
        rawDictionary = zhCN;
        break;
      case 'en':
        rawDictionary = en;
        break;
      default:
        rawDictionary = zhCN;
    }
    return flatten(rawDictionary);
  };
  const t = translator(dictionary);
  return t;
}
