/**
 * Ghostwriter Pricing Utilities
 * Industry-standard pricing calculations for per word, per page, per project, and hourly rates
 */

export type PricingModel = 'per_word' | 'per_page' | 'per_project' | 'hourly'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'professional' | 'expert'

export interface PricingGuideline {
  experience_level: ExperienceLevel
  pricing_model: PricingModel
  min_rate: number
  max_rate: number
  description: string
}

export interface WriterPricing {
  pricing_model: PricingModel
  rate_per_word?: number
  rate_per_page?: number
  rate_hourly?: number
  project_rate_min?: number
  project_rate_max?: number
  experience_level?: ExperienceLevel
}

export interface JobPricing {
  pricing_model: PricingModel
  estimated_word_count?: number
  estimated_page_count?: number
  estimated_hours?: number
  rate_offered_per_word?: number
  rate_offered_per_page?: number
  rate_offered_hourly?: number
  budget?: number
}

/**
 * Calculate estimated cost based on pricing model
 */
export function calculateEstimatedCost(pricing: JobPricing): {
  min: number
  max: number
  display: string
} {
  const { pricing_model } = pricing

  switch (pricing_model) {
    case 'per_word':
      if (pricing.estimated_word_count && pricing.rate_offered_per_word) {
        const cost = pricing.estimated_word_count * pricing.rate_offered_per_word
        return {
          min: cost,
          max: cost,
          display: `$${cost.toLocaleString()} (${pricing.estimated_word_count.toLocaleString()} words × $${pricing.rate_offered_per_word})`,
        }
      }
      break

    case 'per_page':
      if (pricing.estimated_page_count && pricing.rate_offered_per_page) {
        const cost = pricing.estimated_page_count * pricing.rate_offered_per_page
        return {
          min: cost,
          max: cost,
          display: `$${cost.toLocaleString()} (${pricing.estimated_page_count} pages × $${pricing.rate_offered_per_page})`,
        }
      }
      break

    case 'hourly':
      if (pricing.estimated_hours && pricing.rate_offered_hourly) {
        const cost = pricing.estimated_hours * pricing.rate_offered_hourly
        return {
          min: cost,
          max: cost,
          display: `$${cost.toLocaleString()} (${pricing.estimated_hours} hours × $${pricing.rate_offered_hourly}/hr)`,
        }
      }
      break

    case 'per_project':
      if (pricing.budget) {
        return {
          min: pricing.budget,
          max: pricing.budget,
          display: `$${pricing.budget.toLocaleString()}`,
        }
      }
      break
  }

  return { min: 0, max: 0, display: 'Contact for pricing' }
}

/**
 * Get recommended rate range based on experience level
 */
export function getRecommendedRates(
  experience_level: ExperienceLevel,
  pricing_model: PricingModel
): { min: number; max: number; description: string } {
  const guidelines: Record<
    ExperienceLevel,
    Record<PricingModel, { min: number; max: number; description: string }>
  > = {
    beginner: {
      per_word: {
        min: 0.1,
        max: 0.25,
        description: 'Entry-level ghostwriters, $6,000-$15,000 per book',
      },
      per_page: { min: 50, max: 100, description: 'Entry-level ghostwriters' },
      hourly: { min: 25, max: 49, description: 'Entry-level ghostwriters' },
      per_project: { min: 6000, max: 15000, description: 'Entry-level book projects' },
    },
    intermediate: {
      per_word: {
        min: 0.25,
        max: 0.5,
        description: 'Mid-range ghostwriters, $15,000-$30,000 per book',
      },
      per_page: { min: 100, max: 150, description: 'Mid-range ghostwriters' },
      hourly: { min: 49, max: 84, description: 'Mid-range ghostwriters' },
      per_project: { min: 15000, max: 30000, description: 'Mid-range book projects' },
    },
    professional: {
      per_word: {
        min: 0.5,
        max: 1.0,
        description: 'Professional ghostwriters, $30,000-$60,000 per book',
      },
      per_page: { min: 150, max: 250, description: 'Professional ghostwriters' },
      hourly: { min: 84, max: 150, description: 'Professional ghostwriters' },
      per_project: { min: 30000, max: 60000, description: 'Professional book projects' },
    },
    expert: {
      per_word: {
        min: 1.0,
        max: 2.5,
        description: 'Top-tier ghostwriters, $60,000-$150,000 per book',
      },
      per_page: { min: 250, max: 300, description: 'Top-tier ghostwriters' },
      hourly: { min: 150, max: 200, description: 'Top-tier ghostwriters' },
      per_project: { min: 60000, max: 150000, description: 'Premium/specialized book projects' },
    },
  }

  return guidelines[experience_level][pricing_model]
}

