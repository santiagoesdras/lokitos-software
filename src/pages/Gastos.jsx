import React, { useState } from 'react'
import ExpenseForm from '../components/ExpenseForm'
import ExpenseList from '../components/ExpenseList'
import ProtectedRoute from '../components/ProtectedRoute'

export default function GastosPage(){
  const [refreshKey, setRefreshKey] = useState(0)
  const handleSaved = ()=> setRefreshKey(k=>k+1)

  return (
    <ProtectedRoute allowedRoles={["Vendedor","Administrador"]}>
      <div>
        <h2>Registrar gastos</h2>
        <ExpenseForm onSaved={handleSaved} />
        <ExpenseList key={refreshKey} />
      </div>
    </ProtectedRoute>
  )
}
