import React from 'react';
import { cn } from '../../lib/utils';
import { Skeleton } from './Skeleton';
import { Database } from 'lucide-react';

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({ data, columns, isLoading, emptyMessage = 'No data available', className }: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full bg-[#0c0c0e] border border-neutral-800 rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <Skeleton variant="table" className="w-full h-48 bg-neutral-900/50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className={cn("w-full overflow-x-auto rounded-2xl border border-neutral-800 bg-[#0c0c0e] shadow-[0_10px_30px_rgba(0,0,0,0.8)] custom-scrollbar", className)}>
      <table className="w-full text-xs text-left font-mono">
        <thead className="bg-[#121215] text-neutral-400 uppercase border-b border-neutral-800 tracking-wider">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} scope="col" className="px-6 py-4 font-bold text-neutral-300">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-900">
          {(!data || data.length === 0) ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-14 text-center text-neutral-500 font-mono">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Database className="w-6 h-6 text-neutral-600 animate-pulse" />
                  <span>{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => (
              <tr 
                key={rowIndex} 
                className="hover:bg-neutral-900/60 transition-colors duration-150 group"
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 text-neutral-300 group-hover:text-white transition-colors">
                    {col.cell ? col.cell(item) : col.accessorKey ? (item[col.accessorKey] as React.ReactNode) : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}