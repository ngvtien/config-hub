import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'

interface FileDiff {
  path: string
  diff: string
}

interface UnifiedDiffViewerProps {
  fileDiffs: FileDiff[]
  theme?: 'light' | 'dark'
}

export function UnifiedDiffViewer({ fileDiffs, theme = 'light' }: UnifiedDiffViewerProps) {
  // Debug: Log the raw data we're receiving
  console.log('UnifiedDiffViewer received fileDiffs:', fileDiffs.map(f => ({
    path: f.path,
    diffLength: f.diff.length,
    diffPreview: f.diff.substring(0, 200) + '...'
  })))
  // Parse and display unified diff properly
  const parseDiffLines = (diff: string) => {
    const lines = diff.split('\n')
    const parsedLines: Array<{
      type: 'header' | 'hunk' | 'add' | 'remove' | 'context'
      content: string
      lineNumber?: { old?: number; new?: number }
    }> = []
    
    let oldLineNum = 0
    let newLineNum = 0
    let inHunk = false
    
    for (const line of lines) {
      if (line.startsWith('diff --git') || line.startsWith('index ')) {
        parsedLines.push({ type: 'header', content: line })
      } else if (line.startsWith('---') || line.startsWith('+++')) {
        parsedLines.push({ type: 'header', content: line })
      } else if (line.startsWith('@@')) {
        // Parse hunk header
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/)
        if (match) {
          oldLineNum = parseInt(match[1])
          newLineNum = parseInt(match[2])
        }
        parsedLines.push({ type: 'hunk', content: line })
        inHunk = true
      } else if (inHunk) {
        if (line.startsWith('-')) {
          parsedLines.push({
            type: 'remove',
            content: line.substring(1),
            lineNumber: { old: oldLineNum }
          })
          oldLineNum++
        } else if (line.startsWith('+')) {
          parsedLines.push({
            type: 'add',
            content: line.substring(1),
            lineNumber: { new: newLineNum }
          })
          newLineNum++
        } else if (line.startsWith(' ')) {
          parsedLines.push({
            type: 'context',
            content: line.substring(1),
            lineNumber: { old: oldLineNum, new: newLineNum }
          })
          oldLineNum++
          newLineNum++
        }
      }
    }
    
    return parsedLines
  }

  // Get file language from extension
  const getFileLanguage = (filename: string): string => {
    const lower = filename.toLowerCase()
    if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'yaml'
    if (lower.endsWith('.json')) return 'json'
    if (lower.endsWith('.tf') || lower.endsWith('.hcl')) return 'hcl'
    if (lower.endsWith('.md')) return 'markdown'
    if (lower.endsWith('.js') || lower.endsWith('.ts')) return 'javascript'
    return 'text'
  }

  // Calculate stats
  const calculateStats = (parsedLines: ReturnType<typeof parseDiffLines>) => {
    const additions = parsedLines.filter(l => l.type === 'add').length
    const deletions = parsedLines.filter(l => l.type === 'remove').length
    return { additions, deletions, changes: additions + deletions }
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
        const parsedLines = parseDiffLines(file.diff)
        const language = getFileLanguage(file.path)
        const stats = calculateStats(parsedLines)
        
        console.log(`File ${file.path} parsed:`, {
          totalLines: parsedLines.length,
          stats,
          sampleLines: parsedLines.slice(0, 5)
        })
        
        // Log this specific file's data
        console.log(`Rendering file ${idx}: ${file.path}`, {
          diffLength: file.diff.length,
          diffContent: file.diff
        })
        
        return (
          <div key={`file-${file.path}-${idx}-${Date.now()}`} className="border border-border rounded-md overflow-hidden">
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
              </div>
            </div>
            
            {/* Unified Diff Display */}
            <div className="max-h-96 overflow-auto">
              <div className="font-mono text-sm">
                {parsedLines.map((line, lineIdx) => {
                  let bgColor = ''
                  let textColor = ''
                  let borderLeft = ''
                  
                  switch (line.type) {
                    case 'header':
                      bgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                      textColor = 'text-muted-foreground'
                      break
                    case 'hunk':
                      bgColor = theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
                      textColor = theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                      break
                    case 'add':
                      bgColor = theme === 'dark' ? 'bg-green-900/30' : 'bg-green-50'
                      textColor = theme === 'dark' ? 'text-green-300' : 'text-green-700'
                      borderLeft = 'border-l-2 border-green-500'
                      break
                    case 'remove':
                      bgColor = theme === 'dark' ? 'bg-red-900/30' : 'bg-red-50'
                      textColor = theme === 'dark' ? 'text-red-300' : 'text-red-700'
                      borderLeft = 'border-l-2 border-red-500'
                      break
                    case 'context':
                      bgColor = ''
                      textColor = ''
                      break
                  }
                  
                  return (
                    <div
                      key={`${file.path}-line-${lineIdx}`}
                      className={`px-4 py-1 ${bgColor} ${textColor} ${borderLeft} flex`}
                    >
                      <div className="w-16 text-xs text-muted-foreground mr-4 flex-shrink-0">
                        {line.lineNumber?.old && (
                          <span className="inline-block w-6 text-right mr-1">
                            {line.lineNumber.old}
                          </span>
                        )}
                        {line.lineNumber?.new && (
                          <span className="inline-block w-6 text-right">
                            {line.lineNumber.new}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 whitespace-pre-wrap break-all">
                        {line.type === 'add' && <span className="text-green-600 mr-1">+</span>}
                        {line.type === 'remove' && <span className="text-red-600 mr-1">-</span>}
                        {line.type === 'context' && <span className="text-muted-foreground mr-1"> </span>}
                        {line.content}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}