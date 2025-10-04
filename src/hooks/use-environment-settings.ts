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
    credentialId?: string
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
    password: string
    namespace: string
    syncPolicy: string
    refreshInterval: number
    credentialId?: string
    credentialName?: string
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
  vault: {
    serverUrl: string
    authMethod: 'token' | 'userpass' | 'ldap' | 'kubernetes' | 'aws' | 'azure'
    token: string
    username: string
    password: string
    namespace: string
    mountPath: string
    roleId: string
    secretId: string
    kubernetesRole: string
    awsRole: string
    azureRole: string
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
    password: '',
    namespace: 'argocd',
    syncPolicy: 'manual',
    refreshInterval: 30,
    credentialId: undefined,
    credentialName: undefined
  },
  helm: {
    registryUrl: '',
    username: '',
    password: '',
    defaultNamespace: 'default',
    repositories: []
  },
  vault: {
    serverUrl: '',
    authMethod: 'token',
    token: '',
    username: '',
    password: '',
    namespace: '',
    mountPath: 'secret',
    roleId: '',
    secretId: '',
    kubernetesRole: '',
    awsRole: '',
    azureRole: ''
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