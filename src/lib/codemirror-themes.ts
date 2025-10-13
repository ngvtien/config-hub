// CodeMirror themes for syntax highlighting
// Based on the working implementation from the other codebase

// For now, we'll create a simple CSS-based syntax highlighter
// until we can install the proper CodeMirror packages

export interface SyntaxToken {
  type: 'keyword' | 'string' | 'number' | 'boolean' | 'null' | 'comment' | 'property' | 'operator' | 'punctuation' | 'heading' | 'bold' | 'italic' | 'code' | 'link' | 'quote'
  value: string
  start: number
  end: number
}

// Theme colors - separate for YAML and JSON to match your codebase
export const yamlThemes = {
  light: {
    background: '#ffffff',
    foreground: '#24292e',
    lineNumbers: '#6A9955', // Green line numbers like VS Code
    selection: '#c8e1ff',
    keyword: '#d73a49',      // Red keywords
    string: '#032f62',       // Dark blue strings (YAML strings)
    number: '#005cc5',       // Blue numbers
    boolean: '#6f42c1',      // Purple booleans (matching your codebase)
    null: '#6f42c1',         // Purple null
    comment: '#6a737d',      // Gray comments
    property: '#002cff',     // Blue properties (YAML keys - matching your codebase)
    operator: '#d73a49',     // Red operators (YAML list markers)
    punctuation: '#24292e',  // Dark punctuation
    heading: '#005cc5',      // Blue headings
    bold: '#24292e',         // Bold text
    italic: '#6a737d',       // Italic text
    code: '#e36209',         // Orange code
    link: '#0366d6',         // Blue links
    quote: '#6a737d',        // Gray quotes
  },
  dark: {
    background: '#1e1e1e',   // VS Code dark background
    foreground: '#d4d4d4',   // VS Code light text
    lineNumbers: '#6A9955',  // Green line numbers
    selection: '#bf920d',    // Yellow selection (matching your codebase)
    keyword: '#569cd6',      // Blue keywords
    string: '#ce9178',       // Orange strings
    number: '#B5CEA8',       // Light green numbers (matching your codebase)
    boolean: '#569CD6',      // Light blue booleans (matching your codebase)
    null: '#569CD6',         // Light blue null
    comment: '#6a9955',      // Green comments
    property: '#ce9178',     // Orange properties (YAML keys)
    operator: '#d7ba7d',     // Light operator color
    punctuation: '#d4d4d4',  // Light punctuation
    heading: '#79c0ff',      // Light blue headings
    bold: '#d4d4d4',         // Bold text
    italic: '#8b949e',       // Gray italic text
    code: '#ffa657',         // Orange code
    link: '#58a6ff',         // Light blue links
    quote: '#8b949e',        // Gray quotes
  }
}

export const jsonThemes = {
  light: {
    background: '#ffffff',
    foreground: '#24292e',
    lineNumbers: '#6A9955', // Green line numbers like VS Code
    selection: '#c8e1ff',
    keyword: '#d73a49',      // Red keywords
    string: '#032f62',       // Dark blue strings  
    number: '#005cc5',       // Blue numbers
    boolean: '#005cc5',      // Blue booleans
    null: '#6f42c1',         // Purple null
    comment: '#6a737d',      // Gray comments
    property: '#005cc5',     // Blue properties (JSON keys)
    operator: '#d73a49',     // Red operators
    punctuation: '#24292e',  // Dark punctuation
    heading: '#005cc5',      // Blue headings
    bold: '#24292e',         // Bold text
    italic: '#6a737d',       // Italic text
    code: '#e36209',         // Orange code
    link: '#0366d6',         // Blue links
    quote: '#6a737d',        // Gray quotes
  },
  dark: {
    background: '#1e1e1e',   // VS Code dark background
    foreground: '#d4d4d4',   // VS Code light text
    lineNumbers: '#6A9955',  // Green line numbers
    selection: '#bf920d',    // Yellow selection (matching your codebase)
    keyword: '#569cd6',      // Blue keywords
    string: '#ce9178',       // Orange strings
    number: '#B5CEA8',       // Light green numbers
    boolean: '#569CD6',      // Light blue booleans
    null: '#d2a8ff',         // Light purple null
    comment: '#6a9955',      // Green comments
    property: '#9cdcfe',     // Light blue properties (JSON keys)
    operator: '#d7ba7d',     // Light operator color
    punctuation: '#d4d4d4',  // Light punctuation
    heading: '#79c0ff',      // Light blue headings
    bold: '#d4d4d4',         // Bold text
    italic: '#8b949e',       // Gray italic text
    code: '#ffa657',         // Orange code
    link: '#58a6ff',         // Light blue links
    quote: '#8b949e',        // Gray quotes
  }
}

