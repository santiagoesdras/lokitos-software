import { serve } from 'std/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const sb = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE as string)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Verify caller authentication and authorization
    const callerClient = createClient(SUPABASE_URL as string, req.headers.get('apikey') || '', {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user: callerUser }, error: authErr } = await callerClient.auth.getUser()
    if (authErr || !callerUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Verify caller role (Must be Administrador)
    const { data: callerProfile, error: profErr } = await sb
      .from('usuarios')
      .select('role_id')
      .eq('email', callerUser.email)
      .single()

    if (profErr || !callerProfile) {
      return new Response(JSON.stringify({ error: 'Caller profile not found' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: callerRole, error: roleErr } = await sb
      .from('roles')
      .select('nombre')
      .eq('id', callerProfile.role_id)
      .single()

    if (roleErr || callerRole?.nombre !== 'Administrador') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin role required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Parse requested action
    const body = await req.json()
    const { action, email, password, nombre, role_id, activo, userId } = body

    if (action === 'create') {
      if (!email || !password || !nombre || !role_id) {
        return new Response(JSON.stringify({ error: 'Missing required fields for user creation' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // 1. Create auth user in Supabase Auth
      const { data: authData, error: createAuthErr } = await sb.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

      if (createAuthErr || !authData.user) {
        throw createAuthErr || new Error('Auth user creation failed')
      }

      // 2. Create profile in usuarios table
      const { data: newProfile, error: createProfileErr } = await sb
        .from('usuarios')
        .insert({
          id: authData.user.id,
          email,
          nombre,
          role_id,
          activo: true
        })
        .select()
        .single()

      if (createProfileErr) {
        // Cleanup created auth user if profile insert fails
        await sb.auth.admin.deleteUser(authData.user.id)
        throw createProfileErr
      }

      // Log audit
      await sb.from('auditoria').insert({
        entidad: 'usuarios',
        entidad_id: newProfile.id,
        accion: 'INSERT',
        usuario_id: callerUser.id,
        datos_previos: null,
        datos_nuevos: newProfile
      })

      return new Response(JSON.stringify({ success: true, user: newProfile }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } 
    
    if (action === 'update') {
      if (!userId || !nombre || !role_id) {
        return new Response(JSON.stringify({ error: 'Missing required fields for update' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Get current profile for audit
      const { data: oldProfile } = await sb.from('usuarios').select('*').eq('id', userId).single()

      // Update usuarios table
      const { data: updatedProfile, error: updateErr } = await sb
        .from('usuarios')
        .update({
          nombre,
          role_id,
          activo
        })
        .eq('id', userId)
        .select()
        .single()

      if (updateErr) throw updateErr

      // If account deactivated, ban the user from Supabase Auth so they can't log in anymore
      // Ban duration: 87600h = 10 years
      const ban_duration = activo === false ? '87600h' : 'none'
      await sb.auth.admin.updateUserById(userId, { ban_duration })

      // Log audit
      await sb.from('auditoria').insert({
        entidad: 'usuarios',
        entidad_id: userId,
        accion: 'UPDATE',
        usuario_id: callerUser.id,
        datos_previos: oldProfile,
        datos_nuevos: updatedProfile
      })

      return new Response(JSON.stringify({ success: true, user: updatedProfile }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } 
    
    if (action === 'reset-password') {
      if (!userId || !password) {
        return new Response(JSON.stringify({ error: 'Missing user ID or password' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Reset password in Supabase Auth
      const { error: resetErr } = await sb.auth.admin.updateUserById(userId, {
        password: password
      })

      if (resetErr) throw resetErr

      // Log audit
      await sb.from('auditoria').insert({
        entidad: 'usuarios',
        entidad_id: userId,
        accion: 'RESET_PASSWORD',
        usuario_id: callerUser.id,
        datos_previos: null,
        datos_nuevos: { message: 'Password reset successful' }
      })

      return new Response(JSON.stringify({ success: true, message: 'Password updated successfully' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Action not supported' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    console.error('manage-users error', err)
    return new Response(JSON.stringify({ error: err.message ?? String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
