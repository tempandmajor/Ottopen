import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { createEscrowPayment, calculateFees } from '@/src/lib/stripe-connect-service'
import { logError } from '@/src/lib/errors'

export const dynamic = 'force-dynamic'

/**
 * POST /api/jobs/[jobId]/hire
 * Client hires a writer and creates escrow payment
 */
export async function POST(request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      applicationId,
      milestones,
      pricingModel,
      customAmount,
      estimatedWordCount,
      estimatedPageCount,
      estimatedHours,
      ratePerWord,
      ratePerPage,
      rateHourly,
    } = await request.json()

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 })
    }

    // Get job and application details
    const { data: job } = await supabase
      .from('jobs')
      .select(
        '*, poster_id, budget, pricing_model, rate_offered_per_word, rate_offered_per_page, rate_offered_hourly'
      )
      .eq('id', params.jobId)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify user is the job poster
    if (job.poster_id !== user.id) {
      return NextResponse.json({ error: 'Only job poster can hire applicants' }, { status: 403 })
    }

    // Get application
    const { data: application } = await supabase
      .from('job_applications')
      .select('*, applicant_id')
      .eq('id', applicationId)
      .single()

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const writerId = application.applicant_id

    // Calculate amount based on pricing model
    let amount = customAmount || job.budget || 0

    if (pricingModel === 'per_word' && estimatedWordCount && ratePerWord) {
      amount = estimatedWordCount * ratePerWord
    } else if (pricingModel === 'per_page' && estimatedPageCount && ratePerPage) {
      amount = estimatedPageCount * ratePerPage
    } else if (pricingModel === 'hourly' && estimatedHours && rateHourly) {
      amount = estimatedHours * rateHourly
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Job must have a budget set or valid pricing details' },
        { status: 400 }
      )
    }

    // Check if writer has Stripe Connect setup
    const { data: writer } = await supabase
      .from('users')
      .select('stripe_connect_account_id, stripe_connect_onboarded')
      .eq('id', writerId)
      .single()

    if (!writer?.stripe_connect_onboarded) {
      return NextResponse.json(
        {
          error: 'Writer must complete payment setup first',
          requiresWriterOnboarding: true,
          writerId,
        },
        { status: 400 }
      )
    }

    // Calculate fees
    const fees = calculateFees(amount)

    // Create contract
    const { data: contract, error: contractError } = await supabase
      .from('job_contracts')
      .insert({
        job_id: params.jobId,
        application_id: applicationId,
        client_id: user.id,
        writer_id: writerId,
        total_amount: fees.totalAmount,
        platform_fee: fees.platformFee,
        stripe_fee: fees.stripeFee,
        writer_receives: fees.writerReceives,
        has_milestones: milestones && milestones.length > 0,
        payment_status: 'pending',
      })
      .select()
      .single()

    if (contractError || !contract) {
      logError(contractError, { context: 'create_contract' })
      return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
    }

    // Create milestones if provided
    if (milestones && milestones.length > 0) {
      const milestoneData = milestones.map((m: any, index: number) => ({
        contract_id: contract.id,
        title: m.title,
        description: m.description,
        amount: m.amount,
        order_index: index,
        status: 'pending',
      }))

      await supabase.from('job_milestones').insert(milestoneData)
    }

    // Create escrow payment
    const { paymentIntent, fees: calculatedFees } = await createEscrowPayment({
      amount,
      clientId: user.id,
      writerId,
      contractId: contract.id,
      description: `Payment for job: ${job.title}`,
    })

    // Update contract with payment intent
    await supabase
      .from('job_contracts')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq('id', contract.id)

    // Update application status
    await supabase.from('job_applications').update({ status: 'accepted' }).eq('id', applicationId)

    // Reject other applications
    await supabase
      .from('job_applications')
      .update({ status: 'rejected' })
      .eq('job_id', params.jobId)
      .neq('id', applicationId)

    return NextResponse.json({
      success: true,
      contract,
      clientSecret: paymentIntent.client_secret,
      fees: calculatedFees,
    })
  } catch (error: any) {
    logError(error, { context: 'hire_writer' })
    return NextResponse.json({ error: error.message || 'Failed to hire writer' }, { status: 500 })
  }
}
