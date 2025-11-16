'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  createPayrollPeriodSchema,
  updatePayrollPeriodSchema,
  updatePayrollRecordSchema,
  closePayrollPeriodSchema,
  generateReceiptSchema,
  updateReceiptStatusSchema,
  type CreatePayrollPeriodInput,
  type UpdatePayrollPeriodInput,
  type UpdatePayrollRecordInput,
  type ClosePayrollPeriodInput,
  type GenerateReceiptInput,
  type UpdateReceiptStatusInput,
  type PayrollPeriodFilter,
} from '@/lib/validations/payroll'

// Payroll Period Actions
export async function getPayrollPeriods(filters?: PayrollPeriodFilter) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('funeral_home_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Perfil no encontrado')
  }

  let query = supabase
    .from('payroll_periods')
    .select('*')
    .eq('funeral_home_id', profile.funeral_home_id)
    .order('fecha_inicio', { ascending: false })

  if (filters?.estado) {
    query = query.eq('estado', filters.estado)
  }

  if (filters?.fecha_desde) {
    query = query.gte('fecha_inicio', filters.fecha_desde)
  }

  if (filters?.fecha_hasta) {
    query = query.lte('fecha_fin', filters.fecha_hasta)
  }

  if (filters?.search) {
    query = query.ilike('nombre', `%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

export async function getPayrollPeriod(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data, error } = await supabase
    .from('payroll_periods')
    .select(
      `
      *,
      payroll_records(
        *,
        collaborator:collaborators(id, nombre_completo, rut, type, cargo, sueldo_base),
        payment_receipts(*)
      )
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function createPayrollPeriod(input: CreatePayrollPeriodInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('funeral_home_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Perfil no encontrado')
  }

  const validated = createPayrollPeriodSchema.parse({
    ...input,
    funeral_home_id: profile.funeral_home_id,
  })

  const { data, error } = await supabase
    .from('payroll_periods')
    .insert(validated)
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/nomina/periodos')
  return data
}

export async function updatePayrollPeriod(input: UpdatePayrollPeriodInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = updatePayrollPeriodSchema.parse(input)
  const { period_id, ...updateData } = validated

  const { data, error } = await supabase
    .from('payroll_periods')
    .update(updateData)
    .eq('id', period_id)
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/nomina/periodos')
  revalidatePath(`/nomina/periodos/${period_id}`)
  return data
}

export async function closePayrollPeriod(input: ClosePayrollPeriodInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = closePayrollPeriodSchema.parse(input)

  const { data, error } = await supabase
    .from('payroll_periods')
    .update({
      estado: 'cerrado',
      fecha_cierre: new Date().toISOString(),
      cerrado_por: user.id,
      notas: validated.notas,
    })
    .eq('id', validated.period_id)
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/nomina/periodos')
  revalidatePath(`/nomina/periodos/${validated.period_id}`)
  return data
}

export async function deletePayrollPeriod(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { error } = await supabase.from('payroll_periods').delete().eq('id', id)

  if (error) {
    throw error
  }

  revalidatePath('/nomina/periodos')
}

// Calculate and generate payroll records for a period
export async function calculatePayrollForPeriod(periodId: string, includeInactive = false) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('funeral_home_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Perfil no encontrado')
  }

  // Get the period
  const { data: period, error: periodError } = await supabase
    .from('payroll_periods')
    .select('*')
    .eq('id', periodId)
    .single()

  if (periodError || !period) {
    throw new Error('Período no encontrado')
  }

  // Get all collaborators
  let collaboratorsQuery = supabase
    .from('collaborators')
    .select('*')
    .eq('funeral_home_id', profile.funeral_home_id)

  if (!includeInactive) {
    collaboratorsQuery = collaboratorsQuery.eq('estado_activo', true)
  }

  const { data: collaborators, error: collabError } = await collaboratorsQuery

  if (collabError) {
    throw collabError
  }

  // Get service assignments within the period
  const { data: assignments, error: assignError } = await supabase
    .from('service_assignments')
    .select(
      `
      *,
      service:services(id, fecha_fallecimiento)
    `
    )
    .gte('created_at', period.fecha_inicio)
    .lte('created_at', period.fecha_fin + 'T23:59:59')

  if (assignError) {
    throw assignError
  }

  // Calculate payroll for each collaborator
  const payrollRecords = []

  for (const collaborator of collaborators || []) {
    // Get assignments for this collaborator
    const collabAssignments =
      assignments?.filter((a) => a.collaborator_id === collaborator.id) || []
    const cantidadServicios = collabAssignments.length
    const totalExtras = collabAssignments.reduce((sum, a) => sum + (a.monto_extra || 0), 0)

    // Check if record already exists
    const { data: existingRecord } = await supabase
      .from('payroll_records')
      .select('id')
      .eq('payroll_period_id', periodId)
      .eq('collaborator_id', collaborator.id)
      .single()

    if (existingRecord) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('payroll_records')
        .update({
          sueldo_base: collaborator.type === 'empleado' ? collaborator.sueldo_base || 0 : 0,
          cantidad_servicios: cantidadServicios,
          total_extras: totalExtras,
        })
        .eq('id', existingRecord.id)

      if (updateError) {
        console.error('Error updating record:', updateError)
      }
    } else {
      // Create new record
      payrollRecords.push({
        payroll_period_id: periodId,
        collaborator_id: collaborator.id,
        funeral_home_id: profile.funeral_home_id,
        sueldo_base: collaborator.type === 'empleado' ? collaborator.sueldo_base || 0 : 0,
        dias_trabajados: 0,
        cantidad_servicios: cantidadServicios,
        total_extras: totalExtras,
        bonos: 0,
        comisiones: 0,
        descuentos: 0,
        adelantos: 0,
        aprobado: false,
      })
    }
  }

  // Insert new records
  if (payrollRecords.length > 0) {
    const { error: insertError } = await supabase.from('payroll_records').insert(payrollRecords)

    if (insertError) {
      throw insertError
    }
  }

  revalidatePath(`/nomina/periodos/${periodId}`)
  return { created: payrollRecords.length, updated: (collaborators?.length || 0) - payrollRecords.length }
}

