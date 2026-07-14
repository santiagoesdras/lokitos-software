import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export default function ProductForm({ product, onSaved }) {
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState(0)
  const [categoriaId, setCategoriaId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [imagenFile, setImagenFile] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    if (product) {
      setNombre(product.nombre)
      setPrecio(product.precio)
      setCategoriaId(product.categoria_id || '')
      setDescripcion(product.descripcion || '')
      if (product.imagen_path) {
        setPreviewUrl(supabase.storage.from('product-images').getPublicUrl(product.imagen_path).data.publicUrl)
      } else {
        setPreviewUrl(null)
      }
    } else {
      setNombre('')
      setPrecio(0)
      setCategoriaId('')
      setDescripcion('')
      setPreviewUrl(null)
    }
    setImagenFile(null)
  }, [product])

  useEffect(() => {
    async function loadCats() {
      const { data } = await supabase.from('categorias').select('*').eq('activo', true).order('nombre')
      setCategorias(data ?? [])
      if (!product && data && data.length > 0) {
        setCategoriaId(data[0].id)
      }
    }
    loadCats()
  }, [product])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImagenFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return alert('El nombre es obligatorio')
    if (precio <= 0) return alert('El precio debe ser mayor a 0')
    if (!categoriaId) return alert('Selecciona una categoría')
    
    setSaving(true)
    try {
      let imagen_path = product?.imagen_path ?? null

      if (imagenFile) {
        const id = uuidv4()
        const ext = imagenFile.name.split('.').pop()
        const filename = `product-${id}.${ext}`
        
        const { data, error: upErr } = await supabase.storage
          .from('product-images')
          .upload(filename, imagenFile, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (upErr) {
          console.error('Storage Upload Error:', upErr)
          alert('Error al subir la imagen a Supabase Storage. Verifique que exista el bucket "product-images".')
        } else {
          imagen_path = data.path
        }
      }

      if (product) {
        // Edit existing product
        const { error } = await supabase
          .from('productos')
          .update({
            nombre: nombre.trim(),
            precio,
            descripcion: descripcion.trim(),
            categoria_id: categoriaId,
            imagen_path,
            actualizado_en: new Date()
          })
          .eq('id', product.id)
        
        if (error) throw error
      } else {
        // Insert new product
        const { error } = await supabase
          .from('productos')
          .insert({
            nombre: nombre.trim(),
            precio,
            descripcion: descripcion.trim(),
            categoria_id: categoriaId,
            imagen_path
          })
        
        if (error) throw error
      }

      alert('Producto guardado exitosamente')
      onSaved()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Error al guardar producto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel mb-4">
      <h3>{product ? '✏️ Editar Producto' : '➕ Nuevo Producto'}</h3>
      
      <div className="form-grid">
        <div>
          <label>Nombre del Producto</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="Ej. Hamburguesa Especial"
          />
        </div>
        
        <div>
          <label>Precio ($)</label>
          <input
            type="number"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
            required
            placeholder="0.00"
          />
        </div>

        <div>
          <label>Categoría</label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            required
          >
            <option value="">-- Seleccionar Categoría --</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Fotografía (Opcional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ padding: '6px 12px' }}
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label>Descripción / Ingredientes</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={2}
            placeholder="Detalles sobre preparación o ingredientes..."
          />
        </div>
      </div>

      {previewUrl && (
        <div style={{ marginTop: 16 }}>
          <label>Vista Previa de Imagen</label>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 8,
              border: '1px solid var(--border)',
              overflow: 'hidden',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onSaved}
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar Producto'}
        </button>
      </div>
    </form>
  )
}
