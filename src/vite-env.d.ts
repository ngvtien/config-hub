/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    // Theme management
    getTheme: () => Promise<'system' | 'light' | 'dark'>
    setTheme: (theme: 'system' | 'light' | 'dark') => Promise<'system' | 'light' | 'dark'>
    getShouldUseDarkColors: () => Promise<boolean>
    onThemeUpdated: (callback: (isDark: boolean) => void) => void
    
    // Zoom management
    getZoomLevel: () => Promise<number>
    setZoomLevel: (zoomLevel: number) => Promise<number>
    zoomIn: () => Promise<number>
    zoomOut: () => Promise<number>
    zoomReset: () => Promise<number>
    
    // Sidebar state management
    getSidebarState: () => Promise<boolean>
    setSidebarState: (isCollapsed: boolean) => Promise<boolean>
    
    // General IPC
    on: (channel: string, listener: (...args: any[]) => void) => void
    off: (channel: string, listener: (...args: any[]) => void) => void
    send: (channel: string, ...args: any[]) => void
    invoke: (channel: string, ...args: any[]) => any
  }
}