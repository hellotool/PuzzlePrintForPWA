import { Box } from '@suid/material';
import { Show, type JSX } from 'solid-js';
import { usePrintPaperConfig } from '../contexts/PrintPaperConfigContext';

interface PrintPaperProps {
  children: JSX.Element;
  footer?: JSX.Element;
}
export default function PrintPaper(props: PrintPaperProps) {
  const paperConfig = usePrintPaperConfig();
  const inset = () => paperConfig.contentInset;

  return (
    <Box
      class="PrintPaper"
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${paperConfig.compatibility ? paperConfig.paperAspectRatio : paperConfig.contentAspectRatio}`,
        overflow: 'hidden',
      }}
    >
      <Show when={paperConfig.compatibility} fallback={props.children}>
        <Box
          sx={{
            position: 'absolute',
            left: `${inset().left * 100}%`,
            top: `${inset().top * 100}%`,
            width: `${inset().width * 100}%`,
            height: `${inset().height * 100}%`,
          }}
        >
          {props.children}
        </Box>
        <Show when={props.footer}>
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: `${paperConfig.marginBottomFraction * 100}%`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            {props.footer}
          </Box>
        </Show>
      </Show>
    </Box>
  );
}
