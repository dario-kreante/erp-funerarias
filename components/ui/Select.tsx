import { forwardRef } from 'react'
import {
  Select as AriaSelect,
  SelectProps as AriaSelectProps,
  Label,
  Button,
  SelectValue,
  Popover,
  ListBox,
  ListBoxItem,
  Text
} from 'react-aria-components'
import { cx } from '@/lib/utils/cx'
import { ChevronDownIcon } from '@untitledui/icons-react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps<T extends object> extends Omit<AriaSelectProps<T>, 'children'> {
  label?: string
  description?: string
  errorMessage?: string
  className?: string
  required?: boolean
  options: SelectOption[]
  placeholder?: string
}

export function Select<T extends object = SelectOption>({
  label,
  description,
  errorMessage,
  className,
  required,
  options,
  placeholder = 'Seleccionar...',
  ...props
}: SelectProps<T>) {
  return (
    <AriaSelect
      {...props}
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
      <Button
        className={cx(
          'flex items-center justify-between gap-2 rounded-md border border-gray-300 px-3 py-2',
          'text-sm text-gray-900 placeholder:text-gray-400',
          'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
          'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
          'invalid:border-error-500 invalid:focus:border-error-500 invalid:focus:ring-error-500'
        )}
      >
        <SelectValue className="flex-1 text-left placeholder-shown:text-gray-400">
          {({ selectedText }) => selectedText || placeholder}
        </SelectValue>
        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
      </Button>
      {errorMessage && (
        <Text slot="errorMessage" className="text-xs text-error-600">
          {errorMessage}
        </Text>
      )}
      <Popover
        className={cx(
          'w-[--trigger-width] overflow-auto rounded-md border border-gray-200 bg-white shadow-lg',
          'entering:animate-in entering:fade-in entering:zoom-in-95',
          'exiting:animate-out exiting:fade-out exiting:zoom-out-95'
        )}
      >
        <ListBox className="max-h-60 overflow-auto p-1">
          {options.map((option) => (
            <ListBoxItem
              key={option.value}
              id={option.value}
              textValue={option.label}
              isDisabled={option.disabled}
              className={cx(
                'cursor-pointer rounded px-3 py-2 text-sm outline-none',
                'hover:bg-gray-100',
                'selected:bg-primary-50 selected:text-primary-700',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {option.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaSelect>
  )
}
