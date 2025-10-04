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

interface GitConfig {
  name: string
  repoUrl: string
  authType: 'token' | 'ssh' | 'userpass'
  username?: string
  token?: string
  privateKey?: string
  publicKey?: string
  passphrase?: string
  password?: string
  environment?: string
  tags?: string[]
}

interface GitResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  credentialId?: string
}

interface HelmConfig {
  name: string
  registryUrl: string
  authType: 'userpass' | 'token' | 'certificate'
  username?: string
  password?: string
  token?: string
  certificate?: string
  certificateKey?: string
  environment?: string
  tags?: string[]
}

interface HelmResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  credentialId?: string
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
    
    // Git API (secure IPC-based)
    git: {
      storeCredential: (config: GitConfig) => Promise<GitResponse>
      testCredential: (credentialId: string) => Promise<GitResponse<{ success: boolean }>>
      listCredentials: (environment?: string) => Promise<GitResponse<any[]>>
      getCredential: (credentialId: string) => Promise<GitResponse<any>>
      deleteCredential: (credentialId: string) => Promise<GitResponse>
      generateSSHKey: (keyName: string, passphrase?: string) => Promise<GitResponse<{ privateKey: string; publicKey: string }>>
      cloneRepository: (credentialId: string, localPath: string, branch?: string) => Promise<GitResponse>
      findCredentialsByRepo: (repoUrl: string) => Promise<GitResponse<any[]>>
    }
    
    // Helm API (secure IPC-based)
    helm: {
      storeCredential: (config: HelmConfig) => Promise<HelmResponse>
      testCredential: (credentialId: string) => Promise<HelmResponse<{ success: boolean }>>
      listCredentials: (environment?: string) => Promise<HelmResponse<any[]>>
      getCredential: (credentialId: string) => Promise<HelmResponse<any>>
      deleteCredential: (credentialId: string) => Promise<HelmResponse>
      addRepository: (credentialId: string, repoName: string) => Promise<HelmResponse>
      listCharts: (credentialId: string, repoName?: string) => Promise<HelmResponse<any[]>>
      findCredentialsByRegistry: (registryUrl: string) => Promise<HelmResponse<any[]>>
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