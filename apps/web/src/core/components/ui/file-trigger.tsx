'use client';

import { Icon } from '@iconify/react';
import type React from 'react';
import type { FileTriggerProps as FileTriggerPrimitiveProps } from 'react-aria-components';
import { FileTrigger as FileTriggerPrimitive } from 'react-aria-components';
import type { VariantProps } from 'tailwind-variants';
import type { buttonStyles } from './button';
import { Button } from './button';

interface FileTriggerProps
  extends FileTriggerPrimitiveProps,
    VariantProps<typeof buttonStyles> {
  withIcon?: boolean;
  isDisabled?: boolean;
  ref?: React.RefObject<HTMLInputElement>;
}

function FileTrigger({
  intent = 'outline',
  size = 'medium',
  shape = 'square',
  withIcon = true,
  ref,
  ...props
}: FileTriggerProps) {
  return (
    <FileTriggerPrimitive ref={ref} {...props}>
      <Button
        isDisabled={props.isDisabled}
        intent={intent}
        size={size}
        shape={shape}
      >
        {withIcon &&
          (props.defaultCamera ? (
            <Icon icon="mdi:camera" />
          ) : props.acceptDirectory ? (
            <Icon icon="mdi:folder" />
          ) : (
            <Icon icon="mdi:paperclip" />
          ))}
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
