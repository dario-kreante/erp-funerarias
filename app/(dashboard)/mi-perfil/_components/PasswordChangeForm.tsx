'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { changePasswordSchema, ChangePasswordInput } from '@/lib/validations/user'
import { changePassword } from '@/lib/actions/users'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

export function PasswordChangeForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = async (data: ChangePasswordInput) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await changePassword(data)
      if (result.success) {
        setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' })
        reset()
      } else {
        setMessage({ type: 'error', text: result.error.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al cambiar la contraseña' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'}>{message.text}</Alert>
      )}

      <Input
        label="Contraseña Actual"
        type="password"
        {...register('current_password')}
        errorMessage={errors.current_password?.message}
        required
      />

      <Input
        label="Nueva Contraseña"
        type="password"
        {...register('new_password')}
        errorMessage={errors.new_password?.message}
        description="Mínimo 8 caracteres"
        required
      />

      <Input
        label="Confirmar Nueva Contraseña"
        type="password"
        {...register('confirm_password')}
        errorMessage={errors.confirm_password?.message}
        required
      />

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting} variant="danger">
          Cambiar Contraseña
        </Button>
      </div>
    </form>
  )
}
