import { generateUtilityClass, generateUtilityClasses } from '@suid/base';

export interface DragBarClasses {
  /** Styles applied to the root element. */
  root: string;
  /** Styles applied to the handle element. */
  handle: string;
}

export type DragBarClassKey = keyof DragBarClasses;

export function getDragBarUtilityClass(slot: string): string {
  return generateUtilityClass('MuiDragBar', slot);
}

const dragBarClasses: DragBarClasses = generateUtilityClasses('MuiDragBar', ['root', 'handle']);

export default dragBarClasses;
