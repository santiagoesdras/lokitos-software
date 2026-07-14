import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ProtectedRoute from '../components/ProtectedRoute'

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState(null)
  
  // Form states
  const [nombre, setNombre] = useState('')
  const [activo, setActivo] = useState(true)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    setLoading(true)
    try {
      // List all categories (even inactive ones) for the admin
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre')
      
      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Error loading categories:', err)
      alert('Error al cargar categorías')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category) => {
    setIsNew(false)
    setEditingCategory(category)
    setNombre(category.nombre)
    setActivo(category.activo)
  }

  const handleCreateNew = () => {
    setIsNew(true)
    setEditingCategory({})
    setNombre('')
    setActivo(true)
  }

  const handleCancel = () => {
    setEditingCategory(null)
    setIsNew(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return alert('Ingresa un nombre válido')
    
    setSaving(true)
    try {
      if (isNew) {
        const { error } = await supabase
          .from('categorias')
          .insert({
            nombre: nombre.trim(),
            activo: true
          })
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('categorias')
          .update({
            nombre: nombre.trim(),
            activo,
            actualizado_en: new Date()
          })
          .eq('id', editingCategory.id)

        if (error) throw error
      }

      alert('Categoría guardada con éxito')
      setEditingCategory(null)
      setIsNew(false)
      loadCategories()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Error al guardar categoría')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['Administrador']}>
      <div>
        <div className="flex justify-between align-center mb-4">
          <h2>Administración de Categorías</h2>
          {!editingCategory && (
            <button className="btn btn-primary" onClick={handleCreateNew}>
              + Nueva Categoría
            </button>
          )}
        </div>

        {editingCategory ? (
          <div className="panel mb-4" style={{ maxWidth: 500 }}>
            <h3>{isNew ? 'Nueva Categoría' : 'Editar Categoría'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label>Nombre de Categoría</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Postres, Entradas..."
                  required
                />
              </div>

              {!isNew && (
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    style={{ width: 'auto' }}
                    id="cat-activa"
                  />
                  <label htmlFor="cat-activa" style={{ margin: 0, cursor: 'pointer' }}>
                    Categoría Activa (Visible al asignar productos y vender)
                  </label>
                </div>
              )}

              <div className="form-actions">
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
          <div>Cargando categorías...</div>
        ) : (
          <div className="panel">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nombre de la Categoría</th>
                    <th>Estado</th>
                    <th>Creado en</th>
                    <th>Última Actualización</th>
                    <th style={{ width: 120 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                      <td>
                        <span className={`badge ${c.activo ? 'badge-success' : 'badge-danger'}`}>
                          {c.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>{new Date(c.creado_en).toLocaleDateString()}</td>
                      <td>{new Date(c.actualizado_en).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 13 }} onClick={() => handleEdit(c)}>
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
      </div>
    </ProtectedRoute>
  )
}
