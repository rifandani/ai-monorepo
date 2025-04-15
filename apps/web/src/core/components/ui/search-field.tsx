'use client';

import { Icon } from '@iconify/react';
import type {
  SearchFieldProps as SearchFieldPrimitiveProps,
  ValidationResult,
} from 'react-aria-components';
import { SearchField as SearchFieldPrimitive } from 'react-aria-components';

import { Button } from './button';
import { Description, FieldError, FieldGroup, Input, Label } from './field';
import { Loader } from './loader';
import { composeTailwindRenderProps } from './primitive';

interface SearchFieldProps extends SearchFieldPrimitiveProps {
  label?: string;
  placeholder?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  isPending?: boolean;
}

function SearchField({
  className,
  placeholder,
  label,
  description,
  errorMessage,
  isPending,
  ...props
}: SearchFieldProps) {
  return (
    <SearchFieldPrimitive
      aria-label={placeholder ?? props['aria-label'] ?? 'Search...'}
      {...props}
      className={composeTailwindRenderProps(
        className,
        'group/search-field flex flex-col gap-y-1'
      )}
    >
      {props.children ? (
        props.children
      ) : (
        <>
          {label && <Label>{label}</Label>}
          <FieldGroup>
            {isPending ? (
              <Loader variant="spin" />
            ) : (
              <Icon icon="mdi:magnify" className="size-4" />
            )}
            <Input placeholder={placeholder ?? 'Search...'} />

            <Button
              intent="plain"
              className="size-8 pressed:bg-transparent pressed:text-fg text-muted-fg hover:bg-transparent hover:text-fg group-data-empty/search-field:invisible"
            >
              <Icon icon="mdi:close" className="size-4" />
            </Button>
          </FieldGroup>
          {description && <Description>{description}</Description>}
          <FieldError>{errorMessage}</FieldError>
        </>
      )}
    </SearchFieldPrimitive>
  );
}

export type { SearchFieldProps };
export { SearchField };
