import { memo, useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { yaml } from '@codemirror/lang-yaml'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { javascript } from '@codemirror/lang-javascript'
import { EditorView } from '@codemirror/view'
import { StreamLanguage } from '@codemirror/language'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { toml } from '@codemirror/legacy-modes/mode/toml'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { githubLight } from '@uiw/codemirror-theme-github'

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

  const extensions = useMemo(() => {
    const exts = []

    // Add language support
    switch (language) {
      case 'yaml':
        exts.push(yaml())
        break
      case 'json':
        exts.push(json())
        break
      case 'markdown':
        exts.push(markdown())
        break
      case 'javascript':
      case 'typescript':
        exts.push(javascript({ typescript: language === 'typescript' }))
        break
      case 'hcl':
      case 'shell':
        // HCL/Terraform and shell scripts
        exts.push(StreamLanguage.define(shell))
        break
      case 'toml':
        exts.push(StreamLanguage.define(toml))
        break
      case 'cue':
        // CUE uses Go-like syntax, use JavaScript as fallback for basic highlighting
        exts.push(javascript())
        break
      default:
        // Plaintext for unsupported languages
        break
    }

    // Add read-only extension if needed
    if (readOnly) {
      exts.push(EditorView.editable.of(false))
    }

    return exts
  }, [language, readOnly])

  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={theme === 'dark' ? vscodeDark : githubLight}
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
