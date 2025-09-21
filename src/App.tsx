import { useState } from 'react'
import { AppLayout } from '@/components/app-layout'
import { TypographyShowcase } from '@/components/typography-showcase'
import { ZoomDemo } from '@/components/zoom-demo'
import { useZoomShortcuts } from '@/hooks/use-zoom-shortcuts'
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

  const renderContent = () => {
    switch (currentPage) {
      case 'typography':
        return <TypographyShowcase />
      default:
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
              <h1 className="text-display mb-4">
                Electron + React + TypeScript
              </h1>
              <p className="text-body text-muted-foreground mb-6">
                Modern desktop app with Vite, Tailwind CSS, and beautiful typography
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
                <CardTitle>Welcome to your new Electron app!</CardTitle>
                <CardDescription>
                  This template includes modern typography, beautiful components, and all the tools you need.
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

            <ZoomDemo />
          </div>
        )
    }
  }

  return (
    <AppLayout title={currentPage === 'typography' ? 'Typography System' : 'Dashboard'}>
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
  )
}

export default App