'use client';

import { motion } from 'motion/react';
import type React from 'react';
import type { ProgressBarProps as ProgressBarPrimitiveProps } from 'react-aria-components';
import { ProgressBar as ProgressBarPrimitive } from 'react-aria-components';
import { Label } from './field';
import { composeTailwindRenderProps } from './primitive';

interface ProgressBarProps extends ProgressBarPrimitiveProps {
  label?: string;
  ref?: React.RefObject<HTMLDivElement>;
}

function ProgressBar({ label, ref, className, ...props }: ProgressBarProps) {
  return (
    <ProgressBarPrimitive
      className={composeTailwindRenderProps(className, 'flex flex-col')}
      ref={ref}
      {...props}
    >
      {({ percentage, valueText, isIndeterminate }) => (
        <>
          <div className="flex justify-between gap-2">
            {label && <Label>{label}</Label>}
            <span className="text-muted-fg text-sm tabular-nums">
              {valueText}
            </span>
          </div>
          <div className="-outline-offset-1 relative mt-1 h-2 min-w-64 overflow-hidden rounded-full bg-secondary outline-1 outline-transparent">
            {isIndeterminate ? (
              <motion.div
                animate={{ left: ['0%', '100%', '0%'] }}
                className="absolute top-0 h-full rounded-full bg-primary forced-colors:bg-[Highlight]"
                data-slot="progress-content"
                initial={{ left: '0%', width: '40%' }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 2,
                  ease: 'easeInOut',
                }}
              />
            ) : (
              <motion.div
                animate={{ width: `${percentage}%` }}
                className="absolute top-0 left-0 h-full rounded-full bg-primary forced-colors:bg-[Highlight]"
                data-slot="progress-content"
                initial={{ width: '0%' }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            )}
          </div>
        </>
      )}
    </ProgressBarPrimitive>
  );
}

export type { ProgressBarProps };
export { ProgressBar };
