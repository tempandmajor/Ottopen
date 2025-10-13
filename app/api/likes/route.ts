import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { getServerUser } from '@/lib/server/auth'
import { revalidatePath } from 'next/cache'

const likeSchema = z.object({ postId: z.string().min(1) })

export const POST = createRateLimitedHandler('api', async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}))
  const parsed = likeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { user, supabase } = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId } = parsed.data

  const { error } = await (supabase as any)
    .from('likes')
    .insert({ post_id: postId, user_id: user.id })
  if (error) {
    return NextResponse.json({ error: 'Failed to like', details: error.message }, { status: 400 })
  }

  // Trigger revalidation for listings and post detail pages
  revalidatePath('/works')
  revalidatePath(`/posts/${postId}`)

  return NextResponse.json({ ok: true })
})

export const DELETE = createRateLimitedHandler('api', async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}))
  const parsed = likeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { user, supabase } = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId } = parsed.data

  const { error } = await (supabase as any)
    .from('likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', user.id)
  if (error) {
    return NextResponse.json({ error: 'Failed to unlike', details: error.message }, { status: 400 })
  }

  revalidatePath('/works')
  revalidatePath(`/posts/${postId}`)

  return NextResponse.json({ ok: true })
})
