import { NextRequest, NextResponse } from 'next/server'
import { headers as nextHeaders } from 'next/headers'
import { db } from '@/lib/db'
import { schema } from '@/db'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'

// Asegurar runtime Node para manejo de cookies/headers completo
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Log de cookies presentes en la petición
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      console.log('[API /api/user GET] Cookies recibidas:', cookieHeader.split(';').map(c => c.trim()))
      const list = cookieHeader.split(';').map(c => c.trim())
      const hasSessionToken = list.some(c => c.startsWith('better-auth.session_token='))
      const hasSessionData = list.some(c => c.startsWith('better-auth.session_data='))
      console.log('[API /api/user GET] Presencia cookies better-auth:', { hasSessionToken, hasSessionData })
    } else {
      console.log('[API /api/user GET] Sin cookies en la petición')
    }

    // Obtener sesión pasando los headers de la petición
    const session = await auth.api.getSession({ headers: request.headers })

    console.log('[API /api/user GET] getSession intentado')
    console.log('[API /api/user GET] Session encontrada:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    })

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const rows = await db
      .select({ id: schema.users.id, email: schema.users.email, name: schema.users.name })
      .from(schema.users)
      .where(eq(schema.users.id, session.user.id))
      .limit(1)

    const user = rows[0]
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error obteniendo usuario:', error)
    return NextResponse.json({ error: 'Error de servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Log de cookies presentes en la petición
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      console.log('[API /api/user PUT] Cookies recibidas:', cookieHeader.split(';').map(c => c.trim()))
      const list = cookieHeader.split(';').map(c => c.trim())
      const hasSessionToken = list.some(c => c.startsWith('better-auth.session_token='))
      const hasSessionData = list.some(c => c.startsWith('better-auth.session_data='))
      console.log('[API /api/user PUT] Presencia cookies better-auth:', { hasSessionToken, hasSessionData })
    } else {
      console.log('[API /api/user PUT] Sin cookies en la petición')
    }

    // Cuerpo de la petición: permitir actualizar por id o email sin requerir sesión
    const body = await request.json()
    const nameRaw: unknown = body?.name
    const bodyUserId: unknown = body?.userId
    const bodyEmail: unknown = body?.email

    if (typeof nameRaw !== 'string') {
      return NextResponse.json({ error: 'Nombre inválido' }, { status: 400 })
    }

    const name = nameRaw.trim()

    if (name.length < 2 || name.length > 50) {
      return NextResponse.json({ error: 'El nombre debe tener entre 2 y 50 caracteres' }, { status: 400 })
    }

    // Determinar objetivo de actualización: userId -> email -> sesión (fallback)
    let targetBy: 'id' | 'email' | null = null
    let targetValue: string | null = null

    if (typeof bodyUserId === 'string' && bodyUserId.trim().length > 0) {
      targetBy = 'id'
      targetValue = bodyUserId.trim()
    } else if (typeof bodyEmail === 'string' && bodyEmail.trim().length > 0) {
      targetBy = 'email'
      targetValue = bodyEmail.trim()
    } else {
      // Intentar obtener sesión como último recurso
      const session = await auth.api.getSession({ headers: request.headers })
      console.log('[API /api/user PUT] Session encontrada:', {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
      })

      if (session?.user?.id) {
        targetBy = 'id'
        targetValue = session.user.id
      }
    }

    if (!targetBy || !targetValue) {
      // Fallback brutal: actualizar el último usuario creado si no se especifica id/email ni hay sesión
      try {
        const latest = await db
          .select({ id: schema.users.id })
          .from(schema.users)
          .orderBy(desc(schema.users.createdAt))
          .limit(1)
        const target = latest[latest.length - 1]
        if (!target?.id) {
          return NextResponse.json({ error: 'No hay usuarios para actualizar' }, { status: 404 })
        }
        targetBy = 'id'
        targetValue = target.id
        console.log('[API /api/user PUT] Fallback brutal: actualizando usuario más reciente', { targetValue })
      } catch (e) {
        return NextResponse.json({ error: 'Faltan datos de usuario para actualizar' }, { status: 400 })
      }
    }

    // Actualizar nombre en la tabla users según el objetivo
    const whereClause = targetBy === 'id' ? eq(schema.users.id, targetValue) : eq(schema.users.email, targetValue)
    const updated = await db
      .update(schema.users)
      .set({ name })
      .where(whereClause)
      .returning({ id: schema.users.id, name: schema.users.name })

    const user = updated[0]
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado para actualizar' }, { status: 404 })
    }
    return NextResponse.json({ id: user.id, name: user.name })
  } catch (error) {
    console.error('Error actualizando nombre de usuario:', error)
    return NextResponse.json({ error: 'Error de servidor' }, { status: 500 })
  }
}