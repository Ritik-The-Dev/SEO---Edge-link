import * as React from 'react'
import { cn } from '@/lib/utils'

export function Table({ className, children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className={cn('w-full min-w-full border-collapse text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  )
}

export function THead({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <thead className={className}>
      <tr className="border-b border-line text-left">{children}</tr>
    </thead>
  )
}

export function TH({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn('whitespace-nowrap px-2 py-2.5 font-mono text-[0.65rem] font-medium uppercase tracking-[0.14em] text-faint', className)}
      {...props}
    >
      {children}
    </th>
  )
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>
}

export function TR({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('transition-colors hover:bg-raised/60', className)} {...props}>
      {children}
    </tr>
  )
}

export function TD({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-2 py-3 align-middle text-[0.82rem] text-ink', className)} {...props}>
      {children}
    </td>
  )
}
