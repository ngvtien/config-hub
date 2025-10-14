import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { useEnvironmentSettings } from '@/hooks/use-environment-settings'

interface VaultAuthDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  environment: string
}

export function VaultAuthDialog({ isOpen, onClose, onSuccess, environment }: VaultAuthDialogProps) {
  const { settings, updateSection } = useEnvironmentSettings()
  
  const [serverUrl, setServerUrl] = useState(settings.vault?.serverUrl || '')
  const [authMethod, setAuthMethod] = useState<'token' | 'userpass'>(() => {
    const method = settings.vault?.authMethod
    return method === 'token' || method === 'userpass' ? method : 'token'
  })
  const [token, setToken] = useState(settings.vault?.token || '')
  const [username, setUsername] = useState(settings.vault?.username || '')
  const [password, setPassword] = useState(settings.vault?.password || '')
  const [namespace, setNamespace] = useState(settings.vault?.namespace || '')
  const [showToken, setShowToken] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testOnly, setTestOnly] = useState(false)

  const handleTest = async () => {
    setTestOnly(true)
    await handleSave()
    setTestOnly(false)
  }

  const handleSave = async () => {
    setError(null)
    setTestStatus('testing')
    setIsTesting(true)

    try {
      // Validate inputs
      if (!serverUrl) {
        throw new Error('Vault Server URL is required')
      }

      if (authMethod === 'token' && !token) {
        throw new Error('Vault Token is required')
      }

      if (authMethod === 'userpass' && (!username || !password)) {
        throw new Error('Username and Password are required')
      }

      // Check if electronAPI is available
      if (!window.electronAPI?.vault) {
        throw new Error('Vault API not available. Please restart the application.')
      }

      // Prepare credential config
      const config = {
        name: `Vault ${environment.toUpperCase()}`,
        serverUrl,
        authMethod,
        token: authMethod === 'token' ? token : undefined,
        username: authMethod === 'userpass' ? username : undefined,
        password: authMethod === 'userpass' ? password : undefined,
        namespace,
        mountPath: 'secret',
        environment,
        tags: ['secrets-editor', 'saved']
      }

      // Store credentials using the secure credential manager
      const result = await window.electronAPI.vault.storeCredentials(config)
      
      if (!result.success || !result.data?.credentialId) {
        throw new Error(result.error || 'Failed to store Vault credentials')
      }

      const credentialId = result.data.credentialId

      // Test the connection
      const testResult = await window.electronAPI.vault.testConnection(credentialId)
      
      console.log('Vault test result:', JSON.stringify(testResult, null, 2))
      
      // Check for actual connection success
      if (!testResult.success || !testResult.connected) {
        // Connection failed, delete the credential
        await window.electronAPI.vault.deleteCredential(credentialId)
        
        // Build detailed error message
        let errorMessage = 'Connection test failed'
        
        if (testResult.error) {
          errorMessage = testResult.error
        }
        
        // Add helpful troubleshooting tips
        errorMessage += '\n\nPlease verify:\n'
        errorMessage += '• Server URL is correct and accessible\n'
        errorMessage += '• Token/credentials are valid\n'
        errorMessage += '• Vault server is running\n'
        errorMessage += '• Network connectivity is available'
        
        throw new Error(errorMessage)
      }

      // The backend's testConnection already verified:
      // 1. Vault is accessible
      // 2. Authentication works
      // 3. Basic permissions are OK (can access /sys/mounts)
      // 
      // We DON'T need to verify secrets exist - they'll be created later!
      console.log('✅ Vault connection verified (auth works, server accessible)')
      
      // Note: The 404 on /v1/secret/metadata is EXPECTED if no secrets exist yet
      // The fallback to /sys/mounts proves authentication works

      // Success! Save credential ID to settings
      updateSection('vault', {
        credentialId,
        serverUrl,
        authMethod,
        namespace
      })

      setTestStatus('success')
      setIsTesting(false)
      
      // If this was just a test, don't close the dialog
      if (testOnly) {
        // Just show success, let user manually close or save
        return
      }
      
      // Call success callback and close immediately
      onSuccess()
      
      // Small delay just to show the success state briefly
      setTimeout(() => {
        onClose()
      }, 500)

    } catch (err) {
      setTestStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to configure Vault')
      setIsTesting(false)
    }
  }

  const getStatusIcon = () => {
    switch (testStatus) {
      case 'testing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    switch (testStatus) {
      case 'testing':
        return 'Testing connection to Vault...'
      case 'success':
        return 'Connection successful!'
      case 'error':
        return 'Connection failed'
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Vault Connection</DialogTitle>
          <DialogDescription>
            Set up HashiCorp Vault authentication for <strong>{environment.toUpperCase()}</strong> environment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Connection Status */}
          {testStatus !== 'idle' && (
            <Alert className={
              testStatus === 'success' ? 'border-green-200 bg-green-50' :
              testStatus === 'error' ? 'border-red-200 bg-red-50' :
              'border-blue-200 bg-blue-50'
            }>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <AlertDescription className={
                  testStatus === 'success' ? 'text-green-700' :
                  testStatus === 'error' ? 'text-red-700' :
                  'text-blue-700'
                }>
                  {getStatusMessage()}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Error Details */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="serverUrl">
              Vault Server URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="serverUrl"
              placeholder="http://vault.k8s.local/"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              disabled={isTesting}
            />
            <p className="text-xs text-muted-foreground">
              💡 Tip: Local K8s cluster Vault is at http://vault.k8s.local/
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="authMethod">Authentication Method</Label>
            <select
              id="authMethod"
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
              value={authMethod}
              onChange={(e) => setAuthMethod(e.target.value as 'token' | 'userpass')}
              disabled={isTesting}
            >
              <option value="token">🔑 Token (Root/Service Token)</option>
              <option value="userpass">👤 Username/Password</option>
            </select>
          </div>

          {authMethod === 'token' && (
            <div className="space-y-2">
              <Label htmlFor="token">
                Vault Token <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="token"
                  type={showToken ? 'text' : 'password'}
                  placeholder="hvs.CAESIJ... or root"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="pr-10"
                  disabled={isTesting}
                />
                {token && (
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isTesting}
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Use 'root' for local development or a service token for production
              </p>
            </div>
          )}

          {authMethod === 'userpass' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="username">
                  Username <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="username"
                  placeholder="myuser"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isTesting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    disabled={isTesting}
                  />
                  {password && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={isTesting}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="namespace">Vault Namespace (Optional)</Label>
            <Input
              id="namespace"
              placeholder="admin"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              disabled={isTesting}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty if not using Vault Enterprise namespaces
            </p>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleTest}
            disabled={isTesting}
          >
            {isTesting && testOnly ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isTesting && testStatus === 'testing'}
            >
              {testStatus === 'success' && testOnly ? 'Close' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isTesting || (testStatus === 'success' && !testOnly)}
            >
              {isTesting && !testOnly ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : testStatus === 'success' && !testOnly ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                'Save & Connect'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
