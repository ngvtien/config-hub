import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'
import { DiffEditor } from '@monaco-editor/react'

interface FileDiff {
  path: string
  diff: string
}

interface MonacoPRDiffProps {
  fileDiffs: FileDiff[]
  theme?: 'light' | 'dark'
}

// Calculate diff statistics
function calculateDiffStats(original: string, modified: string) {
  const originalLines = original.split('\n')
  const modifiedLines = modified.split('\n')
  
  let additions = 0
  let deletions = 0
  let changes = 0
  
  const maxLength = Math.max(originalLines.length, modifiedLines.length)
  
  for (let i = 0; i < maxLength; i++) {
    const origLine = originalLines[i] || ''
    const modLine = modifiedLines[i] || ''
    
    if (i >= originalLines.length) {
      additions++
    } else if (i >= modifiedLines.length) {
      deletions++
    } else if (origLine !== modLine) {
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

export function MonacoPRDiff({ fileDiffs, theme = 'light' }: MonacoPRDiffProps) {
  // Parse unified diff content
  const parseHunksOnly = (diff: string) => {
    console.log('Parsing diff hunks for:', diff.substring(0, 200) + '...')
    
    if (!diff || diff.trim() === '') {
      return { oldContent: 'No changes', newContent: 'No changes' }
    }
    
    const lines = diff.split('\n')
    const changeLines: string[] = []
    
    let inHunk = false
    
    for (const line of lines) {
      // Skip diff headers
      if (line.startsWith('diff --git') || 
          line.startsWith('index ') || 
          line.startsWith('---') || 
          line.startsWith('+++')) {
        continue
      }
      
      // Hunk header (@@)
      if (line.startsWith('@@')) {
        inHunk = true
        if (changeLines.length > 0) {
          changeLines.push('') // Add separator between hunks
        }
        changeLines.push(line) // Include hunk header for context
        continue
      }
      
      if (!inHunk) continue
      
      // Include all hunk content with prefixes for clarity
      if (line.startsWith('-') || line.startsWith('+') || line.startsWith(' ')) {
        changeLines.push(line)
      }
    }
    
    const changesText = changeLines.join('\n')
    
    // For now, show the raw diff
    return { 
      oldContent: changesText || 'No changes found',
      newContent: changesText || 'No changes found'
    }
  }

  // Get file language from extension
  const getFileLanguage = (filename: string): string => {
    const lower = filename.toLowerCase()
    if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'yaml'
    if (lower.endsWith('.json')) return 'json'
    if (lower.endsWith('.tf') || lower.endsWith('.hcl') || lower.endsWith('.tfvars')) return 'hcl'
    if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown'
    if (lower.endsWith('.js')) return 'javascript'
    if (lower.endsWith('.ts')) return 'typescript'
    if (lower.endsWith('.sh')) return 'shell'
    return 'plaintext'
  }

  if (fileDiffs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No file changes found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {fileDiffs.map((file, idx) => {
        const { oldContent, newContent } = parseHunksOnly(file.diff)
        const language = getFileLanguage(file.path)
        const stats = calculateDiffStats(oldContent, newContent)
        
        // Debug logging
        console.log(`File ${file.path}:`, {
          diffLength: file.diff.length,
          rawDiff: file.diff,
          oldContentLength: oldContent.length,
          newContentLength: newContent.length,
          stats
        })
        
        return (
          <div key={`${file.path}-${idx}`} className="border border-border rounded-md overflow-hidden">
            {/* File Header */}
            <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-sm font-medium text-foreground">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{file.path}</span>
                <Badge variant="outline" className="text-xs">
                  {language.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {stats.additions > 0 && (
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-950 border-green-600 text-green-600">
                    +{stats.additions}
                  </Badge>
                )}
                {stats.deletions > 0 && (
                  <Badge variant="outline" className="bg-red-50 dark:bg-red-950 border-red-600 text-red-600">
                    -{stats.deletions}
                  </Badge>
                )}
                {stats.changes > 0 && (
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 border-blue-600 text-blue-600">
                    ~{stats.changes}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Monaco Diff Viewer */}
            <div className="h-96">
              <DiffEditor
                key={`${file.path}-${idx}-${oldContent.length}-${newContent.length}`}
                height="100%"
                language={language}
                original={oldContent}
                modified={newContent}
                theme={theme === 'dark' ? 'vs-dark' : 'vs'}
                options={{
                  readOnly: true,
                  renderSideBySide: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
                  fontLigatures: true,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  renderWhitespace: 'selection',
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible',
                    useShadows: false,
                    verticalScrollbarSize: 14,
                    horizontalScrollbarSize: 14,
                  },
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
