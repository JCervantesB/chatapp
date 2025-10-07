import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { schema } from '@/db'
import { desc, eq, inArray } from 'drizzle-orm'

export async function GET() {
  try {
    const agents = await db
      .select({
        id: schema.agents.id,
        name: schema.agents.name,
        photoUrl: schema.agents.photoUrl,
        createdAt: schema.agents.createdAt,
      })
      .from(schema.agents)
      .orderBy(desc(schema.agents.createdAt))

    return NextResponse.json(agents)
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { error: 'Error fetching agents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, systemPrompt, role, tone, scenario, enhancers, imageStyle, initialStory, photoUrl, imagePromptMaster } = body

    if (!name || !systemPrompt) {
      return NextResponse.json(
        { error: 'Name and systemPrompt are required' },
        { status: 400 }
      )
    }

    const inserted = await db
      .insert(schema.agents)
      .values({
        id: randomUUID(),
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
      .returning()

    const agent = inserted[0]
    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    console.error('Error creating agent:', error)
    return NextResponse.json(
      { error: 'Error creating agent' },
      { status: 500 }
    )
  }
}

// Bulk delete all agents (and their chat messages via manual cascade)
export async function DELETE() {
  try {
    const result = await db.transaction(async (tx) => {
      // Fetch all agent IDs first
      const idsRows = await tx
        .select({ id: schema.agents.id })
        .from(schema.agents)

      const ids = idsRows.map(r => r.id)

      if (ids.length === 0) {
        return { deleted: 0 }
      }

      // Bulk delete chat messages for all agents
      await tx.delete(schema.chatMessages).where(inArray(schema.chatMessages.agentId, ids))

      // Bulk delete agents themselves
      const deleted = await tx
        .delete(schema.agents)
        .where(inArray(schema.agents.id, ids))
        .returning({ id: schema.agents.id })

      return { deleted: deleted.length }
    })

    return NextResponse.json({ message: 'Agentes borrados correctamente', deleted: result.deleted })
  } catch (error) {
    console.error('Error deleting all agents:', error)
    return NextResponse.json(
      { error: 'Error deleting all agents' },
      { status: 500 }
    )
  }
}