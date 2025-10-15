import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  X, 
  Plus, 
  Save, 
  RefreshCw, 
  FileText, 
  GitBranch, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Search,
  FileCode,
  FormInput,
  Info,
  GitCompare
} from 'lucide-react'
import * as yaml from 'js-yaml'
import { MonacoEditorWrapper } from './monaco-editor'
import { MonacoDiffDialog } from './monaco-diff-dialog'
import { SchemaEditorForm } from './schema-editor-form'
import { useSchemaEditorStore } from '@/stores/schema-editor-store'
import { SecretsFormEditor } from './secrets/secrets-form-editor'
import { CertificateFormEditor } from './secrets/certificate-form-editor'
import { ImprovedFormEditor } from './improved-form-editor'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

interface OpenFile {
  id: string
  name: string
  path: string
  content: string
  originalContent: string
  hasChanges: boolean
  sourceIndex: number
}

interface EditorPanelProps {
  openFiles: OpenFile[]
  activeFileId: string | null
  onCloseFile: (fileId: string) => void
  onSaveFile: (fileId: string, content: string) => void
  onContentChange: (fileId: string, content: string) => void
  onSetActiveFile: (fileId: string) => void
  credentialId?: string | null
  currentBranch?: string
  repoUrl?: string
}

export function EditorPanel({
  openFiles,
  activeFileId,
  onCloseFile,
  onSaveFile,
  onContentChange,
  onSetActiveFile,
  credentialId,
  currentBranch = 'main',
  repoUrl = ''
}: EditorPanelProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [validationStatus, setValidationStatus] = useState<'valid' | 'invalid' | 'validating' | 'idle'>('idle')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [viewMode, setViewModeState] = useState<'yaml' | 'form' | 'json' | 'schema'>('yaml')
  const [isSchemaEditing, setIsSchemaEditing] = useState(false)
  const isSchemaEditingRef = useRef(false)
  const [fileViewModes, setFileViewModes] = useState<Record<string, 'yaml' | 'form' | 'json' | 'schema'>>({})

  // Use schema editor store for view mode
  const { getViewMode, setViewMode: setSchemaViewMode } = useSchemaEditorStore()

  // Wrapper to handle view mode changes
  const setViewMode = (mode: 'yaml' | 'form' | 'json' | 'schema') => {
    console.log('setViewMode called with:', mode)
    if (activeFile?.name.endsWith('.schema.json')) {
      setSchemaViewMode(activeFile.path, mode === 'schema' ? 'form' : 'code')
    }
    setViewModeState(mode)
    
    // Store view mode preference for this file
    if (activeFile) {
      setFileViewModes(prev => ({
        ...prev,
        [activeFile.id]: mode
      }))
    }
  }
  const [schema, setSchema] = useState<any | null>(null)
  const [schemaLoading, setSchemaLoading] = useState(false)
  const [formData, setFormData] = useState<any>(null)
  const [showDiffPreview, setShowDiffPreview] = useState(false)
  const [schemaDiffData, setSchemaDiffData] = useState<{
    originalContent: string
    modifiedContent: string
  } | null>(null)
  const previousFileIdRef = useRef<string | null>(null)
  
  const activeFile = openFiles.find(f => f.id === activeFileId)

  // Update ref when state changes
  useEffect(() => {
    isSchemaEditingRef.current = isSchemaEditing
  }, [isSchemaEditing])

  // Set appropriate default view mode when file changes (only when switching files, not content changes)
  useEffect(() => {
    // Only change view mode when switching to a different file, not when content changes
    if (activeFile && !isSchemaEditingRef.current) {
      console.log('Setting default view mode for file:', activeFile.name, 'isSchemaEditing:', isSchemaEditingRef.current, 'currentViewMode:', viewMode)
      if (activeFile.name.endsWith('.schema.json')) {
        // Use the stored view mode from staging hook
        const storedViewMode = getViewMode(activeFile.path)
        const storedMode = storedViewMode === 'form' ? 'schema' : 'json'
        setViewMode(storedMode)
      } else if (getLanguage(activeFile.name) === 'yaml') {
        setViewMode('yaml')
      }
    } else {
      console.log('Skipping view mode change - isSchemaEditing:', isSchemaEditingRef.current)
    }
  }, [activeFile?.id]) // Only depend on file ID to prevent content change triggers
  
  // Check if this is a YAML file and could have a schema
  const isYamlFile = activeFile && (activeFile.name.toLowerCase().endsWith('.yaml') || activeFile.name.toLowerCase().endsWith('.yml'))
  const isTemplateFile = activeFile && (
    activeFile.path.includes('/templates/') || 
    activeFile.path.includes('/chart/templates/') ||
    activeFile.content.includes('{{') || 
    activeFile.content.includes('}}') ||
    activeFile.content.includes('{{-') ||
    activeFile.content.includes('-}}') ||
    activeFile.content.includes('{{ ') ||
    activeFile.content.includes(' }}')
  )
  const isSecretsFile = activeFile && activeFile.name.toLowerCase() === 'secrets.yaml'
  const isCertificatesFile = activeFile && 
    (activeFile.name.toLowerCase() === 'certificates.yaml' ||
     activeFile.name.toLowerCase() === 'certs.yaml')
  const canHaveSchema = isYamlFile && !isTemplateFile && !isSecretsFile && !isCertificatesFile

  // Detect theme changes
  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setTheme(isDark ? 'dark' : 'light')
    }

    updateTheme()
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  const getLanguage = useCallback((filename: string): string => {
    const lower = filename.toLowerCase()
    if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'yaml'
    if (lower.endsWith('.json')) return 'json'
    if (lower.endsWith('.tf') || lower.endsWith('.hcl') || lower.endsWith('.tfvars')) return 'hcl'
    if (lower.endsWith('.cue')) return 'cue'
    if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown'
    if (lower.endsWith('.xml')) return 'xml'
    if (lower.endsWith('.toml')) return 'toml'
    if (lower.endsWith('.sh') || lower.endsWith('.bash')) return 'shell'
    return 'plaintext'
  }, [])

  const validateYaml = useCallback((yamlContent: string): { valid: boolean; errors: string[] } => {
    if (!yamlContent.trim()) return { valid: true, errors: [] }
    
    try {
      yaml.load(yamlContent)
      return { valid: true, errors: [] }
    } catch (err) {
      const error = err as yaml.YAMLException
      const errorMessage = error.message || 'Invalid YAML syntax'
      return { valid: false, errors: [errorMessage] }
    }
  }, [])

  // Fetch schema file if it exists
  const fetchSchema = useCallback(async (file: OpenFile) => {
    if (!canHaveSchema || !window.electronAPI || !credentialId) {
      return
    }

    setSchemaLoading(true)
    try {
      // Try to fetch corresponding .schema.json file
      // For values.yaml -> values.schema.json
      const schemaPath = file.path.replace(/\.(yaml|yml)$/, '.schema.json')
      
      const result = await window.electronAPI.git.getFileContent(
        credentialId,
        schemaPath,
        currentBranch
      )

      if (result.success && result.data) {
        const schemaContent = JSON.parse(result.data.content)
        setSchema(schemaContent)
        console.log('Schema loaded successfully for', file.name)
      } else {
        // Schema file doesn't exist, that's okay
        setSchema(null)
      }
    } catch (err) {
      // Schema file doesn't exist or failed to parse, that's okay
      console.log('No schema file found or failed to parse:', err)
      setSchema(null)
    } finally {
      setSchemaLoading(false)
    }
  }, [canHaveSchema, credentialId, currentBranch])

  // Generate UI schema from JSON schema
  const generateUISchema = useCallback((schema: any): any => {
    const uiSchema: any = {}

    if (!schema || !schema.properties) {
      return uiSchema
    }

    Object.keys(schema.properties).forEach((key) => {
      const prop = schema.properties[key]
      uiSchema[key] = {}

      // Handle string formats
      if (prop.type === 'string') {
        if (prop.format === 'email') {
          uiSchema[key]['ui:widget'] = 'EmailWidget'
        } else if (prop.format === 'uri' || prop.format === 'url') {
          uiSchema[key]['ui:widget'] = 'URLWidget'
        } else if (prop.format === 'password') {
          uiSchema[key]['ui:widget'] = 'PasswordWidget'
        } else if (prop.maxLength && prop.maxLength > 100) {
          uiSchema[key]['ui:widget'] = 'TextareaWidget'
        }
      }

      // Handle enums
      if (prop.enum && Array.isArray(prop.enum)) {
        if (prop.enum.length <= 5) {
          uiSchema[key]['ui:widget'] = 'RadioWidget'
        } else {
          uiSchema[key]['ui:widget'] = 'SelectWidget'
        }
      }

      // Handle nested objects recursively
      if (prop.type === 'object' && prop.properties) {
        uiSchema[key] = {
          ...uiSchema[key],
          ...generateUISchema(prop)
        }
      }

      // Add help text from description
      if (prop.description) {
        uiSchema[key]['ui:help'] = prop.description
      }
    })

    return uiSchema
  }, [])

  const handleContentChange = (newContent: string) => {
    if (!activeFile) return
    
    console.log('handleContentChange called, isSchemaEditing:', isSchemaEditingRef.current, 'viewMode:', viewMode)
    
    onContentChange(activeFile.id, newContent)
    
    // Validate YAML files (skip template files)
    if (getLanguage(activeFile.name) === 'yaml') {
      const isTemplate = activeFile.path.includes('/templates/') || 
                        activeFile.path.includes('/chart/templates/') ||
                        newContent.includes('{{') || 
                        newContent.includes('}}')
      
      if (!isTemplate) {
        setValidationStatus('validating')
        setTimeout(() => {
          const result = validateYaml(newContent)
          setValidationStatus(result.valid ? 'valid' : 'invalid')
          setValidationErrors(result.errors)
        }, 300)
      } else {
        // Template files are always considered valid
        setValidationStatus('idle')
        setValidationErrors([])
      }
    }
  }

  // Handle view mode switching
  const handleViewModeChange = (newMode: 'yaml' | 'form' | 'json' | 'schema') => {
    if (!activeFile || newMode === viewMode) return

    console.log('Switching view mode from', viewMode, 'to', newMode)

    if (newMode === 'form') {
      // Switching from YAML to Form
      // Only allow form view for secrets.yaml, certificates.yaml, or files with schema
      if (!isSecretsFile && !isCertificatesFile && !schema && !schemaLoading) {
        console.log('Cannot switch to form view - no schema available')
        return
      }
      
      try {
        const parsedData = yaml.load(activeFile.content)
        setFormData(parsedData)
        setViewMode('form')
      } catch (err) {
        console.error('Failed to parse YAML for form view:', err)
        // Stay in YAML mode if parsing fails
      }
    } else if (newMode === 'yaml') {
      // Switching from Form to YAML
      try {
        // Only update content if formData is valid (not null/undefined)
        if (formData !== null && formData !== undefined) {
          const yamlContent = yaml.dump(formData, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false
          })
          if (activeFile) {
            onContentChange(activeFile.id, yamlContent)
          }
        }
        setViewMode('yaml')
      } catch (err) {
        console.error('Failed to convert form data to YAML:', err)
      }
    } else if (newMode === 'json') {
      // Switching to JSON view
      console.log('Switching to JSON view - user initiated')
      setIsSchemaEditing(false)
      if (activeFile) {
        setSchemaViewMode(activeFile.path, 'code')
      }
      setViewMode('json')
    } else if (newMode === 'schema') {
      // Switching to schema editor
      console.log('Switching to schema editor - user initiated')
      setIsSchemaEditing(true)
      if (activeFile) {
        setSchemaViewMode(activeFile.path, 'form')
      }
      setViewMode('schema')
    }
  }

  // Handle schema editor diff review
  const handleSchemaDiffReview = useCallback((originalContent: string, modifiedContent: string) => {
    setSchemaDiffData({ originalContent, modifiedContent })
    setShowDiffPreview(true)
  }, [])



  // Handle form data changes
  const handleFormChange = (data: any) => {
    // Support both old format (data.formData) and new format (data directly)
    const newFormData = data.formData !== undefined ? data.formData : data
    setFormData(newFormData)
    
    // Convert to YAML and update content
    // Only update if formData is valid (not null/undefined)
    if (newFormData !== null && newFormData !== undefined) {
      try {
        const yamlContent = yaml.dump(newFormData, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          sortKeys: false
        })
        if (activeFile) {
          onContentChange(activeFile.id, yamlContent)
        }
      } catch (err) {
        console.error('Failed to convert form data to YAML:', err)
      }
    }
  }

  const handleSave = () => {
    if (!activeFile) return
    onSaveFile(activeFile.id, activeFile.content)
  }

  // Handle validation status changes from Monaco
  const handleValidationChange = (status: 'valid' | 'invalid' | 'validating' | 'idle', errors: string[]) => {
    setValidationStatus(status)
    setValidationErrors(errors)
  }

  // Initialize formData when schema loads and we're in form view
  useEffect(() => {
    if (activeFile && schema && viewMode === 'form' && !formData) {
      try {
        const parsedData = yaml.load(activeFile.content)
        setFormData(parsedData)
      } catch (err) {
        console.error('Failed to parse YAML for form view:', err)
      }
    }
  }, [schema, viewMode, activeFile, formData])

  // Reset state when active file changes (only when switching files, not on content changes)
  useEffect(() => {
    if (activeFile) {
      const isNewFile = previousFileIdRef.current !== activeFile.id
      console.log('File changed effect triggered for:', activeFile.id, 'isNewFile:', isNewFile, 'current viewMode:', viewMode)
      
      // Only skip reset if it's the SAME file and we're in form mode
      if (!isNewFile && viewMode === 'form' && formData) {
        console.log('Skipping reset - same file, already in form view with data')
        return
      }
      
      // Update the previous file ID
      previousFileIdRef.current = activeFile.id
      
      // Restore saved view mode for this file, or default to YAML/JSON based on file type
      const savedViewMode = fileViewModes[activeFile.id]
      if (savedViewMode) {
        setViewModeState(savedViewMode)
      } else {
        // Default view mode based on file type
        if (activeFile.name.endsWith('.schema.json')) {
          setViewModeState('json')
        } else {
          setViewModeState('yaml')
        }
      }
      setSchema(null)
      setFormData(null)
      setValidationStatus('idle')
      setValidationErrors([])
      
      // Validate initial content for YAML files (skip template files)
      if (activeFile && getLanguage(activeFile.name) === 'yaml' && !isTemplateFile) {
        const result = validateYaml(activeFile.content)
        setValidationStatus(result.valid ? 'valid' : 'invalid')
        setValidationErrors(result.errors)
      } else if (isTemplateFile) {
        // Template files are always considered valid
        setValidationStatus('idle')
        setValidationErrors([])
      }
      
      // Fetch schema if applicable
      if (canHaveSchema) {
        fetchSchema(activeFile)
      }
    }
  }, [activeFile?.id, canHaveSchema, fetchSchema, getLanguage, validateYaml])

  // No files open state
  if (openFiles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed">
        <div className="text-center space-y-4">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground/50" />
          <div>
            <h3 className="text-lg font-medium">No files open</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Select a file from the browser to start editing
            </p>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Click [Edit] next to any file in the browser</p>
            <p>• Use search to find specific files</p>
            <p>• Open multiple files in tabs for easier editing</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background border rounded-lg overflow-hidden">
      {/* Tab Bar */}
      <div className="flex items-center bg-muted/30 border-b px-2 py-1 gap-1 overflow-x-auto">
        {openFiles.map((file) => (
          <div
            key={file.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors min-w-0 ${
              file.id === activeFileId 
                ? 'bg-background border shadow-sm' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => onSetActiveFile(file.id)}
          >
            <FileText className="h-3 w-3 flex-shrink-0" />
            <span className="text-sm font-medium truncate max-w-32">{file.name}</span>
            {file.hasChanges && (
              <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCloseFile(file.id)
              }}
              className="p-0.5 hover:bg-muted rounded flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        <Button variant="ghost" size="sm" className="flex-shrink-0 ml-2">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {activeFile && (
        <>
          {/* Editor Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium">{activeFile.name}</span>
                <span className="text-muted-foreground">|</span>
                <GitBranch className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-muted-foreground">main</span>
              </div>
              
              {/* Validation Status */}
              <div className="flex items-center gap-2">
                {validationStatus === 'validating' && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Validating...</span>
                  </>
                )}
                {validationStatus === 'valid' && (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span className="text-green-600 dark:text-green-400">Valid YAML</span>
                  </>
                )}
                {validationStatus === 'invalid' && (
                  <>
                    <AlertCircle className="h-3 w-3 text-destructive" />
                    <span className="text-destructive">Invalid YAML</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={!activeFile.hasChanges}
              >
                <Save className="h-3 w-3 mr-1" />
                {activeFile.hasChanges ? 'Save*' : 'Saved'}
              </Button>
              
              <Button variant="outline" size="sm">
                <RefreshCw className="h-3 w-3 mr-1" />
                Reload
              </Button>
              
              <Button variant="outline" size="sm">
                <Search className="h-3 w-3 mr-1" />
                Find
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDiffPreview(true)}
                disabled={!activeFile.hasChanges}
                title="View changes"
              >
                <GitCompare className="h-3 w-3 mr-1" />
                Diff
              </Button>
              
              {/* View Mode Toggle for YAML files */}
              {getLanguage(activeFile.name) === 'yaml' && !isTemplateFile && (
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button 
                    variant={viewMode === 'yaml' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="h-6 px-2"
                    onClick={() => handleViewModeChange('yaml')}
                  >
                    <FileCode className="h-3 w-3 mr-1" />
                    YAML
                  </Button>
                  <Button 
                    variant={viewMode === 'form' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="h-6 px-2"
                    onClick={() => handleViewModeChange('form')}
                    disabled={!isSecretsFile && !isCertificatesFile && !schema && !schemaLoading}
                    title={
                      isSecretsFile ? 'Switch to secrets form view' : 
                      isCertificatesFile ? 'Switch to certificates form view' :
                      (!schema ? 'No schema available for form view' : 'Switch to form view')
                    }
                  >
                    <FormInput className="h-3 w-3 mr-1" />
                    Form
                  </Button>
                </div>
              )}

              {/* View Mode Toggle for Schema JSON files */}
              {activeFile.name.endsWith('.schema.json') && (
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button 
                    variant={viewMode === 'json' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="h-6 px-2"
                    onClick={() => handleViewModeChange('json')}
                  >
                    <FileCode className="h-3 w-3 mr-1" />
                    Code
                  </Button>
                  <Button 
                    variant={viewMode === 'schema' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="h-6 px-2"
                    onClick={() => handleViewModeChange('schema')}
                  >
                    <FormInput className="h-3 w-3 mr-1" />
                    Form
                  </Button>
                </div>
              )}

              {/* Schema loading indicator */}
              {canHaveSchema && schemaLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Loading schema...</span>
                </div>
              )}

              {/* Template file indicator */}
              {isTemplateFile && (
                <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                  <Info className="h-3 w-3" />
                  <span>Helm template (validation disabled)</span>
                </div>
              )}
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mx-4 mt-2 rounded-none border-x-0">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-1">Validation Errors:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((err, idx) => (
                    <li key={idx} className="text-sm">{err}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Editor Area - YAML or Form View */}
          <div className="flex-1 min-h-0">
            {viewMode === 'yaml' || viewMode === 'json' ? (
              <MonacoEditorWrapper
                value={activeFile.content}
                onChange={handleContentChange}
                language={getLanguage(activeFile.name)}
                theme={theme}
                onValidationChange={handleValidationChange}
              />
            ) : viewMode === 'schema' && activeFile.name.endsWith('.schema.json') ? (
              <SchemaEditorForm
                content={activeFile.content}
                filePath={activeFile.path}
                onShowDiff={handleSchemaDiffReview}
              />
            ) : viewMode === 'form' && isSecretsFile ? (
              <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={65} minSize={40}>
                  <div className="h-full bg-background">
                    <SecretsFormEditor
                      content={activeFile.content}
                      onChange={handleContentChange}
                      environment="dev"
                      filePath={activeFile.path}
                      repoUrl={repoUrl}
                      branch={currentBranch}
                      credentialId={credentialId || ''}
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={35} minSize={20}>
                  <div className="h-full">
                    <MonacoEditorWrapper
                      value={activeFile.content}
                      onChange={handleContentChange}
                      language="yaml"
                      theme={theme}
                      onValidationChange={handleValidationChange}
                    />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : viewMode === 'form' && isCertificatesFile ? (
              <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={65} minSize={40}>
                  <div className="h-full bg-background">
                    <CertificateFormEditor
                      content={activeFile.content}
                      onChange={handleContentChange}
                      environment="dev"
                      filePath={activeFile.path}
                      repoUrl={repoUrl}
                      branch={currentBranch}
                      credentialId={credentialId || ''}
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={35} minSize={20}>
                  <div className="h-full">
                    <MonacoEditorWrapper
                      value={activeFile.content}
                      onChange={handleContentChange}
                      language="yaml"
                      theme={theme}
                      onValidationChange={handleValidationChange}
                    />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : viewMode === 'form' && schema && formData ? (
              <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={60} minSize={30}>
                  <div className="h-full bg-background">
                    <ImprovedFormEditor
                      schema={schema}
                      formData={formData}
                      onChange={handleFormChange}
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={40} minSize={20}>
                  <div className="h-full">
                    <MonacoEditorWrapper
                      value={activeFile.content}
                      onChange={handleContentChange}
                      language={getLanguage(activeFile.name)}
                      theme={theme}
                      onValidationChange={handleValidationChange}
                    />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="flex items-center justify-center h-full text-center space-y-4">
                <div>
                  <FormInput className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">Form View Not Available</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {schemaLoading 
                      ? 'Loading schema...' 
                      : 'No JSON schema found for this file'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Form view requires a corresponding .schema.json file
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Monaco Diff Preview Dialog */}
      {activeFile && (
        <MonacoDiffDialog
          open={showDiffPreview}
          onOpenChange={(open) => {
            setShowDiffPreview(open)
            if (!open) {
              setSchemaDiffData(null)
            }
          }}
          fileName={activeFile.name}
          filePath={activeFile.path}
          branch={currentBranch}
          originalContent={schemaDiffData?.originalContent || activeFile.originalContent}
          modifiedContent={schemaDiffData?.modifiedContent || activeFile.content}
          language={getLanguage(activeFile.name)}
          onCreatePullRequest={() => {
            if (schemaDiffData) {
              // Apply schema changes and stage for PR
              handleContentChange(schemaDiffData.modifiedContent)
              handleSave()
            } else {
              // Regular file staging
              handleSave()
            }
            setShowDiffPreview(false)
            setSchemaDiffData(null)
          }}
          onRevert={() => {
            if (schemaDiffData) {
              // Clear schema pre-staged changes
              const { clearPrestagedChanges } = useSchemaEditorStore.getState()
              clearPrestagedChanges(activeFile.path)
            } else {
              // Revert regular file changes
              handleContentChange(activeFile.originalContent)
            }
            setShowDiffPreview(false)
            setSchemaDiffData(null)
          }}
        />
      )}
    </div>
  )
}