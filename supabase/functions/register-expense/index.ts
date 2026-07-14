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
    const { usuario_id, titulo, monto, comentario } = body
    if(!usuario_id || !titulo || !monto) return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: gasto, error } = await sb.from('gastos').insert({ titulo, monto, comentario, usuario_id }).select().single()
    if(error) throw error

    await sb.from('auditoria').insert({ entidad: 'gastos', entidad_id: gasto.id, accion: 'INSERT', usuario_id, datos_previos: null, datos_nuevos: gasto })

    return new Response(JSON.stringify({ success: true, gasto_id: gasto.id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }catch(err: any){
    console.error('register-expense error', err)
    return new Response(JSON.stringify({ error: err.message ?? String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
