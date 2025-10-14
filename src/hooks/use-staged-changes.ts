import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StagedFile {
  path: string
  name: string
  content: string
  originalContent: string
  repoUrl: string
  branch: string
  credentialId: string
  stagedAt: number
}

interface StagedChangesState {
  stagedFiles: StagedFile[]
  stageFile: (file: StagedFile) => void
  unstageFile: (path: string) => void
  clearStaged: () => void
  getStagedForRepo: (repoUrl: string) => StagedFile[]
  hasStagedChanges: (repoUrl: string) => boolean
}

export const useStagedChanges = create<StagedChangesState>()(
  persist(
    (set, get) => ({
      stagedFiles: [],

      stageFile: (file) => {
        set((state) => {
          // Remove existing file with same path if it exists
          const filtered = state.stagedFiles.filter(f => f.path !== file.path)
          return {
            stagedFiles: [...filtered, { ...file, stagedAt: Date.now() }]
          }
        })
      },

      unstageFile: (path) => {
        set((state) => ({
          stagedFiles: state.stagedFiles.filter(f => f.path !== path)
        }))
      },

      clearStaged: () => {
        set({ stagedFiles: [] })
      },

      getStagedForRepo: (repoUrl) => {
        return get().stagedFiles.filter(f => f.repoUrl === repoUrl)
      },

      hasStagedChanges: (repoUrl) => {
        return get().stagedFiles.some(f => f.repoUrl === repoUrl)
      }
    }),
    {
      name: 'staged-changes-storage',
    }
  )
)