export const markdownThemes = {
  light: {
    background: '#ffffff',
    foreground: '#24292e',
    lineNumbers: '#6A9955', // Green line numbers like VS Code
    selection: '#c8e1ff',
    keyword: '#d73a49',      // Red keywords (for code blocks)
    string: '#032f62',       // Dark blue strings
    number: '#005cc5',       // Blue numbers
    boolean: '#005cc5',      // Blue booleans
    null: '#6f42c1',         // Purple null
    comment: '#6a737d',      // Gray comments
    property: '#005cc5',     // Blue properties
    operator: '#d73a49',     // Red operators
    punctuation: '#24292e',  // Dark punctuation
    heading: '#005cc5',      // Blue headings
    bold: '#24292e',         // Bold text (same as foreground but will be bold)
    italic: '#6a737d',       // Gray italic text
    code: '#e36209',         // Orange inline code
    link: '#0366d6',         // Blue links
    quote: '#6a737d',        // Gray blockquotes
  },
  dark: {
    background: '#1e1e1e',   // VS Code dark background
    foreground: '#d4d4d4',   // VS Code light text
    lineNumbers: '#6A9955',  // Green line numbers
    selection: '#bf920d',    // Yellow selection
    keyword: '#569cd6',      // Blue keywords (for code blocks)
    string: '#ce9178',       // Orange strings
    number: '#B5CEA8',       // Light green numbers
    boolean: '#569CD6',      // Light blue booleans
    null: '#d2a8ff',         // Light purple null
    comment: '#6a9955',      // Green comments
    property: '#9cdcfe',     // Light blue properties
    operator: '#d7ba7d',     // Light operator color
    punctuation: '#d4d4d4',  // Light punctuation
    heading: '#79c0ff',      // Light blue headings
    bold: '#d4d4d4',         // Bold text (same as foreground but will be bold)
    italic: '#8b949e',       // Gray italic text
    code: '#ffa657',         // Orange inline code
    link: '#58a6ff',         // Light blue links
    quote: '#8b949e',        // Gray blockquotes
  }
}

// Backward compatibility
export const themes = yamlThemes

