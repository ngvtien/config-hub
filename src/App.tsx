import { useState, lazy, Suspense } from 'react'
import { AppLayout } from '@/components/app-layout'
import { LoadingManager } from '@/components/loading-manager'
import { useZoomShortcuts } from '@/hooks/use-zoom-shortcuts'
import { useAssetPath } from '@/hooks/use-asset-path'

// Lazy load heavy components to improve initial load time
const TypographyShowcase = lazy(() => import('@/components/typography-showcase').then(m => ({ default: m.TypographyShowcase })))
const ZoomDemo = lazy(() => import('@/components/zoom-demo').then(m => ({ default: m.ZoomDemo })))
const SettingsPage = lazy(() => import('@/components/settings-page').then(m => ({ default: m.SettingsPage })))
const UsersPage = lazy(() => import('@/components/users-page').then(m => ({ default: m.UsersPage })))
const DocumentsPage = lazy(() => import('@/components/documents-page').then(m => ({ default: m.DocumentsPage })))
const AnalyticsPage = lazy(() => import('@/components/analytics-page').then(m => ({ default: m.AnalyticsPage })))
const ArgoCDPage = lazy(() => import('@/components/argocd-page').then(m => ({ default: m.ArgoCDPage })))
const TestFileEditor = lazy(() => import('@/pages/test-file-editor').then(m => ({ default: m.TestFileEditor })))
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ExternalLink, Zap, Code, Palette, Type } from 'lucide-react'

function App() {
  const [count, setCount] = useState(0)
  const [currentPage, setCurrentPage] = useState('dashboard')

  // Enable zoom keyboard shortcuts
  useZoomShortcuts()

  // Get asset paths for logos
  const lightLogo = useAssetPath('config-hub-logo-light.svg')
  const darkLogo = useAssetPath('config-hub-logo-dark.svg')

  const renderContent = () => {
    const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        {children}
      </Suspense>
    )

    switch (currentPage) {
      case 'typography':
        return <LazyWrapper><TypographyShowcase /></LazyWrapper>
      case 'argocd':
        return <LazyWrapper><ArgoCDPage /></LazyWrapper>
      case 'test-editor':
        return <LazyWrapper><TestFileEditor /></LazyWrapper>
      case 'settings':
        return <LazyWrapper><SettingsPage onBack={() => setCurrentPage('dashboard')} /></LazyWrapper>
      case 'users':
        return <LazyWrapper><UsersPage onBack={() => setCurrentPage('dashboard')} /></LazyWrapper>
      case 'documents':
        return <LazyWrapper><DocumentsPage onBack={() => setCurrentPage('dashboard')} /></LazyWrapper>
      case 'analytics':
        return <LazyWrapper><AnalyticsPage onBack={() => setCurrentPage('dashboard')} /></LazyWrapper>
      default:
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16">
                  {lightLogo && (
                    <img
                      src={lightLogo}
                      alt="Config Hub Logo"
                      className="w-16 h-16 dark:hidden"
                    />
                  )}
                  {darkLogo && (
                    <img
                      src={darkLogo}
                      alt="Config Hub Logo"
                      className="w-16 h-16 hidden dark:block"
                    />
                  )}
                </div>
              </div>
              <h1 className="text-display mb-4">
                Welcome to Config Hub
              </h1>
              <p className="text-body text-muted-foreground mb-6">
                Secure credential management for Git, Helm, ArgoCD, and Vault
              </p>

              <div className="flex justify-center gap-2 mb-8">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Electron
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Code className="w-3 h-3" />
                  React + TypeScript
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Palette className="w-3 h-3" />
                  Tailwind + shadcn/ui
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Type className="w-3 h-3" />
                  Inter Font
                </Badge>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Secure Credential Management</CardTitle>
                <CardDescription>
                  Config Hub provides military-grade encryption for storing and managing credentials across multiple environments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Counter:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCount(count - 1)}
                    >
                      -
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center font-mono">{count}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCount(count + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="text-title">Typography Features:</h3>
                  <ul className="text-body space-y-2">
                    <li>• <strong>Inter font family</strong> - Optimized for UI and readability</li>
                    <li>• <strong>JetBrains Mono</strong> - Perfect for code and monospace text</li>
                    <li>• <strong>Proper font scaling</strong> - Based on 1.125 modular scale</li>
                    <li>• <strong>OpenType features</strong> - Ligatures and stylistic sets</li>
                    <li>• <strong>Optimized rendering</strong> - Antialiasing and subpixel rendering</li>
                  </ul>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => setCurrentPage('typography')}
                  >
                    <Type className="w-4 h-4 mr-2" />
                    View Typography
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open('https://fonts.google.com/specimen/Inter')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Inter Font
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">🧪 Test Pages</h3>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setCurrentPage('test-editor')}
                  >
                    <Code className="w-4 h-4 mr-2" />
                    Test File Editor
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Code Example</CardTitle>
                <CardDescription>
                  Typography optimized for code readability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre><code>{`// Modern TypeScript with beautiful typography
interface TypographyConfig {
  fontFamily: 'Inter' | 'JetBrains Mono';
  fontSize: number;
  lineHeight: number;
  letterSpacing: string;
}

const config: TypographyConfig = {
  fontFamily: 'Inter',
  fontSize: 16,
  lineHeight: 1.5,
  letterSpacing: '0'
};`}</code></pre>
              </CardContent>
            </Card>

            <LazyWrapper><ZoomDemo /></LazyWrapper>
          </div>
        )
    }
  }

  const getPageTitle = () => {
    switch (currentPage) {
      case 'typography':
        return 'Typography System'
      case 'argocd':
        return 'ArgoCD Applications'
      case 'test-editor':
        return 'File Editor Test'
      case 'settings':
        return 'Settings'
      case 'users':
        return 'Users'
      case 'documents':
        return 'Documents'
      case 'analytics':
        return 'Analytics'
      default:
        return 'Dashboard'
    }
  }

  return (
    <>
      <LoadingManager />
      <AppLayout title={getPageTitle()} currentPage={currentPage} onNavigate={setCurrentPage}>
        {currentPage === 'typography' && (
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage('dashboard')}
            >
              ← Back to Dashboard
            </Button>
          </div>
        )}
        {renderContent()}
      </AppLayout>
    </>
  )
}

export default App