import { Index } from 'solid-js';
import type { PrintDocument, PrintImageAssets } from '@/domain/print';
import { Print, PrintPaper } from '@/features/print';
import PageItems from '@/features/print/components/PageItems';

interface SPPrintProps {
  document: PrintDocument;
  assets: PrintImageAssets;
}

export default function SPPrint(props: SPPrintProps) {
  const orientation = () => (props.document.paper.width >= props.document.paper.height ? 'landscape' : 'portrait');

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
        {(page) => (
          <PrintPaper>
            <PageItems
              page={page()}
              content={{ width: props.document.contentRect.width, height: props.document.contentRect.height }}
              assets={props.assets}
              mode="print"
              selectedIds={[]}
            />
          </PrintPaper>
        )}
      </Index>
    </Print>
  );
}
