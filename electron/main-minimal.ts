import { app, BrowserWindow } from 'electron'
import path from 'node:path'

console.log('Minimal Electron starting...', new Date().toISOString())

const isDev = process.env.NODE_ENV === 'development'

app.on('ready', () => {
  console.log('Electron ready, creating minimal window...', new Date().toISOString())
  
  const win = new BrowserWindow({
    title: 'Config Hub - Loading...',
    width: 800,
    height: 600,
    show: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Load a simple HTML page
  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/loading.html'))
  }

  console.log('Window created and loading...', new Date().toISOString())
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})