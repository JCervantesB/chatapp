'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Bot, MessageCircle, Edit, Trash2, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react'

interface Agent {
  id: string
  name: string
  createdAt: string
  photoUrl?: string | null
}

interface AgentsGridProps {
  agents: Agent[]
  onCreateFirstAgent: () => void
  onChat: (agent: Agent) => void
  onEdit: (agent: Agent) => void
  onDelete: (id: string) => void
}

export function AgentsGrid({ agents, onCreateFirstAgent, onChat, onEdit, onDelete }: AgentsGridProps) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 9

  const totalPages = Math.max(1, Math.ceil((agents?.length || 0) / pageSize))

  React.useEffect(() => {
    // Ajustar página si el total cambia
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages])

  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedAgents = Array.isArray(agents) ? agents.slice(startIndex, endIndex) : []

  const gotoPage = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages)
    setCurrentPage(next)
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="text-center py-12">
        <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay agentes aún</h3>
        <p className="text-muted-foreground mb-4">
          Crea tu primer agente de IA para empezar a conversar.
        </p>
        <Button onClick={onCreateFirstAgent}>
          <Plus className="mr-2 h-4 w-4" />
          Crear Primer Agente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedAgents.map((agent) => (
        <Card
          key={agent.id}
          className="relative overflow-hidden aspect-[9/16] rounded-[24px] border-muted shadow-lg hover:shadow-xl transition-shadow"
        >
          {/* Background image covering entire card */}
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{
              backgroundImage: agent.photoUrl ? `url(${agent.photoUrl})` : undefined,
              backgroundColor: agent.photoUrl ? undefined : 'var(--background)',
            }}
          />

          {/* Subtle dark overlay for readability */}
          <div className="absolute inset-0 bg-black/25 dark:bg-black/35" />

          {/* Content overlay */}
          <CardHeader className="relative z-10 px-5 pt-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-white drop-shadow" />
                <CardTitle className="text-lg text-white drop-shadow-sm">{agent.name}</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-white/80 text-black">IA</Badge>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 px-5 pb-5 mt-auto">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-end h-full">
              <div className="text-xs text-white/90 drop-shadow min-w-0 truncate">
                Creado: {new Date(agent.createdAt).toLocaleDateString()}
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:flex-nowrap">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/90 text-black hover:bg-white text-xs px-2 flex-1 sm:flex-none"
                  onClick={() => onChat(agent)}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Chat
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="secondary" className="bg-white/70 text-black hover:bg-white/90 text-xs px-2 shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onEdit(agent)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(agent.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => gotoPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-1">Anterior</span>
          </Button>

          {/* Números de página (compactos si muchas páginas) */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1
              const isActive = page === currentPage
              // Si hay muchas páginas, mostrar primeras, últimas y cercanas a la actual
              if (totalPages > 7) {
                const nearCurrent = Math.abs(page - currentPage) <= 1
                const firstOrLast = page === 1 || page === totalPages
                const show = nearCurrent || firstOrLast || page === 2 || page === totalPages - 1
                if (!show) {
                  // Insertar puntos suspensivos en posiciones intermedias
                  if (page === 3 && currentPage > 4) {
                    return <span key={page} className="px-1 text-muted-foreground">…</span>
                  }
                  if (page === totalPages - 2 && currentPage < totalPages - 3) {
                    return <span key={page} className="px-1 text-muted-foreground">…</span>
                  }
                  return null
                }
              }
              return (
                <Button
                  key={page}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className={isActive ? '' : 'bg-background'}
                  onClick={() => gotoPage(page)}
                >
                  {page}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => gotoPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <span className="mr-1">Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}