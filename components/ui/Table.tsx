import { ReactNode } from 'react'
import { cx } from '@/lib/utils/cx'

export interface TableProps {
  children: ReactNode
  className?: string
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cx('min-w-full divide-y divide-gray-200', className)}>
        {children}
      </table>
    </div>
  )
}

export interface TableHeaderProps {
  children: ReactNode
  className?: string
}

export function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <thead className={cx('bg-gray-50', className)}>
      {children}
    </thead>
  )
}

export interface TableBodyProps {
  children: ReactNode
  className?: string
}

export function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={cx('divide-y divide-gray-200 bg-white', className)}>
      {children}
    </tbody>
  )
}

export interface TableRowProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function TableRow({ children, className, onClick }: TableRowProps) {
  return (
    <tr
      className={cx(
        onClick && 'cursor-pointer hover:bg-gray-50',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export interface TableHeadProps {
  children: ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}

export function TableHead({ children, className, align = 'left' }: TableHeadProps) {
  return (
    <th
      className={cx(
        'px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500',
        align === 'left' && 'text-left',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
    >
      {children}
    </th>
  )
}

export interface TableCellProps {
  children: ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}

export function TableCell({ children, className, align = 'left' }: TableCellProps) {
  return (
    <td
      className={cx(
        'whitespace-nowrap px-6 py-4 text-sm text-gray-900',
        align === 'left' && 'text-left',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
    >
      {children}
    </td>
  )
}

export interface EmptyTableStateProps {
  message?: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyTableState({ message = 'No hay datos disponibles', icon, action }: EmptyTableStateProps) {
  return (
    <TableRow>
      <TableCell className="py-12 text-center" colSpan={100}>
        <div className="flex flex-col items-center justify-center gap-3">
          {icon && <div className="text-gray-400">{icon}</div>}
          <p className="text-gray-500">{message}</p>
          {action && <div>{action}</div>}
        </div>
      </TableCell>
    </TableRow>
  )
}
