'use client';

import { Icon } from '@iconify/react';
import type { SearchFieldProps as SearchFieldPrimitiveProps } from 'react-aria-components';
import {
  Button,
  SearchField as SearchFieldPrimitive,
} from 'react-aria-components';
import type { FieldProps } from '@/core/components/ui/field';
import {
  Description,
  FieldError,
  FieldGroup,
  Input,
  Label,
} from '@/core/components/ui/field';
import { Loader } from '@/core/components/ui/loader';
import { composeTailwindRenderProps } from '@/core/components/ui/primitive';

interface SearchFieldProps extends SearchFieldPrimitiveProps, FieldProps {
  isPending?: boolean;
}

function SearchField({
  children,
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
        'group/search-field relative flex flex-col gap-y-1 *:data-[slot=label]:font-medium'
      )}
    >
      {(values) => (
        <>
          {typeof children === 'function'
            ? children(values)
            : children || (
                <FieldGroup>
                  {label && <Label>{label}</Label>}
                  {isPending ? (
                    <Loader variant="spin" />
                  ) : (
                    <Icon icon="lucide:search" />
                  )}
                  <Input placeholder={placeholder ?? 'Search...'} />

                  <Button
                    className={
                      'grid place-content-center pressed:text-fg text-muted-fg hover:text-fg group-empty/search-field:invisible'
                    }
                  >
                    <Icon icon="lucide:x" />
                  </Button>
                  {description && <Description>{description}</Description>}
                  <FieldError>{errorMessage}</FieldError>
                </FieldGroup>
              )}
        </>
      )}
    </SearchFieldPrimitive>
  );
}

export type { SearchFieldProps };
export { SearchField };
