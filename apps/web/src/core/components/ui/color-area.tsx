'use client';
import type { ColorAreaProps } from 'react-aria-components';
import { ColorArea as ColorAreaPrimitive } from 'react-aria-components';

import { ColorThumb } from '@/core/components/ui/color-thumb';
import { composeTailwindRenderProps } from '@/core/components/ui/primitive';

function ColorArea({ className, ...props }: ColorAreaProps) {
  return (
    <ColorAreaPrimitive
      {...props}
      className={composeTailwindRenderProps(
        className,
        'size-56 shrink-0 rounded-md bg-muted forced-colors:bg-[GrayText]'
      )}
      data-slot="color-area"
      style={({ defaultStyle, isDisabled }) => ({
        ...defaultStyle,
        background: isDisabled ? undefined : defaultStyle.background,
      })}
    >
      <ColorThumb />
    </ColorAreaPrimitive>
  );
}

export { ColorArea };
