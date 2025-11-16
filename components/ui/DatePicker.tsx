'use client'

import { forwardRef } from 'react'
import { Label, Text } from 'react-aria-components'
import { cx } from '@/lib/utils/cx'

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  errorMessage?: string
  className?: string
  inputClassName?: string
  required?: boolean
  type?: 'date' | 'datetime-local' | 'time'
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, description, errorMessage, className, inputClassName, required, type = 'date', ...props }, ref) => {
    return (
      <div className={cx('flex flex-col gap-1.5', className)}>
        {label && (
          <Label className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="ml-1 text-error-500">*</span>}
          </Label>
        )}
        {description && (
          <Text className="text-xs text-gray-500">
            {description}
          </Text>
        )}
        <input
          {...props}
          ref={ref}
          type={type}
          required={required}
          className={cx(
            'block w-full rounded-md border border-gray-300 px-3 py-2',
            'text-sm text-gray-900 placeholder:text-gray-400',
            'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            errorMessage && 'border-error-500 focus:border-error-500 focus:ring-error-500',
            inputClassName
          )}
          aria-invalid={!!errorMessage}
          aria-describedby={errorMessage ? 'error' : undefined}
        />
        {errorMessage && (
          <Text id="error" className="text-xs text-error-600">
            {errorMessage}
          </Text>
        )}
      </div>
    )
  }
)

DatePicker.displayName = 'DatePicker'
