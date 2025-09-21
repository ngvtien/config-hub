import { useState, useEffect } from 'react'
import { useEnvironment } from '@/contexts/environment-context'

export interface EnvironmentSettings {
  general: {
    appName: string
    theme: string
    autoSave: boolean
    notifications: boolean
  }
  git: {
    defaultBranch: string
    autoFetch: boolean
    repositories: Array<{
      name: string
      url: string
      status: 'connected' | 'disconnected'
    }>
  }
  argocd: {
    serverUrl: string
    username: string
    token: string
    namespace: string
    syncPolicy: string
  }
  helm: {
    registryUrl: string
    username: string
    password: string
    defaultNamespace: string
    repositories: Array<{
      name: string
      url: string
      status: 'connected' | 'disconnected'
    }>
  }
}

const defaultSettings: EnvironmentSettings = {
  general: {
    appName: 'My App',
    theme: 'system',
    autoSave: true,
    notifications: true
  },
  git: {
    defaultBranch: 'main',
    autoFetch: true,
    repositories: []
  },
  argocd: {
    serverUrl: '',
    username: '',
    token: '',
    namespace: 'argocd',
    syncPolicy: 'manual'
  },
  helm: {
    registryUrl: '',
    username: '',
    password: '',
    defaultNamespace: 'default',
    repositories: []
  }
}

export function useEnvironmentSettings() {
  const { getContextKey } = useEnvironment()
  const [settings, setSettings] = useState<EnvironmentSettings>(defaultSettings)

  // Load settings for current environment context
  useEffect(() => {
    const contextKey = getContextKey()
    const savedSettings = localStorage.getItem(`settings-${contextKey}`)
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      } catch (error) {
        console.error('Failed to parse saved settings:', error)
        setSettings(defaultSettings)
      }
    } else {
      setSettings(defaultSettings)
    }
  }, [getContextKey])

  // Save settings when they change
  const saveSettings = (newSettings: EnvironmentSettings) => {
    const contextKey = getContextKey()
    localStorage.setItem(`settings-${contextKey}`, JSON.stringify(newSettings))
    setSettings(newSettings)
  }

  // Update specific section
  const updateSection = <K extends keyof EnvironmentSettings>(
    section: K,
    updates: Partial<EnvironmentSettings[K]>
  ) => {
    const newSettings = {
      ...settings,
      [section]: { ...settings[section], ...updates }
    }
    saveSettings(newSettings)
  }

  return {
    settings,
    saveSettings,
    updateSection
  }
}