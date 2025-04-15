import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import type * as React from 'react';
import { twMerge } from 'tailwind-merge';

function ScrollArea({
  ref,
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
  ref?: React.RefObject<React.ComponentRef<
    typeof ScrollAreaPrimitive.Root
  > | null>;
}) {
  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={twMerge('overflow-hidden', className)}
      {...props}
    >
      {children}
      <ScrollAreaPrimitive.Corner />
      <ScrollBar orientation="vertical" />
    </ScrollAreaPrimitive.Root>
  );
}

ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

function ScrollViewport({
  ref,
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Viewport> & {
  ref?: React.RefObject<React.ComponentRef<
    typeof ScrollAreaPrimitive.Viewport
  > | null>;
}) {
  return (
    <ScrollAreaPrimitive.Viewport
      ref={ref}
      className={twMerge('size-full rounded-[inherit]', className)}
      {...props}
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
  );
}

ScrollViewport.displayName = ScrollAreaPrimitive.Viewport.displayName;

function ScrollBar({
  ref,
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar> & {
  ref?: React.RefObject<React.ComponentRef<
    typeof ScrollAreaPrimitive.Scrollbar
  > | null>;
}) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      ref={ref}
      orientation={orientation}
      className={twMerge(
        'flex select-none data-[state=hidden]:animate-fd-fade-out',
        orientation === 'vertical' && 'h-full w-1.5',
        orientation === 'horizontal' && 'h-1.5 flex-col',
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-fd-border" />
    </ScrollAreaPrimitive.Scrollbar>
  );
}
ScrollBar.displayName = ScrollAreaPrimitive.Scrollbar.displayName;

export { ScrollArea, ScrollBar, ScrollViewport };
