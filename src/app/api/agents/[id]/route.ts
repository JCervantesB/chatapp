import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { schema } from '@/db'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  ctx: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const { id } = await (ctx.params as Promise<{ id: string }>)

    const agentRows = await db
      .select()
      .from(schema.agents)
      .where(eq(schema.agents.id, id))
      .limit(1)
    const agent = agentRows[0]

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Error fetching agent:', error)
    return NextResponse.json(
      { error: 'Error fetching agent' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const { id } = await (ctx.params as Promise<{ id: string }>)

    // First, delete all chat messages associated with this agent
    await db.delete(schema.chatMessages).where(eq(schema.chatMessages.agentId, id))

    // Then delete the agent
    await db.delete(schema.agents).where(eq(schema.agents.id, id))

    return NextResponse.json({ message: 'Agent deleted successfully' })
  } catch (error) {
    console.error('Error deleting agent:', error)
    return NextResponse.json(
      { error: 'Error deleting agent' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  ctx: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const { id } = await (ctx.params as Promise<{ id: string }>)
    const body = await request.json()
    const { name, description, systemPrompt, role, tone, scenario, enhancers, imageStyle, initialStory, photoUrl, imagePromptMaster } = body

    if (!name || !systemPrompt) {
      return NextResponse.json(
        { error: 'Name and systemPrompt are required' },
        { status: 400 }
      )
    }

    const updatedRows = await db
      .update(schema.agents)
      .set({
        name,
        description: description ?? null,
        systemPrompt,
        role: role ?? null,
        tone: tone ?? null,
        scenario: scenario ?? null,
        enhancers: enhancers ?? null,
        imageStyle: imageStyle ?? null,
        initialStory: initialStory ?? null,
        photoUrl: photoUrl ?? null,
        imagePromptMaster: imagePromptMaster ?? null,
      })
      .where(eq(schema.agents.id, id))
      .returning()
    const agent = updatedRows[0]

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Error updating agent:', error)
    return NextResponse.json(
      { error: 'Error updating agent' },
      { status: 500 }
    )
  }
}