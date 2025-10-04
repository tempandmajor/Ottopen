import { z } from 'zod'

/**
 * Common validation schemas used across API routes
 */

// Search query validation - prevents SQL injection
export const searchQuerySchema = z
  .string()
  .min(1, 'Search query must not be empty')
  .max(100, 'Search query too long')
  .regex(/^[a-zA-Z0-9\s\-_'".,:;!?&()]+$/, 'Invalid characters in search query')

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format')

// Email validation
export const emailSchema = z.string().email('Invalid email address')

// AI Request schemas
export const aiResearchRequestSchema = z.object({
  query: z.string().min(1).max(2000),
  storyContext: z
    .object({
      genre: z.string().max(100).optional(),
      setting: z.string().max(500).optional(),
      currentScene: z.string().max(5000).optional(),
      characters: z.array(z.string().max(200)).max(20).optional(),
    })
    .optional(),
  recencyFilter: z.enum(['day', 'week', 'month', 'year', 'all']).optional(),
})

export const aiBrainstormRequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  context: z.string().max(5000).optional(),
  count: z.number().int().min(1).max(10).optional().default(5),
})

export const aiRewriteRequestSchema = z.object({
  text: z.string().min(1).max(10000),
  instruction: z.string().min(1).max(1000),
})

export const aiExpandRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  targetLength: z.number().int().min(100).max(50000).optional(),
})

export const aiCritiqueRequestSchema = z.object({
  text: z.string().min(1).max(20000),
  focusAreas: z.array(z.string()).max(10).optional(),
})

// Referral schemas
export const trackReferralSchema = z.object({
  referral_code: z.string().min(6).max(20),
  referred_user_id: z.string().uuid(),
})

export const confirmReferralSchema = z.object({
  referral_id: z.string().uuid(),
  subscription_tier: z.enum(['basic', 'pro', 'premium']),
})

export const payoutRequestSchema = z.object({
  amount_cents: z.number().int().min(100).max(1000000), // $1 to $10,000
})

// Script schemas
export const createScriptSchema = z.object({
  title: z.string().min(1).max(200),
  script_type: z.enum(['screenplay', 'tv_pilot', 'stage_play', 'documentary', 'book']),
  genre: z.array(z.string()).max(5).optional(),
  logline: z.string().max(500).optional(),
  content: z.string().max(1000000).optional(),
})

export const updateScriptSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(1000000).optional(),
  logline: z.string().max(500).optional(),
  genre: z.array(z.string()).max(5).optional(),
  setting: z.string().max(500).optional(),
  time_period: z.string().max(100).optional(),
})

// Submission schemas
export const createSubmissionSchema = z.object({
  manuscript_id: z.string().uuid(),
  publisher_id: z.string().uuid(),
  submitter_id: z.string().uuid(),
  notes: z.string().max(1000).optional(),
})

// Book club schemas
export const createBookClubSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  is_private: z.boolean().optional().default(false),
})

export const createDiscussionSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
})

// Research schemas
export const createResearchNoteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(50000),
  tags: z.array(z.string().max(50)).max(10).optional(),
  script_id: z.string().uuid().optional(),
})

export const updateResearchNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(50000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
})

// Pagination schemas
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
})

/**
 * Helper to validate and parse request body
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string; details: any }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors,
      }
    }
    return {
      success: false,
      error: 'Invalid request body',
      details: null,
    }
  }
}

/**
 * Helper to validate query parameters
 */
export function validateQueryParams<T>(
  params: URLSearchParams | { [key: string]: string | string[] | undefined },
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string; details: any } {
  try {
    // Convert URLSearchParams to object
    const paramsObject =
      params instanceof URLSearchParams ? Object.fromEntries(params.entries()) : params

    const data = schema.parse(paramsObject)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors,
      }
    }
    return {
      success: false,
      error: 'Invalid query parameters',
      details: null,
    }
  }
}
