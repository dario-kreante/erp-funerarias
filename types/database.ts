// Database enums
export type UserRole = 'admin' | 'ejecutivo' | 'operaciones' | 'caja' | 'colaborador'
export type ServiceStatus = 'borrador' | 'confirmado' | 'en_ejecucion' | 'finalizado' | 'cerrado'
export type ServiceType = 'inhumacion' | 'cremacion' | 'traslado_nacional' | 'traslado_internacional' | 'solo_velatorio'
export type TransactionStatus = 'pendiente' | 'pagado' | 'rechazado' | 'reembolsado'
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque' | 'seguro' | 'cuota_mortuoria'
export type ExpenseStatus = 'con_factura' | 'pendiente_factura' | 'sin_factura'
export type CollaboratorType = 'empleado' | 'honorario'
export type DocumentType = 'certificado_defuncion' | 'pase_sepultacion' | 'documentos_sml' | 'factura_boleta' | 'cuota_mortuoria_docs' | 'contrato' | 'otro'
export type MortuaryQuotaStatus = 'no_iniciada' | 'en_preparacion' | 'ingresada' | 'aprobada' | 'rechazada' | 'pagada'
export type MortuaryQuotaEntity = 'afp' | 'ips' | 'pgu' | 'otra'
export type MortuaryQuotaPayer = 'familia' | 'funeraria'
export type CoffinUrnType = 'ataud' | 'urna'
export type CemeteryCrematoriumType = 'cementerio' | 'crematorio'
export type VehicleStatus = 'disponible' | 'en_mantenimiento'
export type DeathPlaceType = 'domicilio' | 'hospital' | 'via_publica' | 'otro'
export type ServiceItemType = 'plan' | 'ataud' | 'urna' | 'extra'
export type ProcedureStatus = 'pendiente' | 'en_proceso' | 'completo'
export type PayrollPeriodStatus = 'abierto' | 'cerrado' | 'procesado' | 'pagado'
export type PaymentReceiptStatus = 'pendiente' | 'generado' | 'enviado' | 'pagado'

