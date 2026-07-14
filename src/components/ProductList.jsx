import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ProductList({ onEdit }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('productos')
        .select(`
          id,
          nombre,
          descripcion,
          precio,
          categoria_id,
          imagen_path,
          categorias (
            nombre
          )
        `)
        .eq('activo', true)
        .order('nombre')

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas desactivar este producto? No aparecerá en ventas.')) return
    
    try {
      const { error } = await supabase
        .from('productos')
        .update({ activo: false, actualizado_en: new Date() })
        .eq('id', id)

      if (error) throw error
      setProducts(products.filter((p) => p.id !== id))
      alert('Producto desactivado exitosamente')
    } catch (err) {
      console.error(err)
      alert('Error al desactivar el producto')
    }
  }

  const getProductImage = (path) => {
    if (!path) return null
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
  }

  if (loading) return <div style={{ padding: 16 }}>Cargando catálogo de productos...</div>
  if (products.length === 0) return <div style={{ padding: 16 }}>No hay productos registrados en el catálogo.</div>

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th style={{ width: 80 }}>Imagen</th>
            <th>Nombre del Producto</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Descripción</th>
            <th style={{ width: 140, textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const imgUrl = getProductImage(p.imagen_path)
            return (
              <tr key={p.id}>
                <td>
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 8,
                      background: '#f1f5f9',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifycontent: 'center',
                      fontSize: 20
                    }}
                  >
                    {imgUrl ? (
                      <img src={imgUrl} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ display: 'block', margin: 'auto', textAlign: 'center' }}>🍔</span>
                    )}
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                <td>
                  <span className="badge badge-warning">
                    {p.categorias?.nombre || 'Sin categoría'}
                  </span>
                </td>
                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                  ${p.precio?.toFixed(2)}
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.descripcion || 'Sin descripción'}
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(p)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: 13, flex: 1 }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="btn btn-danger"
                      style={{ padding: '6px 12px', fontSize: 13, flex: 1, background: 'var(--danger-bg)', color: 'var(--danger)' }}
                    >
                      Baja
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
