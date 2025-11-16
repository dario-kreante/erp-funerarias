import { z } from 'zod'
import {
  uuidSchema,
  userRoleEnum,
  requiredStringSchema,
  emailSchema,
} from './common'

export const userSchema = z.object({
  funeral_home_id: uuidSchema,
  nombre_completo: requiredStringSchema.min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: emailSchema,
  role: userRoleEnum.default('colaborador'),
  url_avatar: z.string().url('URL de avatar inválida').optional().nullable(),
  estado_activo: z.boolean().default(true),
})

export type UserInput = z.infer<typeof userSchema>

// Schema for inviting a new user
export const inviteUserSchema = z.object({
  email: emailSchema,
  nombre_completo: requiredStringSchema.min(2, 'El nombre es requerido'),
  role: userRoleEnum,
  branch_ids: z.array(uuidSchema).min(1, 'Debe asignar al menos una sucursal'),
})

export type InviteUserInput = z.infer<typeof inviteUserSchema>

// Schema for updating user role
export const updateUserRoleSchema = z.object({
  user_id: uuidSchema,
  role: userRoleEnum,
})

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>

// Schema for updating user profile
export const updateUserProfileSchema = z.object({
  nombre_completo: requiredStringSchema.min(2).optional(),
  url_avatar: z.string().url().optional().nullable(),
})

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>

// Schema for deactivating user
export const deactivateUserSchema = z.object({
  user_id: uuidSchema,
})

export type DeactivateUserInput = z.infer<typeof deactivateUserSchema>

// Schema for user filters
export const userFilterSchema = z.object({
  role: userRoleEnum.optional(),
  estado_activo: z.boolean().optional(),
  branch_id: uuidSchema.optional(),
  search: z.string().optional(),
})

export type UserFilter = z.infer<typeof userFilterSchema>

// Schema for changing password
export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'La contraseña actual es requerida'),
  new_password: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  confirm_password: z.string().min(8),
}).refine(
  (data) => data.new_password === data.confirm_password,
  {
    message: 'Las contraseñas no coinciden',
    path: ['confirm_password'],
  }
).refine(
  (data) => data.current_password !== data.new_password,
  {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['new_password'],
  }
)

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// Password strength validation
export const passwordStrengthSchema = z.string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial')
