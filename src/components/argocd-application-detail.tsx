import { useState } from 'react'
import { useArgoCDApplication } from '@/hooks/use-argocd'
import { getTargetRevision } from '@/types/argocd'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigFilesSection } from '@/components/config-files-section'

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
  Activity,
  Box
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
  // Debug logging
  console.log('ArgoCDApplicationDetail - applicationName:', applicationName, 'namespace:', namespace)

  const {
    application,
    logs,
    events,
    parameters,
    loading,
    error,
    fetchApplication,
    syncApplication
  } = useArgoCDApplication(applicationName, namespace)

  const [showLogs, setShowLogs] = useState(false)
  const [showEvents, setShowEvents] = useState(false)
  const [showParameters, setShowParameters] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

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
          <CardContent className="pt-6 text-center space-y-2">
            <p className="text-muted-foreground">Application not found</p>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                <p className="font-medium">Error Details:</p>
                <p className="font-mono text-xs mt-1">{error}</p>
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-4">
              <p>Requested: {applicationName}</p>
              <p>Namespace: {namespace || 'argocd (default)'}</p>
            </div>
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

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="source" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Source
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Box className="h-4 w-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Application Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Application Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Project:</span>
                  <p className="font-medium mt-1">{application.spec.project}</p>
                </div>
                {application.metadata.labels && Object.keys(application.metadata.labels).length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Labels:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Object.entries(application.metadata.labels).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}={value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Namespace:</span>
                  <p className="font-medium mt-1">{application.spec.destination.namespace}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Destination:</span>
                  <p className="font-medium mt-1">{application.spec.destination.server}</p>
                </div>
                {application.metadata.creationTimestamp && (
                  <div>
                    <span className="text-muted-foreground">Created At:</span>
                    <p className="font-medium mt-1">
                      {new Date(application.metadata.creationTimestamp).toLocaleString()}
                    </p>
                  </div>
                )}
                {application.status.operationState?.finishedAt && (
                  <div>
                    <span className="text-muted-foreground">Last Sync:</span>
                    <p className="font-medium mt-1">
                      {new Date(application.status.operationState.finishedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
        </TabsContent>

        {/* Source Tab */}
        <TabsContent value="source" className="space-y-6">
          {/* Git Source Information - Prominent Display */}
          <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Git Source {application.spec.sources && application.spec.sources.length > 1 && (
              <Badge variant="secondary">{application.spec.sources.length} repos</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Deployed Commit */}
          {application.status.sync.revision && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Deployed Commit</p>
                <Badge variant="secondary" className="font-mono">
                  {application.status.sync.revision.substring(0, 8)}
                </Badge>
              </div>
              <p className="font-mono text-xs break-all text-muted-foreground">
                {application.status.sync.revision}
              </p>
            </div>
          )}

          {/* Primary Repository Details */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {application.spec.sources && application.spec.sources.length > 1 ? 'Primary Repository' : 'Repository'}
              </p>
              <a
                href={application.status.sync.comparedTo.source.repoURL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-primary hover:underline break-all inline-flex items-center gap-1"
              >
                {application.status.sync.comparedTo.source.repoURL}
                <Eye className="h-3 w-3" />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Branch/Tag</p>
                <Badge variant="outline" className="font-mono">
                  {application.status.sync.comparedTo.source.targetRevision}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Path</p>
                <p className="font-mono text-sm">
                  {application.status.sync.comparedTo.source.path || '/'}
                </p>
              </div>
            </div>

            {/* Additional Sources for Multi-Source Apps */}
            {application.spec.sources && application.spec.sources.length > 1 && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Additional Sources</p>
                <div className="space-y-2">
                  {application.spec.sources.slice(1).map((source, index) => (
                    <div key={index} className="text-sm bg-muted/30 p-2 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">Source {index + 2}</Badge>
                        {source.ref && <Badge variant="secondary" className="text-xs">ref: {source.ref}</Badge>}
                      </div>
                      <a
                        href={source.repoURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-primary hover:underline break-all inline-flex items-center gap-1"
                      >
                        {source.repoURL}
                        <Eye className="h-3 w-3" />
                      </a>
                      {source.targetRevision && (
                        <p className="font-mono text-xs text-muted-foreground mt-1">
                          → {source.targetRevision}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sync Status Indicator */}
            <div className="flex items-center gap-2 pt-2">
              {application.status.sync.status === 'Synced' ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Synced with Git
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                    Out of Sync
                  </span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          <ConfigFilesSection application={application} />
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          {/* Application Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {application.spec.sources ? `Source Configuration (${application.spec.sources.length})` : 'Source Configuration'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Multi-source display */}
            {application.spec.sources ? (
              application.spec.sources.map((source, index) => (
                <div key={index} className="space-y-3 pb-4 border-b last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Source {index + 1}</Badge>
                    {source.ref && <Badge variant="secondary">ref: {source.ref}</Badge>}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Repository</p>
                    <p className="font-mono text-sm break-all">{source.repoURL}</p>
                  </div>
                  {source.path && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Path</p>
                      <p className="font-mono text-sm">{source.path}</p>
                    </div>
                  )}
                  {source.chart && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Chart</p>
                      <p className="font-mono text-sm">{source.chart}</p>
                    </div>
                  )}
                  {source.targetRevision && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Target Revision</p>
                      <p className="font-mono text-sm">{source.targetRevision}</p>
                    </div>
                  )}
                  {source.helm && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Helm</p>
                      <div className="text-sm space-y-1">
                        {source.helm.parameters && source.helm.parameters.length > 0 && (
                          <p>{source.helm.parameters.length} parameters</p>
                        )}
                        {source.helm.valueFiles && source.helm.valueFiles.length > 0 && (
                          <div>
                            <p className="font-medium">Value Files:</p>
                            <ul className="list-disc list-inside pl-2 text-muted-foreground">
                              {source.helm.valueFiles.map((file, i) => (
                                <li key={i} className="font-mono text-xs">{file}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : application.spec.source ? (
              /* Single source display */
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Repository</p>
                  <p className="font-mono text-sm break-all">{application.spec.source.repoURL}</p>
                </div>
                {application.spec.source.path && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Path</p>
                    <p className="font-mono text-sm">{application.spec.source.path}</p>
                  </div>
                )}
                {application.spec.source.chart && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Chart</p>
                    <p className="font-mono text-sm">{application.spec.source.chart}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Target Revision</p>
                  <p className="font-mono text-sm">{getTargetRevision(application)}</p>
                </div>
                {application.spec.source.helm && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Helm</p>
                    <div className="text-sm space-y-1">
                      {application.spec.source.helm.parameters && application.spec.source.helm.parameters.length > 0 && (
                        <p>{application.spec.source.helm.parameters.length} parameters</p>
                      )}
                      {application.spec.source.helm.valueFiles && application.spec.source.helm.valueFiles.length > 0 && (
                        <div>
                          <p className="font-medium">Value Files:</p>
                          <ul className="list-disc list-inside pl-2 text-muted-foreground">
                            {application.spec.source.helm.valueFiles.map((file, i) => (
                              <li key={i} className="font-mono text-xs">{file}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No source information available</p>
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
              <DialogTitle className="flex items-center justify-between">
                <span>Application Logs</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const logText = logs.map(log => {
                      const content = log.result?.content || log.content || JSON.stringify(log)
                      const timestamp = log.result?.timeStampStr || log.timeStamp || ''
                      return timestamp ? `[${timestamp}] ${content}` : content
                    }).filter(line => line.trim()).join('\n')
                    navigator.clipboard.writeText(logText)
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
              </DialogTitle>
              <DialogDescription>
                Recent logs for {application.metadata.name}
              </DialogDescription>
            </DialogHeader>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
              {logs.length > 0 ? (
                logs.map((log, index) => {
                  console.log(`[UI] Rendering log ${index}:`, log)

                  // Handle different log formats
                  if (typeof log === 'string') {
                    return <div key={index} className="mb-1">{log}</div>
                  }

                  // Format timestamp
                  let timestamp = ''
                  if (log.timeStamp && log.timeStamp !== '0001-01-01T00:00:00Z') {
                    try {
                      const date = new Date(log.timeStamp)
                      timestamp = date.toLocaleTimeString()
                    } catch (e) {
                      timestamp = log.timeStamp
                    }
                  }

                  // Get content - handle nested result wrapper
                  let content = ''
                  if (log.result && log.result.content) {
                    // Handle {"result": {"content": "..."}} format
                    content = log.result.content
                  } else if (log.content) {
                    // Handle {"content": "..."} format
                    content = log.content
                  } else if (typeof log === 'string') {
                    content = log
                  } else {
                    content = JSON.stringify(log)
                  }
                  
                  // Skip empty content
                  if (!content || content.trim() === '') {
                    return null
                  }

                  return (
                    <div key={index} className="mb-1">
                      {timestamp && <span className="text-gray-500">[{timestamp}]</span>}
                      {timestamp && ' '}
                      <span className="text-green-400">{content}</span>
                    </div>
                  )
                })
              ) : (
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
            <CardTitle>Resources ({application.status.resources.length})</CardTitle>
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
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Logs and Events will be shown here */}
            <Card>
              <CardHeader>
                <CardTitle>Activity & Logs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  View application logs and events using the buttons in the Application Details section.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}