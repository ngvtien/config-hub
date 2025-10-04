/// <reference types="vite/client" />

interface ArgoCDConfig {
  name: string
  serverUrl: string
  token?: string
  username?: string
  password?: string
  namespace?: string
  environment?: string
  tags?: string[]
}

interface ArgoCDResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  connected?: boolean
  credentialId?: string
}

interface VaultConfig {
  serverUrl: string
  authMethod: 'token' | 'userpass' | 'ldap' | 'kubernetes' | 'aws' | 'azure'
  token?: string
  username?: string
  password?: string
  namespace?: string
  mountPath: string
  roleId?: string
  secretId?: string
  kubernetesRole?: string
  awsRole?: string
  azureRole?: string
}

interface VaultResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  connected?: boolean
}

interface SystemUser {
  username: string
  fullName?: string
  domain?: string
  isAdmin?: boolean
  groups?: string[]
}

interface Window {
  electronAPI: {
    // Theme management
    getTheme: () => Promise<'system' | 'light' | 'dark'>
    setTheme: (theme: 'system' | 'light' | 'dark') => Promise<'system' | 'light' | 'dark'>
    getShouldUseDarkColors: () => Promise<boolean>
    onThemeUpdated: (callback: (isDark: boolean) => void) => void
    
    // Zoom management
    getZoomLevel: () => Promise<number>
    setZoomLevel: (zoomLevel: number) => Promise<number>
    zoomIn: () => Promise<number>
    zoomOut: () => Promise<number>
    zoomReset: () => Promise<number>
    
    // Sidebar state management
    getSidebarState: () => Promise<boolean>
    setSidebarState: (isCollapsed: boolean) => Promise<boolean>
    
    // Asset management
    getAssetPath: (assetPath: string) => Promise<string>
    
    // ArgoCD API (secure IPC-based)
    argocd: {
      storeCredentials: (config: ArgoCDConfig) => Promise<ArgoCDResponse>
      testConnection: (credentialId: string) => Promise<ArgoCDResponse<{ connected: boolean }>>
      getApplications: (credentialId: string) => Promise<ArgoCDResponse<any[]>>
      getApplication: (credentialId: string, name: string, namespace?: string) => Promise<ArgoCDResponse<any>>
      getApplicationLogs: (credentialId: string, name: string, options?: {
        namespace?: string
        container?: string
        sinceSeconds?: number
        tailLines?: number
      }) => Promise<ArgoCDResponse<any[]>>
      getApplicationEvents: (credentialId: string, name: string, namespace?: string) => Promise<ArgoCDResponse<any[]>>
      syncApplication: (credentialId: string, name: string, options?: {
        namespace?: string
        dryRun?: boolean
        prune?: boolean
        force?: boolean
      }) => Promise<ArgoCDResponse<any>>
      listCredentials: (environment?: string) => Promise<ArgoCDResponse<any[]>>
      getCredential: (credentialId: string) => Promise<ArgoCDResponse<any>>
      deleteCredential: (credentialId: string) => Promise<ArgoCDResponse>
      clearCache: () => Promise<ArgoCDResponse>
    }
    
    // HashiCorp Vault API (secure IPC-based)
    vault: {
      storeCredentials: (environment: string, config: VaultConfig) => Promise<VaultResponse>
      testConnection: (environment: string) => Promise<VaultResponse<{ connected: boolean }>>
      getSecret: (environment: string, secretPath: string) => Promise<VaultResponse<any>>
      listSecrets: (environment: string, secretPath?: string) => Promise<VaultResponse<string[]>>
      putSecret: (environment: string, secretPath: string, secretData: Record<string, any>) => Promise<VaultResponse<any>>
      deleteSecret: (environment: string, secretPath: string) => Promise<VaultResponse>
      getHealth: (environment: string) => Promise<VaultResponse<any>>
      clearCache: () => Promise<VaultResponse>
    }
    
    // User Management API
    user: {
      getCurrentUser: () => Promise<SystemUser>
      getAvailableUsers: () => Promise<SystemUser[]>
      switchUser: (username: string, password?: string) => Promise<boolean>
      isAdmin: () => Promise<boolean>
    }
    
    // General IPC
    on: (channel: string, listener: (...args: any[]) => void) => void
    off: (channel: string, listener: (...args: any[]) => void) => void
    send: (channel: string, ...args: any[]) => void
    invoke: (channel: string, ...args: any[]) => any
  }
}