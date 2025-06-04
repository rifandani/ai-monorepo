'use client';

import { useResetState } from '@workspace/core/hooks/use-reset-state';
import { useTheme } from 'next-themes';
import React from 'react';
import type { Toaster } from 'sonner';

export type ToastContextInterface = ReturnType<typeof useCreateToastContext>;
type ToasterProps = React.ComponentPropsWithoutRef<typeof Toaster>;

export function useCreateToastContext() {
  const { theme } = useTheme();
  const [toastConfig, setToastConfig, resetToastConfig] =
    useResetState<ToasterProps>({
      duration: 3_000,
      position: 'bottom-right',
      theme: theme
        ? theme === 'auto'
          ? 'system'
          : (theme as 'light' | 'dark')
        : 'system',
      // className: 'toaster group',
      richColors: true,
      // icons: {
      //   info: <Icon icon="tabler:info-circle-filled" />,
      //   error: <Icon icon="tabler:alert-triangle-filled" />,
      //   warning: <Icon icon="tabler:alert-octagon-filled" />,
      //   success: <Icon icon="tabler:circle-check-filled" />,
      //   loading: <Loader />,
      // },
      toastOptions: {
        // unstyled: true,
        // closeButton: true,
        classNames: {
          toast: 'toast border-0! inset-ring! inset-ring-fg/10!',
          title: 'title',
          description: 'description',
          actionButton: 'bg-primary! hover:bg-primary/90! text-primary-fg!',
          cancelButton:
            'bg-transparent! hover:bg-secondary! hover:text-secondary-fg!',
          closeButton: 'close-button',
          // toast: twMerge(
          //   'not-has-data-description:**:data-title:font-normal! text-[0.925rem]',
          //   'has-data-description:**:data-title:font-medium [&:has([data-description])_[data-title]]:text-base!',
          //   'has-data-[slot=icon]:**:data-content:pl-0',
          //   'has-data-button:*:data-content:mb-10',
          //   'has-data-button:**:data-close-button:hidden! flex w-full rounded-xl p-4',
          //   'inset-ring-1 inset-ring-current/10 backdrop-blur-3xl',
          // ),
          // icon: 'absolute top-[0.2rem] [--toast-icon-margin-end:7px] *:data-[slot=icon]:text-fg *:data-[slot=icon]:size-4.5 **:data-[slot=icon]:text-current',
          // title: '',
          // description: '',
          // default: 'bg-bg text-fg [--gray2:theme(--color-fg/10%)]',
          // content: 'pr-6 *:data-description:text-current/65! *:data-description:text-sm!',
          // error:
          //   'inset-ring-danger/15 dark:inset-ring-danger/25 [--error-bg:theme(--color-danger/10%)] [--error-border:transparent] [--error-text:var(--color-danger)]',
          // info: 'inset-ring-sky-600/15 dark:inset-ring-sky-500/20 [--info-border:transparent] [--info-bg:theme(--color-sky-500/10%)] [--info-text:var(--color-sky-700)] dark:[--info-bg:theme(--color-sky-500/15%)] dark:[--info-text:var(--color-sky-400)]',
          // warning:
          //   'inset-ring-warning/30 dark:inset-ring-warning/15 [--warning-bg:theme(--color-warning/20%)] dark:[--warning-bg:theme(--color-warning/10%)] [--warning-border:transparent] [--warning-text:var(--color-warning-fg)] dark:[--warning-text:var(--color-warning)]',
          // success:
          //   'inset-ring-success/20 [--success-bg:theme(--color-success/80%)] dark:[--success-bg:theme(--color-success/20%)] [--success-border:transparent] [--success-text:#fff] dark:[--success-text:var(--color-success)]',
          // cancelButton: buttonStyles({
          //   className:
          //     'hover:border-secondary-fg/10 hover:bg-secondary/90 self-start absolute bottom-4 left-4 justify-self-start',
          //   size: 'extra-small',
          //   intent: 'outline',
          // }),
          // actionButton: buttonStyles({
          //   className: 'absolute bottom-4 right-4 self-end justify-self-end',
          //   size: 'extra-small',
          // }),
          // closeButton:
          //   '*:[svg]:size-12 size-6! rounded-md! [--gray1:transparent] [--gray4:transparent] [--gray5:transparent] [--gray12:current] [--toast-close-button-start:full] [--toast-close-button-end:-6px] [--toast-close-button-transform:translate(-75%,60%)] absolute',
        },
      },
    });

  const actions = React.useMemo(
    () => ({
      setToastConfig,
      resetToastConfig,
    }),
    [setToastConfig, resetToastConfig]
  );

  return React.useMemo(
    () => [toastConfig, actions] as const,
    [toastConfig, actions]
  );
}

export const ToastContext = React.createContext<ToastContextInterface>(
  {} as ToastContextInterface
);
