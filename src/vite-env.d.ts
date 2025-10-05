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
      storeCredentials: (config: VaultConfig) => Promise<VaultResponse<{ credentialId: string }>>
      testConnection: (credentialId: string) => Promise<VaultResponse<{ connected: boolean }>>
      getSecret: (credentialId: string, secretPath: string) => Promise<VaultResponse<any>>
      listSecrets: (credentialId: string, secretPath?: string) => Promise<VaultResponse<string[]>>
      listCredentials: (environment?: string) => Promise<VaultResponse<any[]>>
      putSecret: (credentialId: string, secretPath: string, secretData: Record<string, any>) => Promise<VaultResponse<any>>
      deleteSecret: (credentialId: string, secretPath: string) => Promise<VaultResponse>
      getHealth: (credentialId: string) => Promise<VaultResponse<any>>
      getCredential: (credentialId: string) => Promise<VaultResponse<any>>
      deleteCredential: (credentialId: string) => Promise<VaultResponse>
      clearCache: () => Promise<VaultResponse>
    }
    
    // Git API (secure IPC-based)
    git: {
      // Credential management (existing)
      storeCredential: (config: GitConfig) => Promise<GitResponse>
      testCredential: (credentialId: string) => Promise<GitResponse<{ success: boolean }>>
      listCredentials: (environment?: string) => Promise<GitResponse<any[]>>
      getCredential: (credentialId: string) => Promise<GitResponse<any>>
      deleteCredential: (credentialId: string) => Promise<GitResponse>
      generateSSHKey: (keyName: string, passphrase?: string) => Promise<GitResponse<{ privateKey: string; publicKey: string }>>
      cloneRepository: (credentialId: string, localPath: string, branch?: string) => Promise<GitResponse>
      findCredentialsByRepo: (repoUrl: string) => Promise<GitResponse<any[]>>
      
      // File operations (new)
      listFiles: (credentialId: string, path: string, branch: string) => Promise<GitResponse<any[]>>
      getFileContent: (credentialId: string, filePath: string, branch: string) => Promise<GitResponse<any>>
      
      // Branch and commit operations (new)
      createBranch: (credentialId: string, baseBranch: string, newBranchName: string) => Promise<GitResponse<any>>
      commitChanges: (credentialId: string, branch: string, changes: any[], commitMessage: string) => Promise<GitResponse<any>>
      
      // Pull Request operations (new)
      createPullRequest: (credentialId: string, sourceBranch: string, targetBranch: string, title: string, description: string, reviewers?: string[]) => Promise<GitResponse<any>>
      getPullRequest: (credentialId: string, prId: number) => Promise<GitResponse<any>>
      mergePullRequest: (credentialId: string, prId: number, mergeStrategy?: string) => Promise<GitResponse<any>>
      
      // Webhook notifications (new)
      sendWebhookNotification: (webhookUrl: string, payload: any) => Promise<GitResponse<void>>
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