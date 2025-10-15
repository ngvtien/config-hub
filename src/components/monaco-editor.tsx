import { memo } from 'react'
import Editor, { loader } from '@monaco-editor/react'

interface MonacoEditorComponentProps {
  value: string
  onChange: (value: string) => void
  language?: string
  theme?: 'light' | 'dark'
  readOnly?: boolean
  onValidationChange?: (status: 'valid' | 'invalid' | 'validating' | 'idle', errors: string[]) => void
}

// Configure Monaco on module load
loader.init().then((monaco) => {
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
        'for_each', 'count', 'depends_on', 'lifecycle', 'dynamic'
      ],
      
      typeKeywords: [
        'string', 'number', 'bool', 'list', 'map', 'set', 'object', 'tuple', 'any'
      ],
      
      operators: [
        '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
        '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
        '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
        '%=', '<<=', '>>=', '>>>='
      ],
      
      symbols: /[=><!~?:&|+\-*\/\^%]+/,
      
      tokenizer: {
        root: [
          [/[a-z_$][\w$]*/, {
            cases: {
              '@typeKeywords': 'type',
              '@keywords': 'keyword',
              '@default': 'identifier'
            }
          }],
          
          { include: '@whitespace' },
          
          [/[{}()\[\]]/, '@brackets'],
          [/[<>](?!@symbols)/, '@brackets'],
          [/@symbols/, {
            cases: {
              '@operators': 'operator',
              '@default': ''
            }
          }],
          
          [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
          [/0[xX][0-9a-fA-F]+/, 'number.hex'],
          [/\d+/, 'number'],
          
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
        ],
        
        string: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape.invalid'],
          [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
        ],
        
        whitespace: [
          [/[ \t\r\n]+/, 'white'],
          [/#.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          [/\/\/.*$/, 'comment'],
        ],
        
        comment: [
          [/[^\/*]+/, 'comment'],
          [/\/\*/, 'comment', '@push'],
          [/\*\//, 'comment', '@pop'],
          [/[\/*]/, 'comment']
        ],
      },
    })
    
    // HCL language configuration
    monaco.languages.setLanguageConfiguration('hcl', {
      comments: {
        lineComment: '#',
        blockComment: ['/*', '*/']
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"', notIn: ['string'] },
      ],
      surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
      ],
    })
  }
})

function MonacoEditorComponent(props: MonacoEditorComponentProps) {
  const {
    value,
    onChange,
    language = 'yaml',
    theme = 'light',
    readOnly = false,
  } = props

  const getMonacoLanguage = (lang: string): string => {
    switch (lang) {
      case 'yaml':
        return 'yaml'
      case 'json':
        return 'json'
      case 'markdown':
        return 'markdown'
      case 'javascript':
        return 'javascript'
      case 'typescript':
        return 'typescript'
      case 'hcl':
        return 'hcl'
      case 'shell':
        return 'shell'
      case 'toml':
        return 'ini' // Monaco doesn't have TOML, use INI as fallback
      case 'cue':
        return 'go' // CUE is Go-like, use Go syntax
      default:
        return 'plaintext'
    }
  }

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '')
  }

  return (
    <Editor
      height="100%"
      language={getMonacoLanguage(language)}
      value={value}
      theme={theme === 'dark' ? 'vs-dark' : 'vs'}
      onChange={handleEditorChange}
      options={{
        readOnly,
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
      }}
    />
  )
}

// Memoize to prevent unnecessary re-renders
export const MonacoEditorWrapper = memo(MonacoEditorComponent, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.language === nextProps.language &&
    prevProps.theme === nextProps.theme &&
    prevProps.readOnly === nextProps.readOnly
  )
})
