import { app, BrowserWindow, shell, ipcMain, nativeTheme } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

// Defer handler imports to speed up startup


const __dirname = path.dirname(fileURLToPath(import.meta.url))

console.log('Electron main process starting...', new Date().toISOString())

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main.js    > Electron-Main
// │ └─┬ preload.js > Preload-Scripts
// ├─┬ dist
// │ └── index.html  > Electron-Renderer
//
// Handle both development and production paths
const isDev = process.env.NODE_ENV === 'development' || !!process.env.VITE_DEV_SERVER_URL

let DIST_ELECTRON: string
let DIST: string
let VITE_PUBLIC: string

if (isDev) {
  // Development paths
  DIST_ELECTRON = path.join(__dirname, '../')
  DIST = path.join(DIST_ELECTRON, '../dist')
  VITE_PUBLIC = path.join(DIST_ELECTRON, '../public')
} else {
  // Production paths - when packaged, resources are in extraResources
  DIST_ELECTRON = __dirname
  DIST = path.join(__dirname, '../dist')
  VITE_PUBLIC = path.join(process.resourcesPath, 'public')
}

process.env.DIST_ELECTRON = DIST_ELECTRON
process.env.DIST = DIST
process.env.VITE_PUBLIC = VITE_PUBLIC

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

// Try to speed up startup
app.commandLine.appendSwitch('disable-background-timer-throttling')
app.commandLine.appendSwitch('disable-renderer-backgrounding')
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows')
app.commandLine.appendSwitch('disable-dev-shm-usage')
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-web-security')

console.log('Command line switches applied...', new Date().toISOString())

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
const preload = isDev
  ? path.join(__dirname, '../dist-electron/preload.js')
  : path.join(__dirname, 'preload.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = path.join(DIST, 'index.html')

// Optimized window state management - non-blocking
const windowStateKeeper = {
  file: path.join(app.getPath('userData'), 'window-state.json'),
  defaultState: { width: 1200, height: 800 },

  get(): { x?: number; y?: number; width: number; height: number; isMaximized?: boolean } {
    // Return default state immediately, load saved state asynchronously
    const state = { ...this.defaultState }

    // Load saved state in background
    setImmediate(() => {
      try {
        const data = fs.readFileSync(this.file, 'utf8')
        const savedState = JSON.parse(data)
        if (win && !win.isDestroyed()) {
          if (savedState.isMaximized) {
            win.maximize()
          } else if (savedState.x !== undefined && savedState.y !== undefined) {
            win.setBounds({
              x: savedState.x,
              y: savedState.y,
              width: savedState.width || this.defaultState.width,
              height: savedState.height || this.defaultState.height
            })
          }
        }
      } catch {
        // Ignore errors, use default state
      }
    })

    return state
  },

  set(bounds: { x: number; y: number; width: number; height: number }, isMaximized: boolean) {
    // Save asynchronously to avoid blocking
    setImmediate(() => {
      try {
        fs.writeFileSync(this.file, JSON.stringify({ ...bounds, isMaximized }))
      } catch (error) {
        console.error('Failed to save window state:', error)
      }
    })
  }
}

function createWindow() {
  console.log('Creating window...', new Date().toISOString())
  const windowState = windowStateKeeper.get()

  win = new BrowserWindow({
    title: 'Config Hub',
    // Remove icon for faster startup - set it later
    width: windowState.width,
    height: windowState.height,
    minWidth: 800,
    minHeight: 600,
    show: true, // Show immediately
    backgroundColor: '#0f172a', // Match loading screen background
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      // Remove non-essential options for faster startup
    },
  })

  // Skip icon setting for now to avoid SVG loading issues
  // Icons will be set via electron-builder configuration

  // Window state restoration is now handled asynchronously in windowStateKeeper.get()

  // Setup event handlers asynchronously to avoid blocking window creation
  setImmediate(() => {
    if (!win || win.isDestroyed()) return

    // Restore zoom level
    try {
      const savedZoom = zoomStateKeeper.get().zoomLevel
      win.webContents.setZoomLevel(savedZoom)
    } catch (error) {
      console.error('Failed to restore zoom:', error)
    }

    // Save window state on resize/move (debounced)
    let saveTimeout: NodeJS.Timeout | null = null
    const saveWindowState = () => {
      if (!win || win.isDestroyed()) return

      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        const bounds = win!.getBounds()
        const isMaximized = win!.isMaximized()
        windowStateKeeper.set(bounds, isMaximized)
      }, 500) // Debounce saves
    }

    win.on('resize', saveWindowState)
    win.on('move', saveWindowState)
    win.on('maximize', saveWindowState)
    win.on('unmaximize', saveWindowState)
  })

  // Remove loading screen after React app is fully loaded
  win.webContents.once('did-finish-load', () => {
    setTimeout(() => {
      if (win && !win.isDestroyed()) {
        win.webContents.executeJavaScript(`
          window.postMessage({ payload: 'removeLoading' }, '*');
        `).catch(() => {
          // Ignore errors
        })
      }
    }, 1000) // Reduced wait time
  })

  // Load content immediately without waiting
  if (url) {
    win.loadURL(url)
  } else {
    // Load loading screen first, then switch to main app
    const loadingHtml = path.join(DIST, 'loading.html')
    win.loadFile(loadingHtml)

    // Inject theme information into loading page once it loads
    win.webContents.once('dom-ready', () => {
      if (win && !win.isDestroyed()) {
        const isDark = nativeTheme.shouldUseDarkColors
        win.webContents.executeJavaScript(`
          document.body.className = ${isDark} ? 'dark' : 'light';
          
          // Listen for theme changes
          window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'theme-update') {
              document.body.className = event.data.isDark ? 'dark' : 'light';
            }
          });
        `).catch(() => {
          // Ignore errors
        })
      }
    })

    // Switch to main app after a shorter delay
    setTimeout(() => {
      if (win && !win.isDestroyed()) {
        win.loadFile(indexHtml)
      }
    }, 1000)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
    console.log('Window loaded successfully')
    console.log('VITE_PUBLIC path:', VITE_PUBLIC)
    console.log('DIST path:', DIST)
    console.log('isDev:', isDev)
  })

  // Add error handling for loading failures
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

