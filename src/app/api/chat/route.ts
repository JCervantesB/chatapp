import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { schema } from '@/db'
import { asc, eq, and, ne } from 'drizzle-orm'
import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { buildAgentSystemPrompt, buildInitialUserInstruction } from '@/lib/prompts'
import { auth } from '@/lib/auth'

// Asegurar runtime Node para soporte de librerías y headers
export const runtime = 'nodejs'

// Initialize OpenAI SDK pointing to Venice AI API
// Docs: https://docs.venice.ai/api-reference/endpoint/chat/completions
const openai = new OpenAI({
  baseURL: 'https://api.venice.ai/api/v1',
  apiKey: process.env.VENICE_API_KEY || 'sk-venice-...', // Configura VENICE_API_KEY en tu .env
})

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
    const enhancedSystemPrompt = buildAgentSystemPrompt({
      name: agent.name,
      description: agent.description ?? null,
      systemPrompt: agent.systemPrompt,
      role: agent.role ?? null,
      tone: agent.tone ?? null,
      scenario: agent.scenario ?? null,
      enhancers: agent.enhancers ?? null,
      initialStory: agent.initialStory ?? null,
    }, userName)

    // Prepare messages for AI; ensure roles are valid union
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: enhancedSystemPrompt,
      },
      ...conversationHistory.map((msg): ChatCompletionMessageParam => ({
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
        content: buildInitialUserInstruction(agent.name, agent.initialStory ?? null),
      })
    }

    // Obtener respuesta de IA usando Venice AI
    try {
      const completion = await openai.chat.completions.create({
        model: process.env.VENICE_MODEL || 'venice-uncensored',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      })

      let aiResponse = completion.choices[0]?.message?.content

      if (!aiResponse) {
        throw new Error('No response from AI')
      }

      // Ensure IMAGEN line exists; if missing, append a sensible fallback in English
      const hasImageLine = /(^|\n)IMAGEN:\s*/.test(aiResponse)
      if (!hasImageLine) {
        const baseScene = agent.scenario || 'a relevant scene matching the current context'
        const style = agent.imageStyle || 'hyperrealistic, detailed, 2k, high resolution'
        // Agent-centric composition: only the agent; if the user is involved, show as silhouette or implied interaction
        const fallbackDesc = `${style}, single character focus: ${agent.name}, scene: ${baseScene}, if interacting with ${userName || 'the user'} depict them as a silhouette or implied action, no secondary characters, clear composition, readable silhouette, moody lighting`
        aiResponse = `${aiResponse}\nIMAGEN: ${fallbackDesc}`
      }

      // Save AI response
      await db.insert(schema.chatMessages).values({
        content: aiResponse,
        role: 'assistant',
        agentId,
      })

      return NextResponse.json({
        response: aiResponse,
        messageId: completion.id
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