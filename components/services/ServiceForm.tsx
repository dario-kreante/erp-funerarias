'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Select'
import { TextArea } from '@/components/ui/TextArea'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { serviceCreateSchema, type ServiceCreateInput } from '@/lib/validations/service'
import { createService, updateService } from '@/lib/actions/services'
import { formatRutInput } from '@/lib/utils/rut'
import { cx } from '@/lib/utils/cx'
import {
  Check as CheckIcon,
  User01 as UserIcon,
  Calendar as CalendarIcon,
  CreditCard01 as CreditCardIcon,
  MarkerPin01 as MapPinIcon,
} from '@untitledui/icons'

interface CatalogData {
  plans: Array<{ id: string; nombre: string; precio_base: number; descripcion?: string }>
  coffins: Array<{
    id: string
    nombre_comercial: string
    precio_venta: number
    categoria?: string
    tamano?: string
  }>
  urns: Array<{ id: string; nombre_comercial: string; precio_venta: number; categoria?: string }>
  cemeteries: Array<{ id: string; nombre: string; tipo: string; direccion?: string }>
  vehicles: Array<{ id: string; placa: string; tipo_vehiculo: string; capacidad?: number }>
}

interface UserBranch {
  id: string
  nombre: string
}

interface ServiceFormProps {
  funeralHomeId: string
  branches: UserBranch[]
  catalogData: CatalogData
  initialData?: Partial<ServiceCreateInput> & { id?: string }
  mode?: 'create' | 'edit'
}

const STEPS = [
  { id: 1, name: 'Información General', icon: UserIcon },
  { id: 2, name: 'Datos del Fallecido', icon: UserIcon },
  { id: 3, name: 'Responsable', icon: UserIcon },
  { id: 4, name: 'Plan y Productos', icon: CreditCardIcon },
  { id: 5, name: 'Agenda y Logística', icon: CalendarIcon },
]

const SERVICE_TYPES: SelectOption[] = [
  { value: 'inhumacion', label: 'Inhumación' },
  { value: 'cremacion', label: 'Cremación' },
  { value: 'traslado_nacional', label: 'Traslado Nacional' },
  { value: 'traslado_internacional', label: 'Traslado Internacional' },
  { value: 'solo_velatorio', label: 'Solo Velatorio' },
]

const DEATH_PLACE_TYPES: SelectOption[] = [
  { value: '', label: 'Seleccionar...' },
  { value: 'domicilio', label: 'Domicilio' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'via_publica', label: 'Vía Pública' },
  { value: 'otro', label: 'Otro' },
]

