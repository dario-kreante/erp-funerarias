'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBranchSchema, CreateBranchInput } from '@/lib/validations/branch'
import { createBranch } from '@/lib/actions/branches'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

export function CreateBranchModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createBranchSchema),
    defaultValues: {
      nombre: '',
      direccion: '',
      telefono: '',
      nombre_gerente: '',
      estado_activo: true,
      funeral_home_id: '',
    },
  })

  const onSubmit = async (data: CreateBranchInput) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await createBranch(data)
      if (result.success) {
        setMessage({ type: 'success', text: 'Sucursal creada correctamente' })
        reset()
        setTimeout(() => {
          setIsOpen(false)
          setMessage(null)
        }, 2000)
      } else {
        setMessage({ type: 'error', text: result.error.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al crear sucursal' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button onPress={() => setIsOpen(true)}>Nueva Sucursal</Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title="Crear Nueva Sucursal"
        description="Agrega una nueva sucursal a tu funeraria"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {message && (
            <Alert variant={message.type === 'success' ? 'success' : 'error'}>
              {message.text}
            </Alert>
          )}

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
            <Button
              type="button"
              variant="secondary"
              onPress={() => setIsOpen(false)}
              isDisabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Crear Sucursal
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  )
}
