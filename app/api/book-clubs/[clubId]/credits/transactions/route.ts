import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function handleGetTransactions(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data: transactions, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('club_id', params.clubId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({
      success: true,
      transactions,
    })
  } catch (error: any) {
    console.error('Get transactions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = createRateLimitedHandler('api', handleGetTransactions)
