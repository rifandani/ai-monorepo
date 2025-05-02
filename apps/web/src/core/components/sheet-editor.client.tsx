'use client';

import { useTheme } from 'next-themes';
import { parse, unparse } from 'papaparse';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { DataGrid, textEditor } from 'react-data-grid';
import { twMerge } from 'tailwind-merge';

import 'react-data-grid/lib/styles.css';

type SheetEditorProps = {
  content: string;
  saveContent: (content: string, isCurrentVersion: boolean) => void;
};

const MIN_ROWS = 50;
const MIN_COLS = 26;

function PureSpreadsheetEditor({ content, saveContent }: SheetEditorProps) {
  const { resolvedTheme } = useTheme();

  const parseData = useMemo(() => {
    if (!content) {
      return new Array(MIN_ROWS).fill(new Array(MIN_COLS).fill(''));
    }
    const result = parse<string[]>(content, { skipEmptyLines: true });

    const paddedData = result.data.map((row) => {
      const paddedRow = [...row];
      while (paddedRow.length < MIN_COLS) {
        paddedRow.push('');
      }
      return paddedRow;
    });

    while (paddedData.length < MIN_ROWS) {
      paddedData.push(new Array(MIN_COLS).fill(''));
    }

    return paddedData;
  }, [content]);

  const columns = useMemo(() => {
    const rowNumberColumn = {
      key: 'rowNumber',
      name: '',
      frozen: true,
      width: 50,
      renderCell: ({ rowIdx }: { rowIdx: number }) => rowIdx + 1,
      cellClass: 'border-t border-r dark:bg-zinc-950 dark:text-zinc-50',
      headerCellClass: 'border-t border-r dark:bg-zinc-900 dark:text-zinc-50',
    };

    const dataColumns = Array.from({ length: MIN_COLS }, (_, i) => ({
      key: i.toString(),
      name: String.fromCharCode(65 + i),
      renderEditCell: textEditor,
      width: 120,
      cellClass: twMerge(
        'border-t dark:bg-zinc-950 dark:text-zinc-50',
        i !== 0 && 'border-l'
      ),
      headerCellClass: twMerge(
        'border-t dark:bg-zinc-900 dark:text-zinc-50',
        i !== 0 && 'border-l'
      ),
    }));

    return [rowNumberColumn, ...dataColumns];
  }, []);

  const initialRows = useMemo(() => {
    return parseData.map((row, rowIndex) => {
      const rowData: Record<string, number> = {
        id: rowIndex,
        rowNumber: rowIndex + 1,
      };

      columns.slice(1).forEach((col, colIndex) => {
        rowData[col.key] = row[colIndex] || '';
      });

      return rowData;
    });
  }, [parseData, columns]);

  const [localRows, setLocalRows] = useState(initialRows);

  useEffect(() => {
    setLocalRows(initialRows);
  }, [initialRows]);

  const handleRowsChange = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    (newRows: any[]) => {
      setLocalRows(newRows);

      const updatedData = newRows.map((row) => {
        return columns.slice(1).map((col) => row[col.key] || '');
      });

      const newCsvContent = unparse(updatedData);
      saveContent(newCsvContent, true);
    },
    [columns, saveContent]
  );

  return (
    <DataGrid
      className={twMerge(
        'max-h-96',
        resolvedTheme === 'dark' ? 'rdg-dark' : 'rdg-light'
      )}
      columns={columns}
      rows={localRows}
      enableVirtualization
      onRowsChange={handleRowsChange}
      onCellClick={(args) => {
        if (args.column.key !== 'rowNumber') {
          args.selectCell(true);
        }
      }}
      style={{ height: '100%' }}
      defaultColumnOptions={{
        resizable: true,
        sortable: true,
      }}
    />
  );
}

function areEqual(prevProps: SheetEditorProps, nextProps: SheetEditorProps) {
  return (
    // prevProps.currentVersionIndex === nextProps.currentVersionIndex &&
    // prevProps.isCurrentVersion === nextProps.isCurrentVersion &&
    // !(prevProps.status === 'streaming' && nextProps.status === 'streaming') &&
    prevProps.content === nextProps.content &&
    prevProps.saveContent === nextProps.saveContent
  );
}

export const SpreadsheetEditor = memo(PureSpreadsheetEditor, areEqual);
