import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { getServerUser } from '@/lib/server/auth'
import { revalidatePath } from 'next/cache'

const followSchema = z.object({ authorId: z.string().min(1) })

export const POST = createRateLimitedHandler('api', async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}))
  const parsed = followSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { user, supabase } = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { authorId } = parsed.data

  const { error } = await (supabase as any)
    .from('follows')
    .insert({ follower_id: user.id, following_id: authorId })
  if (error) {
    return NextResponse.json({ error: 'Failed to follow', details: error.message }, { status: 400 })
  }

  revalidatePath('/authors')
  return NextResponse.json({ ok: true })
})

export const DELETE = createRateLimitedHandler('api', async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}))
  const parsed = followSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { user, supabase } = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { authorId } = parsed.data

  const { error } = await (supabase as any)
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', authorId)
  if (error) {
    return NextResponse.json(
      { error: 'Failed to unfollow', details: error.message },
      { status: 400 }
    )
  }

  revalidatePath('/authors')
  return NextResponse.json({ ok: true })
})
