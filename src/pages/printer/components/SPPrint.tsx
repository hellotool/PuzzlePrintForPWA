import { Box } from '@suid/material';
import { Index } from 'solid-js';
import type { PrintDocument, PrintImageAssets } from '@/domain/print';
import { Print, PrintPaper } from '@/features/print';
import GridLines from '@/features/print/components/GridLines';
import PageItems from '@/features/print/components/PageItems';

interface SPPrintProps {
  document: PrintDocument;
  assets: PrintImageAssets;
  compatibility: boolean;
  imageNumberingEnabled: boolean;
  pageNumberingEnabled: boolean;
}

export default function SPPrint(props: SPPrintProps) {
  const orientation = () => (props.document.paper.width >= props.document.paper.height ? 'landscape' : 'portrait');
  const numberingStartAt = (pageIndex: number) =>
    props.document.pages.slice(0, pageIndex).reduce((total, page) => total + page.items.length, 0);

  return (
    <Print
      compatibility={props.compatibility}
      paperOrientation={orientation()}
      paperSize={[props.document.paper.width, props.document.paper.height]}
      contentMarginLeft={props.document.margins.left}
      contentMarginTop={props.document.margins.top}
      contentMarginRight={props.document.margins.right}
      contentMarginBottom={props.document.margins.bottom}
    >
      <Index each={props.document.pages}>
        {(page, index) => (
          <PrintPaper
            footer={
              props.pageNumberingEnabled ? (
                <Box sx={{ fontSize: 10, lineHeight: 1.2, color: '#000' }}>
                  {index + 1} / {props.document.pages.length}
                </Box>
              ) : undefined
            }
          >
            <GridLines
              columns={props.document.layout.columns}
              rows={props.document.layout.rows}
              occupied={page().items.length}
            />
            <PageItems
              page={page()}
              content={{ width: props.document.contentRect.width, height: props.document.contentRect.height }}
              assets={props.assets}
              mode="print"
              selectedIds={[]}
              numberingEnabled={props.imageNumberingEnabled}
              numberingStart={numberingStartAt(index)}
            />
          </PrintPaper>
        )}
      </Index>
    </Print>
  );
}
