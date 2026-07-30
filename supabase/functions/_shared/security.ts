import { createClient } from '@supabase/supabase-js'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE') ?? ''

export const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function normalizeRoleName(role: string | null | undefined) {
  return String(role || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export async function readJsonBody(req: Request) {
  try {
    const raw = await req.json()
    return typeof raw === 'string' ? JSON.parse(raw) : raw || {}
  } catch {
    return {}
  }
}

export async function requireAuthenticatedUser(
  req: Request,
  allowedRoles: string[] = []
) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return {
      errorResponse: jsonResponse({ error: 'Missing Authorization header' }, 401),
      auth: null,
    }
  }

  const token = authHeader.replace('Bearer ', '').trim()
  const {
    data: { user: authUser },
    error: authError,
  } = await serviceClient.auth.getUser(token)

  if (authError || !authUser) {
    return {
      errorResponse: jsonResponse({ error: 'Unauthorized: Invalid token' }, 401),
      auth: null,
    }
  }

  let profile:
    | {
        id: string
        email: string | null
        nombre: string | null
        role_id: string | null
        activo: boolean
      }
    | null = null

  const { data: profileById, error: profileByIdError } = await serviceClient
    .from('usuarios')
    .select('id, email, nombre, role_id, activo')
    .eq('id', authUser.id)
    .maybeSingle()

  if (profileByIdError) {
    console.warn('security profile lookup by id failed', profileByIdError)
  }

  if (profileById) {
    profile = profileById
  } else if (authUser.email) {
    const { data: profileByEmail, error: profileByEmailError } = await serviceClient
      .from('usuarios')
      .select('id, email, nombre, role_id, activo')
      .ilike('email', authUser.email)
      .maybeSingle()

    if (profileByEmailError) {
      console.warn('security profile lookup by email failed', profileByEmailError)
    }

    profile = profileByEmail
  }

  if (!profile) {
    return {
      errorResponse: jsonResponse(
        { error: 'Forbidden: No existe un perfil interno asociado a esta cuenta.' },
        403
      ),
      auth: null,
    }
  }

  if (profile.activo === false) {
    return {
      errorResponse: jsonResponse(
        { error: 'Forbidden: La cuenta esta desactivada.' },
        403
      ),
      auth: null,
    }
  }

  let roleName: string | null = null
  if (profile.role_id) {
    const { data: role, error: roleError } = await serviceClient
      .from('roles')
      .select('nombre')
      .eq('id', profile.role_id)
      .maybeSingle()

    if (roleError) {
      console.warn('security role lookup failed', roleError)
    }

    roleName = role?.nombre ?? null
  }

  if (!roleName) {
    return {
      errorResponse: jsonResponse(
        { error: 'Forbidden: La cuenta no tiene un rol interno valido.' },
        403
      ),
      auth: null,
    }
  }

  if (
    Array.isArray(allowedRoles) &&
    allowedRoles.length > 0 &&
    !allowedRoles.some((allowedRole) => normalizeRoleName(allowedRole) === normalizeRoleName(roleName))
  ) {
    return {
      errorResponse: jsonResponse(
        { error: 'Forbidden: El usuario no tiene permisos para esta operacion.' },
        403
      ),
      auth: null,
    }
  }

  return {
    errorResponse: null,
    auth: {
      authUser,
      profile,
      roleName,
      accessToken: token,
    },
  }
}
