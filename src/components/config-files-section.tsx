import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, AlertCircle, FileText, Loader2 } from 'lucide-react'
import { ArgoCDApplication, getApplicationSource } from '@/types/argocd'

interface ConfigFilesSectionProps {
  application: ArgoCDApplication
}

export function ConfigFilesSection({ application }: ConfigFilesSectionProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Extract Git source information from the ArgoCD application
  const source = getApplicationSource(application)
  const repoUrl = source.repoURL
  const path = source.path || ''
  const branch = source.targetRevision || 'main'

  // Check if this is a Git-based application
  const isGitSource = repoUrl && !repoUrl.includes('oci://') && !source.chart

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // This will be implemented when we add file fetching logic
      // For now, just simulate a retry
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration files')
    } finally {
      setLoading(false)
    }
  }

  // Don't render if not a Git source
  if (!isGitSource) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Configuration Files
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Repository Information */}
        <div className="space-y-3 mb-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Repository:</span>
            <p className="font-mono text-xs mt-1 break-all">{repoUrl}</p>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Path:</span>
            <p className="font-mono text-xs mt-1">{path || '/'}</p>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Branch:</span>
            <p className="font-mono text-xs mt-1">{branch}</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Loading configuration files...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Placeholder for file list - will be implemented in next tasks */}
        {!loading && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Configuration file management coming soon</p>
            <p className="text-xs mt-1">
              You'll be able to view and edit YAML/JSON files directly from here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
