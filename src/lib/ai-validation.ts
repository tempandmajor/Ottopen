/**
 * AI Request Validation Utility
 * Provides input validation for AI API routes to prevent abuse and cost overruns
 */

export const AI_VALIDATION_LIMITS = {
  MAX_PROMPT_LENGTH: 10000,
  MAX_TEXT_LENGTH: 50000,
  MAX_TITLE_LENGTH: 500,
  MIN_PROMPT_LENGTH: 3,
} as const

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  sanitized?: {
    prompt?: string
    text?: string
    title?: string
  }
}

/**
 * Validate and sanitize AI prompt input
 */
export function validateAIPrompt(prompt: unknown): ValidationResult {
  const errors: ValidationError[] = []

  // Check if prompt exists
  if (!prompt) {
    errors.push({ field: 'prompt', message: 'Prompt is required' })
    return { valid: false, errors }
  }

  // Check if prompt is a string
  if (typeof prompt !== 'string') {
    errors.push({ field: 'prompt', message: 'Prompt must be a string' })
    return { valid: false, errors }
  }

  // Check minimum length
  if (prompt.trim().length < AI_VALIDATION_LIMITS.MIN_PROMPT_LENGTH) {
    errors.push({
      field: 'prompt',
      message: `Prompt must be at least ${AI_VALIDATION_LIMITS.MIN_PROMPT_LENGTH} characters`,
    })
    return { valid: false, errors }
  }

  // Check maximum length
  if (prompt.length > AI_VALIDATION_LIMITS.MAX_PROMPT_LENGTH) {
    errors.push({
      field: 'prompt',
      message: `Prompt must be less than ${AI_VALIDATION_LIMITS.MAX_PROMPT_LENGTH} characters`,
    })
    return { valid: false, errors }
  }

  // Sanitize prompt
  const sanitizedPrompt = prompt.trim().substring(0, AI_VALIDATION_LIMITS.MAX_PROMPT_LENGTH)

  return {
    valid: true,
    errors: [],
    sanitized: { prompt: sanitizedPrompt },
  }
}

/**
 * Validate and sanitize text input for AI processing
 */
export function validateAIText(text: unknown): ValidationResult {
  const errors: ValidationError[] = []

  // Check if text exists
  if (!text) {
    errors.push({ field: 'text', message: 'Text is required' })
    return { valid: false, errors }
  }

  // Check if text is a string
  if (typeof text !== 'string') {
    errors.push({ field: 'text', message: 'Text must be a string' })
    return { valid: false, errors }
  }

  // Check minimum length
  if (text.trim().length < AI_VALIDATION_LIMITS.MIN_PROMPT_LENGTH) {
    errors.push({
      field: 'text',
      message: `Text must be at least ${AI_VALIDATION_LIMITS.MIN_PROMPT_LENGTH} characters`,
    })
    return { valid: false, errors }
  }

  // Check maximum length
  if (text.length > AI_VALIDATION_LIMITS.MAX_TEXT_LENGTH) {
    errors.push({
      field: 'text',
      message: `Text must be less than ${AI_VALIDATION_LIMITS.MAX_TEXT_LENGTH} characters`,
    })
    return { valid: false, errors }
  }

  // Sanitize text
  const sanitizedText = text.trim().substring(0, AI_VALIDATION_LIMITS.MAX_TEXT_LENGTH)

  return {
    valid: true,
    errors: [],
    sanitized: { text: sanitizedText },
  }
}

/**
 * Validate AI request body with multiple fields
 */
export function validateAIRequest(body: any): ValidationResult {
  const errors: ValidationError[] = []
  const sanitized: any = {}

  // Validate prompt if present
  if ('prompt' in body) {
    const promptValidation = validateAIPrompt(body.prompt)
    if (!promptValidation.valid) {
      errors.push(...promptValidation.errors)
    } else if (promptValidation.sanitized?.prompt) {
      sanitized.prompt = promptValidation.sanitized.prompt
    }
  }

  // Validate text if present
  if ('text' in body) {
    const textValidation = validateAIText(body.text)
    if (!textValidation.valid) {
      errors.push(...textValidation.errors)
    } else if (textValidation.sanitized?.text) {
      sanitized.text = textValidation.sanitized.text
    }
  }

  // Validate title if present
  if ('title' in body && body.title) {
    if (typeof body.title !== 'string') {
      errors.push({ field: 'title', message: 'Title must be a string' })
    } else if (body.title.length > AI_VALIDATION_LIMITS.MAX_TITLE_LENGTH) {
      errors.push({
        field: 'title',
        message: `Title must be less than ${AI_VALIDATION_LIMITS.MAX_TITLE_LENGTH} characters`,
      })
    } else {
      sanitized.title = body.title.trim().substring(0, AI_VALIDATION_LIMITS.MAX_TITLE_LENGTH)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  }
}

/**
 * Helper to return validation error response
 */
export function validationErrorResponse(errors: ValidationError[]) {
  return {
    error: 'Validation failed',
    details: errors,
  }
}
