import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { getServerUser } from '@/lib/server/auth'
import { revalidatePath } from 'next/cache'

const bookmarkSchema = z.object({ postId: z.string().min(1) })

export const GET = createRateLimitedHandler('api', async (_request: NextRequest) => {
  const { user, supabase } = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await (supabase as any)
    .from('bookmarks')
    .select('post_id')
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks', details: error.message },
      { status: 400 }
    )
  }

  const ids = (data || []).map((r: any) => r.post_id)
  return NextResponse.json({ postIds: ids })
})

export const POST = createRateLimitedHandler('api', async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}))
  const parsed = bookmarkSchema.safeParse(body)
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
    .from('bookmarks')
    .insert({ post_id: postId, user_id: user.id })

  if (error) {
    return NextResponse.json(
      { error: 'Failed to bookmark', details: error.message },
      { status: 400 }
    )
  }

  revalidatePath('/works')
  revalidatePath(`/posts/${postId}`)
  return NextResponse.json({ ok: true })
})

export const DELETE = createRateLimitedHandler('api', async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}))
  const parsed = bookmarkSchema.safeParse(body)
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
    .from('bookmarks')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json(
      { error: 'Failed to remove bookmark', details: error.message },
      { status: 400 }
    )
  }

  revalidatePath('/works')
  revalidatePath(`/posts/${postId}`)
  return NextResponse.json({ ok: true })
})
