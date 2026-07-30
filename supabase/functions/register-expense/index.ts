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
    const { errorResponse, auth } = await requireAuthenticatedUser(req, ['Vendedor', 'Administrador'])
    if (errorResponse) return errorResponse

    const body = await readJsonBody(req)
    const titulo = String(body?.titulo || '').trim()
    const comentario = String(body?.comentario || '').trim()
    const monto = Number.parseFloat(String(body?.monto || 0))

    if (!titulo || !Number.isFinite(monto) || monto <= 0) {
      return jsonResponse({ error: 'Invalid payload' }, 400)
    }

    const { data: expense, error: expenseError } = await serviceClient
      .from('gastos')
      .insert({
        titulo,
        monto,
        comentario,
        usuario_id: auth.profile.id,
      })
      .select()
      .single()

    if (expenseError) throw expenseError

    await serviceClient.from('auditoria').insert({
      entidad: 'gastos',
      entidad_id: expense.id,
      accion: 'INSERT',
      usuario_id: auth.profile.id,
      datos_previos: null,
      datos_nuevos: expense,
    })

    return jsonResponse({ success: true, gasto_id: expense.id })
  } catch (error: any) {
    console.error('register-expense error', error)
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
