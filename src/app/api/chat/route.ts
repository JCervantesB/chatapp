import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { schema } from '@/db'
import { asc, eq, and, ne } from 'drizzle-orm'
// Tipado local de mensajes para Venice
type VeniceMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}
import { buildAgentSystemPrompt, buildInitialUserInstruction } from '@/lib/prompts'
import { auth } from '@/lib/auth'

// Asegurar runtime Node para soporte de librerías y headers
export const runtime = 'nodejs'

// Peticiones directas al endpoint Venice Chat Completions usando fetch
// Docs: https://api.venice.ai/api/v1/chat/completions

// Sanitiza la línea IMAGEN para cumplir el formato booru-style, eliminar nombres propios
// y términos prohibidos, además de limitar a 100 palabras.
function sanitizeImagenLine(
  fullText: string,
  agentName: string,
  userName?: string,
  characterName?: string
): string {
  const lines = fullText.split('\n')
  let imagenIndex = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^\s*IMAGEN:\s*/i.test(lines[i])) { imagenIndex = i; break }
  }
  if (imagenIndex === -1) return fullText
  const prefix = lines[imagenIndex].match(/^\s*IMAGEN:\s*/i)?.[0] || 'IMAGEN: '
  let content = lines[imagenIndex].replace(/^\s*IMAGEN:\s*/i, '')

  // Normalización básica
  content = content
    .replace(/"/g, '')
    .replace(/\'/g, '')
    .replace(/:/g, '')
    .replace(/\./g, '')
    .replace(/;+/g, ', ')
    .replace(/\s+and\s+/gi, ', ')
    .replace(/\s+of\s+/gi, ', ')
    .replace(/\s*hint of\s*/gi, ', ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

  // Lista de términos prohibidos
  const banned = [
    'school uniform',
    'youthful',
    'school setting',
    'after school',
    'student',
    'adolescent',
    'child',
    'young',
    'teenager'
  ]

  // Quitar nombres propios del agente y usuario, pero preservar characterName si existe
  const nameParts = [
    ...String(agentName || '').toLowerCase().split(/\s+/).filter(Boolean),
    ...String(userName || '').toLowerCase().split(/\s+/).filter(Boolean),
  ]
  const characterTag = String(characterName || '').toLowerCase().trim()

  // Tokenizar por comas y limpiar
  let tokens = content
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)

  // Comprimir tokens demasiado largos (booru-style: preferir 1-3 palabras por etiqueta)
  tokens = tokens.map(t => {
    const words = t.split(/\s+/)
    if (words.length > 3) return words.slice(0, 3).join(' ')
    return t
  })

  tokens = tokens.filter(t => !banned.some(b => t.includes(b)))
  if (nameParts.length) {
    tokens = tokens.filter(t => {
      // Preservar explícitamente el characterName si coincide exactamente
      if (characterTag && t === characterTag) return true
      return !nameParts.some(np => np && t.includes(np))
    })
  }

  // Deduplicar tokens
  const seen = new Set<string>()
  tokens = tokens.filter(t => {
    const key = t
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Sujetos genéricos obligatorios
  const subjectTags = ['1girl','1boy','1person','2girls','2boys','couple','group','solo','adult']
  const hasSubject = tokens.some(t => subjectTags.includes(t))
  if (!hasSubject) {
    tokens.unshift('1person')
    if (!tokens.includes('solo')) tokens.splice(1, 0, 'solo')
    if (!tokens.includes('adult')) tokens.splice(2, 0, 'adult')
  } else {
    if (!tokens.includes('adult')) tokens.unshift('adult')
  }

  // Refuerzo de mínimo 30 palabras: si el recuento es menor, añadir etiquetas de pose/composición y sexuales según acción
  const compactTag = (t: string) => {
    const w = t.split(/\s+/)
    return w.length > 3 ? w.slice(0, 3).join(' ') : t
  }
  const pushTag = (t: string) => {
    const tag = compactTag(t.trim().toLowerCase())
    if (tag.length === 0) return
    if (!tokens.includes(tag)) tokens.push(tag)
  }

  let currentWords = tokens.reduce((sum, t) => sum + t.split(/\s+/).length, 0)
  if (currentWords < 30) {
    // Detectar acción del bloque (primera línea con *acción*)
    const actionLine = fullText.split('\n').find(l => /\*[^*]+\*/.test(l)) || ''
    const actionMatch = actionLine.match(/\*([^*]+)\*/)
    const actionText = (actionMatch?.[1] || '').toLowerCase()

    // Pose y composición base
    const basePose = ['natural pose','dynamic pose','looking at camera','eye contact']
    const baseLight = ['cinematic lighting','soft lighting','warm lighting','dramatic shadows']
    const baseCamera = ['close-up','medium shot','full body','portrait','tilted angle','from above','from below','over the shoulder']
    basePose.forEach(pushTag)
    baseLight.forEach(pushTag)
    baseCamera.forEach(pushTag)

    // Entorno según acción
    if (/cama|bed/i.test(actionText)) ['bedroom','bed','soft lighting'].forEach(pushTag)
    if (/sof[áa]|sofa|couch/i.test(actionText)) ['living room','couch','warm lighting'].forEach(pushTag)
    if (/ducha|shower/i.test(actionText)) ['bathroom','shower','wet skin','steamy'].forEach(pushTag)

    // Etiquetas importantes según actividad sexual
    if (/kiss|kissing|beso|besar/i.test(actionText)) {
      ['kissing','lip contact','tongue','mouth close-up','intimate'].forEach(pushTag)
    }
    if (/blowjob|oral|suck|chupar|mamar|felaci[óo]n|fellatio/i.test(actionText)) {
      ['fellatio','mouth','tongue','on knees','handjob'].forEach(pushTag)
    }
    if (/sex|fuck|intercourse|penetration|penetrar|doggy|cowgirl|missionary|ride|mount/i.test(actionText)) {
      ['sexually explicit','vaginal','spread legs','leg up','on side','arch back'].forEach(pushTag)
    }
    if (/hug|embrace|abraz/i.test(actionText)) {
      ['intimate','close contact','hands on body'].forEach(pushTag)
    }

    // Detalle/estilo visual para alcanzar el mínimo
    const visualDetail = ['high detail','hyperrealistic','shallow depth of field','soft focus','skin texture','glossy skin','highlighted curves','sensual mood','teasing smile','delicate hands','long eyelashes','full lips']
    for (const v of visualDetail) {
      currentWords = tokens.reduce((sum, t) => sum + t.split(/\s+/).length, 0)
      if (currentWords >= 30) break
      pushTag(v)
    }
  }

  // Limitar a máximo 100 palabras
  const limited: string[] = []
  let wordCount = 0
  for (const t of tokens) {
    const wc = t.split(/\s+/).length
    if (wordCount + wc > 100) break
    limited.push(t)
    wordCount += wc
  }
  const sanitized = limited.join(', ')
  lines[imagenIndex] = `${prefix}${sanitized}`
  return lines.join('\n')
}

// Deriva etiquetas IMAGEN coherentes a partir de la acción del bloque de rolplay
function alignImagenWithAction(
  fullText: string,
  imagePromptMaster?: string,
  characterName?: string
): string {
  const lines = fullText.split('\n')
  // localizar IMAGEN
  let imagenIndex = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^\s*IMAGEN:\s*/i.test(lines[i])) { imagenIndex = i; break }
  }
  // localizar acción (primera línea con *acción*)
  const actionLine = lines.find(l => /\*[^*]+\*/.test(l)) || ''
  const actionTextMatch = actionLine.match(/\*([^*]+)\*/)
  const actionText = (actionTextMatch?.[1] || '').toLowerCase()
  if (!actionText) return fullText

  // mapa básico de acciones -> etiquetas
  const tags: string[] = []
  tags.push('1person','solo','adult')
  // entorno sugestivo por defecto si la acción incluye cama/sofá/ducha
  if (/cama|bed/i.test(actionText)) tags.push('bedroom','bed','soft lighting')
  if (/sof[áa]|sofa|couch/i.test(actionText)) tags.push('living room','couch','warm lighting')
  if (/ducha|shower/i.test(actionText)) tags.push('bathroom','shower','wet skin','steamy')
  if (/cocina|kitchen/i.test(actionText)) tags.push('kitchen','counter','evening')

  // postura y contacto
  if (/me acerco|acerc|closer|approach/i.test(actionText)) tags.push('close-up','intimate')
  if (/bes|kiss/i.test(actionText)) tags.push('kissing','mouth close-up','lip contact')
  if (/toc|touch|acarici|caress/i.test(actionText)) tags.push('touching','hands on body')
  if (/desvist|undress|quitar la ropa|strip/i.test(actionText)) tags.push('undressing','clothes off')
  if (/susurr|whisper/i.test(actionText)) tags.push('whispering','ear close-up')
  if (/blowjob|oral|suck|chupar|mamar|felaci[óo]n|fellatio/i.test(actionText)) tags.push('fellatio','mouth','tongue','on knees','handjob')
  // actividad sexual — importante
  if (/sex|fuck|intercourse|penetration|penetrar|doggy|cowgirl|missionary|ride|mount/i.test(actionText)) tags.push('sexually explicit','vaginal','spread legs','leg up','on side','arch back')

  // sexualmente sugerente — importante
  if (/pierna|leg/i.test(actionText)) tags.push('spread legs')
  if (/cadera|hip|trasero|culo|ass/i.test(actionText)) tags.push('ass')
  if (/vagina|pussy|entre tus piernas|entre mis piernas/i.test(actionText)) tags.push('pussy')
  if (/lengua|tongue/i.test(actionText)) tags.push('tongue out')
  if (/pen[eí]s|dick|erect/i.test(actionText)) tags.push('sexually active','sexually explicit')
  

  // reforzar estética desde imagePromptMaster
  if (imagePromptMaster) {
    extractTraitsFromImagePromptMaster(imagePromptMaster).forEach(t => tags.push(t))
  }

  // Añadir el nombre del personaje si está definido (excepción de nombres propios)
  if (characterName && characterName.trim().length > 0) {
    tags.push(characterName.trim().toLowerCase())
  }

  // dedup y compactar etiquetas largas
  const seen = new Set<string>()
  const compact = tags
    .map(t => t.trim())
    .filter(t => t.length > 0)
    .map(t => { const w = t.split(/\s+/); return w.length > 3 ? w.slice(0,3).join(' ') : t })
    .filter(t => { if (seen.has(t)) return false; seen.add(t); return true })

  const prefix = 'IMAGEN: '
  const newLine = `${prefix}${compact.join(', ')}`
  if (imagenIndex >= 0) {
    lines[imagenIndex] = newLine
  } else {
    lines.push(newLine)
  }
  return lines.join('\n')
}

// Compacta la respuesta del asistente a un único bloque de rolplay:
// *acción*\n"diálogo"\n[estado], conservando la línea IMAGEN si existe.
// Anti-eco: no usa el texto del usuario para construir el diálogo; prefiere continuar desde el último mensaje del asistente.
function compressRoleplayToSingleBlock(fullText: string, userName?: string, lastUser?: string, lastAssistant?: string): string {
  const lines = fullText.split('\n')
  let imagenIndex = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^\s*IMAGEN:\s*/i.test(lines[i])) { imagenIndex = i; break }
  }
  const imagenLine = imagenIndex >= 0 ? lines[imagenIndex] : undefined
  const bodyLines = imagenIndex >= 0 ? [...lines.slice(0, imagenIndex), ...lines.slice(imagenIndex + 1)] : lines

  const body = bodyLines.join(' ').replace(/[\n\r]+/g, ' ').trim()

  // Detectar acción entre asteriscos
  const actionMatch = body.match(/\*([^*]+)\*/)
  const rawAction = actionMatch ? actionMatch[1].trim() : ''

  // Detectar diálogo entre comillas (normales o tipográficas)
  const dialogMatch = body.match(/"([^"]+)"|“([^”]+)”/)
  const rawDialog = dialogMatch ? (dialogMatch[1] || dialogMatch[2] || '').trim() : ''

  // Detectar estado de ánimo en corchetes, limpiando prefijos comunes
  const moodMatch = body.match(/\[([^\]]+)\]/)
  let rawMood = moodMatch ? (moodMatch[1] || '').trim() : ''
  rawMood = rawMood.replace(/^estado\s*de\s*ánimo\s*:\s*/i, '').trim()

  // Función para compactar texto a una sola línea, sin duplicar espacios
  const compact = (s: string) => s.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim()

  // Enriquecedor de diálogo cuando es demasiado corto o solo nombra al usuario
  const shouldEnrichDialog = (d: string) => {
    if (!d) return true
    if (d.length < 15) return true
    const uname = (userName || '').trim()
    if (uname && new RegExp(`^@?${uname}$`, 'i').test(d)) return true
    if (uname && new RegExp(`^hola[, ]*${uname}$`, 'i').test(d)) return true
    return false
  }
  // Constructor de diálogo enriquecido SIN eco del usuario; se apoya en el último mensaje del asistente
  const buildRichDialogFromContext = (la?: string) => {
    const uname = (userName || '').trim()
    if (!la) {
      // Respuesta proactiva por defecto
      return uname ? `Te miro con deseo, ${uname}. Ven más cerca.` : 'Te miro con deseo. Ven más cerca.'
    }
    const cleaned = la
      .replace(/IMAGEN:[^\n]*/i, '')
      .replace(/["“”]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    const snippet = cleaned.slice(0, 120)
    if (!snippet) {
      return uname ? `Susurro junto a tu oído, ${uname}: quiero más de ti.` : 'Susurro junto a tu oído: quiero más de ti.'
    }
    // Continuación natural del último mensaje del asistente, sin repetir al usuario
    return uname
      ? `${snippet}... y ahora quiero más, ${uname}. Acércate.`
      : `${snippet}... y ahora quiero más. Acércate.`
  }

  const blocks: string[] = []
  if (rawAction) blocks.push(`*${compact(rawAction)}*`)
  let finalDialog = rawDialog
  if (shouldEnrichDialog(finalDialog)) {
    finalDialog = buildRichDialogFromContext(lastAssistant)
  }
  if (finalDialog) blocks.push(`"${compact(finalDialog)}"`)
  if (rawMood) blocks.push(`[${compact(rawMood)}]`)

  // Si no se detectó ninguno, usar el primer tramo del cuerpo como diálogo breve
  let singleBlock = ''
  if (blocks.length === 0) {
    const snippet = compact(body).slice(0, 220)
    if (snippet.length > 0) {
      singleBlock = `"${snippet}"`
    }
  } else {
    singleBlock = blocks.join('\n')
  }

  // Reconstruir con IMAGEN si existía
  const resultLines: string[] = []
  if (singleBlock) resultLines.push(singleBlock)
  if (imagenLine) resultLines.push(imagenLine)
  return resultLines.join('\n')
}

// Extrae el último intercambio de la conversación (último mensaje del usuario y del asistente)
function extractLastExchange(history: { role: string; content: string }[]): { lastUser?: string; lastAssistant?: string } {
  let lastUser: string | undefined
  let lastAssistant: string | undefined
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i]
    if (!lastAssistant && h.role === 'assistant' && h.content) lastAssistant = h.content
    if (!lastUser && h.role === 'user' && h.content) lastUser = h.content
    if (lastUser && lastAssistant) break
  }
  return { lastUser, lastAssistant }
}

