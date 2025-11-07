/**
 * Platform Detection Utility
 * Detects runtime platform (Web vs Desktop/Electron)
 */

export type Platform = 'web' | 'desktop'
export type OS = 'windows' | 'macos' | 'linux' | 'unknown'

/**
 * Check if running in Electron
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!(window as any).electron
}

/**
 * Get current platform
 */
export function getPlatform(): Platform {
  return isElectron() ? 'desktop' : 'web'
}

/**
 * Get operating system
 */
export function getOS(): OS {
  if (typeof window === 'undefined') return 'unknown'

  // Check Electron first
  if (isElectron()) {
    const platform = (window as any).electron?.platform
    if (platform === 'win32') return 'windows'
    if (platform === 'darwin') return 'macos'
    if (platform === 'linux') return 'linux'
  }

  // Fallback to user agent
  const userAgent = window.navigator.userAgent.toLowerCase()
  if (userAgent.includes('win')) return 'windows'
  if (userAgent.includes('mac')) return 'macos'
  if (userAgent.includes('linux')) return 'linux'

  return 'unknown'
}

/**
 * Check if running on macOS
 */
export function isMacOS(): boolean {
  return getOS() === 'macos'
}

/**
 * Check if running on Windows
 */
export function isWindows(): boolean {
  return getOS() === 'windows'
}

/**
 * Check if running on Linux
 */
export function isLinux(): boolean {
  return getOS() === 'linux'
}

/**
 * Get platform-specific information
 */
export function getPlatformInfo() {
  return {
    platform: getPlatform(),
    os: getOS(),
    isElectron: isElectron(),
    isMacOS: isMacOS(),
    isWindows: isWindows(),
    isLinux: isLinux(),
  }
}

/**
 * Platform-specific class names for styling
 */
export function getPlatformClasses(): string {
  const classes: string[] = []
  const platform = getPlatform()
  const os = getOS()

  classes.push(`platform-${platform}`)
  classes.push(`os-${os}`)

  if (isElectron()) {
    classes.push('is-electron')
  }

  return classes.join(' ')
}
