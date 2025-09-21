/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    // Theme management
    getTheme: () => Promise<'system' | 'light' | 'dark'>
    setTheme: (theme: 'system' | 'light' | 'dark') => Promise<'system' | 'light' | 'dark'>
    getShouldUseDarkColors: () => Promise<boolean>
    onThemeUpdated: (callback: (isDark: boolean) => void) => void
    
    // General IPC
    on: (channel: string, listener: (...args: any[]) => void) => void
    off: (channel: string, listener: (...args: any[]) => void) => void
    send: (channel: string, ...args: any[]) => void
    invoke: (channel: string, ...args: any[]) => any
  }
}