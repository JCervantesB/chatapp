'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CommandDialog, Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { PROMPT_TEMPLATES } from '@/lib/prompts'
import { CHARACTER_OPTIONS } from '@/lib/characters'
import type { TagEntry } from '@/lib/taglist'
import {
  TAGS_SUJETO_CONTEO,
  TAGS_APARIENCIA,
  TAGS_ROPA_Y_ACCESORIOS,
  TAGS_POSES_Y_ENCUADRE,
  TAGS_EXPRESIONES,
  TAGS_ENTORNO_ESCENARIO,
  TAGS_ILUMINACION_CAMARA,
  TAGS_COMPOSICION,
  TAGS_TIEMPO_CLIMA,
  TAGS_ESTILO_CALIDAD,
  TAGS_ACCIONES,
  TAGS_OBJETOS_UBICACION,
  TAGS_ORIENTACION_MIRADA,
  TAGS_EFECTOS_TECNICAS,
  TAGS_NSFW,
  TAGS_ALIASES,
  TAG_LIST,
} from '@/lib/taglist'

type FormData = {
  name: string
  description: string
  initialStory?: string
  firstMessage?: string
  systemPrompt: string
  role: string
  tone: string
  scenario: string
  enhancers: string[]
  imageStyle: string
  imagePromptMaster?: string
  photoUrl?: string
  sinkinModelId?: string
  appearancePrompt?: string
  gender?: string
  characterName?: string
}

interface AgentFormFieldsProps {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  isCustomImageStyle: boolean
  setIsCustomImageStyle: (val: boolean) => void
  presetImageStyles: string[]
  handleEnhancerChange: (enhancer: string, checked: boolean) => void
  fieldPrefix?: string
  onGenerateImage?: () => void
  isGeneratingImage?: boolean
}

