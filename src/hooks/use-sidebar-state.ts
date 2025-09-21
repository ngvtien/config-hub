import { useState, useEffect } from 'react'

export function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load initial sidebar state
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getSidebarState().then((collapsed) => {
        setIsCollapsed(collapsed)
        setIsLoaded(true)
      })
    } else {
      // If not in Electron, load from localStorage as fallback
      const saved = localStorage.getItem('sidebar-collapsed')
      setIsCollapsed(saved === 'true')
      setIsLoaded(true)
    }
  }, [])

  const toggleCollapse = async () => {
    const newCollapsedState = !isCollapsed
    setIsCollapsed(newCollapsedState)
    
    // Persist the state
    if (window.electronAPI) {
      await window.electronAPI.setSidebarState(newCollapsedState)
    } else {
      // Fallback to localStorage if not in Electron
      localStorage.setItem('sidebar-collapsed', newCollapsedState.toString())
    }
  }

  const setCollapsed = async (collapsed: boolean) => {
    setIsCollapsed(collapsed)
    
    // Persist the state
    if (window.electronAPI) {
      await window.electronAPI.setSidebarState(collapsed)
    } else {
      // Fallback to localStorage if not in Electron
      localStorage.setItem('sidebar-collapsed', collapsed.toString())
    }
  }

  return {
    isCollapsed,
    isLoaded,
    toggleCollapse,
    setCollapsed
  }
}