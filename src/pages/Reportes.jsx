import React, { useState } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
import { supabase } from '../lib/supabase'

export default function Reportes() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedRangeName, setSelectedRangeName] = useState('')

  const fetchReportData = async (fromDate, toDate, rangeName) => {
    setLoading(true)
    setSelectedRangeName(rangeName)
    try {
      const body = { 
        from: fromDate ? fromDate.toISOString() : null, 
        to: toDate ? toDate.toISOString() : null 
      }
      
      const res = await supabase.functions.invoke('get-reports', {
        body: JSON.stringify(body)
      })

      if (res.error) {
        throw new Error(res.error.message || res.error)
      }

      setReport(res.data || null)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomRange = (e) => {
    e.preventDefault()
    if (!from || !to) return alert('Por favor, introduce ambas fechas (Desde y Hasta)')
    
    const fromDate = new Date(from)
    fromDate.setHours(0, 0, 0, 0)
    
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999)
    
    fetchReportData(fromDate, toDate, `Rango Personalizado (${from} al ${to})`)
  }

  const setRangeToday = () => {
    const fromDate = new Date()
    fromDate.setHours(0, 0, 0, 0)
    
    const toDate = new Date()
    toDate.setHours(23, 59, 59, 999)
    
    fetchReportData(fromDate, toDate, 'Hoy')
  }

  const setRangeThisWeek = () => {
    const now = new Date()
    const currentDay = now.getDay()
    // Start of the week: Monday (or Sunday if preferred). Let's use Monday.
    const distance = currentDay === 0 ? -6 : 1 - currentDay
    
    const fromDate = new Date(now)
    fromDate.setDate(now.getDate() + distance)
    fromDate.setHours(0, 0, 0, 0)
    
    const toDate = new Date()
    toDate.setHours(23, 59, 59, 999)
    
    fetchReportData(fromDate, toDate, 'Esta Semana')
  }

  const setRangeThisMonth = () => {
    const now = new Date()
    const fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
    fromDate.setHours(0, 0, 0, 0)
    
    const toDate = new Date()
    toDate.setHours(23, 59, 59, 999)
    
    fetchReportData(fromDate, toDate, 'Este Mes')
  }

  return (
    <ProtectedRoute allowedRoles={['Administrador']}>
      <div>
        <div style={{ marginBottom: 24 }}>
          <h2>Reportes de Ventas</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Consulta el rendimiento del negocio, los métodos de pago más recurrentes y la utilidad neta en rangos de fechas definidos.
          </p>
        </div>

        {/* Range Selectors Panel */}
        <div className="panel mb-4">
          <h3>📅 Seleccionar Periodo</h3>
          
          {/* Shortcuts */}
          <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={setRangeToday} disabled={loading}>
              Ventas del Día
            </button>
            <button className="btn btn-secondary" onClick={setRangeThisWeek} disabled={loading}>
              Ventas de la Semana
            </button>
            <button className="btn btn-secondary" onClick={setRangeThisMonth} disabled={loading}>
              Ventas del Mes
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <form onSubmit={handleCustomRange} className="flex gap-3 align-center" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label>Desde</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required />
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label>Hasta</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                Generar Rango Personalizado
              </button>
            </form>
          </div>
        </div>

        {/* Report Output */}
        {loading ? (
          <div>Generando reporte detallado...</div>
        ) : report ? (
          <div>
            <div className="panel mb-4" style={{ background: '#f8fafc', borderLeft: '4px solid var(--accent)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                Reporte Generado
              </span>
              <h3 style={{ margin: '4px 0 0 0' }}>Periodo: {selectedRangeName}</h3>
            </div>

            {/* financial statistics */}
            <div className="kpi-grid">
              <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>Total Vendido</span>
                <span className="kpi-value">${report.totalVendido?.toFixed(2) ?? '0.00'}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {report.cantidadVentas} transacciones en total
                </span>
              </div>

              <div className="kpi-card" style={{ borderLeft: '4px solid var(--danger)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>Total de Gastos</span>
                <span className="kpi-value">${report.totalGastos?.toFixed(2) ?? '0.00'}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Egresos registrados en el periodo
                </span>
              </div>

              <div className="kpi-card" style={{ borderLeft: '4px solid var(--success)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>Utilidad Estimada</span>
                <span className="kpi-value" style={{ color: report.utilidadEstim >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  ${report.utilidadEstim?.toFixed(2) ?? '0.00'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Ventas menos gastos
                </span>
              </div>
            </div>

            {/* breakdowns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {/* Top Products */}
              <div className="panel">
                <h3>🔥 Productos Más Vendidos en el Periodo</h3>
                {(!report.productosTop || report.productosTop.length === 0) ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay registro de ventas en este periodo.
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
                        {report.productosTop.map((p, idx) => (
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
                <h3>💳 Métodos de Pago</h3>
                {(!report.metodos || report.metodos.length === 0) ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay transacciones registradas en este periodo.
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
                        {report.metodos.map((m, idx) => (
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
          <div className="panel text-center" style={{ padding: 30, color: 'var(--text-muted)' }}>
            Selecciona un periodo arriba para generar el informe.
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
