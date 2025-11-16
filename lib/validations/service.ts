import { z } from 'zod'

export const serviceSchema = z.object({
  funeral_home_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  status: z.enum(['borrador', 'confirmado', 'en_ejecucion', 'finalizado', 'cerrado']),
  service_type: z.enum(['inhumacion', 'cremacion', 'traslado_nacional', 'traslado_internacional', 'solo_velatorio']),
  general_notes: z.string().optional().nullable(),
  
  // Deceased information
  deceased_name: z.string().min(1, 'El nombre del fallecido es requerido'),
  deceased_rut: z.string().optional().nullable(),
  deceased_birth_date: z.string().optional().nullable(),
  deceased_death_date: z.string().min(1, 'La fecha de fallecimiento es requerida'),
  deceased_death_place_type: z.enum(['domicilio', 'hospital', 'via_publica', 'otro']).optional().nullable(),
  deceased_death_place: z.string().optional().nullable(),
  deceased_death_cause: z.string().optional().nullable(),
  
  // Responsible person
  responsible_name: z.string().min(1, 'El nombre del responsable es requerido'),
  responsible_rut: z.string().min(1, 'El RUT del responsable es requerido'),
  responsible_phone: z.string().min(1, 'El teléfono del responsable es requerido'),
  responsible_email: z.string().email().optional().nullable(),
  responsible_address: z.string().optional().nullable(),
  responsible_relationship: z.string().optional().nullable(),
  
  // Plan and products
  plan_id: z.string().uuid().optional().nullable(),
  coffin_id: z.string().uuid().optional().nullable(),
  urn_id: z.string().uuid().optional().nullable(),
  
  // Pricing
  discount_amount: z.number().min(0).default(0),
  discount_percentage: z.number().min(0).max(100).default(0),
  
  // Agenda and logistics
  pickup_date: z.string().optional().nullable(),
  wake_start_date: z.string().optional().nullable(),
  wake_room: z.string().optional().nullable(),
  religious_ceremony_date: z.string().optional().nullable(),
  burial_cremation_date: z.string().optional().nullable(),
  cemetery_crematorium_id: z.string().uuid().optional().nullable(),
  main_vehicle_id: z.string().uuid().optional().nullable(),
  other_vehicles: z.array(z.string()).optional().nullable(),
  logistics_notes: z.string().optional().nullable(),
})

export type ServiceInput = z.infer<typeof serviceSchema>

