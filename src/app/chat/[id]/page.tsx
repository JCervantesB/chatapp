"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, RotateCcw, ArrowLeft } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { MessageContent } from '@/components/MessageContent'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  content: string
  role: string
  createdAt: string
}

interface Agent {
  id: string
  name: string
  description?: string
  systemPrompt: string
}

export default function ChatPage() {
  const { data: session, isPending } = useSession()
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string
  
  const [agent, setAgent] = useState<Agent | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [isLoadingAgent, setIsLoadingAgent] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialGreetingSent = useRef(false)

  useEffect(() => {
    // Guard: si no hay sesión, enviar a /auth
    if (!isPending && !session) {
      router.replace('/auth')
    }
  }, [isPending, session, router])

  useEffect(() => {
    if (agentId) {
      fetchAgent()
      loadChatMessages()
    }
  }, [agentId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Enviar saludo inicial automáticamente cuando no hay mensajes, con verificación adicional
  useEffect(() => {
    const maybeSendGreeting = async () => {
      if (initialGreetingSent.current || !agent) return
      // Re-consultar mensajes actuales para evitar carrera
      try {
        const resp = await fetch(`/api/chat?agentId=${agentId}`)
        if (resp.ok) {
          const data = await resp.json()
          if (Array.isArray(data) && data.length === 0) {
            initialGreetingSent.current = true
            await sendInitialGreeting()
          }
        }
      } catch {}
    }
    // si no hay mensajes cargados localmente, intentar enviar
    if (!initialGreetingSent.current && agent && messages.length === 0) {
      maybeSendGreeting()
    }
  }, [agent, messages, agentId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendInitialGreeting = async () => {
    if (!agent) return

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agent.id,
          message: '__INITIAL_GREETING__'
        }),
      })

      if (response.ok) {
        await loadChatMessages()
      }
    } catch (error) {
      console.error('Error sending initial greeting:', error)
    }
  }

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}`)
      if (response.ok) {
        const data = await response.json()
        setAgent(data)
      } else {
        toast.error('Agente no encontrado')
        router.push('/')
      }
    } catch (error) {
      toast.error('Error al cargar el agente')
      router.push('/')
    } finally {
      setIsLoadingAgent(false)
    }
  }

  const loadChatMessages = async () => {
    try {
      const response = await fetch(`/api/chat?agentId=${agentId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      toast.error('Error al cargar los mensajes')
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !agent || isLoadingChat) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoadingChat(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agent.id,
          message: userMessage
        }),
      })

      if (response.ok) {
        const data = await response.json()
        await loadChatMessages()
      } else {
        toast.error('Error al enviar el mensaje')
      }
    } catch (error) {
      toast.error('Error al enviar el mensaje')
    } finally {
      setIsLoadingChat(false)
    }
  }

  const clearChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat?agentId=${agentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMessages([])
        // Permitir que se envíe nuevamente el saludo inicial
        initialGreetingSent.current = false
        toast.success('Historial de chat limpiado')
      } else {
        toast.error('Error al limpiar el historial')
      }
    } catch (error) {
      toast.error('Error al limpiar el historial')
    }
  }

  const goBack = () => {
    router.push('/')
  }

  if (isLoadingAgent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Agente no encontrado</h2>
          <Button onClick={goBack}>Volver al inicio</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">IA</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={clearChatHistory}
                disabled={messages.length === 0}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <div className="flex flex-col h-[calc(100vh-200px)]">
          {/* Messages Area */}
          <Card className="flex-1 flex flex-col">
            <CardContent className="flex-1 p-2 sm:p-6 overflow-y-auto">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                    <div>
                      <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>Comienza una conversación con {agent.name}</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[95%] sm:max-w-[85%] md:max-w-[70%] rounded-lg px-3 sm:px-4 py-2 break-words ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <MessageContent 
                          content={message.content} 
                          isAgent={message.role === 'assistant'} 
                          agentId={agent.id}
                        />
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {isLoadingChat && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        <p className="text-sm">Escribiendo...</p>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
          </Card>

          {/* Input Area */}
          <div className="mt-4 flex space-x-2">
            <Textarea
              placeholder="Escribe tu mensaje... (Enter: nueva línea, usa el botón Enviar)"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoadingChat}
              className="flex-1"
              rows={3}
            />
            <Button onClick={sendMessage} disabled={isLoadingChat || !inputMessage.trim()}>
              Enviar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}