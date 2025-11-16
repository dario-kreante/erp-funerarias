import { cx } from '@/lib/utils/cx'
import { Loading02 } from '@untitledui/icons'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fullScreen?: boolean
  text?: string
}

const sizeStyles = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

export function LoadingSpinner({ size = 'md', className, fullScreen, text }: LoadingSpinnerProps) {
  const spinner = (
    <div className={cx('flex flex-col items-center justify-center gap-3', className)}>
      <Loading02 className={cx('animate-spin text-primary-600', sizeStyles[size])} />
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
        {spinner}
      </div>
    )
  }

  return spinner
}
