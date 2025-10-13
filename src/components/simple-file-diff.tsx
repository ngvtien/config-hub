import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'

interface FileDiff {
  path: string
  diff: string
}

interface SimpleFileDiffProps {
  file: FileDiff
  index: number
  theme?: 'light' | 'dark'
}

export function SimpleFileDiff({ file, index, theme = 'light' }: SimpleFileDiffProps) {
  console.log(`Rendering file ${index}: ${file.path}`)
  console.log(`Diff content:`, file.diff.substring(0, 300) + '...')
  
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

  // Simple diff line parsing - just show the raw diff with basic styling
  const renderDiffLines = (diff: string) => {
    const lines = diff.split('\n')
    
    return lines.map((line, lineIdx) => {
      let bgColor = ''
      let textColor = ''
      let borderLeft = ''
      let prefix = ''
      
      if (line.startsWith('diff --git') || line.startsWith('index ') || 
          line.startsWith('---') || line.startsWith('+++')) {
        bgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
        textColor = 'text-muted-foreground'
      } else if (line.startsWith('@@')) {
        bgColor = theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
        textColor = theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
      } else if (line.startsWith('+')) {
        bgColor = theme === 'dark' ? 'bg-green-900/30' : 'bg-green-50'
        textColor = theme === 'dark' ? 'text-green-300' : 'text-green-700'
        borderLeft = 'border-l-2 border-green-500'
        prefix = '+'
      } else if (line.startsWith('-')) {
        bgColor = theme === 'dark' ? 'bg-red-900/30' : 'bg-red-50'
        textColor = theme === 'dark' ? 'text-red-300' : 'text-red-700'
        borderLeft = 'border-l-2 border-red-500'
        prefix = '-'
      } else if (line.startsWith(' ')) {
        prefix = ' '
      }
      
      return (
        <div
          key={`${file.path}-line-${lineIdx}`}
          className={`px-4 py-1 ${bgColor} ${textColor} ${borderLeft} font-mono text-sm`}
        >
          <span className="text-muted-foreground mr-2">{prefix}</span>
          <span className="whitespace-pre-wrap break-all">
            {line.startsWith('+') || line.startsWith('-') || line.startsWith(' ') 
              ? line.substring(1) 
              : line
            }
          </span>
        </div>
      )
    })
  }

  // Calculate simple stats
  const lines = file.diff.split('\n')
  const additions = lines.filter(l => l.startsWith('+')).length
  const deletions = lines.filter(l => l.startsWith('-')).length
  
  const language = getFileLanguage(file.path)

  return (
    <div className="border border-border rounded-md overflow-hidden mb-4">
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
          {additions > 0 && (
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950 border-green-600 text-green-600">
              +{additions}
            </Badge>
          )}
          {deletions > 0 && (
            <Badge variant="outline" className="bg-red-50 dark:bg-red-950 border-red-600 text-red-600">
              -{deletions}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Simple Diff Display */}
      <div className="max-h-96 overflow-auto">
        {renderDiffLines(file.diff)}
      </div>
    </div>
  )
}

// Simple container that just loops through files
interface SimpleMultiFileDiffProps {
  fileDiffs: FileDiff[]
  theme?: 'light' | 'dark'
}

export function SimpleMultiFileDiff({ fileDiffs, theme = 'light' }: SimpleMultiFileDiffProps) {
  console.log('SimpleMultiFileDiff received files:', fileDiffs.map(f => f.path))
  
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
      {fileDiffs.map((file, index) => (
        <SimpleFileDiff
          key={`simple-${file.path}-${index}-${Date.now()}`}
          file={file}
          index={index}
          theme={theme}
        />
      ))}
    </div>
  )
}