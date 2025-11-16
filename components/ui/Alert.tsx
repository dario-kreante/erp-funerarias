import { ReactNode } from 'react'
import { cx } from '@/lib/utils/cx'
import {
  InfoCircle,
  CheckCircle,
  AlertTriangle,
  AlertCircle
} from '@untitledui/icons'

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: ReactNode
  className?: string
  showIcon?: boolean
}

const variantStyles = {
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'text-blue-400',
    title: 'text-blue-800',
    Icon: InfoCircle
  },
  success: {
    container: 'bg-success-50 border-success-200 text-success-800',
    icon: 'text-success-400',
    title: 'text-success-800',
    Icon: CheckCircle
  },
  warning: {
    container: 'bg-warning-50 border-warning-200 text-warning-800',
    icon: 'text-warning-400',
    title: 'text-warning-800',
    Icon: AlertTriangle
  },
  error: {
    container: 'bg-error-50 border-error-200 text-error-800',
    icon: 'text-error-400',
    title: 'text-error-800',
    Icon: AlertCircle
  }
}

export function Alert({ variant = 'info', title, children, className, showIcon = true }: AlertProps) {
  const styles = variantStyles[variant]
  const Icon = styles.Icon

  return (
    <div className={cx(
      'rounded-md border p-4',
      styles.container,
      className
    )}>
      <div className="flex gap-3">
        {showIcon && (
          <Icon className={cx('h-5 w-5 flex-shrink-0', styles.icon)} />
        )}
        <div className="flex-1">
          {title && (
            <h4 className={cx('mb-1 font-medium', styles.title)}>
              {title}
            </h4>
          )}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
