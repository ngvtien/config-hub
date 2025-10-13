import { useMemo } from 'react'

interface SyntaxHighlighterProps {
  code: string
  language: string
  theme: 'light' | 'dark'
  className?: string
}

// Token types for syntax highlighting
type TokenType = 
  | 'keyword' 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'null' 
  | 'comment' 
  | 'property' 
  | 'operator' 
  | 'punctuation'
  | 'variable'
  | 'function'

interface Token {
  type: TokenType
  value: string
  index: number
}

// Language-specific tokenizers
const tokenizers = {
  yaml: (code: string): Token[] => {
    const tokens: Token[] = []
    const lines = code.split('\n')
    
    lines.forEach((line, lineIndex) => {
      let currentIndex = lineIndex > 0 ? lines.slice(0, lineIndex).join('\n').length + 1 : 0
      
      // Comments
      const commentMatch = line.match(/#.*$/)
      if (commentMatch) {
        const commentIndex = currentIndex + line.indexOf(commentMatch[0])
        tokens.push({ type: 'comment', value: commentMatch[0], index: commentIndex })
        line = line.replace(commentMatch[0], '')
      }
      
      // YAML key-value pairs
      const keyValueMatch = line.match(/^(\s*)([^:\s]+)(\s*:\s*)(.*)$/)
      if (keyValueMatch) {
        const [, indent, key, separator, value] = keyValueMatch
        const keyIndex = currentIndex + indent.length
        
        tokens.push({ type: 'property', value: key, index: keyIndex })
        tokens.push({ type: 'punctuation', value: separator, index: keyIndex + key.length })
        
        if (value) {
          const valueIndex = keyIndex + key.length + separator.length
          // Check if value is a string, number, boolean, or null
          if (value.match(/^["'].*["']$/)) {
            tokens.push({ type: 'string', value: value, index: valueIndex })
          } else if (value.match(/^\d+(\.\d+)?$/)) {
            tokens.push({ type: 'number', value: value, index: valueIndex })
          } else if (value.match(/^(true|false)$/i)) {
            tokens.push({ type: 'boolean', value: value, index: valueIndex })
          } else if (value.match(/^(null|~)$/i)) {
            tokens.push({ type: 'null', value: value, index: valueIndex })
          }
        }
      }
      
      // YAML list items
      const listMatch = line.match(/^(\s*)-(\s+)(.+)$/)
      if (listMatch) {
        const [, indent] = listMatch
        const dashIndex = currentIndex + indent.length
        tokens.push({ type: 'operator', value: '-', index: dashIndex })
      }
    })
    
    return tokens
  },

  json: (code: string): Token[] => {
    const tokens: Token[] = []
    
    // JSON string literals
    const stringRegex = /"(?:[^"\\]|\\.)*"/g
    let match
    while ((match = stringRegex.exec(code)) !== null) {
      tokens.push({ type: 'string', value: match[0], index: match.index })
    }
    
    // JSON numbers
    const numberRegex = /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g
    while ((match = numberRegex.exec(code)) !== null) {
      // Make sure it's not part of a string
      const isInString = tokens.some(token => 
        token.type === 'string' && 
        match!.index >= token.index && 
        match!.index < token.index + token.value.length
      )
      if (!isInString) {
        tokens.push({ type: 'number', value: match[0], index: match.index })
      }
    }
    
    // JSON booleans and null
    const keywordRegex = /\b(true|false|null)\b/g
    while ((match = keywordRegex.exec(code)) !== null) {
      const isInString = tokens.some(token => 
        token.type === 'string' && 
        match!.index >= token.index && 
        match!.index < token.index + token.value.length
      )
      if (!isInString) {
        const type = match[0] === 'null' ? 'null' : 'boolean'
        tokens.push({ type, value: match[0], index: match.index })
      }
    }
    
    // JSON punctuation
    const punctuationRegex = /[{}[\],:]/g
    while ((match = punctuationRegex.exec(code)) !== null) {
      const isInString = tokens.some(token => 
        token.type === 'string' && 
        match!.index >= token.index && 
        match!.index < token.index + token.value.length
      )
      if (!isInString) {
        tokens.push({ type: 'punctuation', value: match[0], index: match.index })
      }
    }
    
    return tokens
  },

  hcl: (code: string): Token[] => {
    const tokens: Token[] = []
    
    // HCL comments
    const commentRegex = /(#.*$|\/\/.*$|\/\*[\s\S]*?\*\/)/gm
    let match
    while ((match = commentRegex.exec(code)) !== null) {
      tokens.push({ type: 'comment', value: match[0], index: match.index })
    }
    
    // HCL keywords
    const keywordRegex = /\b(resource|variable|output|locals|module|data|provider|terraform|backend|provisioner|connection|for_each|count|depends_on|lifecycle|dynamic)\b/g
    while ((match = keywordRegex.exec(code)) !== null) {
      const isInComment = tokens.some(token => 
        token.type === 'comment' && 
        match!.index >= token.index && 
        match!.index < token.index + token.value.length
      )
      if (!isInComment) {
        tokens.push({ type: 'keyword', value: match[0], index: match.index })
      }
    }
    
    // HCL strings
    const stringRegex = /"(?:[^"\\]|\\.)*"/g
    while ((match = stringRegex.exec(code)) !== null) {
      const isInComment = tokens.some(token => 
        token.type === 'comment' && 
        match!.index >= token.index && 
        match!.index < token.index + token.value.length
      )
      if (!isInComment) {
        tokens.push({ type: 'string', value: match[0], index: match.index })
      }
    }
    
    // HCL numbers
    const numberRegex = /\b\d+(\.\d+)?\b/g
    while ((match = numberRegex.exec(code)) !== null) {
      const isInString = tokens.some(token => 
        (token.type === 'string' || token.type === 'comment') && 
        match!.index >= token.index && 
        match!.index < token.index + token.value.length
      )
      if (!isInString) {
        tokens.push({ type: 'number', value: match[0], index: match.index })
      }
    }
    
    // HCL booleans
    const booleanRegex = /\b(true|false)\b/g
    while ((match = booleanRegex.exec(code)) !== null) {
      const isInString = tokens.some(token => 
        (token.type === 'string' || token.type === 'comment') && 
        match!.index >= token.index && 
        match!.index < token.index + token.value.length
      )
      if (!isInString) {
        tokens.push({ type: 'boolean', value: match[0], index: match.index })
      }
    }
    
    return tokens
  },

  cue: (code: string): Token[] => {
    const tokens: Token[] = []
    
    // CUE comments
    const commentRegex = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm
    let match
    while ((match = commentRegex.exec(code)) !== null) {
      tokens.push({ type: 'comment', value: match[0], index: match.index })
    }
    
    // CUE keywords
    const keywordRegex = /\b(package|import|if|for|in|let|_|_\w*)\b/g
    while ((match = keywordRegex.exec(code)) !== null) {
      const isInComment = tokens.some(token => 
        token.type === 'comment' && 
        match!.index >= token.index && 
        match!.index < token.index + token.value.length
      )
      if (!isInComment) {
        tokens.push({ type: 'keyword', value: match[0], index: match.index })
      }
    }
    
    // CUE strings
    const stringRegex = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`/g
    while ((match = stringRegex.exec(code)) !== null) {
      const isInComment = tokens.some(token => 
        token.type === 'comment' && 
        match!.index >= token.index && 
        match!.index < token.index + token.value.length
      )
      if (!isInComment) {
        tokens.push({ type: 'string', value: match[0], index: match.index })
      }
    }
    
    // CUE numbers
    const numberRegex = /\b\d+(\.\d+)?([eE][+-]?\d+)?\b/g
    while ((match = numberRegex.exec(code)) !== null) {
      const isInString = tokens.some(token => 
        (token.type === 'string' || token.type === 'comment') && 
        match!.index >= token.index && 
        match!.index < token.index + token.value.length
      )
      if (!isInString) {
        tokens.push({ type: 'number', value: match[0], index: match.index })
      }
    }
    
    // CUE booleans and null
    const keywordRegex2 = /\b(true|false|null)\b/g
    while ((match = keywordRegex2.exec(code)) !== null) {
      const isInString = tokens.some(token => 
        (token.type === 'string' || token.type === 'comment') && 
        match!.index >= token.index && 
        match!.index < token.index + token.value.length
      )
      if (!isInString) {
        const type = match[0] === 'null' ? 'null' : 'boolean'
        tokens.push({ type, value: match[0], index: match.index })
      }
    }
    
    return tokens
  }
}

// Theme colors
const themes = {
  light: {
    keyword: '#d73a49',      // Red
    string: '#032f62',       // Dark blue
    number: '#005cc5',       // Blue
    boolean: '#005cc5',      // Blue
    null: '#6f42c1',         // Purple
    comment: '#6a737d',      // Gray
    property: '#6f42c1',     // Purple
    operator: '#d73a49',     // Red
    punctuation: '#24292e',  // Dark gray
    variable: '#e36209',     // Orange
    function: '#6f42c1',     // Purple
  },
  dark: {
    keyword: '#ff7b72',      // Light red
    string: '#a5d6ff',       // Light blue
    number: '#79c0ff',       // Blue
    boolean: '#79c0ff',      // Blue
    null: '#d2a8ff',         // Light purple
    comment: '#8b949e',      // Gray
    property: '#d2a8ff',     // Light purple
    operator: '#ff7b72',     // Light red
    punctuation: '#e6edf3',  // Light gray
    variable: '#ffa657',     // Orange
    function: '#d2a8ff',     // Light purple
  }
}

export function SyntaxHighlighter({ code, language, theme, className = '' }: SyntaxHighlighterProps) {
  const highlightedCode = useMemo(() => {
    const tokenizer = tokenizers[language as keyof typeof tokenizers]
    if (!tokenizer) {
      return code // Return plain text if no tokenizer available
    }
    
    const tokens = tokenizer(code).sort((a, b) => a.index - b.index)
    const colors = themes[theme]
    
    let result = ''
    let lastIndex = 0
    
    tokens.forEach(token => {
      // Add any plain text before this token
      if (token.index > lastIndex) {
        result += code.slice(lastIndex, token.index)
      }
      
      // Add the highlighted token
      const color = colors[token.type]
      result += `<span style="color: ${color}">${escapeHtml(token.value)}</span>`
      
      lastIndex = token.index + token.value.length
    })
    
    // Add any remaining plain text
    if (lastIndex < code.length) {
      result += code.slice(lastIndex)
    }
    
    return result
  }, [code, language, theme])
  
  return (
    <div 
      className={`font-mono text-sm leading-6 whitespace-pre-wrap ${className}`}
      dangerouslySetInnerHTML={{ __html: highlightedCode }}
    />
  )
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}