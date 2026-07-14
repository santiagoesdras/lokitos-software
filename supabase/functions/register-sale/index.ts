import { serve } from 'std/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const sb = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE as string)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try{
    const body = await req.json()
    const { user_id, items, total, metodo_pago_id } = body
    if(!user_id || !Array.isArray(items) || items.length === 0){
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Insert venta
    const { data: venta, error: errVenta } = await sb.from('ventas').insert({ usuario_id: user_id, total, metodo_pago_id }).select().single()
    if(errVenta) throw errVenta

    const detalles = items.map((it:any) => ({ venta_id: venta.id, producto_id: it.producto_id, cantidad: it.cantidad, precio_unitario: it.precio_unitario }))
    const { error: errDetalle } = await sb.from('detalle_venta').insert(detalles)
    if(errDetalle) throw errDetalle

    // Registrar auditoría manualmente (opcional, los triggers también podrían hacerlo)
    await sb.from('auditoria').insert({ entidad: 'ventas', entidad_id: venta.id, accion: 'INSERT', usuario_id: user_id, datos_previos: null, datos_nuevos: venta })

    return new Response(JSON.stringify({ success: true, venta_id: venta.id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }catch(err: any){
    console.error('register-sale error', err)
    return new Response(JSON.stringify({ error: err.message ?? String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