/**
 * Format pricing for display
 */
export function formatPricingDisplay(pricing: WriterPricing): string {
  const { pricing_model } = pricing

  switch (pricing_model) {
    case 'per_word':
      if (pricing.rate_per_word) {
        return `$${pricing.rate_per_word.toFixed(2)}/word`
      }
      break
    case 'per_page':
      if (pricing.rate_per_page) {
        return `$${pricing.rate_per_page.toFixed(2)}/page`
      }
      break
    case 'hourly':
      if (pricing.rate_hourly) {
        return `$${pricing.rate_hourly.toFixed(2)}/hour`
      }
      break
    case 'per_project':
      if (pricing.project_rate_min && pricing.project_rate_max) {
        return `$${pricing.project_rate_min.toLocaleString()}-$${pricing.project_rate_max.toLocaleString()}/project`
      }
      break
  }

  return 'Contact for pricing'
}

/**
 * Calculate project cost from word count
 */
export function calculateProjectCostFromWords(wordCount: number, ratePerWord: number): number {
  return wordCount * ratePerWord
}

/**
 * Calculate project cost from page count
 */
export function calculateProjectCostFromPages(pageCount: number, ratePerPage: number): number {
  return pageCount * ratePerPage
}

/**
 * Estimate page count from word count (industry standard: ~250-300 words per page)
 */
export function estimatePageCountFromWords(wordCount: number, wordsPerPage: number = 275): number {
  return Math.ceil(wordCount / wordsPerPage)
}

/**
 * Estimate word count from page count
 */
export function estimateWordCountFromPages(pageCount: number, wordsPerPage: number = 275): number {
  return pageCount * wordsPerPage
}

/**
 * Validate pricing configuration
 */
export function validateWriterPricing(pricing: WriterPricing): { valid: boolean; error?: string } {
  const { pricing_model } = pricing

  switch (pricing_model) {
    case 'per_word':
      if (!pricing.rate_per_word || pricing.rate_per_word <= 0) {
        return { valid: false, error: 'Rate per word must be greater than 0' }
      }
      if (pricing.rate_per_word > 10) {
        return { valid: false, error: 'Rate per word seems unusually high (max $10/word)' }
      }
      break

    case 'per_page':
      if (!pricing.rate_per_page || pricing.rate_per_page <= 0) {
        return { valid: false, error: 'Rate per page must be greater than 0' }
      }
      if (pricing.rate_per_page > 1000) {
        return { valid: false, error: 'Rate per page seems unusually high (max $1,000/page)' }
      }
      break

    case 'hourly':
      if (!pricing.rate_hourly || pricing.rate_hourly <= 0) {
        return { valid: false, error: 'Hourly rate must be greater than 0' }
      }
      if (pricing.rate_hourly > 500) {
        return { valid: false, error: 'Hourly rate seems unusually high (max $500/hr)' }
      }
      break

    case 'per_project':
      if (!pricing.project_rate_min || !pricing.project_rate_max) {
        return { valid: false, error: 'Project rate range required' }
      }
      if (pricing.project_rate_min > pricing.project_rate_max) {
        return { valid: false, error: 'Minimum rate cannot exceed maximum rate' }
      }
      if (pricing.project_rate_min <= 0) {
        return { valid: false, error: 'Minimum project rate must be greater than 0' }
      }
      break

    default:
      return { valid: false, error: 'Invalid pricing model' }
  }

  return { valid: true }
}

/**
 * Get pricing model display name
 */
export function getPricingModelDisplayName(model: PricingModel): string {
  const names: Record<PricingModel, string> = {
    per_word: 'Per Word',
    per_page: 'Per Page',
    per_project: 'Per Project',
    hourly: 'Hourly',
  }
  return names[model]
}

/**
 * Get experience level display name
 */
export function getExperienceLevelDisplayName(level: ExperienceLevel): string {
  const names: Record<ExperienceLevel, string> = {
    beginner: 'Beginner (0-2 years)',
    intermediate: 'Intermediate (2-5 years)',
    professional: 'Professional (5-10 years)',
    expert: 'Expert (10+ years)',
  }
  return names[level]
}
