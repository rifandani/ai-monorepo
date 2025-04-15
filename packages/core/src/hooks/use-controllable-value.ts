import { useMemoizedFn } from '@workspace/core/hooks/use-memoized-fn';
import { useUpdate } from '@workspace/core/hooks/use-update';
import { isFunction } from 'radashi';
import type { SetStateAction } from 'react';
import { useMemo, useRef } from 'react';

interface Options<T> {
  defaultValue?: T;
  defaultValuePropName?: string;
  valuePropName?: string;
  trigger?: string;
}

// biome-ignore lint/suspicious/noExplicitAny: intended
type Props = Record<string, any>;

interface StandardProps<T> {
  value: T;
  defaultValue?: T;
  onChange: (val: T) => void;
}

/**
 * In some components, we need the state to be managed by itself or controlled by it's parent.
 * This hook helps you manage this kind of state.
 *
 * @remarks
 *
 * - If there is no value in props, the component manage state by self (Uncontrolled Component)
 * - If props has the value field, then the state is controlled by it's parent (Controlled Component)
 * - If there is an `onChange` field in props, the `onChange` will be trigger when state change
 */
// biome-ignore lint/suspicious/noExplicitAny: intended
export function useControllableValue<T = any>(
  props: StandardProps<T>
): [T, (v: SetStateAction<T>) => void];
// biome-ignore lint/suspicious/noExplicitAny: intended
export function useControllableValue<T = any>(
  props?: Props,
  options?: Options<T>
  // biome-ignore lint/suspicious/noExplicitAny: intended
): [T, (v: SetStateAction<T>, ...args: any[]) => void];
// biome-ignore lint/suspicious/noExplicitAny: intended
export function useControllableValue<T = any>(
  props: Props = {},
  options: Options<T> = {}
) {
  const {
    defaultValue,
    defaultValuePropName = 'defaultValue',
    valuePropName = 'value',
    trigger = 'onChange',
  } = options;

  const value = props[valuePropName] as T;
  const isControlled = Object.prototype.hasOwnProperty.call(
    props,
    valuePropName
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const initialValue = useMemo(() => {
    if (isControlled) {
      return value;
    }

    if (Object.prototype.hasOwnProperty.call(props, defaultValuePropName)) {
      return props[defaultValuePropName];
    }

    return defaultValue;
  }, []);

  const stateRef = useRef(initialValue);
  if (isControlled) {
    stateRef.current = value;
  }

  const update = useUpdate();

  // biome-ignore lint/suspicious/noExplicitAny: intended
  function setState(v: SetStateAction<T>, ...args: any[]) {
    const r = isFunction(v) ? v(stateRef.current) : v;

    if (!isControlled) {
      stateRef.current = r;
      update();
    }
    if (props[trigger]) {
      props[trigger](r, ...args);
    }
  }

  return [stateRef.current, useMemoizedFn(setState)] as const;
}
