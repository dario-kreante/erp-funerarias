'use client'

import { Modal } from '@/components/ui'
import { TransactionForm } from './TransactionForm'

interface Service {
  id: string
  numero_servicio: string
  nombre_fallecido: string
  nombre_responsable: string
  total_final: number
}

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  services: Service[]
  transaction?: {
    id: string
    service_id: string
    fecha_transaccion: string
    monto: number
    moneda: string
    metodo_pago: string
    cuenta_destino: string | null
    estado: string
    observaciones: string | null
  }
}

export function TransactionModal({ isOpen, onClose, services, transaction }: TransactionModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={transaction ? 'Editar Transacción' : 'Nueva Transacción'}
      description={transaction ? 'Modifique los datos de la transacción' : 'Registre un nuevo pago recibido'}
      size="lg"
    >
      <TransactionForm
        services={services}
        transaction={transaction}
        onSuccess={onClose}
        onCancel={onClose}
      />
    </Modal>
  )
}
