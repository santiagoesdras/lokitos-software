import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE') ?? ''

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let body: any = {}
    try {
      const raw = await req.json()
      body = typeof raw === 'string' ? JSON.parse(raw) : (raw || {})
    } catch {
      body = {}
    }

    const { from, to } = body || {}
    const fromDate = from ? new Date(from) : new Date(new Date().setHours(0, 0, 0, 0))
    const toDate = to ? new Date(to) : new Date()

    // Ventas en rango
    const { data: ventas, error: errVentas } = await sb.from('ventas').select('*').gte('fecha_hora', fromDate.toISOString()).lte('fecha_hora', toDate.toISOString())
    if (errVentas) throw errVentas

    const totalVendido = (ventas || []).reduce((s: any, v: any) => s + parseFloat(v.total || 0), 0)
    const cantidadVentas = (ventas || []).length

    // Distribución por método de pago
    const metodosMap: any = {}
    for (const v of (ventas || [])) {
      const m = v.metodo_pago_id || 'unknown'
      metodosMap[m] = (metodosMap[m] || 0) + 1
    }

    // Gastos en rango
    const { data: gastos, error: errGastos } = await sb.from('gastos').select('*').gte('fecha_hora', fromDate.toISOString()).lte('fecha_hora', toDate.toISOString())
    if (errGastos) throw errGastos

    const totalGastos = (gastos || []).reduce((s: any, g: any) => s + parseFloat(g.monto || 0), 0)

    // Detalle ventas y productos más vendidos
    const ventaIds = (ventas || []).map((v: any) => v.id)
    let productosTop: any[] = []
    if (ventaIds.length > 0) {
      const { data: detalles } = await sb.from('detalle_venta').select('producto_id, cantidad').in('venta_id', ventaIds)
      const prodMap: any = {}
      for (const d of (detalles || [])) {
        prodMap[d.producto_id] = (prodMap[d.producto_id] || 0) + parseInt(d.cantidad || 0)
      }
      const prodIds = Object.keys(prodMap)
      if (prodIds.length > 0) {
        const { data: prods } = await sb.from('productos').select('id, nombre').in('id', prodIds)
        productosTop = Object.entries(prodMap).map(([pid, qty]) => ({ producto_id: pid, cantidad: qty, nombre: (prods || []).find((p: any) => p.id === pid)?.nombre ?? null }))
        productosTop.sort((a: any, b: any) => b.cantidad - a.cantidad)
      }
    }

    // Resolver nombres de métodos de pago
    const metodoIds = Array.from(new Set((ventas || []).map((v: any) => v.metodo_pago_id).filter(Boolean)))
    const metodoNames: any = {}
    if (metodoIds.length) {
      const { data: mds } = await sb.from('metodos_pago').select('id,nombre').in('id', metodoIds)
      for (const m of (mds || [])) metodoNames[m.id] = m.nombre
    }

    const metodosDetalle = Object.entries(metodosMap).map(([id, count]) => ({ id, nombre: metodoNames[id] ?? id, count }))

    const utilidadEstim = totalVendido - totalGastos

    return new Response(JSON.stringify({ totalVendido, totalGastos, utilidadEstim, cantidadVentas, metodos: metodosDetalle, productosTop }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    console.error('get-reports error', err)
    return new Response(JSON.stringify({ error: err.message ?? String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
