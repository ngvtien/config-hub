import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  PanelLeftClose,
  Type,
  Keyboard,
  Settings,
  BookOpen,
  Lightbulb,
  HelpCircle,
  Monitor,
  Save,
  Users,
  Shield,
  Key,
  Lock,
  GitBranch,
  Database
} from 'lucide-react'

interface HelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSection?: string
}

export function HelpDialog({ open, onOpenChange, initialSection = 'overview' }: HelpDialogProps) {
  const [currentSection, setCurrentSection] = useState(initialSection)

  const sections = {
    overview: {
      title: 'App Overview',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <p className="text-body">
            Welcome to your modern Electron app! This application combines the power of desktop
            software with modern web technologies to provide a seamless user experience.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Built With</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Electron</Badge>
                  <span className="text-sm text-muted-foreground">Desktop framework</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">React</Badge>
                  <span className="text-sm text-muted-foreground">UI library</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">TypeScript</Badge>
                  <span className="text-sm text-muted-foreground">Type safety</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Tailwind CSS</Badge>
                  <span className="text-sm text-muted-foreground">Styling</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Key Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <ZoomIn className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Zoom controls</span>
                </div>
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Typography system</span>
                </div>
                <div className="flex items-center gap-2">
                  <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Collapsible sidebar</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">User management</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">ArgoCD integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">HashiCorp Vault</span>
                </div>
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Persistent preferences</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },

    'quick-start': {
      title: 'Quick Start Guide',
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <p className="text-body">
            Get up and running quickly with these essential tips:
          </p>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">1</div>
              <div>
                <h4 className="font-medium">Navigate the Interface</h4>
                <p className="text-sm text-muted-foreground">Use the sidebar to access different sections. Click the chevron to collapse it.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">2</div>
              <div>
                <h4 className="font-medium">Adjust Zoom Level</h4>
                <p className="text-sm text-muted-foreground">Use Ctrl+Plus/Minus or the zoom controls in the header to adjust text size.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">3</div>
              <div>
                <h4 className="font-medium">Access Help</h4>
                <p className="text-sm text-muted-foreground">Press Ctrl+K to open the command palette or click the help button.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">4</div>
              <div>
                <h4 className="font-medium">Customize Your Experience</h4>
                <p className="text-sm text-muted-foreground">Your preferences (zoom level, sidebar state) are automatically saved.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },

    zoom: {
      title: 'Zoom Controls',
      icon: ZoomIn,
      content: (
        <div className="space-y-4">
          <p className="text-body">
            Adjust the app's zoom level for better readability and comfort.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  <span className="text-sm">Zoom In</span>
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline" className="font-mono text-xs">Ctrl++</Badge>
                  <Badge variant="outline" className="font-mono text-xs">Ctrl+Wheel↑</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ZoomOut className="h-4 w-4" />
                  <span className="text-sm">Zoom Out</span>
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline" className="font-mono text-xs">Ctrl+-</Badge>
                  <Badge variant="outline" className="font-mono text-xs">Ctrl+Wheel↓</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-sm">Reset Zoom</span>
                </div>
                <Badge variant="outline" className="font-mono text-xs">Ctrl+0</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span className="text-sm">Header Controls</span>
                </div>
                <span className="text-xs text-muted-foreground">Click zoom buttons</span>
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Tip:</strong> Your zoom level is automatically saved and restored when you restart the app.
            </p>
          </div>
        </div>
      )
    },

    sidebar: {
      title: 'Sidebar Management',
      icon: PanelLeftClose,
      content: (
        <div className="space-y-4">
          <p className="text-body">
            The sidebar provides quick access to different sections of the app and can be customized to your preference.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sidebar Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <PanelLeftClose className="h-4 w-4 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Collapsible Design</h4>
                  <p className="text-xs text-muted-foreground">Click the chevron button to collapse/expand the sidebar</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Save className="h-4 w-4 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Persistent State</h4>
                  <p className="text-xs text-muted-foreground">Your collapse preference is remembered between sessions</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Monitor className="h-4 w-4 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Responsive</h4>
                  <p className="text-xs text-muted-foreground">Automatically adapts to different screen sizes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },

    typography: {
      title: 'Typography System',
      icon: Type,
      content: (
        <div className="space-y-4">
          <p className="text-body">
            The app uses a carefully crafted typography system for optimal readability and visual hierarchy.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Font Stack</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="text-sm font-medium">Primary Font: Inter</h4>
                <p className="text-xs text-muted-foreground">Optimized for UI elements and body text</p>
              </div>

              <div>
                <h4 className="text-sm font-medium font-mono">Monospace Font: JetBrains Mono</h4>
                <p className="text-xs text-muted-foreground">Perfect for code blocks and technical content</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Typography Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• Modular scale based on 1.125 ratio</div>
                <div>• OpenType features for improved rendering</div>
                <div>• Optimized line heights and letter spacing</div>
                <div>• Semantic heading hierarchy (H1-H6)</div>
                <div>• Utility classes for common patterns</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },

    shortcuts: {
      title: 'Keyboard Shortcuts',
      icon: Keyboard,
      content: (
        <div className="space-y-4">
          <p className="text-body">
            Master these keyboard shortcuts to work more efficiently.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Command Palette</span>
                  <Badge variant="outline" className="font-mono text-xs">Ctrl+K</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Help Dialog</span>
                  <Badge variant="outline" className="font-mono text-xs">F1</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Zoom</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Zoom In</span>
                  <Badge variant="outline" className="font-mono text-xs">Ctrl++</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Zoom Out</span>
                  <Badge variant="outline" className="font-mono text-xs">Ctrl+-</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reset Zoom</span>
                  <Badge variant="outline" className="font-mono text-xs">Ctrl+0</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },

    preferences: {
      title: 'App Preferences',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <p className="text-body">
            Your app preferences are automatically managed and persisted.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Automatically Saved</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
                <div>
                  <h4 className="text-sm font-medium">Zoom Level</h4>
                  <p className="text-xs text-muted-foreground">Current zoom preference (25% - 500%)</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
                <div>
                  <h4 className="text-sm font-medium">Sidebar State</h4>
                  <p className="text-xs text-muted-foreground">Collapsed or expanded preference</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <div>
                  <h4 className="text-sm font-medium">Window State</h4>
                  <p className="text-xs text-muted-foreground">Size, position, and maximized state</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },

    persistence: {
      title: 'Data Persistence',
      icon: HelpCircle,
      content: (
        <div className="space-y-4">
          <p className="text-body">
            Learn how your data and preferences are stored and managed.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Storage Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your preferences are stored in JSON files in your system's user data directory:
              </p>

              <div className="bg-muted p-3 rounded-md font-mono text-xs">
                <div>Windows: %APPDATA%/electron-react-app/</div>
                <div>macOS: ~/Library/Application Support/electron-react-app/</div>
                <div>Linux: ~/.config/electron-react-app/</div>
              </div>

              <div className="space-y-2">
                <div className="text-xs">
                  <strong>zoom-state.json</strong> - Zoom level preference
                </div>
                <div className="text-xs">
                  <strong>sidebar-state.json</strong> - Sidebar collapse state
                </div>
                <div className="text-xs">
                  <strong>window-state.json</strong> - Window size and position
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },

    'user-management': {
      title: 'User Management',
      icon: Users,
      content: (
        <div className="space-y-4">
          <p className="text-body">
            Manage system users and user contexts within the application.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Current User Detection</h4>
                  <p className="text-xs text-muted-foreground">Automatically detects current system user, domain, and admin privileges</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Available Users</h4>
                  <p className="text-xs text-muted-foreground">Lists other users on the system (requires admin privileges)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Key className="h-4 w-4 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">User Context Switching</h4>
                  <p className="text-xs text-muted-foreground">Experimental feature to switch user contexts with credentials</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How to Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">Click the user area in the sidebar footer</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Or navigate to Users from the sidebar menu</span>
              </div>
            </CardContent>
          </Card>

          <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Some features require administrator privileges and work best on Windows domain environments.
            </p>
          </div>
        </div>
      )
    },

    'argocd-integration': {
      title: 'ArgoCD Integration',
      icon: GitBranch,
      content: (
        <div className="space-y-4">
          <p className="text-body">
            Connect to and manage ArgoCD applications directly from the desktop app.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <GitBranch className="h-4 w-4 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Application Management</h4>
                  <p className="text-xs text-muted-foreground">View, sync, and manage ArgoCD applications</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Monitor className="h-4 w-4 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Real-time Status</h4>
                  <p className="text-xs text-muted-foreground">Monitor sync and health status of applications</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Settings className="h-4 w-4 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Parameter Management</h4>
                  <p className="text-xs text-muted-foreground">Edit and compare application parameters</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs space-y-2">
                <div className="font-medium">Option 1: Username/Password (Easiest)</div>
                <div className="pl-3 space-y-1">
                  <div>1. Go to Settings → ArgoCD</div>
                  <div>2. Enter Server URL, Username, and Password</div>
                  <div>3. Click "Test Connection" then "Save"</div>
                  <div>4. Navigate to ArgoCD page</div>
                </div>

                <div className="font-medium pt-2">Option 2: Service Account Token</div>
                <div className="pl-3 space-y-1">
                  <div>1. Run setup script (see ARGOCD_README.md)</div>
                  <div>2. Copy the generated token</div>
                  <div>3. Go to Settings → ArgoCD</div>
                  <div>4. Paste token in "Auth Token" field</div>
                  <div>5. Click "Test Connection" then "Save"</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs space-y-1">
                <div>• Multiple authentication methods</div>
                <div>• Password visibility toggle (eye icon)</div>
                <div>• Secure credential storage (OS-level encryption)</div>
                <div>• Test connection before saving</div>
                <div>• Support for self-signed certificates</div>
                <div>• Configurable auto-refresh interval (5-300 seconds)</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Auto-Refresh Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs space-y-1">
                <div>• Default: 30 seconds polling interval</div>
                <div>• Configurable range: 5-300 seconds</div>
                <div>• Set in Settings → ArgoCD → Auto-Refresh field</div>
                <div>• Polls GET /applications API endpoint</div>
                <div>• Updates sync status, health status, and metadata</div>
                <div>• Manual refresh available anytime via Refresh button</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs space-y-1">
                <div>📖 See <span className="font-mono">ARGOCD_README.md</span> for:</div>
                <div className="pl-3">• Complete setup guide</div>
                <div className="pl-3">• Troubleshooting tips</div>
                <div className="pl-3">• Security best practices</div>
                <div className="pl-3">• WSL/MicroK8s instructions</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },

    'vault-integration': {
      title: 'HashiCorp Vault',
      icon: Lock,
      content: (
        <div className="space-y-4">
          <p className="text-body">
            Securely manage secrets and credentials using HashiCorp Vault integration.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Supported Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Key className="h-4 w-4 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Token Authentication</h4>
                  <p className="text-xs text-muted-foreground">Direct token-based access</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Username/Password</h4>
                  <p className="text-xs text-muted-foreground">Traditional username and password authentication</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">LDAP Integration</h4>
                  <p className="text-xs text-muted-foreground">Enterprise LDAP authentication</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Database className="h-4 w-4 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Cloud Providers</h4>
                  <p className="text-xs text-muted-foreground">AWS, Azure, and Kubernetes authentication</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Secret Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs space-y-1">
                <div>• Read and write secrets to KV stores</div>
                <div>• List available secret paths</div>
                <div>• Delete secrets securely</div>
                <div>• Monitor Vault health status</div>
                <div>• Support for multiple environments</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs space-y-1">
                <div>1. Go to Settings → Vault Configuration</div>
                <div>2. Enter Vault server URL and choose auth method</div>
                <div>3. Provide credentials based on selected method</div>
                <div>4. Configure mount path and namespace (if needed)</div>
                <div>5. Test connection and save configuration</div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Security:</strong> All Vault operations are performed securely through the main process with encrypted credential storage.
            </p>
          </div>
        </div>
      )
    },

    'environment-management': {
      title: 'Environment Management',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <p className="text-body">
            Manage different environments and instances for your integrations and configurations.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available Environments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">DEV</Badge>
                  <span className="text-sm">Development</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">SIT</Badge>
                  <span className="text-sm">System Integration Test</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">UAT</Badge>
                  <span className="text-sm">User Acceptance Test</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">PROD</Badge>
                  <span className="text-sm">Production</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instance Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Each environment supports multiple instances (0-3) for different configurations:
              </p>
              <div className="text-xs space-y-1">
                <div>• Separate ArgoCD configurations per environment/instance</div>
                <div>• Independent Vault connections</div>
                <div>• Isolated settings and credentials</div>
                <div>• Environment-specific user contexts</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How to Switch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs space-y-1">
                <div>1. Use the environment selector in the header</div>
                <div>2. Choose your target environment (DEV/SIT/UAT/PROD)</div>
                <div>3. Select the instance number (0-3)</div>
                <div>4. Configure settings for each environment separately</div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Tip:</strong> Your environment selection is automatically saved and restored when you restart the app.
            </p>
          </div>
        </div>
      )
    }
  }

  const currentSectionData = sections[currentSection as keyof typeof sections]
  const Icon = currentSectionData?.icon || HelpCircle

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {currentSection !== 'overview' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentSection('overview')}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Icon className="h-5 w-5" />
            <DialogTitle>{currentSectionData?.title || 'Help'}</DialogTitle>
          </div>
          <DialogDescription>
            Press <Badge variant="outline" className="font-mono text-xs mx-1">Ctrl+K</Badge>
            to open the command palette for quick navigation.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {currentSectionData?.content}
        </div>

        {currentSection === 'overview' && (
          <>
            <Separator />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(sections).filter(([key]) => key !== 'overview').map(([key, section]) => {
                const SectionIcon = section.icon
                return (
                  <Button
                    key={key}
                    variant="ghost"
                    className="h-auto p-3 flex flex-col items-center gap-2"
                    onClick={() => setCurrentSection(key)}
                  >
                    <SectionIcon className="h-5 w-5" />
                    <span className="text-xs">{section.title}</span>
                  </Button>
                )
              })}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}