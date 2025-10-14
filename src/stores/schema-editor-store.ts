import { create } from 'zustand'

interface SchemaEditorState {
  // Pre-staged changes (before diff review)
  prestagedChanges: { [filePath: string]: any }
  
  // View mode state per file
  viewMode: { [filePath: string]: 'form' | 'code' }
  
  // Actions
  setPrestagedChanges: (filePath: string, schema: any) => void
  getPrestagedChanges: (filePath: string) => any | null
  clearPrestagedChanges: (filePath: string) => void
  hasPrestagedChanges: (filePath: string) => boolean
  
  setViewMode: (filePath: string, mode: 'form' | 'code') => void
  getViewMode: (filePath: string) => 'form' | 'code'
}

export const useSchemaEditorStore = create<SchemaEditorState>((set, get) => ({
  prestagedChanges: {},
  viewMode: {},
  
  setPrestagedChanges: (filePath: string, schema: any) => {
    console.log('Store: Setting pre-staged changes for', filePath, schema)
    set((state) => ({
      prestagedChanges: { ...state.prestagedChanges, [filePath]: schema }
    }))
  },
  
  getPrestagedChanges: (filePath: string) => {
    const changes = get().prestagedChanges[filePath] || null
    console.log('Store: Getting pre-staged changes for', filePath, changes)
    return changes
  },
  
  clearPrestagedChanges: (filePath: string) => {
    set((state) => {
      const newPrestagedChanges = { ...state.prestagedChanges }
      delete newPrestagedChanges[filePath]
      return { prestagedChanges: newPrestagedChanges }
    })
  },
  
  hasPrestagedChanges: (filePath: string) => {
    return get().prestagedChanges[filePath] !== undefined
  },
  
  setViewMode: (filePath: string, mode: 'form' | 'code') => {
    set((state) => ({
      viewMode: { ...state.viewMode, [filePath]: mode }
    }))
  },
  
  getViewMode: (filePath: string) => {
    return get().viewMode[filePath] || 'code'
  }
}))