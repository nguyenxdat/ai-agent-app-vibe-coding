/**
 * Desktop Renderer Entry Point
 * This is the main entry point for the Electron renderer process
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '../../../web/src/styles/globals.css' // Reuse web styles

// Verify Electron context
if (!window.electron) {
  console.error('Electron APIs not available!')
}

console.log('Running on Electron:', window.electron?.isElectron)
console.log('Platform:', window.electron?.platform)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
