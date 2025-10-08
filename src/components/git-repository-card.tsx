import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, AlertCircle, RefreshCw, Settings, GitBranch } from 'lucide-react'
import { useGitCredentials } from '@/hooks/use-git-credentials'

interface GitRepositoryCardProps {
  repoUrl: string | string[] // Support single or multiple repo URLs
  branch?: string // Not used in compact mode but kept for API compatibility
}

export function GitRepositoryCard({
  repoUrl
}: GitRepositoryCardProps) {
  // Normalize to array for consistent handling
  const repoUrls = Array.isArray(repoUrl) ? repoUrl : [repoUrl]
  const primaryRepoUrl = repoUrls[0]
  
  // Use the hook that handles base URL matching for Bitbucket Server
  const { hasCredentials, credentials: credential, loading, refresh } = useGitCredentials(primaryRepoUrl)
  
  const [testing, setTesting] = useState(false)
  const [configuring, setConfiguring] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [connectionMessage, setConnectionMessage] = useState('')
  
  // Configuration form state
  const [username, setUsername] = useState('')
  const [token, setToken] = useState('')
  const [providerType, setProviderType] = useState<string>('bitbucket-server')

  // Detect provider type from URL
  useEffect(() => {
    if (primaryRepoUrl.includes('bitbucket.org')) {
      setProviderType('bitbucket-cloud')
    } else if (primaryRepoUrl.includes('github.com')) {
      setProviderType('github')
    } else if (primaryRepoUrl.includes('gitlab.com')) {
      setProviderType('gitlab')
    } else {
      setProviderType('bitbucket-server')
    }
  }, [primaryRepoUrl])

  // Pre-fill form when editing existing credential
  useEffect(() => {
    if (credential && configuring) {
      setUsername(credential.username || '')
      // Don't pre-fill token for security, but show it exists
    }
  }, [credential, configuring])

  // Set connection status when credential is found
  useEffect(() => {
    if (hasCredentials && credential) {
      setConnectionStatus('success')
    } else {
      setConnectionStatus('idle')
    }
  }, [hasCredentials, credential])

  const testConnection = async () => {
    if (!credential) return
    
    setTesting(true)
    setConnectionStatus('idle')
    setConnectionMessage('')
    
    try {
      const result = await window.electronAPI.git.testCredential(credential.id)
      if (result.success) {
        setConnectionStatus('success')
        setConnectionMessage('Connection successful!')
      } else {
        setConnectionStatus('error')
        setConnectionMessage(result.error || 'Connection failed')
      }
    } catch (error) {
      setConnectionStatus('error')
      setConnectionMessage('Connection test failed')
    } finally {
      setTesting(false)
    }
  }

  const testCredentials = async () => {
    // For testing, we need username and token
    if (!username || !token) {
      setConnectionStatus('error')
      setConnectionMessage('Please provide username and token to test')
      return
    }

    setTesting(true)
    setConnectionStatus('idle')
    setConnectionMessage('')

    try {
      // Create a temporary credential to test
      const testConfig = {
        name: 'temp-test',
        repoUrl: primaryRepoUrl,
        authType: 'token' as const,
        providerType,
        username,
        token
      }

      // Store temporarily
      const storeResult = await window.electronAPI.git.storeCredential(testConfig)
      if (!storeResult.success || !storeResult.credentialId) {
        throw new Error('Failed to create test credential')
      }

      // Test the credential
      const testResult = await window.electronAPI.git.testCredential(storeResult.credentialId)
      
      // Delete the temporary credential
      await window.electronAPI.git.deleteCredential(storeResult.credentialId)

      if (testResult.success) {
        setConnectionStatus('success')
        setConnectionMessage('✅ Connection successful! You can now save.')
      } else {
        setConnectionStatus('error')
        setConnectionMessage(testResult.error || 'Connection test failed')
      }
    } catch (error) {
      setConnectionStatus('error')
      setConnectionMessage(error instanceof Error ? error.message : 'Connection test failed')
    } finally {
      setTesting(false)
    }
  }

  const saveConfiguration = async () => {
    // For updates, token is optional (keep existing if not provided)
    if (!username || (!token && !credential)) {
      setConnectionStatus('error')
      setConnectionMessage('Please provide username and token')
      return
    }

    setTesting(true)
    setConnectionStatus('idle')
    setConnectionMessage('')

    try {
      // Fetch full credential details to get token
      const fullCredResult = credential?.id ? await window.electronAPI.git.getCredential(credential.id) : null
      const fullCred = fullCredResult?.success ? fullCredResult.data : null
      
      const config = {
        name: credential?.name || `${providerType} - ${primaryRepoUrl.split('/').pop()?.replace('.git', '')}`,
        repoUrl: primaryRepoUrl,
        authType: 'token' as const,
        providerType,
        username,
        token: token || fullCred?.token, // Keep existing token if not changed
        tags: fullCred?.tags || ['source-tab', 'auto-configured'],
        environment: fullCred?.environment
      }

      // If updating existing credential, delete old one first
      if (credential?.id) {
        await window.electronAPI.git.deleteCredential(credential.id)
      }

      const result = await window.electronAPI.git.storeCredential(config)
      if (result.success && result.credentialId) {
        setConnectionStatus('success')
        setConnectionMessage(credential ? 'Configuration updated successfully!' : 'Configuration saved successfully!')
        setConfiguring(false)
        // Clear form
        setToken('')
        // Refresh credential using the hook
        refresh()
      } else {
        throw new Error(result.error || 'Failed to save configuration')
      }
    } catch (error) {
      setConnectionStatus('error')
      setConnectionMessage(error instanceof Error ? error.message : 'Failed to save configuration')
    } finally {
      setTesting(false)
    }
  }

  const getProviderIcon = () => {
    switch (providerType) {
      case 'bitbucket-server':
      case 'bitbucket-cloud':
        return '🟦'
      case 'github':
        return '🐙'
      case 'gitlab':
        return '🦊'
      default:
        return '⚙️'
    }
  }

  const getProviderLabel = () => {
    switch (providerType) {
      case 'bitbucket-server':
        return 'Bitbucket Server'
      case 'bitbucket-cloud':
        return 'Bitbucket Cloud'
      case 'github':
        return 'GitHub'
      case 'gitlab':
        return 'GitLab'
      default:
        return 'Git'
    }
  }

  if (loading) {
    return (
      <div className="bg-muted/30 p-3 rounded-lg space-y-2 border-l-2 border-muted animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-muted-foreground/20 rounded-full" />
            <div className="h-4 w-32 bg-muted-foreground/20 rounded" />
          </div>
          <div className="h-7 w-16 bg-muted-foreground/20 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-muted-foreground/20 rounded" />
          <div className="h-3 w-24 bg-muted-foreground/20 rounded" />
        </div>
      </div>
    )
  }

  // Not configured state
  if (!credential) {
    return (
      <>
        <Card className="border-amber-200 bg-amber-50/50 transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Git Repository
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Git access is required to browse files and create pull requests.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm font-medium">
                {repoUrls.length > 1 ? 'Repositories (detected from ArgoCD):' : 'Repository (detected from ArgoCD):'}
              </p>
              {repoUrls.map((url, index) => (
                <p key={index} className="text-sm font-mono bg-muted p-2 rounded break-all">{url}</p>
              ))}
              {repoUrls.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  💡 One credential works for all repositories on the same server
                </p>
              )}
            </div>

            <Button onClick={() => setConfiguring(true)} className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configure Git Access
            </Button>
          </CardContent>
        </Card>

        {/* Configuration Dialog */}
        <Dialog open={configuring} onOpenChange={(open) => {
          setConfiguring(open)
          if (!open) {
            // Clear form when closing
            setToken('')
            setConnectionStatus('idle')
            setConnectionMessage('')
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{credential ? 'Edit Git Configuration' : 'Configure Git Access'}</DialogTitle>
              <DialogDescription>
                {credential ? 'Update authentication credentials for this repository' : 'Set up authentication to access this repository'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Repository URL</Label>
                <Input value={primaryRepoUrl} disabled className="font-mono text-sm" />
              </div>

              <div>
                <Label>Provider</Label>
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <span className="text-lg">{getProviderIcon()}</span>
                  <span className="font-medium">{getProviderLabel()}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your-username"
                />
              </div>

              <div>
                <Label htmlFor="token">Access Token</Label>
                <Input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={credential ? "Leave empty to keep existing token" : "••••••••••••••••"}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {credential 
                    ? 'Leave empty to keep the existing token, or enter a new one to update'
                    : 'Generate a personal access token with repository read/write permissions'
                  }
                </p>
              </div>

              {connectionStatus === 'error' && connectionMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{connectionMessage}</AlertDescription>
                </Alert>
              )}

              {connectionStatus === 'success' && connectionMessage && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{connectionMessage}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfiguring(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={testCredentials}
                  disabled={testing || !username || !token}
                >
                  {testing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
                <Button
                  onClick={saveConfiguration}
                  disabled={testing || !username || (!token && !credential)}
                >
                  {testing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {credential ? 'Updating...' : 'Saving...'}
                    </>
                  ) : (
                    credential ? 'Update' : 'Save'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Configured state - Compact inline version
  return (
    <>
      <div className="bg-muted/30 p-3 rounded-lg space-y-2 border-l-2 border-green-500 transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Git Access Configured</span>
            {repoUrls.length > 1 && (
              <Badge variant="secondary" className="text-xs">
                Works for all {repoUrls.length} repos
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              onClick={testConnection}
              disabled={testing}
              variant="ghost"
              size="sm"
              className="h-7 px-2"
            >
              {testing ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                'Test'
              )}
            </Button>
            <Button
              onClick={() => setConfiguring(true)}
              variant="ghost"
              size="sm"
              className="h-7 px-2"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{getProviderIcon()}</span>
          <span>{getProviderLabel()}</span>
          {credential.username && (
            <>
              <span>•</span>
              <span>User: {credential.username}</span>
            </>
          )}
        </div>

        {connectionStatus === 'error' && connectionMessage && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">{connectionMessage}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Configuration Dialog - also available in configured state */}
      <Dialog open={configuring} onOpenChange={(open) => {
        setConfiguring(open)
        if (!open) {
          // Clear form when closing
          setToken('')
          setConnectionStatus('idle')
          setConnectionMessage('')
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{credential ? 'Edit Git Configuration' : 'Configure Git Access'}</DialogTitle>
            <DialogDescription>
              {credential ? 'Update authentication credentials for this repository' : 'Set up authentication to access this repository'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Repository URL</Label>
              <Input value={primaryRepoUrl} disabled className="font-mono text-sm" />
            </div>

            <div>
              <Label>Provider</Label>
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <span className="text-lg">{getProviderIcon()}</span>
                <span className="font-medium">{getProviderLabel()}</span>
              </div>
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your-username"
              />
            </div>

            <div>
              <Label htmlFor="token">Access Token</Label>
              <Input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={credential ? "Leave empty to keep existing token" : "••••••••••••••••"}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {credential 
                  ? 'Leave empty to keep the existing token, or enter a new one to update'
                  : 'Generate a personal access token with repository read/write permissions'
                }
              </p>
            </div>

            {connectionStatus === 'error' && connectionMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{connectionMessage}</AlertDescription>
              </Alert>
            )}

            {connectionStatus === 'success' && connectionMessage && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{connectionMessage}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setConfiguring(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={testCredentials}
                disabled={testing || !username || !token}
                className="flex-1"
              >
                {testing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
              <Button
                onClick={saveConfiguration}
                disabled={testing || !username || (!token && !credential)}
                className="flex-1"
              >
                {testing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {credential ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  credential ? 'Update' : 'Save'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
