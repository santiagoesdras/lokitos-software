import React, { useState } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '../lib/supabase'

export default function ExpenseForm({ onSaved }) {
  const { user } = useAuth()
  const [titulo, setTitulo] = useState('')
  const [monto, setMonto] = useState('')
  const [comentario, setComentario] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!titulo.trim() || !monto) {
      return alert('Por favor, completa el título y el monto del gasto.')
    }
    if (parseFloat(monto) <= 0) {
      return alert('El monto del gasto debe ser un número positivo mayor a 0.')
    }

    setLoading(true)
    try {
      const payload = {
        usuario_id: user?.profile?.id ?? null,
        titulo: titulo.trim(),
        monto: parseFloat(monto),
        comentario: comentario.trim()
      }

      const res = await supabase.functions.invoke('register-expense', {
        body: JSON.stringify(payload)
      })

      if (res.error) {
        throw new Error(res.error.message || res.error)
      }

      alert('Gasto registrado con éxito')
      setTitulo('')
      setMonto('')
      setComentario('')
      if (onSaved) onSaved()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Error al registrar el gasto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel" style={{ maxWidth: 600 }}>
      <h3>💸 Registrar Nuevo Gasto</h3>
      
      <div className="form-grid">
        <div>
          <label>Título del Gasto</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            placeholder="Ej. Compra de desechables, verduras..."
            disabled={loading}
          />
        </div>
        
        <div>
          <label>Monto ($)</label>
          <input
            type="number"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
            placeholder="0.00"
            disabled={loading}
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label>Comentario / Razón del Gasto (Opcional)</label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={2}
            placeholder="Añade detalles sobre el gasto (Ej. Factura #4051, proveedor X)..."
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-danger"
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Registrando Gasto...' : '💾 Registrar Gasto'}
        </button>
      </div>
    </form>
  )
}
