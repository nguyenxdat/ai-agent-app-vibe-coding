/**
 * Desktop App Component
 * Main application component for Electron renderer
 * Reuses shared components from web app
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '../../../web/src/components/ui/theme-provider'

// Import pages from web (reuse everything!)
import { ChatPage } from '../../../web/src/pages/ChatPage'
import { SettingsPage } from '../../../web/src/pages/SettingsPage'

// Desktop-specific components
import DesktopTitleBar from './components/DesktopTitleBar'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ai-chat-desktop-theme">
      <BrowserRouter>
        <div className="flex flex-col h-screen">
          {/* Custom title bar for desktop */}
          <DesktopTitleBar />

          {/* Main content - reuse web pages */}
          <div className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Navigate to="/chat" replace />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