// Simple tokenizer for YAML
export function tokenizeYaml(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = []
  const lines = code.split('\n')
  let currentIndex = 0

  lines.forEach((line, _lineIndex) => {
    const lineStart = currentIndex
    
    // Comments
    const commentMatch = line.match(/#.*$/)
    if (commentMatch) {
      const start = lineStart + line.indexOf(commentMatch[0])
      tokens.push({
        type: 'comment',
        value: commentMatch[0],
        start,
        end: start + commentMatch[0].length
      })
    }
    
    // YAML key-value pairs (before comments)
    const cleanLine = line.replace(/#.*$/, '')
    const keyValueMatch = cleanLine.match(/^(\s*)([^:\s]+)(\s*:\s*)(.*)$/)
    if (keyValueMatch) {
      const [, indent, key, separator, value] = keyValueMatch
      const keyStart = lineStart + indent.length
      
      // Add property token
      tokens.push({
        type: 'property',
        value: key,
        start: keyStart,
        end: keyStart + key.length
      })
      
      // Add punctuation token
      const sepStart = keyStart + key.length
      tokens.push({
        type: 'punctuation',
        value: separator,
        start: sepStart,
        end: sepStart + separator.length
      })
      
      if (value.trim()) {
        const valueStart = sepStart + separator.length
        const trimmedValue = value.trim()
        const valueIndex = value.indexOf(trimmedValue)
        const actualValueStart = valueStart + valueIndex
        
        // Determine value type
        if (trimmedValue.match(/^["'].*["']$/)) {
          tokens.push({
            type: 'string',
            value: trimmedValue,
            start: actualValueStart,
            end: actualValueStart + trimmedValue.length
          })
        } else if (trimmedValue.match(/^\d+(\.\d+)?$/)) {
          tokens.push({
            type: 'number',
            value: trimmedValue,
            start: actualValueStart,
            end: actualValueStart + trimmedValue.length
          })
        } else if (trimmedValue.match(/^(true|false)$/i)) {
          tokens.push({
            type: 'boolean',
            value: trimmedValue,
            start: actualValueStart,
            end: actualValueStart + trimmedValue.length
          })
        } else if (trimmedValue.match(/^(null|~)$/i)) {
          tokens.push({
            type: 'null',
            value: trimmedValue,
            start: actualValueStart,
            end: actualValueStart + trimmedValue.length
          })
        }
      }
    }
    
    // YAML list items
    const listMatch = cleanLine.match(/^(\s*)(-)(\s)/)
    if (listMatch) {
      const [, indent, dash] = listMatch
      const dashStart = lineStart + indent.length
      tokens.push({
        type: 'operator',
        value: dash,
        start: dashStart,
        end: dashStart + dash.length
      })
    }
    
    currentIndex += line.length + 1 // +1 for newline
  })
  
  return tokens
}

// Improved JSON tokenizer based on CodeMirror's approach
export function tokenizeJson(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = []
  
  // First pass: Find all strings to avoid conflicts
  const stringRegex = /"(?:[^"\\]|\\.)*"/g
  let match
  const stringRanges: Array<{start: number, end: number}> = []
  
  while ((match = stringRegex.exec(code)) !== null) {
    const range = { start: match.index, end: match.index + match[0].length }
    stringRanges.push(range)
    
    // Determine if this is a property name (followed by colon) or a value
    const afterString = code.slice(range.end).match(/^\s*:/)
    const type = afterString ? 'property' : 'string'
    
    tokens.push({
      type,
      value: match[0],
      start: range.start,
      end: range.end
    })
  }
  
  // Helper function to check if position is inside a string
  const isInString = (pos: number) => 
    stringRanges.some(range => pos >= range.start && pos < range.end)
  
  // Numbers (including scientific notation)
  const numberRegex = /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g
  while ((match = numberRegex.exec(code)) !== null) {
    if (!isInString(match.index)) {
      tokens.push({
        type: 'number',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length
      })
    }
  }
  
  // Booleans and null
  const keywordRegex = /\b(true|false|null)\b/g
  while ((match = keywordRegex.exec(code)) !== null) {
    if (!isInString(match.index)) {
      const type = match[0] === 'null' ? 'null' : 'boolean'
      tokens.push({
        type: type as any,
        value: match[0],
        start: match.index,
        end: match.index + match[0].length
      })
    }
  }
  
  // Punctuation (braces, brackets, colons, commas)
  const punctuationRegex = /[{}[\],:]/g
  while ((match = punctuationRegex.exec(code)) !== null) {
    if (!isInString(match.index)) {
      tokens.push({
        type: 'punctuation',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length
      })
    }
  }
  
  return tokens
}

// Simple tokenizers for HCL and CUE
export function tokenizeHcl(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = []
  
  // Comments
  const commentRegex = /(#.*$|\/\/.*$|\/\*[\s\S]*?\*\/)/gm
  let match
  while ((match = commentRegex.exec(code)) !== null) {
    tokens.push({
      type: 'comment',
      value: match[0],
      start: match.index,
      end: match.index + match[0].length
    })
  }
  
  // Keywords
  const keywordRegex = /\b(resource|variable|output|locals|module|data|provider|terraform|backend|provisioner|connection|for_each|count|depends_on|lifecycle|dynamic)\b/g
  while ((match = keywordRegex.exec(code)) !== null) {
    const isInComment = tokens.some(token => 
      token.type === 'comment' && 
      match!.index >= token.start && 
      match!.index < token.end
    )
    if (!isInComment) {
      tokens.push({
        type: 'keyword',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length
      })
    }
  }
  
  // Strings
  const stringRegex = /"(?:[^"\\]|\\.)*"/g
  while ((match = stringRegex.exec(code)) !== null) {
    const isInComment = tokens.some(token => 
      token.type === 'comment' && 
      match!.index >= token.start && 
      match!.index < token.end
    )
    if (!isInComment) {
      tokens.push({
        type: 'string',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length
      })
    }
  }
  
  return tokens
}

export function tokenizeCue(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = []
  
  // Comments
  const commentRegex = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm
  let match
  while ((match = commentRegex.exec(code)) !== null) {
    tokens.push({
      type: 'comment',
      value: match[0],
      start: match.index,
      end: match.index + match[0].length
    })
  }
  
  // Keywords
  const keywordRegex = /\b(package|import|if|for|in|let|_|_\w*)\b/g
  while ((match = keywordRegex.exec(code)) !== null) {
    const isInComment = tokens.some(token => 
      token.type === 'comment' && 
      match!.index >= token.start && 
      match!.index < token.end
    )
    if (!isInComment) {
      tokens.push({
        type: 'keyword',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length
      })
    }
  }
  
  // Strings
  const stringRegex = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`/g
  while ((match = stringRegex.exec(code)) !== null) {
    const isInComment = tokens.some(token => 
      token.type === 'comment' && 
      match!.index >= token.start && 
      match!.index < token.end
    )
    if (!isInComment) {
      tokens.push({
        type: 'string',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length
      })
    }
  }
  
  return tokens
}

// Markdown tokenizer
export function tokenizeMarkdown(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = []
  const lines = code.split('\n')
  let currentIndex = 0

  lines.forEach((line, _lineIndex) => {
    const lineStart = currentIndex
    
    // Headings (# ## ### etc.)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      const [, hashes, content] = headingMatch
      tokens.push({
        type: 'heading',
        value: hashes,
        start: lineStart,
        end: lineStart + hashes.length
      })
      tokens.push({
        type: 'heading',
        value: ` ${content}`,
        start: lineStart + hashes.length,
        end: lineStart + line.length
      })
    } else {
      // Process inline markdown in regular lines
      
      // Code blocks (``` or ```)
      const codeBlockMatch = line.match(/^(\s*```\w*.*$)/)
      if (codeBlockMatch) {
        tokens.push({
          type: 'code',
          value: codeBlockMatch[1],
          start: lineStart,
          end: lineStart + line.length
        })
      } else {
        // Inline code (`code`)
        const inlineCodeRegex = /(`[^`]+`)/g
        let match
        while ((match = inlineCodeRegex.exec(line)) !== null) {
          tokens.push({
            type: 'code',
            value: match[0],
            start: lineStart + match.index,
            end: lineStart + match.index + match[0].length
          })
        }
        
        // Bold text (**text** or __text__)
        const boldRegex = /(\*\*[^*]+\*\*|__[^_]+__)/g
        while ((match = boldRegex.exec(line)) !== null) {
          // Check if it's not inside inline code
          const isInCode = tokens.some(token => 
            token.type === 'code' && 
            lineStart + match!.index >= token.start && 
            lineStart + match!.index < token.end
          )
          if (!isInCode) {
            tokens.push({
              type: 'bold',
              value: match[0],
              start: lineStart + match.index,
              end: lineStart + match.index + match[0].length
            })
          }
        }
        
        // Italic text (*text* or _text_)
        const italicRegex = /(\*[^*]+\*|_[^_]+_)/g
        while ((match = italicRegex.exec(line)) !== null) {
          // Check if it's not inside inline code or bold
          const isInOtherToken = tokens.some(token => 
            (token.type === 'code' || token.type === 'bold') && 
            lineStart + match!.index >= token.start && 
            lineStart + match!.index < token.end
          )
          if (!isInOtherToken) {
            tokens.push({
              type: 'italic',
              value: match[0],
              start: lineStart + match.index,
              end: lineStart + match.index + match[0].length
            })
          }
        }
        
        // Links [text](url) or [text][ref]
        const linkRegex = /(\[[^\]]+\]\([^)]+\)|\[[^\]]+\]\[[^\]]*\])/g
        while ((match = linkRegex.exec(line)) !== null) {
          const isInOtherToken = tokens.some(token => 
            (token.type === 'code' || token.type === 'bold' || token.type === 'italic') && 
            lineStart + match!.index >= token.start && 
            lineStart + match!.index < token.end
          )
          if (!isInOtherToken) {
            tokens.push({
              type: 'link',
              value: match[0],
              start: lineStart + match.index,
              end: lineStart + match.index + match[0].length
            })
          }
        }
        
        // Blockquotes (> text)
        const quoteMatch = line.match(/^(\s*>\s*.*)$/)
        if (quoteMatch) {
          tokens.push({
            type: 'quote',
            value: quoteMatch[1],
            start: lineStart,
            end: lineStart + line.length
          })
        }
        
        // List items (- * + or 1. 2. etc.)
        const listMatch = line.match(/^(\s*[-*+]|\s*\d+\.)\s/)
        if (listMatch) {
          tokens.push({
            type: 'operator',
            value: listMatch[0],
            start: lineStart,
            end: lineStart + listMatch[0].length
          })
        }
      }
    }
    
    currentIndex += line.length + 1 // +1 for newline
  })
  
  return tokens
}

// Apply syntax highlighting to code
export function applySyntaxHighlighting(code: string, language: string, theme: 'light' | 'dark'): string {
  // Choose the right color scheme based on language
  let colors
  if (language === 'json') {
    colors = jsonThemes[theme]
  } else if (language === 'markdown' || language === 'md') {
    colors = markdownThemes[theme]
  } else {
    colors = yamlThemes[theme] // Default to YAML colors for YAML, HCL, CUE
  }
  
  let tokens: SyntaxToken[] = []
  
  switch (language) {
    case 'yaml':
    case 'yml':
      tokens = tokenizeYaml(code)
      break
    case 'json':
      tokens = tokenizeJson(code)
      break
    case 'hcl':
      tokens = tokenizeHcl(code)
      break
    case 'cue':
      tokens = tokenizeCue(code)
      break
    case 'markdown':
    case 'md':
      tokens = tokenizeMarkdown(code)
      break
    default:
      return escapeHtml(code) // Return plain text for unsupported languages
  }
  
  // Sort tokens by start position
  tokens.sort((a, b) => a.start - b.start)
  
  let result = ''
  let lastIndex = 0
  
  tokens.forEach(token => {
    // Add any plain text before this token
    if (token.start > lastIndex) {
      result += escapeHtml(code.slice(lastIndex, token.start))
    }
    
    // Add the highlighted token
    const color = colors[token.type]
    let style = ''
    let weight = ''
    
    // Apply appropriate styling based on token type
    if (token.type === 'comment' || token.type === 'italic') {
      style = 'font-style: italic;'
    }
    if (['keyword', 'property', 'boolean', 'operator', 'bold', 'heading'].includes(token.type)) {
      weight = 'font-weight: 600;'
    }
    if (token.type === 'link') {
      style += 'text-decoration: underline;'
    }
    
    result += `<span style="color: ${color}; ${style} ${weight}">${escapeHtml(token.value)}</span>`
    
    lastIndex = token.end
  })
  
  // Add any remaining plain text
  if (lastIndex < code.length) {
    result += escapeHtml(code.slice(lastIndex))
  }
  
  return result
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// TODO: When CodeMirror packages are installed, replace with:
// export { yamlDarkTheme, yamlLightTheme, getYamlExtensions } from './codemirror-extensions'