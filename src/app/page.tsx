"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, getSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { NameCaptureDialog } from '@/components/NameCaptureDialog'
import { toast } from 'sonner'
import { 
  PROMPT_TEMPLATES, 
  buildAgentPrompt, 
  normalizeEnhancers,
} from '@/lib/prompts'
import { AgentFormFields } from '@/components/AgentFormFields'
import { AgentsGrid } from '@/components/AgentsGrid'
import { IMAGE_STYLES } from '@/lib/image-styles'

interface Agent {
  id: string
  name: string
  createdAt: string
}

// Tipo local alineado con AgentFormFields.FormData
type AgentFormState = {
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

export default function Home() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [currentUserName, setCurrentUserName] = useState('')
  
  // Form state
  const [formData, setFormData] = useState<AgentFormState>({
    name: '',
    description: '',
    initialStory: '',
    firstMessage: '',
    systemPrompt: '',
    role: '',
    tone: '',
    scenario: '',
    enhancers: [] as string[],
    imageStyle: '',
    imagePromptMaster: '',
    photoUrl: '',
    appearancePrompt: '',
    gender: '',
    characterName: ''
  })
  const [isCustomImageStyle, setIsCustomImageStyle] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const presetImageStyles = IMAGE_STYLES

  useEffect(() => {
    // Guard: si no hay sesión, enviar a /auth
    if (!isPending && !session) {
      router.replace('/auth')
      return
    }

    if (!isPending && session) {
      fetchAgents()
      const userName = (session.user?.name ?? '').trim()
      // Debug: mostrar el nombre del usuario proveniente de la sesión
      console.log('[Home] session.user.name:', session?.user?.name, '| trimmed:', userName)
      setCurrentUserName(userName)
      if (userName.length < 2) {
        setIsNameDialogOpen(true)
      }
    }
  }, [isPending, session])

  // Debug adicional: consultar el usuario en BD y mostrar el nombre
  useEffect(() => {
    if (!isPending && session) {
      fetch('/api/user', { credentials: 'include', cache: 'no-store' })
        .then(async (res) => {
          if (!res.ok) {
            const status = res.status
            let data: any = null
            try { data = await res.json() } catch {}
            console.log('[Home] /api/user GET failed:', { status, data })
            return Promise.reject(status)
          }
          return res.json()
        })
        .then((data) => {
          console.log('[Home] /api/user ->', { id: data?.id, email: data?.email, name: data?.name })
          const fallback = (session?.user?.name ?? '').trim()
          const dbName = (data?.name ?? '').trim()
          setCurrentUserName(dbName || fallback)
        })
        .catch((err) => {
          console.log('[Home] /api/user error:', err)
        })
    }
  }, [isPending, session])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents')
      if (response.ok) {
        const data = await response.json()
        setAgents(data)
      }
    } catch (error) {
      toast.error('Error al cargar los agentes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Build enhanced system prompt using the new prompt system
      const enhancedPrompt = buildAgentPrompt(
        formData.name,
        formData.description,
        formData.systemPrompt,
        formData.role as keyof typeof PROMPT_TEMPLATES.roles || undefined,
        formData.tone as keyof typeof PROMPT_TEMPLATES.tones || undefined,
        formData.scenario as keyof typeof PROMPT_TEMPLATES.scenarios || undefined,
        formData.enhancers,
        formData.imageStyle
      )

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          initialStory: (formData.initialStory || '').trim() || null,
          firstMessage: (formData.firstMessage || '').trim() || null,
          systemPrompt: enhancedPrompt,
          role: formData.role || null,
          tone: formData.tone || null,
          scenario: formData.scenario === 'none' ? null : formData.scenario || null,
          enhancers: formData.enhancers.length > 0 ? JSON.stringify(formData.enhancers) : null,
          imageStyle: (formData.imageStyle || '').trim() || null,
          imagePromptMaster: (formData.imagePromptMaster || '').trim() || null,
          photoUrl: (formData.photoUrl || '').trim() || null,
          appearancePrompt: (formData.appearancePrompt || '').trim() || null,
          gender: (formData.gender || '').trim() || null,
          characterName: (formData.characterName || '').trim() || null,
        }),
      })

      if (response.ok) {
        toast.success('Agente creado exitosamente')
        setIsCreateDialogOpen(false)
        setFormData({
          name: '',
          description: '',
          initialStory: '',
          firstMessage: '',
          systemPrompt: '',
          role: '',
          tone: '',
          scenario: '',
          enhancers: [],
          imageStyle: '',
          imagePromptMaster: '',
          photoUrl: '',
          appearancePrompt: '',
          gender: '',
          characterName: ''
        })
        fetchAgents()
      } else {
        toast.error('Error al crear el agente')
      }
    } catch (error) {
      toast.error('Error al crear el agente')
    }
  }

  const handleDeleteAgent = async (id: string) => {
    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Agente eliminado exitosamente')
        fetchAgents()
      } else {
        toast.error('Error al eliminar el agente')
      }
    } catch (error) {
      toast.error('Error al eliminar el agente')
    }
  }

  const handleSaveName = async () => {
    const val = nameInput.trim()
    if (val.length < 2 || val.length > 50) {
      toast.error('El nombre debe tener entre 2 y 50 caracteres')
      return
    }

    try {
      const userId = session?.user?.id || undefined
      const email = session?.user?.email || undefined
      const requestOptions: RequestInit = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: val, userId, email }),
      }

      let res = await fetch('/api/user', requestOptions)

      if (!res.ok) {
        const status = res.status
        const data = await res.json().catch(() => ({}))
        console.log('[Home] /api/user PUT failed:', { status, data })
        // Si es 401, intentamos refrescar sesión y reintentar una vez
        if (status === 401) {
          try {
            await getSession()
            console.log('[Home] Sesión refrescada, reintentando PUT /api/user')
            res = await fetch('/api/user', requestOptions)
          } catch (e) {
            console.log('[Home] Error refrescando sesión:', e)
          }
        }

        if (!res.ok) {
          const status2 = res.status
          const data2 = await res.json().catch(() => ({}))
          console.log('[Home] /api/user PUT failed (retry):', { status: status2, data: data2 })
          throw new Error(data2?.error || `Error al guardar el nombre (status ${status2})`)
        }
      }

      toast.success('Nombre guardado correctamente')
      setIsNameDialogOpen(false)
      setNameInput('')
      // Intentar refrescar la sesión para reflejar el nuevo nombre
      try {
        await getSession()
      } catch {}
    } catch (e: any) {
      toast.error(e?.message || 'Error al guardar el nombre')
    }
  }

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent)
    // Para editar, necesitamos obtener los datos completos del agente
    fetchAgentDetails(agent.id)
  }

  const fetchAgentDetails = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}`)
      if (response.ok) {
        const data = await response.json()
        setFormData({
          name: data.name,
          description: data.description || '',
          initialStory: data.initialStory || '',
          firstMessage: data.firstMessage || '',
          systemPrompt: data.systemPrompt,
          role: data.role || '',
          tone: data.tone || '',
          scenario: data.scenario || 'none',
          enhancers: normalizeEnhancers(data.enhancers ?? null),
          imageStyle: data.imageStyle || '',
          imagePromptMaster: data.imagePromptMaster || '',
          photoUrl: data.photoUrl || '',
          appearancePrompt: data.appearancePrompt || '',
          gender: data.gender || '',
          characterName: data.characterName || ''
        })
        const style = (data.imageStyle || '').trim()
        setIsCustomImageStyle(style.length > 0 && !presetImageStyles.includes(style))
        setIsEditDialogOpen(true)
      }
    } catch (error) {
      toast.error('Error al cargar los datos del agente')
    }
  }

  const handleUpdateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingAgent) return

    try {
      // Build enhanced system prompt using the new prompt system
      const enhancedPrompt = buildAgentPrompt(
        formData.name,
        formData.description,
        formData.systemPrompt,
        formData.role as keyof typeof PROMPT_TEMPLATES.roles || undefined,
        formData.tone as keyof typeof PROMPT_TEMPLATES.tones || undefined,
        formData.scenario as keyof typeof PROMPT_TEMPLATES.scenarios || undefined,
        formData.enhancers,
        formData.imageStyle
      )

      const response = await fetch(`/api/agents/${editingAgent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          initialStory: (formData.initialStory || '').trim() || null,
          firstMessage: (formData.firstMessage || '').trim() || null,
          systemPrompt: enhancedPrompt,
          role: formData.role || null,
          tone: formData.tone || null,
          scenario: formData.scenario === 'none' ? null : formData.scenario || null,
          enhancers: formData.enhancers.length > 0 ? JSON.stringify(formData.enhancers) : null,
          imageStyle: (formData.imageStyle || '').trim() || null,
          imagePromptMaster: (formData.imagePromptMaster || '').trim() || null,
          photoUrl: (formData.photoUrl || '').trim() || null,
          appearancePrompt: (formData.appearancePrompt || '').trim() || null,
          gender: (formData.gender || '').trim() || null,
          characterName: (formData.characterName || '').trim() || null,
        }),
      })

      if (response.ok) {
        toast.success('Agente actualizado exitosamente')
        setIsEditDialogOpen(false)
        setEditingAgent(null)
        setFormData({
          name: '',
          description: '',
          initialStory: '',
          firstMessage: '',
          systemPrompt: '',
          role: '',
          tone: '',
          scenario: '',
          enhancers: [],
          imageStyle: '',
          imagePromptMaster: '',
          photoUrl: '',
          appearancePrompt: '',
          gender: '',
          characterName: ''
        })
        fetchAgents()
      } else {
        toast.error('Error al actualizar el agente')
      }
    } catch (error) {
      toast.error('Error al actualizar el agente')
    }
  }

  const handleEnhancerChange = (enhancer: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        enhancers: [...prev.enhancers, enhancer]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        enhancers: prev.enhancers.filter(e => e !== enhancer)
      }))
    }
  }

  const openChat = (agent: Agent) => {
    router.push(`/chat/${agent.id}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          {/* Name Capture Dialog */}
          <NameCaptureDialog
            open={isNameDialogOpen}
            onOpenChange={setIsNameDialogOpen}
            nameInput={nameInput}
            setNameInput={setNameInput}
            onSave={handleSaveName}
          />

          {/* Loading Spinner */}
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Agentes de IA</h1>
            <p className="text-muted-foreground mt-2">
              Crea y conversa con agentes de IA personalizados
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Agente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Agente</DialogTitle>
                <DialogDescription>
                  Crea un nuevo agente de IA con una personalidad y propósito específicos.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAgent} className="space-y-4">
                <AgentFormFields
                  formData={formData}
                  setFormData={setFormData}
                  isCustomImageStyle={isCustomImageStyle}
                  setIsCustomImageStyle={setIsCustomImageStyle}
                  presetImageStyles={presetImageStyles}
                  handleEnhancerChange={handleEnhancerChange}
                  onGenerateImage={async () => {
                    if (!formData.imagePromptMaster || (formData.imagePromptMaster || '').trim().length < 10) {
                      toast.error('Escribe un prompt maestro de imagen más detallado (≥10 caracteres)')
                      return
                    }
                    try {
                      setIsGeneratingImage(true)
                      const res = await fetch('/api/images', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          prompt: (formData.imagePromptMaster || '').trim(),
                          width: 768,
                          height: 768,
                          style_preset: (formData.imageStyle || '').trim() || null,
                          model_id: (formData.sinkinModelId || '').trim() || 'JWknjgr'
                        })
                      })
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({ error: 'Error generando imagen' }))
                        throw new Error(err.error || 'Error generando imagen')
                      }
                      const data = await res.json()
                      const url = data.photoUrl
                      if (url) {
                        setFormData((prev) => ({ ...prev, photoUrl: url }))
                        toast.success('Imagen generada y subida')
                      } else {
                        throw new Error('No se recibió URL de imagen')
                      }
                    } catch (error: any) {
                      toast.error(error?.message || 'Error generando imagen')
                    } finally {
                      setIsGeneratingImage(false)
                    }
                  }}
                  isGeneratingImage={isGeneratingImage}
                />
                <div className="sticky bottom-0 bg-background pt-3">
                  <div className="flex justify-end gap-2 border-t pt-3">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Crear Agente</Button>
                  </div>
                </div>
              </form>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => {
                setNameInput((currentUserName || '').trim())
                setIsNameDialogOpen(true)
              }}
            >
              Cambiar nombre
            </Button>
          </div>
        </div>

        {/* Name Capture Dialog */}
        <NameCaptureDialog
          open={isNameDialogOpen}
          onOpenChange={setIsNameDialogOpen}
          nameInput={nameInput}
          setNameInput={setNameInput}
          onSave={handleSaveName}
        />

        {/* Agents Grid */}
        <AgentsGrid
          agents={agents}
          onCreateFirstAgent={() => setIsCreateDialogOpen(true)}
          onChat={openChat}
          onEdit={handleEditAgent}
          onDelete={handleDeleteAgent}
        />

        {/* Edit Agent Dialog */}
        {editingAgent && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Agente</DialogTitle>
                <DialogDescription>
                  Actualiza la información del agente de IA.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateAgent} className="space-y-4">
                <AgentFormFields
                  formData={formData}
                  setFormData={setFormData}
                  isCustomImageStyle={isCustomImageStyle}
                  setIsCustomImageStyle={setIsCustomImageStyle}
                  presetImageStyles={presetImageStyles}
                  handleEnhancerChange={handleEnhancerChange}
                  fieldPrefix="edit-"
                  onGenerateImage={async () => {
                    if (!formData.imagePromptMaster || (formData.imagePromptMaster || '').trim().length < 10) {
                      toast.error('Escribe un prompt maestro de imagen más detallado (≥10 caracteres)')
                      return
                    }
                    try {
                      setIsGeneratingImage(true)
                      const res = await fetch('/api/images', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          prompt: (formData.imagePromptMaster || '').trim(),
                          width: 768,
                          height: 768,
                          style_preset: (formData.imageStyle || '').trim() || null,
                          model_id: (formData.sinkinModelId || '').trim() || 'JWknjgr'
                        })
                      })
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({ error: 'Error generando imagen' }))
                        throw new Error(err.error || 'Error generando imagen')
                      }
                      const data = await res.json()
                      const url = data.photoUrl
                      if (url) {
                        setFormData((prev) => ({ ...prev, photoUrl: url }))
                        toast.success('Imagen generada y subida')
                      } else {
                        throw new Error('No se recibió URL de imagen')
                      }
                    } catch (error: any) {
                      toast.error(error?.message || 'Error generando imagen')
                    } finally {
                      setIsGeneratingImage(false)
                    }
                  }}
                  isGeneratingImage={isGeneratingImage}
                />
                <div className="sticky bottom-0 bg-background pt-3">
                  <div className="flex justify-end gap-2 border-t pt-3">
                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Actualizar Agente</Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
