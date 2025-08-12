import { twMerge } from 'tailwind-merge';

function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        'group/card flex flex-col gap-(--card-spacing) rounded-lg border bg-bg py-(--card-spacing) text-fg shadow-xs [--card-spacing:--spacing(6)] has-[table]:overflow-hidden has-[table]:not-has-data-[slot=card-footer]:pb-0 **:data-[slot=table-header]:bg-muted/50 has-[table]:**:data-[slot=card-footer]:border-t **:[table]:overflow-hidden',
        className
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
      className={twMerge(
        'grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto]',
        className
      )}
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

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={twMerge(
        'text-balance font-semibold text-fg text-lg/6 sm:text-base/6',
        className
      )}
      data-slot="card-title"
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
      className={twMerge(
        'row-start-2 text-pretty text-muted-fg text-sm',
        className
      )}
      data-slot="card-description"
      {...props}
    />
  );
}

function CardAction({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className
      )}
      data-slot="card-action"
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
      className={twMerge('px-(--card-spacing) has-[table]:border-t', className)}
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
      className={twMerge(
        'flex items-center px-(--card-spacing) group-has-[table]/card:pt-(--card-spacing) [.border-t]:pt-6',
        className
      )}
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
Card.Action = CardAction;

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
