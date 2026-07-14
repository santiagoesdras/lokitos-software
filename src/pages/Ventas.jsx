import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthProvider'

export default function Ventas() {
  const { user } = useAuth()
  const userId = user?.profile?.id ?? null

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  const [metodos, setMetodos] = useState([])
  const [metodoPago, setMetodoPago] = useState(null)
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [lastSaleReceipt, setLastSaleReceipt] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // Load products
      const { data: prods, error: pErr } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('nombre')
      if (pErr) throw pErr

      // Load categories
      const { data: cats, error: cErr } = await supabase
        .from('categorias')
        .select('*')
        .eq('activo', true)
        .order('nombre')
      if (cErr) throw cErr

      // Load payment methods
      const { data: mps, error: mErr } = await supabase
        .from('metodos_pago')
        .select('*')
      if (mErr) throw mErr

      setProducts(prods || [])
      setCategories(cats || [])
      setMetodos(mps || [])
      
      if (mps && mps.length > 0) {
        setMetodoPago(mps[0].id)
      }
    } catch (err) {
      console.error('Error loading POS data:', err)
    }
  }

  const addToCart = (product) => {
    setCart((c) => {
      const found = c.find((i) => i.producto_id === product.id)
      if (found) {
        return c.map((i) => (i.producto_id === product.id ? { ...i, cantidad: i.cantidad + 1 } : i))
      }
      return [
        ...c,
        {
          producto_id: product.id,
          nombre: product.nombre,
          cantidad: 1,
          precio_unitario: product.precio,
          imagen_path: product.imagen_path
        }
      ]
    })
  }

  const updateQty = (producto_id, cantidad) => {
    if (cantidad <= 0) {
      removeItem(producto_id)
      return
    }
    setCart((c) => c.map((i) => (i.producto_id === producto_id ? { ...i, cantidad } : i)))
  }

  const removeItem = (producto_id) => {
    if (confirm('¿Eliminar este producto del carrito?')) {
      setCart((c) => c.filter((i) => i.producto_id !== producto_id))
    }
  }

  const total = cart.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0)

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('El carrito está vacío')
    if (!metodoPago) return alert('Selecciona un método de pago')
    
    setLoading(true)
    try {
      const payload = {
        user_id: userId,
        items: cart.map((i) => ({
          producto_id: i.producto_id,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario
        })),
        total,
        metodo_pago_id: metodoPago
      }

      const res = await supabase.functions.invoke('register-sale', {
        body: JSON.stringify(payload)
      })

      if (res.error) {
        throw new Error(res.error.message || res.error)
      }

      const selectedMethodName = metodos.find((m) => m.id === metodoPago)?.nombre || 'Desconocido'
      
      // Save receipt info for modal
      setLastSaleReceipt({
        id: res.data.venta_id,
        items: [...cart],
        total,
        metodoPago: selectedMethodName,
        fecha: new Date().toLocaleDateString(),
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })

      setShowReceiptModal(true)
      setCart([]) // Clear cart
    } catch (err) {
      console.error(err)
      alert(err.message || 'Error al procesar la venta')
    } finally {
      setLoading(false)
    }
  }

  // Get image URL or placeholder
  const getProductImage = (path) => {
    if (!path) return null
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
  }

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.categoria_id === selectedCategory
    const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div>
      <div className="sales-layout">
        {/* Left Side: Products Catalog */}
        <div className="panel">
          <div className="flex justify-between align-center mb-4" style={{ flexWrap: 'wrap', gap: 16 }}>
            <h2>Catálogo de Productos</h2>
            <div style={{ maxWidth: 300, width: '100%' }}>
              <input
                type="text"
                placeholder="🔍 Buscar producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px' }}
              />
            </div>
          </div>

          {/* Categories Navigation */}
          <div className="categories-tabs">
            <button
              className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No se encontraron productos coincidentes.
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((p) => {
                const imgUrl = getProductImage(p.imagen_path)
                return (
                  <div key={p.id} className="product-card">
                    <div className="product-image-container">
                      {imgUrl ? (
                        <img src={imgUrl} alt={p.nombre} className="product-image" />
                      ) : (
                        <span>🍔</span>
                      )}
                    </div>
                    <div className="product-info">
                      <div>
                        <div className="product-name">{p.nombre}</div>
                        <div className="product-desc">{p.descripcion || 'Sin descripción'}</div>
                      </div>
                      <div className="flex justify-between align-center mt-4">
                        <span className="product-price">${p.precio?.toFixed(2)}</span>
                        <button
                          onClick={() => addToCart(p)}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: 13 }}
                        >
                          + Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Side: Shopping Cart */}
        <div className="panel cart-panel">
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, margin: 0 }}>
            Carrito de Ventas
          </h3>

          <div className="cart-items">
            {cart.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                El carrito está vacío. Agrega productos de la lista.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.producto_id} className="cart-item">
                  <div className="cart-item-details">
                    <div className="cart-item-name">{item.nombre}</div>
                    <div className="cart-item-price">
                      ${item.precio_unitario?.toFixed(2)} x {item.cantidad}
                    </div>
                  </div>
                  <div className="cart-item-actions">
                    <button
                      className="qty-btn"
                      onClick={() => updateQty(item.producto_id, item.cantidad - 1)}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      className="qty-input"
                      value={item.cantidad}
                      onChange={(e) => updateQty(item.producto_id, parseInt(e.target.value) || 0)}
                    />
                    <button
                      className="qty-btn"
                      onClick={() => updateQty(item.producto_id, item.cantidad + 1)}
                    >
                      +
                    </button>
                    <button
                      className="delete-cart-item"
                      onClick={() => removeItem(item.producto_id)}
                      title="Eliminar de carrito"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Controls */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <label>Método de Pago</label>
              <select
                value={metodoPago ?? ''}
                onChange={(e) => setMetodoPago(e.target.value)}
                style={{ background: 'var(--background)' }}
              >
                {metodos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between align-center mb-4">
              <span style={{ fontSize: 16, fontWeight: 600 }}>Total a Cobrar:</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>
                ${total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              className="btn btn-success"
              style={{ width: '100%', padding: '14px', fontSize: 16 }}
            >
              {loading ? 'Procesando Venta...' : '💵 Finalizar Venta'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation & Ticket Modal */}
      {showReceiptModal && lastSaleReceipt && (
        <div className="modal-overlay">
          <div className="modal-content text-center" style={{ maxWidth: 400 }}>
            <span style={{ fontSize: 48 }}>✅</span>
            <h3 style={{ margin: '12px 0 6px 0' }}>¡Venta Completada!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              La transacción ha sido registrada exitosamente.
            </p>

            {/* Simulated Receipt Ticket */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px dashed var(--border)',
                borderRadius: 8,
                padding: 16,
                textAlign: 'left',
                fontFamily: 'monospace',
                fontSize: 13,
                marginBottom: 20,
                color: '#334155'
              }}
            >
              <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 12 }}>
                LOKITOS POS RECEIPT
              </div>
              <div style={{ borderBottom: '1px dotted #cbd5e1', paddingBottom: 8, marginBottom: 8 }}>
                <div>Trans: {lastSaleReceipt.id.slice(0, 8)}...</div>
                <div>Fecha: {lastSaleReceipt.fecha}</div>
                <div>Hora: {lastSaleReceipt.hora}</div>
                <div>Pago: {lastSaleReceipt.metodoPago}</div>
              </div>

              {/* Items */}
              <div style={{ borderBottom: '1px dotted #cbd5e1', paddingBottom: 8, marginBottom: 8 }}>
                {lastSaleReceipt.items.map((i) => (
                  <div key={i.producto_id} className="flex justify-between">
                    <div>
                      {i.nombre} x {i.cantidad}
                    </div>
                    <div>${(i.precio_unitario * i.cantidad).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between" style={{ fontWeight: 'bold', fontSize: 14 }}>
                <div>TOTAL:</div>
                <div>${lastSaleReceipt.total.toFixed(2)}</div>
              </div>
            </div>

            <button
              onClick={() => setShowReceiptModal(false)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Cerrar e Iniciar Nueva Venta
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
