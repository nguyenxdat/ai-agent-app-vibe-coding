/**
 * Electron Main Process
 * Handles application lifecycle, window management, and native OS integration
 */

import { app, BrowserWindow } from 'electron'
import path from 'path'
import { registerIPCHandlers } from './ipc/handlers'

// Keep a global reference to prevent garbage collection
let mainWindow: BrowserWindow | null = null

// Development mode check
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Application configuration
const APP_CONFIG = {
  width: 1200,
  height: 800,
  minWidth: 800,
  minHeight: 600,
}

/**
 * Create the main application window
 */
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: APP_CONFIG.width,
    height: APP_CONFIG.height,
    minWidth: APP_CONFIG.minWidth,
    minHeight: APP_CONFIG.minHeight,
    title: 'AI Chat',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true, // Security: isolate context
      nodeIntegration: false, // Security: disable node in renderer
      sandbox: false, // Required for preload script
    },
    // Custom title bar configuration
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    // Remove frame on Windows/Linux for custom title bar
    frame: process.platform === 'darwin' ? true : false,
    backgroundColor: '#ffffff',
    show: false, // Don't show until ready
  })

  // Load the app
  if (isDev) {
    // Development: load from vite dev server
    mainWindow.loadURL('http://localhost:5174')
    // Open DevTools
    mainWindow.webContents.openDevTools()
  } else {
    // Production: load from built files
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'))
  }

  // Show window when ready to avoid flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Register IPC handlers
  registerIPCHandlers(mainWindow)
}

/**
 * Application lifecycle events
 */

// When Electron has finished initialization
app.whenReady().then(() => {
  createWindow()

  // On macOS, re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Cleanup before quit
app.on('before-quit', () => {
  // Cleanup resources
  mainWindow = null
})

/**
 * Security: Prevent navigation to external URLs
 */
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)

    // Allow navigation within the app
    if (isDev && parsedUrl.origin === 'http://localhost:5174') {
      return
    }

    // Prevent all other navigation
    event.preventDefault()
  })
})

/**
 * Error handling
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error)
})
