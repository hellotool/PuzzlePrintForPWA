import { createContext, type JSX, splitProps, useContext } from 'solid-js';

export interface PrintPaperContentInset {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface PrintPaperConfig {
  compatibility: boolean;
  contentAspectRatio: number;
  paperAspectRatio: number;
  contentInset: PrintPaperContentInset;
  marginBottomFraction: number;
}

const PrintPaperConfigContext = createContext<PrintPaperConfig>();

interface PrintPaperConfigProviderProps extends PrintPaperConfig {
  children: JSX.Element;
}
export function PrintPaperConfigProvider(props: PrintPaperConfigProviderProps) {
  const [value] = splitProps(props, [
    'compatibility',
    'contentAspectRatio',
    'paperAspectRatio',
    'contentInset',
    'marginBottomFraction',
  ]);
  return <PrintPaperConfigContext.Provider value={value}>{props.children}</PrintPaperConfigContext.Provider>;
}

export function usePrintPaperConfig(): PrintPaperConfig {
  const paperConfig = useContext(PrintPaperConfigContext);
  if (!paperConfig) {
    throw new Error('PrintPaper must be used within a Print');
  }
  return paperConfig;
}
