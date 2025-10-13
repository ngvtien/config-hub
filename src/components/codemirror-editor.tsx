import { useMemo, useRef } from 'react'
import { applySyntaxHighlighting, themes } from '@/lib/codemirror-themes'

interface CodeMirrorEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  theme?: 'light' | 'dark'
  readOnly?: boolean
  onValidationChange?: (status: 'valid' | 'invalid' | 'validating' | 'idle', errors: string[]) => void
}

export function CodeMirrorEditor({
  value,
  onChange,
  language = 'yaml',
  theme = 'light',
  readOnly = false,
}: CodeMirrorEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  
  // Calculate line count and highlighted code
  const lineCount = useMemo(() => value.split('\n').length, [value])
  const highlightedCode = useMemo(() => 
    applySyntaxHighlighting(value, language, theme), 
    [value, language, theme]
  )
  
  const themeColors = themes[theme]

  // Sync scroll between textarea and highlight layer
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  // Handle tab indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.target as HTMLTextAreaElement
      const start = target.selectionStart
      const end = target.selectionEnd
      
      if (e.shiftKey) {
        // Shift+Tab: Remove indentation
        const beforeCursor = value.substring(0, start)
        const afterCursor = value.substring(end)
        const lines = beforeCursor.split('\n')
        const currentLine = lines[lines.length - 1]
        
        if (currentLine.startsWith('  ')) {
          const newBeforeCursor = beforeCursor.substring(0, beforeCursor.length - currentLine.length) + currentLine.substring(2)
          const newValue = newBeforeCursor + afterCursor
          onChange(newValue)
          
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = start - 2
          }, 0)
        }
      } else {
        // Tab: Add indentation
        const newValue = value.substring(0, start) + '  ' + value.substring(end)
        onChange(newValue)
        
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 2
        }, 0)
      }
    }
  }

  return (
    <div className="relative h-full overflow-hidden">
      {/* Language indicator */}
      <div 
        className="absolute top-2 right-2 text-xs px-2 py-1 rounded border z-30"
        style={{
          backgroundColor: themeColors.background,
          color: themeColors.foreground,
          borderColor: theme === 'dark' ? '#374151' : '#d1d5db'
        }}
      >
        {language.toUpperCase()}
      </div>

      {/* Line numbers */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-12 border-r flex flex-col text-xs font-mono leading-6 pt-4 pl-2 z-20"
        style={{
          backgroundColor: theme === 'dark' ? '#252526' : '#f6f8fa',
          borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
          color: themeColors.lineNumbers
        }}
      >
        {Array.from({ length: Math.max(lineCount, 20) }, (_, i) => (
          <div key={i + 1} className="h-6 flex items-center">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Syntax highlighting layer */}
      <div 
        ref={highlightRef}
        className="absolute left-12 top-0 right-0 bottom-0 overflow-hidden pointer-events-none z-10 p-4"
        style={{
          fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
          fontSize: '14px',
          lineHeight: '24px',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          backgroundColor: themeColors.background,
          color: themeColors.foreground,
        }}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />

      {/* Editor textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        readOnly={readOnly}
        className="absolute left-12 top-0 right-0 bottom-0 w-auto h-full p-4 font-mono text-sm border-0 resize-none focus:outline-none z-20"
        style={{
          fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
          fontSize: '14px',
          lineHeight: '24px',
          minHeight: '400px',
          backgroundColor: 'transparent',
          color: 'transparent',
          caretColor: themeColors.foreground,
          // Custom selection colors
          ...(theme === 'dark' ? {
            '::selection': { backgroundColor: themeColors.selection },
            '::-moz-selection': { backgroundColor: themeColors.selection }
          } : {
            '::selection': { backgroundColor: themeColors.selection },
            '::-moz-selection': { backgroundColor: themeColors.selection }
          })
        }}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />

      {/* Background styling */}
      <div 
        className="absolute inset-0 -z-10 rounded-lg border"
        style={{
          backgroundColor: themeColors.background,
          borderColor: theme === 'dark' ? '#374151' : '#d1d5db'
        }}
      />

      {/* Custom selection styles */}
      <style>{`
        .codemirror-editor-${theme} ::selection {
          background-color: ${themeColors.selection} !important;
        }
        .codemirror-editor-${theme} ::-moz-selection {
          background-color: ${themeColors.selection} !important;
        }
      `}</style>
    </div>
  )
}

// TODO: Replace with proper CodeMirror implementation
// This requires installing: @uiw/react-codemirror @codemirror/lang-yaml @codemirror/lang-json @codemirror/view
// 
// Example of proper implementation:
// import CodeMirror from '@uiw/react-codemirror'
// import { yaml } from '@codemirror/lang-yaml'
// import { json } from '@codemirror/lang-json'
// import { EditorView } from '@codemirror/view'
// 
// export function ProperCodeMirrorEditor({ value, onChange, language, theme }) {
//   const extensions = useMemo(() => {
//     const exts = []
//     if (language === 'yaml') exts.push(yaml())
//     if (language === 'json') exts.push(json())
//     return exts
//   }, [language])
//
//   return (
//     <CodeMirror
//       value={value}
//       onChange={onChange}
//       theme={theme}
//       extensions={extensions}
//       basicSetup={{
//         lineNumbers: true,
//         foldGutter: true,
//         dropCursor: false,
//         allowMultipleSelections: false,
//       }}
//     />
//   )
// }

// Keep the fallback for compatibility
export function FallbackTextEditor(props: CodeMirrorEditorProps) {
  return <CodeMirrorEditor {...props} />
}