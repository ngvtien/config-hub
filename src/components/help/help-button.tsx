import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { HelpCommandPalette } from './help-command-palette'
import { HelpDialog } from './help-dialog'
import { HelpCircle } from 'lucide-react'

export function HelpButton() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [helpDialogOpen, setHelpDialogOpen] = useState(false)
  const [currentSection, setCurrentSection] = useState('overview')

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K for command palette
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      
      // F1 for help dialog
      if (e.key === 'F1') {
        e.preventDefault()
        setHelpDialogOpen(true)
      }
      
      // ? for shortcuts (when not in input)
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        setCurrentSection('shortcuts')
        setHelpDialogOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleNavigate = (section: string) => {
    setCurrentSection(section)
    setHelpDialogOpen(true)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCommandPaletteOpen(true)}
        title="Help & Support (Ctrl+K)"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      <HelpCommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNavigate={handleNavigate}
      />

      <HelpDialog
        open={helpDialogOpen}
        onOpenChange={setHelpDialogOpen}
        initialSection={currentSection}
      />
    </>
  )
}