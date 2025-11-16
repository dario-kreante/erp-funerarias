'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { inviteUserSchema, InviteUserInput } from '@/lib/validations/user'
import { inviteUser } from '@/lib/actions/users'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import type { Branch, UserRole } from '@/types/database'

interface InviteUserModalProps {
  branches: Branch[]
}

export function InviteUserModal({ branches }: InviteUserModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<InviteUserInput>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      nombre_completo: '',
      role: 'colaborador',
      branch_ids: [],
    },
  })

  const selectedBranches = watch('branch_ids')

  const roleOptions = [
    { value: 'admin', label: 'Administrador' },
    { value: 'ejecutivo', label: 'Ejecutivo' },
    { value: 'operaciones', label: 'Operaciones' },
    { value: 'caja', label: 'Caja' },
    { value: 'colaborador', label: 'Colaborador' },
  ]

  const onSubmit = async (data: InviteUserInput) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await inviteUser(data)
      if (result.success) {
        setMessage({ type: 'success', text: 'Usuario invitado correctamente' })
        reset()
        setTimeout(() => {
          setIsOpen(false)
          setMessage(null)
        }, 2000)
      } else {
        setMessage({ type: 'error', text: result.error.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al invitar usuario' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleBranch = (branchId: string) => {
    const current = selectedBranches || []
    if (current.includes(branchId)) {
      setValue(
        'branch_ids',
        current.filter((id) => id !== branchId)
      )
    } else {
      setValue('branch_ids', [...current, branchId])
    }
  }

  return (
    <>
      <Button onPress={() => setIsOpen(true)}>Invitar Usuario</Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title="Invitar Nuevo Usuario"
        description="El usuario recibirá un correo con instrucciones para acceder"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {message && (
            <Alert variant={message.type === 'success' ? 'success' : 'error'}>
              {message.text}
            </Alert>
          )}

          <Input
            label="Nombre Completo"
            {...register('nombre_completo')}
            errorMessage={errors.nombre_completo?.message}
            required
          />

          <Input
            label="Correo Electrónico"
            type="email"
            {...register('email')}
            errorMessage={errors.email?.message}
            required
          />

          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select
                label="Rol"
                options={roleOptions}
                selectedKey={field.value}
                onSelectionChange={(key) => field.onChange(key as UserRole)}
                errorMessage={errors.role?.message}
                required
              />
            )}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Sucursales <span className="text-error-500">*</span>
            </label>
            <div className="max-h-40 overflow-y-auto rounded-md border border-gray-300 p-2">
              {branches.map((branch) => (
                <label
                  key={branch.id}
                  className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedBranches?.includes(branch.id) || false}
                    onChange={() => toggleBranch(branch.id)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-900">{branch.nombre}</span>
                </label>
              ))}
            </div>
            {errors.branch_ids && (
              <p className="mt-1 text-xs text-error-600">{errors.branch_ids.message}</p>
            )}
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onPress={() => setIsOpen(false)}
              isDisabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Invitar Usuario
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  )
}
