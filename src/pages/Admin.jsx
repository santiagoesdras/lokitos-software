import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
import ProtectedRoute from '../components/ProtectedRoute'

export default function Admin(){
  const { user } = useAuth()
  const role = user?.role ?? null
  
  return (
    <ProtectedRoute allowedRoles={["Administrador"]}>
      <div>
        <div style={{ marginBottom: 24 }}>
          <h2>Panel de Administración</h2>
          <p style={{ color: 'var(--text-muted)' }}>Gestiona los catálogos, accesos de personal y consulta reportes detallados del negocio.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🍔</div>
              <h3 style={{ margin: '8px 0' }}>Productos</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
                Administra los platillos y bebidas, sus precios, descripciones y sube sus fotografías oficiales.
              </p>
            </div>
            <Link to="/admin/products" className="btn btn-primary" style={{ width: '100%' }}>Gestionar Productos</Link>
          </div>

          <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏷️</div>
              <h3 style={{ margin: '8px 0' }}>Categorías</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
                Organiza el menú creando y editando categorías (como Bebidas, Comestibles, Postres, etc.).
              </p>
            </div>
            <Link to="/admin/categories" className="btn btn-primary" style={{ width: '100%' }}>Gestionar Categorías</Link>
          </div>

          <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
              <h3 style={{ margin: '8px 0' }}>Usuarios y Personal</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
                Controla los accesos al sistema, añade nuevos cajeros/vendedores y restablece contraseñas.
              </p>
            </div>
            <Link to="/admin/users" className="btn btn-primary" style={{ width: '100%' }}>Gestionar Usuarios</Link>
          </div>

          <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              <h3 style={{ margin: '8px 0' }}>Dashboard Diario</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
                Visualiza los KPIs principales de ventas, gastos y utilidades estimadas para el día de hoy.
              </p>
            </div>
            <Link to="/admin/dashboard" className="btn btn-primary" style={{ width: '100%' }}>Ver Dashboard</Link>
          </div>

          <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📈</div>
              <h3 style={{ margin: '8px 0' }}>Reportes de Ventas</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
                Genera reportes históricos por fechas, analiza el rendimiento y consulta los artículos más vendidos.
              </p>
            </div>
            <Link to="/admin/reportes" className="btn btn-primary" style={{ width: '100%' }}>Generar Reportes</Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
