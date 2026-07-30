import React, { useEffect, useState } from 'react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import ProtectedRoute from '../components/ProtectedRoute'

async function getFunctionErrorMessage(error, fallbackMessage) {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = await error.context.json()
      const parts = []

      if (payload?.error) parts.push(payload.error)
      if (payload?.details) parts.push(payload.details)
      if (payload?.hint) parts.push(`Sugerencia: ${payload.hint}`)

      return parts.length > 0 ? parts.join('\n') : fallbackMessage
    } catch (parseError) {
      console.error('No se pudo leer el cuerpo del error de la Edge Function:', parseError)
    }
  }

  return error?.message || fallbackMessage
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState(null)

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
      const { data: usersData, error: usersError } = await supabase
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

      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')

      if (usersError) throw usersError
      if (rolesError) throw rolesError

      setUsers(usersData || [])
      setRoles(rolesData || [])
    } catch (error) {
      console.error('Error loading users:', error)
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)

    try {
      if (isNew) {
        const response = await supabase.functions.invoke('manage-users', {
          body: {
            action: 'create',
            email,
            password,
            nombre,
            role_id: roleId
          }
        })

        if (response.error) throw response.error
      } else {
        const response = await supabase.functions.invoke('manage-users', {
          body: {
            action: 'update',
            userId: editingUser.id,
            nombre,
            role_id: roleId,
            activo
          }
        })

        if (response.error) throw response.error
      }

      alert('Usuario guardado con exito')
      setEditingUser(null)
      setIsNew(false)
      loadData()
    } catch (error) {
      console.error('Error saving user:', error)
      alert(await getFunctionErrorMessage(error, 'Error al guardar usuario'))
    } finally {
      setSaving(false)
    }
  }

  const handleResetPasswordSubmit = async (event) => {
    event.preventDefault()
    if (!newPassword) return alert('Ingresa una contrasena')

    setSaving(true)
    try {
      const response = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'reset-password',
          userId: editingUser.id,
          password: newPassword
        }
      })

      if (response.error) throw response.error

      alert('Contrasena actualizada con exito')
      setShowPasswordModal(false)
      setNewPassword('')
    } catch (error) {
      console.error('Error resetting password:', error)
      alert(await getFunctionErrorMessage(error, 'Error al actualizar contrasena'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['Administrador']}>
      <div>
        <div className="flex justify-between align-center mb-4">
          <h2>Administracion de Usuarios</h2>
          {!editingUser ? (
            <button className="btn btn-primary" onClick={handleCreateNew}>
              + Nuevo Usuario
            </button>
          ) : null}
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
                  onChange={(event) => setNombre(event.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label>Correo Electronico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={!isNew}
                  required
                />
              </div>

              {isNew ? (
                <div style={{ marginBottom: 12 }}>
                  <label>Contrasena Inicial</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
              ) : null}

              <div style={{ marginBottom: 12 }}>
                <label>Rol</label>
                <select value={roleId} onChange={(event) => setRoleId(event.target.value)} required>
                  <option value="">-- Seleccionar Rol --</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {!isNew ? (
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(event) => setActivo(event.target.checked)}
                    style={{ width: 'auto' }}
                    id="user-activo"
                  />
                  <label htmlFor="user-activo" style={{ margin: 0, cursor: 'pointer' }}>
                    Usuario Activo (Permite iniciar sesion)
                  </label>
                </div>
              ) : null}

              <div className="form-actions">
                {!isNew ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setNewPassword('')
                      setShowPasswordModal(true)
                    }}
                    style={{ marginRight: 'auto' }}
                  >
                    Restablecer Contrasena
                  </button>
                ) : null}
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
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: 600 }}>{user.nombre}</td>
                      <td>{user.email}</td>
                      <td>{user.roles?.nombre || 'N/A'}</td>
                      <td>
                        <span className={`badge ${user.activo ? 'badge-success' : 'badge-danger'}`}>
                          {user.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>{new Date(user.creado_en).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: 13 }}
                          onClick={() => handleEdit(user)}
                        >
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

        {showPasswordModal ? (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Restablecer Contrasena</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                Establece una nueva contrasena para el usuario <strong>{editingUser?.nombre}</strong>.
              </p>
              <form onSubmit={handleResetPasswordSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label>Nueva Contrasena</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Min. 6 caracteres"
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)} disabled={saving}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Guardando...' : 'Actualizar Contrasena'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  )
}
