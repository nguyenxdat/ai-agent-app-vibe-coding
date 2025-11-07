/**
 * Desktop Title Bar Component
 * Custom window controls for Electron app
 */

import { useState, useEffect } from 'react'
import { Minimize2, Maximize2, X } from 'lucide-react'

export default function DesktopTitleBar() {
  const [_isMaximized, setIsMaximized] = useState(false)
  const isMac = window.electron?.platform === 'darwin'

  useEffect(() => {
    // Check initial maximized state
    if (window.electron) {
      window.electron.window.isMaximized().then(setIsMaximized)
    }
  }, [])

  const handleMinimize = () => {
    window.electron?.window.minimize()
  }

  const handleMaximize = async () => {
    const maximized = await window.electron?.window.maximize()
    setIsMaximized(maximized)
  }

  const handleClose = () => {
    window.electron?.window.close()
  }

  // macOS: Show minimal title bar with padding for traffic lights
  if (isMac) {
    return (
      <div className="flex items-center h-12 bg-background border-b border-border select-none drag-region">
        {/* Left padding for macOS traffic lights (red/yellow/green) */}
        <div className="w-20"></div>

        {/* App title - centered */}
        <div className="flex-1 text-center text-sm font-medium">
          AI Chat
        </div>

        {/* Right padding for symmetry */}
        <div className="w-20"></div>

        <style>{`
          .drag-region {
            -webkit-app-region: drag;
          }
        `}</style>
      </div>
    )
  }

  // Windows/Linux: Full custom title bar with controls
  return (
    <div className="flex items-center justify-between h-8 bg-background border-b border-border select-none drag-region">
      {/* App title */}
      <div className="flex-1 px-4 text-sm font-medium">
        AI Chat
      </div>

      {/* Window controls */}
      <div className="flex no-drag-region">
        <button
          className="h-8 w-10 flex items-center justify-center hover:bg-accent transition-colors"
          onClick={handleMinimize}
          aria-label="Minimize"
        >
          <Minimize2 className="h-4 w-4" />
        </button>
        <button
          className="h-8 w-10 flex items-center justify-center hover:bg-accent transition-colors"
          onClick={handleMaximize}
          aria-label="Maximize"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <button
          className="h-8 w-10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
          onClick={handleClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <style>{`
        .drag-region {
          -webkit-app-region: drag;
        }
        .no-drag-region {
          -webkit-app-region: no-drag;
        }
      `}</style>
    </div>
  )
}
