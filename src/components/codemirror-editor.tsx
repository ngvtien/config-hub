import { memo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { yaml } from '@codemirror/lang-yaml'
import { json } from '@codemirror/lang-json'
import { EditorView } from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'

interface CodeMirrorEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  theme?: 'light' | 'dark'
  readOnly?: boolean
  onValidationChange?: (status: 'valid' | 'invalid' | 'validating' | 'idle', errors: string[]) => void
}

function CodeMirrorEditorComponent(props: CodeMirrorEditorProps) {
  const {
    value,
    onChange,
    language = 'yaml',
    theme = 'light',
    readOnly = false,
  } = props

  const extensions = []
  
  // Add language support
  if (language === 'yaml') extensions.push(yaml())
  if (language === 'json') extensions.push(json())
  
  // Add read-only extension if needed
  if (readOnly) {
    extensions.push(EditorView.editable.of(false))
  }
  
  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={theme === 'dark' ? oneDark : 'light'}
      extensions={extensions}
      onChange={(value) => onChange(value)}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: !readOnly,
        highlightActiveLineGutter: !readOnly,
        highlightSelectionMatches: !readOnly,
        bracketMatching: true,
        closeBrackets: !readOnly,
        autocompletion: !readOnly,
        indentOnInput: true,
      }}
      className="h-full text-sm"
    />
  )
}

// Memoize to prevent unnecessary re-renders
export const CodeMirrorEditor = memo(CodeMirrorEditorComponent, (prevProps, nextProps) => {
  // Only re-render if value, language, theme, or readOnly actually changed
  return (
    prevProps.value === nextProps.value &&
    prevProps.language === nextProps.language &&
    prevProps.theme === nextProps.theme &&
    prevProps.readOnly === nextProps.readOnly
  )
})
