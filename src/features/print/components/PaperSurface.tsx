import { Box, Paper, type Theme } from '@suid/material';
import type { SxProps } from '@suid/system';
import type { JSX } from 'solid-js';
import type { RectCm, SizeCm } from '@/domain/print';
import { mergeMultiSxProps } from '@/shared/utils/suid';

interface PaperSurfaceProps {
  paper: SizeCm;
  contentRect: RectCm;
  mode: 'preview' | 'edit' | 'print';
  colorMode?: 'colorful' | 'gray';
  pageId?: string;
  class?: string;
  sx?: SxProps<Theme>;
  contentRef?: (element: HTMLDivElement) => void;
  tabIndex?: number;
  children: JSX.Element;
  onPointerDown?: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent>;
  onPointerMove?: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent>;
  onPointerUp?: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent>;
  onPointerCancel?: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent>;
  onLostPointerCapture?: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent>;
  onKeyDown?: JSX.EventHandlerUnion<HTMLDivElement, KeyboardEvent>;
}

export default function PaperSurface(props: PaperSurfaceProps) {
  return (
    <Paper
      class={props.class}
      elevation={props.mode === 'edit' ? 2 : 1}
      square
      sx={mergeMultiSxProps(
        {
          position: 'relative',
          width: '100%',
          aspectRatio: `${props.paper.width} / ${props.paper.height}`,
          overflow: 'hidden',
          filter: props.colorMode === 'gray' ? 'grayscale(100%)' : undefined,
          pointerEvents: props.mode === 'preview' ? 'none' : undefined,
        },
        props.sx,
      )}
    >
      <Box
        ref={props.contentRef}
        data-print-page-id={props.pageId}
        data-print-content={props.pageId ? 'true' : undefined}
        tabIndex={props.tabIndex}
        aria-label={props.mode === 'edit' ? '打印预览编辑画布' : undefined}
        onPointerDown={props.onPointerDown}
        onPointerMove={props.onPointerMove}
        onPointerUp={props.onPointerUp}
        onPointerCancel={props.onPointerCancel}
        onLostPointerCapture={props.onLostPointerCapture}
        onKeyDown={props.onKeyDown}
        sx={{
          position: 'absolute',
          left: `${(props.contentRect.x / props.paper.width) * 100}%`,
          top: `${(props.contentRect.y / props.paper.height) * 100}%`,
          width: `${(props.contentRect.width / props.paper.width) * 100}%`,
          height: `${(props.contentRect.height / props.paper.height) * 100}%`,
          overflow: 'visible',
          outline: 'none',
          touchAction: props.mode === 'edit' ? 'none' : undefined,
          userSelect: props.mode === 'edit' ? 'none' : undefined,
        }}
      >
        {props.children}
      </Box>
    </Paper>
  );
}
