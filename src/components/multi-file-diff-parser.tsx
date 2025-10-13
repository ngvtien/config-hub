// Utility to parse a combined Git diff into separate file diffs
export interface ParsedFileDiff {
  path: string
  oldPath?: string
  newPath?: string
  diff: string
  isNew: boolean
  isDeleted: boolean
  isRenamed: boolean
}

export function parseMultiFileDiff(combinedDiff: string): ParsedFileDiff[] {
  console.log('Parsing combined diff:', combinedDiff.substring(0, 500) + '...')
  
  const files: ParsedFileDiff[] = []
  const lines = combinedDiff.split('\n')
  
  let currentFile: ParsedFileDiff | null = null
  let currentDiffLines: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // New file starts with "diff --git"
    if (line.startsWith('diff --git')) {
      // Save previous file if exists
      if (currentFile) {
        currentFile.diff = currentDiffLines.join('\n')
        files.push(currentFile)
        console.log(`Parsed file: ${currentFile.path}, diff length: ${currentFile.diff.length}`)
      }
      
      // Parse the file paths from "diff --git a/path b/path"
      const match = line.match(/^diff --git a\/(.+) b\/(.+)$/)
      if (match) {
        const oldPath = match[1]
        const newPath = match[2]
        
        currentFile = {
          path: newPath,
          oldPath: oldPath,
          newPath: newPath,
          diff: '',
          isNew: false,
          isDeleted: false,
          isRenamed: oldPath !== newPath
        }
        
        currentDiffLines = [line] // Start with the diff header
      }
    }
    // Handle file mode/index lines
    else if (line.startsWith('new file mode') && currentFile) {
      currentFile.isNew = true
      currentDiffLines.push(line)
    }
    else if (line.startsWith('deleted file mode') && currentFile) {
      currentFile.isDeleted = true
      currentDiffLines.push(line)
    }
    // Handle index line
    else if (line.startsWith('index ') && currentFile) {
      currentDiffLines.push(line)
    }
    // Handle file path lines (--- and +++)
    else if ((line.startsWith('---') || line.startsWith('+++')) && currentFile) {
      currentDiffLines.push(line)
    }
    // Handle hunk headers and content
    else if (currentFile && (line.startsWith('@@') || line.startsWith('-') || line.startsWith('+') || line.startsWith(' ') || line === '')) {
      currentDiffLines.push(line)
    }
    // Handle "\ No newline at end of file"
    else if (line.startsWith('\\') && currentFile) {
      currentDiffLines.push(line)
    }
  }
  
  // Don't forget the last file
  if (currentFile) {
    currentFile.diff = currentDiffLines.join('\n')
    files.push(currentFile)
    console.log(`Parsed final file: ${currentFile.path}, diff length: ${currentFile.diff.length}`)
  }
  
  console.log(`Total files parsed: ${files.length}`)
  return files
}

// Convert ParsedFileDiff to the format expected by our components
export function convertToFileDiffs(parsedFiles: ParsedFileDiff[]): Array<{path: string, diff: string}> {
  return parsedFiles.map(file => ({
    path: file.path,
    diff: file.diff
  }))
}