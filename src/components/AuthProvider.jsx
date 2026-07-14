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

      // Fetch profile from usuarios table to get role
      const email = session.user.email
      let profile = null
      try{
        const { data: u } = await supabase.from('usuarios').select('id, nombre, role_id, activo').eq('email', email).maybeSingle()
        profile = u ?? null
      }catch(e){
        profile = null
      }

      // Check if user account is deactivated
      if (profile && profile.activo === false) {
        localStorage.removeItem('login_time')
        await supabase.auth.signOut()
        setUser(null)
        alert('Esta cuenta ha sido desactivada por el administrador.')
        window.location.href = '/login'
        return
      }

      let role = null
      if(profile?.role_id){
        try{
          const { data: r } = await supabase.from('roles').select('nombre').eq('id', profile.role_id).maybeSingle()
          role = r?.nombre ?? null
        }catch(e){ role = null }
      }

      setUser({ sessionUser: session.user, profile, role })
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

      const email = session.user.email
      const { data: u } = await supabase.from('usuarios').select('id, nombre, role_id, activo').eq('email', email).maybeSingle()
      
      // Check if user is active
      if (u && u.activo === false) {
        localStorage.removeItem('login_time')
        await supabase.auth.signOut()
        setUser(null)
        alert('Esta cuenta ha sido desactivada por el administrador.')
        window.location.href = '/login'
        return
      }

      let role = null
      if(u?.role_id){
        const { data: r } = await supabase.from('roles').select('nombre').eq('id', u.role_id).maybeSingle()
        role = r?.nombre ?? null
      }
      setUser({ sessionUser: session.user, profile: u ?? null, role })
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
