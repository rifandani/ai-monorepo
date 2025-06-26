'use client';

import { Icon } from '@iconify/react';
import type { TextInputDOMProps } from '@react-types/shared';
import type React from 'react';
import { useState } from 'react';
import type { TextFieldProps as TextFieldPrimitiveProps } from 'react-aria-components';
import {
  Button as ButtonPrimitive,
  TextField as TextFieldPrimitive,
} from 'react-aria-components';
import type { FieldProps } from './field';
import { Description, FieldError, FieldGroup, Input, Label } from './field';
import { Loader } from './loader';
import { composeTailwindRenderProps } from './primitive';

type InputType = Exclude<TextInputDOMProps['type'], 'password'>;

interface BaseTextFieldProps extends TextFieldPrimitiveProps, FieldProps {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  isPending?: boolean;
  className?: string;
}

interface RevealableTextFieldProps extends BaseTextFieldProps {
  isRevealable: true;
  type: 'password';
}

interface NonRevealableTextFieldProps extends BaseTextFieldProps {
  isRevealable?: never;
  type?: InputType;
}

type TextFieldProps = RevealableTextFieldProps | NonRevealableTextFieldProps;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: xxx
function TextField({
  placeholder,
  label,
  description,
  errorMessage,
  prefix,
  suffix,
  isPending,
  className,
  isRevealable,
  type,
  ...props
}: TextFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const inputType = isRevealable
    ? isPasswordVisible
      ? 'text'
      : 'password'
    : type;
  const handleTogglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };
  return (
    <TextFieldPrimitive
      type={inputType}
      {...props}
      className={composeTailwindRenderProps(
        className,
        'group flex flex-col gap-y-1'
      )}
    >
      {props.children ? (
        props.children
      ) : (
        <>
          {label && <Label>{label}</Label>}
          <FieldGroup
            data-loading={isPending ? 'true' : undefined}
            isDisabled={props.isDisabled}
            isInvalid={!!errorMessage}
          >
            {prefix && typeof prefix === 'string' ? (
              <span className="ml-2 text-muted-fg">{prefix}</span>
            ) : (
              prefix
            )}
            <Input placeholder={placeholder} />
            {isRevealable ? (
              <ButtonPrimitive
                aria-label="Toggle password visibility"
                className="relative mr-1 grid shrink-0 place-content-center rounded-sm border-transparent outline-hidden data-focus-visible:*:data-[slot=icon]:text-primary *:data-[slot=icon]:text-muted-fg"
                onPress={handleTogglePasswordVisibility}
                type="button"
              >
                {isPasswordVisible ? (
                  <Icon className="size-4" icon="mdi:eye-off" />
                ) : (
                  <Icon className="size-4" icon="mdi:eye" />
                )}
              </ButtonPrimitive>
            ) : isPending ? (
              <Loader variant="spin" />
            ) : suffix ? (
              typeof suffix === 'string' ? (
                <span className="mr-2 text-muted-fg">{suffix}</span>
              ) : (
                suffix
              )
            ) : null}
          </FieldGroup>
          {description && <Description>{description}</Description>}
          <FieldError>{errorMessage}</FieldError>
        </>
      )}
    </TextFieldPrimitive>
  );
}

export type { TextFieldProps };
export { TextField };
