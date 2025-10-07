import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { schema } from '@/db'

// Ensure Node.js runtime for server-side operations
export const runtime = 'nodejs'

type AnyJson = any

// Se elimina el soporte de LoRAs en este handler para simplificar el endpoint.

async function generateImageWithSinkin(params: {
  prompt: string
  width?: number
  height?: number
  negative_prompt?: string | null
  steps?: number | null
  scale?: number | null
  num_images?: number | null
  scheduler?: string | null
  seed?: number | null
  model?: string | null
  version?: string | null
  accessToken?: string | null
}): Promise<string[]> {
  const {
    prompt,
    width = 512,
    height = 768,
    negative_prompt = null,
    steps = 30,
    scale = 7.5,
    num_images = 1,
    scheduler = null,
    seed = null,
    model = null,
    version = null,
    accessToken = null,
  } = params

  console.log('[Sinkin] Inicio generateImageWithSinkin. prompt_len=', typeof prompt === 'string' ? prompt.length : -1)
  const apiKeyRaw = accessToken ?? process.env.SINKINAI_API_KEY
  const apiKey = typeof apiKeyRaw === 'string' ? apiKeyRaw.trim() : undefined
  const appliedTrim = typeof apiKeyRaw === 'string' ? apiKeyRaw !== apiKey : false
  // Use a known public model as default; allow override via payload
  // MajicMix Realistic (ejemplo público)
  const modelId = model || 'JWknjgr'
  const endpoint = `https://sinkin.ai/api/inference`

  if (!apiKey) {
    throw new Error('Falta SINKINAI_API_KEY en las variables de entorno')
  }
  console.log('[Sinkin] access_token detectado. presente=', !!apiKeyRaw, 'trim_aplicado=', appliedTrim, 'longitud_final=', apiKey.length, 'override_en_payload=', !!accessToken)

  // Muchas implementaciones SD requieren tamaño múltiplo de 64
  const roundToDivisor = (n: number, divisor = 64) => Math.max(divisor, Math.min(1280, Math.round(n / divisor) * divisor))
  const adjWidth = roundToDivisor(width)
  const adjHeight = roundToDivisor(height)

  // Construct multipart/form-data as per Sinkin API guide
  const form = new FormData()
  const formKeys: string[] = []
  form.append('access_token', apiKey); formKeys.push('access_token')
  form.append('model_id', modelId); formKeys.push('model_id')
  form.append('prompt', prompt); formKeys.push('prompt')
  form.append('width', String(adjWidth)); formKeys.push('width')
  form.append('height', String(adjHeight)); formKeys.push('height')
  if (negative_prompt) { form.append('negative_prompt', negative_prompt); formKeys.push('negative_prompt') }
  if (typeof steps === 'number' && steps > 0) { form.append('steps', String(Math.min(50, steps))); formKeys.push('steps') }
  if (typeof scale === 'number' && scale > 0) { form.append('scale', String(Math.min(20, scale))); formKeys.push('scale') }
  // Forzar siempre una sola imagen
  form.append('num_images', '1'); formKeys.push('num_images')
  if (typeof seed === 'number') { form.append('seed', String(seed)); formKeys.push('seed') }
  if (scheduler && scheduler.trim().length > 0) { form.append('scheduler', scheduler.trim()); formKeys.push('scheduler') }
  if (version && version.trim().length > 0) { form.append('version', version.trim()); formKeys.push('version') }
  console.log('[Sinkin] FormData preparado. campos=', formKeys, 'model_id=', modelId, 'prompt_len=', prompt.length, 'width=', adjWidth, 'height=', adjHeight)

  console.log('[Sinkin] Solicitando generación de imagen (inference):', {
    endpoint,
    model_id: modelId,
    width: adjWidth,
    height: adjHeight,
    steps,
    scale,
    num_images: 1,
    scheduler,
  })

  const res = await fetch(endpoint, {
    method: 'POST',
    // Do not set Content-Type manually; let FormData set boundary
    headers: {
      'Accept': 'application/json',
    },
    body: form as any,
  })
  console.log('[Sinkin] Respuesta HTTP recibida. status=', res.status, 'ok=', res.ok, 'content-type=', res.headers.get('content-type'))

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[Sinkin] Error HTTP no OK. status=', res.status, 'body_snippet=', (text || '').slice(0, 300))
    throw new Error(`Error Sinkin ${res.status}: ${text || 'Request failed'} (endpoint=${endpoint})`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    console.error('[Sinkin] Content-Type inesperado:', contentType)
    throw new Error('Respuesta no esperada de Sinkin: se esperaba JSON con URLs')
  }

  let data: AnyJson = await res.json()
  // Log basic shape to aid debugging when no image is found
  try {
    const keys = typeof data === 'object' && data ? Object.keys(data) : []
    console.log('[Sinkin] Respuesta JSON recibida. keys=', keys, 'error_code=', data?.error_code, 'message=', data?.message)
  } catch {}
  // Manejo de respuesta: devolver URLs de imagen según documentación
  let urls: string[] | undefined
  let urlSourceField: string | undefined
  if (Array.isArray(data?.images) && data.images.every((x: any) => typeof x === 'string')) {
    urls = data.images
    urlSourceField = 'images'
  }
  if (!urls && Array.isArray(data?.urls) && data.urls.every((x: any) => typeof x === 'string')) {
    urls = data.urls
    urlSourceField = 'urls'
  }
  if (!urls && Array.isArray(data?.image_urls) && data.image_urls.every((x: any) => typeof x === 'string')) {
    urls = data.image_urls
    urlSourceField = 'image_urls'
  }
  if (!urls && typeof data?.image_url === 'string') {
    urls = [data.image_url]
    urlSourceField = 'image_url'
  }
  if (!urls && (data?.error_code === 1 || data?.error)) {
    const msg = data?.message || data?.error || 'Error en respuesta de Sinkin'
    throw new Error(String(msg))
  }
  if (data?.error_code === 20 && /Invalid access token/i.test(String(data?.message))) {
    throw new Error('Invalid access token')
  }
  if (!urls || !urls.length) {
    let snippet = ''
    try { snippet = JSON.stringify(data).slice(0, 500) } catch {}
    throw new Error('No se encontraron URLs de imagen en la respuesta de Sinkin. data=' + snippet)
  }
  console.log('[Sinkin] URLs recibidas (fuente=', urlSourceField, '):', urls.slice(0, 2), 'total=', urls.length)
  return urls
}

