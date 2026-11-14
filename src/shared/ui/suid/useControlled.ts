import { createMemo, createSignal, type Accessor } from 'solid-js';

interface UseControlledOptions<T> {
  controlled: Accessor<T | undefined>;
  default: Accessor<T>;
}

export default function useControlled<T>(options: UseControlledOptions<T>): readonly [Accessor<T>, (value: T) => void] {
  const isControlled = options.controlled() !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = createSignal<T>(options.default());
  const value = createMemo<T>(() => options.controlled() ?? uncontrolledValue());

  function setValue(nextValue: T) {
    if (!isControlled) {
      setUncontrolledValue(() => nextValue);
    }
  }

  return [value, setValue] as const;
}
