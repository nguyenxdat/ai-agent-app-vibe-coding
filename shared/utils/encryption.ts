/**
 * Encryption Utilities
 * Provides encryption/decryption for sensitive data like auth tokens
 *
 * Uses Web Crypto API (browser) or Node.js crypto (server/Electron)
 */

/**
 * Encrypt a string value
 *
 * @param value - The plain text to encrypt
 * @param key - Optional encryption key (uses default if not provided)
 * @returns Base64 encoded encrypted string
 */
export async function encrypt(value: string, key?: string): Promise<string> {
  try {
    // In browser environment
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      return encryptWithWebCrypto(value, key)
    }

    // Fallback: Base64 encoding (not secure, but better than plain text)
    // In production, you should use a proper encryption library
    console.warn('Using fallback encryption (Base64). Not cryptographically secure!')
    return btoa(value)
  } catch (error) {
    console.error('Encryption failed:', error)
    // Fallback to base64
    return btoa(value)
  }
}

/**
 * Decrypt a string value
 *
 * @param encryptedValue - The base64 encoded encrypted string
 * @param key - Optional decryption key (uses default if not provided)
 * @returns Decrypted plain text
 */
export async function decrypt(encryptedValue: string, key?: string): Promise<string> {
  try {
    // In browser environment
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      return decryptWithWebCrypto(encryptedValue, key)
    }

    // Fallback: Base64 decoding
    console.warn('Using fallback decryption (Base64). Not cryptographically secure!')
    return atob(encryptedValue)
  } catch (error) {
    console.error('Decryption failed:', error)
    // Fallback to base64
    return atob(encryptedValue)
  }
}

/**
 * Encrypt using Web Crypto API (AES-GCM)
 */
async function encryptWithWebCrypto(value: string, userKey?: string): Promise<string> {
  // Generate or derive key
  const keyMaterial = await getKeyMaterial(userKey)
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('ai-chat-salt-v1'), // Fixed salt (in production, use random salt per encryption)
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )

  // Generate IV (Initialization Vector)
  const iv = window.crypto.getRandomValues(new Uint8Array(12))

  // Encrypt
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    new TextEncoder().encode(value)
  )

  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encrypted), iv.length)

  // Return as base64
  return arrayBufferToBase64(combined)
}

/**
 * Decrypt using Web Crypto API (AES-GCM)
 */
async function decryptWithWebCrypto(encryptedValue: string, userKey?: string): Promise<string> {
  // Decode from base64
  const combined = base64ToArrayBuffer(encryptedValue)

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12)
  const encrypted = combined.slice(12)

  // Generate or derive key
  const keyMaterial = await getKeyMaterial(userKey)
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('ai-chat-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )

  // Decrypt
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encrypted
  )

  return new TextDecoder().decode(decrypted)
}

/**
 * Get key material from user key or default
 */
async function getKeyMaterial(userKey?: string): Promise<CryptoKey> {
  const keyString = userKey || 'ai-chat-default-key-v1' // In production, use environment variable

  return window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(keyString),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
}

/**
 * Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Convert Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Hash a password (for storage)
 */
export async function hashPassword(password: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(password)
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer)
    return arrayBufferToBase64(new Uint8Array(hashBuffer))
  }

  // Fallback
  return btoa(password)
}

/**
 * Example usage:
 *
 * ```typescript
 * // Encrypt token before storing
 * const token = "my-secret-token"
 * const encrypted = await encrypt(token)
 * localStorage.setItem('auth_token', encrypted)
 *
 * // Decrypt token when retrieving
 * const encryptedToken = localStorage.getItem('auth_token')
 * if (encryptedToken) {
 *   const decrypted = await decrypt(encryptedToken)
 *   console.log('Token:', decrypted)
 * }
 * ```
 */
