import {
  corsHeaders,
  jsonResponse,
  readJsonBody,
  requireAuthenticatedUser,
  serviceClient,
} from '../_shared/security.ts'

function formatErrorMessage(prefix: string, error: unknown) {
  if (error instanceof Error && error.message) {
    return `${prefix}: ${error.message}`
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return `${prefix}: ${String((error as { message?: unknown }).message)}`
  }

  return prefix
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { errorResponse, auth } = await requireAuthenticatedUser(req, ['Administrador'])
    if (errorResponse) return errorResponse

    const body = await readJsonBody(req)
    const { action, email, password, nombre, role_id, activo, userId } = body

    if (action === 'create') {
      if (!email || !password || !nombre || !role_id) {
        return jsonResponse({ error: 'Missing required fields for user creation' }, 400)
      }

      const { data: authData, error: createAuthError } = await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (createAuthError || !authData.user) {
        throw createAuthError || new Error('Auth user creation failed')
      }

      const { data: newProfile, error: createProfileError } = await serviceClient
        .from('usuarios')
        .insert({
          id: authData.user.id,
          email,
          nombre,
          role_id,
          activo: true,
        })
        .select()
        .single()

      if (createProfileError) {
        await serviceClient.auth.admin.deleteUser(authData.user.id)
        throw createProfileError
      }

      await serviceClient.from('auditoria').insert({
        entidad: 'usuarios',
        entidad_id: newProfile.id,
        accion: 'INSERT',
        usuario_id: auth.profile.id,
        datos_previos: null,
        datos_nuevos: newProfile,
      })

      return jsonResponse({ success: true, user: newProfile })
    }

    if (action === 'update') {
      if (!userId || !nombre || !role_id || typeof activo !== 'boolean') {
        return jsonResponse({ error: 'Missing required fields for update' }, 400)
      }

      const { data: oldProfile, error: oldProfileError } = await serviceClient
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single()

      if (oldProfileError) throw oldProfileError

      const { data: updatedProfile, error: updateError } = await serviceClient
        .from('usuarios')
        .update({
          nombre,
          role_id,
          activo,
        })
        .eq('id', userId)
        .select()
        .single()

      if (updateError) throw updateError

      const banDuration = activo === false ? '87600h' : 'none'
      const { error: authUpdateError } = await serviceClient.auth.admin.updateUserById(userId, {
        ban_duration: banDuration,
      })

      if (authUpdateError) {
        throw new Error(
          formatErrorMessage(
            activo === false
              ? 'No se pudo desactivar el acceso del usuario en Supabase Auth'
              : 'No se pudo reactivar el acceso del usuario en Supabase Auth',
            authUpdateError
          )
        )
      }

      await serviceClient.from('auditoria').insert({
        entidad: 'usuarios',
        entidad_id: userId,
        accion: 'UPDATE',
        usuario_id: auth.profile.id,
        datos_previos: oldProfile,
        datos_nuevos: updatedProfile,
      })

      return jsonResponse({ success: true, user: updatedProfile })
    }

    if (action === 'reset-password') {
      if (!userId || !password) {
        return jsonResponse({ error: 'Missing user ID or password' }, 400)
      }

      const { error: resetError } = await serviceClient.auth.admin.updateUserById(userId, {
        password,
      })

      if (resetError) throw resetError

      await serviceClient.from('auditoria').insert({
        entidad: 'usuarios',
        entidad_id: userId,
        accion: 'RESET_PASSWORD',
        usuario_id: auth.profile.id,
        datos_previos: null,
        datos_nuevos: { message: 'Password reset successful' },
      })

      return jsonResponse({ success: true, message: 'Password updated successfully' })
    }

    return jsonResponse({ error: 'Action not supported' }, 400)
  } catch (error: any) {
    console.error('manage-users error', error)
    return jsonResponse(
      {
        error: error?.message ?? String(error),
        details: error?.details ?? null,
        hint: error?.hint ?? null,
      },
      500
    )
  }
})
