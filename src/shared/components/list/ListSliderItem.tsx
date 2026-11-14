import { Box, ListItem } from '@suid/material';
import type { SxProps } from '@suid/system';
import type { Theme } from '@suid/material/styles';
import { createEffect, createSignal, on } from 'solid-js';
import Slider, { type SliderProps } from '@/shared/ui/suid/Slider';
import ListItemTitledComponent from './ListItemTitledComponent';

interface ListSliderItemProps<Value extends number | number[]> {
  title?: string;
  sx?: SxProps<Theme>;
  disabled?: boolean;
  value?: Value;
  onChange?: (event: Event, value: Value, activeThumb: number) => void;
  commitTiming?: 'immediately' | 'releasing';
  sliderProps?: Omit<SliderProps, 'value' | 'onChange' | 'onChangeCommitted'>;
}

export default function ListSliderItem<Value extends number | number[]>(props: ListSliderItemProps<Value>) {
  const [value, setValue] = createSignal<Value>((props.value ?? 0) as Value);

  createEffect(
    on(
      () => props.value,
      (nextValue) => {
        if (nextValue !== undefined) {
          setValue(() => nextValue as Value);
        }
      },
      { defer: true },
    ),
  );

  function handleChange(event: Event, nextValue: number | number[], activeThumb: number) {
    setValue(() => nextValue as Value);
    if (props.commitTiming === 'immediately') {
      props.onChange?.(event, nextValue as Value, activeThumb);
    }
  }

  function handleChangeCommitted(event: Event, nextValue: number | number[]) {
    if (props.commitTiming === 'releasing') {
      props.onChange?.(event, nextValue as Value, 0);
    }
  }

  return (
    <ListItem sx={props.sx}>
      <ListItemTitledComponent title={props.title}>
        <Box sx={{ paddingInline: 1 }}>
          <Slider
            {...props.sliderProps}
            aria-label={props.title}
            disabled={props.disabled}
            value={value()}
            onChange={handleChange}
            onChangeCommitted={handleChangeCommitted}
            sx={{ display: 'block' }}
            valueLabelDisplay="auto"
          />
        </Box>
      </ListItemTitledComponent>
    </ListItem>
  );
}
