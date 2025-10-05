import { useState, useCallback } from 'react'
import * as yaml from 'js-yaml'

export type EditorView = 'yaml' | 'form'

export interface ValidationError {
  line?: number
  column?: number
  message: string
}

export interface UseFileEditorOptions {
  initialContent?: string
  initialView?: EditorView
  onSave?: (content: string) => Promise<void>
}

export interface UseFileEditorResult {
  // Content state
  content: string
  originalContent: string
  hasChanges: boolean
  
  // View state
  view: EditorView
  setView: (view: EditorView) => void
  
  // Validation state
  isValid: boolean
  validationErrors: ValidationError[]
  
  // Actions
  setContent: (content: string) => void
  validateContent: () => boolean
  save: () => Promise<void>
  reset: () => void
  
  // Loading state
  isSaving: boolean
  saveError: string | null
}

/**
 * Hook to manage file editing state
 * Handles YAML/form view toggle and validation
 */
export function useFileEditor(options: UseFileEditorOptions = {}): UseFileEditorResult {
  const {
    initialContent = '',
    initialView = 'yaml',
    onSave
  } = options

  // Content state
  const [content, setContentState] = useState(initialContent)
  const [originalContent] = useState(initialContent)
  
  // View state
  const [view, setView] = useState<EditorView>(initialView)
  
  // Validation state
  const [isValid, setIsValid] = useState(true)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  
  // Save state
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Check if content has changed
  const hasChanges = content !== originalContent

  // Set content and validate
  const setContent = useCallback((newContent: string) => {
    setContentState(newContent)
    // Auto-validate on content change
    validateYAML(newContent, setIsValid, setValidationErrors)
  }, [])

  // Validate content
  const validateContent = useCallback((): boolean => {
    return validateYAML(content, setIsValid, setValidationErrors)
  }, [content])

  // Save content
  const save = useCallback(async () => {
    if (!onSave) {
      console.warn('No onSave handler provided')
      return
    }

    // Validate before saving
    if (!validateContent()) {
      setSaveError('Cannot save: Content has validation errors')
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      await onSave(content)
      // Success - content is now the new "original"
      // Note: Parent component should handle updating originalContent if needed
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save'
      setSaveError(errorMessage)
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [content, onSave, validateContent])

  // Reset to original content
  const reset = useCallback(() => {
    setContentState(originalContent)
    setIsValid(true)
    setValidationErrors([])
    setSaveError(null)
  }, [originalContent])

  return {
    // Content state
    content,
    originalContent,
    hasChanges,
    
    // View state
    view,
    setView,
    
    // Validation state
    isValid,
    validationErrors,
    
    // Actions
    setContent,
    validateContent,
    save,
    reset,
    
    // Loading state
    isSaving,
    saveError,
  }
}

// Helper function to validate YAML
function validateYAML(
  content: string,
  setIsValid: (valid: boolean) => void,
  setValidationErrors: (errors: ValidationError[]) => void
): boolean {
  if (!content.trim()) {
    setIsValid(true)
    setValidationErrors([])
    return true
  }

  try {
    yaml.load(content)
    setIsValid(true)
    setValidationErrors([])
    return true
  } catch (err: unknown) {
    const error = err as Error & { mark?: { line?: number; column?: number } }
    
    if (error.name === 'YAMLException' || 'mark' in error) {
      const validationError: ValidationError = {
        line: error.mark?.line,
        column: error.mark?.column,
        message: error.message
      }
      setIsValid(false)
      setValidationErrors([validationError])
      return false
    }
    
    // Unknown error
    setIsValid(false)
    setValidationErrors([{
      message: error instanceof Error ? error.message : 'Unknown validation error'
    }])
    return false
  }
}
