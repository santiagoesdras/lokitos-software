import React from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import Ventas from './pages/Ventas'
import Admin from './pages/Admin'
import ProductsPage from './pages/Products'
import AdminUsers from './pages/AdminUsers'
import AdminCategories from './pages/AdminCategories'
import GastosPage from './pages/Gastos'
import Reportes from './pages/Reportes'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import { AuthProvider, useAuth } from './components/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'

function Header(){
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async ()=>{
    await signOut()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path ? 'active' : ''

  return (
    <header className="header">
      <h1>Lokitos POS</h1>
      <nav>
        {user && (
          <>
            <Link to="/" className={isActive('/')}>Ventas</Link>
            <Link to="/gastos" className={isActive('/gastos')}>Gastos</Link>
            {user.role === 'Administrador' && (
              <Link to="/admin" className={location.pathname.startsWith('/admin') ? 'active' : ''}>Admin</Link>
            )}
          </>
        )}
        {user ? (
          <button onClick={handleLogout} className="btn-logout" style={{ marginLeft: 12 }}>
            Salir
          </button>
        ) : (
          !location.pathname.startsWith('/login') && <Link to="/login" style={{ marginLeft: 12 }}>Entrar</Link>
        )}
      </nav>
    </header>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Header />
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
            <Route path="/gastos" element={<ProtectedRoute allowedRoles={["Vendedor", "Administrador"]}><GastosPage /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["Administrador"]}><Admin /></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute allowedRoles={["Administrador"]}><ProductsPage /></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={["Administrador"]}><AdminCategories /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["Administrador"]}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["Administrador"]}><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/reportes" element={<ProtectedRoute allowedRoles={["Administrador"]}><Reportes /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}