export function AgentFormFields({
  formData,
  setFormData,
  isCustomImageStyle,
  setIsCustomImageStyle,
  presetImageStyles,
  handleEnhancerChange,
  fieldPrefix = ''
  ,
  onGenerateImage,
  isGeneratingImage = false
}: AgentFormFieldsProps) {
  const prefix = fieldPrefix ? `${fieldPrefix}-` : ''
  const [isGeneratingPrompt, setIsGeneratingPrompt] = React.useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = React.useState(false)
  const [isAppearanceTagDialogOpen, setIsAppearanceTagDialogOpen] = React.useState(false)

  // --- Etiquetas para Prompt Maestro de Imagen ---
  const parsePromptTokens = React.useCallback((value: string) => {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }, [])

  const selectedTags = React.useMemo(() => {
    const tokens = parsePromptTokens(formData.imagePromptMaster || '')
    return tokens.filter((t) => TAG_LIST.includes(t))
  }, [formData.imagePromptMaster, parsePromptTokens])

  const isTagSelected = React.useCallback(
    (tag: string) => selectedTags.includes(tag),
    [selectedTags]
  )

  const addTagToMasterPrompt = React.useCallback(
    (tag: string) => {
      const current = parsePromptTokens(formData.imagePromptMaster || '')
      if (!current.includes(tag)) {
        const next = [...current, tag].join(', ')
        setFormData({ ...formData, imagePromptMaster: next })
      }
    },
    [formData, setFormData, parsePromptTokens]
  )

  const removeTagFromMasterPrompt = React.useCallback(
    (tag: string) => {
      const current = parsePromptTokens(formData.imagePromptMaster || '')
      const next = current.filter((t) => t !== tag).join(', ')
      setFormData({ ...formData, imagePromptMaster: next })
    },
    [formData, setFormData, parsePromptTokens]
  )

  const clearAllTagsFromMasterPrompt = React.useCallback(() => {
    const current = parsePromptTokens(formData.imagePromptMaster || '')
    const next = current.filter((t) => !TAG_LIST.includes(t)).join(', ')
    setFormData({ ...formData, imagePromptMaster: next })
  }, [formData, setFormData, parsePromptTokens])

  // --- Etiquetas para Apariencia (appearancePrompt) ---
  const selectedAppearanceTags = React.useMemo(() => {
    const tokens = parsePromptTokens(formData.appearancePrompt || '')
    return tokens.filter((t) => TAG_LIST.includes(t))
  }, [formData.appearancePrompt, parsePromptTokens])

  const isAppearanceTagSelected = React.useCallback(
    (tag: string) => selectedAppearanceTags.includes(tag),
    [selectedAppearanceTags]
  )

  const addTagToAppearancePrompt = React.useCallback(
    (tag: string) => {
      const current = parsePromptTokens(formData.appearancePrompt || '')
      if (!current.includes(tag)) {
        const next = [...current, tag].join(', ')
        setFormData({ ...formData, appearancePrompt: next })
      }
    },
    [formData, setFormData, parsePromptTokens]
  )

  const removeTagFromAppearancePrompt = React.useCallback(
    (tag: string) => {
      const current = parsePromptTokens(formData.appearancePrompt || '')
      const next = current.filter((t) => t !== tag).join(', ')
      setFormData({ ...formData, appearancePrompt: next })
    },
    [formData, setFormData, parsePromptTokens]
  )

  const clearAllTagsFromAppearancePrompt = React.useCallback(() => {
    const current = parsePromptTokens(formData.appearancePrompt || '')
    const next = current.filter((t) => !TAG_LIST.includes(t)).join(', ')
    setFormData({ ...formData, appearancePrompt: next })
  }, [formData, setFormData, parsePromptTokens])

  const TAG_CATEGORIES: { key: string; label: string; entries: TagEntry[] }[] = [
    { key: 'subject', label: 'Sujeto / Conteo', entries: TAGS_SUJETO_CONTEO },
    { key: 'appearance', label: 'Apariencia', entries: TAGS_APARIENCIA },
    { key: 'clothing', label: 'Ropa y accesorios', entries: TAGS_ROPA_Y_ACCESORIOS },
    { key: 'poses', label: 'Poses y encuadre', entries: TAGS_POSES_Y_ENCUADRE },
    { key: 'expressions', label: 'Expresiones', entries: TAGS_EXPRESIONES },
    { key: 'environment', label: 'Entorno / escenario', entries: TAGS_ENTORNO_ESCENARIO },
    { key: 'lighting', label: 'Iluminación / cámara', entries: TAGS_ILUMINACION_CAMARA },
    { key: 'composition', label: 'Composición', entries: TAGS_COMPOSICION },
    { key: 'time', label: 'Tiempo / clima', entries: TAGS_TIEMPO_CLIMA },
    { key: 'style', label: 'Estilo / calidad', entries: TAGS_ESTILO_CALIDAD },
    { key: 'actions', label: 'Acciones', entries: TAGS_ACCIONES },
    { key: 'objects', label: 'Objetos / ubicación', entries: TAGS_OBJETOS_UBICACION },
    { key: 'orientation', label: 'Orientación / mirada', entries: TAGS_ORIENTACION_MIRADA },
    { key: 'effects', label: 'Efectos / técnicas', entries: TAGS_EFECTOS_TECNICAS },
    { key: 'nsfw', label: 'NSFW / contenido explícito', entries: TAGS_NSFW },
    { key: 'aliases', label: 'Alias (compatibilidad)', entries: TAGS_ALIASES },
  ]

  async function handleGeneratePrompt() {
    try {
      setIsGeneratingPrompt(true)
      const payload: Record<string, any> = {
        description: formData.description,
        name: formData.name,
      }
      if (formData.scenario && formData.scenario !== 'none') {
        payload.scenario = formData.scenario
      }
      if (formData.imageStyle) {
        payload.imageStyle = formData.imageStyle
      }

      const res = await fetch('/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Error ${res.status}: ${errText}`)
      }
      const data = await res.json()
      if (data?.prompt) {
        setFormData({ ...formData, imagePromptMaster: data.prompt })
      }
    } catch (err) {
      console.error('AI Generate prompt failed:', err)
      alert('No se pudo generar el prompt automáticamente. Revisa la consola para más detalles.')
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  return (
    <Tabs defaultValue="perfil" className="w-full">
      <TabsList>
        <TabsTrigger value="perfil">Perfil</TabsTrigger>
        <TabsTrigger value="apariencia">Apariencia y Configuración</TabsTrigger>
      </TabsList>

      <TabsContent value="perfil" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}name`}>Nombre</Label>
          <Input
            id={`${prefix}name`}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Alexa, Mistress Sophia, etc."
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${prefix}gender`}>Género del personaje</Label>
          <Select value={formData.gender || ''} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona género" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Hombre</SelectItem>
              <SelectItem value="female">Mujer</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${prefix}characterName`}>Personaje (opcional)</Label>
          <Select value={formData.characterName || ''} onValueChange={(value) => setFormData({ ...formData, characterName: value === 'none' ? '' : value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un personaje (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Ninguno</SelectItem>
              {CHARACTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${prefix}description`}>Descripción del Personaje</Label>
          <Textarea
            id={`${prefix}description`}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe la apariencia, personalidad y trasfondo del personaje..."
            rows={2}
            className="resize-y max-h-40 overflow-y-auto"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${prefix}appearancePrompt`}>Apariencia (prompt descriptivo)</Label>
          <Textarea
            id={`${prefix}appearancePrompt`}
            value={formData.appearancePrompt || ''}
            onChange={(e) => setFormData({ ...formData, appearancePrompt: e.target.value })}
            placeholder="Describe la apariencia del personaje: rasgos, vestuario, estilo, detalles..."
            rows={3}
            className="resize-y max-h-48 overflow-y-auto"
          />
          {/* Selector de etiquetas para apariencia */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Añade etiquetas desde listas categorizadas o por búsqueda.</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAppearanceTagDialogOpen(true)}
                  className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                >
                  Buscar y añadir etiquetas
                </button>
                <button
                  type="button"
                  onClick={clearAllTagsFromAppearancePrompt}
                  className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                >
                  Limpiar etiquetas
                </button>
              </div>
            </div>

            {/* Chips de etiquetas seleccionadas */}
            {selectedAppearanceTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedAppearanceTags.map((tag) => (
                  <button
                    key={`appearance:${tag}`}
                    type="button"
                    onClick={() => removeTagFromAppearancePrompt(tag)}
                    className="rounded-full border px-2 py-1 text-xs bg-accent text-accent-foreground"
                    title={`Eliminar etiqueta: ${tag}`}
                  >
                    {tag} ✕
                  </button>
                ))}
              </div>
            )}

            {/* Listas categorizadas */}
            <Accordion type="single" collapsible>
              {TAG_CATEGORIES.map((cat) => (
                <AccordionItem key={`appearance:${cat.key}`} value={cat.key}>
                  <AccordionTrigger>{cat.label}</AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="h-32">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pr-2">
                        {cat.entries.map((entry) => {
                          const active = isAppearanceTagSelected(entry.tag)
                          return (
                            <button
                              key={`appearance:${cat.key}:${entry.tag}`}
                              type="button"
                              onClick={() => (active ? removeTagFromAppearancePrompt(entry.tag) : addTagToAppearancePrompt(entry.tag))}
                              className={
                                `rounded-full border px-2 py-1 text-xs text-left ${
                                  active ? 'bg-accent text-accent-foreground' : 'bg-background hover:bg-muted'
                                }`
                              }
                              title={entry.label}
                            >
                              {entry.label}
                            </button>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Diálogo de búsqueda de etiquetas */}
          <CommandDialog open={isAppearanceTagDialogOpen} onOpenChange={setIsAppearanceTagDialogOpen} title="Etiquetas" description="Busca y añade etiquetas a la apariencia">
            <Command>
              <CommandInput placeholder="Buscar etiquetas..." />
              <CommandList>
                <CommandEmpty>Sin resultados</CommandEmpty>
                {TAG_CATEGORIES.map((cat) => (
                  <CommandGroup key={`appearance:${cat.key}`} heading={cat.label}>
                    {cat.entries.map((entry) => (
                      <CommandItem
                        key={`appearance:${cat.key}:${entry.tag}`}
                        onSelect={() => addTagToAppearancePrompt(entry.tag)}
                      >
                        {entry.label}
                        <span className="text-muted-foreground ml-2 text-xs">{entry.tag}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </CommandDialog>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${prefix}systemPrompt`}>Instrucciones Específicas</Label>
          <Textarea
            id={`${prefix}systemPrompt`}
            value={formData.systemPrompt}
            onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
            placeholder="Instrucciones adicionales, preferencias específicas, kinks, límites, etc..."
            rows={4}
            className="resize-y max-h-60 overflow-y-auto"
            required
          />
        </div>
      </TabsContent>

      <TabsContent value="apariencia" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}imageStyle`}>Estilo Artístico de Imagen</Label>
          <Select
            value={isCustomImageStyle ? 'personalizado' : (formData.imageStyle || '')}
            onValueChange={(value) => {
              if (value === 'personalizado') {
                setIsCustomImageStyle(true)
                setFormData({ ...formData, imageStyle: formData.imageStyle || '' })
              } else {
                setIsCustomImageStyle(false)
                setFormData({ ...formData, imageStyle: value })
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un estilo artístico" />
            </SelectTrigger>
            <SelectContent>
              {presetImageStyles.map((style) => (
                <SelectItem key={style} value={style}>{style}</SelectItem>
              ))}
              <SelectItem value="personalizado">Personalizado…</SelectItem>
            </SelectContent>
          </Select>
          {isCustomImageStyle && (
            <Input
              id={`${prefix}imageStyleCustom`}
              value={formData.imageStyle}
              onChange={(e) => setFormData({ ...formData, imageStyle: e.target.value })}
              placeholder="Escribe un estilo: anime, manga, 3D, hiperrealista, cartoon, etc."
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}sinkinModelId`}>Modelo de Sinkin</Label>
            <Select
              value={formData.sinkinModelId || ''}
              onValueChange={(value) => setFormData({ ...formData, sinkinModelId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un modelo (por defecto Hassaku XL)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="JWknjgr">Hassaku XL</SelectItem>
                <SelectItem value="yBG2r9O">majicMIX</SelectItem>
                <SelectItem value="vln8Nwr">MeinaMix</SelectItem>
                <SelectItem value="PREaKGN">MeinaUnreal</SelectItem>
                <SelectItem value="gLv9zeq">RealCartoon3D</SelectItem>
                <SelectItem value="76EmEaz">Hassaku</SelectItem>
                <SelectItem value="xylZzvg">MeinaPastel</SelectItem>
                <SelectItem value="k4kW669">AniMerge</SelectItem>
                <SelectItem value="MRm5kNX">majicMIX sombre</SelectItem>
                <SelectItem value="jxD9Xxe">RealCartoon-Realistic</SelectItem>
                <SelectItem value="vl5nZmX">Animagine XL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGeneratePrompt}
              className="inline-flex items-center justify-center rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              disabled={isGeneratingPrompt}
              aria-label="AI Generate prompt for image"
            >
              {isGeneratingPrompt ? 'AI Generando…' : 'AI Generate'}
            </button>
            {onGenerateImage && (
              <button
                type="button"
                onClick={onGenerateImage}
                className="inline-flex items-center justify-center rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                disabled={isGeneratingImage}
              >
                {isGeneratingImage ? 'Generando…' : 'Generar Imagen'}
              </button>
            )}
            {formData.photoUrl && (
              <a
                href={formData.photoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary underline"
              >
                Ver Imagen
              </a>
            )}
          </div>
          {/* Prompt Maestro de Imagen antes de la imagen */}
          <div className="space-y-2">
            <Label htmlFor={`${prefix}imagePromptMaster`}>Prompt Maestro de Imagen</Label>
            <Textarea
              id={`${prefix}imagePromptMaster`}
              value={formData.imagePromptMaster || ''}
              onChange={(e) => setFormData({ ...formData, imagePromptMaster: e.target.value })}
              placeholder="Describe con detalle la imagen del personaje: rasgos, vestuario, iluminación, composición, estilo..."
              rows={3}
              className="resize-y max-h-48 overflow-y-auto"
            />
            {/* Selector de etiquetas para prompt de imagen */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Añade etiquetas desde listas categorizadas o por búsqueda.</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTagDialogOpen(true)}
                    className="inline-flex items-center justify-center rounded-md border bg-background px-3 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground"
                  >
                    Buscar y añadir etiquetas
                  </button>
                  <button
                    type="button"
                    onClick={clearAllTagsFromMasterPrompt}
                    className="inline-flex items-center justify-center rounded-md border bg-background px-3 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground"
                  >
                    Limpiar etiquetas
                  </button>
                </div>
              </div>

              {/* Etiquetas seleccionadas */}
              {selectedTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => removeTagFromMasterPrompt(tag)}
                      className="rounded-full border px-2 py-1 text-xs hover:bg-destructive hover:text-destructive-foreground"
                      title="Quitar etiqueta"
                    >
                      {tag} ×
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No hay etiquetas seleccionadas aún.</p>
              )}

              {/* Navegación por categorías */}
              <Accordion type="multiple" className="border rounded-md">
                {TAG_CATEGORIES.map((cat) => (
                  <AccordionItem key={cat.key} value={cat.key}>
                    <AccordionTrigger>{cat.label}</AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="h-32">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pr-2">
                          {cat.entries.map((entry) => {
                            const active = isTagSelected(entry.tag)
                            return (
                              <button
                                key={`${cat.key}:${entry.tag}`}
                                type="button"
                                onClick={() => (active ? removeTagFromMasterPrompt(entry.tag) : addTagToMasterPrompt(entry.tag))}
                                className={
                                  `rounded-full border px-2 py-1 text-xs text-left ${
                                    active ? 'bg-accent text-accent-foreground' : 'bg-background hover:bg-muted'
                                  }`
                                }
                                title={entry.label}
                              >
                                {entry.label}
                              </button>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Diálogo de búsqueda de etiquetas */}
            <CommandDialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen} title="Etiquetas" description="Busca y añade etiquetas al prompt">
              <Command>
                <CommandInput placeholder="Buscar etiquetas..." />
                <CommandList>
                  <CommandEmpty>Sin resultados</CommandEmpty>
                  {TAG_CATEGORIES.map((cat) => (
                    <CommandGroup key={cat.key} heading={cat.label}>
                      {cat.entries.map((entry) => (
                        <CommandItem
                          key={`${cat.key}:${entry.tag}`}
                          onSelect={() => addTagToMasterPrompt(entry.tag)}
                        >
                          {entry.label}
                          <span className="text-muted-foreground ml-2 text-xs">{entry.tag}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </CommandDialog>
          </div>
          {formData.photoUrl && (
            <div className="mt-2">
              <img
                src={formData.photoUrl}
                alt={`Imagen de ${formData.name}`}
                className="max-h-48 w-auto rounded-md border"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${prefix}initialStory`}>Historia inicial</Label>
          <Textarea
            id={`${prefix}initialStory`}
            value={formData.initialStory || ''}
            onChange={(e) => setFormData({ ...formData, initialStory: e.target.value })}
            placeholder="Escribe una escena inicial breve que el agente utilizará para comenzar la narrativa."
            rows={3}
            className="resize-y max-h-48 overflow-y-auto"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${prefix}firstMessage`}>Primer mensaje (escena y primera frase)</Label>
          <Textarea
            id={`${prefix}firstMessage`}
            value={formData.firstMessage || ''}
            onChange={(e) => setFormData({ ...formData, firstMessage: e.target.value })}
            placeholder="Escribe el primer mensaje del personaje, iniciando la escena con su primera frase."
            rows={3}
            className="resize-y max-h-48 overflow-y-auto"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${prefix}role`}>Rol Principal</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un rol" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROMPT_TEMPLATES.roles).map(([key, role]) => (
                <SelectItem key={key} value={key}>
                  {role.name} - {role.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${prefix}tone`}>Tono de Comunicación</Label>
          <Select value={formData.tone} onValueChange={(value) => setFormData({ ...formData, tone: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un tono" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROMPT_TEMPLATES.tones).map(([key, tone]) => (
                <SelectItem key={key} value={key}>
                  {tone.name} - {tone.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${prefix}scenario`}>Escenario Sugerido</Label>
          <Select value={formData.scenario} onValueChange={(value) => setFormData({ ...formData, scenario: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un escenario (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Ninguno</SelectItem>
              {Object.entries(PROMPT_TEMPLATES.scenarios).map(([key, scenario]) => (
                <SelectItem key={key} value={key}>
                  {scenario}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Mejoradores de Personalidad</Label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PROMPT_TEMPLATES.enhancers).map(([key, enhancer]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`${prefix}enhancer-${key}`}
                  checked={formData.enhancers.includes(key)}
                  onCheckedChange={(checked) => handleEnhancerChange(key, checked as boolean)}
                />
                <Label htmlFor={`${prefix}enhancer-${key}`} className="text-sm">
                  {enhancer}
                </Label>
              </div>
            ))}
          </div>
        </div>

      </TabsContent>
    </Tabs>
  )
}