import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme-toggle'
import { Github, Zap, Code, Palette } from 'lucide-react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Electron + React + TypeScript
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
            Modern desktop app with Vite, Tailwind CSS, and shadcn/ui
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
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Welcome to your new Electron app!</CardTitle>
              <CardDescription>
                This template includes all the modern tools you need to build amazing desktop applications.
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
                  <span className="text-2xl font-bold w-12 text-center">{count}</span>
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
              
              <div className="space-y-2">
                <h3 className="font-semibold">Tech Stack:</h3>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• Electron for cross-platform desktop apps</li>
                  <li>• React 18 with TypeScript for type safety</li>
                  <li>• Vite for fast development and building</li>
                  <li>• Tailwind CSS for utility-first styling</li>
                  <li>• shadcn/ui for beautiful, accessible components</li>
                </ul>
              </div>
              
              <Separator />
              
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => window.open('https://electronjs.org')}>
                  <Github className="w-4 h-4 mr-2" />
                  Electron Docs
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => window.open('https://ui.shadcn.com')}>
                  <Palette className="w-4 h-4 mr-2" />
                  shadcn/ui
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default App