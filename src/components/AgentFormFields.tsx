'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { PROMPT_TEMPLATES } from '@/lib/prompts'

type FormData = {
  name: string
  description: string
  initialStory?: string
  systemPrompt: string
  role: string
  tone: string
  scenario: string
  enhancers: string[]
  imageStyle: string
  imagePromptMaster?: string
  photoUrl?: string
  sinkinModelId?: string
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
    <>
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

      {/* Imagen del personaje: Prompt maestro y generación */}
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
        {formData.photoUrl && (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={formData.photoUrl}
              alt={`Imagen de ${formData.name}`}
              className="max-h-48 w-auto rounded-md border"
            />
          </div>
        )}
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
    </>
  )
}