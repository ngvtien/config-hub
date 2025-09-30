import { useState } from 'react'
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
import { 
  Settings, 
  GitBranch, 
  Container, 
  Package,
  Shield,
  Save,
  RefreshCw,
  Globe
} from 'lucide-react'

interface SettingsPageProps {
  onBack?: () => void
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { environment, instance, getContextKey } = useEnvironment()
  const { settings, updateSection } = useEnvironmentSettings()
  const [activeSection, setActiveSection] = useState('general')
  
  // Automatically store Vault credentials when settings change
  useVaultCredentials()

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'git', label: 'Git Repositories', icon: GitBranch },
    { id: 'argocd', label: 'ArgoCD', icon: Container },
    { id: 'helm', label: 'Helm OCI', icon: Package },
    { id: 'vault', label: 'HashiCorp Vault', icon: Shield }
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

  const renderGitSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Git Configuration</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultBranch">Default Branch</Label>
              <Input
                id="defaultBranch"
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

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Connected Repositories</h3>
          <Button size="sm">
            <GitBranch className="w-4 h-4 mr-2" />
            Add Repository
          </Button>
        </div>
        
        <div className="space-y-3">
          {settings.git.repositories.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center text-muted-foreground">
                No repositories configured for {getContextKey().toUpperCase()}
              </CardContent>
            </Card>
          ) : (
            settings.git.repositories.map((repo, index) => (
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
    </div>
  )

  const renderArgoCDSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">ArgoCD Configuration</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="argoCDUrl">Server URL</Label>
            <Input
              id="argoCDUrl"
              placeholder="https://argocd.example.com"
              value={settings.argocd.serverUrl}
              onChange={(e) => updateSection('argocd', { serverUrl: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="argoCDUsername">Username</Label>
              <Input
                id="argoCDUsername"
                value={settings.argocd.username}
                onChange={(e) => updateSection('argocd', { username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="argoCDToken">Auth Token</Label>
              <Input
                id="argoCDToken"
                type="password"
                value={settings.argocd.token}
                onChange={(e) => updateSection('argocd', { token: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="argoCDNamespace">Namespace</Label>
              <Input
                id="argoCDNamespace"
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
          </div>
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

  const renderVaultSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">HashiCorp Vault Configuration</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="vaultUrl">Vault Server URL</Label>
            <Input
              id="vaultUrl"
              placeholder="https://vault.example.com:8200"
              value={settings.vault.serverUrl}
              onChange={(e) => updateSection('vault', { serverUrl: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="vaultAuthMethod">Authentication Method</Label>
            <select 
              id="vaultAuthMethod"
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
              value={settings.vault.authMethod}
              onChange={(e) => updateSection('vault', { authMethod: e.target.value as any })}
            >
              <option value="token">Token</option>
              <option value="userpass">Username/Password</option>
              <option value="ldap">LDAP</option>
              <option value="kubernetes">Kubernetes</option>
              <option value="aws">AWS IAM</option>
              <option value="azure">Azure</option>
            </select>
          </div>

          {/* Token Authentication */}
          {settings.vault.authMethod === 'token' && (
            <div>
              <Label htmlFor="vaultToken">Vault Token</Label>
              <Input
                id="vaultToken"
                type="password"
                placeholder="hvs.CAESIJ..."
                value={settings.vault.token}
                onChange={(e) => updateSection('vault', { token: e.target.value })}
              />
            </div>
          )}

          {/* Username/Password Authentication */}
          {settings.vault.authMethod === 'userpass' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vaultUsername">Username</Label>
                <Input
                  id="vaultUsername"
                  value={settings.vault.username}
                  onChange={(e) => updateSection('vault', { username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="vaultPassword">Password</Label>
                <Input
                  id="vaultPassword"
                  type="password"
                  value={settings.vault.password}
                  onChange={(e) => updateSection('vault', { password: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* LDAP Authentication */}
          {settings.vault.authMethod === 'ldap' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vaultLdapUsername">LDAP Username</Label>
                <Input
                  id="vaultLdapUsername"
                  value={settings.vault.username}
                  onChange={(e) => updateSection('vault', { username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="vaultLdapPassword">LDAP Password</Label>
                <Input
                  id="vaultLdapPassword"
                  type="password"
                  value={settings.vault.password}
                  onChange={(e) => updateSection('vault', { password: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Kubernetes Authentication */}
          {settings.vault.authMethod === 'kubernetes' && (
            <div>
              <Label htmlFor="vaultK8sRole">Kubernetes Role</Label>
              <Input
                id="vaultK8sRole"
                placeholder="my-role"
                value={settings.vault.kubernetesRole}
                onChange={(e) => updateSection('vault', { kubernetesRole: e.target.value })}
              />
            </div>
          )}

          {/* AWS Authentication */}
          {settings.vault.authMethod === 'aws' && (
            <div>
              <Label htmlFor="vaultAwsRole">AWS Role</Label>
              <Input
                id="vaultAwsRole"
                placeholder="my-aws-role"
                value={settings.vault.awsRole}
                onChange={(e) => updateSection('vault', { awsRole: e.target.value })}
              />
            </div>
          )}

          {/* Azure Authentication */}
          {settings.vault.authMethod === 'azure' && (
            <div>
              <Label htmlFor="vaultAzureRole">Azure Role</Label>
              <Input
                id="vaultAzureRole"
                placeholder="my-azure-role"
                value={settings.vault.azureRole}
                onChange={(e) => updateSection('vault', { azureRole: e.target.value })}
              />
            </div>
          )}

          <Separator />

          {/* Common Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vaultNamespace">Vault Namespace</Label>
              <Input
                id="vaultNamespace"
                placeholder="admin (optional)"
                value={settings.vault.namespace}
                onChange={(e) => updateSection('vault', { namespace: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="vaultMountPath">Mount Path</Label>
              <Input
                id="vaultMountPath"
                placeholder="secret"
                value={settings.vault.mountPath}
                onChange={(e) => updateSection('vault', { mountPath: e.target.value })}
              />
            </div>
          </div>
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

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings()
      case 'git':
        return renderGitSettings()
      case 'argocd':
        return renderArgoCDSettings()
      case 'helm':
        return renderHelmOCISettings()
      case 'vault':
        return renderVaultSettings()
      default:
        return renderGeneralSettings()
    }
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
                  <Icon className="w-4 h-4 flex-shrink-0" />
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
                  className={`flex items-center gap-2 whitespace-nowrap flex-shrink-0 min-w-fit px-3 py-2 transition-all ${
                    isActive 
                      ? 'shadow-sm' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <Icon className="w-4 h-4" />
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
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
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
              <CardTitle className="flex items-center gap-2">
                <Container className="w-5 h-5" />
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
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
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
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
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