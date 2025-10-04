import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ZoomIn, HelpCircle } from 'lucide-react'

export function ZoomDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ZoomIn className="h-5 w-5" />
          Interactive Features Demo
        </CardTitle>
        <CardDescription>
          Test the app's zoom and sidebar features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border-2 border-dashed border-border rounded-lg text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Try zooming now to see this content scale!
          </p>
          <div className="flex justify-center gap-2 mb-3">
            <Badge>Sample</Badge>
            <Badge variant="secondary">Content</Badge>
            <Badge variant="outline">Here</Badge>
          </div>
          <div className="flex justify-center gap-2 text-xs text-muted-foreground">
            <span>Use Ctrl+Plus/Minus or mouse wheel</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Need help? Press <Badge variant="outline" className="font-mono text-xs mx-1">Ctrl+K</Badge> or <Badge variant="outline" className="font-mono text-xs mx-1">F1</Badge>
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Quick shortcuts:</span>
          <div className="flex gap-1">
            <Badge variant="outline" className="font-mono text-xs">Ctrl+K</Badge>
            <Badge variant="outline" className="font-mono text-xs">F1</Badge>
            <Badge variant="outline" className="font-mono text-xs">?</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}