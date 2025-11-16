'use client'

import { ReactNode } from 'react'
import {
  Dialog,
  DialogTrigger,
  Modal as AriaModal,
  ModalOverlay,
  Heading
} from 'react-aria-components'
import { cx } from '@/lib/utils/cx'
import { XClose } from '@untitledui/icons'
import { Button } from './Button'

export interface ModalProps {
  isOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
  trigger?: ReactNode
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  isDismissable?: boolean
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl'
}

export function Modal({
  isOpen,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  isDismissable = true
}: ModalProps) {
  const modalContent = (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={isDismissable}
      className={cx(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4',
        'entering:animate-in entering:fade-in entering:duration-200',
        'exiting:animate-out exiting:fade-out exiting:duration-150'
      )}
    >
      <AriaModal
        className={cx(
          'w-full rounded-lg bg-white shadow-xl',
          'entering:animate-in entering:zoom-in-95 entering:duration-200',
          'exiting:animate-out exiting:zoom-out-95 exiting:duration-150',
          sizeStyles[size]
        )}
      >
        <Dialog className="flex flex-col outline-none">
          {({ close }) => (
            <>
              {(title || showCloseButton) && (
                <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                  <div className="flex-1">
                    {title && (
                      <Heading slot="title" className="text-lg font-semibold text-gray-900">
                        {title}
                      </Heading>
                    )}
                    {description && (
                      <p className="mt-1 text-sm text-gray-500">{description}</p>
                    )}
                  </div>
                  {showCloseButton && (
                    <button
                      onClick={close}
                      className="ml-4 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      aria-label="Cerrar"
                    >
                      <XClose className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}
              <div className="px-6 py-4">{children}</div>
            </>
          )}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  )

  if (trigger) {
    return (
      <DialogTrigger>
        {trigger}
        {modalContent}
      </DialogTrigger>
    )
  }

  return modalContent
}

export interface ModalFooterProps {
  children: ReactNode
  className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cx('flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4', className)}>
      {children}
    </div>
  )
}
