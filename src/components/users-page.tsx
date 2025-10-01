import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, User, Shield, RefreshCw, LogIn, AlertCircle, Info, Eye, EyeOff } from 'lucide-react'
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
  const [switchSuccess, setSwitchSuccess] = useState<string | null>(null)
  const [showAllGroups, setShowAllGroups] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSwitchUser = async () => {
    if (!switchUsername.trim()) {
      setSwitchError('Username is required')
      return
    }

    setIsSwitching(true)
    setSwitchError(null)
    setSwitchSuccess(null)

    try {
      const success = await switchUser(switchUsername, switchPassword || undefined)
      if (success) {
        setSwitchSuccess(`Successfully tested user context for "${switchUsername}". Commands can be executed as this user.`)
        setSwitchError(null)
        // Don't clear the form on success so user can test again if needed
      } else {
        setSwitchError('Failed to test user context. This could mean invalid credentials, insufficient permissions, or the user account is disabled.')
        setSwitchSuccess(null)
      }
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : 'Unknown error occurred while testing user context')
      setSwitchSuccess(null)
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
                {currentUser.fullName && currentUser.fullName !== 'Comment' && currentUser.fullName !== currentUser.username && (
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
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Groups ({currentUser.groups.length})</Label>
                    {currentUser.groups.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllGroups(!showAllGroups)}
                        className="h-auto p-1 text-xs"
                      >
                        {showAllGroups ? (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Show All
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(showAllGroups ? currentUser.groups : currentUser.groups.slice(0, 3)).map((group, index) => {
                      // Clean up group names - remove long prefixes and show readable names
                      const cleanGroupName = group
                        .replace(/^.*\\/, '') // Remove domain prefix
                        .replace(/^NT AUTHORITY\\/, '') // Remove NT AUTHORITY prefix
                        .replace(/^BUILTIN\\/, '') // Remove BUILTIN prefix
                        .replace(/^.*\src-users$/, 'Docker Users') // Clean docker group names
                        .replace(/Local account and member of Administrators group/, 'Local Admin')
                      
                      return (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs max-w-48 truncate"
                          title={group} // Show full name on hover
                        >
                          {cleanGroupName}
                        </Badge>
                      )
                    })}
                    {!showAllGroups && currentUser.groups.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{currentUser.groups.length - 3} more
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
      <Card>
        <CardHeader>
          <CardTitle>Available Users</CardTitle>
          <CardDescription>
            Other users available on this system (requires administrator privileges to view)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading available users...
            </div>
          ) : availableUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {availableUsers
                .filter(user => user.username && user.username.trim() && 
                  !['The', 'command', 'completed', 'successfully', 'successfully.'].includes(user.username.trim()))
                .map((user, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSwitchUsername(user.username)}
                    title={`Click to use "${user.username}" for user switching`}
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{user.username}</span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-2">No other users found</p>
              <p className="text-xs text-muted-foreground">
                {currentUser?.isAdmin 
                  ? "This system may only have your user account, or other users are hidden."
                  : "Administrator privileges are required to view other users on this system."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Switching */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="w-5 h-5" />
            Test User Context
          </CardTitle>
          <CardDescription>
            Test running commands as a different user (experimental feature)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>What this does:</strong> This feature tests if you can run commands as another user. 
              It doesn't actually switch your Windows session - it's primarily for testing user permissions and credentials.
            </AlertDescription>
          </Alert>

          {switchSuccess && (
            <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{switchSuccess}</AlertDescription>
            </Alert>
          )}

          {switchError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{switchError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="switch-username">Username</Label>
                <Input
                  id="switch-username"
                  type="text"
                  placeholder="Enter username to test"
                  value={switchUsername}
                  onChange={(e) => setSwitchUsername(e.target.value)}
                  disabled={isSwitching}
                />
                <p className="text-xs text-muted-foreground">
                  Click on a user above to auto-fill this field
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="switch-password" className="flex items-center gap-2">
                  Password (optional)
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                </Label>
                <Input
                  id="switch-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password if required"
                  value={switchPassword}
                  onChange={(e) => setSwitchPassword(e.target.value)}
                  disabled={isSwitching}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to test without password authentication
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleSwitchUser}
                disabled={isSwitching || !switchUsername.trim()}
                className="flex-1 sm:flex-none"
              >
                {isSwitching ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Test User Context
                  </>
                )}
              </Button>
              
              {(switchUsername || switchPassword) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSwitchUsername('')
                    setSwitchPassword('')
                    setSwitchError(null)
                    setSwitchSuccess(null)
                  }}
                  disabled={isSwitching}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> This feature requires administrator privileges and is primarily for testing purposes. 
              It validates if you can execute commands as the specified user but doesn't change your actual Windows login session.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}