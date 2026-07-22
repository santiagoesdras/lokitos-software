import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, hasSupabaseConfig } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }){
  const [user, setUser] = useState(undefined) // undefined = loading, null = no user, object = authenticated

  // Helper to verify and enforce 12h session expiration
  const checkSessionExpiry = async () => {
    if (!supabase || !hasSupabaseConfig()) {
      return false
    }

    const loginTimeStr = localStorage.getItem('login_time')
    if (loginTimeStr) {
      const loginTime = parseInt(loginTimeStr)
      const twelveHoursMs = 12 * 60 * 60 * 1000
      if (Date.now() - loginTime > twelveHoursMs) {
        localStorage.removeItem('login_time')
        await supabase.auth.signOut()
        setUser(null)
        alert('Tu sesión ha expirado tras 12 horas. Por seguridad, inicia sesión nuevamente.')
        window.location.href = '/login'
        return true
      }
    }
    return false
  }

  useEffect(()=>{
    let mounted = true

    if (!supabase || !hasSupabaseConfig()) {
      setUser(null)
      return () => {
        mounted = false
      }
    }

    async function load(){
      if (!supabase || !hasSupabaseConfig()) {
        setUser(null)
        return
      }

      const isExpired = await checkSessionExpiry()
      if (isExpired) return

      const { data } = await supabase.auth.getSession()
      const session = data?.session ?? null
      if(!mounted) return
      if(!session){
        setUser(null)
        return
      }

      // Helper function to fetch profile and role
      const getProfileAndRole = async (sessionUser) => {
        let profile = null
        let authError = null

        try {
          // 1. Try matching by UUID
          const { data: uById, error: errId } = await supabase
            .from('usuarios')
            .select('id, nombre, role_id, activo')
            .eq('id', sessionUser.id)
            .maybeSingle()

          if (errId) {
            console.warn('[Auth] Error querying usuarios by ID:', errId.message)
            authError = errId.message
          }

          if (uById) {
            profile = uById
          } else if (sessionUser.email) {
            // 2. Fallback to case-insensitive email
            const { data: uByEmail, error: errEmail } = await supabase
              .from('usuarios')
              .select('id, nombre, role_id, activo')
              .ilike('email', sessionUser.email)
              .maybeSingle()

            if (errEmail) {
              console.warn('[Auth] Error querying usuarios by email:', errEmail.message)
              authError = authError ? `${authError} | ${errEmail.message}` : errEmail.message
            }
            profile = uByEmail ?? null
          }
        } catch (e) {
          console.error('[Auth] Exception fetching profile:', e)
          authError = String(e?.message || e)
          profile = null
        }

        let role = null
        if (profile?.role_id) {
          try {
            const { data: r, error: errRole } = await supabase
              .from('roles')
              .select('nombre')
              .eq('id', profile.role_id)
              .maybeSingle()

            if (errRole) {
              console.warn('[Auth] Error querying roles:', errRole.message)
              authError = authError ? `${authError} | Role Error: ${errRole.message}` : errRole.message
            }
            role = r?.nombre ?? null
          } catch (e) {
            console.error('[Auth] Exception fetching role:', e)
            role = null
          }
        }

        return { profile, role, authError }
      }

      const { profile, role, authError } = await getProfileAndRole(session.user)
      if (!mounted) return

      // Check if user account is deactivated
      if (profile && profile.activo === false) {
        localStorage.removeItem('login_time')
        await supabase.auth.signOut()
        setUser(null)
        alert('Esta cuenta ha sido desactivada por el administrador.')
        window.location.href = '/login'
        return
      }

      setUser({ sessionUser: session.user, profile, role, authError })
    }

    load()

    const listener = supabase.auth.onAuthStateChange(async (event, session) => {
      if(!mounted) return
      
      if(!session){
        localStorage.removeItem('login_time')
        setUser(null)
        return
      }

      // Check if session has expired (12 hours)
      const isExpired = await checkSessionExpiry()
      if (isExpired) return

      if (event === 'SIGNED_IN') {
        localStorage.setItem('login_time', Date.now().toString())
      }

      let profile = null
      let role = null
      try {
        const { data: uById } = await supabase
          .from('usuarios')
          .select('id, nombre, role_id, activo')
          .eq('id', session.user.id)
          .maybeSingle()

        if (uById) {
          profile = uById
        } else if (session.user.email) {
          const { data: uByEmail } = await supabase
            .from('usuarios')
            .select('id, nombre, role_id, activo')
            .ilike('email', session.user.email)
            .maybeSingle()
          profile = uByEmail ?? null
        }

        if (profile?.role_id) {
          const { data: r } = await supabase
            .from('roles')
            .select('nombre')
            .eq('id', profile.role_id)
            .maybeSingle()
          role = r?.nombre ?? null
        }
      } catch (e) {
        console.error('[Auth] Error in onAuthStateChange profile fetch:', e)
      }
      
      // Check if user is active
      if (profile && profile.activo === false) {
        localStorage.removeItem('login_time')
        await supabase.auth.signOut()
        setUser(null)
        alert('Esta cuenta ha sido desactivada por el administrador.')
        window.location.href = '/login'
        return
      }

      setUser({ sessionUser: session.user, profile, role })
    })

    // Check expiry every minute in case the app is left open
    const interval = setInterval(() => {
      checkSessionExpiry()
    }, 60000)

    return ()=>{
      mounted = false
      clearInterval(interval)
      try{ listener?.data?.subscription?.unsubscribe?.() }catch(e){}
    }
  },[])

  const signIn = async (email, password) => {
    if (!supabase || !hasSupabaseConfig()) {
      return { error: { message: 'Falta configurar Supabase en Vercel. Revisa las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.' } }
    }

    const res = await supabase.auth.signInWithPassword({ email, password })
    if (res.data?.session) {
      localStorage.setItem('login_time', Date.now().toString())
    }
    return res
  }

  const signOut = async ()=>{
    localStorage.removeItem('login_time')
    if (!supabase || !hasSupabaseConfig()) {
      return { error: null }
    }
    return supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = ()=> useContext(AuthContext)
