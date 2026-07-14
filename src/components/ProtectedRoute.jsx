import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function ProtectedRoute({ children, redirectTo = '/login', allowedRoles = null }){
  const { user } = useAuth()
  if(user === undefined) return null // still loading
  if(!user) return <Navigate to={redirectTo} replace />

  if(Array.isArray(allowedRoles) && allowedRoles.length > 0){
    const role = user.role ?? user.roleName ?? user.role_name ?? user.role
    if(!role || !allowedRoles.includes(role)){
      return (
        <div style={{padding:24}}>
          <h3>No autorizado</h3>
          <p>Tu cuenta no tiene permisos para ver esta página.</p>
        </div>
      )
    }
  }

  return children
}
