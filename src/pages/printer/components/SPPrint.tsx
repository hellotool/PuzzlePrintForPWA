import { Box } from '@suid/material';
import { Index, Show } from 'solid-js';
import type { PrintDocument, PrintImageAssets } from '@/domain/print';
import { Print, PrintPaper } from '@/features/print';
import PageItems from '@/features/print/components/PageItems';

interface SPPrintProps {
  document: PrintDocument;
  assets: PrintImageAssets;
  numberingEnabled: boolean;
}

export default function SPPrint(props: SPPrintProps) {
  const orientation = () => (props.document.paper.width >= props.document.paper.height ? 'landscape' : 'portrait');
  const numberingStartAt = (pageIndex: number) =>
    props.document.pages.slice(0, pageIndex).reduce((total, page) => total + page.items.length, 0);

  return (
    <Print
      paperOrientation={orientation()}
      paperSize={[props.document.paper.width, props.document.paper.height]}
      contentMarginLeft={props.document.margins.left}
      contentMarginTop={props.document.margins.top}
      contentMarginRight={props.document.margins.right}
      contentMarginBottom={props.document.margins.bottom}
    >
      <Index each={props.document.pages}>
        {(page, index) => (
          <PrintPaper>
            <PageItems
              page={page()}
              content={{ width: props.document.contentRect.width, height: props.document.contentRect.height }}
              assets={props.assets}
              mode="print"
              selectedIds={[]}
              numberingEnabled={props.numberingEnabled}
              numberingStart={numberingStartAt(index)}
            />
            <Show when={props.numberingEnabled}>
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  textAlign: 'center',
                  fontSize: 10,
                  lineHeight: 1.2,
                  bgcolor: 'rgba(255, 255, 255, 0.82)',
                }}
              >
                {index + 1} / {props.document.pages.length}
              </Box>
            </Show>
          </PrintPaper>
        )}
      </Index>
    </Print>
  );
}
