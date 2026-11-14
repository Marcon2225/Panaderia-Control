// F:\Programas\panaderia-control\src\components\ui\Table.tsx
// Table accesible con ordenación, selección, paginación y acciones

'use client';

import { useState, useMemo, useRef, useEffect, type ReactNode, Fragment } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Loader2,
} from 'lucide-react';
import { cn } from '../../utils/helpers';

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T = Record<string, unknown>> {
  key: string;
  header: string;
  accessor?: string | ((row: T) => ReactNode);
  cell?: (row: T, value: unknown) => ReactNode;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
}

export interface TableProps<T = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  keyAccessor: string | ((row: T) => string);
  // Ordenación
  sortBy?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string, direction: SortDirection) => void;
  // Selección
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedKeys: string[]) => void;
  // Estado
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  // Paginación (opcional - controlada externamente)
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    pageSizeOptions?: number[];
  };
  // Acciones de fila
  rowActions?: (row: T) => ReactNode;
  // Personalización
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
  className?: string;
  // Row click
  onRowClick?: (row: T) => void;
  // Render row personalizado
  renderRow?: (row: T, index: number, isSelected: boolean) => ReactNode;
}

function getRowKey<T>(row: T, keyAccessor: string | ((row: T) => string)): string {
  return typeof keyAccessor === 'function' ? keyAccessor(row) : (row as Record<string, unknown>)[keyAccessor] as string;
}

function getCellValue<T>(row: T, column: Column<T>): unknown {
  if (column.accessor) {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return (row as Record<string, unknown>)[column.accessor];
  }
  return (row as Record<string, unknown>)[column.key];
}

