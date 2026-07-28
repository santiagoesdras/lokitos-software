import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/currency'

function buildDeactivateProductErrorMessage(err) {
  const fallback = 'Error al desactivar el producto.'

  if (!err) return fallback

  const parts = []

  if (err.message) parts.push(err.message)
  if (err.details && err.details !== err.message) parts.push(err.details)
  if (err.hint) parts.push(`Sugerencia: ${err.hint}`)
  if (err.code) parts.push(`Codigo: ${err.code}`)

  const normalizedMessage = `${err.message || ''} ${err.details || ''}`.toLowerCase()
  if (normalizedMessage.includes('table "productos"') || normalizedMessage.includes("table 'productos'")) {
    parts.push('Posible causa: tu sesion no esta cumpliendo la politica RLS de productos para acciones de administrador.')
  } else if (
    normalizedMessage.includes('auditoria') ||
    normalizedMessage.includes('table "auditoria"') ||
    normalizedMessage.includes("table 'auditoria'")
  ) {
    parts.push('Posible causa: la auditoria o las politicas RLS estan bloqueando el trigger de actualizacion.')
  }

  return parts.length > 0 ? parts.join('\n') : fallback
}

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
    if (!confirm('¿Estas seguro de que deseas desactivar este producto? No aparecera en ventas.')) return

    try {
      const { count, error } = await supabase
        .from('productos')
        .update(
          { activo: false, actualizado_en: new Date().toISOString() },
          { count: 'exact' }
        )
        .eq('id', id)
        .eq('activo', true)

      if (error) throw error
      if (count === 0) {
        throw new Error('No se actualizo ningun producto. Puede que ya este inactivo o que tu usuario no tenga permisos para darlo de baja.')
      }

      setProducts((currentProducts) => currentProducts.filter((product) => product.id !== id))
      alert('Producto desactivado exitosamente')
    } catch (err) {
      console.error('Error de baja de producto:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        raw: err
      })
      alert(buildDeactivateProductErrorMessage(err))
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
          {products.map((product) => {
            const imgUrl = getProductImage(product.imagen_path)
            return (
              <tr key={product.id}>
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
                      justifyContent: 'center',
                      fontSize: 20
                    }}
                  >
                    {imgUrl ? (
                      <img src={imgUrl} alt={product.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ display: 'block', margin: 'auto', textAlign: 'center' }}>🍔</span>
                    )}
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{product.nombre}</td>
                <td>
                  <span className="badge badge-warning">
                    {product.categorias?.nombre || 'Sin categoría'}
                  </span>
                </td>
                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                  {formatCurrency(product.precio)}
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {product.descripcion || 'Sin descripción'}
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: 13, flex: 1 }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
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
