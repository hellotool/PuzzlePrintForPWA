import createComponentFactory from '@suid/base/createComponentFactory';
import { styled } from '@suid/material/styles';
import { alpha } from '@suid/system';
import type { InPropsOf } from '@suid/types';
import clsx from '../clsx';
import capitalize from '../capitalize';
import useControlled from '../useControlled';
import { SliderTypeMap, type Mark, type SliderValue } from './SliderProps';
import sliderClasses, { getSliderUtilityClass } from './sliderClasses';
import { createMemo, createSignal, For, Index, mergeProps, onCleanup, Show, splitProps } from 'solid-js';

type OwnerState = Omit<InPropsOf<SliderTypeMap>, 'color' | 'size'> & {
  color: 'primary' | 'secondary';
  size: 'small' | 'medium';
  active: boolean;
  dragging: boolean;
  focusVisible: boolean;
  marked: boolean;
  open: boolean;
  trackFalse: boolean;
  trackInverted: boolean;
  vertical: boolean;
};

const $ = createComponentFactory<SliderTypeMap, OwnerState>()({
  name: 'MuiSlider',
  selfPropNames: [
    'aria-label',
    'aria-labelledby',
    'aria-valuetext',
    'classes',
    'color',
    'defaultValue',
    'disableSwap',
    'disabled',
    'getAriaLabel',
    'getAriaValueText',
    'isRtl',
    'marks',
    'max',
    'min',
    'name',
    'onChange',
    'onChangeCommitted',
    'orientation',
    'shiftStep',
    'size',
    'step',
    'tabIndex',
    'track',
    'value',
    'valueLabelDisplay',
    'valueLabelFormat',
  ],
  propDefaults: ({ set }) =>
    set({
      color: 'primary',
      disableSwap: false,
      disabled: false,
      isRtl: false,
      marks: false,
      max: 100,
      min: 0,
      orientation: 'horizontal',
      shiftStep: 10,
      size: 'medium',
      step: 1,
      tabIndex: 0,
      track: 'normal',
      valueLabelDisplay: 'off',
      valueLabelFormat: (value: number) => String(value),
    }),
  utilityClass: getSliderUtilityClass,
  slotClasses: (ownerState) => ({
    root: [
      'root',
      `color${capitalize(ownerState.color)}`,
      `size${capitalize(ownerState.size)}`,
      ownerState.vertical && 'vertical',
      ownerState.disabled && 'disabled',
      ownerState.dragging && 'dragging',
      ownerState.marked && 'marked',
    ],
    rail: ['rail'],
    track: ['track', ownerState.trackInverted && 'trackInverted', ownerState.trackFalse && 'trackFalse'],
    active: ['active'],
    focusVisible: ['focusVisible'],
    disabled: ['disabled'],
    thumb: [
      'thumb',
      `thumbColor${capitalize(ownerState.color)}`,
      `thumbSize${capitalize(ownerState.size)}`,
      ownerState.active && 'active',
      ownerState.focusVisible && 'focusVisible',
      ownerState.disabled && 'disabled',
    ],
    valueLabel: ['valueLabel', ownerState.open && 'valueLabelOpen'],
    valueLabelOpen: ['valueLabelOpen'],
    valueLabelCircle: ['valueLabelCircle'],
    valueLabelLabel: ['valueLabelLabel'],
    mark: ['mark'],
    markActive: ['markActive'],
    markLabel: ['markLabel'],
    markLabelActive: ['markLabelActive'],
  }),
});

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(min, value), max);
}

function getDecimalPrecision(num: number) {
  const decimalPart = num.toString().split('.')[1];
  return decimalPart ? decimalPart.length : 0;
}

function roundValueToStep(value: number, step: number, min: number) {
  const nearest = Math.round((value - min) / step) * step + min;
  return Number(nearest.toFixed(getDecimalPrecision(step)));
}

function findClosest(values: number[], currentValue: number) {
  if (values.length === 0) return 0;
  const distances = values.map((value) => Math.abs(value - currentValue));
  return distances.indexOf(Math.min(...distances));
}

function isFocusVisible(event: FocusEvent) {
  const target = event.target as HTMLElement | null;
  try {
    return target?.matches(':focus-visible') ?? false;
  } catch {
    return true;
  }
}

