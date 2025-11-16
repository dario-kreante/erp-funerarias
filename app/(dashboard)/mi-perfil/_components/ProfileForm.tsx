'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateUserProfileSchema, UpdateUserProfileInput } from '@/lib/validations/user'
import { updateCurrentUserProfile } from '@/lib/actions/users'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

interface ProfileFormProps {
  defaultValues: {
    nombre_completo: string
    url_avatar: string
  }
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateUserProfileInput>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues,
  })

  const onSubmit = async (data: UpdateUserProfileInput) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await updateCurrentUserProfile(data)
      if (result.success) {
        setMessage({ type: 'success', text: 'Perfil actualizado correctamente' })
      } else {
        setMessage({ type: 'error', text: result.error.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar el perfil' })
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
        label="Nombre Completo"
        {...register('nombre_completo')}
        errorMessage={errors.nombre_completo?.message}
        required
      />

      <Input
        label="URL del Avatar"
        type="url"
        {...register('url_avatar')}
        errorMessage={errors.url_avatar?.message}
        description="URL de la imagen de perfil (opcional)"
      />

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting} isDisabled={!isDirty}>
          Guardar Cambios
        </Button>
      </div>
    </form>
  )
}
