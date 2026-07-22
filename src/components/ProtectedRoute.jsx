import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function ProtectedRoute({ children, redirectTo = '/login', allowedRoles = null }){
  const { user } = useAuth()
  if(user === undefined) return null // still loading
  if(!user) return <Navigate to={redirectTo} replace />

  if(Array.isArray(allowedRoles) && allowedRoles.length > 0){
    const role = user.role ?? user.profile?.role ?? user.roleName ?? user.role_name
    
    // Normalize string for comparison (case-insensitive and accent-insensitive)
    const normalize = (str) => String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    const userRoleNormalized = normalize(role)
    const isAllowed = allowedRoles.some(r => normalize(r) === userRoleNormalized)

    if(!role || !isAllowed){
      return (
        <div style={{ padding: '32px 24px', maxWidth: 640, margin: '40px auto', background: 'var(--panel-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 32 }}>🚫</span>
            <div>
              <h3 style={{ margin: 0, color: '#e53e3e', fontSize: 20 }}>Acceso No Autorizado</h3>
              <p style={{ margin: '4px 0 0 0', color: '#718096', fontSize: 14 }}>Tu cuenta no cumple con los permisos necesarios para acceder a esta página.</p>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 16, borderRadius: 8, fontSize: 13, fontFamily: 'monospace', marginBottom: 20, lineHeight: 1.6 }}>
            <div style={{ fontWeight: 'bold', color: '#2d3748', marginBottom: 8, borderBottom: '1px solid #cbd5e0', paddingBottom: 4 }}>
              📊 Diagnóstico de Estado de Autenticación:
            </div>
            <div><strong>Email autenticado:</strong> <span style={{ color: '#2b6cb0' }}>{user.sessionUser?.email || 'Desconocido'}</span></div>
            <div><strong>ID Supabase Auth:</strong> <code style={{ fontSize: 11 }}>{user.sessionUser?.id || 'N/A'}</code></div>
            <div><strong>Fila en public.usuarios:</strong> {user.profile ? <span style={{ color: '#2f855a', fontWeight: 'bold' }}>✅ Registrada</span> : <span style={{ color: '#c53030', fontWeight: 'bold' }}>❌ NO EXISTE (Se debe vincular en SQL)</span>}</div>
            <div><strong>ID de Rol en Perfil:</strong> <code>{user.profile?.role_id || 'null'}</code></div>
            <div><strong>Nombre de Rol Detectado:</strong> {user.role ? <span style={{ color: '#2b6cb0', fontWeight: 'bold' }}>"{user.role}"</span> : <span style={{ color: '#c53030', fontWeight: 'bold' }}>null</span>}</div>
            <div><strong>Roles requeridos aquí:</strong> <span style={{ color: '#805ad5', fontWeight: 'bold' }}>[{allowedRoles.join(', ')}]</span></div>
            {user.authError && (
              <div style={{ marginTop: 8, padding: 8, background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 4, color: '#c53030' }}>
                <strong>⚠️ Error en consulta Supabase (RLS/Permiso):</strong> <code>{user.authError}</code>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
              style={{ padding: '10px 18px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              🔄 Recargar Datos de Sesión
            </button>
          </div>
        </div>
      )
    }
  }

  return children
}
