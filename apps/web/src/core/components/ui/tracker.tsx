'use client';

import { useState } from 'react';
import { Pressable } from 'react-aria-components';
import { twJoin, twMerge } from 'tailwind-merge';
import { Tooltip } from '@/core/components/ui/tooltip';

interface TrackerBlockProps {
  key?: string | number;
  color?: string;
  tooltip?: string;
  defaultBackgroundColor?: string;
  disabledTooltip?: boolean;
}

function Block({
  color,
  tooltip,
  disabledTooltip,
  defaultBackgroundColor = 'bg-secondary',
}: TrackerBlockProps) {
  const [open, setOpen] = useState(false);

  return disabledTooltip ? (
    <div
      className={
        'size-full overflow-hidden px-[0.5px] transition first:rounded-l-[4px] first:pl-0 last:rounded-r-[4px] last:pr-0 sm:px-px'
      }
    >
      <div
        className={twJoin(
          'size-full rounded-[1px]',
          color || defaultBackgroundColor,
          'hover:opacity-50'
        )}
      />
    </div>
  ) : (
    <Tooltip closeDelay={0} delay={0} isOpen={open} onOpenChange={setOpen}>
      <Pressable onPress={() => setOpen(true)}>
        <div
          className={
            'size-full overflow-hidden px-[0.5px] transition first:rounded-l-[4px] first:pl-0 last:rounded-r-[4px] last:pr-0 sm:px-px'
          }
        >
          <div
            className={twJoin(
              'size-full rounded-[1px]',
              color || defaultBackgroundColor,
              'hover:opacity-50'
            )}
          />
        </div>
      </Pressable>
      <Tooltip.Content
        className="px-2 py-1.5 text-xs"
        intent="inverse"
        offset={10}
        placement="top"
        showArrow={false}
      >
        {tooltip}
      </Tooltip.Content>
    </Tooltip>
  );
}

interface TrackerProps
  extends React.ComponentProps<'div'>,
    Pick<TrackerBlockProps, 'disabledTooltip'> {
  data: TrackerBlockProps[];
  defaultBackgroundColor?: string;
}

function Tracker({
  data = [],
  disabledTooltip: _disabledTooltip = false,
  className,
  ref,
  ...props
}: TrackerProps) {
  return (
    <div
      className={twMerge('group flex h-8 w-full items-center', className)}
      ref={ref}
      {...props}
    >
      {data.map((props, index) => (
        <Block disabledTooltip key={props.key ?? index} {...props} />
      ))}
    </div>
  );
}

export { Tracker, type TrackerBlockProps };