export function ServiceForm({
  funeralHomeId,
  branches,
  catalogData,
  initialData,
  mode = 'create',
}: ServiceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<ServiceCreateInput>({
    // @ts-expect-error - Zod v4 and @hookform/resolvers type mismatch
    resolver: zodResolver(serviceCreateSchema),
    defaultValues: {
      funeral_home_id: funeralHomeId,
      branch_id: initialData?.branch_id || branches[0]?.id || '',
      tipo_servicio: initialData?.tipo_servicio || 'inhumacion',
      estado: initialData?.estado || 'borrador',
      nombre_fallecido: initialData?.nombre_fallecido || '',
      fecha_fallecimiento: initialData?.fecha_fallecimiento || '',
      nombre_responsable: initialData?.nombre_responsable || '',
      rut_responsable: initialData?.rut_responsable || '',
      telefono_responsable: initialData?.telefono_responsable || '',
      monto_descuento: initialData?.monto_descuento || 0,
      porcentaje_descuento: initialData?.porcentaje_descuento || 0,
      ...initialData,
    },
  })

  const selectedPlanId = watch('plan_id')
  const selectedCoffinId = watch('coffin_id')
  const selectedUrnId = watch('urn_id')
  const tipoServicio = watch('tipo_servicio')

  // Calculate total based on selections
  const calculateTotal = () => {
    let total = 0
    const plan = catalogData.plans.find((p) => p.id === selectedPlanId)
    const coffin = catalogData.coffins.find((c) => c.id === selectedCoffinId)
    const urn = catalogData.urns.find((u) => u.id === selectedUrnId)

    if (plan) total += plan.precio_base
    if (coffin) total += coffin.precio_venta
    if (urn) total += urn.precio_venta

    return total
  }

  const handleRutChange = (field: 'rut_fallecido' | 'rut_responsable') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const formatted = formatRutInput(e.target.value)
    setValue(field, formatted)
  }

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof ServiceCreateInput)[] = []

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['branch_id', 'tipo_servicio']
        break
      case 2:
        fieldsToValidate = ['nombre_fallecido', 'fecha_fallecimiento']
        break
      case 3:
        fieldsToValidate = ['nombre_responsable', 'rut_responsable', 'telefono_responsable']
        break
      case 4:
        // Optional fields
        break
      case 5:
        // Optional fields
        break
    }

    if (fieldsToValidate.length === 0) return true
    return await trigger(fieldsToValidate)
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = (data: ServiceCreateInput) => {
    setError(null)
    startTransition(async () => {
      try {
        const result =
          mode === 'edit' && initialData?.id
            ? await updateService(initialData.id, data)
            : await createService(data)

        if (result.success) {
          router.push('/servicios')
          router.refresh()
        } else {
          setError(result.error.message)
        }
      } catch (err) {
        setError('Ha ocurrido un error inesperado')
      }
    })
  }

  const branchOptions: SelectOption[] = branches.map((b) => ({
    value: b.id,
    label: b.nombre,
  }))

  const planOptions: SelectOption[] = [
    { value: '', label: 'Sin plan' },
    ...catalogData.plans.map((p) => ({
      value: p.id,
      label: `${p.nombre} - $${p.precio_base.toLocaleString('es-CL')}`,
    })),
  ]

  const coffinOptions: SelectOption[] = [
    { value: '', label: 'Sin ataúd' },
    ...catalogData.coffins.map((c) => ({
      value: c.id,
      label: `${c.nombre_comercial} - $${c.precio_venta.toLocaleString('es-CL')}`,
    })),
  ]

  const urnOptions: SelectOption[] = [
    { value: '', label: 'Sin urna' },
    ...catalogData.urns.map((u) => ({
      value: u.id,
      label: `${u.nombre_comercial} - $${u.precio_venta.toLocaleString('es-CL')}`,
    })),
  ]

  const cemeteryOptions: SelectOption[] = [
    { value: '', label: 'Seleccionar...' },
    ...catalogData.cemeteries.map((c) => ({
      value: c.id,
      label: `${c.nombre} (${c.tipo})`,
    })),
  ]

  const vehicleOptions: SelectOption[] = [
    { value: '', label: 'Seleccionar...' },
    ...catalogData.vehicles.map((v) => ({
      value: v.id,
      label: `${v.placa} - ${v.tipo_vehiculo}`,
    })),
  ]

  return (
    // @ts-expect-error - FieldValues type inference issue
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card padding="none" className="overflow-hidden">
        {/* Step Indicator */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {STEPS.map((step, stepIdx) => (
                <li
                  key={step.id}
                  className={cx(stepIdx !== STEPS.length - 1 ? 'flex-1' : '', 'relative')}
                >
                  <div className="flex items-center">
                    <div
                      className={cx(
                        'relative flex h-10 w-10 items-center justify-center rounded-full',
                        currentStep > step.id
                          ? 'bg-primary-600'
                          : currentStep === step.id
                            ? 'border-2 border-primary-600 bg-white'
                            : 'border-2 border-gray-300 bg-white'
                      )}
                    >
                      {currentStep > step.id ? (
                        <CheckIcon className="h-5 w-5 text-white" />
                      ) : (
                        <step.icon
                          className={cx(
                            'h-5 w-5',
                            currentStep === step.id ? 'text-primary-600' : 'text-gray-500'
                          )}
                        />
                      )}
                    </div>
                    {stepIdx !== STEPS.length - 1 && (
                      <div
                        className={cx(
                          'ml-4 h-0.5 flex-1',
                          currentStep > step.id ? 'bg-primary-600' : 'bg-gray-300'
                        )}
                      />
                    )}
                  </div>
                  <div className="mt-2">
                    <span
                      className={cx(
                        'text-xs font-medium',
                        currentStep === step.id ? 'text-primary-600' : 'text-gray-500'
                      )}
                    >
                      Paso {step.id}
                    </span>
                    <p
                      className={cx(
                        'text-sm',
                        currentStep === step.id ? 'font-medium text-gray-900' : 'text-gray-500'
                      )}
                    >
                      {step.name}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {error && (
          <div className="px-6 pt-4">
            <Alert variant="error" title="Error">
              {error}
            </Alert>
          </div>
        )}

        <CardContent className="min-h-[400px] p-6">
          {/* Step 1: General Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Información General</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Select
                  label="Sucursal"
                  options={branchOptions}
                  selectedKey={watch('branch_id')}
                  onSelectionChange={(key) => setValue('branch_id', key as string)}
                  errorMessage={errors.branch_id?.message}
                  required
                />
                <Select
                  label="Tipo de Servicio"
                  options={SERVICE_TYPES}
                  selectedKey={watch('tipo_servicio')}
                  onSelectionChange={(key) =>
                    setValue('tipo_servicio', key as ServiceCreateInput['tipo_servicio'])
                  }
                  errorMessage={errors.tipo_servicio?.message}
                  required
                />
              </div>
              <TextArea
                label="Notas Generales"
                {...register('notas_generales')}
                errorMessage={errors.notas_generales?.message}
                placeholder="Observaciones o notas adicionales sobre el servicio..."
              />
            </div>
          )}

          {/* Step 2: Deceased Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Datos del Fallecido</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input
                  label="Nombre Completo"
                  {...register('nombre_fallecido')}
                  errorMessage={errors.nombre_fallecido?.message}
                  required
                />
                <Input
                  label="RUT"
                  value={watch('rut_fallecido') || ''}
                  onChange={handleRutChange('rut_fallecido')}
                  errorMessage={errors.rut_fallecido?.message}
                  placeholder="12.345.678-9"
                />
                <Input
                  label="Fecha de Nacimiento"
                  type="date"
                  {...register('fecha_nacimiento_fallecido')}
                  errorMessage={errors.fecha_nacimiento_fallecido?.message}
                />
                <Input
                  label="Fecha de Fallecimiento"
                  type="date"
                  {...register('fecha_fallecimiento')}
                  errorMessage={errors.fecha_fallecimiento?.message}
                  required
                />
                <Select
                  label="Tipo de Lugar de Fallecimiento"
                  options={DEATH_PLACE_TYPES}
                  selectedKey={watch('tipo_lugar_fallecimiento') || ''}
                  onSelectionChange={(key) =>
                    setValue(
                      'tipo_lugar_fallecimiento',
                      key as ServiceCreateInput['tipo_lugar_fallecimiento']
                    )
                  }
                  errorMessage={errors.tipo_lugar_fallecimiento?.message}
                />
                <Input
                  label="Lugar de Fallecimiento"
                  {...register('lugar_fallecimiento')}
                  errorMessage={errors.lugar_fallecimiento?.message}
                  placeholder="Dirección o nombre del lugar"
                />
              </div>
              <TextArea
                label="Causa de Fallecimiento"
                {...register('causa_fallecimiento')}
                errorMessage={errors.causa_fallecimiento?.message}
                placeholder="Causa médica del fallecimiento"
              />
            </div>
          )}

          {/* Step 3: Responsible Person */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Datos del Responsable</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input
                  label="Nombre Completo"
                  {...register('nombre_responsable')}
                  errorMessage={errors.nombre_responsable?.message}
                  required
                />
                <Input
                  label="RUT"
                  value={watch('rut_responsable') || ''}
                  onChange={handleRutChange('rut_responsable')}
                  errorMessage={errors.rut_responsable?.message}
                  placeholder="12.345.678-9"
                  required
                />
                <Input
                  label="Teléfono"
                  type="tel"
                  {...register('telefono_responsable')}
                  errorMessage={errors.telefono_responsable?.message}
                  placeholder="+56 9 1234 5678"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  {...register('email_responsable')}
                  errorMessage={errors.email_responsable?.message}
                  placeholder="correo@ejemplo.cl"
                />
                <Input
                  label="Parentesco"
                  {...register('parentesco_responsable')}
                  errorMessage={errors.parentesco_responsable?.message}
                  placeholder="Ej: Hijo, Esposo, etc."
                />
                <div className="md:col-span-2">
                  <Input
                    label="Dirección"
                    {...register('direccion_responsable')}
                    errorMessage={errors.direccion_responsable?.message}
                    placeholder="Dirección completa"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Plan and Products */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Plan y Productos</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Select
                  label="Plan de Servicio"
                  options={planOptions}
                  selectedKey={watch('plan_id') || ''}
                  onSelectionChange={(key) => setValue('plan_id', key as string || null)}
                  errorMessage={errors.plan_id?.message}
                />
                <Select
                  label="Ataúd"
                  options={coffinOptions}
                  selectedKey={watch('coffin_id') || ''}
                  onSelectionChange={(key) => setValue('coffin_id', key as string || null)}
                  errorMessage={errors.coffin_id?.message}
                />
                {(tipoServicio === 'cremacion' || tipoServicio === 'solo_velatorio') && (
                  <Select
                    label="Urna"
                    options={urnOptions}
                    selectedKey={watch('urn_id') || ''}
                    onSelectionChange={(key) => setValue('urn_id', key as string || null)}
                    errorMessage={errors.urn_id?.message}
                  />
                )}
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="text-sm font-medium text-gray-700">Resumen de Precios</h4>
                <div className="mt-2 space-y-2">
                  {selectedPlanId && (
                    <div className="flex justify-between text-sm">
                      <span>Plan:</span>
                      <span>
                        $
                        {catalogData.plans
                          .find((p) => p.id === selectedPlanId)
                          ?.precio_base.toLocaleString('es-CL')}
                      </span>
                    </div>
                  )}
                  {selectedCoffinId && (
                    <div className="flex justify-between text-sm">
                      <span>Ataúd:</span>
                      <span>
                        $
                        {catalogData.coffins
                          .find((c) => c.id === selectedCoffinId)
                          ?.precio_venta.toLocaleString('es-CL')}
                      </span>
                    </div>
                  )}
                  {selectedUrnId && (
                    <div className="flex justify-between text-sm">
                      <span>Urna:</span>
                      <span>
                        $
                        {catalogData.urns
                          .find((u) => u.id === selectedUrnId)
                          ?.precio_venta.toLocaleString('es-CL')}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-medium">
                      <span>Subtotal:</span>
                      <span>${calculateTotal().toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input
                  label="Descuento (Monto)"
                  type="number"
                  {...register('monto_descuento', { valueAsNumber: true })}
                  errorMessage={errors.monto_descuento?.message}
                />
                <Input
                  label="Descuento (%)"
                  type="number"
                  {...register('porcentaje_descuento', { valueAsNumber: true })}
                  errorMessage={errors.porcentaje_descuento?.message}
                />
              </div>
            </div>
          )}

          {/* Step 5: Agenda and Logistics */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Agenda y Logística</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input
                  label="Fecha de Recogida"
                  type="datetime-local"
                  {...register('fecha_recogida')}
                  errorMessage={errors.fecha_recogida?.message}
                />
                <Input
                  label="Inicio de Velatorio"
                  type="datetime-local"
                  {...register('fecha_inicio_velatorio')}
                  errorMessage={errors.fecha_inicio_velatorio?.message}
                />
                <Input
                  label="Sala de Velatorio"
                  {...register('sala_velatorio')}
                  errorMessage={errors.sala_velatorio?.message}
                  placeholder="Ej: Sala Norte"
                />
                <Input
                  label="Ceremonia Religiosa"
                  type="datetime-local"
                  {...register('fecha_ceremonia_religiosa')}
                  errorMessage={errors.fecha_ceremonia_religiosa?.message}
                />
                <Input
                  label="Fecha de Inhumación/Cremación"
                  type="datetime-local"
                  {...register('fecha_inhumacion_cremacion')}
                  errorMessage={errors.fecha_inhumacion_cremacion?.message}
                />
                <Select
                  label="Cementerio/Crematorio"
                  options={cemeteryOptions}
                  selectedKey={watch('cemetery_crematorium_id') || ''}
                  onSelectionChange={(key) =>
                    setValue('cemetery_crematorium_id', key as string || null)
                  }
                  errorMessage={errors.cemetery_crematorium_id?.message}
                />
                <Select
                  label="Vehículo Principal"
                  options={vehicleOptions}
                  selectedKey={watch('vehiculo_principal_id') || ''}
                  onSelectionChange={(key) =>
                    setValue('vehiculo_principal_id', key as string || null)
                  }
                  errorMessage={errors.vehiculo_principal_id?.message}
                />
              </div>
              <TextArea
                label="Notas de Logística"
                {...register('notas_logistica')}
                errorMessage={errors.notas_logistica?.message}
                placeholder="Instrucciones especiales, rutas, consideraciones..."
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t bg-gray-50 px-6 py-4">
          <div className="flex w-full justify-between">
            <Button
              type="button"
              variant="secondary"
              onPress={handlePrevious}
              isDisabled={currentStep === 1}
            >
              Anterior
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onPress={() => router.push('/servicios')}
                isDisabled={isPending}
              >
                Cancelar
              </Button>
              {currentStep < STEPS.length ? (
                <Button type="button" onPress={handleNext}>
                  Siguiente
                </Button>
              ) : (
                <Button type="submit" isLoading={isPending} loadingText="Guardando...">
                  {mode === 'create' ? 'Crear Servicio' : 'Guardar Cambios'}
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </form>
  )
}