const SliderRoot = styled('span', {
  name: 'MuiSlider',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    const { ownerState } = props;

    return [
      styles.root,
      styles[`color${capitalize(ownerState.color)}`],
      styles[`size${capitalize(ownerState.size)}`],
      ownerState.vertical && styles.vertical,
      ownerState.disabled && styles.disabled,
      ownerState.dragging && styles.dragging,
      ownerState.marked && styles.marked,
    ];
  },
})<OwnerState>(({ theme, ownerState }) => ({
  pointerEvents: ownerState.disabled ? 'none' : undefined,
  display: 'inline-block',
  position: 'relative',
  cursor: ownerState.disabled ? 'default' : 'pointer',
  touchAction: 'none',
  color: ownerState.disabled ? theme.palette.action.disabled : theme.palette[ownerState.color].main,
  WebkitTapHighlightColor: 'transparent',
  ...(ownerState.vertical
    ? {
        height: '100%',
        width: 4,
        margin: '0 10px',
      }
    : {
        width: '100%',
        height: 4,
        margin: '10px 0',
      }),
  ...(ownerState.size === 'small' && (ownerState.vertical ? { width: 2 } : { height: 2 })),
  ...(ownerState.marked && {
    marginBottom: 20,
  }),
  ...(ownerState.vertical &&
    ownerState.marked && {
      marginRight: 44,
    }),
  [`& .${sliderClasses.thumb}.${sliderClasses.active}, & .${sliderClasses.thumb}.${sliderClasses.focusVisible}`]: {
    boxShadow: `0 0 0 8px ${alpha(theme.palette[ownerState.color].main, 0.16)}`,
  },
}));

const SliderRail = styled('span', {
  name: 'MuiSlider',
  slot: 'Rail',
  overridesResolver: (_, styles) => styles.rail,
})<OwnerState>(({ ownerState }) => ({
  position: 'absolute',
  borderRadius: 'inherit',
  backgroundColor: 'currentColor',
  opacity: 0.38,
  ...(ownerState.vertical
    ? {
        width: 4,
        height: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
      }
    : {
        height: 4,
        width: '100%',
        top: '50%',
        transform: 'translateY(-50%)',
      }),
  ...(ownerState.size === 'small' && (ownerState.vertical ? { width: 2 } : { height: 2 })),
}));

const SliderTrack = styled('span', {
  name: 'MuiSlider',
  slot: 'Track',
  overridesResolver: (_, styles) => [styles.track, styles.trackInverted, styles.trackFalse],
})<OwnerState>(({ theme, ownerState }) => ({
  position: 'absolute',
  borderRadius: 'inherit',
  backgroundColor: 'currentColor',
  ...(ownerState.vertical
    ? {
        width: 4,
        left: '50%',
        transform: 'translateX(-50%)',
      }
    : {
        height: 4,
        top: '50%',
        transform: 'translateY(-50%)',
      }),
  ...(ownerState.size === 'small' && (ownerState.vertical ? { width: 2 } : { height: 2 })),
  transition: theme.transitions.create(['left', 'width', 'bottom', 'height'], {
    duration: theme.transitions.duration.shortest,
  }),
}));

const SliderThumb = styled('span', {
  name: 'MuiSlider',
  slot: 'Thumb',
  overridesResolver: (props, styles) => {
    const { ownerState } = props;

    return [
      styles.thumb,
      ownerState.active && styles.active,
      ownerState.focusVisible && styles.focusVisible,
      ownerState.disabled && styles.disabled,
    ];
  },
})<OwnerState>(({ theme, ownerState }) => ({
  position: 'absolute',
  width: 20,
  height: 20,
  boxSizing: 'border-box',
  borderRadius: '50%',
  outline: 0,
  backgroundColor: 'currentColor',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  userSelect: 'none',
  transition: theme.transitions.create(['box-shadow', 'transform'], {
    duration: theme.transitions.duration.shortest,
  }),
  ...(ownerState.vertical
    ? {
        left: '50%',
        transform: 'translate(-50%, 50%)',
      }
    : {
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }),
  ...(ownerState.size === 'small' && {
    width: 12,
    height: 12,
  }),
  ...(ownerState.disabled && {
    backgroundColor: theme.palette.action.disabled,
  }),
}));

const SliderValueLabel = styled('span', {
  name: 'MuiSlider',
  slot: 'ValueLabel',
  overridesResolver: (props, styles) => {
    const { ownerState } = props;

    return [styles.valueLabel, ownerState.open && styles.valueLabelOpen];
  },
})<OwnerState>(({ theme, ownerState }) => ({
  position: 'absolute',
  pointerEvents: 'none',
  ...(ownerState.vertical
    ? {
        left: 'calc(100% + 4px)',
        top: '50%',
        transform: 'translateY(-50%)',
      }
    : {
        bottom: 'calc(100% + 4px)',
        left: '50%',
        transform: 'translateX(-50%)',
      }),
  color: theme.palette.common.white,
}));

