import React, { useEffect, useState } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    setLoading(true)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const now = new Date()
    
    try {
      const res = await supabase.functions.invoke('get-reports', {
        body: JSON.stringify({
          from: todayStart.toISOString(),
          to: now.toISOString()
        })
      })
      
      if (res.error) {
        throw new Error(res.error.message || res.error)
      }
      
      setKpis(res.data || null)
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['Administrador']}>
      <div>
        <div className="flex justify-between align-center mb-4">
          <h2>Dashboard del Día</h2>
          <button className="btn btn-secondary" onClick={loadDashboardData} disabled={loading}>
            🔄 Actualizar
          </button>
        </div>

        {loading ? (
          <div>Cargando estadísticas del día...</div>
        ) : kpis ? (
          <div>
            {/* KPI Cards */}
            <div className="kpi-grid">
              <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>Ventas del Día</span>
                <span className="kpi-value">${kpis.totalVendido?.toFixed(2) ?? '0.00'}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {kpis.cantidadVentas} transacciones concretadas
                </span>
              </div>

              <div className="kpi-card" style={{ borderLeft: '4px solid var(--danger)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>Gastos del Día</span>
                <span className="kpi-value">${kpis.totalGastos?.toFixed(2) ?? '0.00'}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Egresos registrados hoy
                </span>
              </div>

              <div className="kpi-card" style={{ borderLeft: '4px solid var(--success)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>Utilidad Estimada</span>
                <span className={`kpi-value ${kpis.utilidadEstim >= 0 ? '' : 'text-danger'}`} style={{ color: kpis.utilidadEstim >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  ${kpis.utilidadEstim?.toFixed(2) ?? '0.00'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Ventas menos gastos
                </span>
              </div>
            </div>

            {/* Visual Breakdown Tables */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {/* Top Products */}
              <div className="panel">
                <h3>🔥 Productos Más Vendidos</h3>
                {(!kpis.productosTop || kpis.productosTop.length === 0) ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se han registrado ventas de productos hoy.
                  </div>
                ) : (
                  <div className="table-container" style={{ marginTop: 8 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th style={{ textAlign: 'right' }}>Cant. Vendida</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kpis.productosTop.map((p, idx) => (
                          <tr key={p.producto_id || idx}>
                            <td style={{ fontWeight: 600 }}>{p.nombre || 'Producto Desconocido'}</td>
                            <td className="text-right" style={{ fontWeight: 700 }}>{p.cantidad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div className="panel">
                <h3>💳 Ventas por Método de Pago</h3>
                {(!kpis.metodos || kpis.metodos.length === 0) ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay transacciones registradas hoy.
                  </div>
                ) : (
                  <div className="table-container" style={{ marginTop: 8 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Método de Pago</th>
                          <th style={{ textAlign: 'right' }}>Transacciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kpis.metodos.map((m, idx) => (
                          <tr key={m.id || idx}>
                            <td style={{ fontWeight: 600 }}>{m.nombre}</td>
                            <td className="text-right" style={{ fontWeight: 700 }}>{m.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="panel text-center" style={{ padding: 40 }}>
            Error al recuperar los datos del dashboard.
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
