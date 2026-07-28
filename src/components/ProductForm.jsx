import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { formatCurrencyLabel } from '../lib/currency'

function buildTaggedError(step, error, fallbackMessage, extra = {}) {
  const taggedError = new Error(error?.message || fallbackMessage)

  taggedError.step = step
  taggedError.details = error?.details
  taggedError.hint = error?.hint
  taggedError.code = error?.code
  taggedError.statusCode = error?.statusCode

  Object.assign(taggedError, extra)

  return taggedError
}

function buildProductSaveErrorMessage(err, isEditing) {
  const fallback = isEditing ? 'Error al actualizar el producto.' : 'Error al guardar producto.'

  if (!err) return fallback

  const parts = []

  if (err.message) parts.push(err.message)
  if (err.details && err.details !== err.message) parts.push(err.details)
  if (err.hint) parts.push(`Sugerencia: ${err.hint}`)
  if (err.code) parts.push(`Codigo: ${err.code}`)
  if (err.statusCode) parts.push(`HTTP: ${err.statusCode}`)

  const normalizedMessage = `${err.message || ''} ${err.details || ''}`.toLowerCase()
  if (err.step === 'storage-upload') {
    parts.push('Posible causa: falta una policy de INSERT o SELECT en storage.objects para el bucket "product-images". Supabase Storage necesita poder insertar y devolver el objeto recien creado.')
  } else if (
    err.step === 'product-save' ||
    normalizedMessage.includes('table "productos"') ||
    normalizedMessage.includes("table 'productos'")
  ) {
    parts.push('Posible causa: tu sesion no esta cumpliendo la politica RLS de productos para acciones de administrador.')
  } else if (
    normalizedMessage.includes('auditoria') ||
    normalizedMessage.includes('table "auditoria"') ||
    normalizedMessage.includes("table 'auditoria'")
  ) {
    parts.push('Posible causa: la auditoria o las politicas RLS estan bloqueando el guardado.')
  }

  return parts.length > 0 ? parts.join('\n') : fallback
}

export default function ProductForm({ product, onSaved }) {
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState(0)
  const [categoriaId, setCategoriaId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [imagenFile, setImagenFile] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const nombreInputRef = useRef(null)

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

  useEffect(() => {
    if (!product || !nombreInputRef.current) return

    nombreInputRef.current.focus()
    nombreInputRef.current.select()
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
    if (!categoriaId) return alert('Selecciona una categoria')

    setSaving(true)
    try {
      let imagenPath = product?.imagen_path ?? null

      if (imagenFile) {
        const id = uuidv4()
        const ext = imagenFile.name.split('.').pop()
        const filename = `product-${id}.${ext}`

        const { data, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filename, imagenFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Storage upload error:', uploadError)
          throw buildTaggedError(
            'storage-upload',
            uploadError,
            'No se pudo subir la imagen. Verifica el bucket "product-images" y sus politicas.',
            {
              bucket: 'product-images',
              filename
            }
          )
        }

        imagenPath = data.path
      }

      if (product) {
        const { count, error } = await supabase
          .from('productos')
          .update(
            {
              nombre: nombre.trim(),
              precio,
              descripcion: descripcion.trim(),
              categoria_id: categoriaId,
              imagen_path: imagenPath,
              actualizado_en: new Date().toISOString()
            },
            { count: 'exact' }
          )
          .eq('id', product.id)
          .eq('activo', true)

        if (error) {
          throw buildTaggedError('product-save', error, 'No se pudo actualizar el producto.', {
            table: 'productos',
            operation: 'update'
          })
        }
        if (count === 0) {
          throw new Error('No se actualizo ningun producto. Puede que ya este inactivo o que tu usuario no tenga permisos para editarlo.')
        }
      } else {
        const { error } = await supabase
          .from('productos')
          .insert({
            nombre: nombre.trim(),
            precio,
            descripcion: descripcion.trim(),
            categoria_id: categoriaId,
            imagen_path: imagenPath
          })

        if (error) {
          throw buildTaggedError('product-save', error, 'No se pudo crear el producto.', {
            table: 'productos',
            operation: 'insert'
          })
        }
      }

      alert(product ? 'Producto actualizado exitosamente' : 'Producto guardado exitosamente')
      onSaved()
    } catch (err) {
      console.error('Error guardando producto:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        raw: err
      })
      alert(buildProductSaveErrorMessage(err, Boolean(product)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel mb-4">
      <h3>{product ? 'Editando producto' : 'Nuevo producto'}</h3>

      {product ? (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 14px',
            borderRadius: 10,
            background: 'var(--accent-bg)',
            color: 'var(--primary)',
            border: '1px solid rgba(14, 165, 233, 0.18)'
          }}
        >
          Estas editando <strong>{product.nombre}</strong>. Cambia los campos y guarda para aplicar los cambios.
        </div>
      ) : null}

      <div className="form-grid">
        <div>
          <label>Nombre del Producto</label>
          <input
            ref={nombreInputRef}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="Ej. Hamburguesa Especial"
          />
        </div>

        <div>
          <label>{formatCurrencyLabel('Precio')}</label>
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
          <label>Categoria</label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            required
          >
            <option value="">-- Seleccionar Categoria --</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Fotografia (Opcional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ padding: '6px 12px' }}
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label>Descripcion / Ingredientes</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={2}
            placeholder="Detalles sobre preparacion o ingredientes..."
          />
        </div>
      </div>

      {previewUrl ? (
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
      ) : null}

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
          {saving ? 'Guardando...' : product ? 'Guardar cambios' : 'Guardar Producto'}
        </button>
      </div>
    </form>
  )
}
