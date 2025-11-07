/**
 * IPC Handlers
 * Handle communication between main and renderer processes
 */

import { ipcMain, BrowserWindow, dialog, app } from 'electron'
import Store from 'electron-store'
import fs from 'fs'

// Initialize electron-store
const store = new Store()

/**
 * Register all IPC handlers
 */
export function registerIPCHandlers(mainWindow: BrowserWindow) {
  /**
   * Storage operations
   */

  // Get item from store
  ipcMain.handle('store:get', async (_event, key: string) => {
    return store.get(key)
  })

  // Set item in store
  ipcMain.handle('store:set', async (_event, key: string, value: any) => {
    store.set(key, value)
    return true
  })

  // Delete item from store
  ipcMain.handle('store:delete', async (_event, key: string) => {
    store.delete(key)
    return true
  })

  // Clear all store data
  ipcMain.handle('store:clear', async () => {
    store.clear()
    return true
  })

  // Get all keys
  ipcMain.handle('store:keys', async () => {
    return Object.keys(store.store)
  })

  /**
   * Window operations
   */

  // Minimize window
  ipcMain.handle('window:minimize', () => {
    mainWindow.minimize()
  })

  // Maximize/restore window
  ipcMain.handle('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.restore()
    } else {
      mainWindow.maximize()
    }
    return mainWindow.isMaximized()
  })

  // Close window
  ipcMain.handle('window:close', () => {
    mainWindow.close()
  })

  // Check if window is maximized
  ipcMain.handle('window:isMaximized', () => {
    return mainWindow.isMaximized()
  })

  /**
   * File operations
   */

  // Open file dialog
  ipcMain.handle('dialog:openFile', async (_event, options = {}) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      ...options,
    })
    return result
  })

  // Save file dialog
  ipcMain.handle('dialog:saveFile', async (_event, options = {}) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      ...options,
    })
    return result
  })

  // Read file
  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    try {
      const data = fs.readFileSync(filePath, 'utf-8')
      return { success: true, data }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // Write file
  ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8')
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * App information
   */

  // Get app version
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  // Get app path
  ipcMain.handle('app:getPath', (_event, name: string) => {
    return app.getPath(name as any)
  })

  // Get platform
  ipcMain.handle('app:getPlatform', () => {
    return process.platform
  })

  /**
   * Notifications
   */

  // Show notification (handled by renderer, but we can add native notifications here)
  ipcMain.handle('notification:show', (_event, _options: {
    title: string
    body: string
  }) => {
    // Native notifications can be added here if needed
    // For now, we'll let the renderer handle web notifications
    return true
  })

  /**
   * Theme operations
   */

  // Get system theme
  ipcMain.handle('theme:getSystem', () => {
    return mainWindow.webContents.executeJavaScript(
      'window.matchMedia("(prefers-color-scheme: dark)").matches'
    )
  })

  console.log('IPC handlers registered successfully')
}
