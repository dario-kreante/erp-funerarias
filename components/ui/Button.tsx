import { Button as AriaButton, ButtonProps as AriaButtonProps } from 'react-aria-components'
import { cx } from '@/lib/utils/cx'
import { Loading02 } from '@untitledui/icons'

export interface ButtonProps extends AriaButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  loadingText?: string
}

const variantStyles = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:bg-primary-300',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-primary-500 disabled:bg-gray-100',
  danger: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500 disabled:bg-error-300',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300 disabled:text-gray-400',
  link: 'bg-transparent text-primary-600 hover:text-primary-700 hover:underline focus:ring-0 disabled:text-primary-300'
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  className,
  children,
  isDisabled,
  ...props
}: ButtonProps) {
  const disabled = isDisabled || isLoading

  return (
    <AriaButton
      {...props}
      isDisabled={disabled}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantStyles[variant],
        sizeStyles[size],
        typeof className === 'string' ? className : undefined
      )}
    >
      {isLoading && <Loading02 className="h-4 w-4 animate-spin" />}
      {isLoading && loadingText ? loadingText : (typeof children === 'function' ? null : children)}
    </AriaButton>
  )
}
