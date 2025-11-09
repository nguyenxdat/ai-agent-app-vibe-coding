/**
 * Validation Utilities
 * Common validation functions for forms and inputs
 */

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false

  try {
    const urlObj = new URL(url)

    // Check protocol
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(urlObj.protocol)) {
      return false
    }

    // Check hostname exists
    if (!urlObj.hostname) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Validate HTTP/HTTPS URL specifically
 */
export function isValidHttpUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false

  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Validate WebSocket URL
 */
export function isValidWebSocketUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false

  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'ws:' || urlObj.protocol === 'wss:'
  } catch {
    return false
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate required field (not empty)
 */
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

/**
 * Validate string length
 */
export function isValidLength(
  value: string,
  min?: number,
  max?: number
): { valid: boolean; error?: string } {
  const length = value?.length || 0

  if (min !== undefined && length < min) {
    return { valid: false, error: `Minimum length is ${min} characters` }
  }

  if (max !== undefined && length > max) {
    return { valid: false, error: `Maximum length is ${max} characters` }
  }

  return { valid: true }
}

/**
 * Validate number range
 */
export function isInRange(
  value: number,
  min?: number,
  max?: number
): { valid: boolean; error?: string } {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: 'Must be a valid number' }
  }

  if (min !== undefined && value < min) {
    return { valid: false, error: `Minimum value is ${min}` }
  }

  if (max !== undefined && value > max) {
    return { valid: false, error: `Maximum value is ${max}` }
  }

  return { valid: true }
}

/**
 * Validate JSON string
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

/**
 * Sanitize URL (remove dangerous protocols)
 */
export function sanitizeUrl(url: string): string {
  if (!url) return ''

  try {
    const urlObj = new URL(url)

    // Only allow safe protocols
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(urlObj.protocol)) {
      return ''
    }

    return urlObj.toString()
  } catch {
    return ''
  }
}

/**
 * Validate agent endpoint URL
 */
export function validateAgentUrl(url: string): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: 'URL is required' }
  }

  if (!isValidHttpUrl(url)) {
    return { valid: false, error: 'Must be a valid HTTP or HTTPS URL' }
  }

  // Check for localhost/127.0.0.1 in production (optional warning)
  const urlObj = new URL(url)
  if (
    process.env.NODE_ENV === 'production' &&
    (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1')
  ) {
    return {
      valid: true,
      error: 'Warning: Using localhost URL in production may not work',
    }
  }

  return { valid: true }
}

/**
 * Form validation helper
 */
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

export function validateField(
  value: any,
  rules: ValidationRule
): { valid: boolean; error?: string } {
  // Required check
  if (rules.required && !isRequired(value)) {
    return { valid: false, error: 'This field is required' }
  }

  // If not required and empty, skip other validations
  if (!rules.required && !isRequired(value)) {
    return { valid: true }
  }

  // Length validation for strings
  if (typeof value === 'string') {
    const lengthCheck = isValidLength(value, rules.minLength, rules.maxLength)
    if (!lengthCheck.valid) {
      return lengthCheck
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return { valid: false, error: 'Invalid format' }
    }
  }

  // Custom validation
  if (rules.custom) {
    const result = rules.custom(value)
    if (result === false) {
      return { valid: false, error: 'Validation failed' }
    }
    if (typeof result === 'string') {
      return { valid: false, error: result }
    }
  }

  return { valid: true }
}

/**
 * Example usage:
 *
 * ```typescript
 * // URL validation
 * if (!isValidUrl(endpointUrl)) {
 *   setError('Please enter a valid URL')
 * }
 *
 * // Form field validation
 * const validation = validateField(name, {
 *   required: true,
 *   minLength: 3,
 *   maxLength: 50,
 * })
 *
 * if (!validation.valid) {
 *   setError(validation.error)
 * }
 *
 * // Agent URL validation
 * const urlValidation = validateAgentUrl(url)
 * if (!urlValidation.valid) {
 *   setError(urlValidation.error)
 * }
 * ```
 */
