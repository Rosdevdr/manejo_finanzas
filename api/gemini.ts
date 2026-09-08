export const config = {
  runtime: 'edge',
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: { message: 'Método no permitido' } }), {
      status: 405,
      headers: CORS_HEADERS,
    })
  }

  try {
    const body = await req.json()
    const { apiKey, model, payload } = body

    if (!apiKey) {
      return new Response(JSON.stringify({ error: { message: 'Falta la clave API de Gemini' } }), {
        status: 400,
        headers: CORS_HEADERS,
      })
    }

    const candidateModels = [
      model || 'gemini-2.5-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-flash-latest',
      'gemini-3.5-flash',
    ]
    const uniqueModels = Array.from(new Set(candidateModels))

    let lastError = null

    for (const m of uniqueModels) {
      const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(apiKey)}`

      try {
        const googleRes = await fetch(googleUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (googleRes.ok) {
          const data = await googleRes.json()
          return new Response(JSON.stringify({ ...data, usedModel: m }), {
            status: 200,
            headers: CORS_HEADERS,
          })
        } else {
          const errData = await googleRes.json().catch(() => ({}))
          lastError = errData?.error?.message || `Error ${googleRes.status}: ${googleRes.statusText}`
        }
      } catch (err: any) {
        lastError = err.message
      }
    }

    return new Response(JSON.stringify({ error: { message: lastError || 'Error al conectar con Google Gemini' } }), {
      status: 500,
      headers: CORS_HEADERS,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: { message: error.message || 'Error interno del servidor' } }), {
      status: 500,
      headers: CORS_HEADERS,
    })
  }
}
