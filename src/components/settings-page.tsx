import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ResponsiveIndicator } from '@/components/responsive-indicator'
import { useEnvironment } from '@/contexts/environment-context'
import { useEnvironmentSettings } from '@/hooks/use-environment-settings'
import { useVaultCredentials } from '@/hooks/use-vault-credentials'
import { useAssetPath } from '@/hooks/use-asset-path'
import {
  Settings,
  GitBranch,
  Container,
  Package,
  Shield,
  Save,
  RefreshCw,
  Globe,
  Eye,
  EyeOff
} from 'lucide-react'

interface SettingsPageProps {
  onBack?: () => void
}

interface SettingsSection {
  id: string
  label: string
  icon: any
  serviceIcon?: string | null
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { environment, instance, getContextKey } = useEnvironment()
  const { settings, updateSection } = useEnvironmentSettings()
  const [activeSection, setActiveSection] = useState('general')

  // Automatically store Vault credentials when settings change
  useVaultCredentials()

  // Get asset paths for service logos
  const gitLogo = useAssetPath('logos/git-logo.svg')
  const argoCDLogo = useAssetPath('logos/argocd-logo.svg')
  const helmLogo = useAssetPath('logos/helm-logo.svg')
  const vaultLogo = useAssetPath('logos/vault-logo.svg')

