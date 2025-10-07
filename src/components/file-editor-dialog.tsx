import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, FileText, GitBranch as GitBranchIcon, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import Editor, { loader } from '@monaco-editor/react'
import { configureMonacoYaml } from 'monaco-yaml'
import * as yaml from 'js-yaml'
import type { editor as MonacoEditor } from 'monaco-editor'
import { DiffPreviewDialog } from './diff-preview-dialog'

interface FileEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filePath: string
  fileName: string
  branch: string
  initialContent: string
  onSave: (content: string) => Promise<void>
}

export function FileEditorDialog({
  open,
  onOpenChange,
  filePath,
  fileName,
  branch,
  initialContent,
  onSave,
}: FileEditorDialogProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [theme, setTheme] = useState<'vs' | 'vs-dark'>('vs')
  const [validationStatus, setValidationStatus] = useState<'valid' | 'invalid' | 'validating' | 'idle'>('idle')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showDiffPreview, setShowDiffPreview] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Check if this is a template file (contains Go/Helm template syntax)
  const isTemplateFile = filePath.includes('/templates/') || content.includes('{{') || content.includes('}}')
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)

  // Detect and track theme changes
  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setTheme(isDark ? 'vs-dark' : 'vs')
    }

    // Set initial theme
    updateTheme()

    // Watch for theme changes
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  // Determine file language from extension
  const getLanguage = useCallback((filename: string): string => {
    const lower = filename.toLowerCase()
    if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'yaml'
    if (lower.endsWith('.json')) return 'json'
    if (lower.endsWith('.tf') || lower.endsWith('.hcl') || lower.endsWith('.tfvars')) return 'hcl'
    if (lower.endsWith('.xml')) return 'xml'
    if (lower.endsWith('.toml')) return 'toml'
    if (lower.endsWith('.ini') || lower.endsWith('.conf')) return 'ini'
    if (lower.endsWith('.sh') || lower.endsWith('.bash')) return 'shell'
    if (lower.endsWith('.py')) return 'python'
    if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'javascript'
    if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'typescript'
    if (lower.endsWith('.md')) return 'markdown'
    return 'plaintext'
  }, [])

  // Validate YAML content
  const validateYaml = useCallback((yamlContent: string): { valid: boolean; errors: string[] } => {
    if (!yamlContent.trim()) {
      return { valid: true, errors: [] }
    }

    try {
      yaml.load(yamlContent)
      return { valid: true, errors: [] }
    } catch (err) {
      const error = err as yaml.YAMLException
      const errorMessage = error.message || 'Invalid YAML syntax'
      const lineInfo = error.mark ? ` at line ${error.mark.line + 1}, column ${error.mark.column + 1}` : ''
      return { valid: false, errors: [`${errorMessage}${lineInfo}`] }
    }
  }, [])

  // Validate JSON content
  const validateJson = useCallback((jsonContent: string): { valid: boolean; errors: string[] } => {
    if (!jsonContent.trim()) {
      return { valid: true, errors: [] }
    }

    try {
      JSON.parse(jsonContent)
      return { valid: true, errors: [] }
    } catch (err) {
      const error = err as Error
      return { valid: false, errors: [error.message || 'Invalid JSON syntax'] }
    }
  }, [])

  // Debounced validation
  const validateContent = useCallback((newContent: string, language: string, skipValidation: boolean = false) => {
    // Clear previous timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }

    // Skip validation for template files
    if (skipValidation) {
      setValidationStatus('idle')
      setValidationErrors([])
      return
    }

    // Set validating status immediately
    setValidationStatus('validating')

    // Debounce validation by 300ms
    validationTimeoutRef.current = setTimeout(() => {
      let result: { valid: boolean; errors: string[] }

      if (language === 'yaml') {
        result = validateYaml(newContent)
      } else if (language === 'json') {
        result = validateJson(newContent)
      } else {
        // For other languages, skip validation
        setValidationStatus('idle')
        setValidationErrors([])
        return
      }

      setValidationStatus(result.valid ? 'valid' : 'invalid')
      setValidationErrors(result.errors)
    }, 300)
  }, [validateYaml, validateJson])

  // Reset state when dialog opens with new content
  useEffect(() => {
    if (open) {
      setContent(initialContent)
      setHasChanges(false)
      setError(null)
      setValidationStatus('idle')
      setValidationErrors([])
      
      // Validate initial content (skip for template files)
      const language = getLanguage(fileName)
      if (language === 'yaml' || language === 'json') {
        validateContent(initialContent, language, isTemplateFile)
      }
    }
  }, [open, initialContent, fileName, getLanguage, validateContent, isTemplateFile])

  // Cleanup validation timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [])

  // Configure Monaco Editor on mount
  useEffect(() => {
    loader.init().then((monaco) => {
      // Configure YAML language support with validation
      configureMonacoYaml(monaco, {
        enableSchemaRequest: false,
        hover: true,
        completion: true,
        validate: true,
        format: true,
        schemas: [],
      })

      // Register HCL language if not already registered
      const languages = monaco.languages.getLanguages()
      const hclExists = languages.some((lang) => lang.id === 'hcl')
      
      if (!hclExists) {
        monaco.languages.register({ id: 'hcl' })
        
        // HCL syntax highlighting (Terraform/HCL)
        monaco.languages.setMonarchTokensProvider('hcl', {
          defaultToken: '',
          tokenPostfix: '.hcl',
          keywords: [
            'resource', 'variable', 'output', 'locals', 'module', 'data',
            'provider', 'terraform', 'backend', 'provisioner', 'connection',
            'for_each', 'count', 'depends_on', 'lifecycle', 'dynamic',
          ],
          typeKeywords: [
            'string', 'number', 'bool', 'list', 'map', 'set', 'object', 'tuple', 'any',
          ],
          operators: [
            '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
            '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
            '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
            '%=', '<<=', '>>=', '>>>=',
          ],
          symbols: /[=><!~?:&|+\-*\/\^%]+/,
          escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
          tokenizer: {
            root: [
              // Comments
              [/#.*$/, 'comment'],
              [/\/\/.*$/, 'comment'],
              [/\/\*/, 'comment', '@comment'],
              
              // Identifiers and keywords
              [/[a-z_$][\w$]*/, {
                cases: {
                  '@typeKeywords': 'keyword.type',
                  '@keywords': 'keyword',
                  '@default': 'identifier',
                },
              }],
              
              // Whitespace
              { include: '@whitespace' },
              
              // Delimiters and operators
              [/[{}()\[\]]/, '@brackets'],
              [/[<>](?!@symbols)/, '@brackets'],
              [/@symbols/, {
                cases: {
                  '@operators': 'operator',
                  '@default': '',
                },
              }],
              
              // Numbers
              [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
              [/0[xX][0-9a-fA-F]+/, 'number.hex'],
              [/\d+/, 'number'],
              
              // Strings
              [/"([^"\\]|\\.)*$/, 'string.invalid'],
              [/"/, 'string', '@string_double'],
              [/'([^'\\]|\\.)*$/, 'string.invalid'],
              [/'/, 'string', '@string_single'],
              
              // Heredoc
              [/<<-?\s*([A-Z]+)/, { token: 'string.heredoc.delimiter', next: '@heredoc.$1' }],
            ],
            
            comment: [
              [/[^\/*]+/, 'comment'],
              [/\*\//, 'comment', '@pop'],
              [/[\/*]/, 'comment'],
            ],
            
            string_double: [
              [/[^\\"]+/, 'string'],
              [/@escapes/, 'string.escape'],
              [/\\./, 'string.escape.invalid'],
              [/"/, 'string', '@pop'],
            ],
            
            string_single: [
              [/[^\\']+/, 'string'],
              [/@escapes/, 'string.escape'],
              [/\\./, 'string.escape.invalid'],
              [/'/, 'string', '@pop'],
            ],
            
            heredoc: [
              [/^\s*([A-Z]+)\s*$/, {
                cases: {
                  '$1==$S2': { token: 'string.heredoc.delimiter', next: '@pop' },
                  '@default': 'string.heredoc',
                },
              }],
              [/.*/, 'string.heredoc'],
            ],
            
            whitespace: [
              [/[ \t\r\n]+/, ''],
            ],
          },
        })

        // HCL language configuration
        monaco.languages.setLanguageConfiguration('hcl', {
          comments: {
            lineComment: '#',
            blockComment: ['/*', '*/'],
          },
          brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
          ],
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
          ],
          surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
          ],
          folding: {
            markers: {
              start: new RegExp('^\\s*#region\\b'),
              end: new RegExp('^\\s*#endregion\\b'),
            },
          },
        })
      }

      // Configure JSON language settings
      monaco.languages.json?.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [],
        allowComments: true,
        trailingCommas: 'ignore',
      })
    })
  }, [])



  const handleContentChange = (newContent: string | undefined) => {
    if (newContent === undefined) return
    setContent(newContent)
    setHasChanges(newContent !== initialContent)
    
    // Trigger validation for YAML and JSON files (skip for templates)
    const language = getLanguage(fileName)
    if (language === 'yaml' || language === 'json') {
      validateContent(newContent, language, isTemplateFile)
    }
  }

  const handleEditorDidMount = (editor: MonacoEditor.IStandaloneCodeEditor) => {
    editorRef.current = editor
  }

  const handleSave = async () => {
    if (!hasChanges) {
      onOpenChange(false)
      return
    }

    const language = getLanguage(fileName)
    
    // Prevent save if validation is in progress
    if (validationStatus === 'validating') {
      setError('Please wait for validation to complete')
      return
    }

    // Perform final validation check for YAML/JSON files
    // Skip validation for template files (they contain {{ }} syntax)
    if ((language === 'yaml' || language === 'json') && !isTemplateFile) {
      let finalValidation: { valid: boolean; errors: string[] }
      
      if (language === 'yaml') {
        finalValidation = validateYaml(content)
      } else {
        finalValidation = validateJson(content)
      }

      if (!finalValidation.valid) {
        setError(`Cannot save: ${finalValidation.errors.join(', ')}`)
        setValidationStatus('invalid')
        setValidationErrors(finalValidation.errors)
        return
      }
    }

    // Show diff preview before saving
    setShowDiffPreview(true)
  }

  const handleConfirmSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      await onSave(content)
      
      // Success - close both dialogs
      setShowDiffPreview(false)
      onOpenChange(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save changes'
      setError(errorMessage)
      
      // Log error for debugging
      console.error('Failed to save file:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      setShowCancelConfirm(true)
      return
    }
    
    // Reset all state and close
    handleConfirmCancel()
  }

  const handleConfirmCancel = () => {
    // Reset all state
    setContent(initialContent)
    setHasChanges(false)
    setError(null)
    setValidationStatus('idle')
    setValidationErrors([])
    setShowCancelConfirm(false)
    
    // Clear any pending validation
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }
    
    onOpenChange(false)
  }

  // Handle keyboard shortcuts at dialog level
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return
      
      // Escape to cancel (only if no unsaved changes)
      if (e.key === 'Escape' && !hasChanges) {
        e.preventDefault()
        handleCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, hasChanges])

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Edit: {fileName}
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted-foreground">{filePath}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <GitBranchIcon className="h-3 w-3" />
              <span className="font-mono">{branch}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Validation Status Indicator */}
        {(getLanguage(fileName) === 'yaml' || getLanguage(fileName) === 'json') && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b text-sm">
            {isTemplateFile ? (
              <>
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-600 dark:text-blue-400">Template file (validation disabled)</span>
              </>
            ) : (
              <>
                {validationStatus === 'validating' && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Validating...</span>
                  </>
                )}
                {validationStatus === 'valid' && (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400">Valid {getLanguage(fileName).toUpperCase()}</span>
                  </>
                )}
                {validationStatus === 'invalid' && (
                  <>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-destructive">Invalid {getLanguage(fileName).toUpperCase()}</span>
                  </>
                )}
                {validationStatus === 'idle' && (
                  <>
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Ready to edit</span>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="mx-4 mt-2">
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

        {/* Monaco Editor */}
        <div className="flex-1 min-h-[400px] border rounded-md overflow-hidden bg-background">
          <Editor
            height="400px"
            language={getLanguage(fileName)}
            value={content}
            onChange={handleContentChange}
            onMount={handleEditorDidMount}
            theme={theme}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
              fontLigatures: true,
              lineNumbers: 'on',
              rulers: [],
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              formatOnPaste: true,
              formatOnType: false,
              renderWhitespace: 'selection',
              bracketPairColorization: {
                enabled: true,
              },
              guides: {
                indentation: true,
                bracketPairs: true,
              },
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                useShadows: false,
                verticalScrollbarSize: 14,
                horizontalScrollbarSize: 14,
              },
              padding: {
                top: 16,
                bottom: 16,
              },
              // Language-specific settings
              quickSuggestions: {
                other: true,
                comments: false,
                strings: false,
              },
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnCommitCharacter: true,
              acceptSuggestionOnEnter: 'on',
              snippetSuggestions: 'inline',
            }}
            loading={
              <div className="flex items-center justify-center h-full bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          />
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Footer with Action Buttons */}
        <DialogFooter className="flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground space-y-1">
              {hasChanges && (
                <div className="text-orange-600 dark:text-orange-400">
                  • Unsaved changes
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  !hasChanges || 
                  isSaving || 
                  validationStatus === 'invalid' ||
                  validationStatus === 'validating'
                }
                title="Save changes"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Diff Preview Dialog */}
    <DiffPreviewDialog
      open={showDiffPreview}
      onOpenChange={setShowDiffPreview}
      fileName={fileName}
      filePath={filePath}
      branch={branch}
      originalContent={initialContent}
      modifiedContent={content}
      onCreatePullRequest={handleConfirmSave}
    />

    {/* Cancel Confirmation Dialog */}
    <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Are you sure you want to close without saving? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continue Editing</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmCancel}>
            Discard Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  )
}
