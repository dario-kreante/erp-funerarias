import { z } from 'zod'
import {
  uuidSchema,
  optionalStringSchema,
  requiredStringSchema,
  optionalPhoneSchema,
} from './common'

export const branchSchema = z.object({
  funeral_home_id: uuidSchema,
  nombre: requiredStringSchema.min(2, 'El nombre de la sucursal debe tener al menos 2 caracteres'),
  direccion: optionalStringSchema,
  telefono: optionalPhoneSchema,
  nombre_gerente: optionalStringSchema,
  estado_activo: z.boolean().default(true),
})

export type BranchInput = z.infer<typeof branchSchema>

// Schema for creating a new branch
export const createBranchSchema = branchSchema

export type CreateBranchInput = z.infer<typeof createBranchSchema>

// Schema for updating branch
export const updateBranchSchema = branchSchema.partial().extend({
  branch_id: uuidSchema,
})

export type UpdateBranchInput = z.infer<typeof updateBranchSchema>

// Schema for deactivating branch
export const deactivateBranchSchema = z.object({
  branch_id: uuidSchema,
})

export type DeactivateBranchInput = z.infer<typeof deactivateBranchSchema>

// Schema for branch filters
export const branchFilterSchema = z.object({
  estado_activo: z.boolean().optional(),
  search: z.string().optional(),
})

export type BranchFilter = z.infer<typeof branchFilterSchema>

// Schema for assigning user to branch
export const assignUserToBranchSchema = z.object({
  user_id: uuidSchema,
  branch_id: uuidSchema,
})

export type AssignUserToBranchInput = z.infer<typeof assignUserToBranchSchema>

// Schema for removing user from branch
export const removeUserFromBranchSchema = z.object({
  user_id: uuidSchema,
  branch_id: uuidSchema,
})

export type RemoveUserFromBranchInput = z.infer<typeof removeUserFromBranchSchema>
