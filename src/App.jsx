import React from 'react'
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import Ventas from './pages/Ventas'
import Admin from './pages/Admin'
import ProductsPage from './pages/Products'
import AdminCategories from './pages/AdminCategories'
import AdminUsers from './pages/AdminUsers'
import GastosPage from './pages/Gastos'
import Reportes from './pages/Reportes'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import { AuthProvider, useAuth } from './components/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import { hasSupabaseConfig } from './lib/supabase'

function Header(){
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async ()=>{
    await signOut()
    navigate('/login')
  }

  const normalize = (str) => String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const userRole = user?.role ?? user?.profile?.role ?? user?.roleName ?? user?.role_name
  const isAdmin = userRole ? normalize(userRole) === 'administrador' : false

  return (
    <header className="header">
      <h1>Lokitos POS</h1>
      <nav>
        {user ? (
          <>
            <Link to="/">Ventas</Link>
            <Link to="/gastos">Gastos</Link>
            {isAdmin && <Link to="/admin">Admin</Link>}
            <button onClick={handleLogout} style={{ marginLeft: 12 }}>Salir</button>
          </>
        ) : null}
      </nav>
    </header>
  )
}

function SupabaseConfigWarning() {
  return (
    <div style={{ padding: 32, maxWidth: 640, margin: '40px auto', background: '#ffffff', border: '1px solid #feb2b2', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <h2 style={{ color: '#e53e3e', marginTop: 0 }}>⚠️ Faltan Variables de Entorno en Vercel</h2>
      <p style={{ color: '#4a5568' }}>
        La aplicación se desplegó correctamente en Vercel, pero no puede conectarse a la base de datos de Supabase porque faltan las variables de entorno de producción.
      </p>
      <div style={{ background: '#edf2f7', padding: 16, borderRadius: 8, fontSize: 13, fontFamily: 'monospace', marginBottom: 16, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Debes agregar en Vercel (Project Settings &gt; Environment Variables):</div>
        <div>1. <code>VITE_SUPABASE_URL</code></div>
        <div>2. <code>VITE_SUPABASE_ANON_KEY</code></div>
      </div>
      <p style={{ fontSize: 13, color: '#718096', margin: 0 }}>
        📌 <strong>Importante:</strong> Después de agregarlas en Vercel, debes hacer un <strong>Redeploy</strong> en Vercel para que Vite empaquete los nuevos valores durante la compilación.
      </p>
    </div>
  )
}

export default function App() {
  if (!hasSupabaseConfig()) {
    return <SupabaseConfigWarning />
  }

  return (
    <AuthProvider>
      <div className="app">
        <Header />
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
            <Route path="/gastos" element={<ProtectedRoute><GastosPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['Administrador']}><Admin /></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['Administrador']}><ProductsPage /></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['Administrador']}><AdminCategories /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Administrador']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['Administrador']}><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/reportes" element={<ProtectedRoute allowedRoles={['Administrador']}><Reportes /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}