  const sections: SettingsSection[] = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'git', label: 'Git Repositories', icon: GitBranch, serviceIcon: gitLogo },
    { id: 'argocd', label: 'ArgoCD', icon: Container, serviceIcon: argoCDLogo },
    { id: 'helm', label: 'Helm OCI', icon: Package, serviceIcon: helmLogo },
    { id: 'vault', label: 'HashiCorp Vault', icon: Shield, serviceIcon: vaultLogo }
  ]

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Application Settings</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="appName">Application Name</Label>
              <Input
                id="appName"
                value={settings.general.appName}
                onChange={(e) => updateSection('general', { appName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="theme">Theme</Label>
              <select
                id="theme"
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                value={settings.general.theme}
                onChange={(e) => updateSection('general', { theme: e.target.value })}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoSave"
                checked={settings.general.autoSave}
                onChange={(e) => updateSection('general', { autoSave: e.target.checked })}
                className="rounded border-input"
              />
              <Label htmlFor="autoSave">Enable auto-save</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="notifications"
                checked={settings.general.notifications}
                onChange={(e) => updateSection('general', { notifications: e.target.checked })}
                className="rounded border-input"
              />
              <Label htmlFor="notifications">Enable notifications</Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderGitSettings = () => {
    const [isTestingConnection, setIsTestingConnection] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isGeneratingKey, setIsGeneratingKey] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [connectionMessage, setConnectionMessage] = useState('')
    const [providerType, setProviderType] = useState<'bitbucket-server' | 'bitbucket-cloud' | 'github' | 'gitlab' | 'gitea' | 'generic'>('bitbucket-server')
    const [credentialName, setCredentialName] = useState(`Bitbucket ${environment.toUpperCase()}`)
    const [repoUrl, setRepoUrl] = useState('http://localhost:7990/')
    const [authType, setAuthType] = useState<'token' | 'ssh' | 'userpass'>('userpass')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [token, setToken] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showToken, setShowToken] = useState(false)
    const [sshKeyName, setSshKeyName] = useState('')
    const [sshPassphrase, setSshPassphrase] = useState('')
    const [generatedPublicKey, setGeneratedPublicKey] = useState('')
    const [generatedPrivateKey, setGeneratedPrivateKey] = useState('')
    const [showSSHDialog, setShowSSHDialog] = useState(false)
    const [savedConfigurations, setSavedConfigurations] = useState<any[]>([])
    const [showConfigList, setShowConfigList] = useState(true)
    const [configStatus, setConfigStatus] = useState<Record<string, { status: 'idle' | 'testing' | 'success' | 'error', message?: string }>>({})

    // Load existing credential if available
    useEffect(() => {
      const loadExistingCredential = async () => {
        if (settings.git.credentialId) {
          setIsLoading(true)
          try {
            const result = await window.electronAPI.git.getCredential(settings.git.credentialId)
            if (result.success && result.data) {
              const cred = result.data
              setCredentialName(cred.name || `Bitbucket ${environment.toUpperCase()}`)
              setRepoUrl(cred.repoUrl || 'http://localhost:7990/')
              setAuthType(cred.authType || 'userpass')
              // Note: We don't load sensitive data (password, token) for security
              // User will need to re-enter them if they want to update
              if (cred.username) {
                setUsername(cred.username)
              }
            }
          } catch (error) {
            console.error('Failed to load existing credential:', error)
          } finally {
            setIsLoading(false)
          }
        }
      }
      loadExistingCredential()
    }, [settings.git.credentialId, environment])

    // Load saved configurations
    useEffect(() => {
      const loadConfigurations = async () => {
        try {
          const result = await window.electronAPI.git.listCredentials(environment)
          if (result.success && result.data) {
            setSavedConfigurations(result.data)
          }
        } catch (error) {
          console.error('Failed to load configurations:', error)
        }
      }
      loadConfigurations()
    }, [environment, settings.git.credentialId])

    // Auto-detect provider type from URL
    const detectProviderType = (url: string): typeof providerType => {
      if (url.includes('bitbucket.org')) return 'bitbucket-cloud'
      if (url.includes('github.com')) return 'github'
      if (url.includes('gitlab.com')) return 'gitlab'
      if (url.includes('localhost') || url.match(/:\d+\//)) return 'bitbucket-server'
      return 'generic'
    }

    // Get provider-specific hints
    const getProviderHint = () => {
      switch (providerType) {
        case 'bitbucket-server':
          return '💡 Tip: SSH uses port 7999, HTTP uses port 7990'
        case 'bitbucket-cloud':
          return '💡 Tip: Use App Passwords instead of your account password'
        case 'github':
          return '💡 Tip: Generate Personal Access Token with "repo" scope'
        case 'gitlab':
          return '💡 Tip: Create Personal Access Token in User Settings'
        case 'gitea':
          return '💡 Tip: Gitea supports both HTTP and SSH authentication'
        default:
          return '💡 Tip: Ensure your Git server supports the selected authentication method'
      }
    }

    // Get provider icon/emoji
    const getProviderIcon = () => {
      switch (providerType) {
        case 'bitbucket-server':
        case 'bitbucket-cloud':
          return '🟦'
        case 'github':
          return '🐙'
        case 'gitlab':
          return '🦊'
        case 'gitea':
          return '📦'
        default:
          return '⚙️'
      }
    }

    // Handle URL change with auto-detection
    const handleUrlChange = (url: string) => {
      setRepoUrl(url)
      const detected = detectProviderType(url)
      setProviderType(detected)
    }

    // Check if current configuration would be a duplicate
    const checkDuplicate = () => {
      if (!repoUrl) return null
      
      const normalizedUrl = repoUrl.trim().toLowerCase().replace(/\/$/, '')
      const duplicate = savedConfigurations.find(config => {
        const configUrl = (config.repoUrl || '').trim().toLowerCase().replace(/\/$/, '')
        const sameUrl = configUrl === normalizedUrl
        const sameAuthType = config.authType === authType
        const sameUser = authType === 'userpass' ? config.username === username : true
        
        // Skip if it's the current credential being edited
        if (settings.git.credentialId && config.id === settings.git.credentialId) {
          return false
        }
        
        return sameUrl && sameAuthType && sameUser
      })
      
      return duplicate
    }

    const duplicateConfig = checkDuplicate()

    const testConnection = async () => {
      if (!repoUrl) {
        setConnectionStatus('error')
        setConnectionMessage('Please provide Repository URL')
        return
      }

      if (authType === 'token' && !token) {
        setConnectionStatus('error')
        setConnectionMessage('Please provide Access Token')
        return
      }

      if (authType === 'userpass' && (!username || !password)) {
        setConnectionStatus('error')
        setConnectionMessage('Please provide Username and Password')
        return
      }

      if (authType === 'ssh' && (!generatedPrivateKey || !generatedPublicKey)) {
        setConnectionStatus('error')
        setConnectionMessage('Please generate SSH keys first')
        return
      }

      setIsTestingConnection(true)
      setConnectionStatus('idle')
      setConnectionMessage('')

      let tempCredentialId: string | undefined

      try {
        const config = {
          name: `${credentialName} (Test)`,
          repoUrl,
          authType,
          username: authType === 'userpass' ? username : undefined,
          password: authType === 'userpass' ? password : undefined,
          token: authType === 'token' ? token : undefined,
          privateKey: authType === 'ssh' ? generatedPrivateKey : undefined,
          publicKey: authType === 'ssh' ? generatedPublicKey : undefined,
          passphrase: authType === 'ssh' ? sshPassphrase : undefined,
          environment,
          tags: ['settings-page', 'temporary', 'test']
        }

        // Store temporarily for testing
        const storeResult = await window.electronAPI.git.storeCredential(config)
        if (!storeResult.success) {
          throw new Error(storeResult.error || 'Failed to store credentials')
        }

        if (!storeResult.credentialId) {
          throw new Error('No credential ID returned from store operation')
        }

        tempCredentialId = storeResult.credentialId

        // Test the credential
        const testResult = await window.electronAPI.git.testCredential(storeResult.credentialId)
        
        // Clean up temporary credential
        await window.electronAPI.git.deleteCredential(storeResult.credentialId)
        
        if (testResult.success) {
          setConnectionStatus('success')
          setConnectionMessage('Connection successful! Git repository is accessible. Click "Save Configuration" to store permanently.')
        } else {
          setConnectionStatus('error')
          setConnectionMessage(testResult.error || 'Connection failed. Please check your credentials and repository URL.')
        }
      } catch (error) {
        // Clean up temporary credential on error
        if (tempCredentialId) {
          try {
            await window.electronAPI.git.deleteCredential(tempCredentialId)
          } catch (cleanupError) {
            console.error('Failed to cleanup temporary credential:', cleanupError)
          }
        }
        setConnectionStatus('error')
        setConnectionMessage(error instanceof Error ? error.message : 'Connection test failed')
      } finally {
        setIsTestingConnection(false)
      }
    }

    const generateSSHKey = async () => {
      if (!sshKeyName) {
        setConnectionStatus('error')
        setConnectionMessage('Please provide a name for the SSH key')
        return
      }

      setIsGeneratingKey(true)
      setConnectionStatus('idle')
      setConnectionMessage('')

      try {
        const result = await window.electronAPI.git.generateSSHKey(sshKeyName, sshPassphrase || undefined)
        
        if (result.success && result.data) {
          setGeneratedPublicKey(result.data.publicKey)
          setGeneratedPrivateKey(result.data.privateKey)
          setConnectionStatus('success')
          setConnectionMessage('SSH key pair generated successfully!')
          setShowSSHDialog(true)
        } else {
          throw new Error(result.error || 'Failed to generate SSH key')
        }
      } catch (error) {
        setConnectionStatus('error')
        setConnectionMessage(error instanceof Error ? error.message : 'Failed to generate SSH key')
      } finally {
        setIsGeneratingKey(false)
      }
    }

    const copyToClipboard = async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setConnectionStatus('success')
        setConnectionMessage(`${label} copied to clipboard!`)
        setTimeout(() => {
          if (connectionStatus === 'success' && connectionMessage.includes('copied')) {
            setConnectionStatus('idle')
            setConnectionMessage('')
          }
        }, 2000)
      } catch (error) {
        setConnectionStatus('error')
        setConnectionMessage('Failed to copy to clipboard')
      }
    }

    const saveConfiguration = async () => {
      if (!repoUrl) {
        setConnectionStatus('error')
        setConnectionMessage('Please provide Repository URL')
        return
      }

      if (authType === 'token' && !token) {
        setConnectionStatus('error')
        setConnectionMessage('Please provide Access Token')
        return
      }

      if (authType === 'userpass' && (!username || !password)) {
        setConnectionStatus('error')
        setConnectionMessage('Please provide Username and Password')
        return
      }

      if (authType === 'ssh' && (!generatedPrivateKey || !generatedPublicKey)) {
        setConnectionStatus('error')
        setConnectionMessage('Please generate SSH keys first')
        return
      }

      // Check for duplicates (same URL + auth type + username)
      const normalizedUrl = repoUrl.trim().toLowerCase().replace(/\/$/, '') // Remove trailing slash
      const duplicateConfig = savedConfigurations.find(config => {
        const configUrl = (config.repoUrl || '').trim().toLowerCase().replace(/\/$/, '')
        const sameUrl = configUrl === normalizedUrl
        const sameAuthType = config.authType === authType
        const sameUser = authType === 'userpass' ? config.username === username : true
        
        // Skip if it's the current credential being edited
        if (settings.git.credentialId && config.id === settings.git.credentialId) {
          return false
        }
        
        return sameUrl && sameAuthType && sameUser
      })

      if (duplicateConfig) {
        setConnectionStatus('error')
        setConnectionMessage(
          `A configuration already exists for ${repoUrl} with ${authType === 'ssh' ? 'SSH Key' : authType === 'token' ? 'Token' : 'Username/Password'}` +
          (authType === 'userpass' ? ` (user: ${username})` : '') +
          '. Please use a different URL, authentication method, or username.'
        )
        return
      }

      setIsSaving(true)
      setConnectionStatus('idle')
      setConnectionMessage('')

      try {
        // If there's an existing credential, delete it first to avoid duplicates
        if (settings.git.credentialId) {
          try {
            await window.electronAPI.git.deleteCredential(settings.git.credentialId)
          } catch (deleteError) {
            console.warn('Failed to delete old credential:', deleteError)
            // Continue anyway - we'll create a new one
          }
        }

        const config = {
          name: credentialName,
          repoUrl,
          authType,
          username: authType === 'userpass' ? username : undefined,
          password: authType === 'userpass' ? password : undefined,
          token: authType === 'token' ? token : undefined,
          privateKey: authType === 'ssh' ? generatedPrivateKey : undefined,
          publicKey: authType === 'ssh' ? generatedPublicKey : undefined,
          passphrase: authType === 'ssh' ? sshPassphrase : undefined,
          environment,
          tags: ['settings-page', 'saved']
        }

        const result = await window.electronAPI.git.storeCredential(config)
        if (result.success && result.credentialId) {
          setConnectionStatus('success')
          setConnectionMessage('Configuration saved successfully! Credentials are now stored securely.')
          updateSection('git', { credentialId: result.credentialId })
        } else {
          throw new Error(result.error || 'Failed to save configuration')
        }
      } catch (error) {
        setConnectionStatus('error')
        setConnectionMessage(error instanceof Error ? error.message : 'Failed to save configuration')
      } finally {
        setIsSaving(false)
      }
    }

    return (
      <div className="space-y-6">
        {isLoading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2 text-blue-800">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading existing configuration...</span>
            </div>
          </div>
        )}

        {/* Saved Configurations List */}
        {savedConfigurations.length > 0 && showConfigList && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Saved Configurations</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowConfigList(!showConfigList)}
              >
                {showConfigList ? 'Hide' : 'Show'}
              </Button>
            </div>
            <div className="space-y-3">
              {savedConfigurations.map((config) => {
                const status = configStatus[config.id]
                return (
                  <Card key={config.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-lg">{getProviderIcon()}</span>
                            <h4 className="font-medium">{config.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {config.authType === 'ssh' ? 'SSH Key' : 
                               config.authType === 'token' ? 'Token' : 
                               'Username/Password'}
                            </Badge>
                            {/* Inline Status Badge */}
                            {status && status.status !== 'idle' && (
                              <Badge 
                                variant={status.status === 'success' ? 'default' : status.status === 'error' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {status.status === 'testing' && '🔄 Testing...'}
                                {status.status === 'success' && '✅ Connected'}
                                {status.status === 'error' && '❌ Failed'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{config.repoUrl}</p>
                          {config.username && (
                            <p className="text-xs text-muted-foreground mt-1">User: {config.username}</p>
                          )}
                          {!config.username && config.authType !== 'ssh' && (
                            <p className="text-xs text-amber-600 mt-1">⚠️ Username missing - required for Bitbucket Server</p>
                          )}
                          {/* Inline Error Message */}
                          {status && status.status === 'error' && status.message && (
                            <div className="text-xs text-red-600 mt-1 space-y-1">
                              <p>⚠️ {status.message}</p>
                              {status.message.includes('Username required') && (
                                <p className="text-amber-600">
                                  💡 Please delete this configuration and create a new one with your username
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={status?.status === 'testing'}
                            onClick={async () => {
                              setConfigStatus(prev => ({ ...prev, [config.id]: { status: 'testing' } }))
                              try {
                                const result = await window.electronAPI.git.testCredential(config.id)
                                if (result.success) {
                                  setConfigStatus(prev => ({ ...prev, [config.id]: { status: 'success' } }))
                                } else {
                                  setConfigStatus(prev => ({ ...prev, [config.id]: { status: 'error', message: result.error || 'Test failed' } }))
                                }
                              } catch (error) {
                                setConfigStatus(prev => ({ ...prev, [config.id]: { status: 'error', message: 'Test failed' } }))
                              }
                            }}
                          >
                            {status?.status === 'testing' ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              'Test'
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={async () => {
                              if (confirm('Delete this configuration?')) {
                                await window.electronAPI.git.deleteCredential(config.id)
                                setSavedConfigurations(prev => prev.filter(c => c.id !== config.id))
                                setConfigStatus(prev => {
                                  const newStatus = { ...prev }
                                  delete newStatus[config.id]
                                  return newStatus
                                })
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            <Separator className="my-6" />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">
              {savedConfigurations.length > 0 ? 'Add New Configuration' : 'Git Repository Configuration'}
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="gitProviderType">Git Provider *</Label>
              <select
                id="gitProviderType"
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                value={providerType}
                onChange={(e) => setProviderType(e.target.value as typeof providerType)}
              >
                <option value="bitbucket-server">{getProviderIcon()} Bitbucket Server (Self-hosted)</option>
                <option value="bitbucket-cloud">{getProviderIcon()} Bitbucket Cloud (bitbucket.org)</option>
                <option value="github">🐙 GitHub</option>
                <option value="gitlab">🦊 GitLab</option>
                <option value="gitea">📦 Gitea</option>
                <option value="generic">⚙️ Generic Git Server</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Select your Git provider type
              </p>
            </div>

            <div>
              <Label htmlFor="gitCredentialName">Configuration Name</Label>
              <Input
                id="gitCredentialName"
                placeholder={`${providerType === 'bitbucket-server' ? 'Bitbucket Server' : providerType === 'github' ? 'GitHub' : 'Git'} ${environment.toUpperCase()}`}
                value={credentialName}
                onChange={(e) => setCredentialName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                A friendly name to identify this Git configuration
              </p>
            </div>

            <div>
              <Label htmlFor="gitRepoUrl">Repository URL *</Label>
              <Input
                id="gitRepoUrl"
                placeholder={
                  providerType === 'bitbucket-server' ? 'http://localhost:7990/' :
                  providerType === 'bitbucket-cloud' ? 'https://bitbucket.org/' :
                  providerType === 'github' ? 'https://github.com/' :
                  providerType === 'gitlab' ? 'https://gitlab.com/' :
                  providerType === 'gitea' ? 'https://gitea.example.com/' :
                  'https://git.example.com/'
                }
                value={repoUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {getProviderHint()}
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="gitAuthType">Authentication Method</Label>
              <select
                id="gitAuthType"
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                value={authType}
                onChange={(e) => setAuthType(e.target.value as 'token' | 'ssh' | 'userpass')}
              >
                <option value="userpass">Username/Password</option>
                <option value="token">Access Token</option>
                <option value="ssh">SSH Key</option>
              </select>
            </div>

            {/* Username/Password Authentication */}
            {authType === 'userpass' && (
              <div className="p-4 bg-muted/50 rounded-md border">
                <p className="text-sm font-medium mb-3">Username/Password Authentication</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gitUsername">Username *</Label>
                    <Input
                      id="gitUsername"
                      placeholder="admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gitPassword">Password *</Label>
                    <div className="relative">
                      <Input
                        id="gitPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                      />
                      {password && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Token Authentication */}
            {authType === 'token' && (
              <div className="p-4 bg-muted/50 rounded-md border">
                <p className="text-sm font-medium mb-3">Access Token Authentication</p>
                <div>
                  <Label htmlFor="gitToken">Access Token *</Label>
                  <div className="relative">
                    <Input
                      id="gitToken"
                      type={showToken ? "text" : "password"}
                      placeholder="ghp_xxxxxxxxxxxx or app password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="pr-10"
                    />
                    {token && (
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 space-y-1">
                    <p><strong>Bitbucket Cloud:</strong> Use App Password (Settings → App passwords)</p>
                    <p><strong>GitHub:</strong> Use Personal Access Token (Settings → Developer settings)</p>
                    <p><strong>GitLab:</strong> Use Personal Access Token (User Settings → Access Tokens)</p>
                  </div>
                </div>
              </div>
            )}

            {/* SSH Key Authentication */}
            {authType === 'ssh' && (
              <div className="p-4 bg-muted/50 rounded-md border space-y-4">
                <p className="text-sm font-medium">SSH Key Authentication</p>
                <p className="text-sm text-muted-foreground">
                  SSH key authentication is available. Generate SSH keys and configure them for your repositories.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sshKeyName">Key Name *</Label>
                    <Input
                      id="sshKeyName"
                      placeholder="my-git-key"
                      value={sshKeyName}
                      onChange={(e) => setSshKeyName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sshPassphrase">Passphrase (Optional)</Label>
                    <Input
                      id="sshPassphrase"
                      type="password"
                      placeholder="Leave empty for no passphrase"
                      value={sshPassphrase}
                      onChange={(e) => setSshPassphrase(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={generateSSHKey}
                  disabled={isGeneratingKey || !sshKeyName}
                >
                  {isGeneratingKey ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  {isGeneratingKey ? 'Generating...' : 'Generate SSH Key'}
                </Button>

                {/* SSH Key Dialog */}
                {showSSHDialog && generatedPublicKey && (
                  <div className="mt-4 p-4 bg-background border rounded-md space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Generated SSH Keys</h4>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowSSHDialog(false)}
                      >
                        ✕
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs">Public Key (Add to Git provider)</Label>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(generatedPublicKey, 'Public key')}
                          >
                            Copy
                          </Button>
                        </div>
                        <textarea
                          readOnly
                          value={generatedPublicKey}
                          className="w-full h-24 px-3 py-2 text-xs font-mono border border-input bg-muted rounded-md resize-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs">Private Key (Keep secure!)</Label>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(generatedPrivateKey, 'Private key')}
                          >
                            Copy
                          </Button>
                        </div>
                        <textarea
                          readOnly
                          value={generatedPrivateKey}
                          className="w-full h-32 px-3 py-2 text-xs font-mono border border-input bg-muted rounded-md resize-none"
                        />
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Copy the <strong>public key</strong> and add it to your Git provider (GitHub, Bitbucket, GitLab)</p>
                      <p>• The <strong>private key</strong> is stored securely in ~/.ssh/git_{sshKeyName}</p>
                      <p>• SSH config has been automatically updated</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Duplicate Warning */}
            {duplicateConfig && (
              <div className="p-3 rounded-md border bg-yellow-50 border-yellow-200 text-yellow-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    ⚠️ Duplicate detected: A configuration already exists for this URL with {authType === 'ssh' ? 'SSH Key' : authType === 'token' ? 'Token' : 'Username/Password'}
                    {authType === 'userpass' && username ? ` (user: ${username})` : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Connection Status */}
            {connectionStatus !== 'idle' && (
              <div className={`p-3 rounded-md border ${
                connectionStatus === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {connectionStatus === 'success' ? (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  ) : (
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                  <span className="text-sm font-medium">{connectionMessage}</span>
                </div>
              </div>
            )}

            {/* Current Credential Info */}
            {settings.git.credentialId && (
              <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Secure credentials stored for Git repository
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Credential ID: {settings.git.credentialId}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={testConnection}
            disabled={isTestingConnection || !repoUrl || (authType === 'token' && !token) || (authType === 'userpass' && (!username || !password))}
          >
            {isTestingConnection ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Test Connection
          </Button>
          <Button 
            variant="outline" 
            onClick={saveConfiguration}
            disabled={
              isSaving || 
              !repoUrl || 
              (authType === 'token' && !token) || 
              (authType === 'userpass' && (!username || !password)) ||
              (authType === 'ssh' && (!generatedPrivateKey || !generatedPublicKey)) ||
              !!duplicateConfig
            }
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Configuration
          </Button>
        </div>

        <Separator />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">General Git Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultBranch">Default Branch</Label>
                <Input
                  id="defaultBranch"
                  placeholder="main"
                  value={settings.git.defaultBranch}
                  onChange={(e) => updateSection('git', { defaultBranch: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="autoFetch"
                  checked={settings.git.autoFetch}
                  onChange={(e) => updateSection('git', { autoFetch: e.target.checked })}
                  className="rounded border-input"
                />
                <Label htmlFor="autoFetch">Auto-fetch repositories</Label>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Credentials are encrypted and stored securely using OS-level encryption</p>
          <p>• Test connection validates repository accessibility and authentication</p>
          <p>• Save configuration stores credentials for use across the application</p>
          <p>• Supports Bitbucket, GitHub, GitLab, and other Git providers</p>
        </div>
      </div>
    )
  }

  const renderArgoCDSettings = () => {
    const [isTestingConnection, setIsTestingConnection] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [connectionMessage, setConnectionMessage] = useState('')
    const [credentialName, setCredentialName] = useState(settings.argocd.credentialName || `ArgoCD ${environment.toUpperCase()}`)
    const [showToken, setShowToken] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const testConnection = async () => {
      if (!settings.argocd.serverUrl) {
        setConnectionStatus('error')
        setConnectionMessage('Please provide Server URL')
        return
      }

      if (!settings.argocd.token && (!settings.argocd.username || !settings.argocd.password)) {
        setConnectionStatus('error')
        setConnectionMessage('Please provide either Auth Token or Username/Password')
        return
      }

      setIsTestingConnection(true)
      setConnectionStatus('idle')
      setConnectionMessage('')

      try {
        // First store the credentials temporarily for testing
        const config = {
          name: credentialName,
          serverUrl: settings.argocd.serverUrl,
          token: settings.argocd.token,
          username: settings.argocd.username,
          password: settings.argocd.password,
          namespace: settings.argocd.namespace,
          environment,
          tags: ['settings-page']
        }

        console.log('Test Connection - Config:', {
          serverUrl: config.serverUrl,
          hasToken: !!config.token,
          username: config.username,
          hasPassword: !!config.password,
          namespace: config.namespace
        })

        const storeResult = await window.electronAPI.argocd.storeCredentials(config)
        if (!storeResult.success) {
          throw new Error(storeResult.error || 'Failed to store credentials')
        }

        // Test the connection
        if (!storeResult.credentialId) {
          throw new Error('No credential ID returned from store operation')
        }

        const testResult = await window.electronAPI.argocd.testConnection(storeResult.credentialId)
        if (testResult.success && testResult.connected) {
          setConnectionStatus('success')
          setConnectionMessage('Connection successful! ArgoCD server is reachable.')
          // Store the credential ID for future use
          updateSection('argocd', { credentialId: storeResult.credentialId })
        } else {
          setConnectionStatus('error')
          setConnectionMessage(testResult.error || 'Connection failed. Please check your credentials and server URL.')
        }
      } catch (error) {
        setConnectionStatus('error')
        setConnectionMessage(error instanceof Error ? error.message : 'Connection test failed')
      } finally {
        setIsTestingConnection(false)
      }
    }

    const saveConfiguration = async () => {
      if (!settings.argocd.serverUrl) {
        setConnectionStatus('error')
        setConnectionMessage('Please provide Server URL')
        return
      }

      if (!settings.argocd.token && (!settings.argocd.username || !settings.argocd.password)) {
        setConnectionStatus('error')
        setConnectionMessage('Please provide either Auth Token or Username/Password before saving')
        return
      }

      setIsSaving(true)
      setConnectionStatus('idle')
      setConnectionMessage('')

      try {
        const config = {
          name: credentialName,
          serverUrl: settings.argocd.serverUrl,
          token: settings.argocd.token,
          username: settings.argocd.username,
          password: settings.argocd.password,
          namespace: settings.argocd.namespace,
          environment,
          tags: ['settings-page', 'production']
        }

        const result = await window.electronAPI.argocd.storeCredentials(config)
        if (result.success && result.credentialId) {
          setConnectionStatus('success')
          setConnectionMessage('Configuration saved successfully!')
          // Update settings with credential ID and name
          updateSection('argocd', { 
            credentialId: result.credentialId,
            credentialName: credentialName
          })
        } else {
          throw new Error(result.error || 'Failed to save configuration')
        }
      } catch (error) {
        setConnectionStatus('error')
        setConnectionMessage(error instanceof Error ? error.message : 'Failed to save configuration')
      } finally {
        setIsSaving(false)
      }
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">ArgoCD Configuration</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="argoCDName">Configuration Name</Label>
              <Input
                id="argoCDName"
                placeholder={`ArgoCD ${environment.toUpperCase()}`}
                value={credentialName}
                onChange={(e) => setCredentialName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                A friendly name to identify this ArgoCD configuration
              </p>
            </div>

            <div>
              <Label htmlFor="argoCDUrl">Server URL *</Label>
              <Input
                id="argoCDUrl"
                placeholder="https://argocd.k8s.local"
                value={settings.argocd.serverUrl}
                onChange={(e) => updateSection('argocd', { serverUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                The base URL of your ArgoCD server (without /api/v1)
              </p>
            </div>

            <div>
              <Label htmlFor="argoCDToken">Auth Token (Optional if using Username/Password)</Label>
              <div className="relative">
                <Input
                  id="argoCDToken"
                  type={showToken ? "text" : "password"}
                  placeholder="Bearer token from ArgoCD"
                  value={settings.argocd.token}
                  onChange={(e) => updateSection('argocd', { token: e.target.value })}
                  className="pr-10"
                />
                {settings.argocd.token && (
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Preferred method: Generate via ArgoCD CLI or use username/password below
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-md border">
              <p className="text-sm font-medium mb-3">Or use Username/Password Authentication</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="argoCDUsername">Username</Label>
                  <Input
                    id="argoCDUsername"
                    placeholder="admin"
                    value={settings.argocd.username}
                    onChange={(e) => updateSection('argocd', { username: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="argoCDPassword">Password</Label>
                  <div className="relative">
                    <Input
                      id="argoCDPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Your ArgoCD password"
                      value={settings.argocd.password}
                      onChange={(e) => updateSection('argocd', { password: e.target.value })}
                      className="pr-10"
                    />
                    {settings.argocd.password && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 A session token will be automatically generated from your credentials
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="argoCDNamespace">Namespace</Label>
                <Input
                  id="argoCDNamespace"
                  placeholder="argocd"
                  value={settings.argocd.namespace}
                  onChange={(e) => updateSection('argocd', { namespace: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="syncPolicy">Sync Policy</Label>
                <select
                  id="syncPolicy"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  value={settings.argocd.syncPolicy}
                  onChange={(e) => updateSection('argocd', { syncPolicy: e.target.value })}
                >
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                </select>
              </div>
              <div>
                <Label htmlFor="refreshInterval">Auto-Refresh (seconds)</Label>
                <Input
                  id="refreshInterval"
                  type="number"
                  min="5"
                  max="300"
                  placeholder="30"
                  value={settings.argocd.refreshInterval}
                  onChange={(e) => updateSection('argocd', { refreshInterval: parseInt(e.target.value) || 30 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Polling interval: 5-300 seconds
                </p>
              </div>
            </div>

            {/* Connection Status */}
            {connectionStatus !== 'idle' && (
              <div className={`p-3 rounded-md border ${
                connectionStatus === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {connectionStatus === 'success' ? (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  ) : (
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                  <span className="text-sm font-medium">{connectionMessage}</span>
                </div>
              </div>
            )}

            {/* Current Credential Info */}
            {settings.argocd.credentialId && (
              <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Secure credentials stored for: {settings.argocd.credentialName || 'ArgoCD Configuration'}
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Credential ID: {settings.argocd.credentialId}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={testConnection}
            disabled={isTestingConnection || !settings.argocd.serverUrl || (!settings.argocd.token && (!settings.argocd.username || !settings.argocd.password))}
          >
            {isTestingConnection ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Test Connection
          </Button>
          <Button 
            variant="outline" 
            onClick={saveConfiguration}
            disabled={isSaving || !settings.argocd.serverUrl || (!settings.argocd.token && (!settings.argocd.username || !settings.argocd.password))}
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Configuration
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Credentials are encrypted and stored securely using OS-level encryption</p>
          <p>• Test connection validates server accessibility and token authentication</p>
          <p>• Save configuration stores credentials for use across the application</p>
        </div>
      </div>
    )
  }

  const renderHelmOCISettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Helm OCI Configuration</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="helmRegistryUrl">Registry URL</Label>
            <Input
              id="helmRegistryUrl"
              placeholder="oci://registry.example.com"
              value={settings.helm.registryUrl}
              onChange={(e) => updateSection('helm', { registryUrl: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="helmUsername">Username</Label>
              <Input
                id="helmUsername"
                value={settings.helm.username}
                onChange={(e) => updateSection('helm', { username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="helmPassword">Password</Label>
              <Input
                id="helmPassword"
                type="password"
                value={settings.helm.password}
                onChange={(e) => updateSection('helm', { password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="helmNamespace">Default Namespace</Label>
            <Input
              id="helmNamespace"
              value={settings.helm.defaultNamespace}
              onChange={(e) => updateSection('helm', { defaultNamespace: e.target.value })}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">OCI Repositories</h3>
          <Button size="sm">
            <Package className="w-4 h-4 mr-2" />
            Add Repository
          </Button>
        </div>

        <div className="space-y-3">
          {settings.helm.repositories.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center text-muted-foreground">
                No OCI repositories configured for {getContextKey().toUpperCase()}
              </CardContent>
            </Card>
          ) : (
            settings.helm.repositories.map((repo, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{repo.name}</h4>
                      <p className="text-sm text-muted-foreground">{repo.url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={repo.status === 'connected' ? 'default' : 'secondary'}>
                        {repo.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Test Connection
        </Button>
        <Button variant="outline">
          Save Configuration
        </Button>
      </div>
    </div>
  )

const renderVaultSettings = () => {
    const [isTestingConnection, setIsTestingConnection] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [connectionMessage, setConnectionMessage] = useState('')
    const [credentialName, setCredentialName] = useState(`Vault ${environment.toUpperCase()}`)
    const [serverUrl, setServerUrl] = useState('http://vault.k8s.local/')
    const [authMethod, setAuthMethod] = useState<'token' | 'userpass' | 'ldap' | 'kubernetes' | 'aws' | 'azure'>('token')
    const [token, setToken] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [kubernetesRole, setKubernetesRole] = useState('')
    const [awsRole, setAwsRole] = useState('')
    const [azureRole, setAzureRole] = useState('')
    const [namespace, setNamespace] = useState('')
    const [mountPath, setMountPath] = useState('secret')
    const [showToken, setShowToken] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [savedConfigurations, setSavedConfigurations] = useState<any[]>([])
    const [showConfigList, setShowConfigList] = useState(true)
    const [configStatus, setConfigStatus] = useState<Record<string, { status: 'idle' | 'testing' | 'success' | 'error', message?: string }>>({})

    // Load existing credential if available
    useEffect(() => {
      const loadExistingCredential = async () => {
        if (settings.vault.credentialId) {
          setIsLoading(true)
          try {
            const result = await window.electronAPI.vault.getCredential(settings.vault.credentialId)
            if (result.success && result.data) {
              const cred = result.data
              setCredentialName(cred.name || `Vault ${environment.toUpperCase()}`)
              setServerUrl(cred.serverUrl || 'http://vault.k8s.local/')
              setAuthMethod(cred.authMethod || 'token')
              setNamespace(cred.namespace || '')
              setMountPath(cred.mountPath || 'secret')
              if (cred.username) setUsername(cred.username)
              if (cred.kubernetesRole) setKubernetesRole(cred.kubernetesRole)
              if (cred.awsRole) setAwsRole(cred.awsRole)
              if (cred.azureRole) setAzureRole(cred.azureRole)
            }
          } catch (error) {
            console.error('Failed to load existing credential:', error)
          } finally {
            setIsLoading(false)
          }
        }
      }
      loadExistingCredential()
    }, [settings.vault.credentialId, environment])

    // Load saved configurations
    useEffect(() => {
      const loadConfigurations = async () => {
        try {
          const result = await window.electronAPI.vault.listCredentials(environment)
          if (result.success && result.data) {
            setSavedConfigurations(result.data)
          }
        } catch (error) {
          console.error('Failed to load configurations:', error)
        }
      }
      loadConfigurations()
    }, [environment, settings.vault.credentialId])

    // Get auth method specific hints
    const getAuthMethodHint = () => {
      switch (authMethod) {
        case 'token':
          return '💡 Tip: Use root token for testing, create specific tokens for production'
        case 'userpass':
          return '💡 Tip: Ensure userpass auth method is enabled in Vault'
        case 'ldap':
          return '💡 Tip: LDAP must be configured in Vault before use'
        case 'kubernetes':
          return '💡 Tip: Requires Kubernetes service account token'
        case 'aws':
          return '💡 Tip: AWS IAM authentication (coming soon)'
        case 'azure':
          return '💡 Tip: Azure managed identity authentication (coming soon)'
        default:
          return ''
      }
    }

    // Check for duplicates
    const checkDuplicate = () => {
      if (!serverUrl) return null
      
      const normalizedUrl = serverUrl.trim().toLowerCase().replace(/\/$/, '')
      const duplicate = savedConfigurations.find(config => {
        const configUrl = (config.serverUrl || '').trim().toLowerCase().replace(/\/$/, '')
        const sameUrl = configUrl === normalizedUrl
        const sameAuthMethod = config.authMethod === authMethod
        const sameUser = authMethod === 'userpass' || authMethod === 'ldap' ? config.username === username : true
        
        if (settings.vault.credentialId && config.id === settings.vault.credentialId) {
          return false
        }
        
        return sameUrl && sameAuthMethod && sameUser
      })
      
      return duplicate
    }

    const duplicateConfig = checkDuplicate()

    const testConnection = async () => {
      if (!serverUrl) {
        setConnectionStatus('error')
        setConnectionMessage('Please provide Vault Server URL')
        return
      }

      if (authMethod === 'token' && !token) {
        setConnectionStatus('error')
        setConnectionMessage('Please provide Vault Token')
        return
      }

      if ((authMethod === 'userpass' || authMethod === 'ldap') && (!username || !password)) {
        setConnectionStatus('error')
        setConnectionMessage('Please provide Username and Password')
        return
      }

      if (authMethod === 'kubernetes' && !kubernetesRole) {
        setConnectionStatus('error')
        setConnectionMessage('Please provide Kubernetes Role')
        return
      }

      setIsTestingConnection(true)
      setConnectionStatus('idle')
      setConnectionMessage('')

      let tempCredentialId: string | undefined

      try {
        const config = {
          name: `${credentialName} (Test)`,
          serverUrl,
          authMethod,
          token: authMethod === 'token' ? token : undefined,
          username: (authMethod === 'userpass' || authMethod === 'ldap') ? username : undefined,
          password: (authMethod === 'userpass' || authMethod === 'ldap') ? password : undefined,
          kubernetesRole: authMethod === 'kubernetes' ? kubernetesRole : undefined,
          awsRole: authMethod === 'aws' ? awsRole : undefined,
          azureRole: authMethod === 'azure' ? azureRole : undefined,
          namespace,
          mountPath,
          environment,
          tags: ['settings-page', 'temporary', 'test']
        }

        const storeResult = await window.electronAPI.vault.storeCredentials(config)
        if (!storeResult.success) {
          throw new Error(storeResult.error || 'Failed to store credentials')
        }

        if (!storeResult.data?.credentialId) {
          throw new Error('No credential ID returned from store operation')
        }

        tempCredentialId = storeResult.data.credentialId

        const testResult = await window.electronAPI.vault.testConnection(storeResult.data.credentialId)
        
        await window.electronAPI.vault.deleteCredential(storeResult.data.credentialId)
        
        if (testResult.success && testResult.connected) {
          setConnectionStatus('success')
          setConnectionMessage('Connection successful! Vault is accessible. Click "Save Configuration" to store permanently.')
        } else {
          setConnectionStatus('error')
          setConnectionMessage(testResult.error || 'Connection failed. Please check your credentials and Vault URL.')
        }
      } catch (error) {
        if (tempCredentialId) {
          try {
            await window.electronAPI.vault.deleteCredential(tempCredentialId)
          } catch (cleanupError) {
            console.error('Failed to cleanup temporary credential:', cleanupError)
          }
        }
        setConnectionStatus('error')
        setConnectionMessage(error instanceof Error ? error.message : 'Connection test failed')
      } finally {
        setIsTestingConnection(false)
      }
    }

    const saveConfiguration = async () => {
      if (!serverUrl) {
        setConnectionStatus('error')
        setConnectionMessage('Please provide Vault Server URL')
        return
      }

      if (authMethod === 'token' && !token) {
        setConnectionStatus('error')
        setConnectionMessage('Please provide Vault Token')
        return
      }

      if ((authMethod === 'userpass' || authMethod === 'ldap') && (!username || !password)) {
        setConnectionStatus('error')
        setConnectionMessage('Please provide Username and Password')
        return
      }

      if (authMethod === 'kubernetes' && !kubernetesRole) {
        setConnectionStatus('error')
        setConnectionMessage('Please provide Kubernetes Role')
        return
      }

      const normalizedUrl = serverUrl.trim().toLowerCase().replace(/\/$/, '')
      const duplicateConfig = savedConfigurations.find(config => {
        const configUrl = (config.serverUrl || '').trim().toLowerCase().replace(/\/$/, '')
        const sameUrl = configUrl === normalizedUrl
        const sameAuthMethod = config.authMethod === authMethod
        const sameUser = (authMethod === 'userpass' || authMethod === 'ldap') ? config.username === username : true
        
        if (settings.vault.credentialId && config.id === settings.vault.credentialId) {
          return false
        }
        
        return sameUrl && sameAuthMethod && sameUser
      })

      if (duplicateConfig) {
        setConnectionStatus('error')
        setConnectionMessage(
          `A configuration already exists for ${serverUrl} with ${authMethod}` +
          ((authMethod === 'userpass' || authMethod === 'ldap') ? ` (user: ${username})` : '') +
          '. Please use a different URL, authentication method, or username.'
        )
        return
      }

      setIsSaving(true)
      setConnectionStatus('idle')
      setConnectionMessage('')

      try {
        if (settings.vault.credentialId) {
          try {
            await window.electronAPI.vault.deleteCredential(settings.vault.credentialId)
          } catch (deleteError) {
            console.warn('Failed to delete old credential:', deleteError)
          }
        }

        const config = {
          name: credentialName,
          serverUrl,
          authMethod,
          token: authMethod === 'token' ? token : undefined,
          username: (authMethod === 'userpass' || authMethod === 'ldap') ? username : undefined,
          password: (authMethod === 'userpass' || authMethod === 'ldap') ? password : undefined,
          kubernetesRole: authMethod === 'kubernetes' ? kubernetesRole : undefined,
          awsRole: authMethod === 'aws' ? awsRole : undefined,
          azureRole: authMethod === 'azure' ? azureRole : undefined,
          namespace,
          mountPath,
          environment,
          tags: ['settings-page', 'saved']
        }

        const result = await window.electronAPI.vault.storeCredentials(config)
        if (result.success && result.data?.credentialId) {
          setConnectionStatus('success')
          setConnectionMessage('Configuration saved successfully! Credentials are now stored securely.')
          updateSection('vault', { credentialId: result.data.credentialId })
        } else {
          throw new Error(result.error || 'Failed to save configuration')
        }
      } catch (error) {
        setConnectionStatus('error')
        setConnectionMessage(error instanceof Error ? error.message : 'Failed to save configuration')
      } finally {
        setIsSaving(false)
      }
    }

    return (
      <div className="space-y-6">
        {isLoading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2 text-blue-800">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading existing configuration...</span>
            </div>
          </div>
        )}

        {/* Saved Configurations List */}
        {savedConfigurations.length > 0 && showConfigList && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Saved Configurations</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowConfigList(!showConfigList)}
              >
                {showConfigList ? 'Hide' : 'Show'}
              </Button>
            </div>
            <div className="space-y-3">
              {savedConfigurations.map((config) => {
                const status = configStatus[config.id]
                return (
                  <Card key={config.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-lg">🔐</span>
                            <h4 className="font-medium">{config.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {config.authMethod}
                            </Badge>
                            {status && status.status !== 'idle' && (
                              <Badge 
                                variant={status.status === 'success' ? 'default' : status.status === 'error' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {status.status === 'testing' && '🔄 Testing...'}
                                {status.status === 'success' && '✅ Connected'}
                                {status.status === 'error' && '❌ Failed'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{config.serverUrl}</p>
                          {config.username && (
                            <p className="text-xs text-muted-foreground mt-1">User: {config.username}</p>
                          )}
                          {config.namespace && (
                            <p className="text-xs text-muted-foreground mt-1">Namespace: {config.namespace}</p>
                          )}
                          {status && status.status === 'error' && status.message && (
                            <p className="text-xs text-red-600 mt-1">⚠️ {status.message}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={status?.status === 'testing'}
                            onClick={async () => {
                              setConfigStatus(prev => ({ ...prev, [config.id]: { status: 'testing' } }))
                              try {
                                const result = await window.electronAPI.vault.testConnection(config.id)
                                if (result.success && result.connected) {
                                  setConfigStatus(prev => ({ ...prev, [config.id]: { status: 'success' } }))
                                } else {
                                  setConfigStatus(prev => ({ ...prev, [config.id]: { status: 'error', message: result.error || 'Test failed' } }))
                                }
                              } catch (error) {
                                setConfigStatus(prev => ({ ...prev, [config.id]: { status: 'error', message: 'Test failed' } }))
                              }
                            }}
                          >
                            {status?.status === 'testing' ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              'Test'
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={async () => {
                              if (confirm('Delete this configuration?')) {
                                await window.electronAPI.vault.deleteCredential(config.id)
                                setSavedConfigurations(prev => prev.filter(c => c.id !== config.id))
                                setConfigStatus(prev => {
                                  const newStatus = { ...prev }
                                  delete newStatus[config.id]
                                  return newStatus
                                })
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            <Separator className="my-6" />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">
              {savedConfigurations.length > 0 ? 'Add New Configuration' : 'HashiCorp Vault Configuration'}
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="vaultCredentialName">Configuration Name</Label>
              <Input
                id="vaultCredentialName"
                placeholder={`Vault ${environment.toUpperCase()}`}
                value={credentialName}
                onChange={(e) => setCredentialName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                A friendly name to identify this Vault configuration
              </p>
            </div>

            <div>
              <Label htmlFor="vaultServerUrl">Vault Server URL *</Label>
              <Input
                id="vaultServerUrl"
                placeholder="http://vault.k8s.local/"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                💡 Tip: Local K8s cluster Vault is at http://vault.k8s.local/
              </p>
            </div>

            <div>
              <Label htmlFor="vaultAuthMethod">Authentication Method *</Label>
              <select
                id="vaultAuthMethod"
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                value={authMethod}
                onChange={(e) => setAuthMethod(e.target.value as typeof authMethod)}
              >
                <option value="token">🔑 Token (Root/Service Token)</option>
                <option value="userpass">👤 Username/Password</option>
                <option value="ldap">🏢 LDAP</option>
                <option value="kubernetes">☸️ Kubernetes</option>
                <option value="aws">☁️ AWS IAM (Coming Soon)</option>
                <option value="azure">🔷 Azure (Coming Soon)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {getAuthMethodHint()}
              </p>
            </div>

            {/* Token Authentication */}
            {authMethod === 'token' && (
              <div className="p-4 bg-muted/50 rounded-md border">
                <p className="text-sm font-medium mb-3">Token Authentication</p>
                <div>
                  <Label htmlFor="vaultToken">Vault Token *</Label>
                  <div className="relative">
                    <Input
                      id="vaultToken"
                      type={showToken ? "text" : "password"}
                      placeholder="hvs.CAESIJ... or root"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="pr-10"
                    />
                    {token && (
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use 'root' for local development or a service token for production
                  </p>
                </div>
              </div>
            )}

            {/* Username/Password Authentication */}
            {authMethod === 'userpass' && (
              <div className="p-4 bg-muted/50 rounded-md border">
                <p className="text-sm font-medium mb-3">Username/Password Authentication</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vaultUsername">Username *</Label>
                    <Input
                      id="vaultUsername"
                      placeholder="myuser"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vaultPassword">Password *</Label>
                    <div className="relative">
                      <Input
                        id="vaultPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                      />
                      {password && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LDAP Authentication */}
            {authMethod === 'ldap' && (
              <div className="p-4 bg-muted/50 rounded-md border">
                <p className="text-sm font-medium mb-3">LDAP Authentication</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vaultLdapUsername">LDAP Username *</Label>
                    <Input
                      id="vaultLdapUsername"
                      placeholder="ldapuser"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vaultLdapPassword">LDAP Password *</Label>
                    <div className="relative">
                      <Input
                        id="vaultLdapPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Your LDAP password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                      />
                      {password && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Kubernetes Authentication */}
            {authMethod === 'kubernetes' && (
              <div className="p-4 bg-muted/50 rounded-md border">
                <p className="text-sm font-medium mb-3">Kubernetes Authentication</p>
                <div>
                  <Label htmlFor="vaultK8sRole">Kubernetes Role *</Label>
                  <Input
                    id="vaultK8sRole"
                    placeholder="my-k8s-role"
                    value={kubernetesRole}
                    onChange={(e) => setKubernetesRole(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The Kubernetes role configured in Vault
                  </p>
                </div>
              </div>
            )}

            {/* AWS Authentication */}
            {authMethod === 'aws' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm font-medium text-yellow-800 mb-2">AWS IAM Authentication</p>
                <p className="text-xs text-yellow-700">
                  AWS IAM authentication is coming soon. Please use Token or Username/Password for now.
                </p>
              </div>
            )}

            {/* Azure Authentication */}
            {authMethod === 'azure' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm font-medium text-yellow-800 mb-2">Azure Authentication</p>
                <p className="text-xs text-yellow-700">
                  Azure managed identity authentication is coming soon. Please use Token or Username/Password for now.
                </p>
              </div>
            )}

            <Separator />

            {/* Common Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vaultNamespace">Vault Namespace (Optional)</Label>
                <Input
                  id="vaultNamespace"
                  placeholder="admin"
                  value={namespace}
                  onChange={(e) => setNamespace(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  For Vault Enterprise only
                </p>
              </div>
              <div>
                <Label htmlFor="vaultMountPath">Mount Path *</Label>
                <Input
                  id="vaultMountPath"
                  placeholder="secret"
                  value={mountPath}
                  onChange={(e) => setMountPath(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  KV secrets engine mount path
                </p>
              </div>
            </div>

            {/* Duplicate Warning */}
            {duplicateConfig && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 text-lg">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">Duplicate Configuration Detected</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      A configuration already exists for {serverUrl} with {authMethod}
                      {(authMethod === 'userpass' || authMethod === 'ldap') && username ? ` (user: ${username})` : ''}.
                      Please use a different URL, authentication method, or username.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {connectionStatus !== 'idle' && (
              <div className={`p-4 rounded-md border ${
                connectionStatus === 'success' ? 'bg-green-50 border-green-200' :
                connectionStatus === 'error' ? 'bg-red-50 border-red-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start gap-2">
                  <span className={`text-lg ${
                    connectionStatus === 'success' ? 'text-green-600' :
                    connectionStatus === 'error' ? 'text-red-600' :
                    'text-blue-600'
                  }`}>
                    {connectionStatus === 'success' ? '✅' : connectionStatus === 'error' ? '❌' : 'ℹ️'}
                  </span>
                  <p className={`text-sm ${
                    connectionStatus === 'success' ? 'text-green-800' :
                    connectionStatus === 'error' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>
                    {connectionMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={testConnection}
                disabled={
                  isTestingConnection || 
                  isSaving || 
                  !serverUrl || 
                  !!duplicateConfig ||
                  (authMethod === 'token' && !token) ||
                  ((authMethod === 'userpass' || authMethod === 'ldap') && (!username || !password)) ||
                  (authMethod === 'kubernetes' && !kubernetesRole)
                }
              >
                {isTestingConnection ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={saveConfiguration}
                disabled={
                  isTestingConnection || 
                  isSaving || 
                  !serverUrl || 
                  !!duplicateConfig ||
                  (authMethod === 'token' && !token) ||
                  ((authMethod === 'userpass' || authMethod === 'ldap') && (!username || !password)) ||
                  (authMethod === 'kubernetes' && !kubernetesRole)
                }
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }




  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Settings</h1>
            <Badge variant="outline" className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {getContextKey().toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Manage your application configuration for {environment} environment
            {environment === 'uat' ? ` (instance ${instance})` : ''}
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      {/* Responsive Tabs Layout */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        {/* Desktop: Horizontal Tabs */}
        <div className="hidden md:block">
          <TabsList className="grid w-full grid-cols-5 mb-6 h-12 bg-muted/50">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all hover:bg-muted/80 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  {section.serviceIcon ? (
                    <img
                      src={section.serviceIcon}
                      alt={section.label}
                      className={`w-5 h-5 flex-shrink-0 service-logo service-logo-md ${section.id}`}
                    />
                  ) : (
                    <Icon className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="hidden xl:inline truncate">{section.label}</span>
                  <span className="xl:hidden truncate">{section.label.split(' ')[0]}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {/* Mobile: Compact Horizontal Scroll */}
        <div className="md:hidden mb-6">
          <div className="flex gap-2 overflow-x-auto pb-3 px-1 scrollbar-hide">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              return (
                <Button
                  key={section.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={`flex items-center gap-2 whitespace-nowrap flex-shrink-0 min-w-fit px-3 py-2 transition-all ${isActive
                      ? 'shadow-sm'
                      : 'hover:bg-muted/50'
                    }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.serviceIcon ? (
                    <img
                      src={section.serviceIcon}
                      alt={section.label}
                      className={`w-5 h-5 service-logo service-logo-md ${section.id}`}
                    />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">{section.label}</span>
                </Button>
              )
            })}
          </div>
          {/* Scroll hint */}
          <div className="text-xs text-muted-foreground text-center">
            Swipe to see more categories
          </div>
        </div>

        {/* Content for each tab */}
        <TabsContent value="general" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                General
              </CardTitle>
              <CardDescription>
                Configure your general application settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderGeneralSettings()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="git" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
{gitLogo && <img src={gitLogo} alt="Git" className="w-5 h-5 service-logo service-logo-md git" />}
                Git Repositories
              </CardTitle>
              <CardDescription>
                Configure your git repository settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderGitSettings()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="argocd" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
{argoCDLogo && <img src={argoCDLogo} alt="ArgoCD" className="w-5 h-5 service-logo service-logo-md argocd" />}
                ArgoCD
              </CardTitle>
              <CardDescription>
                Configure your ArgoCD connection settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderArgoCDSettings()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="helm" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
{helmLogo && <img src={helmLogo} alt="Helm" className="w-5 h-5 service-logo service-logo-md helm" />}
                Helm OCI
              </CardTitle>
              <CardDescription>
                Configure your Helm OCI registry settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderHelmOCISettings()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vault" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
{vaultLogo && <img src={vaultLogo} alt="HashiCorp Vault" className="w-5 h-5 service-logo service-logo-md vault" />}
                HashiCorp Vault
              </CardTitle>
              <CardDescription>
                Configure your HashiCorp Vault connection and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderVaultSettings()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Development helper */}
      <ResponsiveIndicator />
    </div>
  )
}