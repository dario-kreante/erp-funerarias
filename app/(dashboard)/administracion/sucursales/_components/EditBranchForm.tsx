'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateBranchSchema, UpdateBranchInput } from '@/lib/validations/branch'
import { updateBranch } from '@/lib/actions/branches'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ModalFooter } from '@/components/ui/Modal'
import type { Branch } from '@/types/database'

interface EditBranchFormProps {
  branch: Branch
  onSuccess: () => void
  onCancel: () => void
}

export function EditBranchForm({ branch, onSuccess, onCancel }: EditBranchFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateBranchInput>({
    resolver: zodResolver(updateBranchSchema),
    defaultValues: {
      branch_id: branch.id,
      nombre: branch.nombre,
      direccion: branch.direccion || '',
      telefono: branch.telefono || '',
      nombre_gerente: branch.nombre_gerente || '',
    },
  })

  const onSubmit = async (data: UpdateBranchInput) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await updateBranch(data)
      if (result.success) {
        onSuccess()
      } else {
        setMessage({ type: 'error', text: result.error.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar la sucursal' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'}>{message.text}</Alert>
      )}

      <input type="hidden" {...register('branch_id')} />

      <Input
        label="Nombre de la Sucursal"
        {...register('nombre')}
        errorMessage={errors.nombre?.message}
        required
      />

      <Input
        label="Dirección"
        {...register('direccion')}
        errorMessage={errors.direccion?.message}
      />

      <Input
        label="Teléfono"
        type="tel"
        {...register('telefono')}
        errorMessage={errors.telefono?.message}
      />

      <Input
        label="Nombre del Gerente"
        {...register('nombre_gerente')}
        errorMessage={errors.nombre_gerente?.message}
      />

      <ModalFooter>
        <Button type="button" variant="secondary" onPress={onCancel} isDisabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting} isDisabled={!isDirty}>
          Guardar Cambios
        </Button>
      </ModalFooter>
    </form>
  )
}
