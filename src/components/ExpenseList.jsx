import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ExpenseList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExpenses()
  }, [])

  async function loadExpenses() {
    setLoading(true)
    try {
      // Load last 50 expenses with user name join
      const { data, error } = await supabase
        .from('gastos')
        .select(`
          id,
          titulo,
          monto,
          comentario,
          fecha_hora,
          usuarios (
            nombre
          )
        `)
        .order('fecha_hora', { ascending: false })
        .limit(50)

      if (error) throw error
      setItems(data || [])
    } catch (err) {
      console.error('Error loading expenses:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{ padding: 12 }}>Cargando gastos...</div>
  if (items.length === 0) return <div style={{ padding: 12, color: 'var(--text-muted)' }}>No hay gastos registrados hoy.</div>

  return (
    <div className="panel" style={{ marginTop: 24 }}>
      <h3>📋 Gastos Recientes (Últimos 50)</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Título del Gasto</th>
              <th>Monto</th>
              <th>Usuario</th>
              <th>Comentario / Razón</th>
              <th>Fecha y Hora</th>
            </tr>
          </thead>
          <tbody>
            {items.map((g) => (
              <tr key={g.id}>
                <td style={{ fontWeight: 600 }}>{g.titulo}</td>
                <td style={{ fontWeight: 700, color: 'var(--danger)' }}>
                  -${parseFloat(g.monto).toFixed(2)}
                </td>
                <td>
                  <span className="badge" style={{ background: '#f1f5f9', color: 'var(--primary)' }}>
                    👤 {g.usuarios?.nombre || 'Desconocido'}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.comentario || 'Sin comentario'}
                </td>
                <td>
                  {new Date(g.fecha_hora).toLocaleDateString()} {new Date(g.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
