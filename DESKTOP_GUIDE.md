# Desktop App Quick Start Guide

Complete guide to run and build the AI Chat Desktop application.

## ⚡ TL;DR - Chạy Nhanh

```bash
# Lần đầu tiên (from project root)
npm install
cd desktop
npm run build:main && npm run build:preload
npm run dev

# Các lần sau (chỉ cần)
cd desktop && npm run dev
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# From project root
npm install
```

### 2. First Time Setup - Build Main & Preload

**⚠️ QUAN TRỌNG:** Phải build main process và preload script trước khi chạy lần đầu!

```bash
cd desktop

# Build main process (Electron main thread)
npm run build:main

# Build preload script (security bridge)
npm run build:preload
```

Bạn chỉ cần làm bước này **1 lần** khi setup lần đầu, hoặc khi thay đổi code trong `src/main/` hoặc `src/preload/`.

### 3. Run Desktop App in Development

```bash
# From desktop folder
npm run dev

# OR from project root
npm run dev:desktop
```

The Electron app will:
1. ✅ Vite dev server starts on <http://localhost:5174>
2. ✅ Electron window opens
3. ✅ Hot reload enabled for UI changes
4. ✅ DevTools auto-opens

### Troubleshooting First Run

**Error: "Cannot find module '/path/to/dist/main/index.js'"**

Solution: Bạn chưa build main process. Chạy:

```bash
cd desktop
npm run build:main
npm run build:preload
npm run dev
```

**Error: "Electron APIs not available"**

Solution: Preload script chưa được build. Chạy:

```bash
cd desktop
npm run build:preload
npm run dev
```

## 📦 Building Desktop App

### Build for Your Platform

```bash
cd desktop

# Build and package for current platform
npm run build
npm run package
```

### Build for Specific Platforms

```bash
# macOS (DMG + ZIP)
npm run package:mac

# Windows (NSIS installer + Portable)
npm run package:win

# Linux (AppImage + DEB)
npm run package:linux
```

Built apps will be in `desktop/dist/`:
- **macOS**: `AI Chat.dmg`, `AI Chat.app.zip`
- **Windows**: `AI Chat Setup.exe`, `AI Chat.exe` (portable)
- **Linux**: `AI-Chat.AppImage`, `ai-chat_1.0.0_amd64.deb`

## 🏗️ Architecture Overview

### Electron Process Model

```
┌─────────────────────────────────────────────┐
│           Main Process (Node.js)            │
│  - Application lifecycle                    │
│  - Window management                        │
│  - IPC handlers                             │
│  - File system access                       │
│  - electron-store                           │
└──────────────────┬──────────────────────────┘
                   │
                   │ IPC (contextBridge)
                   │
┌──────────────────▼──────────────────────────┐
│        Preload Script (Isolated)            │
│  - Expose safe APIs to renderer             │
│  - window.electron.*                        │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│      Renderer Process (Chromium + React)    │
│  - Reuses web UI components                 │
│  - Desktop-specific features                │
│  - No direct Node.js access (security)      │
└─────────────────────────────────────────────┘
```

### Component Reuse

Desktop app **reuses 100% of web components**:

```typescript
// desktop/src/renderer/App.tsx
import ChatPage from '../../../web/src/pages/ChatPage'
import SettingsPage from '../../../web/src/pages/SettingsPage'

// Same components, different platform!
```

### Storage Adapter Pattern

```typescript
// Auto-detects platform
const storage = await getStorageAdapter()

// Web: localStorage
// Desktop: electron-store (persistent, encrypted)
```

## 🔧 Available Electron APIs

Access via `window.electron` in renderer:

### Storage
```typescript
await window.electron.storage.get('key')
await window.electron.storage.set('key', value)
await window.electron.storage.delete('key')
await window.electron.storage.clear()
```

### Window Controls
```typescript
await window.electron.window.minimize()
await window.electron.window.maximize()
await window.electron.window.close()
const isMax = await window.electron.window.isMaximized()
```

### File System
```typescript
// Open file
const result = await window.electron.fs.openFile({
  filters: [{ name: 'JSON', extensions: ['json'] }]
})

// Save file
const result = await window.electron.fs.saveFile({
  defaultPath: 'config.json'
})

// Read/Write
await window.electron.fs.readFile(filePath)
await window.electron.fs.writeFile(filePath, content)
```

### App Info
```typescript
const version = await window.electron.app.getVersion()
const platform = await window.electron.app.getPlatform()
const userDataPath = await window.electron.app.getPath('userData')
```

### Platform Detection
```typescript
const isElectron = window.electron.isElectron // true in desktop
const platform = window.electron.platform // 'darwin', 'win32', 'linux'
```

## 🎨 Platform-Specific Features

### Custom Title Bar (Windows/Linux)

```typescript
// desktop/src/renderer/components/DesktopTitleBar.tsx
// Automatic custom title bar with minimize/maximize/close
// macOS uses native title bar
```

### Native Notifications

