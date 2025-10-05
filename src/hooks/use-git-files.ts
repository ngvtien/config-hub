import { useState, useEffect, useCallback } from 'react'

export interface GitFile {
  path: string
  name: string
  type: 'file' | 'directory'
  size?: number
  lastModified?: string
  author?: string
  extension?: string
}

export interface UseGitFilesOptions {
  autoFetch?: boolean
  filterExtensions?: string[] // e.g., ['.yaml', '.yml', '.json']
}

export function useGitFiles(
  credentialId: string | null,
  path: string,
  branch: string,
  options: UseGitFilesOptions = {}
) {
  const [files, setFiles] = useState<GitFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch files from repository
  const fetchFiles = useCallback(async () => {
    if (!credentialId) {
      setFiles([])
      return []
    }

    try {
      setLoading(true)
      setError(null)

      const result = await window.electronAPI.git.listFiles(credentialId, path, branch)

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch files')
      }

      let fetchedFiles: GitFile[] = result.data || []

      // Filter by extensions if specified
      if (options.filterExtensions && options.filterExtensions.length > 0) {
        fetchedFiles = fetchedFiles.filter((file) => {
          if (file.type === 'directory') return false
          const ext = file.extension || getFileExtension(file.name)
          return options.filterExtensions!.some((allowed) => ext === allowed)
        })
      }

      setFiles(fetchedFiles)
      return fetchedFiles
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch files'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [credentialId, path, branch, options.filterExtensions])

  // Get file content
  const getFileContent = useCallback(
    async (filePath: string): Promise<string | null> => {
      if (!credentialId) {
        throw new Error('No credentials available')
      }

      try {
        const result = await window.electronAPI.git.getFileContent(credentialId, filePath, branch)

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch file content')
        }

        return result.data || null
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch file content'
        setError(errorMessage)
        throw err
      }
    },
    [credentialId, branch]
  )

  // Refresh files
  const refresh = useCallback(() => {
    return fetchFiles()
  }, [fetchFiles])

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (options.autoFetch !== false && credentialId) {
      fetchFiles()
    }
  }, [fetchFiles, options.autoFetch, credentialId])

  return {
    files,
    loading,
    error,
    fetchFiles,
    getFileContent,
    refresh,
  }
}

// Helper function to get file extension
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) return ''
  return filename.substring(lastDot)
}
