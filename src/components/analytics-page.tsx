import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3 } from 'lucide-react'

interface AnalyticsPageProps {
  onBack?: () => void
}

export function AnalyticsPage({ onBack }: AnalyticsPageProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Analytics
          </h1>
          <p className="text-muted-foreground">View analytics and reports</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>
            This page is under construction. Analytics features will be available soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}