```typescript
await window.electron.notification.show({
  title: 'New Message',
  body: 'You have a new chat message'
})
```

### Theme Detection

```typescript
const isDark = await window.electron.theme.getSystem()
```

## 🔐 Security Features

✅ **Context Isolation**: Renderer process isolated from Node.js
✅ **No Node Integration**: `nodeIntegration: false`
✅ **Preload Script**: Safe API exposure via contextBridge
✅ **CSP**: Content Security Policy configured
✅ **Navigation Protection**: Prevents external URL navigation

## 🧪 Testing Desktop App

### Manual Testing Checklist

- [ ] App launches successfully
- [ ] Window controls work (minimize, maximize, close)
- [ ] Storage persists across restarts
- [ ] File dialogs work
- [ ] Settings sync between web and desktop (if applicable)
- [ ] Theme changes work
- [ ] WebSocket connection to backend works
- [ ] Chat messages send and receive
- [ ] Markdown/code rendering works
- [ ] Navigation between pages works

### Test Storage Persistence

```bash
# 1. Run desktop app
npm run dev

# 2. In app: go to Settings, change configuration
# 3. Close app
# 4. Reopen app
# 5. Verify settings are persisted
```

### Test Build

```bash
# 1. Build app
cd desktop
npm run build
npm run package

# 2. Install/run the packaged app
# macOS: open dist/mac/AI\ Chat.app
# Windows: dist\win-unpacked\AI Chat.exe
# Linux: ./dist/linux-unpacked/ai-chat

# 3. Test all features
```

## 📁 Project Structure

```
desktop/
├── src/
│   ├── main/
│   │   ├── index.ts              # Main process entry
│   │   └── ipc/
│   │       └── handlers.ts       # IPC handlers
│   ├── preload/
│   │   └── index.ts              # Preload script (contextBridge)
│   ├── renderer/
│   │   ├── main.tsx              # Renderer entry
│   │   ├── App.tsx               # Main app component
│   │   └── components/
│   │       └── DesktopTitleBar.tsx
│   ├── services/
│   │   └── electronStoreAdapter.ts  # Storage adapter
│   └── types/
│       └── global.d.ts           # Type definitions
├── index.html                     # Entry HTML
├── vite.config.ts                 # Vite config
├── tsconfig.json                  # TS config (renderer)
├── tsconfig.main.json             # TS config (main)
├── tsconfig.preload.json          # TS config (preload)
├── package.json
├── electron.config.js             # Electron Builder config
└── README.md
```

## 🐛 Troubleshooting

### Issue: Electron window is blank

**Solution**:
```bash
# Check console
Open DevTools in Electron window (Cmd/Ctrl + Shift + I)

# Check Vite server is running
curl http://localhost:5174

# Restart dev server
cd desktop && npm run dev
```

### Issue: `window.electron` is undefined

**Solution**:
- Verify preload script path in `main/index.ts`
- Check `contextIsolation: true` is set
- Rebuild: `npm run build:preload`

### Issue: IPC calls fail

**Solution**:
```typescript
// Check handler is registered
console.log(await window.electron.storage.get('test'))

// If undefined, check main/ipc/handlers.ts
```

### Issue: Storage not persisting

**Solution**:
```bash
# Check electron-store location
const path = await window.electron.app.getPath('userData')
console.log(path)

# macOS: ~/Library/Application Support/AI Chat/
# Windows: %APPDATA%\AI Chat\
# Linux: ~/.config/AI Chat/
```

### Issue: Build fails

**Solution**:
```bash
# Clean and rebuild
npm run clean
npm install
npm run build

# Check Node.js version
node --version  # Should be >=20.0.0

# Install platform-specific dependencies
# macOS: No extra deps
# Windows: npm install --global windows-build-tools
# Linux: sudo apt-get install build-essential
```

## 🚀 Distribution

### Code Signing (Optional but Recommended)

#### macOS
```bash
# Get Apple Developer certificate
# Export certificate
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your-password

npm run package:mac
```

#### Windows
```bash
# Get code signing certificate
export CSC_LINK=/path/to/certificate.pfx
export CSC_KEY_PASSWORD=your-password

npm run package:win
```

### Auto-Update (Future Enhancement)

electron-builder includes auto-update support:

```typescript
// Add to main/index.ts
import { autoUpdater } from 'electron-updater'

autoUpdater.checkForUpdatesAndNotify()
```

## 📚 Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Builder](https://www.electron.build/)
- [electron-store](https://github.com/sindresorhus/electron-store)
- [Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security)

## 🎯 Next Steps

1. **Customize App Icon**: Replace `resources/icon.{icns,ico,png}`
2. **Add Auto-Update**: Configure electron-updater
3. **Add Native Menus**: Create app menu with Electron Menu API
4. **Add Tray Icon**: System tray integration
5. **Add Shortcuts**: Global keyboard shortcuts
6. **Add Deep Linking**: Handle custom URLs (`aichat://`)

---

**Enjoy your AI Chat Desktop App!** 🎉
