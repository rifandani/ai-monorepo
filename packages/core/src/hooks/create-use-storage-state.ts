import { useMemoizedFn } from '@workspace/core/hooks/use-memoized-fn';
import { useUpdateEffect } from '@workspace/core/hooks/use-update-effect';
import { isFunction } from 'radashi';
import { useState } from 'react';

export type SetState<S> = S | ((prevState?: S) => S);

export interface Options<T> {
  defaultValue?: T | (() => T);
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  onError?: (error: unknown) => void;
}

/**
 * Creates a custom hook for managing state in browser storage (localStorage/sessionStorage)
 * @param getStorage Function that returns the storage object to use (localStorage or sessionStorage)
 * @returns A hook that manages state with the specified storage
 */
export function createUseStorageState(getStorage: () => Storage | undefined) {
  /**
   * Custom hook for managing state that persists in browser storage
   * @param key Storage key to store/retrieve the value
   * @param options Configuration options for storage behavior
   * @returns [storedValue, setValue] tuple for reading/writing storage
   */
  function useStorageState<T>(key: string, options: Options<T> = {}) {
    let storage: Storage | undefined;
    const {
      onError = (e) => {
        // biome-ignore lint/suspicious/noConsole: <explanation>
        console.error(e);
      },
    } = options;

    // Try to get storage instance, with error handling
    // https://github.com/alibaba/hooks/issues/800
    try {
      storage = getStorage();
    } catch (err) {
      onError(err);
    }

    /**
     * Serializes a value before storing in storage
     * Uses custom serializer if provided, otherwise JSON.stringify
     */
    const serializer = (value: T) => {
      if (options.serializer) {
        return options.serializer(value);
      }

      return JSON.stringify(value);
    };

    /**
     * Deserializes a value retrieved from storage
     * Uses custom deserializer if provided, otherwise JSON.parse
     */
    const deserializer = (value: string): T => {
      if (options.deserializer) {
        return options.deserializer(value);
      }

      return JSON.parse(value);
    };

    /**
     * Retrieves and deserializes the stored value from storage
     * Falls back to defaultValue if storage access fails or value doesn't exist
     */
    function getStoredValue() {
      try {
        const raw = storage?.getItem(key);
        if (raw) {
          return deserializer(raw);
        }
      } catch (e) {
        onError(e);
      }

      if (isFunction(options.defaultValue)) {
        return options.defaultValue();
      }

      return options.defaultValue;
    }

    const [state, setState] = useState(getStoredValue);

    // Update state when key changes
    useUpdateEffect(() => {
      setState(getStoredValue());
    }, [key]);

    /**
     * Updates both the React state and storage value
     * @param value New value or function to update current value
     */
    const updateState = (value?: SetState<T>) => {
      const currentState = isFunction(value) ? value(state) : value;
      setState(currentState);

      if (currentState === undefined) {
        storage?.removeItem(key);
      } else {
        try {
          storage?.setItem(key, serializer(currentState));
        } catch (e) {
          // biome-ignore lint/suspicious/noConsole: <explanation>
          console.error(e);
        }
      }
    };

    return [state, useMemoizedFn(updateState)] as const;
  }

  return useStorageState;
}
