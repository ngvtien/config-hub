import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'
import { CodeMirrorDiffViewer } from './codemirror-diff-viewer'

interface FileDiff {
  path: string
  diff: string
}

interface DebugFirstFileOnlyProps {
  fileDiffs: FileDiff[]
  theme?: 'light' | 'dark'
}

export function DebugFirstFileOnly({ fileDiffs, theme = 'light' }: DebugFirstFileOnlyProps) {
  console.log('=== DEBUG: FIRST FILE ONLY ===')
  console.log('Total files received:', fileDiffs.length)
  
  if (fileDiffs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No file changes found</p>
      </div>
    )
  }

  // ONLY show the first file
  const firstFile = fileDiffs[0]
  
  console.log('=== FIRST FILE DETAILS ===')
  console.log('Path:', firstFile.path)
  console.log('Diff length:', firstFile.diff.length)
  console.log('Full diff content:')
  console.log(firstFile.diff)
  console.log('=== END FIRST FILE ===')

  // Parse the diff to extract old and new content
  const parseDiffToSideBySide = (diff: string) => {
    const lines = diff.split('\n')
    const oldLines: string[] = []
    const newLines: string[] = []
    
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
        continue
      }
      
      if (!inHunk) continue
      
      // Parse hunk content
      if (line.startsWith('-')) {
        // Removed line - only in old content
        oldLines.push(line.substring(1))
      } else if (line.startsWith('+')) {
        // Added line - only in new content  
        newLines.push(line.substring(1))
      } else if (line.startsWith(' ')) {
        // Context line - in both old and new content
        const contextLine = line.substring(1)
        oldLines.push(contextLine)
        newLines.push(contextLine)
      }
    }
    
    return { 
      oldContent: oldLines.join('\n'), 
      newContent: newLines.join('\n') 
    }
  }

  const { oldContent, newContent } = parseDiffToSideBySide(firstFile.diff)
  
  // Get file language
  const getFileLanguage = (filename: string): string => {
    const lower = filename.toLowerCase()
    if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'yaml'
    if (lower.endsWith('.json')) return 'json'
    return 'text'
  }

  const language = getFileLanguage(firstFile.path)
  
  console.log('Parsed old content:', oldContent)
  console.log('Parsed new content:', newContent)

  return (
    <div className="space-y-4">
      {/* Debug Info */}
      <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded border border-red-200">
        <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
          🔍 DEBUG MODE: Showing ONLY First File
        </h3>
        <div className="text-sm space-y-1">
          <div><strong>Total Files Available:</strong> {fileDiffs.length}</div>
          <div><strong>Showing File:</strong> {firstFile.path}</div>
          <div><strong>Raw Diff Length:</strong> {firstFile.diff.length} characters</div>
          <div><strong>Parsed Old Content Length:</strong> {oldContent.length} characters</div>
          <div><strong>Parsed New Content Length:</strong> {newContent.length} characters</div>
        </div>
        
        {fileDiffs.length > 1 && (
          <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded text-sm">
            <strong>Note:</strong> There are {fileDiffs.length - 1} other files being ignored for debugging.
            <div className="mt-1">
              Other files: {fileDiffs.slice(1).map(f => f.path).join(', ')}
            </div>
          </div>
        )}
      </div>

      {/* Single File Display */}
      <div className="border border-border rounded-md overflow-hidden">
        {/* File Header */}
        <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-sm font-medium text-foreground">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>{firstFile.path}</span>
            <Badge variant="outline" className="text-xs">
              {language.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs bg-red-50 dark:bg-red-950">
              FIRST FILE ONLY
            </Badge>
          </div>
        </div>
        
        {/* Raw Diff Preview */}
        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 border-b text-xs font-mono">
          <div className="text-muted-foreground mb-1">Raw Diff Content (first 300 chars):</div>
          <div className="bg-white dark:bg-black p-2 rounded border overflow-x-auto">
            {firstFile.diff.substring(0, 300)}...
          </div>
        </div>
        
        {/* Side-by-Side Diff */}
        <div className="h-96">
          <CodeMirrorDiffViewer
            key={`debug-first-${firstFile.path}-${Date.now()}`}
            originalContent={oldContent}
            modifiedContent={newContent}
            language={language}
            theme={theme}
            className="h-full"
            orientation="horizontal"
            readOnly={true}
          />
        </div>
      </div>
    </div>
  )
}