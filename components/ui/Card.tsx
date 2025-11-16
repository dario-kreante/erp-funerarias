import { ReactNode } from 'react'
import { cx } from '@/lib/utils/cx'

export interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingStyles = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div className={cx(
      'rounded-lg border border-gray-200 bg-white shadow-sm',
      paddingStyles[padding],
      className
    )}>
      {children}
    </div>
  )
}

export interface CardHeaderProps {
  title?: string
  description?: string
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

export function CardHeader({ title, description, actions, children, className }: CardHeaderProps) {
  return (
    <div className={cx('border-b border-gray-200 pb-4', className)}>
      {children || (
        <div className="flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
    </div>
  )
}

export interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cx('mt-4', className)}>{children}</div>
}

export interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cx('flex items-center justify-end gap-3 border-t border-gray-200 pt-4', className)}>
      {children}
    </div>
  )
}
