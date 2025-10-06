import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/src/lib/supabase-admin'
import { logError } from '@/src/lib/errors'

export const dynamic = 'force-dynamic'

/**
 * GET /api/reviews/user/[userId]
 * Fetch reviews for a specific user (writer)
 */
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    const supabase = getSupabaseAdmin()

    // Fetch reviews from job_reviews table
    const { data: reviews, error } = await supabase
      .from('job_reviews')
      .select(
        `
        *,
        reviewer:reviewer_id(id, display_name, avatar_url, username),
        job:job_id(id, title)
      `
      )
      .eq('writer_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Calculate rating statistics
    const ratingStats = reviews?.reduce(
      (acc, review) => {
        const rating = review.rating || 0
        acc.total += 1
        acc.sum += rating
        acc[`star_${rating}`] = (acc[`star_${rating}`] || 0) + 1
        return acc
      },
      {
        total: 0,
        sum: 0,
        star_5: 0,
        star_4: 0,
        star_3: 0,
        star_2: 0,
        star_1: 0,
      }
    )

    const averageRating = ratingStats ? ratingStats.sum / ratingStats.total : 0

    // Calculate percentage breakdown
    const ratingBreakdown = ratingStats
      ? {
          5: Math.round((ratingStats.star_5 / ratingStats.total) * 100),
          4: Math.round((ratingStats.star_4 / ratingStats.total) * 100),
          3: Math.round((ratingStats.star_3 / ratingStats.total) * 100),
          2: Math.round((ratingStats.star_2 / ratingStats.total) * 100),
          1: Math.round((ratingStats.star_1 / ratingStats.total) * 100),
        }
      : { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

    return NextResponse.json({
      reviews: reviews || [],
      stats: {
        total: ratingStats?.total || 0,
        average: averageRating,
        breakdown: ratingBreakdown,
      },
    })
  } catch (error: unknown) {
    logError(error, {
      context: 'reviews_user_api',
      userId: params.userId,
    })

    return NextResponse.json(
      {
        error: 'Failed to fetch reviews',
        reviews: [],
        stats: {
          total: 0,
          average: 0,
          breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
      },
      { status: 500 }
    )
  }
}
