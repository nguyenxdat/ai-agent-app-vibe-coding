# AI Chat Desktop App

Desktop application for AI Chat built with Electron.

## ⚡ Quick Start

```bash
# Lần đầu tiên
npm install
npm run build:main && npm run build:preload
npm run dev

# Các lần sau
npm run dev
```

## Features

- ✅ Native desktop application (Windows, macOS, Linux)
- ✅ Reuses all web UI components
- ✅ Persistent storage with electron-store
- ✅ Native OS integration (file dialogs, notifications)
- ✅ Custom window controls
- ✅ Auto-updates support (configured)

## Development

### Prerequisites

- Node.js 20+
- npm 10+

### Setup & First Time Run

**IMPORTANT:** Phải build main process và preload trước khi chạy dev lần đầu!

```bash
# 1. Install dependencies (from desktop folder)
cd desktop
npm install

# 2. Build main process và preload script (BẮT BUỘC trước lần chạy đầu tiên!)
npm run build:main
npm run build:preload

# 3. Start development server
npm run dev
```

### Development Workflow

Sau khi đã build lần đầu, bạn chỉ cần:

```bash
# Chạy dev (Vite + Electron)
npm run dev
```

**Lưu ý**: Nếu bạn thay đổi code trong `src/main/` hoặc `src/preload/`, cần rebuild:

```bash
# Rebuild main process
npm run build:main

# Rebuild preload
npm run build:preload

# Sau đó chạy lại
npm run dev
```

### What Happens When You Run Dev

1. **Vite dev server** khởi động trên http://localhost:5174 (renderer process - UI)
2. **Electron** load `dist/main/index.js` (main process - đã compiled)
3. **Preload script** được inject từ `dist/preload/index.js`
4. Electron window mở và load UI từ Vite dev server
5. Hot reload enabled cho renderer process (UI changes)

### Building

```bash
# Build for current platform
npm run build
npm run package

# Build for specific platforms
npm run package:mac
npm run package:win
npm run package:linux
```

## Architecture

### Main Process (`src/main/`)
- **index.ts**: Application lifecycle, window management
- **ipc/handlers.ts**: IPC communication handlers

### Preload Script (`src/preload/`)
- **index.ts**: Exposes safe APIs to renderer (contextBridge)

### Renderer Process (`src/renderer/`)
- **main.tsx**: Entry point
- **App.tsx**: Main app component with routing
- **components/**: Desktop-specific components

### Services (`src/services/`)
- **electronStoreAdapter.ts**: Storage adapter using electron-store

## Platform Detection

The app automatically detects the platform and uses appropriate adapters:

```typescript
import { isElectron, getPlatform } from '@shared/utils/platform'

if (isElectron()) {
  // Desktop-specific code
} else {
  // Web fallback
}
```

## Storage

Desktop app uses `electron-store` for persistent storage:

```typescript
// Automatically uses ElectronStoreAdapter in desktop
const storage = await getStorageAdapter()
await storage.setItem('key', value)
```

## IPC Communication

Renderer communicates with main process via IPC:

```typescript
// In renderer
const result = await window.electron.storage.get('key')
await window.electron.window.maximize()
const platform = window.electron.platform
```

## Security

- Context Isolation: ✅ Enabled
- Node Integration: ❌ Disabled in renderer
- Sandbox: Controlled
- CSP: Configured
- Navigation Protection: ✅ Enabled

## Distribution

Configured with `electron-builder` for:
- macOS: DMG, ZIP
- Windows: NSIS installer, Portable
- Linux: AppImage, DEB

## Project Structure

```
desktop/
├── src/
│   ├── main/           # Main process
│   │   ├── index.ts
│   │   └── ipc/
│   ├── preload/        # Preload script
│   │   └── index.ts
│   ├── renderer/       # Renderer process (UI)
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   └── components/
│   ├── services/       # Desktop services
│   │   └── electronStoreAdapter.ts
│   └── types/          # Type definitions
│       └── global.d.ts
├── index.html          # Entry HTML
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript config (renderer)
├── tsconfig.main.json  # TypeScript config (main)
├── tsconfig.preload.json # TypeScript config (preload)
├── package.json
└── electron.config.js  # Electron Builder config
```

## Troubleshooting

### Development Server Won't Start

Check port 5174 is not in use:
```bash
lsof -i :5174
```

### Electron Window is Blank

Check console for errors:
- Open DevTools (automatically opened in dev mode)
- Check network tab for loading errors

### IPC Not Working

Verify preload script is loaded:
```typescript
console.log('Electron available:', !!window.electron)
```

## Scripts Reference

- `npm run dev` - Start development (Vite + Electron)
- `npm run dev:vite` - Start Vite dev server only
- `npm run dev:electron` - Start Electron only
- `npm run build` - Build all (renderer, main, preload)
- `npm run build:renderer` - Build renderer with Vite
- `npm run build:main` - Build main process
- `npm run build:preload` - Build preload script
- `npm run package` - Package for current platform
- `npm run clean` - Clean build artifacts
