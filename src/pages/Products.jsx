import React, { useEffect, useRef, useState } from 'react'
import ProductList from '../components/ProductList'
import ProductForm from '../components/ProductForm'
import ProtectedRoute from '../components/ProtectedRoute'

export default function ProductsPage() {
  const [editing, setEditing] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const formRef = useRef(null)

  const handleEdit = (product) => setEditing(product)
  const handleSaved = () => {
    setEditing(null)
    setRefreshKey((currentKey) => currentKey + 1)
  }

  useEffect(() => {
    if (!editing || !formRef.current) return

    formRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }, [editing])

  return (
    <ProtectedRoute allowedRoles={['Administrador']}>
      <div>
        <h2>Catalogo de productos</h2>
        <div ref={formRef}>
          <ProductForm key={editing?.id ?? 'new'} product={editing} onSaved={handleSaved} />
        </div>
        <ProductList key={refreshKey} onEdit={handleEdit} />
      </div>
    </ProtectedRoute>
  )
}
