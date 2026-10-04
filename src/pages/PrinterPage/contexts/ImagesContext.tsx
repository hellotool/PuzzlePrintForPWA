import { createContext, type JSX, onCleanup, useContext } from 'solid-js';
import { createImagesActions, type ImagesActions } from '@/pages/PrinterPage/actions/images';
import { useConfig } from '@/pages/PrinterPage/contexts/ConfigContext';
import { createImagesStore, type ImagesStore } from '@/pages/PrinterPage/stores/images';

const ImagesContext = createContext<{ state: ImagesStore; actions: ImagesActions }>();

interface ImagesProviderProps {
  children: JSX.Element;
}

export function ImagesProvider(props: ImagesProviderProps) {
  const { state: config } = useConfig();
  const [state, setState] = createImagesStore(config);
  const actions = createImagesActions(setState, config);

  onCleanup(() => {
    actions.clearImages();
  });

  return <ImagesContext.Provider value={{ state, actions }}>{props.children}</ImagesContext.Provider>;
}

export default function useImages() {
  const value = useContext(ImagesContext);
  if (!value) {
    throw new Error('useImages must be used within an ImagesProvider');
  }
  return value;
}
