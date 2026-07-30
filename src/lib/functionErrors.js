import { FunctionsHttpError } from '@supabase/supabase-js'

export async function getFunctionErrorMessage(error, fallbackMessage) {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = await error.context.json()
      const parts = []

      if (payload?.error) parts.push(payload.error)
      if (payload?.details) parts.push(payload.details)
      if (payload?.hint) parts.push(`Sugerencia: ${payload.hint}`)

      return parts.length > 0 ? parts.join('\n') : fallbackMessage
    } catch (parseError) {
      console.error('No se pudo leer el cuerpo del error de la Edge Function:', parseError)
    }
  }

  return error?.message || fallbackMessage
}