async function uploadToCloudinary(base64Image: string): Promise<{ url: string; public_id?: string }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Faltan variables de entorno de Cloudinary')
  }

  // Use REST upload to avoid adding SDK dependency
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
  const timestamp = Math.floor(Date.now() / 1000)

  // Minimal signed upload: signature of params sorted, excluding file
  const paramsToSign: Record<string, string | number> = {
    timestamp,
  }

  const crypto = await import('crypto')
  const sorted = Object.keys(paramsToSign)
    .sort()
    .map((k) => `${k}=${paramsToSign[k]}`)
    .join('&')
  const signature = crypto.createHash('sha1').update(sorted + apiSecret).digest('hex')

  const dataUri = `data:image/png;base64,${base64Image}`
  const form = new URLSearchParams()
  form.append('file', dataUri)
  form.append('api_key', apiKey)
  form.append('timestamp', String(timestamp))
  form.append('signature', signature)

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Error Cloudinary ${res.status}: ${text}`)
  }

  const json = await res.json()
  return { url: json.secure_url || json.url, public_id: json.public_id }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API /images] POST recibido. url=', request.url)
    const reqContentType = request.headers.get('content-type')
    const url = new URL(request.url)
    const previewOnlyQuery = url.searchParams.get('previewOnly')
    console.log('[API /images] headers.content-type=', reqContentType)
    console.log('[API /images] query.previewOnly=', previewOnlyQuery)
    const envRaw = process.env.SINKINAI_API_KEY
    const envTrim = typeof envRaw === 'string' ? envRaw.trim() : ''
    console.log('[API /images] env.SINKINAI_API_KEY present=', !!envRaw, 'len_raw=', typeof envRaw === 'string' ? envRaw.length : -1, 'len_trim=', envTrim.length)
    let input: any = null
    let isMultipart = false
    if (reqContentType && reqContentType.includes('multipart/form-data')) {
      isMultipart = true
      const form = await request.formData().catch((e) => {
        console.error('[API /images] Error parseando multipart:', e)
        return null as any
      })
      if (!form) {
        return NextResponse.json({ error: 'Body inválido: multipart/form-data no parseado' }, { status: 400 })
      }
      input = Object.create(null)
      for (const key of form.keys()) {
        const val = form.get(key)
        input[key] = typeof val === 'string' ? val : String(val)
      }
      console.log('[API /images] multipart.keys=', Object.keys(input))
    } else {
      input = await request.json().catch((e) => {
        console.error('[API /images] Error parseando JSON del body:', e)
        return null as any
      })
      if (!input || typeof input !== 'object') {
        return NextResponse.json({ error: 'Body inválido: se esperaba JSON' }, { status: 400 })
      }
      console.log('[API /images] body.keys=', Object.keys(input))
    }

    console.log('[API /images] input.imagePromptMaster_len=', typeof input?.imagePromptMaster === 'string' ? input.imagePromptMaster.length : -1, 'input.prompt_len=', typeof input?.prompt === 'string' ? input.prompt.length : -1)
    const promptRaw: unknown = input?.imagePromptMaster ?? input?.prompt

    if (typeof promptRaw !== 'string' || promptRaw.trim().length < 10) {
      console.warn('[API /images] Prompt inválido o corto. len_raw=', typeof promptRaw === 'string' ? promptRaw.length : -1)
      return NextResponse.json({ error: 'Prompt inválido o demasiado corto' }, { status: 400 })
    }

    const prompt = promptRaw.trim()
    console.log('[API /images] prompt_len_trim=', prompt.length)
    // Usamos parámetros por defecto del Sinkin API definidos en generateImageWithSinkin
    const overrideAccessToken = typeof input?.access_token === 'string' ? input.access_token.trim() : null
    const overrideModelId = typeof input?.model_id === 'string' ? input.model_id.trim() : null
    const width = input?.width ? Number(input.width) : undefined
    const height = input?.height ? Number(input.height) : undefined
    const steps = input?.steps ? Number(input.steps) : undefined
    const scale = input?.scale ? Number(input.scale) : undefined
    // Forzar siempre una sola imagen generada
    const num_images = 1
    console.log('[API /images] overrides: access_token_present=', !!overrideAccessToken, 'model_id=', overrideModelId, 'size=', width, 'x', height, 'steps=', steps, 'scale=', scale, 'num_images_forzado=', num_images)
    const urls = await generateImageWithSinkin({ prompt, width, height, steps, scale, num_images, model: overrideModelId, accessToken: overrideAccessToken })
    console.log('[API /images] Preview: URLs recibidas=', urls.slice(0, 2), 'total=', urls.length)

    const previewOnly = previewOnlyQuery === 'true' || input?.previewOnly === true
    console.log('[API /images] previewOnly final=', previewOnly)
    if (previewOnly) {
      console.log('[API /images] Devolviendo URLs en modo previewOnly (solo 1)')
      return NextResponse.json({ images: [urls[0]] })
    }

    // Descargar la primera URL para subir a Cloudinary
    const firstUrl = urls[0]
    console.log('[API /images] Descargando primera URL para Cloudinary:', firstUrl)
    const imgRes = await fetch(firstUrl)
    if (!imgRes.ok) {
      const t = await imgRes.text().catch(() => '')
      throw new Error(`No se pudo descargar imagen de URL: ${imgRes.status} ${t}`)
    }
    const buf = Buffer.from(await imgRes.arrayBuffer())
    const base64Image = buf.toString('base64')
    console.log('[API /images] Imagen descargada. tamaño_base64_len=', base64Image.length)
    const upload = await uploadToCloudinary(base64Image)
    console.log('[API /images] Cloudinary subida OK. public_id=', upload.public_id, 'url=', upload.url)
    // Si viene agentId, guardar como mensaje en DB
    const agentId = typeof input?.agentId === 'string' ? input.agentId.trim() : null
    if (agentId) {
      try {
        await db.insert(schema.chatMessages).values({
          content: `IMAGEN_URL: ${upload.url}`,
          role: 'assistant',
          agentId,
        })
        console.log('[API /images] Mensaje con imagen guardado en DB para agentId=', agentId)
      } catch (e) {
        console.error('[API /images] Error guardando imagen en DB:', e)
      }
    }
    return NextResponse.json({ photoUrl: upload.url, publicId: upload.public_id })
  } catch (error: any) {
    console.error('Error generando/subiendo imagen:', error?.message || error)
    const msg: string = String(error?.message || 'Error interno')
    // Mapear errores comunes a códigos adecuados
    if (msg.includes('Falta SINKINAI_API_KEY')) {
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    if (msg.includes('Invalid access token')) {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}