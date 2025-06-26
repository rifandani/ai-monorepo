'use client';

import { AnimatePresence, motion } from 'motion/react';
import { use } from 'react';
import type {
  DialogProps,
  DialogTriggerProps,
  HeadingProps,
  ModalOverlayProps,
  TextProps,
} from 'react-aria-components';
import {
  Button as ButtonPrimitive,
  Dialog,
  DialogTrigger,
  Heading,
  ModalOverlay,
  Modal as ModalPrimitive,
  OverlayTriggerStateContext,
  Text,
} from 'react-aria-components';
import { twJoin, twMerge } from 'tailwind-merge';
import { Button, type ButtonProps } from '@/core/components/ui/button';

const DrawerRoot = motion.create(ModalPrimitive);
const DrawerOverlay = motion.create(ModalOverlay);

const Drawer = (props: DialogTriggerProps) => <DialogTrigger {...props} />;

interface DrawerContentProps
  extends Omit<ModalOverlayProps, 'className' | 'children' | 'isDismissable'>,
    Pick<
      DialogProps,
      'aria-label' | 'aria-labelledby' | 'role' | 'children' | 'className'
    > {
  isFloat?: boolean;
  isBlurred?: boolean;
  className?: string;
  style?: React.CSSProperties;
  side?: 'top' | 'bottom' | 'left' | 'right';
  notch?: boolean;
}

function DrawerContent({
  side = 'bottom',
  isFloat = false,
  isBlurred,
  notch = true,
  children,
  className,
  ...props
}: DrawerContentProps) {
  const state = use(OverlayTriggerStateContext);

  return (
    <AnimatePresence>
      {(props?.isOpen || state?.isOpen) && (
        <DrawerOverlay
          animate={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
          className={
            'fixed inset-0 z-50 will-change-auto [--visual-viewport-vertical-padding:32px] '
          }
          exit={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
          isDismissable
          isOpen={props?.isOpen || state?.isOpen}
          onOpenChange={props?.onOpenChange || state?.setOpen}
        >
          {/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: xxx */}
          {({ state: _state }) => (
            <DrawerRoot
              animate={{ x: 0, y: 0 }}
              className={twJoin(
                'fixed max-h-full touch-none overflow-hidden bg-bg align-middle text-fg ring ring-input will-change-transform ',
                side === 'top' &&
                  (isFloat
                    ? 'inset-x-2 top-2 rounded-lg'
                    : 'inset-x-0 top-0 rounded-b-2xl'),
                side === 'right' &&
                  [
                    'w-full max-w-xs overflow-y-auto',
                    '**:[[slot=header]]:text-left',
                    isFloat
                      ? 'inset-y-2 right-2 rounded-lg'
                      : 'inset-y-0 right-0 h-auto',
                  ].join(' '),
                side === 'bottom' &&
                  (isFloat
                    ? 'inset-x-2 bottom-2 rounded-lg'
                    : 'inset-x-0 bottom-0 rounded-t-2xl'),
                side === 'left' &&
                  [
                    'w-full max-w-xs overflow-y-auto',
                    '**:[[slot=header]]:text-left',
                    isFloat
                      ? 'inset-y-2 left-2 rounded-lg'
                      : 'inset-y-0 left-0 h-auto',
                  ].join(' '),
                className
              )}
              drag={side === 'left' || side === 'right' ? 'x' : 'y'}
              dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
              dragElastic={{
                top: side === 'top' ? 1 : 0,
                bottom: side === 'bottom' ? 1 : 0,
                left: side === 'left' ? 1 : 0,
                right: side === 'right' ? 1 : 0,
              }}
              dragPropagation
              dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
              exit={{
                x: side === 'left' ? '-100%' : side === 'right' ? '100%' : 0,
                y: side === 'top' ? '-100%' : side === 'bottom' ? '100%' : 0,
              }}
              initial={{
                x: side === 'left' ? '-100%' : side === 'right' ? '100%' : 0,
                y: side === 'top' ? '-100%' : side === 'bottom' ? '100%' : 0,
              }}
              // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: xxx
              onDragEnd={(_, { offset, velocity }) => {
                if (
                  side === 'bottom' &&
                  (velocity.y > 150 || offset.y > screen.height * 0.25)
                ) {
                  _state.close();
                }
                if (
                  side === 'top' &&
                  (velocity.y < -150 || offset.y < screen.height * 0.25)
                ) {
                  _state.close();
                }
                if (side === 'left' && velocity.x < -150) {
                  _state.close();
                }
                if (side === 'right' && velocity.x > 150) {
                  _state.close();
                }
              }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              whileDrag={{ cursor: 'grabbing' }}
            >
              <Dialog
                aria-label="Drawer"
                className={twJoin(
                  'relative flex flex-col overflow-hidden outline-hidden will-change-auto ',
                  side === 'top' || side === 'bottom'
                    ? 'mx-auto max-h-[calc(var(--visual-viewport-height)-var(--visual-viewport-vertical-padding))] max-w-lg '
                    : 'h-full'
                )}
                role="dialog"
              >
                {notch && side === 'bottom' && (
                  <div
                    className={
                      'notch sticky top-0 mx-auto mt-2.5 h-1.5 w-10 shrink-0 touch-pan-y rounded-full bg-fg/20 '
                    }
                  />
                )}
                {children as React.ReactNode}
                {notch && side === 'top' && (
                  <div
                    className={
                      'notch sticky bottom-0 mx-auto mb-2.5 h-1.5 w-10 shrink-0 touch-pan-y rounded-full bg-fg/20 '
                    }
                  />
                )}
              </Dialog>
            </DrawerRoot>
          )}
        </DrawerOverlay>
      )}
    </AnimatePresence>
  );
}

function DrawerHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        'flex flex-col p-4 text-center sm:text-left ',
        className
      )}
      slot="header"
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: HeadingProps) {
  return (
    <Heading
      className={twMerge('font-semibold text-lg/8', className)}
      slot="title"
      {...props}
    />
  );
}

function DrawerDescription({ className, ...props }: TextProps) {
  return (
    <Text
      className={twMerge('text-muted-fg text-sm', className)}
      slot="description"
      {...props}
    />
  );
}

function DrawerBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        'isolate flex max-h-[calc(var(--visual-viewport-height)-var(--visual-viewport-vertical-padding))] flex-col overflow-auto px-4 py-1 will-change-scroll ',
        className
      )}
      slot="body"
      {...props}
    />
  );
}

function DrawerFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        'isolate mt-auto flex flex-col-reverse justify-end gap-2 p-4 sm:flex-row ',
        className
      )}
      slot="footer"
      {...props}
    />
  );
}

function DrawerClose({
  className,
  intent = 'outline',
  ref,
  ...props
}: ButtonProps) {
  return (
    <Button
      className={className}
      intent={intent}
      ref={ref}
      slot="close"
      {...props}
    />
  );
}

Drawer.Trigger = ButtonPrimitive;
Drawer.Footer = DrawerFooter;
Drawer.Header = DrawerHeader;
Drawer.Title = DrawerTitle;
Drawer.Description = DrawerDescription;
Drawer.Body = DrawerBody;
Drawer.Content = DrawerContent;
Drawer.Close = DrawerClose;

export { Drawer };
export type { DrawerContentProps };
