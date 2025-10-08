import React, { createContext, useContext, useState, useEffect } from 'react'

export type Environment = 'local' | 'dev' | 'sit' | 'uat' | 'prod'
export type Instance = 0 | 1 | 2 | 3

export interface EnvironmentContextType {
  environment: Environment
  instance: Instance
  setEnvironment: (env: Environment) => void
  setInstance: (instance: Instance) => void
  getContextKey: () => string
  isUatEnvironment: () => boolean
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined)

interface EnvironmentProviderProps {
  children: React.ReactNode
}

export function EnvironmentProvider({ children }: EnvironmentProviderProps) {
  const [environment, setEnvironment] = useState<Environment>('dev')
  const [instance, setInstance] = useState<Instance>(0)

  // Load from localStorage on mount
  useEffect(() => {
    const savedEnv = localStorage.getItem('app-environment') as Environment
    const savedInstance = localStorage.getItem('app-instance')
    
    if (savedEnv && ['local', 'dev', 'sit', 'uat', 'prod'].includes(savedEnv)) {
      setEnvironment(savedEnv)
    }
    
    if (savedInstance && ['0', '1', '2', '3'].includes(savedInstance)) {
      setInstance(parseInt(savedInstance) as Instance)
    }
  }, [])

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('app-environment', environment)
    localStorage.setItem('app-instance', instance.toString())
  }, [environment, instance])

  const handleSetEnvironment = (env: Environment) => {
    setEnvironment(env)
    // Reset instance to 0 when switching environments
    if (env !== 'uat') {
      setInstance(0)
    }
  }

  const handleSetInstance = (newInstance: Instance) => {
    setInstance(newInstance)
  }

  const getContextKey = () => {
    if (environment === 'uat') {
      return `${environment}-${instance}`
    }
    return environment
  }

  const isUatEnvironment = () => environment === 'uat'

  const value: EnvironmentContextType = {
    environment,
    instance,
    setEnvironment: handleSetEnvironment,
    setInstance: handleSetInstance,
    getContextKey,
    isUatEnvironment
  }

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  )
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext)
  if (context === undefined) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider')
  }
  return context
}