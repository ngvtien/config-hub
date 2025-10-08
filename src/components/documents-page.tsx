import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DocumentsPageProps {
  onBack?: () => void
}

export function DocumentsPage({ }: DocumentsPageProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
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