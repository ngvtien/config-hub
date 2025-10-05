import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, HelpCircle, Loader2, Shield, ExternalLink } from 'lucide-react'

interface GitAuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  repositoryUrl: string
  onAuthenticate: (credentials: GitCredentials) => Promise<void>
}

export interface GitCredentials {
  username: string
  token: string
  authMethod: 'token' | 'oauth'
}

export function GitAuthDialog({
  open,
  onOpenChange,
  repositoryUrl,
  onAuthenticate,
}: GitAuthDialogProps) {
  const [authMethod, setAuthMethod] = useState<'token' | 'oauth'>('token')
  const [username, setUsername] = useState('')
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validation
  const isValid = username.trim() !== '' && token.trim() !== ''

  const handleAuthenticate = async () => {
    if (!isValid) return

    setIsAuthenticating(true)
    setError(null)

    try {
      // Store credential using IPC
      const credentialConfig: GitConfig = {
        name: `${repositoryUrl} - ${username.trim()}`,
        repoUrl: repositoryUrl,
        authType: 'token',
        username: username.trim(),
        token: token.trim(),
      }

      const result: GitResponse = await window.electronAPI.git.storeCredential(credentialConfig)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to store credentials')
      }

      // Test the credential
      const testResult: GitResponse = await window.electronAPI.git.testCredential(result.credentialId!)
      
      if (!testResult.success) {
        throw new Error(testResult.error || 'Authentication failed')
      }

      // Call the callback with credentials
      await onAuthenticate({
        username: username.trim(),
        token: token.trim(),
        authMethod,
      })
      
      // Success - close dialog and reset form
      setUsername('')
      setToken('')
      setShowToken(false)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleCancel = () => {
    setUsername('')
    setToken('')
    setShowToken(false)
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Git Authentication</DialogTitle>
          <DialogDescription>
            Authenticate with Bitbucket Server to access configuration files
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Repository URL Display */}
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm font-medium mb-1">Repository</p>
            <p className="text-sm text-muted-foreground font-mono break-all">
              {repositoryUrl}
            </p>
          </div>

          {/* Authentication Method Tabs */}
          <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'token' | 'oauth')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="token">Personal Access Token</TabsTrigger>
              <TabsTrigger value="oauth" disabled>
                OAuth
              </TabsTrigger>
            </TabsList>

            <TabsContent value="token" className="space-y-4 mt-4">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="john.doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isAuthenticating}
                />
              </div>

              {/* Token Field */}
              <div className="space-y-2">
                <Label htmlFor="token">Personal Access Token</Label>
                <div className="relative">
                  <Input
                    id="token"
                    type={showToken ? 'text' : 'password'}
                    placeholder="Enter your personal access token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={isAuthenticating}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowToken(!showToken)}
                    disabled={isAuthenticating}
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Help Information */}
              <Alert>
                <HelpCircle className="h-4 w-4" />
                <AlertDescription className="text-xs space-y-2">
                  <p>
                    Your credentials are encrypted and stored locally using OS-level security. They will be used for all Git
                    operations with proper user attribution.
                  </p>
                  <p className="font-medium">Required Token Permissions:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Repository Read</li>
                    <li>Repository Write (for creating branches and commits)</li>
                    <li>Pull Request Read & Write (for creating PRs)</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Help Links */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a
                    href="https://confluence.atlassian.com/bitbucketserver/personal-access-tokens-939515499.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    How to create a personal access token
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a
                    href="https://confluence.atlassian.com/bitbucketserver/personal-access-tokens-939515499.html#Personalaccesstokens-Tokenscopes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Understanding token permissions and scopes
                  </a>
                </div>
              </div>

              {/* Security Best Practices */}
              <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-3 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <p className="font-medium">Security Best Practices:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>Use tokens with minimal required permissions</li>
                      <li>Rotate tokens regularly (every 90 days recommended)</li>
                      <li>Never share tokens or commit them to version control</li>
                      <li>Revoke tokens immediately if compromised</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="oauth" className="space-y-4 mt-4">
              <Alert>
                <AlertDescription>
                  OAuth authentication is coming soon. Please use Personal Access Token for now.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isAuthenticating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAuthenticate}
              disabled={!isValid || isAuthenticating}
            >
              {isAuthenticating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Authenticate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
