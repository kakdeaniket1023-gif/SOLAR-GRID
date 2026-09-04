'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function GlassTable({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl glass-1 border border-white/[0.08] shadow-2xl">
      <table
        className={twMerge('w-full text-left text-xs font-sans text-slate-200 border-collapse', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function GlassTableHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={twMerge(
        'bg-[#060D1A]/80 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-white/[0.08]',
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export function GlassTableRow({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={twMerge(
        'border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors duration-150',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

interface GlassTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  isHeader?: boolean;
  align?: 'left' | 'center' | 'right';
}

export function GlassTableCell({
  children,
  className,
  isHeader = false,
  align = 'left',
  ...props
}: GlassTableCellProps) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  if (isHeader) {
    return (
      <th
        className={twMerge(
          'p-3.5 sm:p-4 align-middle font-mono font-bold text-[11px] text-slate-400 uppercase tracking-wider',
          alignClass,
          className
        )}
        {...(props as any)}
      >
        {children}
      </th>
    );
  }

  return (
    <td
      className={twMerge('p-3.5 sm:p-4 align-middle', alignClass, className)}
      {...props}
    >
      {children}
    </td>
  );
}
