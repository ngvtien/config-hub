import React, { useState } from 'react'
import { useArgoCDApplication } from '@/hooks/use-argocd'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  ArrowLeft,
  RefreshCw,
  GitBranch,
  Server,
  Clock,
  AlertCircle,
  CheckCircle,
  Play,
  FileText,
  Calendar,
  Settings,
  Eye,
  GitCompare
} from 'lucide-react'

interface ArgoCDApplicationDetailProps {
  applicationName: string
  namespace?: string
  onBack: () => void
}

export function ArgoCDApplicationDetail({ 
  applicationName, 
  namespace, 
  onBack 
}: ArgoCDApplicationDetailProps) {
  const {
    application,
    logs,
    events,
    parameters,
    loading,
    error,
    fetchApplication,
    syncApplication,
    compareParameters
  } = useArgoCDApplication(applicationName, namespace)

  const [showLogs, setShowLogs] = useState(false)
  const [showEvents, setShowEvents] = useState(false)
  const [showParameters, setShowParameters] = useState(false)
  const [syncing, setSyncing] = useState(false)

  if (!application && !loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Application not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSync = async (dryRun = false) => {
    setSyncing(true)
    try {
      await syncApplication({ dryRun, prune: true })
    } finally {
      setSyncing(false)
    }
  }

  const getStatusBadge = (status: string, type: 'sync' | 'health') => {
    if (type === 'sync') {
      switch (status) {
        case 'Synced': return { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' }
        case 'OutOfSync': return { variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-600' }
        default: return { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' }
      }
    } else {
      switch (status) {
        case 'Healthy': return { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' }
        case 'Degraded': return { variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-600' }
        case 'Progressing': return { variant: 'secondary' as const, icon: Clock, color: 'text-blue-600' }
        default: return { variant: 'outline' as const, icon: AlertCircle, color: 'text-gray-600' }
      }
    }
  }

  if (loading && !application) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading application details...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!application) return null

  const syncBadge = getStatusBadge(application.status.sync.status, 'sync')
  const healthBadge = getStatusBadge(application.status.health.status, 'health')
  const SyncIcon = syncBadge.icon
  const HealthIcon = healthBadge.icon

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{application.metadata.name}</h1>
            <p className="text-muted-foreground">{application.metadata.namespace}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchApplication}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSync(true)}
            disabled={syncing}
          >
            <Eye className="h-4 w-4 mr-2" />
            Dry Run
          </Button>
          <Button
            size="sm"
            onClick={() => handleSync(false)}
            disabled={syncing}
          >
            <Play className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sync Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <SyncIcon className={`h-4 w-4 ${syncBadge.color}`} />
                  <span className="font-semibold">{application.status.sync.status}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Health Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <HealthIcon className={`h-4 w-4 ${healthBadge.color}`} />
                  <span className="font-semibold">{application.status.health.status}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resources</p>
                <p className="text-2xl font-bold">{application.status.resources?.length || 0}</p>
              </div>
              <Server className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Sync</p>
                <p className="text-sm font-medium">
                  {application.status.operationState?.finishedAt ? 
                    new Date(application.status.operationState.finishedAt).toLocaleString() : 
                    'Never'
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Source
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Repository</p>
              <p className="font-mono text-sm break-all">{application.spec.source.repoURL}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Path</p>
              <p className="font-mono text-sm">{application.spec.source.path}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Target Revision</p>
              <p className="font-mono text-sm">{application.spec.source.targetRevision}</p>
            </div>
            {application.spec.source.helm && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Helm Parameters</p>
                <p className="text-sm">{application.spec.source.helm.parameters?.length || 0} parameters</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Destination Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Destination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Server</p>
              <p className="font-mono text-sm">{application.spec.destination.server}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Namespace</p>
              <p className="font-mono text-sm">{application.spec.destination.namespace}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Project</p>
              <p className="text-sm">{application.spec.project}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Dialog open={showParameters} onOpenChange={setShowParameters}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              View Parameters ({Object.keys(parameters).length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Parameters</DialogTitle>
              <DialogDescription>
                Current Helm parameter values for {application.metadata.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {Object.entries(parameters).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-4 p-2 border rounded">
                  <div className="font-mono text-sm font-medium">{key}</div>
                  <div className="col-span-2 font-mono text-sm break-all">{String(value)}</div>
                </div>
              ))}
              {Object.keys(parameters).length === 0 && (
                <p className="text-muted-foreground text-center py-4">No parameters found</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showLogs} onOpenChange={setShowLogs}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              View Logs ({logs.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Logs</DialogTitle>
              <DialogDescription>
                Recent logs for {application.metadata.name}
              </DialogDescription>
            </DialogHeader>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  <span className="text-gray-500">[{log.timeStamp}]</span> {log.content}
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-gray-500">No logs available</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showEvents} onOpenChange={setShowEvents}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              View Events ({events.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Events</DialogTitle>
              <DialogDescription>
                Recent events for {application.metadata.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {events.map((event, index) => (
                <div key={index} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={event.type === 'Warning' ? 'destructive' : 'default'}>
                      {event.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(event.lastTimestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="font-medium">{event.reason}</p>
                  <p className="text-sm text-muted-foreground">{event.message}</p>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No events found</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resources */}
      {application.status.resources && application.status.resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {application.status.resources.map((resource, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{resource.kind}</Badge>
                    <span className="font-medium">{resource.name}</span>
                    <span className="text-sm text-muted-foreground">{resource.namespace}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {resource.health && (
                      <Badge 
                        variant={resource.health.status === 'Healthy' ? 'default' : 'destructive'}
                      >
                        {resource.health.status}
                      </Badge>
                    )}
                    <Badge variant="outline">{resource.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}