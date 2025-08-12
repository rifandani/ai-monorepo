'use client';

import { Icon } from '@iconify/react';
import { createContext, use } from 'react';
import type {
  CellProps,
  ColumnProps,
  ColumnResizerProps,
  TableHeaderProps as HeaderProps,
  RowProps,
  TableBodyProps,
  TableProps as TablePrimitiveProps,
} from 'react-aria-components';
import {
  Button,
  Cell,
  Collection,
  Column,
  ColumnResizer as ColumnResizerPrimitive,
  composeRenderProps,
  ResizableTableContainer,
  Row,
  TableBody as TableBodyPrimitive,
  TableHeader as TableHeaderPrimitive,
  Table as TablePrimitive,
  useTableOptions,
} from 'react-aria-components';
import { twJoin, twMerge } from 'tailwind-merge';
import { Checkbox } from '@/core/components/ui/checkbox';
import { composeTailwindRenderProps } from '@/core/components/ui/primitive';

interface TableProps extends Omit<TablePrimitiveProps, 'className'> {
  allowResize?: boolean;
  className?: string;
  bleed?: boolean;
  ref?: React.Ref<HTMLTableElement>;
}

const TableContext = createContext<TableProps>({
  allowResize: false,
});

const useTableContext = () => use(TableContext);

function Root(props: TableProps) {
  return (
    <TablePrimitive
      className={
        'w-full min-w-full caption-bottom text-sm/6 outline-hidden [--table-selected-bg:var(--color-secondary)]/50'
      }
      {...props}
    />
  );
}

function Table({ allowResize, className, bleed, ref, ...props }: TableProps) {
  return (
    <TableContext value={{ allowResize, bleed }}>
      <div className="flow-root">
        <div
          className={twMerge(
            '-mx-(--gutter) relative overflow-x-auto whitespace-nowrap [--gutter-y:--spacing(2)] has-data-[slot=table-resizable-container]:overflow-auto',
            className
          )}
        >
          <div
            className={twJoin(
              'inline-block min-w-full align-middle',
              !bleed && 'sm:px-(--gutter)'
            )}
          >
            {allowResize ? (
              <ResizableTableContainer data-slot="table-resizable-container">
                <Root ref={ref} {...props} />
              </ResizableTableContainer>
            ) : (
              <Root {...props} ref={ref} />
            )}
          </div>
        </div>
      </div>
    </TableContext>
  );
}

function ColumnResizer({ className, ...props }: ColumnResizerProps) {
  return (
    <ColumnResizerPrimitive
      {...props}
      className={composeTailwindRenderProps(
        className,
        'absolute top-0 right-0 bottom-0 grid w-px &[data-resizable-direction=left]:cursor-e-resize &[data-resizable-direction=right]:cursor-w-resize touch-none place-content-center px-1 data-[resizable-direction=both]:cursor-ew-resize [&[data-resizing]>div]:bg-primary'
      )}
    >
      <div className="h-full w-px bg-border py-(--gutter-y)" />
    </ColumnResizerPrimitive>
  );
}

function TableBody<T extends object>(props: TableBodyProps<T>) {
  return <TableBodyPrimitive data-slot="table-body" {...props} />;
}

interface TableColumnProps extends ColumnProps {
  className?: string;
  isResizable?: boolean;
}

function TableColumn({
  isResizable = false,
  className,
  ...props
}: TableColumnProps) {
  const { bleed } = useTableContext();
  return (
    <Column
      data-slot="table-column"
      {...props}
      className={composeTailwindRenderProps(
        className,
        twJoin(
          'text-left font-medium text-muted-fg',
          'relative allows-sorting:cursor-default outline-hidden data-dragging:cursor-grabbing',
          'px-4 py-(--gutter-y) first:pl-(--gutter,--spacing(2)) last:pr-(--gutter,--spacing(2))',
          !bleed && 'sm:last:pr-1 sm:first:pl-1',
          isResizable && 'overflow-hidden truncate'
        )
      )}
    >
      {(values) => (
        <div className={'flex items-center gap-2 **:data-[slot=icon]:shrink-0'}>
          {typeof props.children === 'function'
            ? props.children(values)
            : props.children}
          {values.allowsSorting && (
            <span
              className={twMerge(
                'grid size-[1.15rem] flex-none shrink-0 place-content-center rounded bg-secondary text-fg *:data-[slot=icon]:size-3.5 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:transition-transform *:data-[slot=icon]:duration-200',
                values.isHovered ? 'bg-secondary-fg/10' : '',
                className
              )}
            >
              <Icon
                className={
                  values.sortDirection === 'ascending' ? 'rotate-180' : ''
                }
                icon="lucide:chevron-down"
              />
            </span>
          )}
          {isResizable && <ColumnResizer />}
        </div>
      )}
    </Column>
  );
}