// Construye una pista de contexto breve, en una sola línea, desde el último intercambio
function buildContextHintText(lastUser?: string, lastAssistant?: string): string {
  const base = (lastAssistant || lastUser || '').replace(/[\n\r]+/g, ' ').replace(/["\']+/g, '').trim()
  // recorta para mantenerlo manejable
  return base.slice(0, 300)
}

// Extrae rasgos básicos desde imagePromptMaster para apariencia del agente
function extractTraitsFromImagePromptMaster(master?: string): string[] {
  if (!master) return []
  const m = master.toLowerCase()
  const tokens: string[] = []
  const hairColors = ['blonde hair','brown hair','black hair','red hair','white hair','silver hair']
  const eyeColors = ['blue eyes','green eyes','brown eyes','hazel eyes','grey eyes']
  const accessories = ['glasses','earrings','necklace','bracelet','hat','hoodie','jacket']
  hairColors.forEach(h => { if (m.includes(h.split(' ')[0])) tokens.push(h) })
  eyeColors.forEach(e => { if (m.includes(e.split(' ')[0])) tokens.push(e) })
  accessories.forEach(a => { if (m.includes(a)) tokens.push(a) })
  return tokens
}

// Genera tags booru-style para IMAGEN desde el contexto del último intercambio
function buildFallbackImagenFromContext(
  params: { lastUser?: string; lastAssistant?: string; imagePromptMaster?: string; characterName?: string }
): string {
  const text = ((params.lastAssistant || '') + ' ' + (params.lastUser || '')).toLowerCase()
    .replace(/[\n\r]+/g, ' ')
    .replace(/["\']+/g, '')
    .replace(/[:.;]+/g, ' ')
    .trim()

  const tokens: string[] = []
  // Sujetos genéricos
  tokens.push('1person','solo','adult')

  // Ambiente/escena
  const envMap = ['street','room','bedroom','kitchen','office','forest','beach','city','night','sunset','rain','snow','park','balcony']
  envMap.forEach(e => { if (text.includes(e)) tokens.push(e) })

  // Acciones simples
  const actions = ['walking','sitting','running','posing','smiling','reading','typing','drinking','looking at camera']
  actions.forEach(a => { if (text.includes(a)) tokens.push(a) })

  // Ropa/accesorios
  const clothing = ['dress','skirt','jeans','jacket','hoodie','coat','t-shirt','shirt','blouse','sweater','boots','heels','sneakers','hat']
  clothing.forEach(c => { if (text.includes(c)) tokens.push(c) })

  // Rasgos físicos sencillos
  const hairColors = ['blonde hair','brown hair','black hair','red hair','white hair','silver hair']
  hairColors.forEach(h => { const k = h.split(' ')[0]; if (text.includes(k)) tokens.push(h) })
  const eyeColors = ['blue eyes','green eyes','brown eyes','hazel eyes','grey eyes']
  eyeColors.forEach(e => { const k = e.split(' ')[0]; if (text.includes(k)) tokens.push(e) })

  // Estilo visual
  tokens.push('cinematic lighting','high detail','hyperrealistic')

  // Añadir rasgos del imagePromptMaster si existen
  extractTraitsFromImagePromptMaster(params.imagePromptMaster).forEach(t => tokens.push(t))

  // Añadir el nombre del personaje si existe (permitido como excepción)
  if (params.characterName && params.characterName.trim().length > 0) {
    tokens.push(params.characterName.trim().toLowerCase())
  }

  // Deduplicar y comprimir tokens largos (máx 3 palabras)
  const seen = new Set<string>()
  const compact = tokens
    .map(t => t.trim())
    .filter(t => t.length > 0)
    .map(t => { const w = t.split(/\s+/); return w.length > 3 ? w.slice(0,3).join(' ') : t })
    .filter(t => { if (seen.has(t)) return false; seen.add(t); return true })

  return compact.join(', ')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    const messages = await db
      .select()
      .from(schema.chatMessages)
      .where(eq(schema.chatMessages.agentId, agentId))
      .orderBy(asc(schema.chatMessages.createdAt))

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json(
      { error: 'Error fetching chat messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, message } = body

    if (!agentId || !message) {
      return NextResponse.json(
        { error: 'Agent ID and message are required' },
        { status: 400 }
      )
    }

    // Get the agent details
    const agentRows = await db
      .select()
      .from(schema.agents)
      .where(eq(schema.agents.id, agentId))
      .limit(1)
    const agent = agentRows[0]

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Obtener sesión para inyectar el nombre real del usuario en el prompt
    const session = await auth.api.getSession({ headers: request.headers })
    const userName = session?.user?.name || undefined

    // Check if this is an initial greeting
    const isInitialGreeting = message === '__INITIAL_GREETING__'
    
    // Only save user message if it's not an initial greeting
    if (!isInitialGreeting) {
      await db.insert(schema.chatMessages).values({
        content: message,
        role: 'user',
        agentId,
      })
    }

    // Get conversation history (excluding initial greeting messages)
    const conversationHistoryFull = await db
      .select()
      .from(schema.chatMessages)
      .where(and(
        eq(schema.chatMessages.agentId, agentId),
        ne(schema.chatMessages.content, '__INITIAL_GREETING__')
      ))
      .orderBy(asc(schema.chatMessages.createdAt))

    // Limit context to the last 10 messages for efficiency
    const conversationHistory = conversationHistoryFull.slice(-10)

    // Build enhanced system prompt with agent info using prompt utilities
    let enhancedSystemPrompt = buildAgentSystemPrompt({
      name: agent.name,
      description: agent.description ?? null,
      systemPrompt: agent.systemPrompt,
      role: agent.role ?? null,
      tone: agent.tone ?? null,
      scenario: agent.scenario ?? null,
      enhancers: agent.enhancers ?? null,
      initialStory: agent.initialStory ?? null,
      imagePromptMaster: agent.imagePromptMaster ?? null,
      gender: agent.gender ?? null,
      appearancePrompt: agent.appearancePrompt ?? null,
      firstMessage: agent.firstMessage ?? null,
    }, userName)

    // Inyectar pista de contexto desde el último intercambio para orientar la escena
    const { lastUser, lastAssistant } = extractLastExchange(conversationHistory as unknown as { role: string; content: string }[])
    const contextHint = buildContextHintText(lastUser, lastAssistant)
    if (contextHint) {
      enhancedSystemPrompt = `${enhancedSystemPrompt}\n\nContexto conversacional (para escena e IMAGEN): ${contextHint}`
    }

    // Prepare messages for AI; ensure roles are valid union
    const messages: VeniceMessage[] = [
      {
        role: 'system',
        content: enhancedSystemPrompt,
      },
      ...conversationHistory.map((msg): VeniceMessage => ({
        role: (msg.role === 'user' || msg.role === 'assistant' ? msg.role : 'assistant'),
        content: msg.content,
      })),
    ]

    // If it's an initial greeting, add a user message that prompts narrative start
    if (isInitialGreeting) {
      // Avoid sending initial greeting if there are existing messages
      if (conversationHistoryFull.length > 0) {
        return NextResponse.json({ response: 'Greeting skipped due to existing messages.' })
      }
      messages.push({
        role: 'user',
        content: buildInitialUserInstruction(agent.name, agent.initialStory ?? null, userName),
      })
    }

    // Obtener respuesta de IA usando Venice AI
    try {
      const apiKey = process.env.VENICE_API_KEY
      if (!apiKey) {
        throw new Error('VENICE_API_KEY is not configured')
      }

      const res = await fetch('https://api.venice.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.VENICE_MODEL || 'venice-uncensored',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
          stream: false,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Venice API error ${res.status}: ${text}`)
      }

      const completion = await res.json()

      let aiResponse = completion?.choices?.[0]?.message?.content

      if (!aiResponse) {
        throw new Error('No response from AI')
      }

      // Post-proceso: compactar a un único bloque de rolplay con saltos de línea y diálogo enriquecido (anti-eco)
      aiResponse = compressRoleplayToSingleBlock(aiResponse, userName, lastUser, lastAssistant)

      // Ensure IMAGEN line exists; if missing, append a sensible fallback in English
      const hasImageLine = /(^|\n)IMAGEN:\s*/.test(aiResponse)
      if (!hasImageLine) {
        const fallbackTags = buildFallbackImagenFromContext({ lastUser, lastAssistant, imagePromptMaster: agent.imagePromptMaster ?? undefined, characterName: agent.characterName ?? undefined })
        aiResponse = `${aiResponse}\nIMAGEN: ${fallbackTags}`
      }

      // Alinear IMAGEN con la acción del bloque, fortaleciendo coherencia y sugerencia sexual
      aiResponse = alignImagenWithAction(aiResponse, agent.imagePromptMaster ?? undefined, agent.characterName ?? undefined)

      // Post-proceso: sanitizar línea IMAGEN para cumplir reglas (sin nombres, sin términos prohibidos, <=100 palabras)
      aiResponse = sanitizeImagenLine(aiResponse, agent.name, userName, agent.characterName ?? undefined)

      // Save AI response
      await db.insert(schema.chatMessages).values({
        content: aiResponse,
        role: 'assistant',
        agentId,
      })

      return NextResponse.json({
        response: aiResponse,
        messageId: completion?.id ?? undefined,
      })

    } catch (aiError) {
      console.error('Error getting AI response:', aiError)
      
      // Save error message
      const errorMessage = 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo.'
      await db.insert(schema.chatMessages).values({
        content: errorMessage,
        role: 'assistant',
        agentId,
      })

      return NextResponse.json({
        response: errorMessage,
        error: 'AI service error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in chat:', error)
    return NextResponse.json(
      { error: 'Error processing chat message' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId, newImagePrompt } = body || {}

    if (!messageId || typeof newImagePrompt !== 'string') {
      return NextResponse.json(
        { error: 'messageId y newImagePrompt son requeridos' },
        { status: 400 }
      )
    }

    // Obtener el mensaje actual
    const rows = await db
      .select()
      .from(schema.chatMessages)
      .where(eq(schema.chatMessages.id, messageId))
      .limit(1)

    const messageRow = rows[0]

    if (!messageRow) {
      return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 })
    }

    if (messageRow.role !== 'assistant') {
      return NextResponse.json({ error: 'Solo se pueden editar mensajes del agente' }, { status: 400 })
    }

    // Obtener datos del agente para sanitización
    const agentRows = await db
      .select()
      .from(schema.agents)
      .where(eq(schema.agents.id, messageRow.agentId))
      .limit(1)
    const agent = agentRows[0]

    if (!agent) {
      return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 })
    }

    // Obtener sesión para capturar nombre del usuario (si aplica en sanitización)
    const session = await auth.api.getSession({ headers: request.headers })
    const userName = session?.user?.name || undefined

    // Construir nuevo contenido con IMAGEN reemplazado/añadido (sin alineación automática)
    const currentText: string = messageRow.content
    const trimmedPrompt = (newImagePrompt || '').trim()
    const imagenLine = `IMAGEN: ${trimmedPrompt}`
    const imagenRegex = /(^|\n)IMAGEN:\s*[^\n]*/i

    let updatedText = ''
    if (imagenRegex.test(currentText)) {
      updatedText = currentText.replace(imagenRegex, (match) => {
        const prefix = match.startsWith('\n') ? '\n' : ''
        return `${prefix}${imagenLine}`
      })
    } else {
      updatedText = `${currentText}\n${imagenLine}`
    }

    // Sanitizar la línea IMAGEN para cumplir reglas (sin nombres, sin términos prohibidos, límite palabras)
    const sanitized = sanitizeImagenLine(updatedText, agent.name, userName, agent.characterName ?? undefined)

    await db
      .update(schema.chatMessages)
      .set({ content: sanitized })
      .where(eq(schema.chatMessages.id, messageId))

    return NextResponse.json({ id: messageId, content: sanitized, role: 'assistant', agentId: messageRow.agentId })
  } catch (error) {
    console.error('Error editando mensaje:', error)
    return NextResponse.json({ error: 'Error editando mensaje' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    await db.delete(schema.chatMessages).where(eq(schema.chatMessages.agentId, agentId))

    return NextResponse.json({ message: 'Chat history cleared successfully' })
  } catch (error) {
    console.error('Error clearing chat history:', error)
    return NextResponse.json(
      { error: 'Error clearing chat history' },
      { status: 500 }
    )
  }
}