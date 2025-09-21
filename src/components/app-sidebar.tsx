import { Button } from '@/components/ui/button'
import { useSidebarState } from '@/hooks/use-sidebar-state'
import { 
  Home, 
  Settings, 
  Users, 
  FileText, 
  BarChart3, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppSidebarProps {
  className?: string
  currentPage?: string
  onNavigate?: (page: string) => void
}

const menuItems = [
  { icon: Home, label: 'Dashboard', page: 'dashboard' },
  { icon: Users, label: 'Users', page: 'users' },
  { icon: FileText, label: 'Documents', page: 'documents' },
  { icon: BarChart3, label: 'Analytics', page: 'analytics' },
  { icon: Settings, label: 'Settings', page: 'settings' },
]

export function AppSidebar({ className, currentPage = 'dashboard', onNavigate }: AppSidebarProps) {
  const { isCollapsed, toggleCollapse } = useSidebarState()

  return (
    <div 
      className={cn(
        "relative flex flex-col h-full bg-background border-r transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold">My App</h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className="ml-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.page
            
            return (
              <li key={item.label}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isCollapsed ? "px-2" : "px-3"
                  )}
                  onClick={() => onNavigate?.(item.page)}
                >
                  <Icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-2 border-t">
        <div className={cn(
          "flex items-center",
          isCollapsed ? "justify-center" : "px-2"
        )}>
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-medium">
              U
            </span>
          </div>
          {!isCollapsed && (
            <div className="ml-2 flex-1 min-w-0">
              <p className="text-sm font-medium truncate">User Name</p>
              <p className="text-xs text-muted-foreground truncate">user@example.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}