interface TableHeaderProps<T extends object> extends HeaderProps<T> {
  ref?: React.Ref<HTMLTableSectionElement>;
}

function TableHeader<T extends object>({
  children,
  ref,
  columns,
  className,
  ...props
}: TableHeaderProps<T>) {
  const { bleed } = useTableContext();
  const { selectionBehavior, selectionMode, allowsDragging } =
    useTableOptions();
  return (
    <TableHeaderPrimitive
      className={composeTailwindRenderProps(className, 'border-b')}
      data-slot="table-header"
      ref={ref}
      {...props}
    >
      {allowsDragging && (
        <Column
          className={twMerge(
            'w-0 max-w-8 px-4 first:pl-(--gutter,--spacing(2)) last:pr-(--gutter,--spacing(2))',
            !bleed && 'sm:last:pr-1 sm:first:pl-1'
          )}
          data-slot="table-column"
        />
      )}
      {selectionBehavior === 'toggle' && (
        <Column
          className={twMerge(
            'w-0 max-w-8 px-4 first:pl-(--gutter,--spacing(2)) last:pr-(--gutter,--spacing(2))',
            !bleed && 'sm:last:pr-1 sm:first:pl-1'
          )}
          data-slot="table-column"
        >
          {selectionMode === 'multiple' && <Checkbox slot="selection" />}
        </Column>
      )}
      <Collection items={columns}>{children}</Collection>
    </TableHeaderPrimitive>
  );
}

interface TableRowProps<T extends object> extends RowProps<T> {
  ref?: React.Ref<HTMLTableRowElement>;
}

function TableRow<T extends object>({
  children,
  className,
  columns,
  id,
  ref,
  ...props
}: TableRowProps<T>) {
  const { selectionBehavior, allowsDragging } = useTableOptions();
  return (
    <Row
      data-slot="table-row"
      id={id}
      ref={ref}
      {...props}
      className={composeRenderProps(
        className,
        (
          className,
          {
            isSelected,
            selectionMode,
            isFocusVisibleWithin,
            isDragging,
            isDisabled,
          }
        ) =>
          twMerge(
            'group relative cursor-default border-b text-muted-fg outline-transparent ring-primary last:border-b-0',
            isDragging && 'outline outline-blue-500',
            isSelected &&
              'bg-(--table-selected-bg) text-fg hover:bg-(--table-selected-bg)/50',
            (props.href || props.onAction || selectionMode === 'multiple') &&
              'hover:bg-(--table-selected-bg) hover:text-fg',
            (props.href || props.onAction || selectionMode === 'multiple') &&
              isFocusVisibleWithin &&
              'bg-(--table-selected-bg)/50 selected:bg-(--table-selected-bg)/50 text-fg',
            isDisabled && 'opacity-50',
            className
          )
      )}
    >
      {allowsDragging && (
        <TableCell
          className={'cursor-grab dragging:cursor-grabbing ring-primary'}
        >
          <Button
            className={
              'grid place-content-center rounded-xs px-[calc(var(--gutter)/2)] outline-hidden focus-visible:ring focus-visible:ring-ring'
            }
            slot="drag"
          >
            <Icon icon="lucide:menu" />
          </Button>
        </TableCell>
      )}
      {selectionBehavior === 'toggle' && (
        <TableCell>
          <Checkbox slot="selection" />
        </TableCell>
      )}
      <Collection items={columns}>{children}</Collection>
    </Row>
  );
}

function TableCell({ className, ...props }: CellProps) {
  const { allowResize, bleed } = useTableContext();
  return (
    <Cell
      data-slot="table-cell"
      {...props}
      className={composeTailwindRenderProps(
        className,
        twJoin(
          'group px-4 py-(--gutter-y) align-middle outline-hidden first:pl-(--gutter,--spacing(2)) last:pr-(--gutter,--spacing(2)) group-has-data-focus-visible-within:text-fg',
          !bleed && 'sm:last:pr-1 sm:first:pl-1',
          allowResize && 'overflow-hidden truncate'
        )
      )}
    />
  );
}

Table.Body = TableBody;
Table.Cell = TableCell;
Table.Column = TableColumn;
Table.Header = TableHeader;
Table.Row = TableRow;

export type { TableColumnProps, TableProps, TableRowProps };
export { Table };
