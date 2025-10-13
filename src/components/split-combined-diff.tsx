import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'
import { CodeMirrorDiffViewer } from './codemirror-diff-viewer'

interface FileDiff {
  path: string
  diff: string
}

interface SplitCombinedDiffProps {
  fileDiffs: FileDiff[]
  theme?: 'light' | 'dark'
}

// Helper to detect language from file path
const getLanguageFromPath = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'yaml':
    case 'yml':
      return 'yaml'
    case 'json':
      return 'json'
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return 'javascript'
    case 'md':
    case 'markdown':
      return 'markdown'
    case 'tf':
    case 'hcl':
      return 'hcl'
    default:
      return 'text'
  }
}

export function SplitCombinedDiff({ fileDiffs, theme = 'light' }: SplitCombinedDiffProps) {
  console.log('SplitCombinedDiff - Attempting to fix backend bug by splitting combined diff')
  
  // Split a combined diff into separate file diffs
  const splitCombinedDiff = (combinedDiff: string) => {
    const sections: Array<{path: string, diff: string}> = []
    const lines = combinedDiff.split('\n')
    
    let currentPath = ''
    let currentDiffLines: string[] = []
    
    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        // Save previous section
        if (currentPath && currentDiffLines.length > 0) {
          sections.push({
            path: currentPath,
            diff: currentDiffLines.join('\n')
          })
        }
        
        // Start new section
        const match = line.match(/diff --git a\/(.+) b\/(.+)/)
        if (match) {
          currentPath = match[2] // Use the "after" path
          currentDiffLines = [line]
        }
      } else if (currentPath) {
        currentDiffLines.push(line)
      }
    }
    
    // Don't forget the last section
    if (currentPath && currentDiffLines.length > 0) {
      sections.push({
        path: currentPath,
        diff: currentDiffLines.join('\n')
      })
    }
    
    return sections
  }

  // Check if we have a combined diff (first file contains multiple "diff --git" headers)
  const firstFile = fileDiffs[0]
  const hasCombinedDiff = firstFile && firstFile.diff.split('diff --git').length > 2
  
  let actualFileDiffs: Array<{path: string, diff: string}>
  
  if (hasCombinedDiff) {
    console.log('🔧 DETECTED COMBINED DIFF - Splitting it...')
    actualFileDiffs = splitCombinedDiff(firstFile.diff)
    console.log('Split into sections:', actualFileDiffs.map(f => f.path))
  } else {
    console.log('Using original file diffs as-is')
    actualFileDiffs = fileDiffs
  }

  // Parse diff the working way
  const parseWorkingWay = (diff: string) => {
    const lines = diff.split('\n')
    let oldContent = ''
    let newContent = ''
    
    for (const line of lines) {
      if (line.startsWith('---') || line.startsWith('+++') || 
          line.startsWith('@@') || line.startsWith('diff') ||
          line.startsWith('index ')) {
        continue // Skip diff headers
      }
      
      if (line.startsWith('-')) {
        oldContent += line.substring(1) + '\n'
      } else if (line.startsWith('+')) {
        newContent += line.substring(1) + '\n'
      } else if (line.startsWith(' ')) {
        // Context line
        oldContent += line.substring(1) + '\n'
        newContent += line.substring(1) + '\n'
      }
    }
    
    return { oldContent: oldContent.trim(), newContent: newContent.trim() }
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded border border-blue-200">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
          🔧 WORKAROUND: Splitting Combined Diff
        </h3>
        <div className="text-sm space-y-1">
          <div><strong>Original Files:</strong> {fileDiffs.length}</div>
          <div><strong>After Split:</strong> {actualFileDiffs.length}</div>
          <div><strong>Combined Diff Detected:</strong> {hasCombinedDiff ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {actualFileDiffs.map((file, idx) => {
        const { oldContent, newContent } = parseWorkingWay(file.diff)
        
        console.log(`SPLIT FILE ${idx}: ${file.path}`)
        console.log(`Content lengths - Old: ${oldContent.length}, New: ${newContent.length}`)
        
        return (
          <div key={`split-${file.path}-${idx}`} className="border border-border rounded-md overflow-hidden">
            <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm font-medium">{file.path}</span>
              <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950">
                SPLIT #{idx}
              </Badge>
            </div>
            
            <div className="diff-viewer-wrapper">
              <CodeMirrorDiffViewer
                originalContent={oldContent}
                modifiedContent={newContent}
                language={getLanguageFromPath(file.path)}
                theme={theme}
                key={`split-${file.path}-${idx}`}
                orientation="horizontal"
                readOnly={true}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}