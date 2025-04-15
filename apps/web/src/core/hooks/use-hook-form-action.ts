'use client';

// @next-safe-action/adapter-react-hook-form v1.0.14
import type { SafeActionFn, ValidationErrors } from 'next-safe-action';
import type { Infer, InferIn, Schema } from 'next-safe-action/adapters/types';
import type {
  HookBaseUtils,
  HookCallbacks,
  HookSafeActionFn,
  UseActionHookReturn,
  UseOptimisticActionHookReturn,
} from 'next-safe-action/hooks';
import { useAction, useOptimisticAction } from 'next-safe-action/hooks';
import React from 'react';
import type {
  FieldError,
  FieldErrors,
  Resolver,
  UseFormProps,
  UseFormReturn,
} from 'react-hook-form';
import { useForm } from 'react-hook-form';

/**
 * Props for `mapToHookFormErrors`. Also used by the hooks.
 */
export interface ErrorMapperProps {
  joinBy?: string;
}

/**
 * Maps a validation errors object to an object of `FieldErrors` compatible with react-hook-form.
 * You should only call this function directly for advanced use cases, and prefer exported hooks.
 */
export function mapToHookFormErrors<S extends Schema | undefined>(
  validationErrors: ValidationErrors<S> | undefined,
  props?: ErrorMapperProps
) {
  if (!validationErrors || Object.keys(validationErrors).length === 0) {
    return undefined;
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const fieldErrors: FieldErrors<S extends Schema ? Infer<S> : any> = {};

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  function mapper(ve: Record<string, any>, paths: string[] = []) {
    // Map through validation errors.
    for (const key of Object.keys(ve)) {
      // If validation error is an object, recursively call mapper so we go one level deeper
      // at a time. Pass the current paths to the mapper as well.
      if (typeof ve[key] === 'object' && ve[key] && !Array.isArray(ve[key])) {
        mapper(ve[key], [...paths, key]);
      }

      // We're just interested in the `_errors` field, which must be an array.
      if (key === '_errors' && Array.isArray(ve[key])) {
        // Initially set moving reference to root `fieldErrors` object.
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        let ref = fieldErrors as Record<string, any>;

        // Iterate through the paths, create nested objects if needed and move the reference.
        for (let i = 0; i < paths.length - 1; i++) {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          const p = paths[i]!;
          ref[p] ??= {};
          ref = ref[p];
        }

        // The actual path is the last one. If it's undefined, it means that we're at the root level.
        const path = paths.at(-1) ?? 'root';

        // Set the error for the current path.
        ref[path] = {
          type: 'validate',
          message: ve[key].join(props?.joinBy ?? ' '),
        } as FieldError;
      }
    }
  }

  mapper(validationErrors ?? {});
  return fieldErrors;
}

/**
 * Optional props for `useHookFormAction` and `useHookFormOptimisticAction`.
 */
export interface HookProps<
  ServerError,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  FormContext = any,
> {
  errorMapProps?: ErrorMapperProps;
  actionProps?: HookBaseUtils<S> &
    HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data>;
  formProps?: Omit<
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    UseFormProps<S extends Schema ? Infer<S> : any, FormContext>,
    'resolver'
  >;
}

/**
 * Type of the return object of the `useHookFormAction` hook.
 */
export interface UseHookFormActionHookReturn<
  ServerError,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  FormContext = any,
> {
  action: UseActionHookReturn<ServerError, S, BAS, CVE, CBAVE, Data>;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  form: UseFormReturn<S extends Schema ? Infer<S> : any, FormContext>;
  handleSubmitWithAction: (e?: React.BaseSyntheticEvent) => Promise<void>;
  resetFormAndAction: () => void;
}

/**
 * Type of the return object of the `useHookFormOptimisticAction` hook.
 */
export type UseHookFormOptimisticActionHookReturn<
  ServerError,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
  State,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  FormContext = any,
> = Omit<
  UseHookFormActionHookReturn<
    ServerError,
    S,
    BAS,
    CVE,
    CBAVE,
    Data,
    FormContext
  >,
  'action'
> & {
  action: UseOptimisticActionHookReturn<
    ServerError,
    S,
    BAS,
    CVE,
    CBAVE,
    Data,
    State
  >;
};

/**
 * Infer the type of the return object of the `useHookFormAction` hook.
 */
export type InferUseHookFormActionHookReturn<
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  T extends Function,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  FormContext = any,
> = T extends SafeActionFn<
  infer ServerError,
  infer S extends Schema | undefined,
  infer BAS extends readonly Schema[],
  infer CVE,
  infer CBAVE,
  infer Data
>
  ? UseHookFormActionHookReturn<
      ServerError,
      S,
      BAS,
      CVE,
      CBAVE,
      Data,
      FormContext
    >
  : never;

/**
 * Infer the type of the return object of the `useHookFormOptimisticAction` hook.
 */
// eslint-disable-next-line ts/no-unsafe-function-type
export type InferUseHookFormOptimisticActionHookReturn<
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  T extends Function,
  State,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  FormContext = any,
> = T extends SafeActionFn<
  infer ServerError,
  infer S extends Schema | undefined,
  infer BAS extends readonly Schema[],
  infer CVE,
  infer CBAVE,
  infer Data
>
  ? UseHookFormOptimisticActionHookReturn<
      ServerError,
      S,
      BAS,
      CVE,
      CBAVE,
      Data,
      State,
      FormContext
    >
  : never;

/**
 * For more advanced use cases where you want full customization of the hooks used, you can
 * use this hook to map a validation errors object to a `FieldErrors` compatible with react-hook-form.
 * You can then pass the returned `hookFormValidationErrors` property to `useForm`'s `errors` prop.
 *
 * @param validationErrors Validation errors object from `next-safe-action`
 * @returns Object of `FieldErrors` compatible with react-hook-form
 */
export function useHookFormActionErrorMapper<S extends Schema | undefined>(
  validationErrors: ValidationErrors<S> | undefined,
  props?: ErrorMapperProps
) {
  const propsRef = React.useRef(props);

  const hookFormValidationErrors = React.useMemo(
    () => mapToHookFormErrors<S>(validationErrors, propsRef.current),
    [validationErrors]
  );

  return {
    hookFormValidationErrors,
  };
}

/**
 * This hook is a wrapper around `useAction` and `useForm` that makes it easier to use safe actions
 * with react-hook-form. It also maps validation errors to `FieldErrors` compatible with react-hook-form.
 *
 * @param safeAction The safe action
 * @param hookFormResolver A react-hook-form validation resolver
 * @param props Optional props for both `useAction`, `useForm` hooks and error mapper
 * @returns An object containing `action` and `form` controllers, `handleActionSubmit`, and `resetFormAndAction`
 */
export function useHookFormAction<
  ServerError,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  FormContext = any,
>(
  safeAction: HookSafeActionFn<ServerError, S, BAS, CVE, CBAVE, Data>,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  hookFormResolver: Resolver<S extends Schema ? Infer<S> : any, FormContext>,
  props?: HookProps<ServerError, S, BAS, CVE, CBAVE, Data, FormContext>
): UseHookFormActionHookReturn<
  ServerError,
  S,
  BAS,
  CVE,
  CBAVE,
  Data,
  FormContext
> {
  const action = useAction(safeAction, props?.actionProps);

  const { hookFormValidationErrors } = useHookFormActionErrorMapper<S>(
    action.result.validationErrors as ValidationErrors<S> | undefined,
    props?.errorMapProps
  );

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const form = useForm<S extends Schema ? Infer<S> : any, FormContext>({
    ...props?.formProps,
    resolver: hookFormResolver,
    errors: hookFormValidationErrors,
  });

  const handleSubmitWithAction = form.handleSubmit(action.executeAsync);

  const resetFormAndAction = () => {
    form.reset();
    action.reset();
  };

  return {
    action,
    form,
    handleSubmitWithAction,
    resetFormAndAction,
  };
}

/**
 * This hook is a wrapper around `useOptimisticAction` and `useForm` that makes it easier to use safe actions
 * with react-hook-form. It also maps validation errors to `FieldErrors` compatible with react-hook-form.
 *
 * @param safeAction The safe action
 * @param hookFormResolver A react-hook-form validation resolver
 * @param props Required `currentState` and `updateFn` props for the action, and additional optional
 * props for both `useAction`, `useForm` hooks and error mapper
 * @returns An object containing `action` and `form` controllers, `handleActionSubmit`, and `resetFormAndAction`
 */
export function useHookFormOptimisticAction<
  ServerError,
  S extends Schema | undefined,
  BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
  State,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  FormContext = any,
>(
  safeAction: HookSafeActionFn<ServerError, S, BAS, CVE, CBAVE, Data>,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  hookFormResolver: Resolver<S extends Schema ? Infer<S> : any, FormContext>,
  props: HookProps<ServerError, S, BAS, CVE, CBAVE, Data, FormContext> & {
    actionProps: {
      currentState: State;
      updateFn: (
        state: State,
        input: S extends Schema ? InferIn<S> : undefined
      ) => State;
    };
  }
): UseHookFormOptimisticActionHookReturn<
  ServerError,
  S,
  BAS,
  CVE,
  CBAVE,
  Data,
  State,
  FormContext
> {
  const action = useOptimisticAction(safeAction, props.actionProps);

  const { hookFormValidationErrors } = useHookFormActionErrorMapper<S>(
    action.result.validationErrors as ValidationErrors<S> | undefined,
    props.errorMapProps
  );

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const form = useForm<S extends Schema ? Infer<S> : any, FormContext>({
    ...props?.formProps,
    resolver: hookFormResolver,
    errors: hookFormValidationErrors,
  });

  const handleSubmitWithAction = form.handleSubmit(action.executeAsync);

  const resetFormAndAction = () => {
    form.reset();
    action.reset();
  };

  return {
    action,
    form,
    handleSubmitWithAction,
    resetFormAndAction,
  };
}
