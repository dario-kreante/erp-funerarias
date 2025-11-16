'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateMortuaryQuotaSchema, UpdateMortuaryQuotaInput } from '@/lib/validations/mortuary-quota'
import { updateMortuaryQuota } from '@/lib/actions/mortuary-quotas'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import type { MortuaryQuota, MortuaryQuotaEntity, MortuaryQuotaPayer } from '@/types/database'

interface QuotaEditFormProps {
  quota: MortuaryQuota
}

export function QuotaEditForm({ quota }: QuotaEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateMortuaryQuotaInput>({
    resolver: zodResolver(updateMortuaryQuotaSchema),
    defaultValues: {
      quota_id: quota.id,
      aplica: quota.aplica,
      entidad: quota.entidad || undefined,
      nombre_entidad: quota.nombre_entidad || '',
      monto_facturado: quota.monto_facturado || undefined,
      pagador: quota.pagador || undefined,
      fecha_solicitud: quota.fecha_solicitud || '',
    },
  })

  const aplica = watch('aplica')

  const entityOptions = [
    { value: 'afp', label: 'AFP' },
    { value: 'ips', label: 'IPS' },
    { value: 'pgu', label: 'PGU' },
    { value: 'otra', label: 'Otra' },
  ]

  const payerOptions = [
    { value: 'familia', label: 'Familia' },
    { value: 'funeraria', label: 'Funeraria' },
  ]

  const onSubmit = async (data: UpdateMortuaryQuotaInput) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await updateMortuaryQuota(data)
      if (result.success) {
        setMessage({ type: 'success', text: 'Cuota actualizada correctamente' })
      } else {
        setMessage({ type: 'error', text: result.error.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar la cuota' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900">Editar Información</h3>
      <p className="mt-1 text-sm text-gray-500">Actualiza los datos de la cuota mortuoria</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        {message && (
          <Alert variant={message.type === 'success' ? 'success' : 'error'}>{message.text}</Alert>
        )}

        <input type="hidden" {...register('quota_id')} />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="aplica"
            {...register('aplica')}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="aplica" className="text-sm font-medium text-gray-700">
            Aplica Cuota Mortuoria
          </label>
        </div>

        {aplica && (
          <>
            <Controller
              name="entidad"
              control={control}
              render={({ field }) => (
                <Select
                  label="Entidad"
                  options={entityOptions}
                  selectedKey={field.value || ''}
                  onSelectionChange={(key) => field.onChange(key as MortuaryQuotaEntity)}
                  errorMessage={errors.entidad?.message}
                  required
                />
              )}
            />

            <Input
              label="Nombre Entidad Específica"
              {...register('nombre_entidad')}
              errorMessage={errors.nombre_entidad?.message}
              description="Ej: AFP Habitat, AFP Provida, etc."
            />

            <Input
              label="Monto Facturado"
              type="number"
              {...register('monto_facturado', { valueAsNumber: true })}
              errorMessage={errors.monto_facturado?.message}
            />

            <Controller
              name="pagador"
              control={control}
              render={({ field }) => (
                <Select
                  label="Pagador"
                  options={payerOptions}
                  selectedKey={field.value || ''}
                  onSelectionChange={(key) => field.onChange(key as MortuaryQuotaPayer)}
                  errorMessage={errors.pagador?.message}
                  required
                />
              )}
            />

            <Input
              label="Fecha de Solicitud"
              type="date"
              {...register('fecha_solicitud')}
              errorMessage={errors.fecha_solicitud?.message}
            />
          </>
        )}

        <div className="flex justify-end pt-4">
          <Button type="submit" isLoading={isSubmitting} isDisabled={!isDirty}>
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  )
}
