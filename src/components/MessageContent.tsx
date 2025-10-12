'use client'

import React, { useMemo, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Image as ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { CommandDialog, Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
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

interface MessageContentProps {
  content: string
  isAgent: boolean
  agentId?: string
  messageId?: string
  onRefresh?: () => void | Promise<void>
}

const SINKIN_MODELS = [
  { id: 'JWknjgr', name: 'Hassaku XL' },
  { id: 'yBG2r9O', name: 'majicMIX' },
  { id: 'vln8Nwr', name: 'MeinaMix' },
  { id: 'PREaKGN', name: 'MeinaUnreal' },
  { id: 'gLv9zeq', name: 'RealCartoon3D' },
  { id: '76EmEaz', name: 'Hassaku' },
  { id: 'xylZzvg', name: 'MeinaPastel' },
  { id: 'k4kW669', name: 'AniMerge' },
  { id: 'MRm5kNX', name: 'majicMIX sombre' },
  { id: 'jxD9Xxe', name: 'RealCartoon-Realistic' },
  { id: 'vl5nZmX', name: 'Animagine XL' },
]

export function MessageContent({ content, isAgent, agentId, messageId, onRefresh }: MessageContentProps) {
  const [selectedModel, setSelectedModel] = useState('JWknjgr')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [isImageExpanded, setIsImageExpanded] = useState(false)
  const [isEditingPrompt, setIsEditingPrompt] = useState(false)
  const [editedPrompt, setEditedPrompt] = useState('')
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)

  // Utilidades de prompt y etiquetas
  const parsePromptTokens = useCallback((value: string) => {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }, [])

  const selectedTags = useMemo(() => {
    const tokens = parsePromptTokens(editedPrompt || cleanPrompt || '')
    return tokens.filter((t) => TAG_LIST.includes(t))
  }, [editedPrompt, cleanPrompt, parsePromptTokens])

  const isTagSelected = useCallback(
    (tag: string) => selectedTags.includes(tag),
    [selectedTags]
  )

  const addTagToEditedPrompt = useCallback(
    (tag: string) => {
      const current = parsePromptTokens(editedPrompt || '')
      if (!current.includes(tag)) {
        const next = [...current, tag].join(', ')
        setEditedPrompt(next)
      }
    },
    [editedPrompt, setEditedPrompt, parsePromptTokens]
  )

  const removeTagFromEditedPrompt = useCallback(
    (tag: string) => {
      const current = parsePromptTokens(editedPrompt || '')
      const next = current.filter((t) => t !== tag).join(', ')
      setEditedPrompt(next)
    },
    [editedPrompt, setEditedPrompt, parsePromptTokens]
  )

  const clearAllTagsFromEditedPrompt = useCallback(() => {
    const current = parsePromptTokens(editedPrompt || '')
    const next = current.filter((t) => !TAG_LIST.includes(t)).join(', ')
    setEditedPrompt(next)
  }, [editedPrompt, setEditedPrompt, parsePromptTokens])

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

  // Renderizador de contenido formateado por líneas:
  // *Acciones* -> estilo de pensamiento (italics, fondo sutil)
  // "Diálogos" -> principal, más grande y en bold
  // [Estado de ánimo] -> badge/pill descriptivo
  const renderFormattedContent = (text: string) => {
    const lines = text.split(/\n+/).filter((l) => l.trim().length > 0)
    return (
      <div className="space-y-2">
        {lines.map((line, idx) => {
          const t = line.trim()
          if (/^\*[\s\S]*\*$/.test(t)) {
            const inner = t.slice(1, -1).trim()
            return (
              <div
                key={idx}
                className="italic text-sm text-muted-foreground bg-muted rounded-md p-3 border border-border"
              >
                {inner}
              </div>
            )
          }
          if (/^"[\s\S]*"$/.test(t)) {
            const inner = t.slice(1, -1).trim()
            return (
              <p key={idx} className="text-base md:text-lg text-foreground">
                {inner}
              </p>
            )
          }
          if (/^\[[\s\S]*\]$/.test(t)) {
            const inner = t.slice(1, -1).trim()
            return (
              <Badge key={idx} variant="secondary" className="text-xs">
                {inner}
              </Badge>
            )
          }
          return (
            <p key={idx} className="text-sm whitespace-pre-wrap">
              {line}
            </p>
          )
        })}
      </div>
    )
  }

  // Si no es un mensaje del agente, renderizar normalmente
  if (!isAgent) {
    return <p className="text-sm whitespace-pre-wrap">{content}</p>
  }

  // Detectar si el mensaje contiene una URL de imagen guardada
  const imageUrlMatch = content.match(/IMAGEN_URL:\s*(https?:\/\/\S+)/i)

  // Buscar el bloque IMAGEN en el contenido (prompt)
  const imagenMatch = content.match(/([\s\S]*?)(\nIMAGEN:\s*)([\s\S]*)/)
  
  // Si hay una imagen guardada en el mensaje, mostrar tarjeta con botón de mostrar/ocultar
  if (imageUrlMatch) {
    const imageUrl = imageUrlMatch[1]
    return (
      <Card className="bg-muted border border-border">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Imagen generada</span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setIsImageExpanded((v) => !v)}
              >
                {isImageExpanded ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>
            {isImageExpanded && (
              <div className="pt-1">
                <img
                  src={imageUrl}
                  alt="Imagen generada"
                  className="max-w-full h-auto rounded-lg shadow-sm"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!imagenMatch) {
    // No hay bloque IMAGEN ni URL, renderizar con formato
    return renderFormattedContent(content)
  }

  const [, beforeImagen, imagenLabel, imagePrompt] = imagenMatch
  const cleanPrompt = imagePrompt.trim()
  const canEditPrompt = Boolean(isAgent && messageId)

  const openEditPrompt = () => {
    setEditedPrompt(cleanPrompt)
    setIsEditingPrompt(true)
    setIsImageExpanded(true)
  }

  const saveEditedPrompt = async () => {
    const newPrompt = editedPrompt.trim()
    if (!newPrompt || !canEditPrompt || !messageId) {
      toast.error('No se puede guardar: faltan datos')
      return
    }
    try {
      const resp = await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, newImagePrompt: newPrompt }),
      })
      if (resp.ok) {
        toast.success('Prompt IMAGEN actualizado')
        setIsEditingPrompt(false)
        if (onRefresh) {
          await onRefresh()
        }
      } else {
        const err = await resp.json().catch(() => ({}))
        toast.error(`Error al guardar: ${err.error || 'Error desconocido'}`)
      }
    } catch (e) {
      toast.error('Error de red al guardar el prompt')
    }
  }

  const handleGenerateImage = async () => {
    if (!cleanPrompt || isGenerating) return

    setIsGenerating(true)
    setGeneratedImageUrl(null)

    try {
      const formData = new FormData()
      formData.append('prompt', cleanPrompt)
      formData.append('model_id', selectedModel)
      formData.append('width', '1024')
      formData.append('height', '1024')
      // Pasar agentId para que el backend guarde el mensaje de imagen
      if (typeof agentId === 'string' && agentId.trim().length > 0) {
        formData.append('agentId', agentId)
      }

      const response = await fetch('/api/images', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        if (data.photoUrl) {
          setGeneratedImageUrl(data.photoUrl)
          toast.success('Imagen generada exitosamente')
        } else {
          toast.error('Error: No se recibió URL de imagen')
        }
      } else {
        const errorData = await response.json()
        toast.error(`Error al generar imagen: ${errorData.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error generating image:', error)
      toast.error('Error al generar imagen')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Contenido antes del bloque IMAGEN */}
      {beforeImagen.trim() && renderFormattedContent(beforeImagen.trim())}

      {/* Bloque IMAGEN con estilo especial y colapsable */}
      <Card className="bg-muted border border-border">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Encabezado con toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">IMAGEN</span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setIsImageExpanded((v) => !v)}
              >
                {isImageExpanded ? 'Ocultar' : 'Mostrar'}
              </Button>
              {canEditPrompt && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs ml-2"
                  onClick={openEditPrompt}
                >
                  Editar
                </Button>
              )}
            </div>

            {/* Contenido del bloque IMAGEN (prompt + controles) */}
            {isImageExpanded && (
              <>
                {!isEditingPrompt ? (
                  <div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{cleanPrompt}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Editar prompt IMAGEN</p>
                    <textarea
                      className="w-full h-24 text-xs p-2 border rounded-md bg-background"
                      value={editedPrompt}
                      onChange={(e) => setEditedPrompt(e.target.value)}
                    />
                    {/* Selector de etiquetas para IMAGEN */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Añade etiquetas desde listas o por búsqueda.</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsTagDialogOpen(true)}
                            className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                          >
                            Buscar y añadir etiquetas
                          </button>
                          <button
                            type="button"
                            onClick={clearAllTagsFromEditedPrompt}
                            className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                          >
                            Limpiar etiquetas
                          </button>
                        </div>
                      </div>

                      {/* Chips de etiquetas seleccionadas */}
                      {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedTags.map((tag) => (
                            <button
                              key={`imagen:${tag}`}
                              type="button"
                              onClick={() => removeTagFromEditedPrompt(tag)}
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
                          <AccordionItem key={`imagen:${cat.key}`} value={cat.key}>
                            <AccordionTrigger>{cat.label}</AccordionTrigger>
                            <AccordionContent>
                              <ScrollArea className="h-32">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pr-2">
                                  {cat.entries.map((entry) => {
                                    const active = isTagSelected(entry.tag)
                                    return (
                                      <button
                                        key={`imagen:${cat.key}:${entry.tag}`}
                                        type="button"
                                        onClick={() => (active ? removeTagFromEditedPrompt(entry.tag) : addTagToEditedPrompt(entry.tag))}
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
                    <div className="flex gap-2">
                      <Button size="sm" className="h-8 text-xs" onClick={saveEditedPrompt} disabled={!editedPrompt.trim()}>
                        Guardar
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setIsEditingPrompt(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-48 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SINKIN_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id} className="text-xs">
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    onClick={handleGenerateImage}
                    disabled={isGenerating || !cleanPrompt}
                    className="h-8 text-xs"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-3 w-3 mr-1" />
                        Generar Imagen
                      </>
                    )}
                  </Button>
                </div>

                {/* Imagen generada */}
                {generatedImageUrl && (
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Imagen generada</span>
                    </div>
                    <div className="pt-2">
                      <img
                        src={generatedImageUrl}
                        alt="Imagen generada"
                        className="max-w-full h-auto rounded-lg shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Diálogo de búsqueda de etiquetas para IMAGEN */}
      <CommandDialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen} title="Etiquetas" description="Busca y añade etiquetas al prompt IMAGEN">
        <Command>
          <CommandInput placeholder="Buscar etiquetas..." />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            {TAG_CATEGORIES.map((cat) => (
              <CommandGroup key={`imagen:${cat.key}`} heading={cat.label}>
                {cat.entries.map((entry) => (
                  <CommandItem
                    key={`imagen:${cat.key}:${entry.tag}`}
                    onSelect={() => addTagToEditedPrompt(entry.tag)}
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
  )
}