import {
  corsHeaders,
  jsonResponse,
  readJsonBody,
  requireAuthenticatedUser,
  serviceClient,
} from '../_shared/security.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { errorResponse } = await requireAuthenticatedUser(req, ['Administrador'])
    if (errorResponse) return errorResponse

    const body = await readJsonBody(req)
    const { from, to } = body || {}

    const fromDate = from ? new Date(from) : new Date(new Date().setHours(0, 0, 0, 0))
    const toDate = to ? new Date(to) : new Date()

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return jsonResponse({ error: 'Invalid payload: fechas invalidas.' }, 400)
    }

    if (fromDate > toDate) {
      return jsonResponse({ error: 'Invalid payload: la fecha inicial no puede ser mayor a la fecha final.' }, 400)
    }

    const { data: ventas, error: ventasError } = await serviceClient
      .from('ventas')
      .select('*')
      .gte('fecha_hora', fromDate.toISOString())
      .lte('fecha_hora', toDate.toISOString())

    if (ventasError) throw ventasError

    const totalVendido = (ventas || []).reduce(
      (sum: number, venta: { total?: number | string | null }) =>
        sum + Number.parseFloat(String(venta.total || 0)),
      0
    )
    const cantidadVentas = (ventas || []).length

    const metodosMap: Record<string, number> = {}
    for (const venta of ventas || []) {
      const metodoId = venta.metodo_pago_id || 'unknown'
      metodosMap[metodoId] = (metodosMap[metodoId] || 0) + 1
    }

    const { data: gastos, error: gastosError } = await serviceClient
      .from('gastos')
      .select('*')
      .gte('fecha_hora', fromDate.toISOString())
      .lte('fecha_hora', toDate.toISOString())

    if (gastosError) throw gastosError

    const totalGastos = (gastos || []).reduce(
      (sum: number, gasto: { monto?: number | string | null }) =>
        sum + Number.parseFloat(String(gasto.monto || 0)),
      0
    )

    const ventaIds = (ventas || []).map((venta: { id: string }) => venta.id)
    let productosTop: Array<{ producto_id: string; cantidad: number; nombre: string | null }> = []

    if (ventaIds.length > 0) {
      const { data: detalles, error: detallesError } = await serviceClient
        .from('detalle_venta')
        .select('producto_id, cantidad')
        .in('venta_id', ventaIds)

      if (detallesError) throw detallesError

      const prodMap: Record<string, number> = {}
      for (const detalle of detalles || []) {
        if (!detalle.producto_id) continue
        prodMap[detalle.producto_id] = (prodMap[detalle.producto_id] || 0) + Number.parseInt(String(detalle.cantidad || 0), 10)
      }

      const productIds = Object.keys(prodMap)
      if (productIds.length > 0) {
        const { data: products, error: productsError } = await serviceClient
          .from('productos')
          .select('id, nombre')
          .in('id', productIds)

        if (productsError) throw productsError

        productosTop = Object.entries(prodMap)
          .map(([productId, quantity]) => ({
            producto_id: productId,
            cantidad: quantity,
            nombre: (products || []).find((product: { id: string; nombre: string | null }) => product.id === productId)?.nombre ?? null,
          }))
          .sort((left, right) => right.cantidad - left.cantidad)
      }
    }

    const metodoIds = Array.from(
      new Set(
        (ventas || [])
          .map((venta: { metodo_pago_id?: string | null }) => venta.metodo_pago_id)
          .filter(Boolean)
      )
    ) as string[]

    const metodoNames: Record<string, string> = {}
    if (metodoIds.length > 0) {
      const { data: paymentMethods, error: paymentMethodsError } = await serviceClient
        .from('metodos_pago')
        .select('id, nombre')
        .in('id', metodoIds)

      if (paymentMethodsError) throw paymentMethodsError

      for (const paymentMethod of paymentMethods || []) {
        metodoNames[paymentMethod.id] = paymentMethod.nombre
      }
    }

    const metodosDetalle = Object.entries(metodosMap).map(([id, count]) => ({
      id,
      nombre: metodoNames[id] ?? id,
      count,
    }))

    return jsonResponse({
      totalVendido,
      totalGastos,
      utilidadEstim: totalVendido - totalGastos,
      cantidadVentas,
      metodos: metodosDetalle,
      productosTop,
    })
  } catch (error: any) {
    console.error('get-reports error', error)
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
