'use client'

import { Modal } from '@/components/ui'
import { ExpenseForm } from './ExpenseForm'

interface Service {
  id: string
  numero_servicio: string
  nombre_fallecido: string
}

interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  services: Service[]
  expense?: {
    id: string
    service_id: string | null
    fecha_egreso: string
    supplier_id: string | null
    nombre_proveedor: string | null
    concepto: string
    monto: number
    categoria: string | null
    info_impuestos: string | null
    numero_factura: string | null
    estado: string
  }
}

export function ExpenseModal({ isOpen, onClose, services, expense }: ExpenseModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={expense ? 'Editar Egreso' : 'Nuevo Egreso'}
      description={expense ? 'Modifique los datos del egreso' : 'Registre un nuevo gasto o pago'}
      size="lg"
    >
      <ExpenseForm
        services={services}
        expense={expense}
        onSuccess={onClose}
        onCancel={onClose}
      />
    </Modal>
  )
}
