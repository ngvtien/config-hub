import { useState, useCallback } from 'react'
import { ConfirmDialog as ConfirmDialogComponent } from '@/components/confirm-dialog'

interface ConfirmState {
  isOpen: boolean
  title: string
  description: string
  variant?: 'default' | 'destructive'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
}

export const useDialog = () => {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    description: ''
  })

  const showConfirm = useCallback(({
    title,
    description,
    variant = 'default',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm
  }: {
    title: string
    description: string
    variant?: 'default' | 'destructive'
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
  }) => {
    setConfirmState({
      isOpen: true,
      title,
      description,
      variant,
      confirmText,
      cancelText,
      onConfirm
    })
  }, [])

  const closeConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, isOpen: false }))
  }, [])

  const handleConfirm = useCallback(() => {
    if (confirmState.onConfirm) {
      confirmState.onConfirm()
    }
    closeConfirm()
  }, [confirmState.onConfirm, closeConfirm])

  const ConfirmDialog = useCallback(() => (
    <ConfirmDialogComponent
      open={confirmState.isOpen}
      onOpenChange={closeConfirm}
      title={confirmState.title}
      description={confirmState.description}
      variant={confirmState.variant}
      confirmText={confirmState.confirmText}
      cancelText={confirmState.cancelText}
      onConfirm={handleConfirm}
    />
  ), [confirmState, handleConfirm, closeConfirm])

  return {
    showConfirm,
    closeConfirm,
    ConfirmDialog
  }
}
