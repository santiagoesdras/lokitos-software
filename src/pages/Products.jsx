import React, { useState } from 'react'
import ProductList from '../components/ProductList'
import ProductForm from '../components/ProductForm'
import ProtectedRoute from '../components/ProtectedRoute'

export default function ProductsPage(){
  const [editing, setEditing] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEdit = (product) => setEditing(product)
  const handleSaved = ()=>{ setEditing(null); setRefreshKey(k=>k+1) }

  return (
    <ProtectedRoute allowedRoles={["Administrador"]}>
      <div>
        <h2>Catálogo de productos</h2>
        <ProductForm key={editing?.id ?? 'new'} product={editing} onSaved={handleSaved} />
        <ProductList key={refreshKey} onEdit={handleEdit} />
      </div>
    </ProtectedRoute>
  )
}
