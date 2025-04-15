import { useLocalStorageState } from '@workspace/core/hooks/use-local-storage-state';
import { useMediaQuery } from '@workspace/core/hooks/use-media-query';
import { useCallback, useEffect, useMemo } from 'react';

/**
 * Basic color schema types - either a direct mode or 'auto' for system preference
 */
export type BasicColorSchema = BasicColorMode | 'auto';

/**
 * Available color mode values
 */
export type BasicColorMode = 'light' | 'dark';

export interface UseColorModeOptions<T extends string = BasicColorMode> {
  /**
   * CSS Selector for the target element applying to
   *
   * @default 'html'
   */
  selector?: string;

  /**
   * HTML attribute applying the target element
   *
   * @default 'class'
   */
  attribute?: string;

  /**
   * The initial color mode
   *
   * @default 'auto'
   */
  initialValue?: T | BasicColorSchema;

  /**
   * Prefix when adding value to the attribute
   */
  modes?: Partial<Record<T | BasicColorSchema, string>>;

  /**
   * A custom handler for handle the updates.
   * When specified, the default behavior will be overridden.
   *
   * @default undefined
   */
  onChanged?: (
    mode: T | BasicColorMode,
    defaultHandler: (mode: T | BasicColorMode) => void
  ) => void;

  /**
   * Key to persist the data into localStorage/sessionStorage.
   *
   * @default 'app-color-scheme'
   */
  storageKey?: string;

  /**
   * Disable transition on switch
   *
   * @default true
   */
  disableTransition?: boolean;
}

/**
 * Media query for detecting system dark mode preference
 */
const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';

/**
 * Reactive color mode with auto data persistence.
 * Manages color scheme switching with DOM updates and storage persistence.
 *
 * @template T Custom color mode type extending string
 * @param options Configuration options for color mode behavior
 * @returns [colorMode, setColorMode] tuple for reading/writing the current color mode
 *
 * @example
 * ```ts
 * const [colorMode, setColorMode] = useColorMode()
 * // Change to dark mode
 * setColorMode('dark')
 * ```
 */
export function useColorMode<T extends string = BasicColorMode>(
  options: UseColorModeOptions<T> = {}
) {
  const {
    selector = 'html',
    attribute = 'class',
    initialValue = 'auto',
    storageKey = 'app-color-scheme',
    disableTransition = true,
  } = options;

  /**
   * Persisted color mode state in localStorage
   */
  const store = useLocalStorageState(storageKey, {
    defaultValue: initialValue,
  });

  /**
   * System dark mode preference from media query
   */
  const preferredDark = useMediaQuery(COLOR_SCHEME_QUERY);

  /**
   * Combined color modes including custom modes from options
   */
  const modes = useMemo(
    () =>
      ({
        auto: '',
        light: 'light',
        dark: 'dark',
        ...(options.modes ?? {}),
      }) as Record<BasicColorSchema | T, string>,
    [options.modes]
  );

  /**
   * Current system color mode based on preference
   */
  const system = useMemo(
    () => (preferredDark ? 'dark' : 'light'),
    [preferredDark]
  );

  /**
   * Active color mode - either from storage or system preference if set to 'auto'
   */
  const state = useMemo(
    () => (store[0] === 'auto' ? system : store[0]) as 'light' | 'dark' | T,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store[0], system]
  );

  /**
   * Updates HTML attributes to apply the color mode
   * Handles class-based and attribute-based color modes with transition disabling
   *
   * @param _selector DOM selector for target element
   * @param _attribute Attribute to modify ('class' or custom)
   * @param _mode Color mode value to apply
   */
  const updateHTMLAttrs = useCallback(
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
    (_selector: string, _attribute: string, _mode = '') => {
      const el = window.document.querySelector(_selector);
      if (!el) {
        return;
      }

      let style: HTMLStyleElement | undefined;
      if (disableTransition) {
        style = window.document.createElement('style');
        const styleString =
          '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}';
        style.appendChild(document.createTextNode(styleString));
        window.document.head.appendChild(style);
      }

      if (_attribute === 'class') {
        const current = _mode.split(/\s/g);
        const truthyModes = Object.values(modes)
          .flatMap((i) => (i || '').split(/\s/g))
          .filter(Boolean);

        for (const v of truthyModes) {
          if (current.includes(v)) {
            el.classList.add(v);
          } else {
            el.classList.remove(v);
          }
        }
      } else {
        el.setAttribute(_attribute, _mode);
      }

      if (disableTransition) {
        // Calling getComputedStyle forces the browser to redraw
        (() => window.getComputedStyle(style as HTMLStyleElement).opacity)();
        document.head.removeChild(style as HTMLStyleElement);
      }
    },
    [disableTransition, modes]
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: intended
  useEffect(() => {
    // Apply color mode changes to DOM
    if (options.onChanged) {
      options.onChanged(state, (mode: T | BasicColorMode) => {
        updateHTMLAttrs(selector, attribute, modes[mode]);
      });
    } else {
      updateHTMLAttrs(selector, attribute, modes[state]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attribute, modes, options.onChanged, selector, state]);

  return store;
}
