import {
  corsHeaders,
  jsonResponse,
  readJsonBody,
  requireAuthenticatedUser,
  serviceClient,
} from '../_shared/security.ts'

type SaleItemInput = {
  producto_id?: string
  cantidad?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { errorResponse, auth } = await requireAuthenticatedUser(req, ['Vendedor', 'Administrador'])
    if (errorResponse) return errorResponse

    const body = await readJsonBody(req)
    const { items, metodo_pago_id } = body || {}

    if (!Array.isArray(items) || items.length === 0 || !metodo_pago_id) {
      return jsonResponse({ error: 'Invalid payload' }, 400)
    }

    const normalizedItems = items.map((item: SaleItemInput) => ({
      producto_id: item?.producto_id,
      cantidad: Number.parseInt(String(item?.cantidad || 0), 10),
    }))

    const hasInvalidItem = normalizedItems.some(
      (item) => !item.producto_id || !Number.isInteger(item.cantidad) || item.cantidad <= 0
    )
    if (hasInvalidItem) {
      return jsonResponse({ error: 'Invalid payload: items invalidos.' }, 400)
    }

    const uniqueProductIds = Array.from(new Set(normalizedItems.map((item) => item.producto_id))) as string[]

    const { data: products, error: productsError } = await serviceClient
      .from('productos')
      .select('id, nombre, precio, activo')
      .in('id', uniqueProductIds)

    if (productsError) throw productsError

    if (!products || products.length !== uniqueProductIds.length) {
      return jsonResponse({ error: 'Invalid payload: uno o mas productos no existen.' }, 400)
    }

    const inactiveProduct = products.find((product: { activo: boolean }) => product.activo !== true)
    if (inactiveProduct) {
      return jsonResponse({ error: 'Invalid payload: uno o mas productos estan inactivos.' }, 400)
    }

    const { data: paymentMethod, error: paymentMethodError } = await serviceClient
      .from('metodos_pago')
      .select('id')
      .eq('id', metodo_pago_id)
      .maybeSingle()

    if (paymentMethodError) throw paymentMethodError
    if (!paymentMethod) {
      return jsonResponse({ error: 'Invalid payload: metodo de pago invalido.' }, 400)
    }

    const details = normalizedItems.map((item) => {
      const product = products.find((currentProduct: { id: string }) => currentProduct.id === item.producto_id)
      return {
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: Number(product?.precio || 0),
      }
    })

    const computedTotal = details.reduce(
      (sum, item) => sum + item.precio_unitario * item.cantidad,
      0
    )

    const { data: sale, error: saleError } = await serviceClient
      .from('ventas')
      .insert({
        usuario_id: auth.profile.id,
        total: computedTotal,
        metodo_pago_id,
      })
      .select()
      .single()

    if (saleError) throw saleError

    const saleDetails = details.map((item) => ({
      venta_id: sale.id,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
    }))

    const { error: detailsError } = await serviceClient.from('detalle_venta').insert(saleDetails)
    if (detailsError) throw detailsError

    await serviceClient.from('auditoria').insert({
      entidad: 'ventas',
      entidad_id: sale.id,
      accion: 'INSERT',
      usuario_id: auth.profile.id,
      datos_previos: null,
      datos_nuevos: sale,
    })

    return jsonResponse({ success: true, venta_id: sale.id, total: computedTotal })
  } catch (error: any) {
    console.error('register-sale error', error)
    return jsonResponse(
      {
        error: error?.message ?? String(error),
        details: error?.details ?? null,
        hint: error?.hint ?? null,
      },
      500
    )
  }
})
