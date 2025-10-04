import { useEffect } from 'react'

export function useZoomShortcuts() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're in Electron
      if (!window.electronAPI) return
      
      // Check for Ctrl/Cmd key combinations
      const isCtrlOrCmd = event.ctrlKey || event.metaKey
      
      if (!isCtrlOrCmd) return
      
      switch (event.key) {
        case '+':
        case '=': // Handle both + and = keys (= is + without shift)
          event.preventDefault()
          window.electronAPI.zoomIn().then((newZoom) => {
            // Dispatch custom event to notify components
            window.dispatchEvent(new CustomEvent('zoom-changed', { detail: { zoomLevel: newZoom } }))
          })
          break
        case '-':
          event.preventDefault()
          window.electronAPI.zoomOut().then((newZoom) => {
            // Dispatch custom event to notify components
            window.dispatchEvent(new CustomEvent('zoom-changed', { detail: { zoomLevel: newZoom } }))
          })
          break
        case '0':
          event.preventDefault()
          window.electronAPI.zoomReset().then((newZoom) => {
            // Dispatch custom event to notify components
            window.dispatchEvent(new CustomEvent('zoom-changed', { detail: { zoomLevel: newZoom } }))
          })
          break
      }
    }

    const handleWheel = (event: WheelEvent) => {
      // Check if we're in Electron
      if (!window.electronAPI) return
      
      // Check for Ctrl/Cmd key combinations
      const isCtrlOrCmd = event.ctrlKey || event.metaKey
      
      if (!isCtrlOrCmd) return
      
      // Prevent default browser zoom behavior
      event.preventDefault()
      
      // Determine zoom direction based on wheel delta
      // Positive deltaY means scrolling down (zoom out)
      // Negative deltaY means scrolling up (zoom in)
      if (event.deltaY < 0) {
        // Scrolling up - zoom in
        window.electronAPI.zoomIn().then((newZoom) => {
          // Dispatch custom event to notify components
          window.dispatchEvent(new CustomEvent('zoom-changed', { detail: { zoomLevel: newZoom } }))
        })
      } else if (event.deltaY > 0) {
        // Scrolling down - zoom out
        window.electronAPI.zoomOut().then((newZoom) => {
          // Dispatch custom event to notify components
          window.dispatchEvent(new CustomEvent('zoom-changed', { detail: { zoomLevel: newZoom } }))
        })
      }
    }

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('wheel', handleWheel, { passive: false })
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('wheel', handleWheel)
    }
  }, [])
}