const SliderValueLabelCircle = styled('span', {
  name: 'MuiSlider',
  slot: 'ValueLabelCircle',
  overridesResolver: (_, styles) => styles.valueLabelCircle,
})(({ theme }) => ({
  width: 32,
  height: 32,
  borderRadius: '50%',
  backgroundColor: theme.palette.grey[600],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: theme.typography.pxToRem(12),
  whiteSpace: 'nowrap',
}));

const SliderValueLabelLabel = styled('span', {
  name: 'MuiSlider',
  slot: 'ValueLabelLabel',
  overridesResolver: (_, styles) => styles.valueLabelLabel,
})(() => ({
  whiteSpace: 'nowrap',
}));

const SliderMark = styled('span', {
  name: 'MuiSlider',
  slot: 'Mark',
  overridesResolver: (_, styles) => [styles.mark, styles.markActive],
})<OwnerState>(({ ownerState }) => ({
  position: 'absolute',
  width: 2,
  height: 2,
  borderRadius: 1,
  backgroundColor: 'currentColor',
  ...(ownerState.vertical
    ? {
        left: '50%',
        transform: 'translate(-50%, 50%)',
      }
    : {
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }),
}));

const SliderMarkLabel = styled('span', {
  name: 'MuiSlider',
  slot: 'MarkLabel',
  overridesResolver: (_, styles) => [styles.markLabel, styles.markLabelActive],
})<OwnerState>(({ theme, ownerState }) => ({
  position: 'absolute',
  fontSize: theme.typography.pxToRem(12),
  color: ownerState.disabled ? theme.palette.text.disabled : theme.palette.text.secondary,
  whiteSpace: 'nowrap',
  ...(ownerState.vertical
    ? {
        left: 'calc(100% + 4px)',
        transform: 'translateY(50%)',
      }
    : {
        top: 'calc(100% + 4px)',
        transform: 'translateX(-50%)',
      }),
}));

