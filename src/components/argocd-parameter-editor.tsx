import React, { useState } from 'react'
import { useArgoCDApplication } from '@/hooks/use-argocd'
import { ParameterDiffViewer } from '@/components/parameter-diff-viewer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Settings, 
  Plus, 
  Trash2, 
  GitCompare,
  Save,
  RotateCcw
} from 'lucide-react'

interface ArgoCDParameterEditorProps {
  applicationName: string
  namespace?: string
}

export function ArgoCDParameterEditor({ 
  applicationName, 
  namespace 
}: ArgoCDParameterEditorProps) {
  const { parameters, compareParameters } = useArgoCDApplication(applicationName, namespace)
  const [editedParameters, setEditedParameters] = useState<Record<string, any>>({})
  const [showDiff, setShowDiff] = useState(false)
  const [newParamKey, setNewParamKey] = useState('')
  const [newParamValue, setNewParamValue] = useState('')

  // Initialize edited parameters with current values
  React.useEffect(() => {
    if (Object.keys(editedParameters).length === 0 && Object.keys(parameters).length > 0) {
      setEditedParameters({ ...parameters })
    }
  }, [parameters, editedParameters])

  const handleParameterChange = (key: string, value: string) => {
    setEditedParameters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleAddParameter = () => {
    if (newParamKey && newParamValue) {
      setEditedParameters(prev => ({
        ...prev,
        [newParamKey]: newParamValue
      }))
      setNewParamKey('')
      setNewParamValue('')
    }
  }

  const handleRemoveParameter = (key: string) => {
    setEditedParameters(prev => {
      const updated = { ...prev }
      delete updated[key]
      return updated
    })
  }

  const handleReset = () => {
    setEditedParameters({ ...parameters })
  }

  const handleCreatePR = (diff: any) => {
    // This would integrate with your Git provider API
    console.log('Creating PR with changes:', diff)
    // Example: Create PR in GitLab/GitHub with parameter changes
    alert('PR creation would be implemented here with your Git provider API')
  }

  const handleApplyChanges = (diff: any) => {
    // This would update the ArgoCD application spec
    console.log('Applying changes:', diff)
    // Example: Update ArgoCD application with new parameters
    alert('Direct application would update ArgoCD application spec')
  }

  const diff = compareParameters(editedParameters)
  const hasChanges = Object.keys(diff.added).length > 0 || 
                    Object.keys(diff.modified).length > 0 || 
                    Object.keys(diff.removed).length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Parameter Editor</h2>
          <p className="text-muted-foreground">
            Edit Helm parameters for {applicationName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Dialog open={showDiff} onOpenChange={setShowDiff}>
            <DialogTrigger asChild>
              <Button disabled={!hasChanges}>
                <GitCompare className="h-4 w-4 mr-2" />
                View Changes ({Object.keys(diff.added).length + Object.keys(diff.modified).length + Object.keys(diff.removed).length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Parameter Changes</DialogTitle>
                <DialogDescription>
                  Review and apply parameter changes for {applicationName}
                </DialogDescription>
              </DialogHeader>
              <ParameterDiffViewer
                diff={diff}
                applicationName={applicationName}
                onCreatePR={handleCreatePR}
                onApplyChanges={handleApplyChanges}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Add New Parameter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Parameter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="new-param-key">Parameter Name</Label>
              <Input
                id="new-param-key"
                placeholder="e.g., image.tag"
                value={newParamKey}
                onChange={(e) => setNewParamKey(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="new-param-value">Parameter Value</Label>
              <Input
                id="new-param-value"
                placeholder="e.g., v1.2.3"
                value={newParamValue}
                onChange={(e) => setNewParamValue(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddParameter} disabled={!newParamKey || !newParamValue}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Current Parameters ({Object.keys(editedParameters).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(editedParameters).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No parameters found. Add parameters using the form above.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(editedParameters).map(([key, value]) => {
                const isModified = parameters[key] !== value
                const isNew = !(key in parameters)
                
                return (
                  <div 
                    key={key} 
                    className={`border rounded p-3 ${
                      isNew ? 'border-green-200 bg-green-50' : 
                      isModified ? 'border-blue-200 bg-blue-50' : 
                      'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Label className="font-mono text-sm font-medium">
                          {key}
                          {isNew && <span className="ml-2 text-xs text-green-600">(new)</span>}
                          {isModified && !isNew && <span className="ml-2 text-xs text-blue-600">(modified)</span>}
                        </Label>
                        <Input
                          value={String(value)}
                          onChange={(e) => handleParameterChange(key, e.target.value)}
                          className="mt-1 font-mono text-sm"
                        />
                        {isModified && !isNew && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Original: <span className="font-mono">{String(parameters[key])}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveParameter(key)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {hasChanges && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-800">Changes Ready</p>
                <p className="text-sm text-blue-700">
                  {Object.keys(diff.added).length} added, {Object.keys(diff.modified).length} modified, {Object.keys(diff.removed).length} removed
                </p>
              </div>
              <Button onClick={() => setShowDiff(true)}>
                Review Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}