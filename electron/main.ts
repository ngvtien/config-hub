import { app, BrowserWindow, shell, ipcMain, nativeTheme } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { setupArgoCDHandlers } from './argocd-handler'
import { setupVaultHandlers } from './vault-handler'
import { setupUserHandlers } from './user-handler'
import { setupSimpleGitHandlers } from './simple-git-handler'
import { setupSimpleHelmHandlers } from './simple-helm-handler'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main.js    > Electron-Main
// │ └─┬ preload.js > Preload-Scripts
// ├─┬ dist
// │ └── index.html  > Electron-Renderer
//
process.env.DIST_ELECTRON = path.join(__dirname, '../')
process.env.DIST = path.join(process.env.DIST_ELECTRON, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (process.platform === 'win32') app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Install "react devtools"
if (process.env.NODE_ENV === 'development') {
  app.whenReady().then(() => {
    // Install React Developer Tools
    // Note: You might need to install react-devtools-electron for this to work
  })
}

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = path.join(__dirname, '../dist-electron/preload.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = path.join(process.env.DIST, 'index.html')

// Window state management
const windowStateKeeper = {
  file: path.join(app.getPath('userData'), 'window-state.json'),
  
  get(): { x?: number; y?: number; width: number; height: number; isMaximized?: boolean } {
    try {
      const data = fs.readFileSync(this.file, 'utf8')
      return JSON.parse(data)
    } catch {
      return { width: 1200, height: 800 }
    }
  },
  
  set(bounds: { x: number; y: number; width: number; height: number }, isMaximized: boolean) {
    try {
      fs.writeFileSync(this.file, JSON.stringify({ ...bounds, isMaximized }))
    } catch (error) {
      console.error('Failed to save window state:', error)
    }
  }
}

async function createWindow() {
  const windowState = windowStateKeeper.get()
  
  win = new BrowserWindow({
    title: 'Electron React App',
    icon: path.join(process.env.VITE_PUBLIC, 'electron.svg'),
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 800,
    minHeight: 600,
    show: false, // Don't show until ready
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Restore maximized state
  if (windowState.isMaximized) {
    win.maximize()
  }

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win?.show()
    
    // Restore zoom level
    const savedZoom = zoomStateKeeper.get().zoomLevel
    win?.webContents.setZoomLevel(savedZoom)
  })

  // Save window state on resize/move
  const saveWindowState = () => {
    if (!win) return
    const bounds = win.getBounds()
    const isMaximized = win.isMaximized()
    windowStateKeeper.set(bounds, isMaximized)
  }

  win.on('resize', saveWindowState)
  win.on('move', saveWindowState)
  win.on('maximize', saveWindowState)
  win.on('unmaximize', saveWindowState)

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(url)
    // Only open dev tools in development if explicitly needed
    // win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  createWindow()
  setupArgoCDHandlers()
  setupVaultHandlers()
  setupUserHandlers()
  setupSimpleGitHandlers()
  setupSimpleHelmHandlers()
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  // Clean up any resources before quitting
  if (win) {
    win.removeAllListeners('close')
    win.close()
  }
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// Theme management
ipcMain.handle('get-theme', () => {
  return nativeTheme.themeSource
})

ipcMain.handle('set-theme', (_, theme: 'system' | 'light' | 'dark') => {
  nativeTheme.themeSource = theme
  return nativeTheme.themeSource
})

ipcMain.handle('get-should-use-dark-colors', () => {
  return nativeTheme.shouldUseDarkColors
})

// Listen for theme changes
nativeTheme.on('updated', () => {
  win?.webContents.send('theme-updated', nativeTheme.shouldUseDarkColors)
})

// Zoom management
const zoomStateKeeper = {
  file: path.join(app.getPath('userData'), 'zoom-state.json'),
  
  get(): { zoomLevel: number } {
    try {
      const data = fs.readFileSync(this.file, 'utf8')
      const parsed = JSON.parse(data)
      // Ensure zoom level is within reasonable bounds
      const zoomLevel = Math.max(-5, Math.min(5, parsed.zoomLevel || 0))
      return { zoomLevel }
    } catch {
      return { zoomLevel: 0 }
    }
  },
  
  set(zoomLevel: number) {
    try {
      // Clamp zoom level to reasonable bounds
      const clampedZoom = Math.max(-5, Math.min(5, zoomLevel))
      fs.writeFileSync(this.file, JSON.stringify({ zoomLevel: clampedZoom }))
    } catch (error) {
      console.error('Failed to save zoom state:', error)
    }
  }
}

// Sidebar state management
const sidebarStateKeeper = {
  file: path.join(app.getPath('userData'), 'sidebar-state.json'),
  
  get(): { isCollapsed: boolean } {
    try {
      const data = fs.readFileSync(this.file, 'utf8')
      const parsed = JSON.parse(data)
      return { isCollapsed: parsed.isCollapsed || false }
    } catch {
      return { isCollapsed: false }
    }
  },
  
  set(isCollapsed: boolean) {
    try {
      fs.writeFileSync(this.file, JSON.stringify({ isCollapsed }))
    } catch (error) {
      console.error('Failed to save sidebar state:', error)
    }
  }
}

ipcMain.handle('get-zoom-level', () => {
  return zoomStateKeeper.get().zoomLevel
})

ipcMain.handle('set-zoom-level', (_, zoomLevel: number) => {
  if (!win) return 0
  
  const clampedZoom = Math.max(-5, Math.min(5, zoomLevel))
  win.webContents.setZoomLevel(clampedZoom)
  zoomStateKeeper.set(clampedZoom)
  
  return clampedZoom
})

ipcMain.handle('zoom-in', () => {
  if (!win) return 0
  
  const currentZoom = win.webContents.getZoomLevel()
  const newZoom = Math.min(5, currentZoom + 0.5)
  win.webContents.setZoomLevel(newZoom)
  zoomStateKeeper.set(newZoom)
  
  return newZoom
})

ipcMain.handle('zoom-out', () => {
  if (!win) return 0
  
  const currentZoom = win.webContents.getZoomLevel()
  const newZoom = Math.max(-5, currentZoom - 0.5)
  win.webContents.setZoomLevel(newZoom)
  zoomStateKeeper.set(newZoom)
  
  return newZoom
})

ipcMain.handle('zoom-reset', () => {
  if (!win) return 0
  
  win.webContents.setZoomLevel(0)
  zoomStateKeeper.set(0)
  
  return 0
})

// Sidebar state management
ipcMain.handle('get-sidebar-state', () => {
  return sidebarStateKeeper.get().isCollapsed
})

ipcMain.handle('set-sidebar-state', (_, isCollapsed: boolean) => {
  sidebarStateKeeper.set(isCollapsed)
  return isCollapsed
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})