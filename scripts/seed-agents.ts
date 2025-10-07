import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { db, schema } from '../src/db'
import { randomUUID } from 'crypto'
import { getAvailableRoles, getAvailableTones, getAvailableScenarios, getAvailableEnhancers, buildAgentPrompt } from '../src/lib/prompts'
import { IMAGE_STYLES } from '../src/lib/image-styles'
import { eq } from 'drizzle-orm'

type Character = {
  name: string
  description?: string
  slug?: string
  shareUrl?: string
  photoUrl?: string
  createdAt?: string
  updatedAt?: string
  adult?: boolean
  modelId?: string
  webEnabled?: boolean
  stats?: Record<string, any>
  tags?: string[]
}

function pickByHeuristics(tags: string[] | undefined) {
  const tagSet = new Set((tags ?? []).map(t => t.toLowerCase()))

  // Role
  let role: keyof ReturnType<typeof getAvailableRoles> | string | null = null
  const roleMap: Record<string, string> = {
    dominante: 'dominant', dominatrix: 'dominant', alpha: 'dominant',
    sumiso: 'submissive', obediente: 'submissive',
    switch: 'switch', versatil: 'switch',
    romantico: 'romantic', romance: 'romantic',
    jugueton: 'playful', coqueto: 'playful',
    misterioso: 'mysterious', enigmatico: 'mysterious',
    profesional: 'professional', ejecutiva: 'professional', jefe: 'professional',
    salvaje: 'wild', intenso: 'wild'
  }
  for (const [k, v] of Object.entries(roleMap)) {
    if (tagSet.has(k)) { role = v; break }
  }
  if (!role) role = 'playful'

  // Tone
  let tone: keyof ReturnType<typeof getAvailableTones> | string | null = null
  const toneMap: Record<string, string> = {
    suave: 'gentle', tierno: 'gentle',
    rudo: 'rough', directo: 'rough',
    coqueto: 'teasing', provocador: 'teasing',
    imperativo: 'commanding', dominante: 'commanding',
    suplicante: 'pleading', sumiso: 'pleading',
    intelectual: 'intellectual', sofisticado: 'intellectual',
    primal: 'primal', animal: 'primal',
    poetico: 'poetic', lirico: 'poetic'
  }
  for (const [k, v] of Object.entries(toneMap)) {
    if (tagSet.has(k)) { tone = v; break }
  }
  if (!tone) tone = 'teasing'

  // Scenario
  let scenario: keyof ReturnType<typeof getAvailableScenarios> | string | null = null
  const scenarioMap: Record<string, string> = {
    cita: 'modern_dating', date: 'modern_dating',
    oficina: 'professional_setting', trabajo: 'professional_setting', jefe: 'professional_setting',
    medieval: 'historical_setting', historia: 'historical_setting',
    fantasia: 'fantasy_world', magico: 'fantasy_world',
    prohibido: 'forbidden_encounter', secreto: 'forbidden_encounter',
    poder: 'power_dynamics', dominacion: 'power_dynamics',
    primer_encuentro: 'first_meeting'
  }
  for (const [k, v] of Object.entries(scenarioMap)) {
    if (tagSet.has(k)) { scenario = v; break }
  }
  if (!scenario) scenario = 'first_meeting'

  // Enhancers
  const enhancersAvailable = getAvailableEnhancers()
  const enhancerKeywords: Record<string, string> = {
    confianza: 'confidence', experiencia: 'experience', creativo: 'creativity', creatividad: 'creativity',
    intenso: 'intensity', detalle: 'detail', paciencia: 'patience', espontaneo: 'spontaneity',
    misterio: 'mystery', vulnerable: 'vulnerability'
  }
  const enhancers: string[] = []
  for (const [k, v] of Object.entries(enhancerKeywords)) {
    if (tagSet.has(k) && enhancersAvailable.includes(v as any)) {
      enhancers.push(v)
    }
  }
  if (enhancers.length === 0) enhancers.push('confidence', 'creativity', 'intensity')

  return { role, tone, scenario, enhancers }
}

