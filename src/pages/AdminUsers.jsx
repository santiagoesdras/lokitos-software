import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ProtectedRoute from '../components/ProtectedRoute'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState(null)
  
  // Form states
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState('')
  const [activo, setActivo] = useState(true)
  const [isNew, setIsNew] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: usersData, error: uErr } = await supabase
        .from('usuarios')
        .select(`
          id,
          email,
          nombre,
          role_id,
          activo,
          creado_en,
          roles (
            nombre
          )
        `)
        .order('nombre')
      
      const { data: rolesData, error: rErr } = await supabase
        .from('roles')
        .select('*')

      if (uErr) throw uErr
      if (rErr) throw rErr

      setUsers(usersData || [])
      setRoles(rolesData || [])
    } catch (err) {
      console.error('Error loading users:', err)
      alert('Error al cargar datos de usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user) => {
    setIsNew(false)
    setEditingUser(user)
    setNombre(user.nombre || '')
    setEmail(user.email || '')
    setRoleId(user.role_id || '')
    setActivo(user.activo)
  }

  const handleCreateNew = () => {
    setIsNew(true)
    setEditingUser({})
    setNombre('')
    setEmail('')
    setPassword('')
    setRoleId(roles[0]?.id || '')
    setActivo(true)
  }

  const handleCancel = () => {
    setEditingUser(null)
    setIsNew(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isNew) {
        // Call edge function to create user
        const res = await supabase.functions.invoke('manage-users', {
          body: {
            action: 'create',
            email,
            password,
            nombre,
            role_id: roleId
          }
        })
        if (res.error) {
          throw new Error(res.error.message || res.error)
        }
      } else {
        // Call edge function to update user
        const res = await supabase.functions.invoke('manage-users', {
          body: {
            action: 'update',
            userId: editingUser.id,
            nombre,
            role_id: roleId,
            activo
          }
        })
        if (res.error) {
          throw new Error(res.error.message || res.error)
        }
      }
      alert('Usuario guardado con éxito')
      setEditingUser(null)
      setIsNew(false)
      loadData()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Error al guardar usuario')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault()
    if (!newPassword) return alert('Ingresa una contraseña')
    setSaving(true)
    try {
      const res = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'reset-password',
          userId: editingUser.id,
          password: newPassword
        }
      })
      if (res.error) {
        throw new Error(res.error.message || res.error)
      }
      alert('Contraseña actualizada con éxito')
      setShowPasswordModal(false)
      setNewPassword('')
    } catch (err) {
      console.error(err)
      alert(err.message || 'Error al actualizar contraseña')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['Administrador']}>
      <div>
        <div className="flex justify-between align-center mb-4">
          <h2>Administración de Usuarios</h2>
          {!editingUser && (
            <button className="btn btn-primary" onClick={handleCreateNew}>
              + Nuevo Usuario
            </button>
          )}
        </div>

        {editingUser ? (
          <div className="panel mb-4" style={{ maxWidth: 600 }}>
            <h3>{isNew ? 'Crear Nuevo Usuario' : 'Editar Usuario'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label>Nombre Completo</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isNew}
                  required
                />
              </div>

              {isNew && (
                <div style={{ marginBottom: 12 }}>
                  <label>Contraseña Inicial</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <label>Rol</label>
                <select value={roleId} onChange={(e) => setRoleId(e.target.value)} required>
                  <option value="">-- Seleccionar Rol --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {!isNew && (
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    style={{ width: 'auto' }}
                    id="user-activo"
                  />
                  <label htmlFor="user-activo" style={{ margin: 0, cursor: 'pointer' }}>
                    Usuario Activo (Permite iniciar sesión)
                  </label>
                </div>
              )}

              <div className="form-actions">
                {!isNew && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setNewPassword('')
                      setShowPasswordModal(true)
                    }}
                    style={{ marginRight: 'auto' }}
                  >
                    Restablecer Contraseña
                  </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {loading ? (
          <div>Cargando usuarios...</div>
        ) : (
          <div className="panel">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Creado</th>
                    <th style={{ width: 120 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.nombre}</td>
                      <td>{u.email}</td>
                      <td>{u.roles?.nombre || 'N/A'}</td>
                      <td>
                        <span className={`badge ${u.activo ? 'badge-success' : 'badge-danger'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>{new Date(u.creado_en).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 13 }} onClick={() => handleEdit(u)}>
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showPasswordModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Restablecer Contraseña</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                Establece una nueva contraseña para el usuario <strong>{editingUser?.nombre}</strong>.
              </p>
              <form onSubmit={handleResetPasswordSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label>Nueva Contraseña</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 caracteres"
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)} disabled={saving}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Guardando...' : 'Actualizar Contraseña'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