export function Table<T = Record<string, unknown>>({
  columns,
  data,
  keyAccessor,
  sortBy,
  sortDirection,
  onSort,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  emptyIcon,
  pagination,
  rowActions,
  striped = true,
  hoverable = true,
  bordered = true,
  compact = false,
  className,
  onRowClick,
  renderRow,
}: TableProps<T>) {
  const [selectAll, setSelectAll] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  // Seleccionar/deseleccionar todas
  const handleSelectAll = () => {
    const allKeys = data.map((row) => getRowKey(row, keyAccessor));
    if (selectAll) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(allKeys);
    }
    setSelectAll(!selectAll);
  };

  // Sincronizar indeterminate via ref
  const allSelected = data.length > 0 && selectedRows.length === data.length;
  const someSelected = selectedRows.length > 0 && selectedRows.length < data.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  // Manejar selección individual
  const handleRowSelect = (rowKey: string, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...selectedRows, rowKey]);
    } else {
      onSelectionChange?.(selectedRows.filter((k) => k !== rowKey));
    }
  };

  // Determinar si una fila está seleccionada
  const isRowSelected = (rowKey: string) => selectedRows.includes(rowKey);

  // Ordenar icono
  const getSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) return <ChevronsUpDown className="w-4 h-4 text-bakery-300" />;
    return sortDirection === 'asc'
      ? <ChevronUp className="w-4 h-4 text-bakery-600" />
      : <ChevronDown className="w-4 h-4 text-bakery-600" />;
  };

  const handleSort = (columnKey: string) => {
    if (!onSort) return;
    if (sortBy === columnKey) {
      onSort(columnKey, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(columnKey, 'asc');
    }
  };

  const handleHeaderClick = (column: Column<T>) => {
    if (column.sortable) {
      handleSort(column.key);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn('overflow-hidden border rounded-xl bg-white', className)}>
        <div className="table-container">
          <table className="table" role="grid">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    style={{
                      width: col.width,
                      minWidth: col.minWidth,
                      maxWidth: col.maxWidth,
                      textAlign: col.align,
                    }}
                    className={cn(
                      'px-4 py-3',
                      col.headerClassName
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span>{col.header}</span>
                      <Loader2 className="w-4 h-4 animate-spin text-bakery-400" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-bakery-100 rounded animate-pulse" style={{ width: '60%' }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={cn('border rounded-xl bg-white', className)}>
        <div className="p-12 text-center">
          {emptyIcon || (
            <svg className="w-12 h-12 mx-auto text-bakery-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          <p className="mt-4 text-bakery-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden border rounded-xl bg-white', bordered && 'border-bakery-100', className)}>
      <div className="table-container overflow-x-auto">
        <table className="table" role="grid">
          <thead>
            <tr className="bg-bakery-50">
              {selectable && (
                <th
                  scope="col"
                  className="px-3 py-3 w-12 text-center"
                  style={{ width: '48px', minWidth: '48px' }}
                >
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-bakery-600 rounded border-bakery-300 focus:ring-bakery-500 cursor-pointer"
                    aria-label={allSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  onClick={() => handleHeaderClick(column)}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                    textAlign: column.align,
                    cursor: column.sortable ? 'pointer' : 'default',
                    userSelect: column.sortable ? 'none' : undefined,
                  }}
                  className={cn(
                    'px-4 py-3 font-semibold text-xs uppercase tracking-wider text-bakery-500',
                    'border-b border-bakery-100',
                    column.sortable && 'hover:bg-bakery-100 select-none',
                    column.headerClassName
                  )}
                  aria-sort={sortBy === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <span>{column.header}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              {rowActions && (
                <th scope="col" className="px-4 py-3 w-24 text-center" style={{ width: '96px', minWidth: '96px' }}>
                  <span className="sr-only">Acciones</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-bakery-100">
            {data.map((row, index) => {
              const rowKey = getRowKey(row, keyAccessor);
              const selected = isRowSelected(rowKey);

              if (renderRow) {
                return (
                  <Fragment key={rowKey}>
                    {renderRow(row, index, selected)}
                  </Fragment>
                );
              }

              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors',
                    hoverable && 'hover:bg-bakery-50',
                    striped && index % 2 === 1 && 'bg-bakery-50/50',
                    selected && 'bg-bakery-50',
                    compact && 'compact-row',
                    onRowClick && 'cursor-pointer'
                  )}
                  style={{ textAlign: 'left' }}
                >
                  {selectable && (
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => handleRowSelect(rowKey, e.target.checked)}
                        className="w-4 h-4 text-bakery-600 rounded border-bakery-300 focus:ring-bakery-500 cursor-pointer"
                        aria-label={selected ? `Deseleccionar fila ${index + 1}` : `Seleccionar fila ${index + 1}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => {
                    const value = getCellValue(row, column);
                    const cellContent = column.cell
                      ? column.cell(row, value)
                      : typeof value === 'undefined' || value === null
                        ? <span className="text-bakery-300">—</span>
                        : (value as ReactNode);

                    return (
                      <td
                        key={column.key}
                        style={{
                          textAlign: column.align,
                        }}
                        className={cn(
                          'px-4 py-3 text-sm text-bakery-700',
                          column.className
                        )}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                  {rowActions && (
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center">
                        {rowActions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && (
        <TablePagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
          pageSizeOptions={pagination.pageSizeOptions}
        />
      )}
    </div>
  );
}

// Componente de paginación
export interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: TablePaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (totalPages <= 1) return null;

  return (
    <div className="px-4 py-3 border-t border-bakery-100 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-bakery-500">
          Mostrando <span className="font-medium text-bakery-900">{start}</span> a{' '}
          <span className="font-medium text-bakery-900">{end}</span> de{' '}
          <span className="font-medium text-bakery-900">{total}</span> resultados
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="input w-auto py-1.5 text-sm"
          aria-label="Elementos por página"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} por página
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn btn-secondary p-2"
          aria-label="Página anterior"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <span className="text-sm text-bakery-700 px-3">
          Página <span className="font-medium">{page}</span> de {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn btn-secondary p-2"
          aria-label="Página siguiente"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Hook para ordenación local (cuando no hay backend)
export function useTableSort<T>(data: T[], initialSortBy?: string, initialDirection?: SortDirection) {
  const [sortBy, setSortBy] = useState<string | undefined>(initialSortBy);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection ?? null);

  const sortedData = useMemo(() => {
    if (!sortBy) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortBy];
      const bVal = (b as Record<string, unknown>)[sortBy];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortBy, sortDirection]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  return { sortedData, sortBy, sortDirection, handleSort };
}

// Hook para selección
export function useTableSelection<T>(data: T[], keyAccessor: string | ((row: T) => string)) {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const toggleRow = (rowKey: string) => {
    setSelectedRows((prev) =>
      prev.includes(rowKey)
        ? prev.filter((k) => k !== rowKey)
        : [...prev, rowKey]
    );
  };

  const toggleAll = () => {
    const allKeys = data.map((row) => (typeof keyAccessor === 'function' ? keyAccessor(row) : (row as Record<string, unknown>)[keyAccessor] as string));
    setSelectedRows((prev) => (prev.length === allKeys.length ? [] : allKeys));
  };

  const clearSelection = () => setSelectedRows([]);

  const isSelected = (rowKey: string) => selectedRows.includes(rowKey);
  const allSelected = data.length > 0 && selectedRows.length === data.length;
  const someSelected = selectedRows.length > 0 && selectedRows.length < data.length;

  return {
    selectedRows,
    setSelectedRows,
    toggleRow,
    toggleAll,
    clearSelection,
    isSelected,
    allSelected,
    someSelected,
  };
}