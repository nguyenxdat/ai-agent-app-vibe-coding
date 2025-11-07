/**
 * Electron Preload Script
 * Exposes safe APIs to the renderer process
 * This runs in an isolated context with access to both Node.js and DOM APIs
 */

import { contextBridge, ipcRenderer } from 'electron'

/**
 * Storage API
 * Provides access to electron-store for persistent data
 */
const storageAPI = {
  get: (key: string) => ipcRenderer.invoke('store:get', key),
  set: (key: string, value: any) => ipcRenderer.invoke('store:set', key, value),
  delete: (key: string) => ipcRenderer.invoke('store:delete', key),
  clear: () => ipcRenderer.invoke('store:clear'),
  keys: () => ipcRenderer.invoke('store:keys'),
}

/**
 * Window API
 * Provides window control operations
 */
const windowAPI = {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
}

/**
 * File System API
 * Provides safe file operations
 */
const fileSystemAPI = {
  openFile: (options?: any) => ipcRenderer.invoke('dialog:openFile', options),
  saveFile: (options?: any) => ipcRenderer.invoke('dialog:saveFile', options),
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('fs:writeFile', filePath, content),
}

/**
 * App API
 * Provides application information
 */
const appAPI = {
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
}

/**
 * Notification API
 * Provides notification operations
 */
const notificationAPI = {
  show: (options: { title: string; body: string }) =>
    ipcRenderer.invoke('notification:show', options),
}

/**
 * Theme API
 * Provides theme operations
 */
const themeAPI = {
  getSystem: () => ipcRenderer.invoke('theme:getSystem'),
}

/**
 * Expose APIs to renderer process
 */
contextBridge.exposeInMainWorld('electron', {
  storage: storageAPI,
  window: windowAPI,
  fs: fileSystemAPI,
  app: appAPI,
  notification: notificationAPI,
  theme: themeAPI,
  // Platform detection
  platform: process.platform,
  isElectron: true,
})

/**
 * Type definitions for exposed API
 * These will be available in the renderer process
 */
export interface ElectronAPI {
  storage: typeof storageAPI
  window: typeof windowAPI
  fs: typeof fileSystemAPI
  app: typeof appAPI
  notification: typeof notificationAPI
  theme: typeof themeAPI
  platform: NodeJS.Platform
  isElectron: boolean
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    electron: ElectronAPI
  }
}
