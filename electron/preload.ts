import { contextBridge, ipcRenderer } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  // Theme management
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme: 'system' | 'light' | 'dark') => ipcRenderer.invoke('set-theme', theme),
  getShouldUseDarkColors: () => ipcRenderer.invoke('get-should-use-dark-colors'),
  onThemeUpdated: (callback: (isDark: boolean) => void) => {
    ipcRenderer.on('theme-updated', (_, isDark) => callback(isDark))
  },
  
  // Zoom management
  getZoomLevel: () => ipcRenderer.invoke('get-zoom-level'),
  setZoomLevel: (zoomLevel: number) => ipcRenderer.invoke('set-zoom-level', zoomLevel),
  zoomIn: () => ipcRenderer.invoke('zoom-in'),
  zoomOut: () => ipcRenderer.invoke('zoom-out'),
  zoomReset: () => ipcRenderer.invoke('zoom-reset'),
  
  // Sidebar state management
  getSidebarState: () => ipcRenderer.invoke('get-sidebar-state'),
  setSidebarState: (isCollapsed: boolean) => ipcRenderer.invoke('set-sidebar-state', isCollapsed),
  
  // ArgoCD API (secure IPC-based)
  argocd: {
    storeCredentials: (environment: string, config: any) => 
      ipcRenderer.invoke('argocd:store-credentials', environment, config),
    testConnection: (environment: string) => 
      ipcRenderer.invoke('argocd:test-connection', environment),
    getApplications: (environment: string) => 
      ipcRenderer.invoke('argocd:get-applications', environment),
    getApplication: (environment: string, name: string, namespace?: string) => 
      ipcRenderer.invoke('argocd:get-application', environment, name, namespace),
    getApplicationLogs: (environment: string, name: string, options?: any) => 
      ipcRenderer.invoke('argocd:get-application-logs', environment, name, options),
    getApplicationEvents: (environment: string, name: string, namespace?: string) => 
      ipcRenderer.invoke('argocd:get-application-events', environment, name, namespace),
    syncApplication: (environment: string, name: string, options?: any) => 
      ipcRenderer.invoke('argocd:sync-application', environment, name, options),
    clearCache: () => 
      ipcRenderer.invoke('argocd:clear-cache')
  },
  
  // HashiCorp Vault API (secure IPC-based)
  vault: {
    storeCredentials: (environment: string, config: any) => 
      ipcRenderer.invoke('vault:store-credentials', environment, config),
    testConnection: (environment: string) => 
      ipcRenderer.invoke('vault:test-connection', environment),
    getSecret: (environment: string, secretPath: string) => 
      ipcRenderer.invoke('vault:get-secret', environment, secretPath),
    listSecrets: (environment: string, secretPath?: string) => 
      ipcRenderer.invoke('vault:list-secrets', environment, secretPath),
    putSecret: (environment: string, secretPath: string, secretData: Record<string, any>) => 
      ipcRenderer.invoke('vault:put-secret', environment, secretPath, secretData),
    deleteSecret: (environment: string, secretPath: string) => 
      ipcRenderer.invoke('vault:delete-secret', environment, secretPath),
    getHealth: (environment: string) => 
      ipcRenderer.invoke('vault:get-health', environment),
    clearCache: () => 
      ipcRenderer.invoke('vault:clear-cache')
  },
  
  // General IPC
  on: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (event, ...args) => listener(...args))
  },
  off: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.off(channel, listener)
  },
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args)
  },
  invoke: (channel: string, ...args: any[]) => {
    return ipcRenderer.invoke(channel, ...args)
  },
})

// --------- Preload scripts loading ---------
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(c => c === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(c => c === child)) {
      return parent.removeChild(child)
    }
  },
}

// https://tobiasahlin.com/spinkit
// https://connoratherton.com/loaders
// https://projects.lukehaas.me/css-loaders
// https://matejkustec.github.io/SpinThatShit
function useLoading() {
  const className = `loaders-css__square-spin`
  const styleContent = `
@keyframes square-spin {
  25% { 
    transform: perspective(100px) rotateX(180deg) rotateY(0); 
  }
  50% { 
    transform: perspective(100px) rotateX(180deg) rotateY(180deg); 
  }
  75% { 
    transform: perspective(100px) rotateX(0) rotateY(180deg); 
  }
  100% { 
    transform: perspective(100px) rotateX(0) rotateY(0); 
  }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
  ev.data.payload === 'removeLoading' && removeLoading()
}