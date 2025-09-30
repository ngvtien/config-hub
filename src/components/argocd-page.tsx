import React, { useState, useEffect } from 'react'
import { useArgoCD } from '@/hooks/use-argocd'
import { useArgoCDCredentials } from '@/hooks/use-argocd-credentials'
import { ApplicationFilter, ApplicationSearchResult } from '@/types/argocd'
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
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  GitBranch,
  Settings,
  Eye
} from 'lucide-react'

export function ArgoCDPage() {
  // Automatically store credentials when settings change
  useArgoCDCredentials()
  
  const { 
    applications, 
    loading, 
    error, 
    connected, 
    testConnection, 
    searchApplications, 
    refresh 
  } = useArgoCD({ autoFetch: true, refreshInterval: 30000 })

  const [searchResults, setSearchResults] = useState<ApplicationSearchResult[]>([])
  const [filter, setFilter] = useState<ApplicationFilter>({})
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [selectedNamespace, setSelectedNamespace] = useState<string | undefined>(undefined)

  // Handle search
  const handleSearch = async () => {
    const results = await searchApplications(filter)
    setSearchResults(results)
  }

  // Clear search
  const clearSearch = () => {
    setFilter({})
    setSearchResults([])
  }

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

  const displayApplications = searchResults.length > 0 ? searchResults : 
    applications.map(app => ({ application: app, matchScore: 1 }))

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

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Applications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                placeholder="Enter product name..."
                value={filter.productName || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, productName: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer-name">Customer Name</Label>
              <Input
                id="customer-name"
                placeholder="Enter customer name..."
                value={filter.customerName || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, customerName: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="version">Version/Tag</Label>
              <Input
                id="version"
                placeholder="Enter version..."
                value={filter.version || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, version: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sync-status">Sync Status</Label>
              <Select
                value={filter.syncStatus || ''}
                onValueChange={(value) => setFilter(prev => ({ ...prev, syncStatus: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any status</SelectItem>
                  <SelectItem value="Synced">Synced</SelectItem>
                  <SelectItem value="OutOfSync">Out of Sync</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" onClick={clearSearch}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

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

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayApplications.map(({ application, productName, customerName, version }) => {
          const syncBadge = getStatusBadge(application.status.sync.status, 'sync')
          const healthBadge = getStatusBadge(application.status.health.status, 'health')
          const SyncIcon = syncBadge.icon
          const HealthIcon = healthBadge.icon

          return (
            <Card 
              key={application.metadata.uid} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedApp(application.metadata.name)
                setSelectedNamespace(application.metadata.namespace)
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
                {/* Product/Customer Info */}
                {(productName || customerName) && (
                  <div className="space-y-1">
                    {productName && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Product:</span>
                        <span>{productName}</span>
                      </div>
                    )}
                    {customerName && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Customer:</span>
                        <span>{customerName}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Version */}
                {version && (
                  <div className="flex items-center gap-2 text-sm">
                    <GitBranch className="h-3 w-3" />
                    <span>{version}</span>
                  </div>
                )}

                <Separator />

                {/* Status Badges */}
                <div className="flex gap-2">
                  <Badge variant={syncBadge.variant} className="flex items-center gap-1">
                    <SyncIcon className="h-3 w-3" />
                    {application.status.sync.status}
                  </Badge>
                  <Badge variant={healthBadge.variant} className="flex items-center gap-1">
                    <HealthIcon className="h-3 w-3" />
                    {application.status.health.status}
                  </Badge>
                </div>

                {/* Repository Info */}
                <div className="text-xs text-muted-foreground">
                  <div className="truncate">
                    {application.spec.source.repoURL}
                  </div>
                  <div>
                    {application.spec.source.path} • {application.spec.destination.namespace}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {!loading && displayApplications.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="space-y-2">
              <p className="text-muted-foreground">No applications found</p>
              {searchResults.length === 0 && Object.keys(filter).length > 0 && (
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