import { forwardRef } from 'react'
import { Input as AriaInput, InputProps as AriaInputProps, Label, TextField, Text } from 'react-aria-components'
import { cx } from '@/lib/utils/cx'

export interface InputProps extends Omit<AriaInputProps, 'className'> {
  label?: string
  description?: string
  errorMessage?: string
  className?: string
  inputClassName?: string
  required?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, description, errorMessage, className, inputClassName, required, ...props }, ref) => {
    return (
      <TextField
        className={cx('flex flex-col gap-1.5', className)}
        isInvalid={!!errorMessage}
        isRequired={required}
      >
        {label && (
          <Label className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="ml-1 text-error-500">*</span>}
          </Label>
        )}
        {description && (
          <Text slot="description" className="text-xs text-gray-500">
            {description}
          </Text>
        )}
        <AriaInput
          {...props}
          ref={ref}
          className={cx(
            'block w-full rounded-md border border-gray-300 px-3 py-2',
            'text-sm text-gray-900 placeholder:text-gray-400',
            'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            'invalid:border-error-500 invalid:focus:border-error-500 invalid:focus:ring-error-500',
            inputClassName
          )}
        />
        {errorMessage && (
          <Text slot="errorMessage" className="text-xs text-error-600">
            {errorMessage}
          </Text>
        )}
      </TextField>
    )
  }
)

Input.displayName = 'Input'
