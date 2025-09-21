import { useState, useEffect } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import { 
  HelpCircle, 
  Keyboard, 
  ZoomIn, 
  Type, 
  PanelLeftClose,
  Settings,
  ExternalLink,
  BookOpen,
  Lightbulb
} from 'lucide-react'

interface HelpCommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (section: string) => void
}

export function HelpCommandPalette({ open, onOpenChange, onNavigate }: HelpCommandPaletteProps) {
  const [search, setSearch] = useState('')

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  const handleSelect = (section: string) => {
    onOpenChange(false)
    onNavigate(section)
  }

  // Simple search filter
  const allItems = [
    { id: 'overview', title: 'App Overview', category: 'Getting Started', icon: BookOpen },
    { id: 'quick-start', title: 'Quick Start Guide', category: 'Getting Started', icon: Lightbulb },
    { id: 'zoom', title: 'Zoom Controls', category: 'Features', icon: ZoomIn, shortcut: 'Ctrl+Plus/Minus' },
    { id: 'sidebar', title: 'Sidebar Management', category: 'Features', icon: PanelLeftClose },
    { id: 'typography', title: 'Typography System', category: 'Features', icon: Type },
    { id: 'shortcuts', title: 'All Shortcuts', category: 'Keyboard Shortcuts', icon: Keyboard, shortcut: '?' },
    { id: 'zoom-shortcuts', title: 'Zoom Shortcuts', category: 'Keyboard Shortcuts', icon: ZoomIn, shortcut: 'Ctrl+0/+/-' },
    { id: 'preferences', title: 'App Preferences', category: 'Settings & Preferences', icon: Settings },
    { id: 'persistence', title: 'Data Persistence', category: 'Settings & Preferences', icon: HelpCircle },
  ]

  const filteredItems = allItems.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  )

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof allItems>)

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search help topics..." 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <CommandList>
        {filteredItems.length === 0 ? (
          <CommandEmpty>No help topics found.</CommandEmpty>
        ) : (
          <>
            {Object.entries(groupedItems).map(([category, items]) => (
              <CommandGroup key={category} heading={category}>
                {items.map((item) => {
                  const Icon = item.icon
                  return (
                    <CommandItem key={item.id} onSelect={() => handleSelect(item.id)}>
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                      {item.shortcut && (
                        <CommandShortcut>{item.shortcut}</CommandShortcut>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
            
            <CommandGroup heading="External Resources">
              <CommandItem onSelect={() => window.open('https://electronjs.org/docs')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                <span>Electron Documentation</span>
              </CommandItem>
              <CommandItem onSelect={() => window.open('https://ui.shadcn.com')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                <span>shadcn/ui Components</span>
              </CommandItem>
              <CommandItem onSelect={() => window.open('https://fonts.google.com/specimen/Inter')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                <span>Inter Font Family</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}