// Complete Database interface with Spanish column names
export interface Database {
  public: {
    Tables: {
      funeral_homes: {
        Row: {
          id: string
          razon_social: string
          nombre_fantasia: string | null
          rut: string
          business_line: string | null
          address: string | null
          phone: string | null
          email: string | null
          sanitary_resolution_number: string | null
          sanitary_resolution_issue_date: string | null
          sanitary_resolution_expiry_date: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['funeral_homes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['funeral_homes']['Insert']>
      }
      branches: {
        Row: {
          id: string
          funeral_home_id: string
          nombre: string
          direccion: string | null
          telefono: string | null
          nombre_gerente: string | null
          estado_activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['branches']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['branches']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          funeral_home_id: string
          nombre_completo: string
          email: string
          role: UserRole
          url_avatar: string | null
          estado_activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          funeral_home_id: string
          nombre_completo: string
          email: string
          role?: UserRole
          url_avatar?: string | null
          estado_activo?: boolean
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      user_branches: {
        Row: {
          user_id: string
          branch_id: string
        }
        Insert: {
          user_id: string
          branch_id: string
        }
        Update: Partial<Database['public']['Tables']['user_branches']['Insert']>
      }
      collaborators: {
        Row: {
          id: string
          funeral_home_id: string
          branch_id: string | null
          nombre_completo: string
          rut: string
          type: CollaboratorType
          cargo: string | null
          telefono: string | null
          email: string | null
          sueldo_base: number | null
          metodo_pago: string | null
          estado_activo: boolean
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['collaborators']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['collaborators']['Insert']>
      }
      plans: {
        Row: {
          id: string
          funeral_home_id: string
          nombre: string
          descripcion: string | null
          service_type: ServiceType | null
          precio_base: number
          notas: string | null
          estado_activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['plans']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['plans']['Insert']>
      }
      coffin_urns: {
        Row: {
          id: string
          funeral_home_id: string
          tipo: CoffinUrnType
          nombre_comercial: string
          sku: string | null
          material: string | null
          tamano: string | null
          categoria: string | null
          precio_venta: number
          costo: number | null
          stock_disponible: number
          supplier_id: string | null
          estado_activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['coffin_urns']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['coffin_urns']['Insert']>
      }
      cemetery_crematoriums: {
        Row: {
          id: string
          funeral_home_id: string
          nombre: string
          tipo: CemeteryCrematoriumType
          direccion: string | null
          informacion_contacto: string | null
          notas: string | null
          estado_activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['cemetery_crematoriums']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['cemetery_crematoriums']['Insert']>
      }
      vehicles: {
        Row: {
          id: string
          funeral_home_id: string
          branch_id: string | null
          placa: string
          tipo_vehiculo: string
          capacidad: number | null
          estado: VehicleStatus
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['vehicles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>
      }
      suppliers: {
        Row: {
          id: string
          funeral_home_id: string
          nombre: string
          rut: string | null
          tipo_negocio: string | null
          informacion_contacto: string | null
          estado_activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['suppliers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['suppliers']['Insert']>
      }
      services: {
        Row: {
          id: string
          funeral_home_id: string
          branch_id: string
          numero_servicio: string
          estado: ServiceStatus
          tipo_servicio: ServiceType
          notas_generales: string | null
          nombre_fallecido: string
          rut_fallecido: string | null
          fecha_nacimiento_fallecido: string | null
          fecha_fallecimiento: string
          tipo_lugar_fallecimiento: DeathPlaceType | null
          lugar_fallecimiento: string | null
          causa_fallecimiento: string | null
          nombre_responsable: string
          rut_responsable: string
          telefono_responsable: string
          email_responsable: string | null
          direccion_responsable: string | null
          parentesco_responsable: string | null
          plan_id: string | null
          coffin_id: string | null
          urn_id: string | null
          total_items: number
          monto_descuento: number
          porcentaje_descuento: number
          total_final: number
          fecha_recogida: string | null
          fecha_inicio_velatorio: string | null
          sala_velatorio: string | null
          fecha_ceremonia_religiosa: string | null
          fecha_inhumacion_cremacion: string | null
          cemetery_crematorium_id: string | null
          vehiculo_principal_id: string | null
          otros_vehiculos: string[] | null
          notas_logistica: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'numero_servicio' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['services']['Insert']>
      }
      service_items: {
        Row: {
          id: string
          service_id: string
          tipo_item: ServiceItemType
          categoria: string | null
          descripcion: string
          cantidad: number
          precio_unitario: number
          tasa_impuesto: number
          monto_total: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['service_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['service_items']['Insert']>
      }
      transactions: {
        Row: {
          id: string
          service_id: string
          funeral_home_id: string
          branch_id: string
          numero_transaccion: string
          fecha_transaccion: string
          monto: number
          moneda: string
          metodo_pago: PaymentMethod
          cuenta_destino: string | null
          estado: TransactionStatus
          observaciones: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'numero_transaccion' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
      expenses: {
        Row: {
          id: string
          funeral_home_id: string
          branch_id: string
          service_id: string | null
          fecha_egreso: string
          supplier_id: string | null
          nombre_proveedor: string | null
          concepto: string
          monto: number
          categoria: string | null
          info_impuestos: string | null
          numero_factura: string | null
          estado: ExpenseStatus
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>
      }
      service_assignments: {
        Row: {
          id: string
          service_id: string
          collaborator_id: string
          rol_en_servicio: string
          tipo_extra: string
          monto_extra: number
          comentarios: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['service_assignments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['service_assignments']['Insert']>
      }
      mortuary_quotas: {
        Row: {
          id: string
          service_id: string
          aplica: boolean
          entidad: MortuaryQuotaEntity | null
          nombre_entidad: string | null
          monto_facturado: number | null
          pagador: MortuaryQuotaPayer | null
          estado: MortuaryQuotaStatus
          fecha_solicitud: string | null
          fecha_resolucion: string | null
          fecha_pago: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['mortuary_quotas']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['mortuary_quotas']['Insert']>
      }
      documents: {
        Row: {
          id: string
          service_id: string | null
          mortuary_quota_id: string | null
          document_type: DocumentType
          nombre_archivo: string
          url_archivo: string
          tamano_archivo: number | null
          tipo_mime: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
      service_procedures: {
        Row: {
          id: string
          service_id: string
          tipo_tramite: string
          estado: ProcedureStatus
          fecha_completado: string | null
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['service_procedures']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['service_procedures']['Insert']>
      }
      activity_logs: {
        Row: {
          id: string
          funeral_home_id: string
          branch_id: string | null
          user_id: string | null
          entity_type: string
          entity_id: string
          action: string
          detalles: Record<string, any> | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['activity_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['activity_logs']['Insert']>
      }
      payroll_periods: {
        Row: {
          id: string
          funeral_home_id: string
          nombre: string
          fecha_inicio: string
          fecha_fin: string
          estado: PayrollPeriodStatus
          notas: string | null
          total_bruto: number
          total_deducciones: number
          total_neto: number
          cantidad_colaboradores: number
          fecha_cierre: string | null
          cerrado_por: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payroll_periods']['Row'], 'id' | 'created_at' | 'updated_at' | 'total_bruto' | 'total_deducciones' | 'total_neto' | 'cantidad_colaboradores'>
        Update: Partial<Database['public']['Tables']['payroll_periods']['Insert']>
      }
      payroll_records: {
        Row: {
          id: string
          payroll_period_id: string
          collaborator_id: string
          funeral_home_id: string
          sueldo_base: number
          dias_trabajados: number
          cantidad_servicios: number
          total_extras: number
          bonos: number
          comisiones: number
          descuentos: number
          adelantos: number
          total_bruto: number
          total_deducciones: number
          total_neto: number
          aprobado: boolean
          fecha_aprobacion: string | null
          aprobado_por: string | null
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payroll_records']['Row'], 'id' | 'created_at' | 'updated_at' | 'total_bruto' | 'total_deducciones' | 'total_neto'>
        Update: Partial<Database['public']['Tables']['payroll_records']['Insert']>
      }
      payment_receipts: {
        Row: {
          id: string
          payroll_record_id: string
          funeral_home_id: string
          numero_recibo: string
          fecha_emision: string
          colaborador_nombre: string
          colaborador_rut: string
          periodo_nombre: string
          sueldo_base: number
          extras: number
          bonos: number
          comisiones: number
          total_bruto: number
          descuentos: number
          adelantos: number
          total_deducciones: number
          total_neto: number
          estado: PaymentReceiptStatus
          metodo_pago: string | null
          fecha_pago: string | null
          codigo_verificacion: string | null
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payment_receipts']['Row'], 'id' | 'numero_recibo' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['payment_receipts']['Insert']>
      }
    }
    Views: {
      service_summary: {
        Row: {
          id: string
          numero_servicio: string
          funeral_home_id: string
          branch_id: string
          estado: ServiceStatus
          tipo_servicio: ServiceType
          nombre_fallecido: string
          nombre_responsable: string
          total_final: number
          monto_pagado: number
          saldo: number
          transacciones_pagadas: number
          transacciones_pendientes: number
          fecha_inhumacion_cremacion: string | null
          fecha_inicio_velatorio: string | null
          created_at: string
          updated_at: string
        }
      }
      payroll_summary: {
        Row: {
          collaborator_id: string
          funeral_home_id: string
          nombre_completo: string
          rut: string
          type: CollaboratorType
          sueldo_base: number | null
          mes_nomina: string | null
          cantidad_servicios: number
          total_extras: number
          total_a_pagar: number
        }
      }
      collaborator_payroll_history: {
        Row: {
          collaborator_id: string
          nombre_completo: string
          rut: string
          tipo_colaborador: CollaboratorType
          periodo_id: string
          periodo_nombre: string
          fecha_inicio: string
          fecha_fin: string
          sueldo_base: number
          cantidad_servicios: number
          total_extras: number
          bonos: number
          comisiones: number
          total_bruto: number
          descuentos: number
          adelantos: number
          total_deducciones: number
          total_neto: number
          aprobado: boolean
          periodo_estado: PayrollPeriodStatus
          created_at: string
        }
      }
    }
    Functions: {
      calculate_service_total: {
        Args: { service_uuid: string }
        Returns: number
      }
      calculate_service_balance: {
        Args: { service_uuid: string }
        Returns: number
      }
      get_user_funeral_home_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<string, never>
        Returns: UserRole
      }
      user_has_branch_access: {
        Args: { branch_uuid: string }
        Returns: boolean
      }
    }
  }
}

// Utility types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']

// Specific table types for convenience
export type FuneralHome = Tables<'funeral_homes'>
export type Branch = Tables<'branches'>
export type Profile = Tables<'profiles'>
export type UserBranch = Tables<'user_branches'>
export type Collaborator = Tables<'collaborators'>
export type Plan = Tables<'plans'>
export type CoffinUrn = Tables<'coffin_urns'>
export type CemeteryCrematorium = Tables<'cemetery_crematoriums'>
export type Vehicle = Tables<'vehicles'>
export type Supplier = Tables<'suppliers'>
export type Service = Tables<'services'>
export type ServiceItem = Tables<'service_items'>
export type Transaction = Tables<'transactions'>
export type Expense = Tables<'expenses'>
export type ServiceAssignment = Tables<'service_assignments'>
export type MortuaryQuota = Tables<'mortuary_quotas'>
export type Document = Tables<'documents'>
export type ServiceProcedure = Tables<'service_procedures'>
export type ActivityLog = Tables<'activity_logs'>

// View types
export type ServiceSummary = Views<'service_summary'>
export type PayrollSummary = Views<'payroll_summary'>
export type CollaboratorPayrollHistory = Views<'collaborator_payroll_history'>

// Payroll table types
export type PayrollPeriod = Tables<'payroll_periods'>
export type PayrollRecord = Tables<'payroll_records'>
export type PaymentReceipt = Tables<'payment_receipts'>

// Insert types
export type FuneralHomeInsert = TablesInsert<'funeral_homes'>
export type BranchInsert = TablesInsert<'branches'>
export type ProfileInsert = TablesInsert<'profiles'>
export type CollaboratorInsert = TablesInsert<'collaborators'>
export type PlanInsert = TablesInsert<'plans'>
export type CoffinUrnInsert = TablesInsert<'coffin_urns'>
export type CemeteryCrematoriumInsert = TablesInsert<'cemetery_crematoriums'>
export type VehicleInsert = TablesInsert<'vehicles'>
export type SupplierInsert = TablesInsert<'suppliers'>
export type ServiceInsert = TablesInsert<'services'>
export type ServiceItemInsert = TablesInsert<'service_items'>
export type TransactionInsert = TablesInsert<'transactions'>
export type ExpenseInsert = TablesInsert<'expenses'>
export type ServiceAssignmentInsert = TablesInsert<'service_assignments'>
export type MortuaryQuotaInsert = TablesInsert<'mortuary_quotas'>
export type DocumentInsert = TablesInsert<'documents'>
export type ServiceProcedureInsert = TablesInsert<'service_procedures'>

// Update types
export type FuneralHomeUpdate = TablesUpdate<'funeral_homes'>
export type BranchUpdate = TablesUpdate<'branches'>
export type ProfileUpdate = TablesUpdate<'profiles'>
export type CollaboratorUpdate = TablesUpdate<'collaborators'>
export type PlanUpdate = TablesUpdate<'plans'>
export type CoffinUrnUpdate = TablesUpdate<'coffin_urns'>
export type CemeteryCrematoriumUpdate = TablesUpdate<'cemetery_crematoriums'>
export type VehicleUpdate = TablesUpdate<'vehicles'>
export type SupplierUpdate = TablesUpdate<'suppliers'>
export type ServiceUpdate = TablesUpdate<'services'>
export type ServiceItemUpdate = TablesUpdate<'service_items'>
export type TransactionUpdate = TablesUpdate<'transactions'>
export type ExpenseUpdate = TablesUpdate<'expenses'>
export type ServiceAssignmentUpdate = TablesUpdate<'service_assignments'>
export type MortuaryQuotaUpdate = TablesUpdate<'mortuary_quotas'>
export type PayrollPeriodInsert = TablesInsert<'payroll_periods'>
export type PayrollPeriodUpdate = TablesUpdate<'payroll_periods'>
export type PayrollRecordInsert = TablesInsert<'payroll_records'>
export type PayrollRecordUpdate = TablesUpdate<'payroll_records'>
export type PaymentReceiptInsert = TablesInsert<'payment_receipts'>
export type PaymentReceiptUpdate = TablesUpdate<'payment_receipts'>

// Extended types with relations (useful for queries with joins)
export type ServiceWithDetails = Service & {
  plan?: Plan | null
  coffin?: CoffinUrn | null
  urn?: CoffinUrn | null
  cemetery_crematorium?: CemeteryCrematorium | null
  main_vehicle?: Vehicle | null
  branch?: Branch
  items?: ServiceItem[]
  transactions?: Transaction[]
  assignments?: (ServiceAssignment & { collaborator?: Collaborator })[]
  mortuary_quota?: MortuaryQuota | null
  procedures?: ServiceProcedure[]
  documents?: Document[]
}

export type CollaboratorWithAssignments = Collaborator & {
  assignments?: ServiceAssignment[]
}

export type TransactionWithService = Transaction & {
  service?: Service
}

export type ExpenseWithSupplier = Expense & {
  supplier?: Supplier | null
  service?: Service | null
}

export type PayrollPeriodWithRecords = PayrollPeriod & {
  records?: PayrollRecordWithCollaborator[]
}

export type PayrollRecordWithCollaborator = PayrollRecord & {
  collaborator?: Collaborator
  receipt?: PaymentReceipt | null
}

export type PaymentReceiptWithDetails = PaymentReceipt & {
  payroll_record?: PayrollRecordWithCollaborator
}

export type ServiceAssignmentWithService = ServiceAssignment & {
  service?: Service
}
