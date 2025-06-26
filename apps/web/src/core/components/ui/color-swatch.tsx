'use client';

import { parseColor } from '@react-stately/color';
import type { ColorSwatchProps } from 'react-aria-components';
import { ColorSwatch as ColorSwatchPrimitive } from 'react-aria-components';
import { composeTailwindRenderProps } from './primitive';

const defaultColor = parseColor('hsl(216, 98%, 52%)');

function ColorSwatch({ className, ...props }: ColorSwatchProps) {
  return (
    <ColorSwatchPrimitive
      aria-label={props['aria-label'] ?? 'Color swatch'}
      className={composeTailwindRenderProps(
        className,
        'inset-ring-1 inset-ring-fg/10 size-8 shrink-0 rounded-md'
      )}
      data-slot="color-swatch"
      {...props}
    />
  );
}

export { ColorSwatch, defaultColor };
