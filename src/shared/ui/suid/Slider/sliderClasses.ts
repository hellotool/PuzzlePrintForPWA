import { generateUtilityClass, generateUtilityClasses } from '@suid/base';

export interface SliderClasses {
  /** Styles applied to the root element. */
  root: string;
  /** Styles applied to the root element if `color="primary"`. */
  colorPrimary: string;
  /** Styles applied to the root element if `color="secondary"`. */
  colorSecondary: string;
  /** Styles applied to the root element if `size="small"`. */
  sizeSmall: string;
  /** Styles applied to the thumb element if `color="primary"`. */
  thumbColorPrimary: string;
  /** Styles applied to the thumb element if `color="secondary"`. */
  thumbColorSecondary: string;
  /** Styles applied to the thumb element if `size="small"`. */
  thumbSizeSmall: string;
  /** State class applied to the root and thumb element if `disabled={true}`. */
  disabled: string;
  /** State class applied to the root if a thumb is being dragged. */
  dragging: string;
  /** State class applied to the root if a thumb is active. */
  active: string;
  /** State class applied to the thumb element if keyboard focused. */
  focusVisible: string;
  /** Class name applied to the root element if `marks` is provided with at least one label. */
  marked: string;
  /** Class name applied to the root element if `orientation="vertical"`. */
  vertical: string;
  /** Class name applied to the rail element. */
  rail: string;
  /** Class name applied to the track element. */
  track: string;
  /** Class name applied to the root element if `track={false}`. */
  trackFalse: string;
  /** Class name applied to the root element if `track="inverted"`. */
  trackInverted: string;
  /** Class name applied to the thumb element. */
  thumb: string;
  /** Class name applied to the value label element. */
  valueLabel: string;
  /** Class name applied to the value label element if it's open. */
  valueLabelOpen: string;
  /** Class name applied to the value label's circle element. */
  valueLabelCircle: string;
  /** Class name applied to the value label's label element. */
  valueLabelLabel: string;
  /** Class name applied to the mark element. */
  mark: string;
  /** Class name applied to the mark element if active. */
  markActive: string;
  /** Class name applied to the mark label element. */
  markLabel: string;
  /** Class name applied to the mark label element if active. */
  markLabelActive: string;
}

export type SliderClassKey = keyof SliderClasses;

export function getSliderUtilityClass(slot: string): string {
  return generateUtilityClass('MuiSlider', slot);
}

const sliderClasses: SliderClasses = generateUtilityClasses('MuiSlider', [
  'root',
  'colorPrimary',
  'colorSecondary',
  'sizeSmall',
  'thumbColorPrimary',
  'thumbColorSecondary',
  'thumbSizeSmall',
  'disabled',
  'dragging',
  'active',
  'focusVisible',
  'marked',
  'vertical',
  'rail',
  'track',
  'trackFalse',
  'trackInverted',
  'thumb',
  'valueLabel',
  'valueLabelOpen',
  'valueLabelCircle',
  'valueLabelLabel',
  'mark',
  'markActive',
  'markLabel',
  'markLabelActive',
]);

export default sliderClasses;
