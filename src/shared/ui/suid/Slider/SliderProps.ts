import type { Theme } from '@suid/material/styles';
import { SxProps } from '@suid/system';
import { SliderClasses } from './sliderClasses';
import { ElementType, OverridableStringUnion, OverrideProps } from '@suid/types';
import { JSXElement } from 'solid-js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- MUI module augmentation hook
export interface SliderPropsColorOverrides {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- MUI module augmentation hook
export interface SliderPropsSizeOverrides {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- MUI module augmentation hook
export interface SliderPropsValueLabelOverrides {}

export type SliderValue = number | number[];

export interface Mark {
  value: number;
  label?: JSXElement;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- MUI-compatible generic default
export interface SliderTypeMap<P = {}, D extends ElementType = 'span'> {
  name: 'MuiSlider';
  defaultPropNames:
    | 'color'
    | 'disableSwap'
    | 'disabled'
    | 'isRtl'
    | 'marks'
    | 'max'
    | 'min'
    | 'orientation'
    | 'shiftStep'
    | 'size'
    | 'step'
    | 'tabIndex'
    | 'track'
    | 'valueLabelDisplay'
    | 'valueLabelFormat';
  selfProps: {
    /**
     * The label of the slider.
     */
    'aria-label'?: string;
    /**
     * The id of the element containing a label for the slider.
     */
    'aria-labelledby'?: string;
    /**
     * A string value that provides a user-friendly name for the current value of the slider.
     */
    'aria-valuetext'?: string;
    /**
     * Override or extend the styles applied to the component.
     */
    classes?: Partial<SliderClasses>;
    /**
     * The color of the component.
     * @default 'primary'
     */
    color?: OverridableStringUnion<'primary' | 'secondary', SliderPropsColorOverrides>;
    /**
     * The default value. Use when the component is not controlled.
     */
    defaultValue?: SliderValue;
    /**
     * If `true`, the active thumb cannot be swapped with another thumb.
     * @default false
     */
    disableSwap?: boolean;
    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * Accepts a function which returns a string value that provides a user-friendly name for the thumb labels of the slider.
     */
    getAriaLabel?: (index: number) => string;
    /**
     * Accepts a function which returns a string value that provides a user-friendly name for the current value of the slider.
     */
    getAriaValueText?: (value: number, index: number) => string;
    /**
     * If `true`, the slider will be rendered in right-to-left direction.
     * @default false
     */
    isRtl?: boolean;
    /**
     * Marks indicate predetermined values to which the user can move the slider.
     * @default false
     */
    marks?: boolean | Mark[];
    /**
     * The maximum allowed value.
     * @default 100
     */
    max?: number;
    /**
     * The minimum allowed value.
     * @default 0
     */
    min?: number;
    /**
     * The name attribute of the slider input.
     */
    name?: string;
    /**
     * Callback fired when the value is changed.
     */
    onChange?: (event: Event, value: SliderValue, activeThumb: number) => void;
    /**
     * Callback fired when the value is committed.
     */
    onChangeCommitted?: (event: Event, value: SliderValue) => void;
    /**
     * The orientation of the slider.
     * @default 'horizontal'
     */
    orientation?: 'horizontal' | 'vertical';
    /**
     * The step to use for keyboard navigation.
     * @default 10
     */
    shiftStep?: number;
    /**
     * The size of the slider.
     * @default 'medium'
     */
    size?: OverridableStringUnion<'small' | 'medium', SliderPropsSizeOverrides>;
    /**
     * The granularity with which the slider can step through values.
     * A value of `null` means the slider can only be moved to marks.
     * @default 1
     */
    step?: number | null;
    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps<Theme>;
    /**
     * The tab index of the slider input.
     * @default 0
     */
    tabIndex?: number;
    /**
     * The track presentation.
     * @default 'normal'
     */
    track?: 'normal' | 'inverted' | false | ((value: number[]) => boolean);
    /**
     * The value of the slider.
     */
    value?: SliderValue;
    /**
     * Controls when the value label is displayed.
     * @default 'off'
     */
    valueLabelDisplay?: OverridableStringUnion<'off' | 'auto' | 'on', SliderPropsValueLabelOverrides>;
    /**
     * The format function or string of the value label.
     */
    valueLabelFormat?: string | ((value: number, index: number) => string);
  };
  props: P & SliderTypeMap['selfProps'];
  defaultComponent: D;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- MUI-compatible generic default
export type SliderProps<D extends ElementType = SliderTypeMap['defaultComponent'], P = {}> = OverrideProps<
  SliderTypeMap<P, D>,
  D
>;

export default SliderProps;
