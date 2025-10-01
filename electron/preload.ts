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
    storeCredentials: (config: any) => 
      ipcRenderer.invoke('argocd:store-credentials', config),
    testConnection: (credentialId: string) => 
      ipcRenderer.invoke('argocd:test-connection', credentialId),
    getApplications: (credentialId: string) => 
      ipcRenderer.invoke('argocd:get-applications', credentialId),
    getApplication: (credentialId: string, name: string, namespace?: string) => 
      ipcRenderer.invoke('argocd:get-application', credentialId, name, namespace),
    getApplicationLogs: (credentialId: string, name: string, options?: any) => 
      ipcRenderer.invoke('argocd:get-application-logs', credentialId, name, options),
    getApplicationEvents: (credentialId: string, name: string, namespace?: string) => 
      ipcRenderer.invoke('argocd:get-application-events', credentialId, name, namespace),
    syncApplication: (credentialId: string, name: string, options?: any) => 
      ipcRenderer.invoke('argocd:sync-application', credentialId, name, options),
    listCredentials: (environment?: string) => 
      ipcRenderer.invoke('argocd:list-credentials', environment),
    getCredential: (credentialId: string) => 
      ipcRenderer.invoke('argocd:get-credential', credentialId),
    deleteCredential: (credentialId: string) => 
      ipcRenderer.invoke('argocd:delete-credential', credentialId),
    clearCache: () => 
      ipcRenderer.invoke('argocd:clear-cache')
  },
  
  // HashiCorp Vault API (secure IPC-based)
  vault: {
    storeCredentials: (config: any) => 
      ipcRenderer.invoke('vault:store-credentials', config),
    testConnection: (credentialId: string) => 
      ipcRenderer.invoke('vault:test-connection', credentialId),
    getSecret: (credentialId: string, secretPath: string) => 
      ipcRenderer.invoke('vault:get-secret', credentialId, secretPath),
    listSecrets: (credentialId: string, secretPath?: string) => 
      ipcRenderer.invoke('vault:list-secrets', credentialId, secretPath),
    putSecret: (credentialId: string, secretPath: string, secretData: Record<string, any>) => 
      ipcRenderer.invoke('vault:put-secret', credentialId, secretPath, secretData),
    deleteSecret: (credentialId: string, secretPath: string) => 
      ipcRenderer.invoke('vault:delete-secret', credentialId, secretPath),
    getHealth: (credentialId: string) => 
      ipcRenderer.invoke('vault:get-health', credentialId),
    listCredentials: (environment?: string) => 
      ipcRenderer.invoke('vault:list-credentials', environment),
    getCredential: (credentialId: string) => 
      ipcRenderer.invoke('vault:get-credential', credentialId),
    deleteCredential: (credentialId: string) => 
      ipcRenderer.invoke('vault:delete-credential', credentialId),
    clearCache: () => 
      ipcRenderer.invoke('vault:clear-cache')
  },

  // Git API (secure IPC-based)
  git: {
    storeCredential: (config: any) => 
      ipcRenderer.invoke('git:store-credential', config),
    testCredential: (credentialId: string) => 
      ipcRenderer.invoke('git:test-credential', credentialId),
    listCredentials: (environment?: string) => 
      ipcRenderer.invoke('git:list-credentials', environment),
    getCredential: (credentialId: string) => 
      ipcRenderer.invoke('git:get-credential', credentialId),
    deleteCredential: (credentialId: string) => 
      ipcRenderer.invoke('git:delete-credential', credentialId),
    generateSSHKey: (keyName: string, passphrase?: string) => 
      ipcRenderer.invoke('git:generate-ssh-key', keyName, passphrase),
    cloneRepository: (credentialId: string, localPath: string, branch?: string) => 
      ipcRenderer.invoke('git:clone-repository', credentialId, localPath, branch),
    findCredentialsByRepo: (repoUrl: string) => 
      ipcRenderer.invoke('git:find-credentials-by-repo', repoUrl)
  },

  // Helm API (secure IPC-based)
  helm: {
    storeCredential: (config: any) => 
      ipcRenderer.invoke('helm:store-credential', config),
    testCredential: (credentialId: string) => 
      ipcRenderer.invoke('helm:test-credential', credentialId),
    listCredentials: (environment?: string) => 
      ipcRenderer.invoke('helm:list-credentials', environment),
    getCredential: (credentialId: string) => 
      ipcRenderer.invoke('helm:get-credential', credentialId),
    deleteCredential: (credentialId: string) => 
      ipcRenderer.invoke('helm:delete-credential', credentialId),
    addRepository: (credentialId: string, repoName: string) => 
      ipcRenderer.invoke('helm:add-repository', credentialId, repoName),
    listCharts: (credentialId: string, repoName?: string) => 
      ipcRenderer.invoke('helm:list-charts', credentialId, repoName),
    findCredentialsByRegistry: (registryUrl: string) => 
      ipcRenderer.invoke('helm:find-credentials-by-registry', registryUrl)
  },
  
  // User Management API
  user: {
    getCurrentUser: () => 
      ipcRenderer.invoke('user:get-current'),
    getAvailableUsers: () => 
      ipcRenderer.invoke('user:get-available'),
    switchUser: (username: string, password?: string) => 
      ipcRenderer.invoke('user:switch', username, password),
    isAdmin: () => 
      ipcRenderer.invoke('user:is-admin')
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