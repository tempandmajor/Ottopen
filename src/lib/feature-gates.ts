/**
 * Feature Gates - Control access based on account tier
 */

export type AccountTier = 'free' | 'premium' | 'pro' | 'industry_basic' | 'industry_premium'
export type AccountType =
  | 'writer'
  | 'platform_agent'
  | 'external_agent'
  | 'producer'
  | 'publisher'
  | 'theater_director'
  | 'reader_evaluator'

export interface FeatureAccess {
  hasAccess: boolean
  requiredTier?: AccountTier
  message?: string
}

// Feature definitions by tier
const TIER_FEATURES = {
  free: [
    'create_scripts',
    'join_book_clubs',
    'basic_editor',
    'community_access',
    'limited_submissions', // 5 per month
  ],
  premium: [
    ...['create_scripts', 'join_book_clubs', 'basic_editor', 'community_access'],
    'ai_assistance',
    'advanced_editor',
    'unlimited_submissions',
    'priority_support',
    'analytics',
    'export_formats',
  ],
  pro: [
    ...[
      'create_scripts',
      'join_book_clubs',
      'basic_editor',
      'community_access',
      'ai_assistance',
      'advanced_editor',
      'unlimited_submissions',
      'priority_support',
      'analytics',
      'export_formats',
    ],
    'direct_industry_access',
    'marketing_tools',
    'priority_review',
    'portfolio_website',
    'contract_templates',
    'collaboration_tools',
    'mentorship',
  ],
  industry_basic: [
    'manuscript_access',
    'writer_discovery',
    'submission_tracking',
    'client_management',
    'contract_tools',
  ],
  industry_premium: [
    ...[
      'manuscript_access',
      'writer_discovery',
      'submission_tracking',
      'client_management',
      'contract_tools',
    ],
    'full_manuscript_library',
    'advanced_search',
    'acquisition_tools',
    'rights_management',
    'analytics_insights',
    'priority_access',
    'first_look_deals',
    'development_tools',
  ],
}

// Submission limits by tier
const SUBMISSION_LIMITS = {
  free: 5,
  premium: -1, // unlimited
  pro: -1, // unlimited
  industry_basic: 0, // industry doesn't submit
  industry_premium: 0,
}

/**
 * Check if user has access to a feature
 */
export function hasFeatureAccess(feature: string, userTier: AccountTier = 'free'): FeatureAccess {
  const tierFeatures = TIER_FEATURES[userTier] || []

  if (tierFeatures.includes(feature)) {
    return { hasAccess: true }
  }

  // Find minimum required tier
  const requiredTier = findRequiredTier(feature)

  return {
    hasAccess: false,
    requiredTier,
    message: `This feature requires ${requiredTier} tier or higher`,
  }
}

/**
 * Find the minimum tier that has access to a feature
 */
function findRequiredTier(feature: string): AccountTier {
  const tiers: AccountTier[] = ['free', 'premium', 'pro', 'industry_basic', 'industry_premium']

  for (const tier of tiers) {
    if (TIER_FEATURES[tier].includes(feature)) {
      return tier
    }
  }

  return 'pro' // Default to highest tier if not found
}

/**
 * Check if user can submit manuscripts
 */
export function canSubmitManuscript(
  userTier: AccountTier,
  currentSubmissions: number
): FeatureAccess {
  const limit = SUBMISSION_LIMITS[userTier]

  if (limit === -1) {
    return { hasAccess: true }
  }

  if (currentSubmissions < limit) {
    return { hasAccess: true }
  }

  return {
    hasAccess: false,
    requiredTier: 'premium',
    message: `You've reached your submission limit (${limit}/month). Upgrade to Premium for unlimited submissions.`,
  }
}

/**
 * Check if user can access manuscripts (for industry users)
 */
export function canAccessManuscripts(
  accountType: AccountType,
  userTier: AccountTier
): FeatureAccess {
  const industryTypes: AccountType[] = ['external_agent', 'producer', 'publisher', 'platform_agent']

  if (!industryTypes.includes(accountType)) {
    return {
      hasAccess: false,
      message: 'Only industry professionals can access manuscript library',
    }
  }

  // Free industry accounts have no access
  if (userTier === 'free') {
    return {
      hasAccess: false,
      requiredTier: 'industry_basic',
      message: 'Upgrade to access manuscript library',
    }
  }

  return { hasAccess: true }
}

/**
 * Check if user can post jobs
 */
export function canPostJobs(accountType: AccountType): FeatureAccess {
  // Everyone can post jobs for free
  return { hasAccess: true }
}

/**
 * Check if user can apply to jobs
 */
export function canApplyToJobs(accountType: AccountType): FeatureAccess {
  const writerTypes: AccountType[] = ['writer']

  if (writerTypes.includes(accountType)) {
    return { hasAccess: true }
  }

  return {
    hasAccess: false,
    message: 'Only writers can apply to jobs',
  }
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: AccountTier): string {
  const displayNames: Record<AccountTier, string> = {
    free: 'Free',
    premium: 'Premium',
    pro: 'Pro',
    industry_basic: 'Industry Basic',
    industry_premium: 'Industry Premium',
  }

  return displayNames[tier] || 'Unknown'
}

/**
 * Get tier badge color
 */
export function getTierBadgeColor(tier: AccountTier): string {
  const colors: Record<AccountTier, string> = {
    free: 'bg-gray-100 text-gray-800',
    premium: 'bg-blue-100 text-blue-800',
    pro: 'bg-purple-100 text-purple-800',
    industry_basic: 'bg-green-100 text-green-800',
    industry_premium: 'bg-yellow-100 text-yellow-800',
  }

  return colors[tier] || 'bg-gray-100 text-gray-800'
}

/**
 * Check if tier is industry tier
 */
export function isIndustryTier(tier: AccountTier): boolean {
  return ['industry_basic', 'industry_premium'].includes(tier)
}

/**
 * Check if tier is writer tier
 */
export function isWriterTier(tier: AccountTier): boolean {
  return ['free', 'premium', 'pro'].includes(tier)
}

/**
 * Get upgrade path for a feature
 */
export function getUpgradePath(
  feature: string,
  currentTier: AccountTier
): {
  shouldUpgrade: boolean
  targetTier?: AccountTier
  tierName?: string
  message?: string
} {
  const access = hasFeatureAccess(feature, currentTier)

  if (access.hasAccess) {
    return { shouldUpgrade: false }
  }

  return {
    shouldUpgrade: true,
    targetTier: access.requiredTier,
    tierName: getTierDisplayName(access.requiredTier!),
    message: access.message,
  }
}
