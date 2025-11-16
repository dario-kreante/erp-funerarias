import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const signupSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  funeralHomeLegalName: z.string().min(3),
  funeralHomeTradeName: z.string().optional().default(''),
  funeralHomeRut: z.string().min(3),
  branchName: z.string().min(2).default('Casa matriz'),
  branchAddress: z.string().optional().default(''),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const payload = signupSchema.parse(json)

    const admin = createAdminClient()

    // Check if user already exists by listing users with email filter
    const { data: { users } } = await admin.auth.admin.listUsers()
    const existingUser = users.find(user => user.email === payload.email)
    if (existingUser) {
      return NextResponse.json({ error: 'Ya existe un usuario con este correo' }, { status: 400 })
    }

    const {
      data: createdUser,
      error: createUserError,
    } = await admin.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        full_name: payload.fullName,
      },
    })

    if (createUserError || !createdUser.user) {
      return NextResponse.json(
        { error: createUserError?.message ?? 'No se pudo crear el usuario' },
        { status: 400 }
      )
    }

    const { user } = createdUser

    // Create tenant structure directly using admin client (bypasses RLS)
    // The admin client with service_role automatically bypasses RLS policies
    let funeralHomeId: string | null = null
    let branchId: string | null = null
    let createdProfile = false

    try {
      // 1. Crear funeraria (tabla usa columnas en español)
      const { data: funeralHome, error: funeralHomeError } = await admin
        .from('funeral_homes')
        .insert({
          razon_social: payload.funeralHomeLegalName,
          nombre_fantasia: payload.funeralHomeTradeName || null,
          rut: payload.funeralHomeRut,
          email: payload.email,
        })
        .select('id')
        .single()

      if (funeralHomeError || !funeralHome) {
        // Mensajes personalizados para violaciones comunes
        if (funeralHomeError?.code === '23505') {
          throw new Error('Ya existe una funeraria registrada con este RUT o correo')
        }
        throw new Error(funeralHomeError?.message || 'No se pudo crear la funeraria')
      }
      funeralHomeId = funeralHome.id

      // 2. Crear sucursal inicial
      const { data: branch, error: branchError } = await admin
        .from('branches')
        .insert({
          funeral_home_id: funeralHome.id,
          nombre: payload.branchName || 'Casa matriz',
          direccion: payload.branchAddress || null,
        })
        .select('id')
        .single()

      if (branchError || !branch) {
        // Cleanup: delete funeral home if branch creation fails
        await admin.from('funeral_homes').delete().eq('id', funeralHome.id)
        throw new Error(branchError?.message || 'No se pudo crear la sucursal')
      }
      branchId = branch.id

      // 3. Crear o actualizar perfil del administrador
      const { data: existingProfile, error: existingProfileError } = await admin
        .from('profiles')
        .select('id, funeral_home_id')
        .eq('id', user.id)
        .maybeSingle()

      if (existingProfileError) {
        throw new Error(existingProfileError.message || 'No se pudo validar el perfil del usuario')
      }

      if (existingProfile?.funeral_home_id && existingProfile.funeral_home_id !== funeralHome.id) {
        throw new Error('Este usuario ya tiene una funeraria configurada')
      }

      if (existingProfile) {
        const { error: profileUpdateError } = await admin
          .from('profiles')
          .update({
            funeral_home_id: funeralHome.id,
            nombre_completo: payload.fullName,
            email: payload.email,
            estado: 'activo',
          })
          .eq('id', user.id)

        if (profileUpdateError) {
          throw new Error(profileUpdateError.message || 'No se pudo actualizar el perfil')
        }
      } else {
        const { error: profileInsertError } = await admin
          .from('profiles')
          .insert({
            id: user.id,
            funeral_home_id: funeralHome.id,
            nombre_completo: payload.fullName,
            email: payload.email,
            estado: 'activo',
          })

        if (profileInsertError) {
          throw new Error(profileInsertError.message || 'No se pudo crear el perfil')
        }

        createdProfile = true
      }

      // 4. Asignar administrador a la sucursal
      const { error: userBranchError } = await admin
        .from('user_branches')
        .upsert(
          {
            user_id: user.id,
            branch_id: branch.id,
          },
          { onConflict: 'user_id,branch_id' }
        )

      if (userBranchError) {
        // Cleanup: delete profile (solo si fue creado acá), branch and funeral home if assignment fails
        if (createdProfile) {
          await admin.from('profiles').delete().eq('id', user.id)
        } else {
          await admin
            .from('profiles')
            .update({ funeral_home_id: null })
            .eq('id', user.id)
        }
        await admin.from('branches').delete().eq('id', branch.id)
        await admin.from('funeral_homes').delete().eq('id', funeralHome.id)
        throw new Error(userBranchError.message || 'No se pudo asignar la sucursal')
      }
    } catch (tenantError) {
      console.error('Error creating tenant:', tenantError)
      await admin.auth.admin.deleteUser(user.id)
      // Cleanup adicional si quedó algo pendiente
      if (createdProfile) {
        await admin.from('profiles').delete().eq('id', user.id)
      } else if (funeralHomeId) {
        // Si el perfil existía previamente, asegúrate de dejarlo en estado consistente
        await admin
          .from('profiles')
          .update({ funeral_home_id: null })
          .eq('id', user.id)
      }
      if (branchId) {
        await admin.from('user_branches').delete().eq('branch_id', branchId).eq('user_id', user.id)
        await admin.from('branches').delete().eq('id', branchId)
      }
      if (funeralHomeId) {
        await admin.from('funeral_homes').delete().eq('id', funeralHomeId)
      }
      return NextResponse.json(
        {
          error:
            tenantError instanceof Error
              ? tenantError.message
              : 'No se pudo completar la configuración inicial. Intenta nuevamente más tarde.',
          details: process.env.NODE_ENV === 'development' ? tenantError : undefined,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos. Revisa la información ingresada.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Ha ocurrido un error inesperado al crear la cuenta' },
      { status: 500 }
    )
  }
}


