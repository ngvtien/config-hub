import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, User, Shield, RefreshCw, LogIn, AlertCircle } from 'lucide-react'
import { useUserManagement } from '@/hooks/use-user-management'

interface UsersPageProps {
  onBack?: () => void
}

export function UsersPage({ onBack }: UsersPageProps) {
  const {
    currentUser,
    availableUsers,
    isLoading,
    error,
    switchUser,
    refreshUserInfo
  } = useUserManagement()

  const [switchUsername, setSwitchUsername] = useState('')
  const [switchPassword, setSwitchPassword] = useState('')
  const [isSwitching, setIsSwitching] = useState(false)
  const [switchError, setSwitchError] = useState<string | null>(null)

  const handleSwitchUser = async () => {
    if (!switchUsername.trim()) {
      setSwitchError('Username is required')
      return
    }

    setIsSwitching(true)
    setSwitchError(null)

    try {
      const success = await switchUser(switchUsername, switchPassword || undefined)
      if (success) {
        setSwitchUsername('')
        setSwitchPassword('')
        setSwitchError(null)
      } else {
        setSwitchError('Failed to switch user. Check credentials and permissions.')
      }
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsSwitching(false)
    }
  }

  const handleRefresh = async () => {
    await refreshUserInfo()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            Users
          </h1>
          <p className="text-muted-foreground">System user information and management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              ← Back
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Current User
          </CardTitle>
          <CardDescription>
            Information about the currently logged-in system user
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading user information...
            </div>
          ) : currentUser ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Username</Label>
                  <p className="text-sm text-muted-foreground">{currentUser.username}</p>
                </div>
                {currentUser.fullName && (
                  <div>
                    <Label className="text-sm font-medium">Full Name</Label>
                    <p className="text-sm text-muted-foreground">{currentUser.fullName}</p>
                  </div>
                )}
                {currentUser.domain && (
                  <div>
                    <Label className="text-sm font-medium">Domain</Label>
                    <p className="text-sm text-muted-foreground">{currentUser.domain}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Admin Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {currentUser.isAdmin ? (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Administrator
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Standard User</Badge>
                    )}
                  </div>
                </div>
              </div>

              {currentUser.groups && currentUser.groups.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Groups</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentUser.groups.slice(0, 5).map((group, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {group}
                      </Badge>
                    ))}
                    {currentUser.groups.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{currentUser.groups.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No user information available</p>
          )}
        </CardContent>
      </Card>

      {/* Available Users */}
      {availableUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Users</CardTitle>
            <CardDescription>
              Other users available on this system (requires administrator privileges to view)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {availableUsers.map((user, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{user.username}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Switching */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="w-5 h-5" />
            Switch User Context
          </CardTitle>
          <CardDescription>
            Switch to a different user context (requires valid credentials)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              User switching is experimental and may require administrator privileges.
              This feature is primarily for testing different user contexts.
            </AlertDescription>
          </Alert>

          {switchError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{switchError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="switch-username">Username</Label>
              <Input
                id="switch-username"
                type="text"
                placeholder="Enter username"
                value={switchUsername}
                onChange={(e) => setSwitchUsername(e.target.value)}
                disabled={isSwitching}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="switch-password">Password (optional)</Label>
              <Input
                id="switch-password"
                type="password"
                placeholder="Enter password"
                value={switchPassword}
                onChange={(e) => setSwitchPassword(e.target.value)}
                disabled={isSwitching}
              />
            </div>
          </div>

          <Button
            onClick={handleSwitchUser}
            disabled={isSwitching || !switchUsername.trim()}
            className="w-full md:w-auto"
          >
            {isSwitching ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Switching...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Switch User
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}