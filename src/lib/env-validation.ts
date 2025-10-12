/**
 * Environment Variable Validation Utility
 *
 * Provides defensive validation and sanitization for environment variables
 * to prevent common issues like trailing whitespace, newlines, etc.
 */

export interface ValidationResult {
  value: string | null
  isValid: boolean
  warnings: string[]
  errors: string[]
}

/**
 * Validate and sanitize a URL environment variable
 */
export function validateUrlEnvVar(
  key: string,
  required: boolean = false,
  protocol: 'http' | 'https' = 'https'
): ValidationResult {
  const rawValue = process.env[key]
  const warnings: string[] = []
  const errors: string[] = []

  // Check if variable exists
  if (!rawValue) {
    if (required) {
      errors.push(`Environment variable ${key} is required but not set`)
    }
    return { value: null, isValid: !required, warnings, errors }
  }

  // Check for whitespace
  const trimmedValue = rawValue.trim()
  if (trimmedValue !== rawValue) {
    warnings.push(
      `Environment variable ${key} contains leading or trailing whitespace. ` +
        `This has been automatically trimmed. Please update the value in your deployment settings.`
    )
  }

  // Check for newlines
  if (/[\r\n]/.test(rawValue)) {
    warnings.push(
      `Environment variable ${key} contains newline characters. ` +
        `These have been removed. Please update the value in your deployment settings.`
    )
  }

  // Validate URL format
  try {
    const url = new URL(trimmedValue)

    // Check protocol
    if (url.protocol !== `${protocol}:`) {
      errors.push(
        `Environment variable ${key} must use ${protocol}:// protocol. ` +
          `Received: ${url.protocol}//`
      )
      return { value: trimmedValue, isValid: false, warnings, errors }
    }

    return { value: trimmedValue, isValid: true, warnings, errors }
  } catch (err) {
    errors.push(`Environment variable ${key} is not a valid URL: ${trimmedValue}`)
    return { value: trimmedValue, isValid: false, warnings, errors }
  }
}

/**
 * Validate and sanitize a token/secret environment variable
 */
export function validateTokenEnvVar(
  key: string,
  required: boolean = false,
  minLength: number = 10
): ValidationResult {
  const rawValue = process.env[key]
  const warnings: string[] = []
  const errors: string[] = []

  // Check if variable exists
  if (!rawValue) {
    if (required) {
      errors.push(`Environment variable ${key} is required but not set`)
    }
    return { value: null, isValid: !required, warnings, errors }
  }

  // Check for whitespace
  const trimmedValue = rawValue.trim()
  if (trimmedValue !== rawValue) {
    warnings.push(
      `Environment variable ${key} contains leading or trailing whitespace. ` +
        `This has been automatically trimmed. Please update the value in your deployment settings.`
    )
  }

  // Check for newlines
  if (/[\r\n]/.test(rawValue)) {
    warnings.push(
      `Environment variable ${key} contains newline characters. ` +
        `These have been removed. Please update the value in your deployment settings.`
    )
  }

  // Check minimum length
  if (trimmedValue.length < minLength) {
    errors.push(
      `Environment variable ${key} is too short. Expected at least ${minLength} characters, ` +
        `got ${trimmedValue.length}`
    )
    return { value: trimmedValue, isValid: false, warnings, errors }
  }

  return { value: trimmedValue, isValid: true, warnings, errors }
}

/**
 * Log validation results with appropriate severity
 */
export function logValidationResult(result: ValidationResult, key: string): void {
  // Log warnings
  result.warnings.forEach(warning => {
    console.warn(`[ENV_VALIDATION] ${warning}`)
  })

  // Log errors
  result.errors.forEach(error => {
    console.error(`[ENV_VALIDATION] ${error}`)
  })

  // Log success if valid and no warnings
  if (result.isValid && result.warnings.length === 0 && result.value) {
    console.log(`[ENV_VALIDATION] ${key} validated successfully`)
  }
}

/**
 * Get validated environment variable or throw descriptive error
 */
export function getValidatedEnvVar(
  key: string,
  type: 'url' | 'token' = 'token',
  options: {
    required?: boolean
    protocol?: 'http' | 'https'
    minLength?: number
    fallback?: string
  } = {}
): string | null {
  const { required = false, protocol = 'https', minLength = 10, fallback = null } = options

  const result =
    type === 'url'
      ? validateUrlEnvVar(key, required, protocol)
      : validateTokenEnvVar(key, required, minLength)

  logValidationResult(result, key)

  if (!result.isValid) {
    if (required) {
      throw new Error(
        `Environment variable validation failed for ${key}:\n${result.errors.join('\n')}`
      )
    }
    return fallback
  }

  return result.value
}
