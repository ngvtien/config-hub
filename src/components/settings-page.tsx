import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useEnvironment } from '@/contexts/environment-context'
import { useEnvironmentSettings } from '@/hooks/use-environment-settings'
import { 
  Settings, 
  GitBranch, 
  Container, 
  Package,
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

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'git', label: 'Git Repositories', icon: GitBranch },
    { id: 'argocd', label: 'ArgoCD', icon: Container },
    { id: 'helm', label: 'Helm OCI', icon: Package }
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
      default:
        return renderGeneralSettings()
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? "secondary" : "ghost"}
                    className="w-full justify-start px-4 py-2"
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {section.label}
                  </Button>
                )
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const section = sections.find(s => s.id === activeSection)
                if (section?.icon) {
                  const Icon = section.icon
                  return <Icon className="w-5 h-5" />
                }
                return null
              })()}
              {sections.find(s => s.id === activeSection)?.label}
            </CardTitle>
            <CardDescription>
              Configure your {sections.find(s => s.id === activeSection)?.label.toLowerCase()} settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}