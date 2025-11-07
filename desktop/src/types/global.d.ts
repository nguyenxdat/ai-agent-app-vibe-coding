/**
 * Global Type Definitions for Desktop App
 * Extends Window interface with Electron APIs
 */

import type { ElectronAPI } from '../preload/index'

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export {}
