import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

function normalizeRoleName(role) {
  return String(role || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export default function ProtectedRoute({
  children,
  redirectTo = '/login',
  allowedRoles = null,
}) {
  const { user } = useAuth()

  if (user === undefined) return null
  if (!user) return <Navigate to={redirectTo} replace />

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const role = user.role ?? user.profile?.role ?? user.roleName ?? user.role_name
    const isAllowed = allowedRoles.some(
      (allowedRole) => normalizeRoleName(allowedRole) === normalizeRoleName(role)
    )

    if (!role || !isAllowed) {
      return (
        <div
          style={{
            padding: '32px 24px',
            maxWidth: 640,
            margin: '40px auto',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <h3 style={{ marginTop: 0, color: '#dc2626' }}>Acceso no autorizado</h3>
          <p style={{ marginBottom: 0, color: '#475569' }}>
            Tu cuenta no tiene permisos para acceder a esta pagina.
          </p>
        </div>
      )
    }
  }

  return children
}
