import { useState } from 'react'
import { useArgoCD } from '@/hooks/use-argocd'
import { useArgoCDCredentials } from '@/hooks/use-argocd-credentials'
import { useEnvironmentSettings } from '@/hooks/use-environment-settings'
import { ApplicationFilter, getTargetRevision, getApplicationSource } from '@/types/argocd'
import { ArgoCDApplicationDetail } from '@/components/argocd-application-detail'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  GitBranch,
  Settings,
  Eye,
  LayoutGrid,
  List,
  X,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react'

export function ArgoCDPage() {
  // Automatically store credentials when settings change
  useArgoCDCredentials()

  // Get refresh interval from settings (default to 30 seconds)
  const { settings } = useEnvironmentSettings()
  const refreshInterval = (settings.argocd.refreshInterval || 30) * 1000 // Convert to milliseconds

  const {
    applications,
    loading,
    error,
    connected,
    testConnection,
    refresh
  } = useArgoCD({ autoFetch: true, refreshInterval })

  const [filter, setFilter] = useState<ApplicationFilter>({})
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [selectedNamespace, setSelectedNamespace] = useState<string | undefined>(undefined)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [quickSearch, setQuickSearch] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [syncStatusFilter, setSyncStatusFilter] = useState<string | undefined>(undefined)
  const [versionFilter, setVersionFilter] = useState('')

  // Get status badge variant
  const getStatusBadge = (status: string, type: 'sync' | 'health') => {
    if (type === 'sync') {
      switch (status) {
        case 'Synced': return { variant: 'default' as const, icon: CheckCircle }
        case 'OutOfSync': return { variant: 'destructive' as const, icon: AlertCircle }
        default: return { variant: 'secondary' as const, icon: Clock }
      }
    } else {
      switch (status) {
        case 'Healthy': return { variant: 'default' as const, icon: CheckCircle }
        case 'Degraded': return { variant: 'destructive' as const, icon: AlertCircle }
        case 'Progressing': return { variant: 'secondary' as const, icon: Clock }
        default: return { variant: 'outline' as const, icon: AlertCircle }
      }
    }
  }

  // Filter applications by all filters (instant filtering)
  const baseApplications = applications.map(app => ({ application: app, matchScore: 1 }))

  let displayApplications = baseApplications

  // Apply quick search filter
  if (quickSearch) {
    displayApplications = displayApplications.filter(({ application }) => {
      const searchLower = quickSearch.toLowerCase()
      const source = getApplicationSource(application)
      return (
        application.metadata.name.toLowerCase().includes(searchLower) ||
        application.metadata.namespace?.toLowerCase().includes(searchLower) ||
        source.repoURL.toLowerCase().includes(searchLower) ||
        application.metadata.labels?.product?.toLowerCase().includes(searchLower) ||
        application.metadata.labels?.customer?.toLowerCase().includes(searchLower)
      )
    })
  }

  // Apply sync status filter (inline)
  if (syncStatusFilter) {
    displayApplications = displayApplications.filter(({ application }) =>
      application.status.sync.status === syncStatusFilter
    )
  }

  // Apply version filter (inline)
  if (versionFilter) {
    displayApplications = displayApplications.filter(({ application }) => {
      const labelVersion = application.metadata.labels?.version || ''
      const targetRevision = getTargetRevision(application) || ''
      const versionLower = versionFilter.toLowerCase()

      // Debug logging
      console.log('Version filter:', versionFilter, 'App:', application.metadata.name,
        'Label:', labelVersion, 'Target:', targetRevision)

      return (
        labelVersion.toLowerCase().includes(versionLower) ||
        targetRevision.toLowerCase().includes(versionLower)
      )
    })
  }

  // Apply advanced filters (product, customer, version, sync status)
  if (filter.productName) {
    displayApplications = displayApplications.filter(({ application }) => {
      const product = application.metadata.labels?.product ||
        application.metadata.labels?.['app.kubernetes.io/name'] || ''
      return product.toLowerCase().includes(filter.productName!.toLowerCase())
    })
  }

  if (filter.customerName) {
    displayApplications = displayApplications.filter(({ application }) => {
      const customer = application.metadata.labels?.customer ||
        application.metadata.labels?.tenant || ''
      return customer.toLowerCase().includes(filter.customerName!.toLowerCase())
    })
  }

  if (filter.version) {
    displayApplications = displayApplications.filter(({ application }) => {
      const labelVersion = application.metadata.labels?.version || ''
      const targetRevision = getTargetRevision(application) || ''
      const versionLower = filter.version!.toLowerCase()

      return (
        labelVersion.toLowerCase().includes(versionLower) ||
        targetRevision.toLowerCase().includes(versionLower)
      )
    })
  }

  if (filter.syncStatus) {
    displayApplications = displayApplications.filter(({ application }) =>
      application.status.sync.status === filter.syncStatus
    )
  }

  // Show application detail if one is selected
  if (selectedApp) {
    return (
      <ArgoCDApplicationDetail
        applicationName={selectedApp}
        namespace={selectedNamespace}
        onBack={() => {
          setSelectedApp(null)
          setSelectedNamespace(undefined)
        }}
      />
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ArgoCD Applications</h1>
          <p className="text-muted-foreground">
            Manage and monitor your ArgoCD applications across environments
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={testConnection}
            disabled={loading}
          >
            <Settings className="h-4 w-4 mr-2" />
            Test Connection
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Search Bar with Inline Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Quick search by name, namespace, repository, product, or customer..."
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {quickSearch && (
            <button
              onClick={() => setQuickSearch('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Inline Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sync Status Filter */}
          <Select
            value={syncStatusFilter || 'all'}
            onValueChange={(value) => setSyncStatusFilter(value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Sync Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Synced">Synced</SelectItem>
              <SelectItem value="OutOfSync">Out of Sync</SelectItem>
              <SelectItem value="Unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>

          {/* Version Filter */}
          <div className="relative">
            <Input
              placeholder="Version/Tag..."
              value={versionFilter}
              onChange={(e) => setVersionFilter(e.target.value)}
              className="w-[140px] h-8 pr-8"
            />
            {versionFilter && (
              <button
                onClick={() => setVersionFilter('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Active Filters Indicator */}
          {(syncStatusFilter || versionFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSyncStatusFilter(undefined)
                setVersionFilter('')
              }}
              className="h-8 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear Filters
            </Button>
          )}

          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="h-8 ml-auto"
          >
            <Filter className="h-3 w-3 mr-2" />
            Advanced
            {showAdvancedFilters ? (
              <ChevronUp className="h-3 w-3 ml-2" />
            ) : (
              <ChevronDown className="h-3 w-3 ml-2" />
            )}
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      {!connected && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>Not connected to ArgoCD. Please check your configuration.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Search Filters (Collapsible) */}
      {showAdvancedFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Advanced Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name</Label>
                <div className="relative">
                  <Input
                    id="product-name"
                    placeholder="Enter product name..."
                    value={filter.productName || ''}
                    onChange={(e) => setFilter(prev => ({ ...prev, productName: e.target.value }))}
                    className="pr-8"
                  />
                  {filter.productName && (
                    <button
                      onClick={() => setFilter(prev => ({ ...prev, productName: '' }))}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-name">Customer Name</Label>
                <div className="relative">
                  <Input
                    id="customer-name"
                    placeholder="Enter customer name..."
                    value={filter.customerName || ''}
                    onChange={(e) => setFilter(prev => ({ ...prev, customerName: e.target.value }))}
                    className="pr-8"
                  />
                  {filter.customerName && (
                    <button
                      onClick={() => setFilter(prev => ({ ...prev, customerName: '' }))}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Version/Tag</Label>
                <div className="relative">
                  <Input
                    id="version"
                    placeholder="Enter version..."
                    value={filter.version || ''}
                    onChange={(e) => setFilter(prev => ({ ...prev, version: e.target.value }))}
                    className="pr-8"
                  />
                  {filter.version && (
                    <button
                      onClick={() => setFilter(prev => ({ ...prev, version: '' }))}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sync-status">Sync Status</Label>
                <Select
                  value={filter.syncStatus || 'all'}
                  onValueChange={(value) => setFilter(prev => ({ ...prev, syncStatus: value === 'all' ? undefined : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any status</SelectItem>
                    <SelectItem value="Synced">Synced</SelectItem>
                    <SelectItem value="OutOfSync">Out of Sync</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear All Advanced Filters */}
            {(filter.productName || filter.customerName || filter.version || filter.syncStatus) && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilter({})}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Advanced Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayApplications.map(({ application }) => {
            const syncBadge = getStatusBadge(application.status.sync.status, 'sync')
            const healthBadge = getStatusBadge(application.status.health.status, 'health')

            return (
              <Card
                key={application.metadata.uid}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  console.log('[Grid] App:', application.metadata.name, 'NS:', application.metadata.namespace)
                  setSelectedApp(application.metadata.name)
                  // Only set namespace if it's not 'argocd' (the default namespace)
                  const ns = application.metadata.namespace === 'argocd' ? undefined : application.metadata.namespace
                  console.log('[Grid] Setting NS to:', ns)
                  setSelectedNamespace(ns)
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{application.metadata.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {application.metadata.namespace}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Metadata Grid */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Project:</span>
                      <span className="font-medium">{application.spec.project}</span>
                    </div>
                    
                    {application.metadata.labels && Object.keys(application.metadata.labels).length > 0 && (
                      <div className="flex justify-between items-start">
                        <span className="text-muted-foreground">Labels:</span>
                        <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                          {Object.entries(application.metadata.labels).slice(0, 2).map(([key, value]) => (
                            <span key={key} className="text-xs">
                              {key}={value}
                            </span>
                          ))}
                          {Object.keys(application.metadata.labels).length > 2 && (
                            <span className="text-muted-foreground">+{Object.keys(application.metadata.labels).length - 2}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Status Badges */}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status:</span>
                      <div className="flex gap-1">
                        <Badge variant={healthBadge.variant} className="text-xs px-1.5 py-0">
                          {application.status.health.status}
                        </Badge>
                        <Badge variant={syncBadge.variant} className="text-xs px-1.5 py-0">
                          {application.status.sync.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Repository:</span>
                      <span className="font-medium truncate max-w-[60%]" title={getApplicationSource(application).repoURL}>
                        {getApplicationSource(application).repoURL.split('/').pop()?.replace('.git', '')}
                      </span>
                    </div>

                    {getTargetRevision(application) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Target Revis...:</span>
                        <span className="font-medium">{getTargetRevision(application)}</span>
                      </div>
                    )}

                    {getApplicationSource(application).path && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Path:</span>
                        <span className="font-medium truncate max-w-[60%]">
                          {getApplicationSource(application).path}
                        </span>
                      </div>
                    )}

                    {getApplicationSource(application).chart && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Chart:</span>
                        <span className="font-medium">{getApplicationSource(application).chart}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Destination:</span>
                      <span className="font-medium">in-cluster</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Namespace:</span>
                      <span className="font-medium">{application.spec.destination.namespace}</span>
                    </div>

                    {application.metadata.creationTimestamp && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created At:</span>
                        <span className="font-medium">
                          {new Date(application.metadata.creationTimestamp).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {application.status.operationState?.finishedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Sync:</span>
                        <span className="font-medium">
                          {new Date(application.status.operationState.finishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Applications List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {displayApplications.map(({ application }) => {
            const syncBadge = getStatusBadge(application.status.sync.status, 'sync')
            const healthBadge = getStatusBadge(application.status.health.status, 'health')

            return (
              <Card
                key={application.metadata.uid}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedApp(application.metadata.name)
                  // Only set namespace if it's not 'argocd' (the default namespace)
                  setSelectedNamespace(application.metadata.namespace === 'argocd' ? undefined : application.metadata.namespace)
                }}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    {/* Name and Namespace */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{application.metadata.name}</h3>
                        <span className="text-sm text-muted-foreground">
                          {application.metadata.namespace}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {application.metadata.labels?.product && (
                          <span>Product: {application.metadata.labels.product}</span>
                        )}
                        {application.metadata.labels?.customer && (
                          <span>Customer: {application.metadata.labels.customer}</span>
                        )}
                        {getTargetRevision(application) && (
                          <div className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            <span>{getTargetRevision(application)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Repository */}
                    <div className="flex-1 min-w-0 hidden md:block">
                      <div className="text-sm truncate flex items-center gap-2">
                        <span className="truncate">{getApplicationSource(application).repoURL}</span>
                        {application.spec.sources && application.spec.sources.length > 1 && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {application.spec.sources.length} sources
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {getApplicationSource(application).path} • {application.spec.destination.namespace}
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-2">
                      <Badge variant={syncBadge.variant} className="flex items-center gap-1">
                        <SyncIcon className="h-3 w-3" />
                        {application.status.sync.status}
                      </Badge>
                      <Badge variant={healthBadge.variant} className="flex items-center gap-1">
                        <HealthIcon className="h-3 w-3" />
                        {application.status.health.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && displayApplications.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="space-y-2">
              <p className="text-muted-foreground">No applications found</p>
              {(quickSearch || Object.keys(filter).length > 0 || syncStatusFilter || versionFilter) && (
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search filters
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading applications...</span>
        </div>
      )}
    </div>
  )
}