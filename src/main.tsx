import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from './components/theme-provider'
import './index.css'

// Remove Preload scripts loading
postMessage({ payload: 'removeLoading' }, '*')

// Use contextBridge
if (window.electronAPI) {
  window.electronAPI.on('main-process-message', (message) => {
    console.log(message)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="electron-ui-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)