import { z } from 'zod'

// Chilean RUT validation
export const rutRegex = /^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9kK]$/

export function validateRutCheckDigit(rut: string): boolean {
  // Remove dots and dash
  const cleanRut = rut.replace(/\./g, '').replace('-', '')
  const rutNumber = cleanRut.slice(0, -1)
  const checkDigit = cleanRut.slice(-1).toLowerCase()

  // Calculate check digit
  let sum = 0
  let multiplier = 2
  for (let i = rutNumber.length - 1; i >= 0; i--) {
    sum += parseInt(rutNumber[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const expectedDigit = 11 - (sum % 11)
  const calculatedDigit =
    expectedDigit === 11 ? '0' : expectedDigit === 10 ? 'k' : expectedDigit.toString()

  return checkDigit === calculatedDigit
}

export const rutSchema = z
  .string()
  .regex(rutRegex, 'Formato de RUT inválido. Use: 12.345.678-9')
  .refine(validateRutCheckDigit, 'Dígito verificador de RUT inválido')

export const optionalRutSchema = z
  .string()
  .regex(rutRegex, 'Formato de RUT inválido. Use: 12.345.678-9')
  .refine(validateRutCheckDigit, 'Dígito verificador de RUT inválido')
  .optional()
  .nullable()

// Phone validation (Chilean format)
export const phoneRegex = /^(\+56)?[2-9]\d{8}$/

export const phoneSchema = z.string().regex(phoneRegex, 'Formato de teléfono inválido. Use: +56912345678')

export const optionalPhoneSchema = z
  .string()
  .regex(phoneRegex, 'Formato de teléfono inválido')
  .optional()
  .nullable()

// Email validation
export const emailSchema = z.string().email('Email inválido')

export const optionalEmailSchema = z.string().email('Email inválido').optional().nullable()

// Currency/Money validation
export const moneySchema = z.number().min(0, 'El monto no puede ser negativo')

export const positiveMoneySchema = z.number().positive('El monto debe ser mayor a 0')

export const percentageSchema = z.number().min(0, 'El porcentaje no puede ser negativo').max(100, 'El porcentaje no puede exceder 100')

// Date validations
export const dateSchema = z.string().refine((val) => {
  const date = new Date(val)
  return !isNaN(date.getTime())
}, 'Fecha inválida')

export const optionalDateSchema = z
  .string()
  .refine((val) => {
    const date = new Date(val)
    return !isNaN(date.getTime())
  }, 'Fecha inválida')
  .optional()
  .nullable()

export const pastDateSchema = z.string().refine((val) => {
  const date = new Date(val)
  return !isNaN(date.getTime()) && date <= new Date()
}, 'La fecha debe ser pasada o actual')

export const futureDateSchema = z.string().refine((val) => {
  const date = new Date(val)
  return !isNaN(date.getTime()) && date >= new Date()
}, 'La fecha debe ser futura o actual')

// UUID validation
export const uuidSchema = z.string().uuid('ID inválido')

export const optionalUuidSchema = z.string().uuid('ID inválido').optional().nullable()

// Text validations
export const requiredStringSchema = z.string().min(1, 'Este campo es requerido')

export const optionalStringSchema = z.string().optional().nullable()

// SKU validation
export const skuSchema = z
  .string()
  .min(3, 'SKU debe tener al menos 3 caracteres')
  .max(20, 'SKU no puede exceder 20 caracteres')
  .regex(/^[A-Z0-9-]+$/, 'SKU solo puede contener letras mayúsculas, números y guiones')

export const optionalSkuSchema = z
  .string()
  .min(3, 'SKU debe tener al menos 3 caracteres')
  .max(20, 'SKU no puede exceder 20 caracteres')
  .regex(/^[A-Z0-9-]+$/, 'SKU solo puede contener letras mayúsculas, números y guiones')
  .optional()
  .nullable()

// Enums from database types
export const userRoleEnum = z.enum(['admin', 'ejecutivo', 'operaciones', 'caja', 'colaborador'])

export const serviceStatusEnum = z.enum(['borrador', 'confirmado', 'en_ejecucion', 'finalizado', 'cerrado'])

export const serviceTypeEnum = z.enum([
  'inhumacion',
  'cremacion',
  'traslado_nacional',
  'traslado_internacional',
  'solo_velatorio',
])

export const transactionStatusEnum = z.enum(['pendiente', 'pagado', 'rechazado', 'reembolsado'])

export const paymentMethodEnum = z.enum([
  'efectivo',
  'transferencia',
  'tarjeta',
  'cheque',
  'seguro',
  'cuota_mortuoria',
])

export const expenseStatusEnum = z.enum(['con_factura', 'pendiente_factura', 'sin_factura'])

export const collaboratorTypeEnum = z.enum(['empleado', 'honorario'])

export const documentTypeEnum = z.enum([
  'certificado_defuncion',
  'pase_sepultacion',
  'documentos_sml',
  'factura_boleta',
  'cuota_mortuoria_docs',
  'contrato',
  'otro',
])

export const mortuaryQuotaStatusEnum = z.enum([
  'no_iniciada',
  'en_preparacion',
  'ingresada',
  'aprobada',
  'rechazada',
  'pagada',
])

export const mortuaryQuotaEntityEnum = z.enum(['afp', 'ips', 'pgu', 'otra'])

export const mortuaryQuotaPayerEnum = z.enum(['familia', 'funeraria'])

export const coffinUrnTypeEnum = z.enum(['ataud', 'urna'])

export const cemeteryCrematoriumTypeEnum = z.enum(['cementerio', 'crematorio'])

export const vehicleStatusEnum = z.enum(['disponible', 'en_mantenimiento'])

export const deathPlaceTypeEnum = z.enum(['domicilio', 'hospital', 'via_publica', 'otro'])

export const serviceItemTypeEnum = z.enum(['plan', 'ataud', 'urna', 'extra'])

export const procedureStatusEnum = z.enum(['pendiente', 'en_proceso', 'completo'])

export const payrollPeriodStatusEnum = z.enum(['abierto', 'cerrado', 'procesado', 'pagado'])

export const paymentReceiptStatusEnum = z.enum(['pendiente', 'generado', 'enviado', 'pagado'])

export const eventTypeEnum = z.enum([
  'velatorio',
  'ceremonia',
  'cremacion',
  'inhumacion',
  'recogida',
  'reunion',
  'mantenimiento',
  'otro',
])

export const resourceTypeEnum = z.enum(['sala', 'vehiculo', 'colaborador', 'equipamiento'])

export const eventStatusEnum = z.enum(['programado', 'en_progreso', 'completado', 'cancelado'])

// Color validation (hex format)
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser en formato hexadecimal (#RRGGBB)')

export const optionalHexColorSchema = hexColorSchema.optional().nullable()
