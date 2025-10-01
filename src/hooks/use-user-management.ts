import { useState, useEffect } from 'react'
import { SystemUser } from '@/types/user'

export function useUserManagement() {
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null)
  const [availableUsers, setAvailableUsers] = useState<SystemUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load current user on mount
  useEffect(() => {
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const user = await window.electronAPI.user.getCurrentUser()
      setCurrentUser(user)
      
      // Also try to load available users (may fail without admin privileges)
      try {
        const users = await window.electronAPI.user.getAvailableUsers()
        setAvailableUsers(users)
      } catch (userListError) {
        console.warn('Could not load available users:', userListError)
        setAvailableUsers([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user information')
      console.error('Failed to load current user:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const switchUser = async (username: string, password?: string): Promise<boolean> => {
    try {
      setError(null)
      const success = await window.electronAPI.user.switchUser(username, password)
      
      if (success) {
        // Reload user information after successful switch
        await loadCurrentUser()
      }
      
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch user')
      console.error('Failed to switch user:', err)
      return false
    }
  }

  const checkIsAdmin = async (): Promise<boolean> => {
    try {
      return await window.electronAPI.user.isAdmin()
    } catch (err) {
      console.error('Failed to check admin status:', err)
      return false
    }
  }

  return {
    currentUser,
    availableUsers,
    isLoading,
    error,
    switchUser,
    checkIsAdmin,
    refreshUserInfo: loadCurrentUser
  }
}