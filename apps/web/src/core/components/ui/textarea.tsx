'use client';

import type React from 'react';
import type {
  TextFieldProps as TextFieldPrimitiveProps,
  ValidationResult,
} from 'react-aria-components';
import {
  TextArea as TextAreaPrimitive,
  TextField as TextFieldPrimitive,
  composeRenderProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { Description, FieldError, Label } from './field';
import { composeTailwindRenderProps, focusStyles } from './primitive';

const textareaStyles = tv({
  extend: focusStyles,
  base: 'field-sizing-content max-h-96 min-h-16 w-full min-w-0 rounded-lg border border-input px-2.5 py-2 text-base shadow-xs outline-hidden transition duration-200 disabled:opacity-50 sm:text-sm',
});

interface TextareaProps extends TextFieldPrimitiveProps {
  autoSize?: boolean;
  label?: string;
  placeholder?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  className?: string;
  textAreaRef?: React.RefObject<HTMLTextAreaElement>;
}

function Textarea({
  className,
  placeholder,
  label,
  description,
  errorMessage,
  textAreaRef,
  ...props
}: TextareaProps) {
  return (
    <TextFieldPrimitive
      {...props}
      className={composeTailwindRenderProps(
        className,
        'group flex flex-col gap-y-1.5'
      )}
    >
      {label && <Label>{label}</Label>}
      <TextAreaPrimitive
        ref={textAreaRef}
        placeholder={placeholder}
        className={composeRenderProps(className, (className, renderProps) =>
          textareaStyles({
            ...renderProps,
            className,
          })
        )}
      />
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </TextFieldPrimitive>
  );
}

export type { TextareaProps };
export { Textarea };
