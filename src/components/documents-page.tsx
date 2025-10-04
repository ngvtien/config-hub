import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

interface DocumentsPageProps {
  onBack?: () => void
}

export function DocumentsPage({ onBack }: DocumentsPageProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Documents
          </h1>
          <p className="text-muted-foreground">Manage your documents and files</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
          <CardDescription>
            This page is under construction. Document management features will be available soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}