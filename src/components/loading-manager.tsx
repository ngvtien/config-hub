import { useEffect } from 'react'

export function LoadingManager() {
  useEffect(() => {
    // Listen for the remove loading message from main process
    const handleRemoveLoading = () => {
      // Send message to preload to remove loading screen
      window.postMessage({ payload: 'removeLoading' }, '*')
    }

    // Remove loading screen when React is fully mounted and ready
    const timer = setTimeout(() => {
      handleRemoveLoading()
    }, 500) // Small delay to ensure everything is rendered

    // Also listen for main process signal
    if (window.electronAPI?.on) {
      window.electronAPI.on('remove-loading', handleRemoveLoading)
    }

    return () => {
      clearTimeout(timer)
      if (window.electronAPI?.off) {
        window.electronAPI.off('remove-loading', handleRemoveLoading)
      }
    }
  }, [])

  return null // This component doesn't render anything
}