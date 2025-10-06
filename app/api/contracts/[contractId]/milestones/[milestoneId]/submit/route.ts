import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { logError } from '@/src/lib/errors'

export const dynamic = 'force-dynamic'

/**
 * POST /api/contracts/[contractId]/milestones/[milestoneId]/submit
 * Writer submits milestone for approval
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { contractId: string; milestoneId: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { deliverableUrl, deliverableNotes } = await request.json()

    // Get contract
    const { data: contract } = await supabase
      .from('job_contracts')
      .select('*')
      .eq('id', params.contractId)
      .single()

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Verify user is the writer
    if (contract.writer_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the writer can submit deliverables' },
        { status: 403 }
      )
    }

    // Update milestone
    const { data: milestone, error: updateError } = await supabase
      .from('job_milestones')
      .update({
        status: 'submitted',
        deliverable_url: deliverableUrl,
        deliverable_notes: deliverableNotes,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', params.milestoneId)
      .eq('contract_id', params.contractId)
      .select()
      .single()

    if (updateError) {
      logError(updateError, { context: 'submit_milestone' })
      return NextResponse.json({ error: 'Failed to submit milestone' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      milestone,
    })
  } catch (error: any) {
    logError(error, { context: 'submit_milestone' })
    return NextResponse.json(
      { error: error.message || 'Failed to submit milestone' },
      { status: 500 }
    )
  }
}
