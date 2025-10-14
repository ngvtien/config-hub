import { useEffect, useRef, useMemo } from 'react'
import { EditorView, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, keymap } from '@codemirror/view'
import { EditorState, Extension } from '@codemirror/state'
import { foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldKeymap } from '@codemirror/language'
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands'
import { highlightSelectionMatches as highlightSelectionMatchesExt, searchKeymap } from '@codemirror/search'
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { lintKeymap } from '@codemirror/lint'
import { MergeView } from '@codemirror/merge'
import { yaml } from '@codemirror/lang-yaml'
import { json } from '@codemirror/lang-json'
import { javascript } from '@codemirror/lang-javascript'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'

interface CodeMirrorDiffViewerProps {
  originalContent: string
  modifiedContent: string
  language?: string
  theme?: 'light' | 'dark'
  className?: string
  orientation?: 'horizontal' | 'vertical'
  readOnly?: boolean
  key?: string // Add explicit key prop for better isolation
}

export function CodeMirrorDiffViewer({
  originalContent,
  modifiedContent,
  language = 'yaml',
  theme = 'light',
  className = '',
  orientation = 'horizontal',
  readOnly = true,
  key
}: CodeMirrorDiffViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mergeViewRef = useRef<MergeView | null>(null)
  
  // Generate unique ID for this instance
  const instanceId = useMemo(() => 
    `codemirror-diff-${key || Math.random().toString(36).substr(2, 9)}`, 
    [key]
  )

  // Get language extension
  const languageExtension = useMemo(() => {
    switch (language.toLowerCase()) {
      case 'yaml':
      case 'yml':
        return yaml()
      case 'json':
        return json()
      case 'javascript':
      case 'js':
      case 'typescript':
      case 'ts':
        return javascript()
      case 'markdown':
      case 'md':
        return markdown()
      case 'hcl':
      case 'tf':
        // HCL/Terraform - use JavaScript for basic syntax highlighting
        return javascript()
      default:
        return []
    }
  }, [language])

  // Create basic setup extensions
  const basicExtensions = useMemo((): Extension[] => [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(false),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightSelectionMatchesExt(),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      ...lintKeymap
    ])
  ], [])

  // Create extensions array
  const extensions = useMemo(() => {
    const exts = [
      ...basicExtensions,
      EditorView.theme({
        '&': {
          fontSize: '14px',
          fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
        },
        '.cm-content': {
          padding: '12px',
          minHeight: '200px',
        },
        '.cm-focused': {
          outline: 'none',
        },
        '.cm-editor': {
          borderRadius: '6px',
        },
        '.cm-scroller': {
          fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
        },
        // Custom diff colors
        '.cm-deletedChunk': {
          backgroundColor: theme === 'dark' ? '#6e1a1a' : '#ffeef0',
        },
        '.cm-addedChunk': {
          backgroundColor: theme === 'dark' ? '#0d4429' : '#e6ffed',
        },
        '.cm-changedChunk': {
          backgroundColor: theme === 'dark' ? '#1f2937' : '#fff8c5',
        },
        '.cm-deletedLine': {
          backgroundColor: theme === 'dark' ? '#6e1a1a' : '#ffebe9',
          borderLeft: '3px solid #da3633',
        },
        '.cm-addedLine': {
          backgroundColor: theme === 'dark' ? '#0d4429' : '#e6ffec',
          borderLeft: '3px solid #28a745',
        },
        '.cm-gutter': {
          backgroundColor: theme === 'dark' ? '#1f2937' : '#f6f8fa',
          borderRight: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
        },
        '.cm-lineNumbers': {
          color: theme === 'dark' ? '#6b7280' : '#6e7681',
          fontSize: '12px',
        },
      }),
      EditorState.readOnly.of(readOnly),
    ]

    if (languageExtension) {
      exts.push(languageExtension)
    }

    if (theme === 'dark') {
      exts.push(oneDark)
    }

    return exts
  }, [languageExtension, theme, readOnly])

  useEffect(() => {
    if (!containerRef.current) return

    // Clean up previous instance completely
    if (mergeViewRef.current) {
      try {
        mergeViewRef.current.destroy()
      } catch (e) {
        console.warn('Error destroying MergeView:', e)
      }
      mergeViewRef.current = null
    }

    // Clear the container completely
    containerRef.current.innerHTML = ''

    // Add a small delay to ensure cleanup is complete
    const timer = setTimeout(() => {
      if (!containerRef.current) return

      try {
        // Create MergeView with completely fresh state
        const mergeView = new MergeView({
          a: {
            doc: originalContent,
            extensions: [...extensions], // Create new array to avoid reference sharing
          },
          b: {
            doc: modifiedContent,
            extensions: [...extensions], // Create new array to avoid reference sharing
          },
          parent: containerRef.current,
          orientation: orientation === 'vertical' ? 'b-a' : 'a-b',
          revertControls: 'a-to-b',
          gutter: true,
        })

        mergeViewRef.current = mergeView
      } catch (e) {
        console.error('Error creating MergeView:', e)
      }
    }, 10)

    return () => {
      clearTimeout(timer)
      if (mergeViewRef.current) {
        try {
          mergeViewRef.current.destroy()
        } catch (e) {
          console.warn('Error in cleanup:', e)
        }
        mergeViewRef.current = null
      }
    }
  }, [originalContent, modifiedContent, extensions, orientation, instanceId])

  return (
    <div 
      ref={containerRef} 
      id={instanceId}
      className={`codemirror-diff-viewer ${className}`}
      style={{
        height: 'auto',
        minHeight: '400px',
        maxHeight: '100%',
        border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
        borderRadius: '8px',
        overflow: 'visible',
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
      }}
    />
  )
}

// Diff statistics calculation
export function calculateDiffStats(original: string, modified: string) {
  const originalLines = original.split('\n')
  const modifiedLines = modified.split('\n')
  
  let additions = 0
  let deletions = 0
  let changes = 0
  
  const maxLines = Math.max(originalLines.length, modifiedLines.length)
  
  for (let i = 0; i < maxLines; i++) {
    const originalLine = originalLines[i] || ''
    const modifiedLine = modifiedLines[i] || ''
    
    if (i >= originalLines.length) {
      additions++
    } else if (i >= modifiedLines.length) {
      deletions++
    } else if (originalLine !== modifiedLine) {
      changes++
    }
  }
  
  return {
    additions,
    deletions,
    changes,
    total: additions + deletions + changes
  }
}