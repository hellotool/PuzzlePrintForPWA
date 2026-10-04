import { Index } from 'solid-js';
import Print from '@/features/print/components/Print';
import PrintPaper from '@/features/print/components/PrintPaper';
import SnapProofPageContent from '@/pages/PrinterPage/components/SPPrintPageContent';
import { useConfig } from '@/pages/PrinterPage/contexts/ConfigContext';
import useImages from '@/pages/PrinterPage/contexts/ImagesContext';

export default function SPPrint() {
  const { state: config } = useConfig();
  const { state: images } = useImages();
  return (
    <Print
      paperOrientation={config.print.orientation}
      paperSize={config.print.size}
      contentMarginLeft={config.print.contentMarginLeft}
      contentMarginTop={config.print.contentMarginTop}
      contentMarginRight={config.print.contentMarginRight}
      contentMarginBottom={config.print.contentMarginBottom}
    >
      <Index each={images.chunkedImages}>
        {(images) => (
          <PrintPaper>
            <SnapProofPageContent
              images={images()}
              columns={config.layout.columns}
              rows={config.layout.rows}
              mode="print"
            />
          </PrintPaper>
        )}
      </Index>
    </Print>
  );
}
