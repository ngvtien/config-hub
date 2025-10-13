import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'

interface FileDiff {
  path: string
  diff: string
}

interface ReactDiffFallbackProps {
  fileDiffs: FileDiff[]
  theme?: 'light' | 'dark'
}

export function ReactDiffFallback({ fileDiffs, theme = 'light' }: ReactDiffFallbackProps) {
  console.log('ReactDiffFallback - Using OLD react-diff-viewer that worked before')
  
  // Parse diff the OLD way that worked
  const parseOldWay = (diff: string) => {
    const lines = diff.split('\n')
    let oldContent = ''
    let newContent = ''
    
    for (const line of lines) {
      if (line.startsWith('---') || line.startsWith('+++') || 
          line.startsWith('@@') || line.startsWith('diff')) {
        continue // Skip diff headers
      }
      
      if (line.startsWith('-')) {
        oldContent += line.substring(1) + '\n'
      } else if (line.startsWith('+')) {
        newContent += line.substring(1) + '\n'
      } else {
        // Context line (no prefix)
        oldContent += line + '\n'
        newContent += line + '\n'
      }
    }
    
    return { oldContent: oldContent.trim(), newContent: newContent.trim() }
  }

  if (fileDiffs.length === 0) {
    return <div>No files</div>
  }

  return (
    <div className="space-y-4">
      <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded border border-green-200">
        <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
          ✅ FALLBACK: Using OLD react-diff-viewer (that worked before)
        </h3>
        <div className="text-sm">
          This should work correctly if the API data is fine.
        </div>
      </div>

      {fileDiffs.map((file, idx) => {
        const { oldContent, newContent } = parseOldWay(file.diff)
        
        console.log(`OLD WAY - File ${idx}: ${file.path}`)
        console.log(`OLD WAY - Old content:`, oldContent.substring(0, 100))
        console.log(`OLD WAY - New content:`, newContent.substring(0, 100))
        
        return (
          <div key={idx} className="border border-border rounded-md overflow-hidden">
            <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm font-medium">{file.path}</span>
              <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950">
                OLD METHOD
              </Badge>
            </div>
            
            <div className="diff-viewer-wrapper">
              <ReactDiffViewer
                oldValue={oldContent}
                newValue={newContent}
                splitView={true}
                compareMethod={DiffMethod.WORDS}
                useDarkTheme={theme === 'dark'}
                leftTitle="Before"
                rightTitle="After"
                showDiffOnly={false}
                hideLineNumbers={false}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}