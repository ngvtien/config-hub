import { useState, useEffect } from 'react'

export function useHandlersReady() {
  const [handlersReady, setHandlersReady] = useState(false)

  useEffect(() => {
    const checkHandlers = async () => {
      let attempts = 0
      const maxAttempts = 20 // 4 seconds max wait
      
      while (attempts < maxAttempts) {
        try {
          // Test if handlers are ready by trying a simple call
          await window.electronAPI.user.getCurrentUser()
          setHandlersReady(true)
          return
        } catch (error: any) {
          if (error.message?.includes('No handler registered')) {
            attempts++
            await new Promise(resolve => setTimeout(resolve, 200))
            continue
          }
          // Other errors mean handlers are ready but failed for different reasons
          setHandlersReady(true)
          return
        }
      }
      
      // If we get here, assume handlers are ready (fallback)
      setHandlersReady(true)
    }

    checkHandlers()
  }, [])

  return handlersReady
}