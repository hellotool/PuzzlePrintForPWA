import { makeEventListener } from '@solid-primitives/event-listener';
import { flatten, type NullableTranslator, type Translator, translator } from '@solid-primitives/i18n';
import { type Accessor, createContext, createSignal, type JSX, useContext } from 'solid-js';
import type { GlobalDictionary, Locale, RawGlobalDictionary } from '@/locales';

export interface I18nRegistry {
  available: readonly Locale[];
  fallback: Locale;
  dictionaries: Record<Locale, RawGlobalDictionary>;
}

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

function matchAvailableLocales(available: readonly Locale[]): Locale[] {
  const availableLocales: Locale[] = [];
  for (const browserLanguage of navigator.languages) {
    if (available.includes(browserLanguage as Locale)) {
      availableLocales.push(browserLanguage as Locale);
    } else {
      const similarLocale = available.find((locale) => browserLanguage.startsWith(locale));
      if (similarLocale) {
        availableLocales.push(similarLocale);
      }
    }
  }
  return availableLocales;
}

export function createCurrentLocale(registry: I18nRegistry): Accessor<Locale> {
  function resolveCurrentLocale(): Locale {
    return matchAvailableLocales(registry.available)[0] ?? registry.fallback;
  }

  const [currentLocale, setCurrentLocale] = createSignal<Locale>(resolveCurrentLocale());
  makeEventListener(window, 'languagechange', () => {
    setCurrentLocale(resolveCurrentLocale());
  });
  return currentLocale;
}

export function createGlobalTranslator(
  registry: I18nRegistry,
  currentLocale: Accessor<Locale>,
): Translator<GlobalDictionary> {
  const dictionary = () => {
    const rawDictionary = registry.dictionaries[currentLocale()] ?? registry.dictionaries[registry.fallback];
    return flatten(rawDictionary);
  };
  return translator(dictionary);
}