function pickImageStyle(tags: string[] | undefined): string {
  const styles = new Set(IMAGE_STYLES)
  const tagSet = new Set((tags ?? []).map(t => t.toLowerCase()))

  const candidates: { keywords: string[]; style: string }[] = [
    { keywords: ['anime', 'manga', 'waifu'], style: 'Anime' },
    { keywords: ['3d', 'modelado', 'render'], style: '3D Model' },
    { keywords: ['analog', 'retro', 'film'], style: 'Analog Film' },
    { keywords: ['cinematic', 'cine', 'movie'], style: 'Cinematic' },
    { keywords: ['digital', 'fantasia', 'fantasy'], style: 'Digital Art' },
    { keywords: ['comic', 'superhero'], style: 'Comic Book' },
    { keywords: ['cyberpunk', 'neon'], style: 'Cyberpunk' },
    { keywords: ['futuristic', 'sci-fi', 'space'], style: 'Futuristic' },
    { keywords: ['gothic', 'oscuro', 'dark'], style: 'Gothic' },
    { keywords: ['fashion', 'editorial', 'glamour'], style: 'Fashion' },
    { keywords: ['watercolor', 'acuarela'], style: 'Watercolor' },
    { keywords: ['line art', 'minimal'], style: 'Line Art' },
    { keywords: ['pop art'], style: 'Pop Art' },
    { keywords: ['surreal', 'dream'], style: 'Surrealism' },
    { keywords: ['noir'], style: 'Noir' },
    { keywords: ['vaporwave', 'synthwave'], style: 'Vaporwave' },
    { keywords: ['realistic', 'photo', 'photoreal'], style: 'Photorealistic' },
    { keywords: ['fantasia', 'fantasy'], style: 'Fantasy' },
  ]

  for (const { keywords, style } of candidates) {
    if (keywords.some(k => tagSet.has(k)) && styles.has(style)) {
      return style
    }
  }

  // Fallback
  return styles.has('Digital Art') ? 'Digital Art' : IMAGE_STYLES[0]
}

async function main() {
  const jsonPath = path.resolve('examples', 'api-characters.json')
  const raw = await fs.readFile(jsonPath, 'utf-8')
  const parsed = JSON.parse(raw)
  const characters: Character[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.data)
      ? parsed.data
      : []

  const roles = getAvailableRoles()
  const tones = getAvailableTones()
  const scenarios = getAvailableScenarios()

  console.log(`Seed: ${characters.length} personajes encontrados`)

  for (const ch of characters) {
    const name = ch.name?.trim() || 'Sin nombre'
    const description = (ch.description || '').trim()
    const photoUrl = ch.photoUrl || null
    const { role, tone, scenario, enhancers } = pickByHeuristics(ch.tags)
    const imageStyle = pickImageStyle(ch.tags)

    const roleKey = roles.includes(role as any) ? (role as any) : 'playful'
    const toneKey = tones.includes(tone as any) ? (tone as any) : 'teasing'
    const scenarioKey = scenarios.includes(scenario as any) ? (scenario as any) : 'first_meeting'

    const systemPrompt = buildAgentPrompt(
      name,
      description || `Agente ${name} generado automáticamente a partir de catálogo.`,
      'Sigue tu personalidad y crea una experiencia inmersiva.',
      roleKey,
      toneKey,
      scenarioKey,
      enhancers,
      imageStyle
    )

    const existing = await db
      .select()
      .from(schema.agents)
      .where(eq(schema.agents.name, name))
      .limit(1)

    if (existing.length > 0) {
      console.log(`↷ Saltando existente: ${name}`)
      continue
    }

    const id = randomUUID()
    const inserted = await db
      .insert(schema.agents)
      .values({
        id,
        name,
        description: description || null,
        systemPrompt,
        role: roleKey,
        tone: toneKey,
        scenario: scenarioKey,
        enhancers: enhancers.join(', '),
        imageStyle,
        photoUrl,
        imagePromptMaster: null,
        initialStory: `El usuario inicia conversación con ${name}.`,
      })
      .returning()

    console.log(`✓ Insertado: ${name} (${inserted[0]?.id})`)
  }

  console.log('Seed completado.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed falló:', err)
  process.exit(1)
})