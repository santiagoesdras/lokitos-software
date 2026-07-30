import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, hasSupabaseConfig } from '../lib/supabase'

const AuthContext = createContext()
const APP_ALLOWED_ROLES = ['Administrador', 'Vendedor']

function normalizeRoleName(role) {
  return String(role || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function isAppAllowedRole(role) {
  return APP_ALLOWED_ROLES.some(
    (allowedRole) => normalizeRoleName(allowedRole) === normalizeRoleName(role)
  )
}

async function loadProfileAndRole(sessionUser) {
  let profile = null
  let authError = null

  try {
    const { data: userById, error: userByIdError } = await supabase
      .from('usuarios')
      .select('id, email, nombre, role_id, activo')
      .eq('id', sessionUser.id)
      .maybeSingle()

    if (userByIdError) {
      authError = userByIdError.message
    }

    if (userById) {
      profile = userById
    } else if (sessionUser.email) {
      const { data: userByEmail, error: userByEmailError } = await supabase
        .from('usuarios')
        .select('id, email, nombre, role_id, activo')
        .ilike('email', sessionUser.email)
        .maybeSingle()

      if (userByEmailError) {
        authError = authError
          ? `${authError} | ${userByEmailError.message}`
          : userByEmailError.message
      }

      profile = userByEmail ?? null
    }
  } catch (error) {
    console.error('[Auth] Exception fetching profile:', error)
    authError = String(error?.message || error)
    profile = null
  }

  let role = null
  if (profile?.role_id) {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('nombre')
        .eq('id', profile.role_id)
        .maybeSingle()

      if (roleError) {
        authError = authError
          ? `${authError} | ${roleError.message}`
          : roleError.message
      }

      role = roleData?.nombre ?? null
    } catch (error) {
      console.error('[Auth] Exception fetching role:', error)
      authError = authError
        ? `${authError} | ${String(error?.message || error)}`
        : String(error?.message || error)
    }
  }

  return { profile, role, authError }
}

function getAccessDeniedMessage({ profile, role }) {
  if (!profile) {
    return 'Tu cuenta no tiene un perfil interno autorizado para usar este sistema.'
  }

  if (profile.activo === false) {
    return 'Esta cuenta ha sido desactivada por el administrador.'
  }

  if (!role || !isAppAllowedRole(role)) {
    return 'Tu cuenta no tiene un rol autorizado para acceder a Lokitos POS.'
  }

  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    let mounted = true

    if (!supabase || !hasSupabaseConfig()) {
      setUser(null)
      return () => {
        mounted = false
      }
    }

    async function applySession(session, options = {}) {
      const { shouldRedirectOnFailure = false, showAlertOnFailure = false } = options

      if (!session) {
        if (mounted) setUser(null)
        return
      }

      const { profile, role, authError } = await loadProfileAndRole(session.user)
      if (!mounted) return

      const accessDeniedMessage = getAccessDeniedMessage({ profile, role })
      if (accessDeniedMessage) {
        await supabase.auth.signOut()
        if (!mounted) return

        setUser(null)

        if (showAlertOnFailure) {
          alert(accessDeniedMessage)
        }

        if (shouldRedirectOnFailure && window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return
      }

      setUser({
        sessionUser: session.user,
        profile,
        role,
        authError,
      })
    }

    async function load() {
      const { data } = await supabase.auth.getSession()
      await applySession(data?.session ?? null)
    }

    load()

    const listener = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      await applySession(session, {
        shouldRedirectOnFailure: true,
        showAlertOnFailure: Boolean(session),
      })
    })

    return () => {
      mounted = false
      try {
        listener?.data?.subscription?.unsubscribe?.()
      } catch (error) {
        console.error('[Auth] Error unsubscribing auth listener:', error)
      }
    }
  }, [])

  const signIn = async (email, password) => {
    if (!supabase || !hasSupabaseConfig()) {
      return {
        error: {
          message:
            'Falta configurar Supabase en Vercel. Revisa las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.',
        },
      }
    }

    const result = await supabase.auth.signInWithPassword({ email, password })
    if (result.error || !result.data?.session) {
      return result
    }

    const { profile, role } = await loadProfileAndRole(result.data.session.user)
    const accessDeniedMessage = getAccessDeniedMessage({ profile, role })

    if (accessDeniedMessage) {
      await supabase.auth.signOut()
      setUser(null)
      return {
        data: result.data,
        error: { message: accessDeniedMessage },
      }
    }

    setUser({
      sessionUser: result.data.session.user,
      profile,
      role,
      authError: null,
    })

    return result
  }

  const signOut = async () => {
    if (!supabase || !hasSupabaseConfig()) {
      setUser(null)
      return { error: null }
    }

    setUser(null)
    return supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
