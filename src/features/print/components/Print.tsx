import { GlobalStyles } from '@suid/material';
import type { DataType } from 'csstype';
import { createMemo, type JSX, onMount } from 'solid-js';
import { mergeProps, Portal } from 'solid-js/web';
import { PrintPaperConfigProvider } from '../contexts/PrintPaperConfigContext';
import { pageSizeNameToCm } from '../utils/paperSize';
import { getOrientationBasedSize } from '../utils/print';

export interface PrintProps {
  children: JSX.Element;
  compatibility?: boolean;
  paperSize?: DataType.PageSize | [number, number];
  paperOrientation?: 'landscape' | 'portrait';
  contentMarginLeft?: number;
  contentMarginTop?: number;
  contentMarginRight?: number;
  contentMarginBottom?: number;
}

const DEFAULT_PROPS = {
  compatibility: false,
  paperSize: 'A4',
  paperOrientation: 'portrait',
  contentMarginLeft: 2.25,
  contentMarginTop: 2.25,
  contentMarginRight: 2.25,
  contentMarginBottom: 2.25,
} as const satisfies Partial<PrintProps>;

export default function Print(props: PrintProps) {
  const finalProps = mergeProps(DEFAULT_PROPS, props);
  const finalPaperSize = createMemo(() => {
    const paperSize = Array.isArray(finalProps.paperSize)
      ? finalProps.paperSize
      : pageSizeNameToCm(finalProps.paperSize);
    return getOrientationBasedSize(paperSize, finalProps.paperOrientation);
  });

  const contentSize = createMemo(() => ({
    width: finalPaperSize().width - finalProps.contentMarginLeft - finalProps.contentMarginRight,
    height: finalPaperSize().height - finalProps.contentMarginTop - finalProps.contentMarginBottom,
  }));
  const contentAspectRatio = createMemo(() => contentSize().width / contentSize().height);
  const paperAspectRatio = createMemo(() => finalPaperSize().width / finalPaperSize().height);
  const contentInset = createMemo(() => ({
    left: finalProps.contentMarginLeft / finalPaperSize().width,
    top: finalProps.contentMarginTop / finalPaperSize().height,
    width: contentSize().width / finalPaperSize().width,
    height: contentSize().height / finalPaperSize().height,
  }));
  const marginBottomFraction = createMemo(() => finalProps.contentMarginBottom / finalPaperSize().height);
  let printPortal: HTMLDivElement | undefined;
  onMount(() => {
    if (printPortal) {
      printPortal.className = 'print';
    }
  });
  return (
    <>
      <GlobalStyles
        styles={{
          '@page': {
            size: (typeof finalProps.paperSize === 'string'
              ? `${finalProps.paperSize} ${finalProps.paperOrientation}`
              : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                `${finalPaperSize().width}cm ${finalPaperSize().height}cm`) as any,
            margin: finalProps.compatibility
              ? '0'
              : `${finalProps.contentMarginTop}cm ${finalProps.contentMarginRight}cm ${finalProps.contentMarginBottom}cm ${finalProps.contentMarginLeft}cm`,
          },
          body: {
            // 纸张不应带上应用/body 的背景色（背景图形开启时会被打印）
            '@media print': {
              background: '#fff',
            },
            '& > *:not(.print)': {
              '@media print': {
                display: 'none',
              },
            },
            '& > .print': {
              display: 'none',
              '@media print': {
                display: 'block',
              },
            },
          },
          // 首页不强制分页，避免部分引擎产生空白首页
          '.print .PrintPaper + .PrintPaper': {
            breakBefore: 'page',
          },
        }}
      />
      <Portal ref={printPortal}>
        <PrintPaperConfigProvider
          compatibility={finalProps.compatibility}
          contentAspectRatio={contentAspectRatio()}
          paperAspectRatio={paperAspectRatio()}
          paperHeightCm={finalPaperSize().height}
          contentHeightCm={contentSize().height}
          contentInset={contentInset()}
          marginBottomFraction={marginBottomFraction()}
        >
          {props.children}
        </PrintPaperConfigProvider>
      </Portal>
    </>
  );
}
