/**
 * Electron configuration
 * Build và package configuration cho desktop app
 */

module.exports = {
  // App ID
  appId: 'com.aichat.app',

  // Product name
  productName: 'AI Chat',

  // Directories
  directories: {
    output: 'dist',
    buildResources: 'resources',
  },

  // Files to include
  files: [
    'dist/**/*',
    'node_modules/**/*',
    'package.json',
  ],

  // Platform specific config
  mac: {
    category: 'public.app-category.productivity',
    target: ['dmg', 'zip'],
    icon: 'resources/icon.icns',
  },

  win: {
    target: ['nsis', 'portable'],
    icon: 'resources/icon.ico',
  },

  linux: {
    target: ['AppImage', 'deb'],
    category: 'Utility',
    icon: 'resources/icon.png',
  },

  // NSIS installer config (Windows)
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },
}
