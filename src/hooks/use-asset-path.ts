import { useState, useEffect } from 'react'

export function useAssetPath(assetPath: string): string | null {
  const [resolvedPath, setResolvedPath] = useState<string | null>(null)

  useEffect(() => {
    // Check if we're in development mode (Vite dev server)
    const isDev = import.meta.env.DEV
    
    if (isDev) {
      // In development, use Vite's asset serving
      setResolvedPath(`/${assetPath}`)
    } else if (window.electronAPI?.getAssetPath) {
      // In production Electron, use IPC to get the correct asset path
      window.electronAPI.getAssetPath(assetPath).then((path: string) => {
        setResolvedPath(`file://${path}`)
      }).catch(() => {
        // Fallback to regular path
        setResolvedPath(`/${assetPath}`)
      })
    } else {
      // Fallback for web mode
      setResolvedPath(`/${assetPath}`)
    }
  }, [assetPath])

  return resolvedPath
}