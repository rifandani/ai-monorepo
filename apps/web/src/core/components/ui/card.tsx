import type React from 'react';
import { twMerge } from 'tailwind-merge';
import { Heading } from './heading';

function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        className,
        'rounded-lg border bg-bg text-fg shadow-xs has-[table]:overflow-hidden **:data-[slot=table-header]:bg-muted/50 has-[table]:**:data-[slot=card-footer]:border-t **:[table]:overflow-hidden'
      )}
      data-slot="card"
      {...props}
    />
  );
}

interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

function CardHeader({
  className,
  title,
  description,
  children,
  ...props
}: HeaderProps) {
  return (
    <div
      className={twMerge('flex flex-col gap-y-1 px-6 py-5', className)}
      data-slot="card-header"
      {...props}
    >
      {title && <CardTitle>{title}</CardTitle>}
      {description && <CardDescription>{description}</CardDescription>}
      {!title && typeof children === 'string' ? (
        <CardTitle>{children}</CardTitle>
      ) : (
        children
      )}
    </div>
  );
}

function CardTitle({
  className,
  level = 3,
  ...props
}: React.ComponentProps<typeof Heading>) {
  return (
    <Heading
      className={twMerge(
        'font-semibold leading-none tracking-tight sm:leading-6',
        className
      )}
      data-slot="card-title"
      level={level}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={twMerge('text-muted-fg text-sm', className)}
      data-slot="description"
      {...props}
    />
  );
}

function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        'px-6 pb-6 has-[table]:border-t has-[[data-slot=table-header]]:bg-muted/40 has-[table]:p-0 **:data-[slot=table-cell]:px-6 **:data-[slot=table-column]:px-6 [&:has(table)+[data-slot=card-footer]]:py-5',
        className
      )}
      data-slot="card-content"
      {...props}
    />
  );
}

function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge('flex items-center p-6 pt-0', className)}
      data-slot="card-footer"
      {...props}
    />
  );
}

Card.Content = CardContent;
Card.Description = CardDescription;
Card.Footer = CardFooter;
Card.Header = CardHeader;
Card.Title = CardTitle;

export { Card };
