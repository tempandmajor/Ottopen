import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { releaseEscrowPayment } from '@/src/lib/stripe-connect-service'
import { logError } from '@/src/lib/errors'

export const dynamic = 'force-dynamic'

/**
 * POST /api/contracts/[contractId]/milestones/[milestoneId]/approve
 * Client approves milestone and releases payment
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

    const { feedback } = await request.json()

    // Get contract
    const { data: contract } = await supabase
      .from('job_contracts')
      .select('*')
      .eq('id', params.contractId)
      .single()

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Verify user is the client
    if (contract.client_id !== user.id) {
      return NextResponse.json({ error: 'Only the client can approve milestones' }, { status: 403 })
    }

    // Get milestone
    const { data: milestone } = await supabase
      .from('job_milestones')
      .select('*')
      .eq('id', params.milestoneId)
      .single()

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }

    if (milestone.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Milestone must be submitted before approval' },
        { status: 400 }
      )
    }

    // Get writer's Connect account
    const { data: writer } = await supabase
      .from('users')
      .select('stripe_connect_account_id')
      .eq('id', contract.writer_id)
      .single()

    if (!writer?.stripe_connect_account_id) {
      return NextResponse.json({ error: 'Writer payment account not found' }, { status: 400 })
    }

    // Calculate platform fee for this milestone
    const platformFee = milestone.amount * 0.1

    // Release payment to writer
    const transfer = await releaseEscrowPayment({
      paymentIntentId: contract.stripe_payment_intent_id,
      writerConnectAccountId: writer.stripe_connect_account_id,
      amount: milestone.amount,
      platformFee,
      contractId: params.contractId,
      milestoneId: params.milestoneId,
    })

    // Update milestone
    await supabase
      .from('job_milestones')
      .update({
        status: 'approved',
        feedback,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        stripe_transfer_id: transfer.id,
        paid_at: new Date().toISOString(),
      })
      .eq('id', params.milestoneId)

    // Check if all milestones are completed
    const { data: allMilestones } = await supabase
      .from('job_milestones')
      .select('status')
      .eq('contract_id', params.contractId)

    const allApproved = allMilestones?.every(m => m.status === 'approved')

    if (allApproved) {
      // Mark contract as complete
      await supabase
        .from('job_contracts')
        .update({
          payment_status: 'released',
          completed_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
        })
        .eq('id', params.contractId)
    }

    return NextResponse.json({
      success: true,
      transfer,
      contractComplete: allApproved,
    })
  } catch (error: any) {
    logError(error, { context: 'approve_milestone' })
    return NextResponse.json(
      { error: error.message || 'Failed to approve milestone' },
      { status: 500 }
    )
  }
}
