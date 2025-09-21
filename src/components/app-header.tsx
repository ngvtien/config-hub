import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ZoomControls } from '@/components/zoom-controls'
import { HelpButton } from '@/components/help/help-button'
import { EnvironmentSelector } from '@/components/environment-selector'
import { Bell, Search, Menu } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface AppHeaderProps {
  title?: string
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export function AppHeader({ 
  title = "Dashboard", 
  onMenuClick,
  showMenuButton = false 
}: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-background border-b">
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back! Here's what's happening today.
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <EnvironmentSelector />
        <Separator orientation="vertical" className="h-6" />
        <Button variant="ghost" size="sm">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Bell className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <ZoomControls />
        <Separator orientation="vertical" className="h-6" />
        <HelpButton />
        <ThemeToggle />
      </div>
    </header>
  )
}