// Payroll Record Actions
export async function updatePayrollRecord(input: UpdatePayrollRecordInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = updatePayrollRecordSchema.parse(input)
  const { record_id, ...updateData } = validated

  const { data, error } = await supabase
    .from('payroll_records')
    .update(updateData)
    .eq('id', record_id)
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/nomina/periodos')
  return data
}

export async function approvePayrollRecord(recordId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data, error } = await supabase
    .from('payroll_records')
    .update({
      aprobado: true,
      fecha_aprobacion: new Date().toISOString(),
      aprobado_por: user.id,
    })
    .eq('id', recordId)
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/nomina/periodos')
  return data
}

export async function approveAllRecords(periodId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data, error } = await supabase
    .from('payroll_records')
    .update({
      aprobado: true,
      fecha_aprobacion: new Date().toISOString(),
      aprobado_por: user.id,
    })
    .eq('payroll_period_id', periodId)
    .eq('aprobado', false)
    .select()

  if (error) {
    throw error
  }

  revalidatePath(`/nomina/periodos/${periodId}`)
  return data
}

// Payment Receipt Actions
export async function generatePaymentReceipt(input: GenerateReceiptInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = generateReceiptSchema.parse(input)

  // Get the payroll record with collaborator and period info
  const { data: record, error: recordError } = await supabase
    .from('payroll_records')
    .select(
      `
      *,
      collaborator:collaborators(nombre_completo, rut, metodo_pago),
      period:payroll_periods(nombre)
    `
    )
    .eq('id', validated.payroll_record_id)
    .single()

  if (recordError || !record) {
    throw new Error('Registro de nómina no encontrado')
  }

  // Check if receipt already exists
  const { data: existingReceipt } = await supabase
    .from('payment_receipts')
    .select('id')
    .eq('payroll_record_id', validated.payroll_record_id)
    .single()

  if (existingReceipt) {
    throw new Error('Ya existe un recibo para este registro')
  }

  // Generate verification code
  const verificationCode = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase()

  // Create the receipt
  const { data: receipt, error: receiptError } = await supabase
    .from('payment_receipts')
    .insert({
      payroll_record_id: validated.payroll_record_id,
      funeral_home_id: record.funeral_home_id,
      colaborador_nombre: (record as any).collaborator.nombre_completo,
      colaborador_rut: (record as any).collaborator.rut,
      periodo_nombre: (record as any).period.nombre,
      sueldo_base: record.sueldo_base,
      extras: record.total_extras,
      bonos: record.bonos,
      comisiones: record.comisiones,
      total_bruto: record.total_bruto,
      descuentos: record.descuentos,
      adelantos: record.adelantos,
      total_deducciones: record.total_deducciones,
      total_neto: record.total_neto,
      estado: 'generado',
      metodo_pago: (record as any).collaborator.metodo_pago,
      codigo_verificacion: verificationCode,
    })
    .select()
    .single()

  if (receiptError) {
    throw receiptError
  }

  revalidatePath('/nomina/periodos')
  revalidatePath('/nomina/recibos')
  return receipt
}

