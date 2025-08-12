'use client';

import { Icon } from '@iconify/react';
import type { FileTriggerProps as FileTriggerPrimitiveProps } from 'react-aria-components';
import { FileTrigger as FileTriggerPrimitive } from 'react-aria-components';
import type { VariantProps } from 'tailwind-variants';
import type { buttonStyles } from '@/core/components/ui/button';
import { Button } from '@/core/components/ui/button';
import { Loader } from '@/core/components/ui/loader';

interface FileTriggerProps
  extends FileTriggerPrimitiveProps,
    VariantProps<typeof buttonStyles> {
  isDisabled?: boolean;
  ref?: React.RefObject<HTMLInputElement>;
  className?: string;
}

function FileTrigger({
  intent = 'outline',
  size = 'md',
  isCircle = false,
  ref,
  className,
  ...props
}: FileTriggerProps) {
  return (
    <FileTriggerPrimitive ref={ref} {...props}>
      <Button
        className={className}
        intent={intent}
        isCircle={isCircle}
        isDisabled={props.isDisabled}
        size={size}
      >
        {props.isPending ? (
          <Loader />
        ) : props.defaultCamera ? (
          <Icon icon="lucide:camera" />
        ) : props.acceptDirectory ? (
          <Icon icon="lucide:folder" />
        ) : (
          <Icon icon="lucide:paperclip" />
        )}
        {props.children ? (
          props.children
        ) : (
          <>
            {props.allowsMultiple
              ? 'Browse a files'
              : props.acceptDirectory
                ? 'Browse'
                : 'Browse a file'}
            ...
          </>
        )}
      </Button>
    </FileTriggerPrimitive>
  );
}

export type { FileTriggerProps };
export { FileTrigger };