const Slider = $.defineComponent(function Slider(inProps) {
  const props = $.useThemeProps({ props: inProps });
  const [, other] = splitProps(props, [
    'aria-label',
    'aria-labelledby',
    'aria-valuetext',
    'classes',
    'color',
    'defaultValue',
    'disableSwap',
    'disabled',
    'getAriaLabel',
    'getAriaValueText',
    'isRtl',
    'marks',
    'max',
    'min',
    'name',
    'onChange',
    'onChangeCommitted',
    'orientation',
    'shiftStep',
    'size',
    'step',
    'tabIndex',
    'track',
    'value',
    'valueLabelDisplay',
    'valueLabelFormat',
  ]);

  const [valueState, setValueState] = useControlled<SliderValue>({
    controlled: () => props.value,
    default: () => props.defaultValue ?? 0,
  });
  const values = createMemo<number[]>(() => {
    const value = valueState();
    return Array.isArray(value) ? value : [value ?? 0];
  });

  const [active, setActive] = createSignal(-1);
  const [open, setOpen] = createSignal(-1);
  const [dragging, setDragging] = createSignal(false);
  const [focusVisible, setFocusVisible] = createSignal(-1);

  let rootRef: HTMLSpanElement | undefined;
  let stopListening: (() => void) | undefined;

  onCleanup(() => stopListening?.());

  const min = () => props.min ?? 0;
  const max = () => props.max ?? 100;
  const orientation = () => props.orientation ?? 'horizontal';
  const isRtl = () => props.isRtl ?? false;

  const marksList = createMemo<Mark[]>(() => {
    if (props.marks === true) {
      if (props.step === null) return [];
      const step = props.step ?? 1;
      const count = Math.floor((max() - min()) / step) + 1;
      return Array.from({ length: count }, (_, index) => ({
        value: Number((min() + step * index).toFixed(10)),
      }));
    }
    return Array.isArray(props.marks) ? props.marks : [];
  });

  function roundValue(value: number) {
    const clamped = clamp(value, min(), max());
    if (props.step === null) {
      const markValues = marksList()
        .map((mark) => mark.value)
        .sort((a, b) => a - b);
      return markValues.length ? markValues[findClosest(markValues, clamped)] : clamped;
    }
    return roundValueToStep(clamped, props.step ?? 1, min());
  }

  function valueToPercent(value: number) {
    if (max() === min()) return 0;
    return ((value - min()) * 100) / (max() - min());
  }

  function getValueFromPointer(event: PointerEvent) {
    if (!rootRef) return min();
    const rect = rootRef.getBoundingClientRect();
    if ((orientation() === 'horizontal' && rect.width === 0) || (orientation() === 'vertical' && rect.height === 0)) {
      return min();
    }
    let percent =
      orientation() === 'vertical'
        ? 1 - (event.clientY - rect.top) / rect.height
        : (event.clientX - rect.left) / rect.width;
    if (orientation() === 'horizontal' && isRtl()) {
      percent = 1 - percent;
    }
    return roundValue(min() + clamp(percent, 0, 1) * (max() - min()));
  }

  function updateValue(next: number, index: number, event: Event) {
    const nextValues = [...values()];
    nextValues[index] = next;
    if (nextValues.length > 1) {
      if (props.disableSwap) {
        if (index > 0) {
          nextValues[index] = Math.max(nextValues[index], nextValues[index - 1]);
        }
        if (index < nextValues.length - 1) {
          nextValues[index] = Math.min(nextValues[index], nextValues[index + 1]);
        }
      } else {
        nextValues.sort((a, b) => a - b);
      }
    }
    const output: SliderValue = nextValues.length > 1 ? nextValues : nextValues[0];
    if (output !== valueState()) {
      setValueState(output);
    }
    props.onChange?.(event, output, index);
    return output;
  }

  function handlePointerDown(event: PointerEvent) {
    if (props.disabled || event.button !== 0) return;
    event.preventDefault();
    const pointerValue = getValueFromPointer(event);
    const index = values().length > 1 ? findClosest(values(), pointerValue) : 0;
    setActive(index);
    setOpen(index);
    setDragging(true);
    let latest = updateValue(pointerValue, index, event);

    const move = (moveEvent: PointerEvent) => {
      latest = updateValue(getValueFromPointer(moveEvent), index, moveEvent);
    };
    const finish = (finishEvent: PointerEvent) => {
      setDragging(false);
      setActive(-1);
      setOpen(-1);
      stopListening?.();
      props.onChangeCommitted?.(finishEvent, latest);
    };
    const cancel = () => {
      setDragging(false);
      setActive(-1);
      setOpen(-1);
      stopListening?.();
    };

    stopListening?.();
    stopListening = () => {
      if (typeof window === 'undefined') return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', cancel);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', finish);
      window.addEventListener('pointercancel', cancel);
    }
  }

  function handleKeyDown(event: KeyboardEvent, index: number) {
    if (props.disabled) return;
    const current = values()[index] ?? min();
    let next = current;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp': {
        if (props.step === null) {
          const markValues = marksList()
            .map((mark) => mark.value)
            .sort((a, b) => a - b);
          if (markValues.length) {
            const markIndex = findClosest(markValues, current);
            next = markValues[Math.min(markIndex + 1, markValues.length - 1)];
          }
        } else {
          next = current + (props.step ?? 1);
        }
        break;
      }
      case 'ArrowLeft':
      case 'ArrowDown': {
        if (props.step === null) {
          const markValues = marksList()
            .map((mark) => mark.value)
            .sort((a, b) => a - b);
          if (markValues.length) {
            const markIndex = findClosest(markValues, current);
            next = markValues[Math.max(markIndex - 1, 0)];
          }
        } else {
          next = current - (props.step ?? 1);
        }
        break;
      }
      case 'PageUp':
        next = current + (props.shiftStep ?? 10);
        break;
      case 'PageDown':
        next = current - (props.shiftStep ?? 10);
        break;
      case 'Home':
        next = min();
        break;
      case 'End':
        next = max();
        break;
      default:
        return;
    }
    event.preventDefault();
    const output = updateValue(roundValue(next), index, event);
    props.onChangeCommitted?.(event, output);
  }

  function handleFocus(event: FocusEvent, index: number) {
    if (isFocusVisible(event)) {
      setFocusVisible(index);
    }
    setOpen(index);
  }

  function handleBlur() {
    setFocusVisible(-1);
    setOpen(-1);
  }

  const trackEnabled = createMemo(() => {
    if (props.track === false) return false;
    if (typeof props.track === 'function') {
      return props.track(values());
    }
    return true;
  });

  const ownerState = mergeProps(props, {
    get active() {
      return active() !== -1;
    },
    get dragging() {
      return dragging();
    },
    get focusVisible() {
      return focusVisible() !== -1;
    },
    get marked() {
      return marksList().some((mark) => mark.label != null);
    },
    get open() {
      return open() !== -1;
    },
    get trackFalse() {
      return !trackEnabled();
    },
    get trackInverted() {
      return props.track === 'inverted';
    },
    get vertical() {
      return orientation() === 'vertical';
    },
    get color() {
      return props.color ?? 'primary';
    },
    get size() {
      return props.size ?? 'medium';
    },
  }) as OwnerState;
  const classes = $.useClasses(ownerState);

  function trackStyle() {
    const start = valueToPercent(values()[0]);
    const end = valueToPercent(values()[values().length - 1]);
    const inverted = ownerState.trackInverted;
    const offset = inverted ? 100 - end : start;
    const length = end - start;
    if (orientation() === 'vertical') {
      return {
        bottom: `${offset}%`,
        height: `${length}%`,
      };
    }
    return isRtl()
      ? {
          right: `${offset}%`,
          width: `${length}%`,
        }
      : {
          left: `${offset}%`,
          width: `${length}%`,
        };
  }

  function thumbStyle(index: number) {
    const percent = valueToPercent(values()[index]);
    if (orientation() === 'vertical') {
      return { bottom: `${percent}%` };
    }
    return isRtl() ? { right: `${percent}%` } : { left: `${percent}%` };
  }

  function markStyle(value: number) {
    const percent = valueToPercent(value);
    if (orientation() === 'vertical') {
      return { bottom: `${percent}%` };
    }
    return isRtl() ? { right: `${percent}%` } : { left: `${percent}%` };
  }

  function valueLabelText(value: number, index: number) {
    const format = props.valueLabelFormat;
    if (typeof format === 'function') {
      return format(value, index);
    }
    if (typeof format === 'string') {
      return format.split('{value}').join(String(value));
    }
    return String(value);
  }

  function showValueLabel(index: number) {
    return (
      props.valueLabelDisplay === 'on' ||
      (props.valueLabelDisplay === 'auto' && (open() === index || focusVisible() === index))
    );
  }

  return (
    <SliderRoot
      {...other}
      ref={(element) => {
        rootRef = element;
      }}
      as={other.component}
      class={clsx(classes.root, other.class)}
      ownerState={ownerState}
      onPointerDown={handlePointerDown}
    >
      <SliderRail class={classes.rail} ownerState={ownerState} />
      <Show when={trackEnabled()}>
        <SliderTrack class={classes.track} ownerState={ownerState} style={trackStyle()} />
      </Show>
      <Index each={values()}>
        {(value, index) => (
          <SliderThumb
            class={clsx(
              classes.thumb,
              active() === index && classes.active,
              focusVisible() === index && classes.focusVisible,
              props.disabled && classes.disabled,
            )}
            ownerState={ownerState}
            style={thumbStyle(index)}
            role="slider"
            aria-orientation={orientation()}
            aria-valuemax={max()}
            aria-valuemin={min()}
            aria-valuenow={value()}
            aria-valuetext={props.getAriaValueText?.(value(), index) ?? props['aria-valuetext']}
            aria-label={props.getAriaLabel?.(index) ?? props['aria-label']}
            aria-labelledby={props['aria-labelledby']}
            tabIndex={props.disabled ? -1 : (props.tabIndex ?? 0)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onFocus={(event) => handleFocus(event, index)}
            onBlur={handleBlur}
          >
            <Show when={showValueLabel(index)}>
              <SliderValueLabel class={clsx(classes.valueLabel, classes.valueLabelOpen)} ownerState={ownerState}>
                <SliderValueLabelCircle class={classes.valueLabelCircle}>
                  <SliderValueLabelLabel class={classes.valueLabelLabel}>
                    {valueLabelText(value(), index)}
                  </SliderValueLabelLabel>
                </SliderValueLabelCircle>
              </SliderValueLabel>
            </Show>
          </SliderThumb>
        )}
      </Index>
      <For each={marksList()}>
        {(mark) => (
          <>
            <SliderMark
              class={clsx(classes.mark, values().includes(mark.value) && classes.markActive)}
              ownerState={ownerState}
              style={markStyle(mark.value)}
            />
            <Show when={mark.label != null}>
              <SliderMarkLabel
                class={clsx(classes.markLabel, values().includes(mark.value) && classes.markLabelActive)}
                ownerState={ownerState}
                style={markStyle(mark.value)}
              >
                {mark.label}
              </SliderMarkLabel>
            </Show>
          </>
        )}
      </For>
    </SliderRoot>
  );
});

export default Slider;
