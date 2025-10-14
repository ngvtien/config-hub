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
  
  // Asset management
  getAssetPath: (assetPath: string) => ipcRenderer.invoke('get-asset-path', assetPath),
  
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
    // Credential management (existing)
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
    migrateCredentials: () => 
      ipcRenderer.invoke('git:migrate-credentials'),
    generateSSHKey: (keyName: string, passphrase?: string) => 
      ipcRenderer.invoke('git:generate-ssh-key', keyName, passphrase),
    cloneRepository: (credentialId: string, localPath: string, branch?: string) => 
      ipcRenderer.invoke('git:clone-repository', credentialId, localPath, branch),
    findCredentialsByRepo: (repoUrl: string) => 
      ipcRenderer.invoke('git:find-credentials-by-repo', repoUrl),
    
    // File operations (new)
    listFiles: (credentialId: string, path: string, branch: string) => 
      ipcRenderer.invoke('git:listFiles', credentialId, path, branch),
    getFileContent: (credentialId: string, filePath: string, branch: string) => 
      ipcRenderer.invoke('git:getFileContent', credentialId, filePath, branch),
    
    // Branch and commit operations (new)
    createBranch: (credentialId: string, baseBranch: string, newBranchName: string) => 
      ipcRenderer.invoke('git:createBranch', credentialId, baseBranch, newBranchName),
    commitChanges: (credentialId: string, branch: string, changes: any[], commitMessage: string) => 
      ipcRenderer.invoke('git:commitChanges', credentialId, branch, changes, commitMessage),
    
    // Pull Request operations (new)
    listPullRequests: (credentialId: string, repoUrl?: string, state?: 'open' | 'merged' | 'declined' | 'all', limit?: number) => 
      ipcRenderer.invoke('git:listPullRequests', credentialId, repoUrl, state, limit),
    createPullRequest: (credentialId: string, sourceBranch: string, targetBranch: string, title: string, description: string, reviewers?: string[]) => 
      ipcRenderer.invoke('git:createPullRequest', credentialId, sourceBranch, targetBranch, title, description, reviewers),
    getPullRequest: (credentialId: string, prId: number) => 
      ipcRenderer.invoke('git:getPullRequest', credentialId, prId),
    getPullRequestDiff: (credentialId: string, prId: number) => 
      ipcRenderer.invoke('git:getPullRequestDiff', credentialId, prId),
    approvePullRequest: (credentialId: string, prId: number) => 
      ipcRenderer.invoke('git:approvePullRequest', credentialId, prId),
    mergePullRequest: (credentialId: string, prId: number, mergeStrategy?: string) => 
      ipcRenderer.invoke('git:mergePullRequest', credentialId, prId, mergeStrategy),
    declinePullRequest: (credentialId: string, prId: number) => 
      ipcRenderer.invoke('git:declinePullRequest', credentialId, prId),
    
    // Webhook notifications (new)
    sendWebhookNotification: (webhookUrl: string, payload: any) => 
      ipcRenderer.invoke('git:sendWebhookNotification', webhookUrl, payload)
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
  const styleContent = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f8fafc;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  z-index: 9999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  animation: slideUp 0.6s ease-out;
}

.loading-logo {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.loading-logo::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.loading-logo-text {
  font-size: 24px;
  font-weight: 600;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(59, 130, 246, 0.3);
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  text-align: center;
  max-width: 400px;
}

.loading-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #f8fafc;
}

.loading-subtitle {
  font-size: 16px;
  color: #94a3b8;
  margin-bottom: 1rem;
}

.loading-status {
  font-size: 14px;
  color: #64748b;
  animation: pulse 2s infinite;
}

.loading-progress {
  width: 300px;
  height: 4px;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 1rem;
}

.loading-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 2px;
  width: 0%;
  animation: progressLoad 3s ease-in-out infinite;
}

@keyframes progressLoad {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}

.loading-tips {
  position: absolute;
  bottom: 2rem;
  text-align: center;
  color: #64748b;
  font-size: 12px;
  max-width: 400px;
  padding: 0 2rem;
}
    `
  
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `
    <div class="loading-content">
      <div class="loading-logo">
        <div class="loading-logo-text">CH</div>
      </div>
      
      <div class="loading-text">
        <div class="loading-title">Config Hub</div>
        <div class="loading-subtitle">Secure credential management platform</div>
        <div class="loading-status" id="loading-status">Initializing application...</div>
        
        <div class="loading-progress">
          <div class="loading-progress-bar"></div>
        </div>
      </div>
      
      <div class="loading-spinner"></div>
    </div>
    
    <div class="loading-tips">
      <p>💡 Tip: Use Ctrl+Plus/Minus to zoom in and out of the interface</p>
    </div>
  `

  let statusElement: HTMLElement | null = null
  let currentStep = 0
  const steps = [
    'Initializing application...',
    'Loading security modules...',
    'Setting up credential stores...',
    'Preparing user interface...',
    'Almost ready...'
  ]

  const updateStatus = () => {
    if (!statusElement) {
      statusElement = document.getElementById('loading-status')
    }
    if (statusElement && currentStep < steps.length) {
      statusElement.textContent = steps[currentStep]
      currentStep++
    }
  }

  // Update status every 800ms
  let statusInterval: NodeJS.Timeout | null = null

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
      
      // Start status updates
      statusInterval = setInterval(updateStatus, 800)
    },
    removeLoading() {
      if (statusInterval) {
        clearInterval(statusInterval)
        statusInterval = null
      }
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

// Simple loading management - no longer needed since we use loading.html
// const { appendLoading, removeLoading } = useLoading()

// Keep the loading functions for potential future use
window.onmessage = (ev) => {
  if (ev.data.payload === 'removeLoading') {
    // Remove any existing loading screens
    const loadingElement = document.querySelector('.app-loading-wrap')
    if (loadingElement) {
      loadingElement.remove()
    }
  }
}