// Create window as soon as possible
app.on('ready', () => {
  console.log('Electron ready, creating window...')
  createWindow()
})

// Setup handlers immediately after window is created
app.on('browser-window-created', async () => {
  try {
    console.log('Loading handlers...')
    const [
      { setupArgoCDHandlers },
      { setupVaultHandlers },
      { setupUserHandlers },
      // { setupSimpleGitHandlers }, // Disabled - conflicts with setupGitHandlers()
      { setupSimpleHelmHandlers },
      { setupGitHandlers }
    ] = await Promise.all([
      import('./argocd-handler'),
      import('./vault-handler'),
      import('./user-handler'),
      // import('./simple-git-handler'), // Disabled - conflicts with setupGitHandlers()
      import('./simple-helm-handler'),
      import('./git-handler')
    ])
    
    setupArgoCDHandlers()
    setupVaultHandlers()
    setupUserHandlers()
    // setupSimpleGitHandlers() // Disabled - conflicts with setupGitHandlers()
    setupSimpleHelmHandlers()
    setupGitHandlers()
    console.log('Handlers loaded')
  } catch (error) {
    console.error('Failed to setup handlers:', error)
  }
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
  const isDark = nativeTheme.shouldUseDarkColors
  
  // Send to main app
  win?.webContents.send('theme-updated', isDark)
  
  // Also send to loading page if it's currently loaded
  if (win && !win.isDestroyed()) {
    win.webContents.executeJavaScript(`
      window.postMessage({ type: 'theme-update', isDark: ${isDark} }, '*');
    `).catch(() => {
      // Ignore errors - loading page might not be loaded
    })
  }
})

// Optimized zoom management - non-blocking
const zoomStateKeeper = {
  file: path.join(app.getPath('userData'), 'zoom-state.json'),
  defaultZoom: 0,

  get(): { zoomLevel: number } {
    // Return default immediately, load asynchronously
    const result = { zoomLevel: this.defaultZoom }

    setImmediate(() => {
      try {
        const data = fs.readFileSync(this.file, 'utf8')
        const parsed = JSON.parse(data)
        const zoomLevel = Math.max(-5, Math.min(5, parsed.zoomLevel || 0))
        result.zoomLevel = zoomLevel
      } catch {
        // Use default
      }
    })

    return result
  },

  set(zoomLevel: number) {
    // Save asynchronously
    setImmediate(() => {
      try {
        const clampedZoom = Math.max(-5, Math.min(5, zoomLevel))
        fs.writeFileSync(this.file, JSON.stringify({ zoomLevel: clampedZoom }))
      } catch (error) {
        console.error('Failed to save zoom state:', error)
      }
    })
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

// Asset serving for production
ipcMain.handle('get-asset-path', (_, assetPath: string) => {
  if (isDev) {
    return path.join(VITE_PUBLIC, assetPath)
  } else {
    // In production, assets are in the dist folder
    return path.join(DIST, assetPath)
  }
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

  if (url) {
    childWindow.loadURL(`${url}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})