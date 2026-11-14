import type { Theme } from '@suid/material/styles';
import { SxProps } from '@suid/system';
import { ElementType, OverrideProps } from '@suid/types';
import { JSXElement } from 'solid-js';
import { DragBarClasses } from './dragBarClasses';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- MUI-compatible generic default
export interface DragBarTypeMap<P = {}, D extends ElementType = 'div'> {
  name: 'MuiDragBar';
  selfProps: {
    /**
     * The content of the component. Defaults to the drag handle.
     */
    children?: JSXElement;
    /**
     * Override or extend the styles applied to the component.
     */
    classes?: Partial<DragBarClasses>;
    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps<Theme>;
  };
  props: P & DragBarTypeMap['selfProps'];
  defaultComponent: D;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- MUI-compatible generic default
export type DragBarProps<D extends ElementType = DragBarTypeMap['defaultComponent'], P = {}> = OverrideProps<
  DragBarTypeMap<P, D>,
  D
>;

export default DragBarProps;