export async function generateAllReceipts(periodId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  // Get all approved records without receipts
  const { data: records, error: recordsError } = await supabase
    .from('payroll_records')
    .select(
      `
      *,
      collaborator:collaborators(nombre_completo, rut, metodo_pago),
      period:payroll_periods(nombre)
    `
    )
    .eq('payroll_period_id', periodId)
    .eq('aprobado', true)

  if (recordsError) {
    throw recordsError
  }

  const receipts = []
  let skipped = 0

  for (const record of records || []) {
    // Check if receipt exists
    const { data: existingReceipt } = await supabase
      .from('payment_receipts')
      .select('id')
      .eq('payroll_record_id', record.id)
      .single()

    if (existingReceipt) {
      skipped++
      continue
    }

    const verificationCode = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase()

    receipts.push({
      payroll_record_id: record.id,
      funeral_home_id: record.funeral_home_id,
      colaborador_nombre: (record as any).collaborator.nombre_completo,
      colaborador_rut: (record as any).collaborator.rut,
      periodo_nombre: (record as any).period.nombre,
      sueldo_base: record.sueldo_base,
      extras: record.total_extras,
      bonos: record.bonos,
      comisiones: record.comisiones,
      total_bruto: record.total_bruto,
      descuentos: record.descuentos,
      adelantos: record.adelantos,
      total_deducciones: record.total_deducciones,
      total_neto: record.total_neto,
      estado: 'generado' as const,
      metodo_pago: (record as any).collaborator.metodo_pago,
      codigo_verificacion: verificationCode,
    })
  }

  if (receipts.length > 0) {
    const { error: insertError } = await supabase.from('payment_receipts').insert(receipts)

    if (insertError) {
      throw insertError
    }
  }

  revalidatePath(`/nomina/periodos/${periodId}`)
  revalidatePath('/nomina/recibos')
  return { generated: receipts.length, skipped }
}

export async function updateReceiptStatus(input: UpdateReceiptStatusInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = updateReceiptStatusSchema.parse(input)
  const { receipt_id, ...updateData } = validated

  const { data, error } = await supabase
    .from('payment_receipts')
    .update(updateData)
    .eq('id', receipt_id)
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/nomina/recibos')
  return data
}

export async function getPaymentReceipts(periodId?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('funeral_home_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Perfil no encontrado')
  }

  let query = supabase
    .from('payment_receipts')
    .select('*')
    .eq('funeral_home_id', profile.funeral_home_id)
    .order('fecha_emision', { ascending: false })

  if (periodId) {
    // Get records for this period first
    const { data: records } = await supabase
      .from('payroll_records')
      .select('id')
      .eq('payroll_period_id', periodId)

    if (records && records.length > 0) {
      const recordIds = records.map((r) => r.id)
      query = query.in('payroll_record_id', recordIds)
    }
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

export async function getPaymentReceipt(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data, error } = await supabase
    .from('payment_receipts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  return data
}
